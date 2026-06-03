/**
 * CRAVR — Stream Key & SRS Webhook Routes
 *
 * GET  /api/streams/key            — return creator's RTMP key + Bunny HLS URL
 * POST /api/streams/key/regenerate — rotate the stream key
 * POST /api/streams/webhook/srs    — SRS on_publish / on_unpublish callbacks
 *
 * SRS webhook flow:
 *   1. Creator opens OBS, enters Server = rtmp://<domain>:1935/live
 *                              Stream Key = <their streamKey>
 *   2. OBS hits SRS → SRS POSTs on_publish to /api/streams/webhook/srs
 *   3. This handler validates the key, creates a LiveFeed, sets isLive = true
 *   4. Returns { code: 0 } → SRS allows the stream
 *   5. When OBS disconnects → SRS POSTs on_unpublish → we set isLive = false
 */

import { Router } from "express";
import crypto from "crypto";
import db from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateStreamKey(): string {
  // 24 random bytes → 48 hex chars — unguessable, URL-safe
  return crypto.randomBytes(24).toString("hex");
}

function buildUrls(streamKey: string) {
  // RTMP_HOST = the host where SRS accepts OBS connections (usually a stream.<domain>
  // subdomain pointing to your VPS, port 1935).
  const rtmpHost = process.env.RTMP_HOST ?? process.env.DOMAIN ?? "stream.cravr.fun";
  // CDN_BASE = where viewers fetch HLS from. We push SRS output through Bunny CDN so
  // your VPS bandwidth doesn't take the viewer load.
  const cdnBase = (process.env.BUNNY_CDN_URL ?? `https://${process.env.BUNNY_CDN_HOSTNAME ?? "cdn.cravr.fun"}`).replace(/\/$/, "");
  return {
    rtmpServer: `rtmp://${rtmpHost}:1935/live`,
    streamKey,
    hlsUrl:     `${cdnBase}/live/${streamKey}/index.m3u8`,
  };
}

// ── GET /api/streams/key ───────────────────────────────────────────────────────
// Returns (or lazily creates) the creator's stream key + connection URLs.
router.get("/streams/key", requireAuth, async (req, res) => {
  try {
    const creator = await db.creatorProfile.findUnique({
      where:  { userId: req.user!.sub },
      select: { id: true, isApproved: true, streamKey: true, streamKeyCreatedAt: true },
    });

    if (!creator?.isApproved) {
      res.status(403).json({ error: "Creator account not approved" });
      return;
    }

    let key = creator.streamKey;
    if (!key) {
      key = generateStreamKey();
      await db.creatorProfile.update({
        where: { id: creator.id },
        data:  { streamKey: key, streamKeyCreatedAt: new Date() },
      });
    }

    res.json({ ...buildUrls(key), createdAt: creator.streamKeyCreatedAt });
  } catch (err) {
    logger.error({ err }, "streams/key GET failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/streams/key/regenerate ──────────────────────────────────────────
// Rotates the stream key. Old key stops working immediately.
router.post("/streams/key/regenerate", requireAuth, async (req, res) => {
  try {
    const creator = await db.creatorProfile.findUnique({
      where:  { userId: req.user!.sub },
      select: { id: true, isApproved: true },
    });

    if (!creator?.isApproved) {
      res.status(403).json({ error: "Creator account not approved" });
      return;
    }

    const key = generateStreamKey();
    await db.creatorProfile.update({
      where: { id: creator.id },
      data:  { streamKey: key, streamKeyCreatedAt: new Date() },
    });

    logger.info({ creatorId: creator.id }, "Stream key regenerated");
    res.json({ ...buildUrls(key), createdAt: new Date() });
  } catch (err) {
    logger.error({ err }, "streams/key/regenerate failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/streams/webhook/srs ─────────────────────────────────────────────
// Called by SRS server when a stream starts or stops.
// Must return HTTP 200 + { "code": 0 } to allow; any other code rejects.
// This route is NOT behind requireAuth — it's server-to-server only.
// Protect it with SRS_WEBHOOK_SECRET env var + firewall (SRS → API internal).
router.post("/streams/webhook/srs", async (req, res) => {
  const {
    action,
    stream: streamKey,
    app,
    client_id,
  } = req.body as {
    action:     string;
    stream:     string;
    app:        string;
    client_id?: string;
    ip?:        string;
    vhost?:     string;
    param?:     string;
  };

  // Optional shared secret (set SRS_WEBHOOK_SECRET + srs.conf http_hooks secret)
  const secret = process.env.SRS_WEBHOOK_SECRET;
  if (secret) {
    const provided = req.headers["x-srs-secret"] ?? req.body.param?.replace("?secret=", "");
    if (provided !== secret) {
      logger.warn({ action, streamKey }, "SRS webhook: bad secret");
      res.json({ code: 1 }); // SRS rejects the stream
      return;
    }
  }

  // Only handle the "live" application
  if (app !== "live") {
    res.json({ code: 0 });
    return;
  }

  logger.info({ action, streamKey, client_id }, "SRS webhook received");

  try {
    if (action === "on_publish") {
      // ── Stream started ─────────────────────────────────────────────────────
      const creator = await db.creatorProfile.findFirst({
        where:   { streamKey },
        select:  { id: true, isApproved: true },
      });

      if (!creator || !creator.isApproved) {
        logger.warn({ streamKey }, "SRS on_publish: unknown or unapproved stream key");
        res.json({ code: 1 }); // reject — unknown key
        return;
      }

      // End any stale feed still marked live
      await db.liveFeed.updateMany({
        where: { creatorId: creator.id, isLive: true },
        data:  { isLive: false, endedAt: new Date() },
      });

      const hlsUrl = buildUrls(streamKey).hlsUrl;

      await Promise.all([
        db.liveFeed.create({
          data: {
            creatorId:   creator.id,
            title:       "Live Stream",   // creator updates this from Studio
            category:    "General",
            isLive:      true,
            hlsUrl,
            startedAt:   new Date(),
          },
        }),
        db.creatorProfile.update({
          where: { id: creator.id },
          data:  { isLive: true },
        }),
      ]);

      logger.info({ creatorId: creator.id, hlsUrl }, "Stream started");
      res.json({ code: 0 }); // allow

    } else if (action === "on_unpublish") {
      // ── Stream ended ───────────────────────────────────────────────────────
      const creator = await db.creatorProfile.findFirst({
        where:  { streamKey },
        select: { id: true },
      });

      if (creator) {
        await Promise.all([
          db.liveFeed.updateMany({
            where: { creatorId: creator.id, isLive: true },
            data:  { isLive: false, endedAt: new Date() },
          }),
          db.creatorProfile.update({
            where: { id: creator.id },
            data:  { isLive: false },
          }),
        ]);
        logger.info({ creatorId: creator.id }, "Stream ended");
      }

      res.json({ code: 0 });

    } else {
      // on_play, on_stop, on_dvr, etc. — allow by default
      res.json({ code: 0 });
    }
  } catch (err) {
    // Never crash SRS — always return 0 so existing streams aren't killed
    logger.error({ err, action, streamKey }, "SRS webhook handler error");
    res.json({ code: 0 });
  }
});

export default router;
