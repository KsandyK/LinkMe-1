import { Router } from "express";
import { z } from "zod";
import db from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { getRevenueSharePct, splitEarning } from "../lib/revenue.js";

const router = Router();

// Credit pack definitions — MUST match apps/web/src/pages/CreditsStore.tsx PACKAGES exactly.
// bonusCredits are included in x-credits so CCBill webhook credits the full amount.
const PACKS: Record<string, { credits: number; bonusCredits: number; usdCents: number }> = {
  starter:  { credits: 100,   bonusCredits: 0,    usdCents: 999    },
  basic:    { credits: 250,   bonusCredits: 5,    usdCents: 2499   },
  value:    { credits: 500,   bonusCredits: 25,   usdCents: 4999   },
  plus:     { credits: 1000,  bonusCredits: 75,   usdCents: 9999   },
  pro:      { credits: 2500,  bonusCredits: 250,  usdCents: 24999  },
  max:      { credits: 5000,  bonusCredits: 600,  usdCents: 49999  },
  ultra:    { credits: 10000, bonusCredits: 1500, usdCents: 99999  },
  diamond:  { credits: 20000, bonusCredits: 3500, usdCents: 199999 },
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
      bonusCredits: pack.bonusCredits,
      totalCredits: pack.credits + pack.bonusCredits,
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

  const totalCredits = pack.credits + pack.bonusCredits;

  // Build CCBill URL — x-credits carries the TOTAL (base + bonus) so the
  // webhook can add the correct amount to the user's balance in one shot.
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
    "x-credits":  totalCredits.toString(),
  });

  // Log pending transaction
  await db.transaction.create({
    data: {
      userId: req.user!.sub,
      amount: totalCredits,
      usdAmount: pack.usdCents / 100,
      type: "CREDIT_PURCHASE",
      status: "PENDING",
      paymentMethod: "ccbill",
      metadata: { packId: parsed.data.packId, baseCredits: pack.credits, bonusCredits: pack.bonusCredits },
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

  const pack = PACKS[packId];
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { credits: { increment: credits } } }),
    db.transaction.create({
      data: {
        userId,
        amount: credits,
        usdAmount: pack ? pack.usdCents / 100 : null,
        type: "CREDIT_PURCHASE",
        status: "COMPLETED",
        paymentMethod: "ccbill",
        reference: txId,
        metadata: {
          ccbill: req.body,
          packId,
          baseCredits: pack?.credits ?? null,
          bonusCredits: pack?.bonusCredits ?? null,
        },
      },
    }),
  ]);

  // ── Auto-verify age via CCBill ──────────────────────────────────────────────
  // CCBill independently verifies that all cardholders are 18+.
  // A completed payment is therefore proof of age — no separate ID upload needed.
  // Upsert so repeat purchases don't overwrite an already-verified record.
  // Only upgrade — never downgrade an already-verified record.
  const existing = await db.ageVerification.findUnique({ where: { userId }, select: { status: true } }).catch(() => null);
  if (existing?.status !== "VERIFIED") {
    await db.ageVerification.upsert({
      where: { userId },
      update: {
        status:      "VERIFIED",
        verifiedAt:  new Date(),
        reviewedBy:  "ccbill",
        dateOfBirth: null,   // GDPR minimisation: never retain raw DOB after verification
      },
      create: {
        userId,
        status:       "VERIFIED",
        documentType: "ccbill_payment",
        reviewedBy:   "ccbill",
        verifiedAt:   new Date(),
      },
    }).catch(() => {
      // Non-fatal: credits were already added. Log in production; ignore in dev.
    });
  }

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ops: any[] = [
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

// ── POST /api/credits/spend — generic server-confirmed spend ─────────────────
// Called by the frontend AppContext after an optimistic local deduction.
// Records the spend as a Transaction and returns the server-side balance.
const SpendSchema = z.object({
  amount: z.number().int().min(1),
  reason: z.string().max(200).optional(),
});

router.post("/credits/spend", requireAuth, async (req, res) => {
  const parsed = SpendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }
  const { amount, reason } = parsed.data;

  const user = await db.user.findUnique({ where: { id: req.user!.sub }, select: { credits: true } });
  if (!user || user.credits < amount) {
    res.status(402).json({ error: "Insufficient credits" });
    return;
  }

  const [updated] = await db.$transaction([
    db.user.update({ where: { id: req.user!.sub }, data: { credits: { decrement: amount } } }),
    db.transaction.create({
      data: {
        userId: req.user!.sub,
        amount: -amount,
        type: "CREDIT_SPEND_TIP",   // generic spend bucket
        status: "COMPLETED",
        metadata: { reason: reason ?? "Credits spent" },
      },
    }),
  ]);

  res.json({ balance: updated.credits });
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
