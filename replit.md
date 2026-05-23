# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.
This project is **VibeLink** — a fully interactive hybrid dating + live interaction platform prototype.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind + Wouter

## VibeLink Design System

- **Theme**: Soft dark mode — charcoal bg (`hsl(234 20% 9%)`), teal accent `#14B8A6`
- **Card bg**: `hsl(234 22% 12%)`
- **Age gate**: Full-screen modal, stored in `localStorage` as `vibelink_age_verified`
- **Credits**: Global context starting at 750, every spend shows toast "Spent X credits — Balance: Y"
- **Blurred media**: CSS class `.blur-locked` (filter: blur(12px))
- **Routing**: Wouter (not React Router)

## VibeLink Features

- **10 Creator Profiles** — deep profiles with blurred/unlockable photo & video content
- **5 Live Feed Rooms** — with in-room chat (10 credits/message) and gift sending
- **Full Messaging** — 10 credits/message, threaded conversations
- **Credits Store** — 8 packages (100–25,000 credits), CCBill mock payment
- **Gifts Store** — 16 gift items across categories (romantic/luxury/prestige/ultimate/fun/sweet)
- **Boosts Page** — 4 subscription tiers (Spark/Flame/Inferno/Legend)
- **VIP Lounge** — exclusive group sessions (500 credits entry or 1,500 monthly pass)
- **Account Page** — tier progress bar (7 customer tiers), badges, referral program
- **Creator Dashboard** — revenue splits, earnings breakdown, payout schedule
- **Become a Creator** — onboarding page with creator tier info

## Customer Tiers
Starter → Explorer → Connector → Pro → Elite → Legend → VIP
Based on monthly spend ($0 to $5,000+)

## Creator Tiers
Starter (75%) → Rising (78%) → Established (80%) → Elite (83%) → Partner (90%) → Top Partner (95%)
Creator revenue split (creator keeps the shown %)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── vibelink/           # React + Vite frontend (VibeLink app)
│       └── src/
│           ├── App.tsx             # Route definitions (Wouter)
│           ├── context/AppContext.tsx  # Credits state, age gate, unlocks
│           ├── lib/mock-data.ts    # All mock data (10 profiles, 5 feeds, 16 gifts)
│           ├── components/
│           │   ├── AgeGate.tsx
│           │   └── Navigation.tsx
│           └── pages/
│               ├── Home.tsx
│               ├── Profiles.tsx
│               ├── ProfileDetail.tsx
│               ├── LiveFeeds.tsx
│               ├── Messages.tsx
│               ├── CreditsStore.tsx
│               ├── GiftsStore.tsx
│               ├── BoostsPage.tsx
│               ├── VipLounge.tsx
│               ├── Account.tsx
│               ├── CreatorDashboard.tsx
│               └── BecomeCreator.tsx
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/     # profiles, media_items, live_feeds tables
├── scripts/
│   └── src/seed-vibelink.ts  # Seeds 10 profiles, 50 media items, 5 live feeds
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers covering profiles, live-feeds, credits, messages, gifts, boosts, creator, account
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- Schema: `profiles`, `media_items`, `live_feeds` tables
- Seeded with 10 creator profiles, 50 media items, 5 live feeds
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages.

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
