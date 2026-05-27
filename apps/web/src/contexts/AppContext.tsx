/**
 * LINKME — App Context
 * Velvet Dark Design System
 * Global state: age gate, age verification, credits, unlocked content, auth.
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { toast } from "sonner";

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
  unlockContent: (contentId: string, cost: number, mediaUrl?: string) => boolean;
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

  // Auth
  user: { id: string; username: string; role: string } | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const MEMBERSHIP_DISCOUNTS: Record<string, number> = {
  free: 0, fan: 0, supporter: 0.05, superfan: 0.10, devotee: 0.12, allaccess: 0.15, elite: 0.18, creatorpass: 0.20, blackcard: 0.25,
  diamond: 0.25, obsidian: 0.25, platinum_m: 0.25,
};

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
    safeGet(STORAGE_KEYS.CREDITS, 250)
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
  };
  const membershipDiscount = MEMBERSHIP_DISCOUNTS[activeMembership] ?? 0;

  // Active boost
  const [activeBoost, setActiveBoostState] = useState<string | null>(() =>
    safeGet<string | null>(STORAGE_KEYS.BOOST, null)
  );
  const setActiveBoost = (pkg: string | null) => {
    setActiveBoostState(pkg);
    safeSet(STORAGE_KEYS.BOOST, pkg);
  };

  // Auth
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("linkme_token"));
  const [user, setUser] = useState<{ id: string; username: string; role: string } | null>(() => {
    try { return JSON.parse(localStorage.getItem("linkme_user") ?? "null"); } catch { return null; }
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
    if (credits < amount) {
      toast.error("Insufficient credits", { description: `You need ${amount} credits. Buy more in the Credits Store.` });
      return false;
    }
    setCredits(prev => {
      const next = prev - amount;
      safeSet(STORAGE_KEYS.CREDITS, next);
      return next;
    });
    pushTx(-amount, "CREDIT_SPENT", reason ?? "Credits spent");
    toast.success(`Spent ${amount} credits`, { description: reason });
    return true;
  };

  const unlockContent = (contentId: string, cost: number, mediaUrl?: string): boolean => {
    if (isUnlocked(contentId)) {
      toast.info("Already unlocked", { description: "You already have access to this content." });
      return true;
    }
    const success = spendCredits(cost, `Unlocked content`);
    if (success) {
      setUnlockedContent(prev => {
        const next = new Set(prev);
        next.add(contentId);
        safeSet(STORAGE_KEYS.UNLOCKED, Array.from(next));
        return next;
      });
      if (mediaUrl) {
        setUnlockedMediaUrls(prev => ({ ...prev, [contentId]: mediaUrl }));
      }
    }
    return success;
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
          localStorage.setItem("linkme_user", JSON.stringify(u));
          if (typeof data.credits === "number") {
            setCredits(data.credits);
            safeSet(STORAGE_KEYS.CREDITS, data.credits);
          }
        }
      })
      .catch(() => { clearTimeout(timer); });
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
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
        const err = await res.json().catch(() => ({ error: "Login failed" }));
        throw new Error(err.error ?? "Login failed");
      }
      const data = await res.json();
      setToken(data.accessToken);
      setUser(data.user);
      if (typeof data.user?.credits === "number") {
        setCredits(data.user.credits);
        safeSet(STORAGE_KEYS.CREDITS, data.user.credits);
      }
      localStorage.setItem("linkme_token", data.accessToken);
      localStorage.setItem("linkme_user", JSON.stringify(data.user));
      syncedRef.current = true;
    } catch {
      // Any error (network, HTTP 502/503, timeout) → API offline → demo mode
      const demoUser = { id: `demo-${username}`, username, role: "USER" };
      const demoToken = `demo-token-${Date.now()}`;
      setToken(demoToken);
      setUser(demoUser);
      localStorage.setItem("linkme_token", demoToken);
      localStorage.setItem("linkme_user", JSON.stringify(demoUser));
      syncedRef.current = true;
      toast.info("Demo mode active", { description: "API server offline — browsing locally. Start the backend for full functionality." });
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("linkme_token");
    localStorage.removeItem("linkme_user");
    syncedRef.current = false;
    fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => null);
  }, []);

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
      transactions,
      user, token, isLoggedIn: !!token && !!user, login, logout,
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
