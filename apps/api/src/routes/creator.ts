import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import db from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { getRevenueSharePct, revenueTierLabel, nextRevenueTier, CREDITS_PER_USD, GRACE_PERIOD_DAYS } from "../lib/revenue.js";

const router = Router();

// ── Referrals (milestone tier-boost model — matches Creator Agreement §2.9) ──
// A referrer earns a one-time permanent revenue-share rate boost once they have
// REFERRAL_TARGET_COUNT qualifying referrals (approved creators active 30+ days)
// whose COLLECTIVE rolling-30-day earnings reach REFERRAL_TARGET_CREDITS.
// Fraud-resistant: the $10k/mo collective bar requires real paying customers —
// farmed/zero-earning accounts never move the earnings milestone.
const REFERRAL_TARGET_COUNT = 25;
const REFERRAL_TARGET_CREDITS = 100_000;          // $10,000 (1 credit = $0.10)
const REFERRAL_MIN_ACTIVE_MS = 30 * 24 * 60 * 60 * 1000; // referee must be 30+ days active
const REFERRAL_BOOST_INCREMENT = 0.03;            // +3 percentage points
const REFERRAL_BOOST_CAP = 0.90;                  // capped at 90%

/** Generate a shareable referral code from a username, e.g. LUNA_ROSE-A1B2. */
function genReferralCode(username: string): string {
  const base = username.toUpperCase().replace(/[^A-Z0-9_]/g, "").slice(0, 14) || "CRAVR";
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase(); // 4 hex chars
  return `${base}-${suffix}`;
}

/** Generate a referral code that doesn't collide with an existing one. */
async function uniqueReferralCode(username: string): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const code = genReferralCode(username);
    const clash = await db.creatorProfile.findUnique({ where: { referralCode: code }, select: { id: true } });
    if (!clash) return code;
  }
  // Extremely unlikely fallback
  return genReferralCode(username + crypto.randomBytes(2).toString("hex"));
}

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
  const monthlyEarningsUsd = creator.monthlyEarnings / CREDITS_PER_USD;
  const daysSinceActivation = creator.creatorActivatedAt
    ? Math.floor((Date.now() - creator.creatorActivatedAt.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const inGracePeriod = daysSinceActivation <= GRACE_PERIOD_DAYS;
  const graceDaysRemaining = inGracePeriod ? GRACE_PERIOD_DAYS - daysSinceActivation : 0;
  const next = inGracePeriod ? null : nextRevenueTier(monthlyEarningsUsd);

  res.json({
    profile: creator,
    stats: {
      totalEarnings: creator.totalEarnings,
      monthlyEarnings: creator.monthlyEarnings,
      subscriberCount: creator.subscriberCount,
    },
    revenueShare: {
      pct: revenueSharePct,
      label: revenueTierLabel(revenueSharePct, monthlyEarningsUsd),
      inGracePeriod,
      graceDaysRemaining,
      monthlyEarningsUsd,
      nextTier: next,   // { label, thresholdUsd, pct } or null if at Pinnacle
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
  // Default to 0 (free subscriptions) — creator can update via PATCH /api/creator/settings later
  subscriptionPrice: z.number().int().min(0).max(10000).default(0),
  // Optional referral code for tracking creator-to-creator referrals
  referralCode: z.string().max(20).optional(),
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

  // ── Referral capture (anti-fraud) ──────────────────────────────────────────
  // Set ONCE here and never updated again. The referrer must be an existing,
  // approved creator and cannot be the applicant (no self-referral).
  let referredById: string | null = null;
  if (parsed.data.referralCode) {
    const code = parsed.data.referralCode.trim().toUpperCase();
    const referrer = await db.creatorProfile.findUnique({
      where: { referralCode: code },
      select: { userId: true, isApproved: true },
    });
    if (referrer && referrer.isApproved && referrer.userId !== req.user!.sub) {
      referredById = referrer.userId;
    }
    // Invalid/own codes are silently ignored so a typo never blocks an application.
  }

  const me = await db.user.findUnique({ where: { id: req.user!.sub }, select: { username: true } });
  const myReferralCode = await uniqueReferralCode(me?.username ?? "cravr");

  const [creatorProfile] = await db.$transaction([
    db.creatorProfile.create({
      data: {
        userId: req.user!.sub,
        subscriptionPrice: parsed.data.subscriptionPrice,
        tipMenuItems: parsed.data.tipMenuItems ?? [],
        isApproved: false, // pending admin review
        referralCode: myReferralCode,
        referredById,
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

// ── GET /api/creator/referral/check?code= — validate a referral code ─────────
router.get("/creator/referral/check", requireAuth, async (req, res) => {
  const code = String(req.query.code ?? "").trim().toUpperCase();
  if (!code) { res.json({ valid: false }); return; }
  const referrer = await db.creatorProfile.findUnique({
    where: { referralCode: code },
    select: {
      isApproved: true, userId: true,
      user: { select: { username: true, profile: { select: { displayName: true } } } },
    },
  });
  // Valid only if it belongs to an approved creator who isn't the requester
  const valid = !!referrer && referrer.isApproved && referrer.userId !== req.user!.sub;
  res.json({ valid, referrerName: valid ? (referrer!.user.profile?.displayName ?? referrer!.user.username) : null });
});

// ── GET /api/creator/referrals — signed-in creator's code + milestone stats ──
router.get("/creator/referrals", requireAuth, async (req, res) => {
  const me = await db.creatorProfile.findUnique({
    where: { userId: req.user!.sub },
    select: { referralCode: true, referralBoostClaimed: true, revenueSharePct: true },
  });
  if (!me) { res.status(404).json({ error: "Not a creator" }); return; }

  const referred = await db.creatorProfile.findMany({
    where: { referredById: req.user!.sub },
    select: {
      isApproved: true, createdAt: true, monthlyEarnings: true,
      user: { select: { username: true, profile: { select: { displayName: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Qualifying = approved + active 30+ days. Collective earnings = sum of their
  // rolling-30-day monthlyEarnings (real revenue only).
  const cutoff = Date.now() - REFERRAL_MIN_ACTIVE_MS;
  const qualifying = referred.filter(r => r.isApproved && r.createdAt.getTime() <= cutoff);
  const collectiveMonthlyCredits = qualifying.reduce((sum, r) => sum + (r.monthlyEarnings ?? 0), 0);

  const eligible =
    qualifying.length >= REFERRAL_TARGET_COUNT &&
    collectiveMonthlyCredits >= REFERRAL_TARGET_CREDITS;

  res.json({
    code: me.referralCode,
    boostClaimed: me.referralBoostClaimed,
    currentRevenueSharePct: me.revenueSharePct,
    qualifyingCount: qualifying.length,
    targetCount: REFERRAL_TARGET_COUNT,
    collectiveMonthlyCredits,
    targetCredits: REFERRAL_TARGET_CREDITS,
    eligible,
    referrals: referred.map(r => ({
      name: r.user.profile?.displayName ?? r.user.username,
      username: r.user.username,
      joinedAt: r.createdAt,
      approved: r.isApproved,
    })),
  });
});

// ── POST /api/creator/referral/claim-boost — claim the one-time tier boost ───
router.post("/creator/referral/claim-boost", requireAuth, async (req, res) => {
  const me = await db.creatorProfile.findUnique({
    where: { userId: req.user!.sub },
    select: { id: true, referralBoostClaimed: true, revenueSharePct: true },
  });
  if (!me) { res.status(404).json({ error: "Not a creator" }); return; }
  if (me.referralBoostClaimed) { res.status(409).json({ error: "Boost already claimed" }); return; }

  // Re-verify eligibility server-side (never trust the client)
  const cutoff = Date.now() - REFERRAL_MIN_ACTIVE_MS;
  const referred = await db.creatorProfile.findMany({
    where: { referredById: req.user!.sub, isApproved: true },
    select: { createdAt: true, monthlyEarnings: true },
  });
  const qualifying = referred.filter(r => r.createdAt.getTime() <= cutoff);
  const collective = qualifying.reduce((s, r) => s + (r.monthlyEarnings ?? 0), 0);
  if (qualifying.length < REFERRAL_TARGET_COUNT || collective < REFERRAL_TARGET_CREDITS) {
    res.status(403).json({ error: "Referral milestones not yet met" });
    return;
  }

  const newPct = Math.min(REFERRAL_BOOST_CAP, me.revenueSharePct + REFERRAL_BOOST_INCREMENT);
  await db.creatorProfile.update({
    where: { id: me.id },
    data: { revenueSharePct: newPct, referralBoostClaimed: true },
  });
  res.json({ ok: true, revenueSharePct: newPct });
});

// ── POST /api/creator/approve/:userId — admin only ───────────────────────────
router.post("/creator/approve/:userId", requireAuth, async (req, res) => {
  if (req.user!.role !== "ADMIN" && req.user!.role !== "MODERATOR") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const targetUserId = String(req.params.userId);
  const creator = await db.creatorProfile.findUnique({
    where: { userId: targetUserId },
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
    where: { userId: targetUserId },
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

// ── POST /api/creator/monthly-reset — ADMIN cron endpoint ────────────────────
// Resets monthlyEarnings to 0 for all creators so revenue tiers recalculate
// against the new month's earnings. Call via cron job on the 1st of each month.
router.post("/creator/monthly-reset", requireAuth, async (req, res) => {
  if (req.user!.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { count } = await db.creatorProfile.updateMany({
    data: { monthlyEarnings: 0 },
  });

  res.json({ ok: true, creatorsReset: count, resetAt: new Date() });
});

export default router;
