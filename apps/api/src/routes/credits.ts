import { Router } from "express";
import { z } from "zod";
import db from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { getRevenueSharePct, splitEarning } from "../lib/revenue.js";

const router = Router();

// Credit pack definitions (mirror frontend CREDIT_PACKS)
const PACKS: Record<string, { credits: number; usdCents: number }> = {
  starter:    { credits: 100,  usdCents: 999  },
  popular:    { credits: 500,  usdCents: 3499 },
  value:      { credits: 1000, usdCents: 5999 },
  mega:       { credits: 2500, usdCents: 9999 },
  ultimate:   { credits: 5000, usdCents: 17499 },
};

// ── GET /api/credits/balance ──────────────────────────────────────────────────
router.get("/credits/balance", requireAuth, async (req, res) => {
  const user = await db.user.findUnique({
    where: { id: req.user!.sub },
    select: { credits: true },
  });
  res.json({ credits: user?.credits ?? 0 });
});

// ── GET /api/credits/packs ────────────────────────────────────────────────────
router.get("/credits/packs", (_req, res) => {
  res.json(
    Object.entries(PACKS).map(([id, pack]) => ({
      id,
      credits: pack.credits,
      usdCents: pack.usdCents,
      usd: (pack.usdCents / 100).toFixed(2),
    })),
  );
});

// ── POST /api/credits/purchase — initiate CCBill redirect ───────────────────
const PurchaseSchema = z.object({
  packId: z.string(),
  returnUrl: z.string().url().optional(),
});

router.post("/credits/purchase", requireAuth, async (req, res) => {
  const parsed = PurchaseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }
  const pack = PACKS[parsed.data.packId];
  if (!pack) {
    res.status(400).json({ error: "Invalid packId" });
    return;
  }

  // Build CCBill URL
  const params = new URLSearchParams({
    clientAccnum: process.env.CCBILL_CLIENT_ACCNUM ?? "",
    formName:     process.env.CCBILL_FORM_NAME ?? "",
    subAccount:   process.env.CCBILL_SUBACCOUNT ?? "",
    initialPeriod: "1",
    initialPeriodAmount: (pack.usdCents / 100).toFixed(2),
    initialPeriodIsRecurring: "0",
    currencyCode: "840",
    "x-userId":   req.user!.sub,
    "x-packId":   parsed.data.packId,
    "x-credits":  pack.credits.toString(),
  });

  // Log pending transaction
  await db.transaction.create({
    data: {
      userId: req.user!.sub,
      amount: pack.credits,
      usdAmount: pack.usdCents / 100,
      type: "CREDIT_PURCHASE",
      status: "PENDING",
      paymentMethod: "ccbill",
    },
  });

  const ccbillUrl = `https://secure.ccbill.com/jpost/signup.cgi?${params}`;
  res.json({ redirectUrl: ccbillUrl });
});

// ── POST /api/credits/webhook — CCBill server-to-server callback ─────────────
import crypto from "crypto";

router.post("/credits/webhook", async (req, res) => {
  const salt = process.env.CCBILL_SALT ?? "";
  const sig = req.body.signature ?? "";
  const txId = req.body.subscriptionId ?? req.body.transactionId ?? "";
  const computed = crypto.createHash("md5").update(txId + salt).digest("hex");

  if (computed.toLowerCase() !== sig.toLowerCase()) {
    res.status(403).json({ error: "Invalid signature" });
    return;
  }

  const userId = req.body["x-userId"] as string;
  const credits = Number(req.body["x-credits"] ?? 0);
  const packId  = req.body["x-packId"] as string;

  if (!userId || credits <= 0) {
    res.status(400).json({ error: "Missing user or credits" });
    return;
  }

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { credits: { increment: credits } } }),
    db.transaction.create({
      data: {
        userId,
        amount: credits,
        usdAmount: PACKS[packId]?.usdCents ? PACKS[packId].usdCents / 100 : null,
        type: "CREDIT_PURCHASE",
        status: "COMPLETED",
        paymentMethod: "ccbill",
        reference: txId,
        metadata: req.body,
      },
    }),
  ]);

  res.json({ ok: true });
});

// ── POST /api/credits/tip — send a tip to a creator ─────────────────────────
const TipSchema = z.object({
  recipientId: z.string(),
  amount: z.number().int().min(1).max(100_000),
  feedId: z.string().optional(),   // livestream feed if tipping during a stream
});

router.post("/credits/tip", requireAuth, async (req, res) => {
  const parsed = TipSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }
  const { recipientId, amount, feedId } = parsed.data;

  if (recipientId === req.user!.sub) {
    res.status(400).json({ error: "Cannot tip yourself" });
    return;
  }

  const sender = await db.user.findUnique({ where: { id: req.user!.sub } });
  if (!sender || sender.credits < amount) {
    res.status(402).json({ error: "Insufficient credits", required: amount });
    return;
  }

  const recipientCreator = await db.creatorProfile.findUnique({
    where: { userId: recipientId },
    select: { id: true, creatorActivatedAt: true, monthlyEarnings: true, revenueSharePct: true },
  });

  const revenueSharePct = recipientCreator
    ? getRevenueSharePct(recipientCreator.creatorActivatedAt, recipientCreator.monthlyEarnings)
    : 0;
  const { processingFee, creatorCredits, platformFee } = splitEarning(amount, revenueSharePct);

  const ops: Parameters<typeof db.$transaction>[0] = [
    db.user.update({ where: { id: req.user!.sub }, data: { credits: { decrement: amount } } }),
    db.transaction.create({
      data: {
        userId: req.user!.sub,
        amount: -amount,
        type: "CREDIT_SPEND_TIP",
        status: "COMPLETED",
        metadata: { recipientId, feedId: feedId ?? null },
      },
    }),
  ];

  if (recipientCreator) {
    ops.push(
      db.creatorEarning.create({
        data: {
          creatorId: recipientCreator.id,
          spenderId: req.user!.sub,
          type: "TIP",
          grossCredits: amount,
          processingFee,
          platformFee,
          creatorCredits,
          revenueSharePct,
          referenceId: feedId ?? null,
        },
      }) as any,
      db.creatorProfile.update({
        where: { id: recipientCreator.id },
        data: {
          totalEarnings: { increment: creatorCredits },
          monthlyEarnings: { increment: creatorCredits },
          revenueSharePct,
        },
      }) as any,
    );
  }

  await db.$transaction(ops);

  res.status(201).json({
    ok: true,
    grossCredits: amount,
    creatorCredits,
    processingFee,
    platformFee,
    revenueSharePct,
  });
});

// ── GET /api/credits/transactions ────────────────────────────────────────────
router.get("/credits/transactions", requireAuth, async (req, res) => {
  const { page = "1", limit = "25" } = req.query as Record<string, string>;
  const transactions = await db.transaction.findMany({
    where: { userId: req.user!.sub },
    orderBy: { createdAt: "desc" },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  });
  res.json(transactions);
});

export default router;
