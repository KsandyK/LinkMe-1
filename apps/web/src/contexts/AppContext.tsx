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

  // Auth
  user: { id: string; username: string; role: string } | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  AGE_GATE: "vl_age_gate_v1",
  AGE_VERIFY: "vl_age_verify_v1",
  CREDITS: "vl_credits_v1",
  UNLOCKED: "vl_unlocked_v1",
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
  useEffect(() => {
    if (!token || syncedRef.current) return;
    syncedRef.current = true;
    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
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
      .catch(() => null);
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
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
    } catch (err) {
      // TypeError = network error = API server not running → demo mode
      if (err instanceof TypeError) {
        const demoUser = { id: `demo-${username}`, username, role: "USER" };
        const demoToken = `demo-token-${Date.now()}`;
        setToken(demoToken);
        setUser(demoUser);
        localStorage.setItem("linkme_token", demoToken);
        localStorage.setItem("linkme_user", JSON.stringify(demoUser));
        syncedRef.current = true;
        toast.info("Demo mode active", { description: "API server offline — browsing locally. Start the backend for full functionality." });
        return;
      }
      throw err;
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
