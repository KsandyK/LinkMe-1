/**
 * Age Verification Pipeline
 *
 * Flow:
 *   1. User submits DOB + document type            POST /api/age-verify/submit
 *   2. API creates a signed S3 upload URL          POST /api/age-verify/upload-url
 *   3. Frontend uploads directly to S3 (presigned)
 *   4. User confirms upload complete               POST /api/age-verify/confirm
 *   5. Status goes PENDING → UNDER_REVIEW (admin queue)
 *   6. Admin approves/rejects                      PATCH /api/age-verify/:userId (requireAdmin)
 *
 * Raw documents never touch this API server — they go S3 ↔ browser directly.
 * Only an encrypted S3 key reference is stored in the DB.
 */

import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import db from "../lib/db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

const ENC_KEY = Buffer.from(process.env.AGE_VERIFY_ENCRYPTION_KEY ?? "00".repeat(32), "hex");

function encryptRef(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENC_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
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
// Returns a pre-signed S3 upload URL so the client can upload directly.
// In production wire this to @aws-sdk/client-s3 createPresignedPost.
// Here we generate the document reference key and return it; real presigning needs AWS SDK.
router.post("/age-verify/upload-url", requireAuth, async (req, res) => {
  const record = await db.ageVerification.findUnique({ where: { userId: req.user!.sub } });
  if (!record || record.status !== "PENDING") {
    res.status(400).json({ error: "Submit verification details first" });
    return;
  }

  // Generate a unique S3 key for this document
  const s3Key = `age-verify/${req.user!.sub}/${crypto.randomBytes(16).toString("hex")}`;
  const encryptedRef = encryptRef(s3Key);

  await db.ageVerification.update({
    where: { userId: req.user!.sub },
    data: { documentRef: encryptedRef },
  });

  // In production: return await createPresignedUploadUrl(s3Key)
  const bucket = process.env.AGE_VERIFY_S3_BUCKET ?? "linkme-age-verify-dev";
  res.json({
    uploadUrl: `https://${bucket}.s3.amazonaws.com/${s3Key}`,  // placeholder
    s3Key,
    expiresIn: 300, // 5 minutes
    fields: { "Content-Type": "image/jpeg" },
  });
});

// ── POST /api/age-verify/confirm ──────────────────────────────────────────────
// Called after frontend finishes uploading to S3 directly
router.post("/age-verify/confirm", requireAuth, async (req, res) => {
  const record = await db.ageVerification.findUnique({ where: { userId: req.user!.sub } });
  if (!record || !record.documentRef) {
    res.status(400).json({ error: "No document upload in progress" });
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
      body: `User ${req.user!.username} submitted verification`,
      data: { userId: req.user!.sub },
    },
  }).catch(() => null);

  res.json({ status: "UNDER_REVIEW", message: "Document received. Review typically takes 1–2 business days." });
});

// ── PATCH /api/age-verify/:userId — admin approve/reject ──────────────────────
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

  const record = await db.ageVerification.update({
    where: { userId: String(req.params.userId) },
    data:
      action === "approve"
        ? { status: "VERIFIED", verifiedAt: now, reviewedBy: req.user!.sub }
        : {
            status: "REJECTED",
            rejectedAt: now,
            rejectedReason: reason ?? "Document not accepted",
            reviewedBy: req.user!.sub,
            documentRef: null, // purge reference on rejection
          },
  });

  // Update user role label if needed
  if (action === "approve") {
    // setAgeVerificationStatus is managed by the record; no role change needed
    await db.notification.create({
      data: {
        userId: String(req.params.userId),
        type: "age_verify_approved",
        title: "Age Verification Approved ✓",
        body: "Your identity has been verified. You now have full access to LinkMe.",
        data: {},
      },
    });
  } else {
    await db.notification.create({
      data: {
        userId: String(req.params.userId),
        type: "age_verify_rejected",
        title: "Age Verification Rejected",
        body: reason ?? "Your document was not accepted. Please re-submit.",
        data: {},
      },
    });
  }

  res.json(record);
});

// ── GET /api/age-verify/queue — admin view ─────────────────────────────────────
router.get("/age-verify/queue", requireAdmin, async (req, res) => {
  const pending = await db.ageVerification.findMany({
    where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, username: true, email: true } } },
  });
  res.json(pending);
});

export default router;
