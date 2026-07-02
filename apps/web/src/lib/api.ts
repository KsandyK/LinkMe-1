/**
 * CRAVR — API client
 * Wraps every backend route with JWT injection + automatic token refresh.
 */

// Use VITE_API_URL if set, otherwise use same-origin (goes through Vite dev proxy → /api → localhost:3000)
const BASE: string = (import.meta as any).env?.VITE_API_URL || "";

// ── Token helpers ────────────────────────────────────────────────────────────

let _accessToken: string | null = localStorage.getItem("cravr_token");
let _refreshToken: string | null = localStorage.getItem("cravr_refresh");
let _refreshing: Promise<void> | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
  if (token) localStorage.setItem("cravr_token", token);
  else localStorage.removeItem("cravr_token");
}

export function setRefreshToken(token: string | null) {
  _refreshToken = token;
  if (token) localStorage.setItem("cravr_refresh", token);
  else localStorage.removeItem("cravr_refresh");
}

async function refreshTokens(): Promise<void> {
  if (!_refreshToken) {
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("cravr_user");
    return;
  }
  const res = await fetch(`${BASE}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: _refreshToken }),
    credentials: "include",
  });
  if (!res.ok) {
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("cravr_user");
    return;
  }
  const data = await res.json();
  setAccessToken(data.accessToken);
  // Backend rotates the refresh token on every use — persist the new one
  if (data.refreshToken) setRefreshToken(data.refreshToken);
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
    location?: string;
    bio?: string;
  }) => post<{ accessToken: string; refreshToken: string; user: object }>("/api/auth/register", data, { skipAuth: true }),

  /** POST /api/auth/check-email — returns { ok, reason? } (never throws for bad email) */
  checkEmail: (email: string) =>
    post<{ ok: boolean; reason?: string }>("/api/auth/check-email", { email }, { skipAuth: true }),

  login: (data: { username: string; password: string }) =>
    post<{ accessToken?: string; refreshToken?: string; user?: object; totpRequired?: boolean; challengeToken?: string }>(
      "/api/auth/login", data, { skipAuth: true },
    ),

  loginTotp: (data: { challengeToken: string; token: string }) =>
    post<{ accessToken: string; refreshToken: string; user: object }>(
      "/api/auth/login/totp", data, { skipAuth: true },
    ),

  refresh: () =>
    post<{ accessToken: string }>("/api/auth/refresh", undefined, { skipAuth: true }),

  logout: () => post("/api/auth/logout"),
  logoutAll: () => post("/api/auth/logout-all"),
  /** Returns the user object directly (not wrapped). */
  me: () => get<{
    id: string; username: string; role: string; credits: number; email?: string;
    profile: { displayName: string | null; bio: string | null; avatarUrl: string | null; location: string | null; } | null;
  }>("/api/auth/me"),
};

// ── TOTP (Authenticator App 2FA) ─────────────────────────────────────────────
export const totp = {
  status: () => get<{ enabled: boolean }>("/api/totp/status"),
  setup:  () => post<{ secret: string; qrDataUrl: string; otpauthUri: string }>("/api/totp/setup"),
  verify: (token: string) => post<{ ok: boolean }>("/api/totp/verify", { token }),
  disable: (password: string) => post<{ ok: boolean }>("/api/totp/disable", { password }),
};

// ── Profiles ─────────────────────────────────────────────────────────────────

/** GET /api/stats — public homepage counts (real, not fabricated) */
export const stats = {
  get: () => get<{ creators: number; members: number; liveNow: number }>("/api/stats"),
};

// ── Admin (staff-only) ────────────────────────────────────────────────────────
export interface AdminOverview {
  users:    { total: number; active: number; newToday: number; new30d: number };
  creators: { total: number; pending: number; liveNow: number; newToday: number };
  revenue:  { today: number; last30d: number; lifetime: number; transactionsToday: number };
  queues: {
    verificationPending: number;
    moderationOpen: number;
    moderationCritical: number;
    moderationResolvedToday: number;
    contentFlagsPending: number;
    pendingPayouts: number;
  };
  activity: Array<
    | { kind: "registration"; at: string; username: string; role: string }
    | { kind: "creator_apply"; at: string; username: string }
    | { kind: "report"; at: string; reporter: string; reportedUser: string | null; reason: string; priority: number }
  >;
  serverTime: string;
}
export interface AdminUserRow {
  id: string; username: string; email: string | null; role: string;
  credits: number; isActive: boolean; createdAt: string;
  creatorProfile: { isApproved: boolean; isLive: boolean; totalEarnings: number } | null;
  ageVerification: { status: string } | null;
}
export const admin = {
  overview: () => get<AdminOverview>("/api/admin/overview"),
  users: (params?: { q?: string; page?: number; limit?: number }) => {
    const qs = params
      ? "?" + new URLSearchParams(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return get<{ users: AdminUserRow[]; total: number; page: number; limit: number }>(`/api/admin/users${qs}`);
  },
  setUserActive: (id: string, action: "deactivate" | "reactivate", reason?: string) =>
    patch<{ id: string; username: string; isActive: boolean; role: string }>(`/api/admin/users/${id}`, { action, reason }),
  auditLog: (params?: { page?: number; limit?: number; actionType?: string; adminId?: string }) => {
    const qs = params
      ? "?" + new URLSearchParams(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return get<{
      entries: Array<{
        id: string; adminId: string; adminUsername: string;
        actionType: string; targetType: string; targetId: string;
        targetLabel: string | null; metadata: Record<string, unknown> | null;
        createdAt: string;
      }>;
      total: number; page: number; limit: number;
    }>(`/api/admin/audit-log${qs}`);
  },
  flags: () => get<Array<{
    id: string; contentType: string; contentId: string;
    flagType: string; confidence: number; metadata: Record<string, unknown> | null;
    reviewed: boolean; createdAt: string;
  }>>("/api/moderation/flags"),
  reviewFlag: (id: string) => patch<object>(`/api/moderation/flags/${id}`, {}),
};

export interface ModerationReport {
  id: string;
  reporterId: string;
  reportedUserId: string | null;
  contentType: string | null;
  contentId: string | null;
  reason: string;
  details: string | null;
  status: string;
  priority: number;
  createdAt: string;
  resolvedAt: string | null;
  reporter:     { id: string; username: string };
  reportedUser: { id: string; username: string; role: string } | null;
}
// (admin moderation methods reports() / resolve() live in the moderation export
// near the bottom of this file, combined with the user-facing report() method)

export const profiles = {
  /** GET /api/profiles — returns { profiles, total, page, limit } */
  list: (params?: { search?: string; live?: string; sort?: "newest" | "top" | "popular"; category?: string; page?: number; limit?: number; offset?: number }) => {
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
  isAiPersona?: boolean;         // true = AI companion (labelled on profile)
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

// ── Notifications ───────────────────────────────────────────────────────────

export interface ServerNotif {
  id: string;
  type: "live" | "message";
  title: string;
  sub: string;
  href: string;
}

export const notifications = {
  /** GET /api/notifications — server-computed live + unread-message alerts */
  list: () => get<{ notifications: ServerNotif[] }>("/api/notifications"),
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
  apply: (data: { displayName: string; bio: string; subscriptionPrice?: number; referralCode?: string }) =>
    post<{ creatorProfile: object; message: string }>("/api/creator/apply", data),
  settings: (data: { subscriptionPrice?: number; tipMenuItems?: unknown[] }) =>
    patch<object>("/api/creator/settings", data),
  earnings: (period?: "7d" | "30d" | "90d") =>
    get<{ transactions: unknown[]; period: string; since: string }>(`/api/creator/earnings${period ? `?period=${period}` : ""}`),
  /** GET /api/creator/referral/check?code= — validate a referral code */
  referralCheck: (code: string) =>
    get<{ valid: boolean; referrerName: string | null }>(`/api/creator/referral/check?code=${encodeURIComponent(code)}`),
  /** GET /api/creator/referrals — the signed-in creator's code + milestone stats */
  referrals: () =>
    get<{
      code: string | null;
      boostClaimed: boolean;
      currentRevenueSharePct: number;
      qualifyingCount: number;
      targetCount: number;
      collectiveMonthlyCredits: number;
      targetCredits: number;
      eligible: boolean;
      referrals: { name: string; username: string; joinedAt: string; approved: boolean }[];
    }>("/api/creator/referrals"),
  /** POST /api/creator/referral/claim-boost — claim the one-time tier boost */
  claimReferralBoost: () =>
    post<{ ok: boolean; revenueSharePct: number }>("/api/creator/referral/claim-boost"),
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

  /** POST /api/age-verify/upload-doc?type=id|selfie — raw image upload to private Bunny storage */
  uploadDoc: async (type: "id" | "selfie", file: File) => {
    const res = await fetch(`${BASE}/api/age-verify/upload-doc?type=${type}`, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
        ...(_accessToken ? { Authorization: `Bearer ${_accessToken}` } : {}),
      },
      body: file,
      credentials: "include",
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(b.error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<{ ok: boolean; type: string }>;
  },

  /** POST /api/age-verify/confirm — called after both uploads complete */
  confirm: () =>
    post<{ status: string; message: string }>("/api/age-verify/confirm"),

  /** POST /api/age-verify/request-manual — temporary manual review (emails support) */
  requestManual: () =>
    post<{ status: string; message: string }>("/api/age-verify/request-manual"),

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

  /**
   * GET /api/content/:id/access — short-lived signed URL for the REAL media.
   * Backend verifies the user owns or has unlocked the content (else 403).
   */
  access: (contentId: string) =>
    get<{ accessUrl: string; type: string; expiresIn: number }>(
      `/api/content/${encodeURIComponent(contentId)}/access`
    ),

  /** GET /api/content/creator/:creatorId — public published listing for a creator's profile page */
  getForCreator: (creatorId: string) =>
    get<{
      id: string;
      title: string;
      type: string;
      thumbnailUrl: string | null;
      creditCost: number;
      sortOrder: number;
      createdAt: string;
    }[]>(`/api/content/creator/${encodeURIComponent(creatorId)}`),

  /** GET /api/content/my — creator's own full library (requires auth) */
  getMy: () =>
    get<{
      id: string;
      title: string;
      type: string;
      mediaUrl: string;
      thumbnailUrl: string | null;
      accessUrl: string;
      creditCost: number;
      sortOrder: number;
      isPublished: boolean;
      bunnyVideoId: string | null;
      createdAt: string;
    }[]>("/api/content/my"),
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
  /** POST /api/moderation/report — user submits a report against a user or content */
  report: (data: {
    reportedUserId?: string;
    contentType?:    "user" | "profile" | "stream" | "message" | "content";
    contentId?:      string;
    reason: "harassment" | "illegal_content" | "underage_suspicion" | "spam"
          | "impersonation" | "non_consensual" | "other";
    details?: string;
  }) => post<{ reportId: string; message: string }>("/api/moderation/report", data),

  /** GET /api/moderation/reports — admin/moderator list */
  reports: (status: string = "PENDING", page = 1, limit = 25) =>
    get<{ reports: ModerationReport[]; total: number }>(`/api/moderation/reports?status=${status}&page=${page}&limit=${limit}`),

  /** PATCH /api/moderation/reports/:id — admin/moderator resolve */
  resolve: (id: string, data: {
    action: "RESOLVED_ACTION" | "RESOLVED_NO_ACTION" | "DISMISSED" | "UNDER_REVIEW";
    resolution?: string;
    enforce?: { banUser?: boolean; deactivateUser?: boolean; removeContent?: boolean; warnUser?: boolean };
  }) => patch<object>(`/api/moderation/reports/${id}`, data),
};
