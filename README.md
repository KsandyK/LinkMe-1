# vibelink3

**A production-ready adult live streaming and interaction platform.**

Built with modern TypeScript, pnpm workspaces, and strong focus on **compliance, safety, and creator monetization**.

## ✨ Key Features

- **Age Verification & PII Safety** — Robust compliance engine
- **Creator Dashboards** — Analytics, earnings, content management
- **Credits Store & Monetization** — Virtual economy with premium unlocks
- **Real-time Messaging & Interaction**
- **Live Streaming** (WebRTC ready)
- **Premium Content Gating**
- **Admin & Moderation Tools**

## 🛠 Tech Stack

- **Frontend**: TypeScript, modern React (in artifacts)
- **Backend**: Node.js + TypeScript (packages/api-server)
- **Monorepo**: pnpm Workspaces
- **Shared**: Zod schemas, generated clients, shared libraries
- **Build**: esbuild / rollup optimized

## 🚀 Quick Start

```bash
# 1. Install pnpm
npm install -g pnpm

# 2. Install dependencies
pnpm install

# 3. Build
pnpm run build
```

For local development of specific artifacts:
```bash
PORT=3000 BASE_PATH=/ pnpm --filter ./artifacts/vibelink run build
```

See `CONTRIBUTING.md` for full development workflow.

## 📁 Project Structure

- `lib/` — Shared packages (api-zod, db, clients)
- `packages/api-server/` — Core backend
- `artifacts/` — Built/demo applications
- `src/` — Source code
- `vibe3-production-hardened/` — Production configs

## 🔐 Security & Compliance

This project prioritizes:
- Strict age verification
- PII protection
- Data minimization
- Secure credential handling

## 💼 Business / Commercial Use

Open for:
- Commercial licensing
- White-label / SaaS versions
- Custom development

Contact for inquiries.

## 📄 License

MIT License (see LICENSE file)
