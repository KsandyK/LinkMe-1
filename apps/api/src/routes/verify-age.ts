/**
 * Identity / Age Verification Pipeline (Bunny private storage)
 *
 * Members  → age-verified via CCBill purchase (see credits webhook).
 * Creators → full identity verification here: government ID + selfie.
 *
 * Flow:
 *   1. POST /api/age-verify/submit          — DOB + document type
 *   2. POST /api/age-verify/upload-doc      — raw image body (?type=id|selfie) → private Bunny path
 *   3. POST /api/age-verify/confirm         — both uploaded → UNDER_REVIEW
 *   4. GET  /api/age-verify/queue           — admin list (requireAdmin)
 *   5. GET  /api/age-verify/:userId/view-url?type=id|selfie — admin: short-lived signed Bunny URL
 *   6. PATCH /api/age-verify/:userId        — admin approve / reject
 *
 * Documents are stored at a PRIVATE Bunny path (id-verify/…) which must require
 * token authentication on the pull zone. Only an AES-encrypted path reference is
 * stored in the DB. Documents are deleted from Bunny on rejection.
 */

import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import db from "../lib/db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { Emails } from "../lib/email.js";
import { uploadFile, signCdnUrl, deleteFile } from "../lib/bunny.js";

const router = Router();

// ── Encryption helpers (encrypt the stored storage path) ──────────────────────
const ENC_KEY = Buffer.from(process.env.AGE_VERIFY_ENCRYPTION_KEY ?? "00".repeat(32), "hex");

function encryptRef(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENC_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptRef(ciphertext: string): string {
  const [ivHex, encHex] = ciphertext.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENC_KEY, iv);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

// ── Bunny private storage for ID documents ────────────────────────────────────
// PRIVATE prefix — the Bunny pull zone MUST require token auth on /id-verify/*.
function idDocPath(userId: string, type: "id" | "selfie", ext: string): string {
  return `id-verify/${userId}/${type}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
}

// ── POST /api/age-verify/request-manual ───────────────────────────────────────
// Temporary path while CCBill (purchase-based verification) is not yet live.
// Flags the user for admin review and emails the support inbox. An admin then
// approves via the admin queue (PATCH /api/age-verify/:userId).
router.post("/age-verify/request-manual", requireAuth, async (req, res) => {
  const existing = await db.ageVerification.findUnique({ where: { userId: req.user!.sub } });
  if (existing?.status === "VERIFIED") {
    res.status(409).json({ error: "Already verified" });
    return;
  }

  await db.ageVerification.upsert({
    where: { userId: req.user!.sub },
    update: { status: "UNDER_REVIEW", documentType: "manual_request" },
    create: { userId: req.user!.sub, status: "UNDER_REVIEW", documentType: "manual_request" },
  });

  // Email the support/admin inbox (fire-and-forget)
  const me = await db.user.findUnique({
    where: { id: req.user!.sub },
    select: { username: true, email: true },
  });
  const supportInbox = process.env.SUPPORT_EMAIL ?? "support@cravr.fun";
  Emails.manualVerifyRequest(
    supportInbox,
    me?.username ?? req.user!.username,
    me?.email ?? "",
    req.user!.sub,
  ).catch(() => null);

  res.json({ status: "UNDER_REVIEW", message: "Verification request submitted. Our team will review it shortly." });
});

// ── GET /api/age-verify/status ────────────────────────────────────────────────
router.get("/age-verify/status", requireAuth, async (req, res) => {
  const record = await db.ageVerification.findUnique({
    where: { userId: req.user!.sub },
    select: { status: true, rejectedReason: true, createdAt: true, verifiedAt: true },
  });
  res.json(record ?? { status: "NONE" });
});

// ── POST /api/age-verify/submit ───────────────────────────────────────────────
const SubmitSchema = z.object({
  documentType: z.enum(["passport", "drivers_license", "national_id"]),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
    .refine((dob) => {
      const age = (Date.now() - new Date(dob).getTime()) / (365.25 * 86_400_000);
      return age >= 18;
    }, "Must be 18 or older"),
});

router.post("/age-verify/submit", requireAuth, async (req, res) => {
  const parsed = SubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
    return;
  }

  const existing = await db.ageVerification.findUnique({ where: { userId: req.user!.sub } });
  if (existing?.status === "VERIFIED") {
    res.status(409).json({ error: "Already verified" });
    return;
  }
  if (existing?.status === "UNDER_REVIEW") {
    res.status(409).json({ error: "Verification already under review" });
    return;
  }

  const record = await db.ageVerification.upsert({
    where: { userId: req.user!.sub },
    update: {
      status: "PENDING",
      documentType: parsed.data.documentType,
      dateOfBirth: parsed.data.dateOfBirth,
      documentRef: null,
      selfieRef: null,
      rejectedAt: null,
      rejectedReason: null,
    },
    create: {
      userId: req.user!.sub,
      status: "PENDING",
      documentType: parsed.data.documentType,
      dateOfBirth: parsed.data.dateOfBirth,
    },
  });

  res.status(201).json({
    verificationId: record.id,
    status: record.status,
    message: "Verification initiated. Please upload your document.",
  });
});

// ── POST /api/age-verify/upload-doc?type=id|selfie ───────────────────────────
// Raw image body (image/jpeg|png|webp). Server uploads to a PRIVATE Bunny path
// and stores the AES-encrypted path. (image/* bypasses express.json, so the raw
// stream is readable here.)
router.post("/age-verify/upload-doc", requireAuth, async (req, res) => {
  const type: "id" | "selfie" = String(req.query.type ?? "") === "selfie" ? "selfie" : "id";
  const mimeType = String(req.headers["content-type"] ?? "");
  if (!/^image\/(jpeg|png|webp)$/.test(mimeType)) {
    res.status(400).json({ error: "Only JPEG, PNG, or WebP images accepted" });
    return;
  }

  const record = await db.ageVerification.findUnique({ where: { userId: req.user!.sub } });
  if (!record || !["PENDING", "REJECTED"].includes(record.status)) {
    res.status(400).json({ error: "Submit verification details first" });
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const buffer = Buffer.concat(chunks);
    if (buffer.length === 0) { res.status(400).json({ error: "Empty file" }); return; }
    if (buffer.length > 10 * 1024 * 1024) { res.status(413).json({ error: "File too large — maximum 10MB" }); return; }

    const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
    const path = idDocPath(req.user!.sub, type, ext);
    await uploadFile(path, buffer, mimeType);

    const encryptedRef = encryptRef(path);
    await db.ageVerification.update({
      where: { userId: req.user!.sub },
      data: type === "id" ? { documentRef: encryptedRef } : { selfieRef: encryptedRef },
    });

    res.status(201).json({ ok: true, type });
  } catch {
    res.status(500).json({ error: "Upload failed — storage unavailable" });
  }
});

// ── POST /api/age-verify/confirm ──────────────────────────────────────────────
// Called after both uploads complete — advances status to UNDER_REVIEW
router.post("/age-verify/confirm", requireAuth, async (req, res) => {
  const record = await db.ageVerification.findUnique({ where: { userId: req.user!.sub } });
  if (!record) {
    res.status(400).json({ error: "No verification in progress" });
    return;
  }
  if (!record.documentRef || !record.selfieRef) {
    res.status(400).json({ error: "Both ID document and selfie are required before confirming" });
    return;
  }

  await db.ageVerification.update({
    where: { userId: req.user!.sub },
    data: { status: "UNDER_REVIEW" },
  });

  // Notify admins (fire and forget)
  db.notification.create({
    data: {
      userId: "admin",
      type: "age_verify_pending",
      title: "New age verification pending",
      body: `User ${req.user!.username} submitted verification documents`,
      data: { userId: req.user!.sub },
    },
  }).catch(() => null);

  res.json({ status: "UNDER_REVIEW", message: "Documents received. Review typically takes 1–2 business days." });
});

// ── GET /api/age-verify/queue — admin: list pending/under_review ──────────────
router.get("/age-verify/queue", requireAdmin, async (req, res) => {
  const items = await db.ageVerification.findMany({
    where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, username: true, email: true } } },
  });

  // Map response — strip raw encrypted refs, expose presence flags instead
  res.json(items.map(r => ({
    id: r.id,
    userId: r.userId,
    status: r.status,
    documentType: r.documentType,
    dateOfBirth: r.dateOfBirth,
    createdAt: r.createdAt,
    hasDocument: !!r.documentRef,
    hasSelfie: !!r.selfieRef,
    user: r.user,
  })));
});

// ── GET /api/age-verify/:userId/view-url — admin: temporary view URL ─────────
router.get("/age-verify/:userId/view-url", requireAdmin, async (req, res) => {
  const userId = String(req.params.userId);
  const type = String(req.query.type ?? "") === "selfie" ? "selfie" : "id";

  const record = await db.ageVerification.findUnique({ where: { userId } });
  if (!record) {
    res.status(404).json({ error: "Verification record not found" });
    return;
  }

  const encryptedRef = type === "selfie" ? record.selfieRef : record.documentRef;
  if (!encryptedRef) {
    res.status(404).json({ error: `No ${type} document uploaded` });
    return;
  }

  try {
    const path = decryptRef(encryptedRef);
    const url = signCdnUrl(`/${path}`, 900); // 15-min signed Bunny URL
    res.json({ url, expiresIn: 900, type });
  } catch {
    res.status(500).json({ error: "Could not generate document view URL" });
  }
});

// ── PATCH /api/age-verify/:userId — admin: approve or reject ─────────────────
const ReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
});

router.patch("/age-verify/:userId", requireAdmin, async (req, res) => {
  const parsed = ReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const { action, reason } = parsed.data;
  const now = new Date();
  const userId = String(req.params.userId);

  const existing = await db.ageVerification.findUnique({ where: { userId } });
  if (!existing) {
    res.status(404).json({ error: "Verification record not found" });
    return;
  }

  const record = await db.ageVerification.update({
    where: { userId },
    data:
      action === "approve"
        ? {
            status:      "VERIFIED",
            verifiedAt:  now,
            reviewedBy:  req.user!.sub,
            dateOfBirth: null,   // GDPR minimisation: retain only the verified status, not the raw DOB
          }
        : {
            status: "REJECTED",
            rejectedAt: now,
            rejectedReason: reason ?? "Document not accepted",
            reviewedBy: req.user!.sub,
            documentRef: null,  // purge encrypted refs on rejection
            selfieRef: null,
          },
  });

  // Delete documents from S3 on rejection (approved docs stay for audit trail, purged after 30 days by lifecycle rule)
  if (action === "reject" && existing.documentRef) {
    try {
      deleteFile(decryptRef(existing.documentRef));
      if (existing.selfieRef) deleteFile(decryptRef(existing.selfieRef));
    } catch {}
  }

  // Notify user — DB notification + transactional email
  const notifiedUser = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, username: true },
  });

  if (action === "approve") {
    await db.notification.create({
      data: {
        userId,
        type: "age_verify_approved",
        title: "Age Verification Approved ✓",
        body: "Your identity has been verified. You now have full access to CRAVR.",
        data: {},
      },
    });
    if (notifiedUser?.email) {
      Emails.ageVerifyApproved(notifiedUser.email, notifiedUser.username).catch(() => null);
    }
  } else {
    await db.notification.create({
      data: {
        userId,
        type: "age_verify_rejected",
        title: "Age Verification Rejected",
        body: reason ?? "Your document was not accepted. Please re-submit with a clearer photo.",
        data: {},
      },
    });
    if (notifiedUser?.email) {
      Emails.ageVerifyRejected(
        notifiedUser.email,
        reason ?? "Your document was not accepted. Please re-submit with a clearer photo."
      ).catch(() => null);
    }
  }

  res.json({ id: record.id, status: record.status, userId: record.userId });
});

export default router;
