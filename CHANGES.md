# LinkMe — Change Log

## [Unreleased] — 2026-05-24

---

### Summary

This document captures all changes made in the current development session **before** they are committed to the Git repository. It explains what was changed, where, and why, so the commit history stays meaningful and reviewable.

---

## Session: Post-redesign fixes + gender removal

### Context

The previous sessions completed a full redesign of the LinkMe frontend to match the Manus VibeLink platform UI. This session focuses on two areas:

1. **Bug fixes** — correcting encoding corruption (UTF-8 mojibake), wrong import paths, and placeholder pages.
2. **Simplification** — removing gender identity filters and fields per product decision to keep the platform inclusive and simple.

---

## Change 1 — Remove gender filters and fields from UI

### Decision rationale

The platform will not surface gender as a browsable/filterable attribute in the UI. Reasons:
- Reduces friction and potential for discrimination in how users browse creators.
- Keeps the browse experience simple — creators stand on their content, not demographic labels.
- Adult platforms that over-categorize by gender/identity can attract regulatory and app-store scrutiny.
- The existing three-way split (Female / Male / Non-binary) was arbitrary and incomplete.

**What stays:** The `gender` field remains in the mock data type definition and is not removed from the data model itself — only removed from user-facing UI surfaces. This keeps the door open for backend/admin use without affecting the frontend product.

### Files changed

#### `apps/web/src/pages/Profiles.tsx`

**Before:**
```tsx
type GenderFilter = "all" | "female" | "male" | "nonbinary" | "live";

const FILTERS: { id: GenderFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "nonbinary", label: "Non-binary" },
  { id: "live", label: "Live Only" },
];
```
Filter logic also branched on `p.gender?.toLowerCase()`.

**After:**
- `GenderFilter` type simplified to `"all" | "live"`.
- FILTERS array reduced to just `All` and `Live Only`.
- Filter logic no longer references `p.gender`.
- Search and live-status filtering retained as-is.

**Why:** Removes the gendered category browsing while keeping the functionally useful "Live Only" filter.

---

#### `apps/web/src/pages/ProfileDetail.tsx`

**Before:**
```tsx
{ label: "Gender", value: profile.gender },
```
This showed a "Gender: Female / Male / Non-binary" row in the creator's Details card.

**After:** Row removed entirely from the Details list.

**Why:** Consistent with the decision above — creators are not labeled by gender in the visible product. Other details (Location, Height, Body Type, Ethnicity) remain as opt-in creator-provided info that is more relevant to connecting.

---

#### `apps/web/src/pages/Register.tsx`

**Before:**
- Form state included `gender: ""`.
- Step 2 (Profile) had a Gender `<select>` dropdown (Male / Female / Non-binary / Prefer not to say).
- `validateProfile()` required `gender` to be set, erroring if blank.

**After:**
- `gender` field removed from form state.
- Gender `<select>` and its `<Field>` wrapper removed from Step 2 UI.
- `validateProfile()` no longer checks for gender.

**Why:** If gender isn't shown on profiles or used in search, collecting it during registration is pointless friction. New members should not be required to self-identify into a binary/tertiary category just to sign up.

---

## Change 2 — Fix UTF-8 mojibake encoding across all page files

### Context

Several source files had double-encoded UTF-8 sequences (mojibake) — emoji characters stored as garbled latin-1 representations instead of proper Unicode. For example, 🎉 was stored as `ðŸŽ‰` in the raw bytes. This caused broken emoji display and potentially broken string comparisons.

### Root cause

Files were likely created or copied through a pipeline that double-encoded UTF-8 as latin-1. This is a known issue when files are read as latin-1 and written back as UTF-8 without re-decoding.

### Fix

Used the Python `ftfy` library (`pip install ftfy`) to run `ftfy.fix_text()` on all affected files, then re-saved as clean UTF-8.

### Files affected

- `apps/web/src/App.tsx` — comment block had garbled characters
- `apps/web/src/components/AgeGate.tsx`
- `apps/web/src/components/LegalDownloadBar.tsx`
- `apps/web/src/contexts/AppContext.tsx`
- `apps/web/src/lib/legal-content.ts`
- `apps/web/src/lib/mock-data.ts` — emoji in taglines and badge icons (🔥 🏆 ⭐ 💎 etc.)
- `apps/web/src/pages/AgeVerification.tsx`
- `apps/web/src/pages/Billing.tsx`
- `apps/web/src/pages/BoostsPage.tsx`
- `apps/web/src/pages/CreditsStore.tsx`
- `apps/web/src/pages/GiftsStore.tsx`
- `apps/web/src/pages/LegalPages.tsx`
- `apps/web/src/pages/Register.tsx`
- `apps/web/src/pages/legal/PrivacyPolicy.tsx`
- `apps/web/src/pages/legal/TermsOfService.tsx`

---

## Change 3 — Fix wrong AppContext import paths

### Context

Four page files imported `useApp` from `@/context/AppContext` (singular `context`) instead of the correct `@/contexts/AppContext` (plural `contexts`). This caused a module-not-found error at runtime, showing "Something went wrong." on those pages.

### Files fixed

- `apps/web/src/pages/BoostsPage.tsx`
- `apps/web/src/pages/CreditsStore.tsx`
- `apps/web/src/pages/GiftsStore.tsx`
- `apps/web/src/pages/Register.tsx`

**Change:** `from "@/context/AppContext"` → `from "@/contexts/AppContext"` in each.

---

## Change 4 — Rebuild placeholder pages with real content

### Context

Three pages contained stub/placeholder implementations with no real content or data.

### LiveFeeds.tsx

**Before:** 4 plain dark boxes labeled "🔴 Live Stream 1/2/3/4" with no data.

**After:** Full implementation using `MOCK_LIVE_FEEDS` from `@/lib/mock-data`. Shows:
- Category filter tabs (All Streams / Dating / Entertainment / Chat)
- 3-column responsive grid of stream cards
- Each card: thumbnail image (16:9 aspect ratio), LIVE badge, VIP badge (when applicable), viewer count, host avatar overlapping the bottom of the thumbnail, stream title, host name, elapsed time, topic tags
- Empty state when no streams match the category filter

### Messages.tsx

**Before:** Grid of 8 cards using a non-existent `mockProfiles` import from `../lib/mockProfiles` (wrong path, emoji avatars, no chat UI).

**After:** Two-panel chat layout using `MOCK_PROFILES`:
- Left sidebar: scrollable contact list with real avatar images, LIVE dot indicator for currently-live creators, tagline preview
- Right panel: chat conversation with mock messages (alternating "me"/"them" bubbles), message input with Send button
- Empty state prompt when no conversation is selected

### VipLounge.tsx

**Before:** Minimal card with 4 bullet points and a single "Join VIP — $29/month" button.

**After:** Full page with:
- 6 perk cards in a 3-col grid (Priority Chat, Exclusive Content, Discounts, Early Access, VIP Badge, Exclusive Streams)
- 3 pricing tiers: VIP ($29/mo), VIP Elite ($69/mo, "Most Popular"), VIP Diamond ($149/mo)
- Credits balance callout linking to /credits

---

## Change 5 — Rename loyalty tier labels from "Vibe X" to "Link X"

### Context

`CUSTOMER_TIERS` in `apps/web/src/lib/mock-data.ts` still used "Vibe" branding leftover from the predecessor project name (VibeLink). These labels surface in the CreditsStore page tier progress bar.

### Change

All tier labels prefixed with "Vibe" renamed to "Link":
- "Vibe Starter" → "Link Starter"
- "Vibe Explorer" → "Link Explorer"  
- "Vibe Connector" → "Link Connector"
- "Vibe Pro" → "Link Pro"
- "Vibe Elite" → "Link Elite"
- etc.

"Founders Circle" was already brand-neutral and left unchanged.

---

## Change 6 — Fix Register page "VibeLink" heading

### Context

The Register page hero heading still read `<span>Vibe</span>Link` (old VibeLink branding).

### Change

`apps/web/src/pages/Register.tsx` line 145: `<span>Vibe</span>Link` → `<span>Link</span>Me`

---

## Testing verification (Session 1)

All changes verified in-browser at `http://localhost:5175`:

| Page | Status |
|---|---|
| `/` (Home) | ✅ Hero, Live Now, Featured Creators, Why LinkMe, CTA, Footer |
| `/profiles` | ✅ Search + All/Live filters working, 3-col grid, emoji badges render |
| `/profile/profile-1` | ✅ Cover, avatar, stats, details (no gender row), exclusive content |
| `/live` | ✅ 5 stream cards, category filter, viewer counts |
| `/messages` | ✅ Contact list, chat panel, mock conversation, send input |
| `/credits` | ✅ Package grid, tier bar shows "Link Explorer" → "Link Connector" |
| `/vip-lounge` | ✅ 6 perks, 3 tiers, credits callout |
| `/register` | ✅ 3-step form, no gender field in step 2, "LinkMe" branding |
| No console errors | ✅ Zero JS errors across all pages |

---

## Session 2 — Complete remaining stub pages + Billing rewrite

### Context

Following the previous session's broad fixes, this session completes all remaining stub/placeholder pages that had minimal or old-style markup, and rewrites Billing.tsx which contained a mojibake character and was using hardcoded credits instead of AppContext.

---

## Change 7 — BecomeCreator.tsx full rewrite

### File: `apps/web/src/pages/BecomeCreator.tsx`

### Before

A 23-line stub with no visual design — just a heading, paragraph, and a single CTA button using hardcoded `bg-[#14B8A6]` and `rounded-full` (not VL classes).

### After

Full Velvet Dark page:
- **Hero section** with Unsplash dark bokeh background (`photo-1516450360452-9312f5e86fc7`), gradient overlay, teal stat badges (avg earnings, revenue share, payout speed)
- **6 Perks grid** — DollarSign (80% earnings), Radio (HD streaming), Zap (tips/gifts), Shield (creator protection), Crown (subscriptions), TrendingUp (analytics)
- **4-step How It Works** — numbered steps in vl-card, chevron separators
- **3 Creator Plans** — Starter (80%), Pro Creator (85%, Most Popular), Elite (90%) with feature checklists and `Link href="/register"` CTAs
- **Final CTA section** linking to `/register`

### Why

The old stub gave no information about the platform's value proposition. The rewrite turns it into a proper acquisition page that converts visitors into creators.

---

## Change 8 — CreatorDashboard.tsx full rewrite

### File: `apps/web/src/pages/CreatorDashboard.tsx`

### Before

A 31-line stub using hardcoded `bg-[#111214]` styling (old design system), no AppContext import, static hardcoded numbers with no interactivity.

### After

Full Velvet Dark dashboard:
- **4 stat cards** — Total Earnings ($12,840), This Month ($3,920), Subscribers (2,341), Live Views (847) — each with colored icon chip
- **3-tab navigation** — Overview / Content / Fans
- **Overview tab**: simplified bar chart (5-month earnings history), quick actions grid (Go Live → `/live`, Upload Content, Manage Tiers → `/boosts`, Account Settings → `/account`)
- **Content tab**: empty state with upload CTA
- **Fans tab**: Top 5 fans list with spending amounts
- **Sidebar**: Live Credits balance (from `useApp()`) with Buy Credits link → `/credits`, Recent Activity feed (tips/subs/gifts), Next Payout card with Billing link → `/billing`

### Why

The old stub was visually inconsistent with the rest of the app and non-functional. The rewrite creates a coherent creator home base with real AppContext integration.

---

## Change 9 — Billing.tsx rewrite

### File: `apps/web/src/pages/Billing.tsx`

### Before

Mixed styling — some `bg-[#111214]` hardcoded, some CSS vars (`bg-background`, `text-muted-foreground`). Had a mojibake character `âš¡` (was ⚡) on line 16. Showed hardcoded "250 credits" instead of reading from AppContext. No `useApp()` import.

### After

Full Velvet Dark rewrite:
- **Balance card** reads real `credits` from `useApp()` — links to `/credits` for top-up
- **Security assurance card** — PCI DSS, TLS 1.3, tokenized storage
- **3-tab bar** with icons (CreditCard / Receipt / Star) using vl-card container
- **Payment Methods tab** — empty state, CCBill disclosure
- **Transactions tab** — table with 4 mock rows, color-coded credits column (green +, red −, muted —), Export CSV button
- **Subscriptions tab** — empty state linking to `/boosts` for upgrade
- All styling uses VL classes (`vl-card`, `vl-btn-primary`) and rgba color tokens

### Why

- Fixes the ⚡ mojibake corruption that would render as garbage in-browser
- Brings the page in line with the Velvet Dark design system
- Connects credits balance to real AppContext state

---

## Testing verification (Session 2)

| Page | Changes Made | Expected Status |
|---|---|---|
| `/become-creator` | Full rewrite | ✅ Hero + perks + steps + pricing + CTA |
| `/creator` | Full rewrite | ✅ Stats + tabs + chart + quick actions + sidebar |
| `/billing` | Full rewrite | ✅ Balance card + 3 tabs + transaction table |
| `/gifts` | No changes — CSS vars confirmed mapped | ✅ Recipient selector + category filter + gift grid |
| `/boosts` | No changes — CSS vars confirmed mapped | ✅ Membership plans + billing toggle + boost packages |
| `/credits` | No changes | ✅ Package grid + tier progress |
| `/vip-lounge` | No changes | ✅ Perks + pricing tiers + credits callout |
| `/account` | Rewrote in previous session | ✅ Credits card + age verification + 3 tabs |
