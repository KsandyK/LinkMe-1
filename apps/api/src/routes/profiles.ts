import { Router } from "express";
import { z } from "zod";
import db from "../lib/db.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = Router();

// ── GET /api/profiles ────────────────────────────────────────────────────────
// Public — supports search, live filter, pagination
router.get("/profiles", optionalAuth, async (req, res) => {
  const { search, live, page = "1", limit = "20" } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    user: { isActive: true, role: { in: ["CREATOR"] as const } },
    ...(live === "true" && { isLive: true }),
    ...(search && {
      OR: [
        { displayName: { contains: search, mode: "insensitive" as const } },
        { bio: { contains: search, mode: "insensitive" as const } },
        { location: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [profiles, total] = await Promise.all([
    db.creatorProfile.findMany({
      where: { isApproved: true, user: { isActive: true } },
      skip,
      take: Number(limit),
      orderBy: [{ isLive: "desc" }, { subscriberCount: "desc" }],
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                coverUrl: true,
                location: true,
                isVerified: true,
              },
            },
          },
        },
      },
    }),
    db.creatorProfile.count({
      where: { isApproved: true, user: { isActive: true } },
    }),
  ]);

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
