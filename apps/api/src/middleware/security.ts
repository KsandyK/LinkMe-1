import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

const securityMiddleware = [
  // 1. Helmet - adds 12+ security headers (critical for CCBill/Stripe compliance)
  helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    xFrameOptions: { action: "deny" },
  }),

  // 2. Strict CORS - only our domains (prevents unauthorized API calls)
  cors({
    origin: [
      'http://localhost:5175',     // Vite frontend dev
      'http://localhost:3000',     // possible prod frontend
      'https://linkme.app',
      'https://www.linkme.app',
      'https://linkme-1.com'       // we'll update this as we go
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token']
  }),

  // 3. Rate limiting - protects live-stream, credit, and auth endpoints
  rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: 300,                   // 300 requests per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP - please slow down' }
  })
];

export default securityMiddleware;

