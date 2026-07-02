# ── Stage 1: Dependencies ──────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config so pnpm can resolve the monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json

# Install only api dependencies (no dev tools in prod)
RUN pnpm --filter api install --frozen-lockfile --prod

# ── Stage 2: Build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json

# Install ALL deps (including dev) for build step
RUN pnpm --filter api install --frozen-lockfile

# Copy source
COPY apps/api ./apps/api

# Generate Prisma client
RUN pnpm --filter api exec prisma generate

# Build with esbuild
RUN pnpm --filter api build

# ── Stage 3: Production runtime ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Add tini for proper signal handling
RUN apk add --no-cache tini

# Copy built output
COPY --from=builder /app/apps/api/dist ./dist

# Copy node_modules from deps stage (prod only)
COPY --from=deps /app/apps/api/node_modules ./node_modules

# Copy Prisma schema + generated client
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/api/node_modules/@prisma ./node_modules/@prisma

# Non-root user
RUN addgroup -S cravr && adduser -S cravr -G cravr
USER cravr

EXPOSE 3000 3001

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.mjs"]
