/**
 * Age Verification Pipeline
 *
 * Flow:
 *   1. User submits DOB + document type            POST /api/age-verify/submit
 *   2. API issues a presigned S3 PUT URL           POST /api/age-verify/upload-url  (type: "id" | "selfie")
 *   3. Browser uploads file directly to S3        (no API server involvement)
 *   4. User confirms both uploads complete         POST /api/age-verify/confirm
 *   5. Status: PENDING → UNDER_REVIEW (admin queue)
 *   6. Admin views docs via signed GET URL         GET  /api/age-verify/:userId/view-url?type=id|selfie
 *   7. Admin approves or rejects                   PATCH /api/age-verify/:userId (requireAdmin)
 *
 * Raw documents NEVER touch this API server — S3 ↔ browser direct.
 * Only encrypted S3 key references are stored in the DB.
 * Documents are deleted from S3 after verification (admin trigger or scheduled cleanup).
 */

import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import db from "../lib/db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// ── Encryption helpers ────────────────────────────────────────────────────────
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

// ── S3 client ─────────────────────────────────────────────────────────────────
const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  ...(process.env.AWS_ACCESS_KEY_ID
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
        },
      }
    : {}),
});

const AGE_VERIFY_BUCKET = process.env.AGE_VERIFY_S3_BUCKET ?? "cravr-age-verify-dev";

/** Generate a presigned PUT URL — browser uploads directly to S3 */
async function presignedPutUrl(s3Key: string, contentType: string): Promise<string> {
  try {
    const cmd = new PutObjectCommand({
      Bucket: AGE_VERIFY_BUCKET,
      Key: s3Key,
      ContentType: contentType,
      ServerSideEncryption: "aws:kms",
      SSEKMSKeyId: process.env.AGE_VERIFY_KMS_KEY_ID,
    });
    return await getSignedUrl(s3, cmd, { expiresIn: 300 });
  } catch {
    // No AWS credentials in dev — return a placeholder that the frontend handles gracefully
    return `https://${AGE_VERIFY_BUCKET}.s3.amazonaws.com/${s3Key}?X-Amz-Signature=dev-placeholder`;
  }
}

/** Generate a presigned GET URL — admin views a document temporarily */
async function presignedGetUrl(s3Key: string): Promise<string> {
  try {
    const cmd = new GetObjectCommand({ Bucket: AGE_VERIFY_BUCKET, Key: s3Key });
    return await getSignedUrl(s3, cmd, { expiresIn: 900 }); // 15 min view window
  } catch {
    return `https://${AGE_VERIFY_BUCKET}.s3.amazonaws.com/${s3Key}?X-Amz-Signature=dev-placeholder`;
  }
}

/** Delete a document from S3 (called on rejection and post-approval cleanup) */
async function deleteS3Object(s3Key: string): Promise<void> {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: AGE_VERIFY_BUCKET, Key: s3Key }));
  } catch {
    // Fire-and-forget — log in production; ignore in dev
  }
}

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

// ── POST /api/age-verify/upload-url ──────────────────────────────────────────
// ?type=id (front of ID) | selfie (selfie holding ID)
// Returns a presigned PUT URL so the browser can upload directly to S3.
const UploadUrlSchema = z.object({
  type: z.enum(["id", "selfie"]),
  contentType: z.string().regex(/^image\/(jpeg|png|webp)|application\/pdf$/, "Only JPEG, PNG, WebP, or PDF").default("image/jpeg"),
});

router.post("/age-verify/upload-url", requireAuth, async (req, res) => {
  const record = await db.ageVerification.findUnique({ where: { userId: req.user!.sub } });
  if (!record || !["PENDING", "REJECTED"].includes(record.status)) {
    res.status(400).json({ error: "Submit verification details first" });
    return;
  }

  const parsed = UploadUrlSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
    return;
  }

  const { type, contentType } = parsed.data;
  const ext = contentType === "application/pdf" ? "pdf" : contentType.split("/")[1];
  const s3Key = `age-verify/${req.user!.sub}/${type}/${crypto.randomBytes(16).toString("hex")}.${ext}`;
  const encryptedRef = encryptRef(s3Key);

  // Store the encrypted ref immediately so confirm() can verify both are present
  await db.ageVerification.update({
    where: { userId: req.user!.sub },
    data: type === "id" ? { documentRef: encryptedRef } : { selfieRef: encryptedRef },
  });

  const uploadUrl = await presignedPutUrl(s3Key, contentType);
  res.json({ uploadUrl, s3Key, expiresIn: 300 });
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
    const s3Key = decryptRef(encryptedRef);
    const url = await presignedGetUrl(s3Key);
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
        ? { status: "VERIFIED", verifiedAt: now, reviewedBy: req.user!.sub }
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
      deleteS3Object(decryptRef(existing.documentRef));
      if (existing.selfieRef) deleteS3Object(decryptRef(existing.selfieRef));
    } catch {}
  }

  // Notify user
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
  }

  res.json({ id: record.id, status: record.status, userId: record.userId });
});

export default router;
