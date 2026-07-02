/**
 * CRAVR API — entry point
 *
 * HTTP  → Express (port $PORT, default 3000)
 * WS    → ws.WebSocketServer (port $WS_PORT, default 3001)
 *           /ws/live  — live stream rooms + WebRTC signaling
 *           /ws/msg   — private DM conversations
 */

import "dotenv/config";
import app from "./app.js";
import { createWsServer } from "./ws/index.js";
import { logger } from "./lib/logger.js";
import db from "./lib/db.js";
import { startCronJobs } from "./lib/cron.js";

const HTTP_PORT = Number(process.env.PORT ?? 3000);
const WS_PORT   = Number(process.env.WS_PORT ?? 3001);

// ── Graceful shutdown ─────────────────────────────────────────────────────────
async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down…");
  await db.$disconnect();
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

// ── Boot ──────────────────────────────────────────────────────────────────────
const server = app.listen(HTTP_PORT, () => {
  logger.info({ port: HTTP_PORT }, "HTTP server listening");
});

createWsServer(WS_PORT);
startCronJobs();

server.on("error", (err) => {
  logger.error({ err }, "HTTP server error");
  process.exit(1);
});
