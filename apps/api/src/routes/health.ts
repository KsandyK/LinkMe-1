import { Router } from "express";
import db from "../lib/db.js";

const router = Router();

/** GET /healthz — liveness check */
router.get("/healthz", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

/** GET /readyz — readiness check (verifies DB connectivity) */
router.get("/readyz", async (_req, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({ status: "error", db: "unreachable" });
  }
});

export default router;
