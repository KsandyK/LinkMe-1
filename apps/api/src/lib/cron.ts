/**
 * CRAVR — Background cleanup jobs
 *
 * Runs inside the main API process using setInterval — no external
 * scheduler or additional dependencies required.
 *
 * Jobs:
 *  • purgeChatMessages   — delete ChatMessage rows older than 7 days
 *  • purgeExpiredSessions — delete Session rows past their expiresAt
 *
 * Both jobs run once on startup then every hour thereafter.
 */

import db from "./db.js";
import { logger } from "./logger.js";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const HOUR_MS       = 60 * 60 * 1000;

// ── Chat message purge ────────────────────────────────────────────────────────
// Live chat is ephemeral. Messages older than 7 days serve no purpose and
// accumulate indefinitely without this cleanup. Schema comment: "purge after
// stream ends via cron" — this is that cron.
async function purgeChatMessages(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);
    const { count } = await db.chatMessage.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    if (count > 0) {
      logger.info({ count, cutoff }, "cron: purged old chat messages");
    }
  } catch {
    logger.warn("cron: purgeChatMessages failed — will retry next cycle");
  }
}

// ── Expired session purge ─────────────────────────────────────────────────────
// Refresh tokens expire server-side (JWT claim) but the Session row in the DB
// persists until explicitly rotated or deleted. This cleans up stranded rows.
async function purgeExpiredSessions(): Promise<void> {
  try {
    const { count } = await db.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (count > 0) {
      logger.info({ count }, "cron: purged expired sessions");
    }
  } catch {
    logger.warn("cron: purgeExpiredSessions failed — will retry next cycle");
  }
}

// ── Scheduler ─────────────────────────────────────────────────────────────────
export function startCronJobs(): void {
  // Run immediately on startup so the first cleanup isn't an hour away
  void purgeChatMessages();
  void purgeExpiredSessions();

  // Then run every hour
  setInterval(purgeChatMessages,   HOUR_MS);
  setInterval(purgeExpiredSessions, HOUR_MS);

  logger.info("cron: jobs registered (interval: 1h)");
}
