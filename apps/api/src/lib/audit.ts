/**
 * CRAVR — Admin audit log helper
 *
 * Fire-and-forget recorder used by every admin endpoint. Never throws — a
 * logging failure must not block the actual administrative action.
 *
 * Usage:
 *   await recordAdminAction({
 *     adminId: req.user!.sub,
 *     adminUsername: req.user!.username,
 *     actionType: "verify_approve",
 *     targetType: "user",
 *     targetId: targetUserId,
 *     targetLabel: `@${target.username}`,
 *     metadata: { documentType: "passport" },
 *   });
 */
import db from "./db.js";
import { logger } from "./logger.js";

export interface AdminActionInput {
  adminId: string;
  adminUsername: string;
  actionType: string;
  targetType: "user" | "report" | "content" | "verification" | "flag" | "creator_profile";
  targetId: string;
  targetLabel?: string;
  metadata?: Record<string, unknown>;
}

export async function recordAdminAction(input: AdminActionInput): Promise<void> {
  try {
    await db.adminAction.create({
      data: {
        adminId:       input.adminId,
        adminUsername: input.adminUsername,
        actionType:    input.actionType,
        targetType:    input.targetType,
        targetId:      input.targetId,
        targetLabel:   input.targetLabel ?? null,
        metadata:      input.metadata ?? undefined,
      },
    });
  } catch (err) {
    // Don't fail the underlying action — just log it.
    logger.warn({ err, input }, "Failed to record admin action");
  }
}
