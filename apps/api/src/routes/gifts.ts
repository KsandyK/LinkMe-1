import { Router } from "express";
import { z } from "zod";
import db from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { getRevenueSharePct, splitEarning } from "../lib/revenue.js";

const router = Router();

const GIFT_CATALOGUE: Record<string, { name: string; emoji: string; creditCost: number; category: string }> = {
  "rose":          { name: "Rose",          emoji: "🌹", creditCost: 10,   category: "romantic" },
  "diamond":       { name: "Diamond",       emoji: "💎", creditCost: 500,  category: "luxury"   },
  "heart":         { name: "Heart",         emoji: "❤️", creditCost: 20,  category: "romantic" },
  "champagne":     { name: "Champagne",     emoji: "🥂", creditCost: 75,   category: "luxury"   },
  "teddy":         { name: "Teddy Bear",    emoji: "🧸", creditCost: 30,   category: "sweet"    },
  "crown":         { name: "Crown",         emoji: "👑", creditCost: 1000, category: "prestige" },
  "fire":          { name: "Fire",          emoji: "🔥", creditCost: 50,   category: "fun"      },
  "shooting-star": { name: "Shooting Star", emoji: "🌠", creditCost: 200,  category: "luxury"   },
  "cake":          { name: "Birthday Cake", emoji: "🎂", creditCost: 40,   category: "sweet"    },
  "rocket":        { name: "Rocket",        emoji: "🚀", creditCost: 150,  category: "fun"      },
};

// GET /api/gifts
router.get("/gifts", (_req, res) => {
  res.json(Object.entries(GIFT_CATALOGUE).map(([id, g]) => ({ id, ...g })));
});

// POST /api/gifts/send
const SendGiftSchema = z.object({
  giftId: z.string(),
  recipientId: z.string(),
  feedId: z.string().optional(),
});

router.post("/gifts/send", requireAuth, async (req, res) => {
  const parsed = SendGiftSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const gift = GIFT_CATALOGUE[parsed.data.giftId];
  if (!gift) { res.status(400).json({ error: "Unknown gift" }); return; }
  if (parsed.data.recipientId === req.user!.sub) { res.status(400).json({ error: "Cannot gift yourself" }); return; }

  const sender = await db.user.findUnique({ where: { id: req.user!.sub } });
  if (!sender || sender.credits < gift.creditCost) {
    res.status(402).json({ error: "Insufficient credits", required: gift.creditCost });
    return;
  }

  // Look up creator profile for the recipient to calculate revenue split
  const recipientCreator = await db.creatorProfile.findUnique({
    where: { userId: parsed.data.recipientId },
    select: { id: true, creatorActivatedAt: true, monthlyEarnings: true, revenueSharePct: true },
  });

  const revenueSharePct = recipientCreator
    ? getRevenueSharePct(recipientCreator.creatorActivatedAt, recipientCreator.monthlyEarnings)
    : 0;
  const { processingFee, creatorCredits, platformFee } = splitEarning(gift.creditCost, revenueSharePct);

  const txOps: Parameters<typeof db.$transaction>[0] = [
    db.user.update({ where: { id: req.user!.sub }, data: { credits: { decrement: gift.creditCost } } }),
    db.transaction.create({
      data: {
        userId: req.user!.sub,
        amount: -gift.creditCost,
        type: "CREDIT_SPEND_GIFT",
        status: "COMPLETED",
        metadata: { giftId: parsed.data.giftId, recipientId: parsed.data.recipientId },
      },
    }),
    db.gift.create({
      data: {
        senderId: req.user!.sub,
        receiverId: parsed.data.recipientId,
        name: gift.name,
        emoji: gift.emoji,
        creditCost: gift.creditCost,
      },
    }),
  ];

  // Write earnings ledger entry if recipient is a creator
  if (recipientCreator) {
    txOps.push(
      db.creatorEarning.create({
        data: {
          creatorId: recipientCreator.id,
          spenderId: req.user!.sub,
          type: "GIFT",
          grossCredits: gift.creditCost,
          processingFee,
          platformFee,
          creatorCredits,
          revenueSharePct,
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

  const [, , giftRecord] = await db.$transaction(txOps);

  db.notification.create({
    data: {
      userId: parsed.data.recipientId,
      type: "gift_received",
      title: `${gift.emoji} ${gift.name} received!`,
      body: `${sender.username} sent you a ${gift.name}`,
      data: { giftId: parsed.data.giftId, senderId: req.user!.sub },
    },
  }).catch(() => null);

  res.status(201).json(giftRecord);
});

// GET /api/gifts/received
router.get("/gifts/received", requireAuth, async (req, res) => {
  const gifts = await db.gift.findMany({
    where: { receiverId: req.user!.sub },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      sender: { select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
    },
  });
  res.json(gifts);
});

export default router;
