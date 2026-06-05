import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import db from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import {
  generateSecret,
  buildOtpAuthUri,
  generateQRDataUrl,
  encryptSecret,
  decryptSecret,
  verifyToken,
} from "../lib/totp.js";

const router = Router();

/** POST /api/totp/setup — generate a new TOTP secret + QR code */
router.post("/totp/setup", requireAuth, async (req, res) => {
  const user = await db.user.findUnique({
    where: { id: req.user!.sub },
    select: { username: true, totpEnabled: true },
  });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (user.totpEnabled) { res.status(400).json({ error: "TOTP already enabled" }); return; }

  const secret = generateSecret();
  const uri = buildOtpAuthUri(secret, user.username);
  const qrDataUrl = await generateQRDataUrl(uri);

  // Store encrypted secret but don't enable yet — user must verify first
  await db.user.update({
    where: { id: req.user!.sub },
    data: { totpSecret: encryptSecret(secret) },
  });

  res.json({ secret, qrDataUrl, otpauthUri: uri });
});

const VerifySchema = z.object({ token: z.string().length(6) });

/** POST /api/totp/verify — confirm setup by verifying a token from the user's app */
router.post("/totp/verify", requireAuth, async (req, res) => {
  const parsed = VerifySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "6-digit token required" }); return; }

  const user = await db.user.findUnique({
    where: { id: req.user!.sub },
    select: { totpSecret: true, totpEnabled: true },
  });
  if (!user || !user.totpSecret) { res.status(400).json({ error: "Run /totp/setup first" }); return; }
  if (user.totpEnabled) { res.status(400).json({ error: "TOTP already enabled" }); return; }

  const secret = decryptSecret(user.totpSecret);
  if (!verifyToken(secret, parsed.data.token)) {
    res.status(401).json({ error: "Invalid code — check your authenticator app and try again" });
    return;
  }

  await db.user.update({
    where: { id: req.user!.sub },
    data: { totpEnabled: true },
  });

  res.json({ ok: true });
});

const DisableSchema = z.object({ password: z.string().min(1) });

/** POST /api/totp/disable — remove TOTP (requires password confirmation) */
router.post("/totp/disable", requireAuth, async (req, res) => {
  const parsed = DisableSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Password required" }); return; }

  const user = await db.user.findUnique({
    where: { id: req.user!.sub },
    select: { passwordHash: true, totpEnabled: true },
  });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (!user.totpEnabled) { res.status(400).json({ error: "TOTP is not enabled" }); return; }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) { res.status(401).json({ error: "Incorrect password" }); return; }

  await db.user.update({
    where: { id: req.user!.sub },
    data: { totpEnabled: false, totpSecret: null },
  });

  res.json({ ok: true });
});

/** GET /api/totp/status — check if TOTP is enabled for the current user */
router.get("/totp/status", requireAuth, async (req, res) => {
  const user = await db.user.findUnique({
    where: { id: req.user!.sub },
    select: { totpEnabled: true },
  });
  res.json({ enabled: user?.totpEnabled ?? false });
});

export default router;
