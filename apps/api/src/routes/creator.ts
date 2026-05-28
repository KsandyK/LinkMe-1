import { Router } from "express";
import { z } from "zod";
import db from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { getRevenueSharePct, revenueTierLabel, CREDITS_PER_USD, GRACE_PERIOD_DAYS } from "../lib/revenue.js";

const router = Router();

// ── GET /api/creator/dashboard ────────────────────────────────────────────────
router.get("/creator/dashboard", requireAuth, async (req, res) => {
  const creator = await db.creatorProfile.findUnique({
    where: { userId: req.user!.sub },
    include: { user: { select: { id: true, username: true, profile: true } } },
  });
  if (!creator) {
    res.status(404).json({ error: "Creator profile not found" });
    return;
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

  const [recentTips, recentSubs, liveFeeds] = await Promise.all([
    db.transaction.findMany({
      where: { userId: req.user!.sub, type: "CREDIT_SPEND_TIP", createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { amount: true, createdAt: true, metadata: true },
    }),
    db.subscription.findMany({
      where: { creatorId: req.user!.sub, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { subscriber: { select: { username: true, profile: { select: { displayName: true } } } } },
    }),
    db.liveFeed.findMany({
      where: { creator: { userId: req.user!.sub } },
      orderBy: { startedAt: "desc" },
      take: 5,
      select: { id: true, title: true, viewerCount: true, peakViewers: true, startedAt: true, endedAt: true, isLive: true },
    }),
  ]);

  // Revenue tier info
  const revenueSharePct = getRevenueSharePct(creator.creatorActivatedAt, creator.monthlyEarnings);
  const daysSinceActivation = creator.creatorActivatedAt
    ? Math.floor((Date.now() - creator.creatorActivatedAt.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const inGracePeriod = daysSinceActivation <= GRACE_PERIOD_DAYS;
  const graceDaysRemaining = inGracePeriod ? GRACE_PERIOD_DAYS - daysSinceActivation : 0;

  res.json({
    profile: creator,
    stats: {
      totalEarnings: creator.totalEarnings,
      monthlyEarnings: creator.monthlyEarnings,
      subscriberCount: creator.subscriberCount,
    },
    revenueShare: {
      pct: revenueSharePct,
      label: revenueTierLabel(revenueSharePct),
      inGracePeriod,
      graceDaysRemaining,
      monthlyEarningsUsd: creator.monthlyEarnings / CREDITS_PER_USD,
    },
    recentTips,
    recentSubs,
    liveFeeds,
  });
});

// ── GET /api/creator/earnings ─────────────────────────────────────────────────
router.get("/creator/earnings", requireAuth, async (req, res) => {
  const { period = "30d" } = req.query as Record<string, string>;
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const since = new Date(Date.now() - days * 86_400_000);

  const txns = await db.transaction.findMany({
    where: {
      userId: req.user!.sub,
      type: { in: ["CREDIT_SPEND_TIP", "CREATOR_PAYOUT"] },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "asc" },
  });

  res.json({ transactions: txns, period, since });
});

// ── POST /api/creator/apply — apply to become a creator ───────────────────────
const ApplySchema = z.object({
  displayName: z.string().min(1).max(60),
  bio: z.string().min(20).max(500),
  subscriptionPrice: z.number().int().min(0).max(10000),
  tipMenuItems: z
    .array(z.object({ label: z.string().max(50), credits: z.number().int().min(1) }))
    .max(10)
    .optional(),
});

router.post("/creator/apply", requireAuth, async (req, res) => {
  const parsed = ApplySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
    return;
  }

  const existing = await db.creatorProfile.findUnique({ where: { userId: req.user!.sub } });
  if (existing) {
    res.status(409).json({ error: "Creator application already submitted" });
    return;
  }

  // Age verification required to become a creator
  const ageVerify = await db.ageVerification.findUnique({ where: { userId: req.user!.sub } });
  if (ageVerify?.status !== "VERIFIED") {
    res.status(403).json({ error: "Age verification required before applying as creator" });
    return;
  }

  const [creatorProfile] = await db.$transaction([
    db.creatorProfile.create({
      data: {
        userId: req.user!.sub,
        subscriptionPrice: parsed.data.subscriptionPrice,
        tipMenuItems: parsed.data.tipMenuItems ?? [],
        isApproved: false, // pending admin review
      },
    }),
    db.user.update({ where: { id: req.user!.sub }, data: { role: "CREATOR" } }),
    db.profile.update({
      where: { userId: req.user!.sub },
      data: {
        displayName: parsed.data.displayName,
        bio: parsed.data.bio,
      },
    }),
  ]);

  res.status(201).json({
    creatorProfile,
    message: "Application submitted — pending review by our team.",
  });
});

// ── POST /api/creator/approve/:userId — admin only ───────────────────────────
router.post("/creator/approve/:userId", requireAuth, async (req, res) => {
  if (req.user!.role !== "ADMIN" && req.user!.role !== "MODERATOR") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const creator = await db.creatorProfile.findUnique({
    where: { userId: req.params.userId },
  });
  if (!creator) {
    res.status(404).json({ error: "Creator profile not found" });
    return;
  }
  if (creator.isApproved) {
    res.status(409).json({ error: "Already approved" });
    return;
  }

  const now = new Date();
  await db.creatorProfile.update({
    where: { userId: req.params.userId },
    data: {
      isApproved: true,
      creatorActivatedAt: now,  // starts 90-day grace period
      revenueSharePct: 0.80,
    },
  });

  res.json({ ok: true, activatedAt: now, gracePeriodEndsAt: new Date(now.getTime() + GRACE_PERIOD_DAYS * 86_400_000) });
});

// ── PATCH /api/creator/settings ───────────────────────────────────────────────
const SettingsSchema = z.object({
  subscriptionPrice: z.number().int().min(0).max(10000).optional(),
  tipMenuItems: z
    .array(z.object({ label: z.string().max(50), credits: z.number().int().min(1) }))
    .max(10)
    .optional(),
});

router.patch("/creator/settings", requireAuth, async (req, res) => {
  const parsed = SettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const creator = await db.creatorProfile.update({
    where: { userId: req.user!.sub },
    data: parsed.data,
  });
  res.json(creator);
});

export default router;
