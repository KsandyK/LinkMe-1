# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json

RUN pnpm --filter web install --frozen-lockfile

COPY apps/web ./apps/web

# Build args become Vite env vars at build time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter web build

# ── Stage 2: Production (nginx) ────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default site
RUN rm /etc/nginx/conf.d/default.conf

# Copy built SPA
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# nginx config for SPA (all routes → index.html)
COPY nginx/spa.conf /etc/nginx/conf.d/spa.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
