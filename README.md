# CRAVR

A modern, production-ready platform for creators with live streaming, monetization, and community features.

## ✨ Features

- **Creator Dashboards** — Analytics, earnings, and content management
- **Credits & Monetization** — Virtual economy with premium features
- **Live Streaming** — WebRTC-powered real-time video
- **Age Verification & Compliance** — Strong focus on safety and legal requirements
- **Real-time Messaging & Interaction**

## 🛠 Tech Stack

- **Frontend**: React 19 + Vite + TypeScript + Tailwind
- **Backend**: Node.js + TypeScript + Prisma
- **Monorepo**: pnpm workspaces
- **API Layer**: Zod schemas + generated clients

## 📁 Project Structure

```
apps/
  api/          # Backend API server
  web/          # Frontend application

packages/
  api-client-react/   # React API client (generated)
  api-zod/            # Zod schemas (generated)
  shared/             # Shared utilities
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- PostgreSQL (for Prisma)

### Installation

```bash
# Clone the repository
git clone https://github.com/KsandyK/CRAVR-1.git
cd CRAVR-1

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

### Individual Services

```bash
# Backend only
pnpm dev:api

# Frontend only
pnpm dev:web
```

### Build for Production

```bash
pnpm build
```

## 🔐 Environment Setup

Copy the example files and fill in your values:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Key variables include database URL, JWT secret, and payment provider keys.

## 📄 License

MIT License
