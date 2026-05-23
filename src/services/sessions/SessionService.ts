/**
 * SessionService – centralized session handling (create, refresh, revoke).
 */

import { Request } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../../config';

const JWT_SECRET = process.env.JWT_SESSION_SECRET || config.jwtSessionSecret;

/**
 * Base class for session tokens.
 */
class SessionToken {
  public readonly sub: string; // user_id
  constructor(sub: string) {
    this.sub = sub;
  }
}

class RefreshToken extends SessionToken {
  constructor(sub: string) {super(sub)}
}

class SessionTokenPayload {
  public readonly userId: string;
  public readonly role?: 'user' | 'admin';
  constructor(userId: string, role?: 'user'|'admin') {
    this.userId = userId;
    this.role = role;
  }
}

/**
 * Simple in-memory store for development.
 * Replace with a proper Redis/DynamoDB/ElastiCache in production.
 */
class SessionStore {
  private tokens: Map<string, { type: 'refresh' | 'session'; userId: string }>; // For demo only
  constructor() {
    this.tokens = new Map();
  }

  set(key: string, type: 'refresh'|'session', userId: string) {
    this.tokens.set(key, { type, userId });
  }

  has(key: string): boolean {
    return this.tokens.has(key);
  }

  delete(key: string): void {
    this.tokens.delete(key);
  }
}

const store = new SessionStore();

/**
 * RefreshTokenManager – manages refresh tokens.
 */
class RefreshTokenManager {
  public static async create(userId: string): Promise<string> {
    const refreshToken = jwt.sign(
      { type: 'refresh', sub: userId },
      JWT_SECRET,
      { expiresIn: config.refreshTokenExpiry }
    );
    store.set(refreshToken, 'refresh', userId);
    return refreshToken;
  }

  public static async validate(refreshToken: string): Promise<string | null> {
    try {
      const payload = jwt.verify(refreshToken, JWT_SECRET) as { type?: 'refresh'; sub: string };
      if (payload.type !== 'refresh') return null;
      return payload.sub;
    } catch (_err) { return null; }
  }
}

/**
 * SessionManager – manages short-lived session tokens.
 */
class SessionManager {
  public static async create(userId: string, role?: 'user'|'admin'): Promise<string> {
    const payload = new SessionTokenPayload(userId, role);
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: config.sessionExpiry });
    store.set(token, 'session', userId);
    return token;
  }

  public static async validate(sessionToken: string): Promise<SessionTokenPayload | null> {
    try {
      const payload = jwt.verify(sessionToken, JWT_SECRET) as SessionTokenPayload & { sub?: string };
      if (!payload.userId || !payload.role) return null;
      return payload;
    } catch (_err) { return null; }
  }
}

/**
 * Main session service.
 */
class SessionService {
  public static async createRefreshToken(userId: string): Promise<string> {
    return RefreshTokenManager.create(userId);
  }

  public static async refreshSession(refreshToken: string, originalReq?: Request): Promise<{ sessionId: string; newRefreshToken: string } | null> {
    const userId = await RefreshTokenManager.validate(refreshToken);
    if (!userId) return null;
    const sessionId = await SessionManager.create(userId);
    const newRefreshToken = await RefreshTokenManager.create(userId);
    return { sessionId, newRefreshToken };
  }

  public static async revokeSession(sessionId: string): Promise<void> {
    store.delete(sessionId); // not implemented yet; for production use Redis delete
  }
}

export {
  SessionService,
  RefreshTokenManager,
  SessionManager,
};
