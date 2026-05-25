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
  me: () => get<{ user: object }>("/api/auth/me"),
};

// ── Profiles ─────────────────────────────────────────────────────────────────

export const profiles = {
  list: (params?: { search?: string; role?: string; page?: number; limit?: number }) => {
    const qs = params ? "?" + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : "";
    return get<{ profiles: unknown[]; total: number; page: number; pages: number }>(`/api/profiles${qs}`);
  },
  get: (id: string) => get<{ profile: object }>(`/api/profiles/${id}`),
  update: (id: string, data: object) => patch(`/api/profiles/${id}`, data),
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
  conversations: () => get<{ conversations: unknown[] }>("/api/messages/conversations"),
  getOrCreate: (userId: string) =>
    post<{ conversation: object; created: boolean }>("/api/messages/conversations", { userId }),
  history: (convId: string, params?: { limit?: number; before?: string }) => {
    const qs = params ? "?" + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : "";
    return get<{ messages: unknown[]; hasMore: boolean }>(`/api/messages/conversations/${convId}${qs}`);
  },
  send: (convId: string, text: string) =>
    post<{ message: object }>(`/api/messages/conversations/${convId}`, { text }),
  markRead: (convId: string) => post(`/api/messages/conversations/${convId}/read`),
};

// ── Credits ───────────────────────────────────────────────────────────────────

export const credits = {
  balance: () => get<{ credits: number }>("/api/credits/balance"),
  packages: () => get<{ packages: unknown[] }>("/api/credits/packages"),
  buyUrl: (packId: string) =>
    post<{ url: string }>("/api/credits/buy", { packId }),
  transactions: (params?: { page?: number; limit?: number }) => {
    const qs = params ? "?" + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : "";
    return get<{ transactions: unknown[]; total: number }>(`/api/credits/transactions${qs}`);
  },
};

// ── Gifts ─────────────────────────────────────────────────────────────────────

export const gifts = {
  catalogue: () => get<{ gifts: unknown[] }>("/api/gifts/catalogue"),
  send: (data: { toUserId: string; giftType: string; message?: string }) =>
    post<{ gift: object; credits: number }>("/api/gifts/send", data),
  received: () => get<{ gifts: unknown[] }>("/api/gifts/received"),
};

// ── Boosts ────────────────────────────────────────────────────────────────────

export const boosts = {
  packages: () => get<{ packages: unknown[] }>("/api/boosts/packages"),
  buy: (packageId: string) => post<{ purchase: object; credits: number }>("/api/boosts/buy", { packageId }),
  active: () => get<{ purchase: object | null }>("/api/boosts/active"),
  use: () => post<{ boostsUsed: number; boostsTotal: number }>("/api/boosts/use"),
};

// ── Creator ───────────────────────────────────────────────────────────────────

export const creator = {
  dashboard: () => get<object>("/api/creator/dashboard"),
  apply: () => post("/api/creator/apply"),
  settings: (data: object) => patch("/api/creator/settings", data),
};

// ── Age Verification ──────────────────────────────────────────────────────────

export const ageVerify = {
  status: () => get<{ status: string }>("/api/verify-age/status"),
  submitDob: (dob: string) => post<{ status: string }>("/api/verify-age/dob", { dob }),
  uploadUrl: (contentType: string) =>
    post<{ uploadUrl: string; key: string }>("/api/verify-age/upload-url", { contentType }),
  confirm: (s3Key: string, documentType: string) =>
    post<{ status: string }>("/api/verify-age/confirm", { s3Key, documentType }),
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
