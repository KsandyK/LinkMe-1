import { Router } from "express";
import { z } from "zod";
import db from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { getRevenueSharePct, splitEarning } from "../lib/revenue.js";

const router = Router();

// ── POST /api/subscriptions — subscribe to a creator ────────────────────────
// Charges the subscriber's credit balance, records the Subscription, writes
// a CreatorEarning (type SUBSCRIPTION), and updates the creator's totals.
const SubscribeSchema = z.object({
  creatorId: z.string().min(1),    // the creator's userId
  tier: z.string().default("basic"),
});

router.post("/subscriptions", requireAuth, async (req, res) => {
  const parsed = SubscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
    return;
  }
  const { creatorId, tier } = parsed.data;
  const subscriberId = req.user!.sub;

  if (creatorId === subscriberId) {
    res.status(400).json({ error: "Cannot subscribe to yourself" });
    return;
  }

  // Look up the creator's profile and subscription price
  const creatorProfile = await db.creatorProfile.findUnique({
    where: { userId: creatorId, isApproved: true },
    select: {
      id: true,
      subscriptionPrice: true,
      creatorActivatedAt: true,
      monthlyEarnings: true,
      revenueSharePct: true,
      subscriberCount: true,
    },
  });
  if (!creatorProfile) {
    res.status(404).json({ error: "Creator not found" });
    return;
  }
  if (creatorProfile.subscriptionPrice <= 0) {
    res.status(400).json({ error: "This creator does not charge for subscriptions" });
    return;
  }

  const creditCost = creatorProfile.subscriptionPrice;

  // Check subscriber has enough credits
  const subscriber = await db.user.findUnique({
    where: { id: subscriberId },
    select: { credits: true },
  });
  if (!subscriber || subscriber.credits < creditCost) {
    res.status(402).json({ error: "Insufficient credits", required: creditCost });
    return;
  }

  // Check for existing active subscription (prevent double-billing)
  const existing = await db.subscription.findFirst({
    where: {
      subscriberId,
      creatorId,
      status: "ACTIVE",
      endsAt: { gte: new Date() },
    },
  });
  if (existing) {
    res.status(409).json({ error: "Already subscribed", endsAt: existing.endsAt });
    return;
  }

  // Calculate revenue split
  const revenueSharePct = getRevenueSharePct(
    creatorProfile.creatorActivatedAt,
    creatorProfile.monthlyEarnings,
  );
  const { processingFee, creatorCredits, platformFee } = splitEarning(creditCost, revenueSharePct);

  const endsAt = new Date(Date.now() + 30 * 86_400_000); // 30-day subscription

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ops: any[] = [
    // Deduct from subscriber
    db.user.update({
      where: { id: subscriberId },
      data: { credits: { decrement: creditCost } },
    }),
    // Create subscription record (endsAt = 30 days)
    db.subscription.create({
      data: {
        subscriberId,
        creatorId,
        tier,
        status: "ACTIVE",
        creditCost,
        endsAt,
      },
    }),
    // Subscriber transaction log
    db.transaction.create({
      data: {
        userId: subscriberId,
        amount: -creditCost,
        type: "SUBSCRIPTION_PAYMENT",
        status: "COMPLETED",
        metadata: { creatorId, tier },
      },
    }),
    // Earnings ledger entry for the creator
    db.creatorEarning.create({
      data: {
        creatorId: creatorProfile.id,
        spenderId: subscriberId,
        type: "SUBSCRIPTION",
        grossCredits: creditCost,
        processingFee,
        platformFee,
        creatorCredits,
        revenueSharePct,
      },
    }),
    // Update creator totals
    db.creatorProfile.update({
      where: { id: creatorProfile.id },
      data: {
        totalEarnings:   { increment: creatorCredits },
        monthlyEarnings: { increment: creatorCredits },
        subscriberCount: { increment: 1 },
        revenueSharePct,
      },
    }),
  ];

  const results = await db.$transaction(ops) as any[];
  const subscription = results[1];

  res.status(201).json({
    ok: true,
    subscription,
    creditCost,
    creatorCredits,
    processingFee,
    platformFee,
    revenueSharePct,
    endsAt,
  });
});

// ── GET /api/subscriptions — list the current user's active subscriptions ────
router.get("/subscriptions", requireAuth, async (req, res) => {
  const subs = await db.subscription.findMany({
    where: { subscriberId: req.user!.sub, status: "ACTIVE", endsAt: { gte: new Date() } },
    orderBy: { createdAt: "desc" },
    include: {
      creator: {
        select: {
          username: true,
          profile: { select: { displayName: true, avatarUrl: true } },
          creatorProfile: { select: { subscriptionPrice: true } },
        },
      },
    },
  });
  res.json(subs);
});

// ── DELETE /api/subscriptions/:id — cancel a subscription ────────────────────
// Sets status to CANCELLED; user retains access until endsAt.
router.delete("/subscriptions/:id", requireAuth, async (req, res) => {
  const sub = await db.subscription.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!sub || sub.subscriberId !== req.user!.sub) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }
  if (sub.status !== "ACTIVE") {
    res.status(400).json({ error: "Subscription is not active" });
    return;
  }

  const updated = await db.subscription.update({
    where: { id: sub.id },
    data: { status: "CANCELLED" },
  });

  res.json({ ok: true, subscription: updated, accessUntil: sub.endsAt });
});

export default router;
