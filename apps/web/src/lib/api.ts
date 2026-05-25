/**
 * LINKME — API client
 * Wraps every backend route with JWT injection + automatic token refresh.
 */

const BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:3000";

// ── Token helpers ────────────────────────────────────────────────────────────

let _accessToken: string | null = localStorage.getItem("linkme_token");
let _refreshing: Promise<void> | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
  if (token) localStorage.setItem("linkme_token", token);
  else localStorage.removeItem("linkme_token");
}

async function refreshTokens(): Promise<void> {
  const res = await fetch(`${BASE}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    setAccessToken(null);
    localStorage.removeItem("linkme_user");
    return;
  }
  const data = await res.json();
  setAccessToken(data.accessToken);
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

type FetchOptions = RequestInit & { skipAuth?: boolean };

async function apiFetch<T = unknown>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { skipAuth, ...init } = opts;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> ?? {}),
  };
  if (!skipAuth && _accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`;
  }

  let res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: "include" });

  // Auto-refresh on 401
  if (res.status === 401 && !skipAuth && _accessToken) {
    if (!_refreshing) _refreshing = refreshTokens().finally(() => { _refreshing = null; });
    await _refreshing;
    if (_accessToken) {
      headers["Authorization"] = `Bearer ${_accessToken}`;
      res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: "include" });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

function post<T>(path: string, body?: unknown, opts?: FetchOptions) {
  return apiFetch<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined, ...opts });
}
function get<T>(path: string, opts?: FetchOptions) {
  return apiFetch<T>(path, { method: "GET", ...opts });
}
function patch<T>(path: string, body?: unknown, opts?: FetchOptions) {
  return apiFetch<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined, ...opts });
}
function del<T>(path: string, opts?: FetchOptions) {
  return apiFetch<T>(path, { method: "DELETE", ...opts });
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  register: (data: {
    username: string;
    email?: string;
    password: string;
    displayName?: string;
  }) => post<{ accessToken: string; user: object }>("/api/auth/register", data, { skipAuth: true }),

  login: (data: { username: string; password: string }) =>
    post<{ accessToken: string; user: object }>("/api/auth/login", data, { skipAuth: true }),

  refresh: () =>
    post<{ accessToken: string }>("/api/auth/refresh", undefined, { skipAuth: true }),

  logout: () => post("/api/auth/logout"),
  logoutAll: () => post("/api/auth/logout-all"),
  /** Returns the user object directly (not wrapped). */
  me: () => get<{ id: string; username: string; role: string; credits: number; email?: string }>("/api/auth/me"),
};

// ── Profiles ─────────────────────────────────────────────────────────────────

export const profiles = {
  /** GET /api/profiles — returns { profiles, total, page, limit } */
  list: (params?: { search?: string; live?: string; page?: number; limit?: number }) => {
    const qs = params ? "?" + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : "";
    return get<{ profiles: unknown[]; total: number; page: number; limit: number }>(`/api/profiles${qs}`);
  },
  /** GET /api/profiles/:id — returns creator profile directly (not wrapped) */
  get: (userId: string) => get<object>(`/api/profiles/${userId}`),
  /** PATCH /api/profiles/me */
  updateMe: (data: { displayName?: string; bio?: string; avatarUrl?: string; coverUrl?: string; location?: string }) =>
    patch<object>("/api/profiles/me", data),
};

// ── Live feeds ────────────────────────────────────────────────────────────────

export const livefeeds = {
  list: (params?: { page?: number; limit?: number }) => {
    const qs = params ? "?" + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : "";
    return get<{ feeds: unknown[]; total: number }>(`/api/livefeeds${qs}`);
  },
  get: (id: string) => get<{ feed: object }>(`/api/livefeeds/${id}`),
  create: (data: { title: string; description?: string }) => post<{ feed: object }>("/api/livefeeds", data),
  end: (id: string) => post(`/api/livefeeds/${id}/end`),
  chat: (id: string, params?: { limit?: number; before?: string }) => {
    const qs = params ? "?" + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : "";
    return get<{ messages: unknown[] }>(`/api/livefeeds/${id}/chat${qs}`);
  },
};

// ── Messages ──────────────────────────────────────────────────────────────────

export const messages = {
  /** Returns conversations array directly (not wrapped). */
  conversations: () => get<ConversationItem[]>("/api/messages/conversations"),

  /** POST /api/messages/conversations — find or create DM with recipientId */
  getOrCreate: (recipientId: string) =>
    post<{ id: string; participants: unknown[] }>("/api/messages/conversations", { recipientId }),

  /** Returns messages array directly (not wrapped), oldest-first. */
  history: (convId: string, params?: { limit?: number; before?: string }) => {
    const qs = params ? "?" + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : "";
    return get<MessageItem[]>(`/api/messages/conversations/${convId}${qs}`);
  },

  /** POST /api/messages/conversations/:id/send — send message in conversation */
  send: (convId: string, text: string) =>
    post<MessageItem>(`/api/messages/conversations/${convId}/send`, { text }),
};

// ── Message types ─────────────────────────────────────────────────────────────

export interface MessageSender {
  id: string;
  username: string;
  profile?: { displayName?: string; avatarUrl?: string } | null;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  creditCost: number;
  sender: MessageSender;
}

export interface ConversationItem {
  id: string;
  updatedAt: string;
  lastReadAt: string | null;
  lastMessage: MessageItem | null;
  otherParticipant: {
    id: string;
    username: string;
    profile?: { displayName?: string; avatarUrl?: string } | null;
    creatorProfile?: { isLive?: boolean } | null;
  } | null;
}

// ── Credits ───────────────────────────────────────────────────────────────────

export const credits = {
  balance: () => get<{ credits: number }>("/api/credits/balance"),
  /** GET /api/credits/packs — returns array of pack objects */
  packs: () => get<CreditPack[]>("/api/credits/packs"),
  /** POST /api/credits/purchase — returns CCBill redirect URL */
  purchase: (packId: string) =>
    post<{ redirectUrl: string }>("/api/credits/purchase", { packId }),
  /** GET /api/credits/transactions — returns array directly */
  transactions: (params?: { page?: number; limit?: number }) => {
    const qs = params ? "?" + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : "";
    return get<CreditTransaction[]>(`/api/credits/transactions${qs}`);
  },
};

export interface CreditPack {
  id: string;
  credits: number;
  usdCents: number;
  usd: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  usdAmount: number | null;
  type: string;
  status: string;
  paymentMethod: string | null;
  reference: string | null;
  createdAt: string;
}

// ── Gifts ─────────────────────────────────────────────────────────────────────

export interface GiftItem {
  id: string;
  name: string;
  emoji: string;
  creditCost: number;
  category: string;
}

export const gifts = {
  /** GET /api/gifts — returns array of available gifts */
  catalogue: () => get<GiftItem[]>("/api/gifts"),
  /** POST /api/gifts/send */
  send: (data: { giftId: string; recipientId: string; feedId?: string }) =>
    post<{ id: string; name: string; emoji: string; creditCost: number }>("/api/gifts/send", data),
  /** GET /api/gifts/received — returns array directly */
  received: () => get<unknown[]>("/api/gifts/received"),
};

// ── Boosts ────────────────────────────────────────────────────────────────────

export const boosts = {
  /** GET /api/boosts/packages — returns array of packages */
  packages: () => get<unknown[]>("/api/boosts/packages"),
  /** POST /api/boosts/subscribe — purchase boost package */
  subscribe: (packageId: string) => post<unknown>("/api/boosts/subscribe", { packageId }),
  /** GET /api/boosts/active — returns active boost purchase or null */
  active: () => get<unknown | null>("/api/boosts/active"),
};

// ── Creator ───────────────────────────────────────────────────────────────────

export const creator = {
  dashboard: () => get<object>("/api/creator/dashboard"),
  /** POST /api/creator/apply — requires age verification */
  apply: (data: { displayName: string; bio: string; subscriptionPrice: number }) =>
    post<{ creatorProfile: object; message: string }>("/api/creator/apply", data),
  settings: (data: { subscriptionPrice?: number; tipMenuItems?: unknown[] }) =>
    patch<object>("/api/creator/settings", data),
  earnings: (period?: "7d" | "30d" | "90d") =>
    get<{ transactions: unknown[]; period: string; since: string }>(`/api/creator/earnings${period ? `?period=${period}` : ""}`),
};

// ── Age Verification ──────────────────────────────────────────────────────────
// Routes: GET/POST /api/age-verify/*

export const ageVerify = {
  /** GET /api/age-verify/status */
  status: () => get<{ status: string; rejectedReason?: string }>("/api/age-verify/status"),

  /** POST /api/age-verify/submit — body: { documentType, dateOfBirth: "YYYY-MM-DD" } */
  submit: (data: { documentType: "passport" | "drivers_license" | "national_id"; dateOfBirth: string }) =>
    post<{ verificationId: string; status: string; message: string }>("/api/age-verify/submit", data),

  /** POST /api/age-verify/upload-url — returns presigned S3 URL + key */
  uploadUrl: () =>
    post<{ uploadUrl: string; s3Key: string; expiresIn: number; fields: Record<string, string> }>("/api/age-verify/upload-url"),

  /** POST /api/age-verify/confirm — called after S3 upload completes */
  confirm: () =>
    post<{ status: string; message: string }>("/api/age-verify/confirm"),
};

// ── Moderation ────────────────────────────────────────────────────────────────

export const moderation = {
  report: (data: {
    targetId: string;
    targetType: string;
    reason: string;
    details?: string;
  }) => post("/api/moderation/report", data),
};
