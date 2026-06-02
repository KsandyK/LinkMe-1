import { Router } from "express";
import { z } from "zod";
import db from "../lib/db.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = Router();

// ── GET /api/stats ─────────────────────────────────────────────────────────
// Public homepage stats — real counts (no fabricated numbers).
router.get("/stats", async (_req, res) => {
  const [creators, members, liveNow] = await Promise.all([
    db.creatorProfile.count({ where: { isApproved: true, user: { isActive: true } } }),
    db.user.count({ where: { isActive: true } }),
    db.creatorProfile.count({ where: { isApproved: true, isLive: true, user: { isActive: true } } }),
  ]);
  res.json({ creators, members, liveNow });
});

// ── GET /api/profiles ────────────────────────────────────────────────────────
// Public — supports search, live filter, pagination
router.get("/profiles", optionalAuth, async (req, res) => {
  const { live, sort, page = "1", limit = "20" } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    isApproved: true,
    user: { isActive: true },
    ...(live === "true" && { isLive: true }),
  };

  const userSelect = {
    user: {
      select: {
        id: true,
        username: true,
        profile: {
          select: {
            displayName: true, avatarUrl: true, coverUrl: true, location: true, isVerified: true,
          },
        },
      },
    },
  };

  // "newest" / "top" are explicit user-chosen orderings — boost does NOT override them.
  if (sort === "newest" || sort === "top") {
    const orderBy = sort === "newest"
      ? [{ createdAt: "desc" as const }]
      : [{ totalEarnings: "desc" as const }, { subscriberCount: "desc" as const }];
    const [profiles, total] = await Promise.all([
      db.creatorProfile.findMany({ where, skip, take: Number(limit), orderBy, include: userSelect }),
      db.creatorProfile.count({ where }),
    ]);
    res.json({ profiles, total, page: Number(page), limit: Number(limit) });
    return;
  }

  // Default "popular" ranking — boost-weighted placement.
  // Active boost holders rank first, weighted by tier (boostsTotal: Sovereign 9999 … Starter 2),
  // then live status, then subscriber count. Degrades to the old behaviour when no boosts exist.
  const [allCreators, activeBoosts] = await Promise.all([
    db.creatorProfile.findMany({ where, take: 500, include: userSelect }),
    db.boostPurchase.findMany({
      where: { endsAt: { gte: new Date() } },
      select: { userId: true, boostsTotal: true },
    }),
  ]);

  // userId → highest active boost weight
  const weightByUser = new Map<string, number>();
  for (const b of activeBoosts) {
    weightByUser.set(b.userId, Math.max(weightByUser.get(b.userId) ?? 0, b.boostsTotal));
  }

  allCreators.sort((a, b) => {
    const wa = weightByUser.get(a.userId) ?? 0;
    const wb = weightByUser.get(b.userId) ?? 0;
    if (wb !== wa) return wb - wa;                       // boosted first, by tier
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1; // live next
    return b.subscriberCount - a.subscriberCount;        // then popularity
  });

  const total = allCreators.length;
  const profiles = allCreators.slice(skip, skip + Number(limit));
  res.json({ profiles, total, page: Number(page), limit: Number(limit) });
});

// ── GET /api/profiles/:id ─────────────────────────────────────────────────────
router.get("/profiles/:id", optionalAuth, async (req, res) => {
  const creator = await db.creatorProfile.findFirst({
    where: { userId: String(req.params.id), isApproved: true },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          credits: true,
          createdAt: true,
          profile: true,
          ageVerification: { select: { status: true } },
        },
      },
    },
  });

  if (!creator) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(creator);
});

// ── PATCH /api/profiles/me ────────────────────────────────────────────────────
const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(60).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
  location: z.string().max(100).optional(),
});

router.patch("/profiles/me", requireAuth, async (req, res) => {
  const parsed = UpdateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
    return;
  }

  const profile = await db.profile.upsert({
    where: { userId: req.user!.sub },
    update: parsed.data,
    create: { userId: req.user!.sub, displayName: parsed.data.displayName ?? "Member", ...parsed.data },
  });

  res.json(profile);
});

export default router;
