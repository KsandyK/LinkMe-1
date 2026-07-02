import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-prod";
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES ?? "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES ?? "30d";

export interface JwtPayload {
  sub: string;       // userId
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function signAccessToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

/** Generate a cryptographically random refresh token string */
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

/** Hash a refresh token before storing in DB */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshExpiresAt(): Date {
  // Parse "30d" → 30 days from now
  const match = REFRESH_EXPIRES.match(/^(\d+)([dhms])$/);
  if (!match) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const [, num, unit] = match;
  const ms =
    unit === "d" ? Number(num) * 86_400_000 :
    unit === "h" ? Number(num) * 3_600_000 :
    unit === "m" ? Number(num) * 60_000 :
    Number(num) * 1_000;
  return new Date(Date.now() + ms);
}
