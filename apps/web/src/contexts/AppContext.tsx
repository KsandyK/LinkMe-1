/**
 * CRAVR — App Context
 * Velvet Dark Design System
 * Global state: age gate, age verification, credits, unlocked content, auth.
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { toast } from "sonner";
import { MEMBERSHIP_DISCOUNTS } from "@/lib/membership-tiers";
import { credits as creditsApi, boosts as boostsApi, content as contentApi, setAccessToken, setRefreshToken } from "@/lib/api";

// Use VITE_API_URL if set, otherwise same-origin (Vite proxy handles /api → localhost:3000)
const API_BASE: string = (import.meta as any).env?.VITE_API_URL || "";

type AgeVerificationStatus = "unverified" | "pending" | "verified";

export interface LocalTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
  status: "COMPLETED";
}

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface AppContextType {
  // Age Gate
  ageGateAccepted: boolean;
  setAgeGateAccepted: (v: boolean) => void;

  // Age Verification
  ageVerificationStatus: AgeVerificationStatus;
  setAgeVerificationStatus: (v: AgeVerificationStatus) => void;

  // Credits
  credits: number;
  addCredits: (amount: number, reason?: string) => void;
  spendCredits: (amount: number, reason?: string) => boolean;

  // Unlocked content
  unlockedContent: Set<string>;
  unlockContent: (contentId: string, cost: number, mediaUrl?: string, recipientId?: string, contentType?: "PHOTO" | "VIDEO" | "STREAM" | "PRIVATE_MESSAGE") => boolean;
  isUnlocked: (contentId: string) => boolean;
  getMediaUrl: (contentId: string) => string | undefined;

  // Toast
  showToast: (opts: ToastOptions) => void;

  // Membership
  activeMembership: string;
  setActiveMembership: (plan: string) => void;
  membershipDiscount: number; // e.g. 0.05 for 5% off

  // Active boost package (spark | flame | inferno | legend | null)
  activeBoost: string | null;
  setActiveBoost: (pkg: string | null) => void;

  // Transaction log
  transactions: LocalTransaction[];
  recordPurchase: (dollarAmount: number, description: string) => void;

  // Auth
  user: { id: string; username: string; role: string } | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithTokenData: (data: { accessToken: string; refreshToken: string; user: any }) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

// MEMBERSHIP_DISCOUNTS imported from @/lib/membership-tiers — single source of truth

const STORAGE_KEYS = {
  AGE_GATE: "vl_age_gate_v1",
  AGE_VERIFY: "vl_age_verify_v1",
  CREDITS: "vl_credits_v1",
  UNLOCKED: "vl_unlocked_v1",
  MEMBERSHIP: "vl_membership_v1",
  BOOST: "vl_active_boost_v1",
  TRANSACTIONS: "vl_transactions_v1",
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    if (val === null) return fallback;
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage not available
  }
}

function makeTx(amount: number, type: string, description: string): LocalTransaction {
  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    amount,
    type,
    description: description || (amount > 0 ? "Credits added" : "Credits spent"),
    createdAt: new Date().toISOString(),
    status: "COMPLETED",
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ageGateAccepted, setAgeGateAcceptedState] = useState<boolean>(() =>
    safeGet(STORAGE_KEYS.AGE_GATE, false)
  );
  const [ageVerificationStatus, setAgeVerificationStatusState] = useState<AgeVerificationStatus>(() =>
    safeGet(STORAGE_KEYS.AGE_VERIFY, "unverified")
  );
  const [credits, setCredits] = useState<number>(() =>
    safeGet(STORAGE_KEYS.CREDITS, 0)   // real balance comes from the server after auth; never default to free credits
  );
  const [unlockedContent, setUnlockedContent] = useState<Set<string>>(() => {
    const arr = safeGet<string[]>(STORAGE_KEYS.UNLOCKED, []);
    return new Set(arr);
  });
  const [unlockedMediaUrls, setUnlockedMediaUrls] = useState<Record<string, string>>({});
  const [transactions, setTransactions] = useState<LocalTransaction[]>(() =>
    safeGet<LocalTransaction[]>(STORAGE_KEYS.TRANSACTIONS, [])
  );

  function pushTx(amount: number, type: string, description: string) {
    setTransactions(prev => {
      const next = [makeTx(amount, type, description), ...prev].slice(0, 100);
      safeSet(STORAGE_KEYS.TRANSACTIONS, next);
      return next;
    });
  }

  // Membership
  const [activeMembership, setActiveMembershipState] = useState<string>(() =>
    safeGet(STORAGE_KEYS.MEMBERSHIP, "free")
  );
  const setActiveMembership = (plan: string) => {
    setActiveMembershipState(plan);
    safeSet(STORAGE_KEYS.MEMBERSHIP, plan);
    // Server-activate (fire and forget — local state is source of truth when API is offline)
    if (plan !== "free") {
      boostsApi.subscribe(plan).catch(() => {/* API offline — local-only */});
    }
  };
  const membershipDiscount = MEMBERSHIP_DISCOUNTS[activeMembership] ?? 0;

  // Active boost
  const [activeBoost, setActiveBoostState] = useState<string | null>(() =>
    safeGet<string | null>(STORAGE_KEYS.BOOST, null)
  );
  const setActiveBoost = (pkg: string | null) => {
    setActiveBoostState(pkg);
    safeSet(STORAGE_KEYS.BOOST, pkg);
    // Server-activate (fire and forget)
    if (pkg) {
      boostsApi.subscribe(pkg).catch(() => {/* API offline — local-only */});
    }
  };

  // Auth
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("cravr_token"));
  const [user, setUser] = useState<{ id: string; username: string; role: string } | null>(() => {
    try { return JSON.parse(localStorage.getItem("cravr_user") ?? "null"); } catch { return null; }
  });
  const syncedRef = useRef(false);

  const setAgeGateAccepted = (v: boolean) => {
    setAgeGateAcceptedState(v);
    safeSet(STORAGE_KEYS.AGE_GATE, v);
  };

  const setAgeVerificationStatus = (v: AgeVerificationStatus) => {
    setAgeVerificationStatusState(v);
    safeSet(STORAGE_KEYS.AGE_VERIFY, v);
  };

  const addCredits = (amount: number, reason?: string) => {
    setCredits(prev => {
      const next = prev + amount;
      safeSet(STORAGE_KEYS.CREDITS, next);
      return next;
    });
    pushTx(amount, "CREDIT_ADDED", reason ?? "Credits added");
    toast.success(`+${amount.toLocaleString()} credits added`, { description: reason });
  };

  const spendCredits = (amount: number, reason?: string): boolean => {
    // Auth guard — anonymous visitors cannot spend credits. All paid actions
    // (unlock, tip, gift, chat, message) flow through here, so this is the
    // single chokepoint that blocks engagement until the user signs in.
    if (!token || !user) {
      toast.error("Sign in to continue", { description: "Create a free account or sign in to unlock content, tip, and message creators." });
      return false;
    }
    if (credits < amount) {
      toast.error("Insufficient credits", { description: `You need ${amount} credits. Buy more in the Credits Store.` });
      return false;
    }
    // 1. Optimistic deduction — instant UI feedback
    setCredits(prev => {
      const next = prev - amount;
      safeSet(STORAGE_KEYS.CREDITS, next);
      return next;
    });
    pushTx(-amount, "CREDIT_SPENT", reason ?? "Credits spent");
    toast.success(`Spent ${amount} credits`, { description: reason });

    // 2. Server-persist (fire and forget; roll back on failure)
    creditsApi.spend(amount, reason ?? "Credits spent")
      .then(({ balance }) => {
        // Sync with server-confirmed balance
        setCredits(balance);
        safeSet(STORAGE_KEYS.CREDITS, balance);
      })
      .catch(() => {
        // API offline / error — local deduction stands (demo mode)
        // No rollback: the offline spend is already reflected in localStorage
      });

    return true;
  };

  const unlockContent = (
    contentId: string,
    cost: number,
    mediaUrl?: string,
    recipientId?: string,
    contentType?: "PHOTO" | "VIDEO" | "STREAM" | "PRIVATE_MESSAGE",
  ): boolean => {
    if (isUnlocked(contentId)) {
      toast.info("Already unlocked", { description: "You already have access to this content." });
      return true;
    }

    // Optimistic local deduction
    const success = spendCredits(cost, `Unlocked content`);
    if (!success) return false;

    // Mark unlocked locally
    setUnlockedContent(prev => {
      const next = new Set(prev);
      next.add(contentId);
      safeSet(STORAGE_KEYS.UNLOCKED, Array.from(next));
      return next;
    });
    if (mediaUrl) {
      setUnlockedMediaUrls(prev => ({ ...prev, [contentId]: mediaUrl }));
    }

    // If we know the creator, use the dedicated endpoint so earnings are tracked
    if (recipientId) {
      contentApi.unlock({
        contentId,
        creatorUserId: recipientId,
        creditCost: cost,
        contentType: contentType ?? "PHOTO",
      })
        .then(({ buyerBalance }) => {
          // Sync server-confirmed balance
          setCredits(buyerBalance);
          safeSet(STORAGE_KEYS.CREDITS, buyerBalance);
        })
        .catch(() => {
          // API offline — local deduction already applied, earnings will be
          // reconciled when DB is back (acceptable in demo mode)
        });
    }

    return true;
  };

  const isUnlocked = (contentId: string): boolean => unlockedContent.has(contentId);

  const getMediaUrl = (contentId: string): string | undefined => unlockedMediaUrls[contentId];

  // ── Auth effects ────────────────────────────────────────────────────────────
  // On mount, verify persisted token with the backend (3s timeout — demo sessions
  // skip this entirely via syncedRef.current = true set during login).
  useEffect(() => {
    if (!token || syncedRef.current) return;
    syncedRef.current = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        clearTimeout(timer);
        // /api/auth/me returns the user object directly (not wrapped)
        if (data?.id) {
          const u = { id: data.id, username: data.username, role: data.role };
          setUser(u);
          localStorage.setItem("cravr_user", JSON.stringify(u));
          if (typeof data.credits === "number") {
            setCredits(data.credits);
            safeSet(STORAGE_KEYS.CREDITS, data.credits);
          }
        }
      })
      .catch(() => { clearTimeout(timer); });
  }, [token]);

  // ── Boost/membership server sync on login ───────────────────────────────────
  // After the token is confirmed, pull the active boost from the backend so the
  // UI reflects server-side state even after the user refreshes or logs in on a
  // new device.
  useEffect(() => {
    if (!token) return;
    boostsApi.active()
      .then(data => {
        if (!data) return;
        const d = data as any;
        // Backend returns { packageId, type } or similar — adapt as backend shape solidifies
        const packageId: string | null = d?.packageId ?? d?.tierId ?? d?.id ?? null;
        const type: string = d?.type ?? "boost";
        if (!packageId) return;
        if (type === "membership") {
          setActiveMembershipState(packageId);
          safeSet(STORAGE_KEYS.MEMBERSHIP, packageId);
        } else {
          setActiveBoostState(packageId);
          safeSet(STORAGE_KEYS.BOOST, packageId);
        }
      })
      .catch(() => {/* API offline — keep local state */});
  }, [token]);

  // ── Age verification status sync ─────────────────────────────────────────────
  // Sync age verification status from the server on login.
  // Critical for CCBill flow: user pays → CCBill webhook auto-verifies DB →
  // user returns to site → this effect picks up VERIFIED and updates localStorage.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    fetch(`${API_BASE}/api/age-verify/status`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        clearTimeout(timer);
        if (!data?.status) return;
        // Map API status → local status
        const s = data.status as string;
        const mapped: AgeVerificationStatus =
          s === "VERIFIED"     ? "verified" :
          s === "UNDER_REVIEW" ? "pending"  :
          s === "PENDING"      ? "pending"  : "unverified";
        setAgeVerificationStatusState(mapped);
        safeSet(STORAGE_KEYS.AGE_VERIFY, mapped);
      })
      .catch(() => { clearTimeout(timer); /* API offline — keep local state */ });
  }, [token]);

  // ── Unlocked-content sync ────────────────────────────────────────────────────
  // The server is authoritative for which content this user has unlocked. Load
  // it on auth so unlocks are per-user (we clear local state on login/logout).
  useEffect(() => {
    if (!token) return;
    contentApi.unlocked()
      .then(items => {
        if (!Array.isArray(items)) return;
        const ids = items.map(i => i.contentId);
        setUnlockedContent(new Set(ids));
        safeSet(STORAGE_KEYS.UNLOCKED, ids);
      })
      .catch(() => {/* API offline — keep local state */});
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
    // Track whether the API was reachable but rejected the credentials.
    // On API rejection (401) we re-throw so callers can show an error.
    // On network/timeout failure we fall through to demo mode instead.
    let apiRejected = false;
    try {
      // Race the API call against a 4-second timeout so a hung Vite proxy
      // doesn't block indefinitely — falls through to demo mode on timeout.
      const timeout = new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("timeout")), 4000)
      );
      const res = await Promise.race([
        fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
          credentials: "include",
        }),
        timeout,
      ]);
      if (!res.ok) {
        apiRejected = true;
        const err = await res.json().catch(() => ({ error: "Invalid credentials" }));
        throw new Error(err.error ?? "Invalid credentials");
      }
      const data = await res.json();

      // TOTP challenge — throw with challengeToken so Login page can prompt for code
      if (data.totpRequired) {
        const err: any = new Error("TOTP_REQUIRED");
        err.totpRequired = true;
        err.challengeToken = data.challengeToken;
        throw err;
      }

      // Wipe any prior account's local state so this session starts from the
      // server's truth (no inherited credits/transactions/unlocks).
      clearLocalAccountState();
      // Persist both tokens — the refresh token enables silent re-auth
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken ?? null);
      setToken(data.accessToken);
      setUser(data.user);
      if (typeof data.user?.credits === "number") {
        setCredits(data.user.credits);
        safeSet(STORAGE_KEYS.CREDITS, data.user.credits);
      }
      localStorage.setItem("cravr_token", data.accessToken);
      localStorage.setItem("cravr_user", JSON.stringify(data.user));
      syncedRef.current = true;
    } catch (err: any) {
      if (err?.totpRequired) throw err;
      if (apiRejected) {
        throw new Error("Invalid credentials");
      }
      // Network error or timeout → API offline → demo mode
      const demoUser = { id: `demo-${username}`, username, role: "USER" };
      const demoToken = `demo-token-${Date.now()}`;
      setToken(demoToken);
      setUser(demoUser);
      localStorage.setItem("cravr_token", demoToken);
      localStorage.setItem("cravr_user", JSON.stringify(demoUser));
      syncedRef.current = true;
      toast.info("Demo mode active", { description: "API server offline — browsing locally. Start the backend for full functionality." });
    }
  }, []);

  const loginWithTokenData = useCallback((data: { accessToken: string; refreshToken: string; user: any }) => {
    clearLocalAccountState();
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken ?? null);
    setToken(data.accessToken);
    setUser(data.user);
    if (typeof data.user?.credits === "number") {
      setCredits(data.user.credits);
      safeSet(STORAGE_KEYS.CREDITS, data.user.credits);
    }
    localStorage.setItem("cravr_token", data.accessToken);
    localStorage.setItem("cravr_user", JSON.stringify(data.user));
    syncedRef.current = true;
  }, []);

  // Clears all per-account financial/session state so a different account in the
  // same browser never inherits the previous user's credits, transactions, or unlocks.
  const clearLocalAccountState = () => {
    [
      STORAGE_KEYS.CREDITS, STORAGE_KEYS.TRANSACTIONS, STORAGE_KEYS.UNLOCKED,
      STORAGE_KEYS.MEMBERSHIP, STORAGE_KEYS.BOOST, STORAGE_KEYS.AGE_VERIFY,
      "vl_favorites_v1", "vl_local_convs_v1",
    ].forEach(k => { try { localStorage.removeItem(k); } catch {} });
    setCredits(0);
    setTransactions([]);
    setUnlockedContent(new Set());
    setUnlockedMediaUrls({});
    setActiveMembershipState("free");
    setActiveBoostState(null);
    setAgeVerificationStatusState("unverified");
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("cravr_token");
    localStorage.removeItem("cravr_user");
    clearLocalAccountState();
    syncedRef.current = false;
    fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recordPurchase = (dollarAmount: number, description: string) => {
    // Records a real-money purchase as a transaction WITHOUT touching the credit balance
    pushTx(-dollarAmount, "PURCHASE", description);
  };

  const showToast = (opts: ToastOptions) => {
    if (opts.variant === "destructive") {
      toast.error(opts.title, { description: opts.description });
    } else {
      toast.success(opts.title, { description: opts.description });
    }
  };

  return (
    <AppContext.Provider value={{
      ageGateAccepted, setAgeGateAccepted,
      ageVerificationStatus, setAgeVerificationStatus,
      credits, addCredits, spendCredits,
      unlockedContent, unlockContent, isUnlocked, getMediaUrl,
      showToast,
      activeMembership, setActiveMembership, membershipDiscount,
      activeBoost, setActiveBoost,
      transactions, recordPurchase,
      user, token, isLoggedIn: !!token && !!user, login, loginWithTokenData, logout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
