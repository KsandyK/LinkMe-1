import { Router } from "express";
import { z } from "zod";
import db from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const BOOST_PACKAGES = {
  spark:   { name: "Spark",   boosts: 5,  priceUsd: 9.99,  creditCost: 100,  durationDays: 30 },
  flame:   { name: "Flame",   boosts: 12, priceUsd: 19.99, creditCost: 200,  durationDays: 30 },
  inferno: { name: "Inferno", boosts: 20, priceUsd: 34.99, creditCost: 350,  durationDays: 30 },
  legend:  { name: "Legend",  boosts: 35, priceUsd: 59.99, creditCost: 600,  durationDays: 30 },
} as const;

// GET /api/boosts/packages
router.get("/boosts/packages", (_req, res) => {
  res.json(
    Object.entries(BOOST_PACKAGES).map(([id, pkg]) => ({ id, ...pkg })),
  );
});

// GET /api/boosts/active
router.get("/boosts/active", requireAuth, async (req, res) => {
  const active = await db.boostPurchase.findFirst({
    where: { userId: req.user!.sub, endsAt: { gte: new Date() } },
    orderBy: { endsAt: "desc" },
  });
  res.json(active ?? null);
});

// POST /api/boosts/subscribe
const SubscribeSchema = z.object({
  packageId: z.enum(["spark", "flame", "inferno", "legend"]),
});

router.post("/boosts/subscribe", requireAuth, async (req, res) => {
  const parsed = SubscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid package" });
    return;
  }

  const pkg = BOOST_PACKAGES[parsed.data.packageId];
  const user = await db.user.findUnique({ where: { id: req.user!.sub } });
  if (!user || user.credits < pkg.creditCost) {
    res.status(402).json({ error: "Insufficient credits", required: pkg.creditCost });
    return;
  }

  const endsAt = new Date(Date.now() + pkg.durationDays * 86_400_000);

  const [, boost] = await db.$transaction([
    db.user.update({ where: { id: req.user!.sub }, data: { credits: { decrement: pkg.creditCost } } }),
    db.boostPurchase.create({
      data: {
        userId: req.user!.sub,
        package: parsed.data.packageId,
        boostsTotal: pkg.boosts,
        creditCost: pkg.creditCost,
        endsAt,
      },
    }),
    db.transaction.create({
      data: {
        userId: req.user!.sub,
        amount: -pkg.creditCost,
        type: "CREDIT_SPEND_UNLOCK",
        status: "COMPLETED",
        metadata: { packageId: parsed.data.packageId },
      },
    }),
  ]);

  res.status(201).json(boost);
});

// POST /api/boosts/use — consume one boost charge
router.post("/boosts/use", requireAuth, async (req, res) => {
  const boost = await db.boostPurchase.findFirst({
    where: { userId: req.user!.sub, endsAt: { gte: new Date() } },
    orderBy: { endsAt: "asc" },
  });

  if (!boost) { res.status(404).json({ error: "No active boost package" }); return; }
  if (boost.boostsUsed >= boost.boostsTotal) {
    res.status(402).json({ error: "All boosts used for this period" });
    return;
  }

  const updated = await db.boostPurchase.update({
    where: { id: boost.id },
    data: { boostsUsed: { increment: 1 } },
  });
  res.json(updated);
});

export default router;
