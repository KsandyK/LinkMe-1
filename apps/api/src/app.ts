import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger.js";

// Routes
import authRouter      from "./routes/auth.js";
import profilesRouter  from "./routes/profiles.js";
import livefeedsRouter from "./routes/livefeeds.js";
import messagesRouter  from "./routes/messages.js";
import notificationsRouter from "./routes/notifications.js";
import creditsRouter   from "./routes/credits.js";
import giftsRouter     from "./routes/gifts.js";
import boostsRouter    from "./routes/boosts.js";
import creatorRouter   from "./routes/creator.js";
import verifyAgeRouter from "./routes/verify-age.js";
import moderationRouter from "./routes/moderation.js";
import streamsRouter   from "./routes/streams.js";
import contentRouter       from "./routes/content.js";
import subscriptionsRouter from "./routes/subscriptions.js";
import adminRouter     from "./routes/admin.js";
import totpRouter      from "./routes/totp.js";
import healthRouter    from "./routes/health.js";

const app = express();

// Behind nginx + Cloudflare — trust the proxy chain so req.ip and
// express-rate-limit read the forwarded client IP instead of throwing on
// the X-Forwarded-For header.
app.set("trust proxy", 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "wss:", "ws:", "https://*.b-cdn.net"],
        mediaSrc:   ["'self'", "blob:", "https://*.amazonaws.com", "https://*.b-cdn.net"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    xFrameOptions: { action: "deny" },
  }),
);

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "http://localhost:5175",
  "http://localhost:3000",
  "https://cravr.fun",
  "https://www.cravr.fun",
  ...(process.env.ALLOWED_ORIGINS?.split(",") ?? []),
];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900_000),
    max:      Number(process.env.RATE_LIMIT_MAX ?? 300),
    standardHeaders: true,
    legacyHeaders:   false,
    message: { error: "Too many requests — please slow down" },
  }),
);

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url?.split("?")[0] }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }),
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ── Routes ────────────────────────────────────────────────────────────────────
const api = express.Router();

api.use(healthRouter);
api.use(authRouter);
api.use(profilesRouter);
api.use(livefeedsRouter);
api.use(messagesRouter);
api.use(notificationsRouter);
api.use(creditsRouter);
api.use(giftsRouter);
api.use(boostsRouter);
api.use(creatorRouter);
api.use(verifyAgeRouter);
api.use(moderationRouter);
api.use(streamsRouter);
api.use(contentRouter);
api.use(subscriptionsRouter);
api.use(adminRouter);
api.use(totpRouter);

app.use("/api", api);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

export default app;
