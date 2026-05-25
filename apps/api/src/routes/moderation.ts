import { Router } from "express";
import { z } from "zod";
import db from "../lib/db.js";
import { requireAuth, requireModerator, requireAdmin } from "../middleware/auth.js";

const router = Router();

// ── POST /api/moderation/report — any authenticated user ─────────────────────
const ReportSchema = z.object({
  reportedUserId: z.string().optional(),
  contentType: z.string().optional(),
  contentId: z.string().optional(),
  reason: z.enum([
    "harassment",
    "illegal_content",
    "underage_suspicion",
    "spam",
    "impersonation",
    "non_consensual",
    "other",
  ]),
  details: z.string().max(1000).optional(),
});

router.post("/moderation/report", requireAuth, async (req, res) => {
  const parsed = ReportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
    return;
  }

  if (!parsed.data.reportedUserId && !parsed.data.contentId) {
    res.status(400).json({ error: "Must specify reportedUserId or contentId" });
    return;
  }
  if (parsed.data.reportedUserId === req.user!.sub) {
    res.status(400).json({ error: "Cannot report yourself" });
    return;
  }

  // Elevate priority for underage suspicion — handled immediately
  const priority = parsed.data.reason === "underage_suspicion" ? 2
    : parsed.data.reason === "illegal_content"     ? 1
    : 0;

  const report = await db.moderationReport.create({
    data: {
      reporterId: req.user!.sub,
      ...parsed.data,
      priority,
    },
  });

  // If critical, auto-flag for immediate review
  if (priority === 2) {
    await db.contentFlag.create({
      data: {
        contentType: parsed.data.contentType ?? "user",
        contentId: parsed.data.reportedUserId ?? parsed.data.contentId ?? "",
        flagType: "report",
        confidence: 1.0,
        metadata: { reportId: report.id, reason: parsed.data.reason },
      },
    });
  }

  res.status(201).json({ reportId: report.id, message: "Report submitted — thank you." });
});

// ── GET /api/moderation/reports — moderator queue ────────────────────────────
router.get("/moderation/reports", requireModerator, async (req, res) => {
  const { status = "PENDING", priority, page = "1", limit = "25" } = req.query as Record<string, string>;

  const where = {
    status: status as any,
    ...(priority !== undefined && { priority: Number(priority) }),
  };

  const [reports, total] = await Promise.all([
    db.moderationReport.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        reporter: { select: { id: true, username: true } },
        reportedUser: { select: { id: true, username: true, role: true } },
      },
    }),
    db.moderationReport.count({ where }),
  ]);

  res.json({ reports, total });
});

// ── PATCH /api/moderation/reports/:id — resolve ──────────────────────────────
const ResolveSchema = z.object({
  action: z.enum(["RESOLVED_ACTION", "RESOLVED_NO_ACTION", "DISMISSED", "UNDER_REVIEW"]),
  resolution: z.string().max(1000).optional(),
  // Optional enforcement actions
  enforce: z.object({
    banUser: z.boolean().default(false),
    deactivateUser: z.boolean().default(false),
    removeContent: z.boolean().default(false),
    warnUser: z.boolean().default(false),
  }).optional(),
});

router.patch("/moderation/reports/:id", requireModerator, async (req, res) => {
  const parsed = ResolveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const report = await db.moderationReport.findUnique({ where: { id: req.params.id } });
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  const updated = await db.moderationReport.update({
    where: { id: req.params.id },
    data: {
      status: parsed.data.action as any,
      resolution: parsed.data.resolution,
      resolvedBy: req.user!.sub,
      resolvedAt: new Date(),
    },
  });

  // Enforcement actions
  if (parsed.data.enforce && report.reportedUserId) {
    const { banUser, deactivateUser, warnUser } = parsed.data.enforce;

    if (banUser || deactivateUser) {
      await db.user.update({
        where: { id: report.reportedUserId },
        data: { isActive: false },
      });
      // Revoke all sessions
      await db.session.deleteMany({ where: { userId: report.reportedUserId } });
    }

    if (warnUser) {
      await db.notification.create({
        data: {
          userId: report.reportedUserId,
          type: "moderation_warning",
          title: "Account Warning",
          body: "Your account has received a moderation warning. Please review our Community Guidelines.",
          data: { reportId: report.id },
        },
      });
    }
  }

  res.json(updated);
});

// ── GET /api/moderation/flags — automated flags ───────────────────────────────
router.get("/moderation/flags", requireModerator, async (req, res) => {
  const flags = await db.contentFlag.findMany({
    where: { reviewed: false },
    orderBy: [{ confidence: "desc" }, { createdAt: "asc" }],
    take: 50,
  });
  res.json(flags);
});

// ── PATCH /api/moderation/flags/:id — mark reviewed ──────────────────────────
router.patch("/moderation/flags/:id", requireModerator, async (req, res) => {
  const flag = await db.contentFlag.update({
    where: { id: req.params.id },
    data: { reviewed: true },
  });
  res.json(flag);
});

// ── GET /api/moderation/stats — admin dashboard ───────────────────────────────
router.get("/moderation/stats", requireAdmin, async (req, res) => {
  const [pending, critical, resolvedToday, totalFlags] = await Promise.all([
    db.moderationReport.count({ where: { status: "PENDING" } }),
    db.moderationReport.count({ where: { status: "PENDING", priority: 2 } }),
    db.moderationReport.count({
      where: {
        status: { in: ["RESOLVED_ACTION", "RESOLVED_NO_ACTION", "DISMISSED"] },
        resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    db.contentFlag.count({ where: { reviewed: false } }),
  ]);

  res.json({ pending, critical, resolvedToday, totalFlags });
});

export default router;
