import { Router } from "express";
import { z } from "zod";
import db from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Boost packages — matches apps/web/src/lib/membership-tiers.ts BOOST_TIERS exactly.
// creditCost is priceUsd × 10 (1 credit = $0.10) rounded to nearest 10.
const BOOST_PACKAGES = {
  starter:   { name: "Starter",   boosts: 2,    priceUsd: 4.99,    creditCost: 50,    durationDays: 30 },
  spark:     { name: "Spark",     boosts: 4,    priceUsd: 9.99,    creditCost: 100,   durationDays: 30 },
  flame:     { name: "Flame",     boosts: 8,    priceUsd: 19.99,   creditCost: 200,   durationDays: 30 },
  blaze:     { name: "Blaze",     boosts: 14,   priceUsd: 29.99,   creditCost: 300,   durationDays: 30 },
  inferno:   { name: "Inferno",   boosts: 22,   priceUsd: 39.99,   creditCost: 400,   durationDays: 30 },
  legend:    { name: "Legend",    boosts: 36,   priceUsd: 59.99,   creditCost: 600,   durationDays: 30 },
  titan:     { name: "Titan",     boosts: 50,   priceUsd: 99.99,   creditCost: 1000,  durationDays: 30 },
  supernova: { name: "Supernova", boosts: 70,   priceUsd: 149.99,  creditCost: 1500,  durationDays: 30 },
  colossus:  { name: "Colossus",  boosts: 95,   priceUsd: 199.99,  creditCost: 2000,  durationDays: 30 },
  dynasty:   { name: "Dynasty",   boosts: 150,  priceUsd: 399.99,  creditCost: 4000,  durationDays: 30 },
  overlord:  { name: "Overlord",  boosts: 230,  priceUsd: 749.99,  creditCost: 7500,  durationDays: 30 },
  conqueror: { name: "Conqueror", boosts: 380,  priceUsd: 1499.99, creditCost: 15000, durationDays: 30 },
  emperor:   { name: "Emperor",   boosts: 550,  priceUsd: 2999.99, creditCost: 30000, durationDays: 30 },
  sovereign: { name: "Sovereign", boosts: 9999, priceUsd: 4999.99, creditCost: 50000, durationDays: 30 },
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
const BOOST_PACKAGE_IDS = Object.keys(BOOST_PACKAGES) as Array<keyof typeof BOOST_PACKAGES>;
const SubscribeSchema = z.object({
  packageId: z.enum(BOOST_PACKAGE_IDS as [string, ...string[]]),
});

router.post("/boosts/subscribe", requireAuth, async (req, res) => {
  const parsed = SubscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid package" });
    return;
  }

  const pkg = BOOST_PACKAGES[parsed.data.packageId as keyof typeof BOOST_PACKAGES];
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
