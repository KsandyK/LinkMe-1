/**
 * CRAVR — Admin platform routes
 *
 * Centralised admin telemetry + management endpoints. Every route gated by
 * requireAdmin so non-staff can't probe these.
 *
 *   GET   /api/admin/overview       — single-call dashboard: users, creators,
 *                                      revenue, queues, recent activity
 *   GET   /api/admin/users?q=&limit= — paginated user search (username/email)
 *   PATCH /api/admin/users/:id      — staff actions: activate / deactivate
 */

import { Router } from "express";
import { z } from "zod";
import db from "../lib/db.js";
import { requireAdmin } from "../middleware/auth.js";
import { recordAdminAction } from "../lib/audit.js";

const router = Router();

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

// ── GET /api/admin/overview ──────────────────────────────────────────────────
router.get("/admin/overview", requireAdmin, async (_req, res) => {
  const today = startOfToday();
  const last30 = daysAgo(30);

  const [
    usersTotal, usersActive, usersNewToday, usersNew30d,
    creatorsApproved, creatorsPending, creatorsLive, creatorsNewToday,
    verificationPending, verificationUnderReview,
    moderationPending, moderationCritical, moderationResolvedToday,
    contentFlagsPending,
    pendingPayouts,
    revenueTodayAgg, revenue30dAgg, revenueLifetimeAgg,
    transactionsToday,
    recentRegistrations, recentApplications, recentReports,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { isActive: true } }),
    db.user.count({ where: { createdAt: { gte: today } } }),
    db.user.count({ where: { createdAt: { gte: last30 } } }),

    db.creatorProfile.count({ where: { isApproved: true } }),
    db.creatorProfile.count({ where: { isApproved: false } }),
    db.creatorProfile.count({ where: { isLive: true, isApproved: true } }),
    db.creatorProfile.count({ where: { createdAt: { gte: today } } }),

    db.ageVerification.count({ where: { status: "PENDING" } }),
    db.ageVerification.count({ where: { status: "UNDER_REVIEW" } }),

    db.moderationReport.count({ where: { status: "PENDING" } }),
    db.moderationReport.count({ where: { status: "PENDING", priority: 2 } }),
    db.moderationReport.count({
      where: {
        status: { in: ["RESOLVED_ACTION", "RESOLVED_NO_ACTION", "DISMISSED"] },
        resolvedAt: { gte: today },
      },
    }),

    db.contentFlag.count({ where: { reviewed: false } }),

    db.creatorPayout.count({ where: { status: { in: ["PENDING", "APPROVED"] } } }),

    db.transaction.aggregate({
      where: { type: "CREDIT_PURCHASE", status: "COMPLETED", createdAt: { gte: today } },
      _sum: { usdAmount: true },
    }),
    db.transaction.aggregate({
      where: { type: "CREDIT_PURCHASE", status: "COMPLETED", createdAt: { gte: last30 } },
      _sum: { usdAmount: true },
    }),
    db.transaction.aggregate({
      where: { type: "CREDIT_PURCHASE", status: "COMPLETED" },
      _sum: { usdAmount: true },
    }),
    db.transaction.count({
      where: { type: "CREDIT_PURCHASE", status: "COMPLETED", createdAt: { gte: today } },
    }),

    // Activity feed candidates — newest first
    db.user.findMany({
      orderBy: { createdAt: "desc" }, take: 8,
      select: { id: true, username: true, role: true, createdAt: true, isActive: true },
    }),
    db.creatorProfile.findMany({
      where: { isApproved: false },
      orderBy: { createdAt: "desc" }, take: 8,
      include: { user: { select: { username: true } } },
    }),
    db.moderationReport.findMany({
      orderBy: { createdAt: "desc" }, take: 8,
      include: {
        reporter: { select: { username: true } },
        reportedUser: { select: { username: true } },
      },
    }),
  ]);

  // Build a unified activity feed — newest first, 15 items max
  type Activity =
    | { kind: "registration"; at: Date; username: string; role: string }
    | { kind: "creator_apply"; at: Date; username: string }
    | { kind: "report"; at: Date; reporter: string; reportedUser: string | null; reason: string; priority: number };

  const feed: Activity[] = [
    ...recentRegistrations.map(u => ({ kind: "registration" as const, at: u.createdAt, username: u.username, role: u.role })),
    ...recentApplications.map(a => ({ kind: "creator_apply" as const, at: a.createdAt, username: a.user.username })),
    ...recentReports.map(r => ({
      kind: "report" as const,
      at: r.createdAt,
      reporter: r.reporter.username,
      reportedUser: r.reportedUser?.username ?? null,
      reason: r.reason,
      priority: r.priority,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 15);

  const usdSum = (agg: { _sum: { usdAmount: unknown } } | null | undefined): number => {
    const v = agg?._sum?.usdAmount;
    if (v == null) return 0;
    // Prisma Decimal | number | string — normalise
    if (typeof v === "number") return v;
    return Number(v.toString());
  };

  res.json({
    users: {
      total: usersTotal,
      active: usersActive,
      newToday: usersNewToday,
      new30d: usersNew30d,
    },
    creators: {
      total: creatorsApproved,
      pending: creatorsPending,
      liveNow: creatorsLive,
      newToday: creatorsNewToday,
    },
    revenue: {
      today: usdSum(revenueTodayAgg),
      last30d: usdSum(revenue30dAgg),
      lifetime: usdSum(revenueLifetimeAgg),
      transactionsToday,
    },
    queues: {
      verificationPending: verificationPending + verificationUnderReview,
      moderationOpen: moderationPending,
      moderationCritical,
      moderationResolvedToday,
      contentFlagsPending,
      pendingPayouts,
    },
    activity: feed,
    serverTime: new Date().toISOString(),
  });
});

// ── GET /api/admin/users — search/list users ─────────────────────────────────
router.get("/admin/users", requireAdmin, async (req, res) => {
  const q       = String(req.query.q ?? "").trim();
  const limit   = Math.min(50, Math.max(1, Number(req.query.limit ?? 25)));
  const page    = Math.max(1, Number(req.query.page ?? 1));

  const where = q
    ? { OR: [
        { username: { contains: q, mode: "insensitive" as const } },
        { email:    { contains: q, mode: "insensitive" as const } },
      ] }
    : {};

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, username: true, email: true, role: true, credits: true,
        isActive: true, createdAt: true,
        creatorProfile: { select: { isApproved: true, isLive: true, totalEarnings: true } },
        ageVerification: { select: { status: true } },
      },
    }),
    db.user.count({ where }),
  ]);

  res.json({ users, total, page, limit });
});

// ── PATCH /api/admin/users/:id — activate / deactivate ───────────────────────
const PatchUserSchema = z.object({
  action: z.enum(["deactivate", "reactivate"]),
  reason: z.string().max(500).optional(),
});

router.patch("/admin/users/:id", requireAdmin, async (req, res) => {
  const parsed = PatchUserSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const target = await db.user.findUnique({
    where: { id: String(req.params.id) },
    select: { id: true, role: true, username: true },
  });
  if (!target) { res.status(404).json({ error: "User not found" }); return; }
  if (target.role === "ADMIN") {
    res.status(403).json({ error: "Cannot modify another admin account via this endpoint" });
    return;
  }

  const isActive = parsed.data.action === "reactivate";
  const updated = await db.user.update({
    where: { id: target.id },
    data: { isActive },
    select: { id: true, username: true, isActive: true, role: true },
  });

  // Revoke sessions on deactivation
  if (!isActive) {
    await db.session.deleteMany({ where: { userId: target.id } }).catch(() => null);
  }

  // Audit
  await recordAdminAction({
    adminId:       req.user!.sub,
    adminUsername: req.user!.username,
    actionType:    isActive ? "user_reactivate" : "user_deactivate",
    targetType:    "user",
    targetId:      target.id,
    targetLabel:   `@${target.username}`,
    metadata:      parsed.data.reason ? { reason: parsed.data.reason } : undefined,
  });

  res.json(updated);
});

// ── GET /api/admin/audit-log — recent admin actions (paginated) ──────────────
router.get("/admin/audit-log", requireAdmin, async (req, res) => {
  const limit       = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
  const page        = Math.max(1, Number(req.query.page ?? 1));
  const actionType  = String(req.query.actionType ?? "").trim();
  const adminId     = String(req.query.adminId ?? "").trim();

  const where: Record<string, unknown> = {};
  if (actionType) where.actionType = actionType;
  if (adminId)    where.adminId    = adminId;

  const [entries, total] = await Promise.all([
    db.adminAction.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.adminAction.count({ where }),
  ]);

  res.json({ entries, total, page, limit });
});

export default router;
