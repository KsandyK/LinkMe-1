import { Router } from "express";
import { z } from "zod";
import db from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { getRevenueSharePct, splitEarning } from "../lib/revenue.js";

const router = Router();

// ── POST /api/content/unlock ──────────────────────────────────────────────────
// Unlocks a single piece of premium content for the authenticated user.
//
// - Deducts credits from the buyer
// - Writes a ContentUnlock record (idempotent via unique constraint)
// - Writes a CreatorEarning ledger entry (type UNLOCK)
// - Updates the creator's totalEarnings + monthlyEarnings
// - Returns { ok, contentId, creatorCredits, processingFee, platformFee }
const UnlockSchema = z.object({
  contentId:     z.string().min(1),
  creatorUserId: z.string().min(1),   // userId of the creator who owns the content
  creditCost:    z.number().int().min(1).max(100_000),
  contentType:   z.enum(["PHOTO", "VIDEO", "STREAM", "PRIVATE_MESSAGE"]).optional().default("PHOTO"),
});

router.post("/content/unlock", requireAuth, async (req, res) => {
  const parsed = UnlockSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
    return;
  }
  const { contentId, creatorUserId, creditCost, contentType } = parsed.data;
  const buyerId = req.user!.sub;

  if (creatorUserId === buyerId) {
    res.status(400).json({ error: "Cannot unlock your own content" });
    return;
  }

  // Check the content isn't already unlocked (avoids double-charge)
  const existing = await db.contentUnlock.findUnique({
    where: { userId_contentId: { userId: buyerId, contentId } },
  });
  if (existing) {
    res.json({ ok: true, contentId, alreadyUnlocked: true });
    return;
  }

  // Verify buyer has enough credits
  const buyer = await db.user.findUnique({ where: { id: buyerId }, select: { credits: true } });
  if (!buyer || buyer.credits < creditCost) {
    res.status(402).json({ error: "Insufficient credits", required: creditCost });
    return;
  }

  // Look up creator's profile for the earnings split
  const creatorProfile = await db.creatorProfile.findUnique({
    where: { userId: creatorUserId },
    select: { id: true, creatorActivatedAt: true, monthlyEarnings: true, revenueSharePct: true },
  });

  const revenueSharePct = creatorProfile
    ? getRevenueSharePct(creatorProfile.creatorActivatedAt, creatorProfile.monthlyEarnings)
    : 0;
  const { processingFee, creatorCredits, platformFee } = splitEarning(creditCost, revenueSharePct);

  // Build transaction operations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ops: any[] = [
    // Deduct from buyer
    db.user.update({
      where: { id: buyerId },
      data: { credits: { decrement: creditCost } },
    }),
    // Record the unlock
    db.contentUnlock.create({
      data: { userId: buyerId, contentId, contentType, creditCost },
    }),
    // Buyer transaction log
    db.transaction.create({
      data: {
        userId: buyerId,
        amount: -creditCost,
        type: "CREDIT_SPEND_UNLOCK",
        status: "COMPLETED",
        metadata: { contentId, creatorUserId, contentType },
      },
    }),
  ];

  if (creatorProfile) {
    ops.push(
      // Earnings ledger entry
      db.creatorEarning.create({
        data: {
          creatorId: creatorProfile.id,
          spenderId: buyerId,
          type: "UNLOCK",
          grossCredits: creditCost,
          processingFee,
          platformFee,
          creatorCredits,
          revenueSharePct,
          referenceId: contentId,
        },
      }) as any,
      // Update creator totals
      db.creatorProfile.update({
        where: { id: creatorProfile.id },
        data: {
          totalEarnings:   { increment: creatorCredits },
          monthlyEarnings: { increment: creatorCredits },
          revenueSharePct,
        },
      }) as any,
    );
  }

  const txResults = await db.$transaction(ops) as any[];
  const buyerBalance = (txResults[0] as { credits: number }).credits;

  res.status(201).json({
    ok: true,
    contentId,
    creditCost,
    creatorCredits,
    processingFee,
    platformFee,
    revenueSharePct,
    buyerBalance,
  });
});

// ── GET /api/content/unlocked ─────────────────────────────────────────────────
// Returns the list of contentIds the current user has unlocked.
router.get("/content/unlocked", requireAuth, async (req, res) => {
  const unlocks = await db.contentUnlock.findMany({
    where:   { userId: req.user!.sub },
    select:  { contentId: true, contentType: true, creditCost: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(unlocks);
});

export default router;
