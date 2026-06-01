import { Router } from "express";
import { z } from "zod";
import db from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { getRevenueSharePct, splitEarning } from "../lib/revenue.js";
import { uploadFile, signCdnUrl, publicCdnUrl, BunnyPaths, deleteFile } from "../lib/bunny.js";
import { createVideoUpload, deleteVideo, getTusHeaders } from "../lib/bunny-stream.js";

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

// ── GET /api/content/my — creator's own library ───────────────────────────────
router.get("/content/my", requireAuth, async (req, res) => {
  const items = await db.creatorContent.findMany({
    where: { creatorId: req.user!.sub },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  // Sign URLs for videos; leave photos as public CDN
  const mapped = items.map(item => ({
    ...item,
    accessUrl: item.type === "VIDEO" && item.bunnyVideoId
      ? signCdnUrl(`/${item.bunnyVideoId}/playlist.m3u8`, 3600)
      : publicCdnUrl(item.mediaUrl),
  }));
  res.json(mapped);
});

// ── GET /api/content/creator/:creatorId — public listing (published only) ────
router.get("/content/creator/:creatorId", async (req, res) => {
  const items = await db.creatorContent.findMany({
    where: { creatorId: String(req.params.creatorId), isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true, title: true, type: true, thumbnailUrl: true,
      creditCost: true, sortOrder: true, createdAt: true,
      // mediaUrl omitted — only unlocked users get the real URL
    },
  });
  res.json(items);
});

// ── POST /api/content/upload-photo — upload photo to Bunny storage ───────────
// Accepts raw binary body (Content-Type: image/jpeg|png|webp)
// Max 20MB — enforce via nginx/express in production
router.post("/content/upload-photo", requireAuth, async (req, res) => {
  const mimeType = req.headers["content-type"] ?? "image/jpeg";
  if (!/^image\/(jpeg|png|webp)$/.test(mimeType)) {
    res.status(400).json({ error: "Only JPEG, PNG, or WebP images accepted" });
    return;
  }

  const titleRaw = String(req.headers["x-content-title"] ?? "Untitled");
  const creditCost = Math.max(1, parseInt(String(req.headers["x-credit-cost"] ?? "50"), 10) || 50);
  const title = titleRaw.slice(0, 100);

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const buffer = Buffer.concat(chunks);

    if (buffer.length > 20 * 1024 * 1024) {
      res.status(413).json({ error: "File too large — maximum 20MB" });
      return;
    }

    const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
    const contentId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = BunnyPaths.content(req.user!.sub, contentId, ext);

    const { url } = await uploadFile(path, buffer, mimeType);

    // Persist to DB
    const item = await db.creatorContent.create({
      data: {
        creatorId: req.user!.sub,
        title,
        type: "PHOTO",
        mediaUrl: path,
        thumbnailUrl: url,
        creditCost,
        sortOrder: 0,
      },
    });

    res.status(201).json({ ...item, accessUrl: url });
  } catch {
    res.status(500).json({ error: "Upload failed — storage unavailable" });
  }
});

// ── POST /api/content/create-video — initiate Bunny Stream TUS upload ────────
const CreateVideoSchema = z.object({
  title:      z.string().min(1).max(100),
  creditCost: z.number().int().min(1).max(100_000),
});

router.post("/content/create-video", requireAuth, async (req, res) => {
  const parsed = CreateVideoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
    return;
  }
  const { title, creditCost } = parsed.data;

  try {
    const { videoId, uploadUrl, embedUrl, hlsUrl } = await createVideoUpload(title);

    // Create DB record (mediaUrl = Bunny video ID, confirmed on completion)
    const item = await db.creatorContent.create({
      data: {
        creatorId: req.user!.sub,
        title,
        type: "VIDEO",
        mediaUrl: videoId,
        bunnyVideoId: videoId,
        creditCost,
        isPublished: false, // hide until upload confirmed
      },
    });

    res.status(201).json({
      contentId: item.id,
      videoId,
      uploadUrl,
      embedUrl,
      hlsUrl,
      tusHeaders: getTusHeaders(videoId),
    });
  } catch {
    res.status(500).json({ error: "Could not create video — stream service unavailable" });
  }
});

// ── PATCH /api/content/:id/confirm — mark video as published after TUS upload ─
router.patch("/content/:id/confirm", requireAuth, async (req, res) => {
  const item = await db.creatorContent.findUnique({ where: { id: String(req.params.id) } });
  if (!item || item.creatorId !== req.user!.sub) {
    res.status(404).json({ error: "Content not found" });
    return;
  }
  const updated = await db.creatorContent.update({
    where: { id: item.id },
    data: { isPublished: true },
  });
  res.json(updated);
});

// ── PATCH /api/content/:id — update title, price, order, visibility ──────────
const UpdateSchema = z.object({
  title:       z.string().min(1).max(100).optional(),
  creditCost:  z.number().int().min(1).max(100_000).optional(),
  sortOrder:   z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

router.patch("/content/:id", requireAuth, async (req, res) => {
  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
    return;
  }
  const item = await db.creatorContent.findUnique({ where: { id: String(req.params.id) } });
  if (!item || item.creatorId !== req.user!.sub) {
    res.status(404).json({ error: "Content not found" });
    return;
  }
  const updated = await db.creatorContent.update({
    where: { id: item.id },
    data: parsed.data,
  });
  res.json(updated);
});

// ── DELETE /api/content/:id ───────────────────────────────────────────────────
router.delete("/content/:id", requireAuth, async (req, res) => {
  const item = await db.creatorContent.findUnique({ where: { id: String(req.params.id) } });
  if (!item || item.creatorId !== req.user!.sub) {
    res.status(404).json({ error: "Content not found" });
    return;
  }

  // Delete from Bunny (fire-and-forget)
  if (item.type === "PHOTO") {
    deleteFile(item.mediaUrl).catch(() => null);
  } else if (item.bunnyVideoId) {
    deleteVideo(item.bunnyVideoId).catch(() => null);
  }

  await db.creatorContent.delete({ where: { id: item.id } });
  res.json({ ok: true });
});

export default router;
