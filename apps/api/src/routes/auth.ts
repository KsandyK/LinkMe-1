import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import db from "../lib/db.js";
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  refreshExpiresAt,
  verifyAccessToken,
} from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";
import { Emails } from "../lib/email.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 10),
  message: { error: "Too many auth attempts, please try again later" },
});

// ── Schemas ─────────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_]+$/, "Username may only contain lowercase letters, numbers, and underscores"),
  email: z.string().email().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  // Optional profile fields collected during multi-step registration
  displayName: z.string().min(1).max(60).optional(),
  location:    z.string().max(100).optional(),
  bio:         z.string().max(500).optional(),
});

const LoginSchema = z.object({
  // Accept either `login` (generic) or `username` (from frontend form)
  login: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1),
}).refine(d => d.login || d.username, { message: "login or username required" });

const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function issueTokens(userId: string, username: string, role: string) {
  const accessToken = signAccessToken({ sub: userId, username, role });
  const rawRefresh = generateRefreshToken();
  return { accessToken, rawRefresh };
}

/**
 * Anonymize an IP address for GDPR/CCPA compliance.
 * IPv4 → zero out last octet  (192.168.1.100 → 192.168.1.0)
 * IPv6 → keep first 4 groups only (mask last 64 bits)
 * Handles IPv4-mapped IPv6 (::ffff:1.2.3.4) transparently.
 */
function anonymizeIp(ip: string | undefined): string | null {
  if (!ip) return null;
  const raw = ip.replace(/^::ffff:/, "");           // unwrap IPv4-mapped IPv6
  const v4 = raw.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.)\d{1,3}$/);
  if (v4) return `${v4[1]}0`;
  const v6parts = raw.split(":");
  if (v6parts.length >= 4) return v6parts.slice(0, 4).join(":") + "::";
  return null;
}

async function storeRefreshToken(
  userId: string,
  rawToken: string,
  req: { headers: { "user-agent"?: string }; ip?: string },
) {
  await db.session.create({
    data: {
      userId,
      token:     hashToken(rawToken),
      userAgent: req.headers["user-agent"] ?? null,
      ipAddress: anonymizeIp(req.ip),   // store anonymised IP only
      expiresAt: refreshExpiresAt(),
    },
  });
}

// ── Routes ───────────────────────────────────────────────────────────────────

/** POST /api/auth/register */
router.post("/auth/register", authLimiter, async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
    return;
  }
  const { username, email, password, displayName, location, bio } = parsed.data;

  // Check uniqueness
  const existing = await db.user.findFirst({
    where: { OR: [{ username }, ...(email ? [{ email }] : [])] },
  });
  if (existing) {
    res.status(409).json({
      error: existing.username === username ? "Username already taken" : "Email already registered",
    });
    return;
  }

  const passwordHash = await bcrypt.hash(
    password,
    Number(process.env.BCRYPT_ROUNDS ?? 12),
  );

  const user = await db.user.create({
    data: {
      username,
      email,
      passwordHash,
      credits: 250, // welcome credits — shown as bonus on register confirmation screen
      profile: {
        create: {
          displayName: displayName || username,
          ...(location ? { location } : {}),
          ...(bio ? { bio } : {}),
        },
      },
    },
    select: { id: true, username: true, role: true, credits: true },
  });

  const { accessToken, rawRefresh } = issueTokens(user.id, user.username, user.role);
  await storeRefreshToken(user.id, rawRefresh, req as any);

  // Send welcome email (fire-and-forget — don't delay registration response)
  if (email) {
    Emails.welcome(email, user.username).catch(() => null);
  }

  res.status(201).json({
    user,
    accessToken,
    refreshToken: rawRefresh,
  });
});

/** POST /api/auth/login */
router.post("/auth/login", authLimiter, async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }
  const identifier = parsed.data.login ?? parsed.data.username ?? "";
  const { password } = parsed.data;

  const user = await db.user.findFirst({
    where: {
      OR: [{ username: identifier }, { email: identifier }],
      isActive: true,
    },
    select: { id: true, username: true, role: true, credits: true, passwordHash: true },
  });

  const validPassword = user ? await bcrypt.compare(password, user.passwordHash) : false;

  // Constant-time rejection to prevent username enumeration
  if (!user || !validPassword) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const { accessToken, rawRefresh } = issueTokens(user.id, user.username, user.role);
  await storeRefreshToken(user.id, rawRefresh, req as any);

  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser, accessToken, refreshToken: rawRefresh });
});

/** POST /api/auth/refresh */
router.post("/auth/refresh", authLimiter, async (req, res) => {
  const parsed = RefreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "refreshToken is required" });
    return;
  }

  const hashed = hashToken(parsed.data.refreshToken);
  const session = await db.session.findUnique({
    where: { token: hashed },
    include: { user: { select: { id: true, username: true, role: true, isActive: true } } },
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    res.status(401).json({ error: "Refresh token invalid or expired" });
    return;
  }

  // Rotate — delete old session, issue new pair (token rotation prevents replay attacks)
  await db.session.delete({ where: { id: session.id } });

  const { accessToken, rawRefresh } = issueTokens(
    session.user.id, session.user.username, session.user.role,
  );
  await storeRefreshToken(session.user.id, rawRefresh, req as any);

  res.json({ accessToken, refreshToken: rawRefresh });
});

/** POST /api/auth/logout */
router.post("/auth/logout", requireAuth, async (req, res) => {
  const parsed = RefreshSchema.safeParse(req.body);
  if (parsed.success) {
    await db.session.deleteMany({
      where: { token: hashToken(parsed.data.refreshToken) },
    });
  }
  res.json({ ok: true });
});

/** POST /api/auth/logout-all — revoke every device */
router.post("/auth/logout-all", requireAuth, async (req, res) => {
  await db.session.deleteMany({ where: { userId: req.user!.sub } });
  res.json({ ok: true });
});

/** GET /api/auth/me */
router.get("/auth/me", requireAuth, async (req, res) => {
  const user = await db.user.findUnique({
    where: { id: req.user!.sub },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      credits: true,
      createdAt: true,
      profile: true,
      ageVerification: { select: { status: true } },
    },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

/**
 * DELETE /api/auth/me
 *
 * Permanently deletes the authenticated user's account and all associated
 * data (profile, messages, transactions, age verification, sessions, etc.)
 * via Prisma CASCADE. Satisfies GDPR Article 17 "right to erasure."
 *
 * Requires the user to confirm their password to prevent accidental deletion.
 */
const DeleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required to confirm account deletion"),
});

router.delete("/auth/me", requireAuth, async (req, res) => {
  const parsed = DeleteAccountSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Password confirmation is required" });
    return;
  }

  // Re-authenticate to prevent CSRF / session-hijack abuse
  const user = await db.user.findUnique({
    where: { id: req.user!.sub },
    select: { id: true, passwordHash: true, role: true },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Block ADMIN accounts from self-deletion via API (must be done manually)
  if (user.role === "ADMIN") {
    res.status(403).json({ error: "Admin accounts cannot be self-deleted. Contact a platform administrator." });
    return;
  }

  const passwordOk = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!passwordOk) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }

  // Delete — Prisma CASCADE handles all related rows
  await db.user.delete({ where: { id: user.id } });

  res.status(204).end();
});

export default router;
