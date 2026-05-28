/**
 * CRAVR — API client
 * Wraps every backend route with JWT injection + automatic token refresh.
 */

// Use VITE_API_URL if set, otherwise use same-origin (goes through Vite dev proxy → /api → localhost:3000)
const BASE: string = (import.meta as any).env?.VITE_API_URL || "";

// ── Token helpers ────────────────────────────────────────────────────────────

let _accessToken: string | null = localStorage.getItem("cravr_token");
let _refreshing: Promise<void> | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
  if (token) localStorage.setItem("cravr_token", token);
  else localStorage.removeItem("cravr_token");
}

async function refreshTokens(): Promise<void> {
  const res = await fetch(`${BASE}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    setAccessToken(null);
    localStorage.removeItem("cravr_user");
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
    return get<{ profiles: CreatorProfileItem[]; total: number; page: number; limit: number }>(`/api/profiles${qs}`);
  },
  /** GET /api/profiles/:id — returns creator profile directly (not wrapped). :id is the userId */
  get: (userId: string) => get<CreatorProfileItem>(`/api/profiles/${userId}`),
  /** PATCH /api/profiles/me */
  updateMe: (data: { displayName?: string; bio?: string; avatarUrl?: string; coverUrl?: string; location?: string }) =>
    patch<object>("/api/profiles/me", data),
};

// ── Profile types ─────────────────────────────────────────────────────────────

export interface UserProfileSnippet {
  displayName: string | null;
  avatarUrl: string | null;
  coverUrl?: string | null;
  location?: string | null;
  isVerified?: boolean;
}

export interface CreatorProfileItem {
  id: string;                    // creatorProfile.id
  userId: string;
  isLive: boolean;
  isApproved: boolean;
  subscriberCount: number;
  totalEarnings: number;
  monthlyEarnings: number;
  bio: string | null;
  subscriptionPrice: number;
  user: {
    id: string;
    username: string;
    profile: UserProfileSnippet | null;
  };
}

// ── Live feed types ───────────────────────────────────────────────────────────

export interface LiveFeedItem {
  id: string;
  creatorId: string;
  title: string;
  category: string | null;
  isVip: boolean;
  viewerCount: number;
  thumbnailUrl: string | null;
  tags: string[];
  isLive: boolean;
  startedAt: string;
  endedAt: string | null;
  creator: {
    id: string;
    userId: string;
    user: {
      id: string;
      username: string;
      profile: { displayName: string | null; avatarUrl: string | null } | null;
    };
  };
}

// ── Live feeds ────────────────────────────────────────────────────────────────

export const livefeeds = {
  /** GET /api/livefeeds — returns array directly */
  list: (params?: { page?: number; limit?: number; category?: string }) => {
    const qs = params ? "?" + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : "";
    return get<LiveFeedItem[]>(`/api/livefeeds${qs}`);
  },
  /** GET /api/livefeeds/:id — returns feed object directly */
  get: (id: string) => get<LiveFeedItem>(`/api/livefeeds/${id}`),
  create: (data: { title: string; category: string; isVip?: boolean; thumbnailUrl?: string; tags?: string[] }) =>
    post<LiveFeedItem>("/api/livefeeds", data),
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
  /**
   * POST /api/credits/purchase — Stripe variant.
   * Sends packId + Stripe paymentMethodId; backend creates/confirms PaymentIntent.
   * Returns { credits, balance, clientSecret? } — clientSecret present if 3DS required.
   */
  purchaseWithStripe: (packId: string, paymentMethodId: string) =>
    post<{ credits: number; balance: number; clientSecret?: string }>(
      "/api/credits/purchase",
      { packId, paymentMethodId }
    ),
  /**
   * POST /api/credits/spend — server-confirmed spend.
   * Optimistic UI already deducted; this records it server-side.
   * Returns { balance } on success.
   */
  spend: (amount: number, reason: string) =>
    post<{ balance: number }>("/api/credits/spend", { amount, reason }),
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
  bonusCredits: number;
  totalCredits: number;
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

export interface CreatorDashboardData {
  profile: CreatorProfileItem;
  stats: { totalEarnings: number; monthlyEarnings: number; subscriberCount: number };
  recentTips: Array<{ amount: number; createdAt: string; metadata: unknown }>;
  recentSubs: Array<{
    id: string;
    createdAt: string;
    subscriber: { username: string; profile: { displayName: string | null } | null };
  }>;
  liveFeeds: Array<{
    id: string; title: string; viewerCount: number; peakViewers: number;
    startedAt: string; endedAt: string | null; isLive: boolean;
  }>;
}

export const creator = {
  dashboard: () => get<CreatorDashboardData>("/api/creator/dashboard"),
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

export interface AgeVerifyQueueItem {
  id: string;
  userId: string;
  status: string;
  documentType: string | null;
  dateOfBirth: string | null;
  createdAt: string;
  hasDocument: boolean;
  hasSelfie: boolean;
  user: { id: string; username: string; email: string | null };
}

export const ageVerify = {
  /** GET /api/age-verify/status */
  status: () => get<{ status: string; rejectedReason?: string }>("/api/age-verify/status"),

  /** POST /api/age-verify/submit — body: { documentType, dateOfBirth: "YYYY-MM-DD" } */
  submit: (data: { documentType: "passport" | "drivers_license" | "national_id"; dateOfBirth: string }) =>
    post<{ verificationId: string; status: string; message: string }>("/api/age-verify/submit", data),

  /** POST /api/age-verify/upload-url — returns presigned S3 PUT URL for direct browser upload */
  uploadUrl: (data: { type: "id" | "selfie"; contentType: string }) =>
    post<{ uploadUrl: string; s3Key: string; expiresIn: number }>("/api/age-verify/upload-url", data),

  /** POST /api/age-verify/confirm — called after both uploads complete */
  confirm: () =>
    post<{ status: string; message: string }>("/api/age-verify/confirm"),

  /** Admin: GET /api/age-verify/queue */
  queue: () => get<AgeVerifyQueueItem[]>("/api/age-verify/queue"),

  /** Admin: GET /api/age-verify/:userId/view-url?type=id|selfie */
  viewUrl: (userId: string, type: "id" | "selfie") =>
    get<{ url: string; expiresIn: number; type: string }>(`/api/age-verify/${userId}/view-url?type=${type}`),

  /** Admin: PATCH /api/age-verify/:userId */
  review: (userId: string, data: { action: "approve" | "reject"; reason?: string }) =>
    patch<{ id: string; status: string; userId: string }>(`/api/age-verify/${userId}`, data),
};

// ── Content ───────────────────────────────────────────────────────────────────

export const content = {
  /**
   * POST /api/content/unlock — unlock a piece of premium content.
   * Deducts credits, writes ContentUnlock + CreatorEarning, returns the
   * server-confirmed buyer balance.
   */
  unlock: (data: {
    contentId:     string;
    creatorUserId: string;
    creditCost:    number;
    contentType?:  "PHOTO" | "VIDEO" | "STREAM" | "PRIVATE_MESSAGE";
  }) =>
    post<{
      ok: boolean;
      contentId: string;
      creditCost: number;
      creatorCredits: number;
      processingFee: number;
      platformFee: number;
      revenueSharePct: number;
      buyerBalance: number;
      alreadyUnlocked?: boolean;
    }>("/api/content/unlock", data),

  /** GET /api/content/unlocked — list of contentIds already unlocked by the user */
  unlocked: () =>
    get<{ contentId: string; contentType: string; creditCost: number; createdAt: string }[]>(
      "/api/content/unlocked"
    ),
};

// ── Subscriptions ─────────────────────────────────────────────────────────────

export const subscriptions = {
  /** POST /api/subscriptions — subscribe to a creator (charges credits) */
  subscribe: (creatorId: string, tier?: string) =>
    post<{
      ok: boolean;
      subscription: { id: string; creatorId: string; endsAt: string; status: string };
      creditCost: number;
      creatorCredits: number;
      processingFee: number;
      platformFee: number;
      revenueSharePct: number;
      endsAt: string;
    }>("/api/subscriptions", { creatorId, tier }),

  /** GET /api/subscriptions — list active subscriptions for the logged-in user */
  list: () =>
    get<{
      id: string;
      creatorId: string;
      tier: string;
      endsAt: string;
      creditCost: number;
      creator: { username: string; profile: { displayName: string | null; avatarUrl: string | null } | null };
    }[]>("/api/subscriptions"),

  /** DELETE /api/subscriptions/:id — cancel a subscription (retains access until endsAt) */
  cancel: (id: string) =>
    del<{ ok: boolean; accessUntil: string }>(`/api/subscriptions/${id}`),
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
