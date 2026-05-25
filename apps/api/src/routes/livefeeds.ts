import { Router } from "express";
import { z } from "zod";
import db from "../lib/db.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = Router();

// ── GET /api/livefeeds ────────────────────────────────────────────────────────
router.get("/livefeeds", optionalAuth, async (req, res) => {
  const { category, page = "1", limit = "20" } = req.query as Record<string, string>;

  const feeds = await db.liveFeed.findMany({
    where: {
      isLive: true,
      ...(category && category !== "all" && { category }),
    },
    orderBy: { viewerCount: "desc" },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    include: {
      creator: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
      },
    },
  });

  res.json(feeds);
});

// ── GET /api/livefeeds/:id ────────────────────────────────────────────────────
router.get("/livefeeds/:id", optionalAuth, async (req, res) => {
  const feed = await db.liveFeed.findUnique({
    where: { id: req.params.id },
    include: {
      creator: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profile: { select: { displayName: true, avatarUrl: true, coverUrl: true } },
            },
          },
        },
      },
      chatMessages: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!feed) {
    res.status(404).json({ error: "Live feed not found" });
    return;
  }
  res.json(feed);
});

// ── POST /api/livefeeds — start a stream ──────────────────────────────────────
const StartFeedSchema = z.object({
  title: z.string().min(1).max(120),
  category: z.string().min(1),
  isVip: z.boolean().default(false),
  thumbnailUrl: z.string().url().optional(),
  tags: z.array(z.string().max(30)).max(5).default([]),
});

router.post("/livefeeds", requireAuth, async (req, res) => {
  const parsed = StartFeedSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
    return;
  }

  const creator = await db.creatorProfile.findUnique({
    where: { userId: req.user!.sub },
  });
  if (!creator?.isApproved) {
    res.status(403).json({ error: "Creator account not approved" });
    return;
  }

  // End any existing live feed for this creator
  await db.liveFeed.updateMany({
    where: { creatorId: creator.id, isLive: true },
    data: { isLive: false, endedAt: new Date() },
  });

  const feed = await db.liveFeed.create({
    data: {
      creatorId: creator.id,
      ...parsed.data,
      isLive: true,
      startedAt: new Date(),
    },
  });

  // Mark creator as live
  await db.creatorProfile.update({
    where: { id: creator.id },
    data: { isLive: true },
  });

  res.status(201).json(feed);
});

// ── DELETE /api/livefeeds/:id — end a stream ─────────────────────────────────
router.delete("/livefeeds/:id", requireAuth, async (req, res) => {
  const feed = await db.liveFeed.findUnique({ where: { id: req.params.id } });
  if (!feed) {
    res.status(404).json({ error: "Feed not found" });
    return;
  }

  const creator = await db.creatorProfile.findUnique({
    where: { userId: req.user!.sub },
  });
  if (feed.creatorId !== creator?.id && req.user!.role !== "ADMIN") {
    res.status(403).json({ error: "Not your stream" });
    return;
  }

  await Promise.all([
    db.liveFeed.update({
      where: { id: feed.id },
      data: { isLive: false, endedAt: new Date() },
    }),
    db.creatorProfile.update({
      where: { id: feed.creatorId },
      data: { isLive: false },
    }),
  ]);

  res.json({ ok: true });
});

// ── POST /api/livefeeds/:id/chat ──────────────────────────────────────────────
// REST fallback — primary path is WebSocket
const ChatSchema = z.object({
  text: z.string().min(1).max(500),
  creditTip: z.number().int().min(0).default(0),
});

router.post("/livefeeds/:id/chat", requireAuth, async (req, res) => {
  const parsed = ChatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const feed = await db.liveFeed.findUnique({ where: { id: req.params.id } });
  if (!feed?.isLive) {
    res.status(404).json({ error: "Stream not found or ended" });
    return;
  }

  const user = await db.user.findUnique({
    where: { id: req.user!.sub },
    include: { profile: { select: { displayName: true } } },
  });

  if (parsed.data.creditTip > 0) {
    const ok = user && user.credits >= parsed.data.creditTip;
    if (!ok) {
      res.status(402).json({ error: "Insufficient credits" });
      return;
    }
    await db.user.update({
      where: { id: req.user!.sub },
      data: { credits: { decrement: parsed.data.creditTip } },
    });
  }

  const msg = await db.chatMessage.create({
    data: {
      feedId: feed.id,
      userId: req.user!.sub,
      username: user?.profile?.displayName ?? user?.username ?? "Anonymous",
      text: parsed.data.text,
      creditTip: parsed.data.creditTip,
    },
  });

  res.status(201).json(msg);
});

// ── PATCH /api/livefeeds/:id/sdp — store WebRTC SDP offer ───────────────────
router.patch("/livefeeds/:id/sdp", requireAuth, async (req, res) => {
  const { sdpOffer } = req.body as { sdpOffer: string };
  if (!sdpOffer) {
    res.status(400).json({ error: "sdpOffer required" });
    return;
  }

  const feed = await db.liveFeed.findUnique({ where: { id: req.params.id } });
  if (!feed?.isLive) {
    res.status(404).json({ error: "Stream not found" });
    return;
  }

  await db.liveFeed.update({ where: { id: feed.id }, data: { sdpOffer } });
  res.json({ ok: true });
});

export default router;
