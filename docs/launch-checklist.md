# CRAVR — Pre-Launch Checklist

_Last updated: 2026-06-02. Branch: `feat/linkme-icon-interactive-fixes`._

This is the single reference for going live. Items are grouped by who can do them
and the order to flip things on.

---

## ✅ Done (code complete, in git)

- **Auth/login working** — CORS allow-list + `trust proxy` fix (this was blocking ALL logins).
- **Member age verification** — auto-verified by the CCBill purchase webhook; manual-review fallback emails support and flags the admin queue.
- **Creator identity verification** — government ID + selfie uploaded to **private Bunny storage**, reviewed/approved by admin in the queue. Docs retained for 2257.
- **Admin account** — `ksand` (ADMIN, invisible in listings). Admin verify queue is gated (silent 404 for non-admins).
- **Secure content delivery** — premium originals stored privately; blurred public preview as thumbnail; `GET /api/content/:id/access` returns a short-lived signed URL only to owners/unlockers.
- **Bunny token-auth configured** — edge rule "ProtectPrivateContent" requires tokens on `/content/*`, `/vip/*`, `/id-verify/*`; public assets (`profiles/`, `previews/`) stay open. Global token-auth off. Token key matches `.env`.
- **Payment exploits closed** — no free credits/memberships/subscriptions/boosts in production; demo grants only in local dev.
- **CCBill website compliance** — Terms, Privacy, Refund & Cancellation (footer-linked), DMCA, 2257 statement, business address, billing descriptor disclosed, CCBill billing-support link, point-of-sale one-time/recurring disclosures.
- **Real homepage stats**, **boost-driven creator placement**, **10 AI companions seeded**.
- **Email-domain validation** (MX lookup + disposable blocklist), **fake-domain registration blocked**.
- **Privacy hardening** — DOB purged on verify, IP anonymised, `DELETE /api/auth/me`, hourly chat-message purge cron.
- **Stale-chunk auto-recovery** — deploys no longer break navigation for open sessions.
- **Hardened `db:reset-local`** — refuses to run in production.

---

## 🔧 Immediate — deploy & verify

1. **Deploy latest commits to the server:**
   ```bash
   cd /opt/cravr && git pull && pnpm --filter web build && pm2 restart cravr-api
   ```
2. **Hard-refresh** the browser, then verify:
   - Login as `ksand` (admin) and `testuser` (member)
   - `/messages`, `/credits`, `/become-creator`, `/verify-identity` load
   - `/admin/verify-queue` loads as admin, 404 for others
   - Manual age-verify request → appears in queue + email hits Yahoo inbox
3. **Set a strong admin password** (current is the dotenv-truncated `Cravr!2026`):
   ```bash
   cd /opt/cravr/apps/api && npx tsx prisma/set-password.ts ksand <NewStrongPassword>
   ```

---

## ⚠️ External blockers — only you can do these

- [ ] **CCBill merchant application** — apply now that the site is live + compliant. This is the gate for real payments.
- [ ] On approval, add to `/opt/cravr/apps/api/.env` then `pm2 restart cravr-api`:
  ```
  CCBILL_CLIENT_ACCNUM=...
  CCBILL_SUBACCOUNT=...
  CCBILL_FORM_NAME=...
  CCBILL_SALT=...
  CCBILL_WEBHOOK_SECRET=...
  ```
  → Credit purchases + automatic member age-verification go live with no code change.
- [ ] **Confirm the billing descriptor** CCBill assigns matches the site text (currently `CCBILL*CRAVR` in Terms/Privacy/checkout).
- [ ] **Allowlist the CCBill webhook** in Cloudflare so Bot Fight Mode doesn't challenge `POST /api/credits/webhook` (payments won't credit if it's blocked).
- [ ] **`ANTHROPIC_API_KEY`** — add to `.env` for real AI-companion chat (otherwise canned fallback replies). `pm2 restart cravr-api` after.

---

## 🟡 Known gaps to close before/at launch

- [ ] **Memberships & creator subscriptions are "coming soon"** — they need real CCBill **recurring** billing integration (not just removing the dev gate). Credits (one-time) are wired; recurring is not. Decide if launching with credits-only is acceptable.
- [ ] **Subscription cancellation flow** — the Refund Policy says "Account → Billing → Subscriptions"; that path must actually work once subscriptions are live (CCBill verifies cancellation is possible).
- [ ] **AI-companion content unlock shows a broken image** — seeded AI content has no real files in storage; unlocking charges credits then 404s. Fix: re-seed AI content with real image URLs, or mark AI content display-only.
- [ ] **SRS live-streaming server** — not installed; live stream view is a demo placeholder. Needed before "go live" features are real.

---

## 🚀 Launch-day sequence

1. CCBill approved → add `CCBILL_*` env → restart API.
2. Run a **real $1–$10 test purchase** end-to-end: card → CCBill → webhook → credits added → member auto age-verified.
3. Confirm the webhook actually hit the server (`pm2 logs cravr-api`) and wasn't challenged by Cloudflare.
4. Onboard the first real creators → they complete ID verification → you approve in the queue.
5. (Optional) Wire + enable memberships/subscriptions once recurring billing is integrated.
6. Merge `feat/linkme-icon-interactive-fixes` → `main`.

---

## 📌 Ops notes

- **Server:** Cloudzy, Ubuntu 24.04, Dallas. API via PM2 (`cravr-api`), nginx, PostgreSQL (local), hourly cleanup cron. Auto-backups on.
- **CDN:** Bunny `cravr-cdn` (`cdn.cravr.fun`), token-auth via edge rule.
- **DNS/SSL:** Cloudflare nameservers; origin cert (15-yr) + Full(strict).
- **Email:** Resend (send), Cloudflare routing → `allcravr@yahoo.com`.
- **Deploy command:** `cd /opt/cravr && git pull && pnpm --filter web build && pm2 restart cravr-api`
- **Never** run `db:reset-local` on the server (it's now guarded anyway).
