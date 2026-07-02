/**
 * CRAVR — Single Source of Truth for Membership & Boost Tiers
 *
 * Import from here in: BoostsPage, Account, StreamView, AppContext.
 * Never define tier prices or bonus credits inline in a page file.
 *
 * Credits exchange rate: 100 credits = $9.99 base ≈ $0.10/credit.
 * Creator revenue share: gross transaction value × revenue-share % (see Creator Agreement).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface MemberTier {
  id: string;
  name: string;
  emoji: string;
  /** Monthly price in USD (0 = free default state) */
  price: number;
  /** Formatted price string for display */
  priceStr: string;
  color: string;
  /** Bonus credits awarded each month */
  bonusCredits: number;
  /** Fractional credit-purchase discount, e.g. 0.05 = 5% */
  discount: number;
  /** Monthly VIP sessions; 9999 = unlimited */
  vipSessions: number;
  /** Short perks (3 bullets, used in StreamView subscribe modal) */
  perks: string[];
  /** Full feature list (used in BoostsPage cards) */
  features: string[];
  notIncluded: string[];
  cta: string;
  popular: boolean;
}

export interface BoostTier {
  id: string;
  name: string;
  emoji: string;
  /** Monthly price in USD */
  price: number;
  color: string;
  /** Boosts (visibility pushes) per month */
  boosts: number;
  features: string[];
  popular: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Membership tiers — canonical pricing used across all pages
// Credits value at base rate ($0.10/credit):
//   fan $4.99 → 50cr = $5 value (breaks even)
//   supporter $9.99 → 150cr = $15 value (+50% ROI)
//   superfan $14.99 → 200cr = $20 value (+33% ROI)
//   ...ultra tiers: 4–7× ROI on credits alone (designed for heavy spenders)
// ─────────────────────────────────────────────────────────────────────────────

export const MEMBER_TIERS: MemberTier[] = [
  {
    id: "fan", name: "Fan", emoji: "❤️", price: 4.99, priceStr: "$4.99",
    color: "#f43f5e", bonusCredits: 50, discount: 0, vipSessions: 0,
    perks: ["50 bonus credits/month", "Fan badge on profile", "Priority message delivery"],
    features: ["Everything in Free", "50 bonus credits/month", "Follow unlimited creators", "Fan badge on profile", "Priority message delivery", "Like & comment on all posts"],
    notIncluded: ["PPV & exclusive content", "VIP lounge access", "Credit discounts"],
    cta: "Subscribe", popular: false,
  },
  {
    id: "supporter", name: "Supporter", emoji: "🔥", price: 9.99, priceStr: "$9.99",
    color: "#f97316", bonusCredits: 100, discount: 0.05, vipSessions: 0,
    perks: ["100 bonus credits/month", "5% off credit purchases", "Supporter-only posts"],
    features: ["Everything in Fan", "100 bonus credits/month", "5% discount on credit purchases", "Access to supporter-only posts", "Supporter flame badge", "Early access to new content"],
    notIncluded: ["PPV & exclusive content", "VIP lounge access"],
    cta: "Subscribe", popular: false,
  },
  {
    id: "superfan", name: "Super Fan", emoji: "💎", price: 14.99, priceStr: "$14.99",
    color: "#8b5cf6", bonusCredits: 150, discount: 0.10, vipSessions: 2,
    perks: ["150 bonus credits/month", "10% off credit purchases", "2 VIP sessions/month"],
    features: ["Everything in Supporter", "150 bonus credits/month", "10% discount on credit purchases", "Unlock exclusive creator content", "2 VIP Lounge sessions/mo", "VIP queue in all live chats", "Super Fan diamond badge"],
    notIncluded: ["Unlimited VIP access"],
    cta: "Subscribe", popular: false,
  },
  {
    id: "devotee", name: "Devotee", emoji: "💖", price: 19.99, priceStr: "$19.99",
    color: "#ec4899", bonusCredits: 200, discount: 0.12, vipSessions: 4,
    perks: ["200 bonus credits/month", "12% off credit purchases", "1 PPV unlock/month"],
    features: ["Everything in Super Fan", "200 bonus credits/month", "12% discount on credit purchases", "4 VIP Lounge sessions/mo", "1 PPV content unlock/mo", "Devotee heart badge", "Creator DM priority"],
    notIncluded: ["Unlimited VIP access"],
    cta: "Subscribe", popular: true,
  },
  {
    id: "allaccess", name: "All-Access", emoji: "🏆", price: 24.99, priceStr: "$24.99",
    color: "#f59e0b", bonusCredits: 250, discount: 0.15, vipSessions: 10,
    perks: ["250 bonus credits/month", "15% off credit purchases", "10 VIP sessions/month"],
    features: ["Everything in Devotee", "250 bonus credits/month", "15% discount on credit purchases", "10 VIP Lounge sessions/mo", "3 PPV content unlocks/mo", "All-Access gold trophy badge"],
    notIncluded: ["Unlimited VIP access"],
    cta: "Subscribe", popular: false,
  },
  {
    id: "elite", name: "Elite", emoji: "⭐", price: 39.99, priceStr: "$39.99",
    color: "#6366f1", bonusCredits: 400, discount: 0.18, vipSessions: 15,
    perks: ["400 bonus credits/month", "18% off credit purchases", "15 VIP sessions/month"],
    features: ["Everything in All-Access", "400 bonus credits/month", "18% discount on credit purchases", "15 VIP Lounge sessions/mo", "5 PPV content unlocks/mo", "Elite star badge", "Priority billing support"],
    notIncluded: ["Unlimited VIP access"],
    cta: "Subscribe", popular: false,
  },
  {
    id: "creatorpass", name: "Creator Pass", emoji: "👑", price: 49.99, priceStr: "$49.99",
    color: "#14b8a6", bonusCredits: 500, discount: 0.20, vipSessions: 20,
    perks: ["500 bonus credits/month", "20% off credit purchases", "20 VIP sessions/month"],
    features: ["Everything in Elite", "500 bonus credits/month", "20% discount on credit purchases", "20 VIP Lounge sessions/mo", "10 PPV content unlocks/mo", "Exclusive Creator Pass events", "Custom profile crown frame"],
    notIncluded: [],
    cta: "Get Creator Pass", popular: false,
  },
  {
    id: "blackcard", name: "Black Card", emoji: "🖤", price: 74.99, priceStr: "$74.99",
    color: "#d4af37", bonusCredits: 750, discount: 0.25, vipSessions: 25,
    perks: ["750 bonus credits/month", "25% off credit purchases", "25 VIP sessions/month"],
    features: ["Everything in Creator Pass", "750 bonus credits/month", "25% discount on credit purchases", "25 VIP Lounge sessions/mo", "Unlimited PPV unlocks", "Black Card exclusive badge", "First access to all new features"],
    notIncluded: [],
    cta: "Get Black Card", popular: false,
  },
  {
    id: "diamond", name: "Diamond", emoji: "💠", price: 149.99, priceStr: "$149.99",
    color: "#38bdf8", bonusCredits: 1000, discount: 0.25, vipSessions: 40,
    perks: ["1,000 bonus credits/month", "25% off credit purchases", "40 VIP sessions/month"],
    features: ["Everything in Black Card", "1,000 bonus credits/month", "25% discount on credit purchases", "40 VIP Lounge sessions/mo", "Quarterly gifting package", "Private creator events"],
    notIncluded: [],
    cta: "Get Diamond", popular: false,
  },
  {
    id: "obsidian", name: "Obsidian", emoji: "🔮", price: 299.99, priceStr: "$299.99",
    color: "#8b5cf6", bonusCredits: 1250, discount: 0.25, vipSessions: 60,
    perks: ["1,250 bonus credits/month", "25% off credit purchases", "60 VIP sessions/month"],
    features: ["Everything in Diamond", "1,250 bonus credits/month", "25% discount on credit purchases", "60 VIP Lounge sessions/mo", "Obsidian elite badge", "Priority platform access"],
    notIncluded: [],
    cta: "Get Obsidian", popular: false,
  },
  // ── Ultra-Premium tier ladder ($499.99 → $4,999.99) ──────────────────────
  {
    id: "titanium", name: "Titanium", emoji: "🔷", price: 499.99, priceStr: "$499.99",
    color: "#7dd3fc", bonusCredits: 1500, discount: 0.25, vipSessions: 75,
    perks: ["1,500 bonus credits/month", "25% off credit purchases", "75 VIP sessions/month"],
    features: ["Everything in Obsidian", "1,500 bonus credits/month", "25% discount on credit purchases", "75 VIP Lounge sessions/mo", "Titanium member badge", "Priority queue in all live chats"],
    notIncluded: [],
    cta: "Get Titanium", popular: false,
  },
  {
    id: "gold", name: "Gold", emoji: "🥇", price: 749.99, priceStr: "$749.99",
    color: "#fbbf24", bonusCredits: 2000, discount: 0.25, vipSessions: 100,
    perks: ["2,000 bonus credits/month", "25% off credit purchases", "100 VIP sessions/month"],
    features: ["Everything in Titanium", "2,000 bonus credits/month", "25% discount on credit purchases", "100 VIP Lounge sessions/mo", "Gold member badge", "Custom profile accent frame"],
    notIncluded: [],
    cta: "Get Gold", popular: false,
  },
  {
    id: "imperial", name: "Imperial", emoji: "⚜️", price: 1499.99, priceStr: "$1,499.99",
    color: "#f472b6", bonusCredits: 2500, discount: 0.25, vipSessions: 150,
    perks: ["2,500 bonus credits/month", "25% off credit purchases", "150 VIP sessions/month"],
    features: ["Everything in Gold", "2,500 bonus credits/month", "25% discount on credit purchases", "150 VIP Lounge sessions/mo", "Imperial badge", "Bi-weekly strategy calls"],
    notIncluded: [],
    cta: "Get Imperial", popular: false,
  },
  {
    id: "apex", name: "Apex", emoji: "🏔️", price: 2999.99, priceStr: "$2,999.99",
    color: "#a78bfa", bonusCredits: 3000, discount: 0.25, vipSessions: 200,
    perks: ["3,000 bonus credits/month", "25% off credit purchases", "200 VIP sessions/month"],
    features: ["Everything in Imperial", "3,000 bonus credits/month", "25% discount on credit purchases", "200 VIP Lounge sessions/mo", "Apex elite badge", "Custom profile crown frame", "Quarterly exclusive gifting package"],
    notIncluded: [],
    cta: "Get Apex", popular: false,
  },
  {
    id: "platinum_m", name: "Platinum", emoji: "🪙", price: 4999.99, priceStr: "$4,999.99",
    color: "#e2e8f0", bonusCredits: 3500, discount: 0.25, vipSessions: 9999,
    perks: ["3,500 bonus credits/month", "25% off credit purchases", "Unlimited VIP Lounge access"],
    features: ["Everything in Apex", "3,500 bonus credits/month", "25% discount on credit purchases", "Unlimited VIP Lounge access", "Platinum crown profile frame", "Direct access to VIP staff"],
    notIncluded: [],
    cta: "Get Platinum", popular: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Boost tiers — canonical pricing used across all pages
// ─────────────────────────────────────────────────────────────────────────────

export const BOOST_TIERS: BoostTier[] = [
  {
    id: "starter", name: "Starter", emoji: "✨", price: 4.99, color: "#64748b", boosts: 2, popular: false,
    features: ["2 profile boosts/month", "Search result bump", "Boost notification to followers"],
  },
  {
    id: "spark", name: "Spark", emoji: "⚡", price: 9.99, color: "#06b6d4", boosts: 4, popular: false,
    features: ["4 profile boosts/month (~1/week)", "Priority in search results", "Boost notification to followers", "Basic analytics"],
  },
  {
    id: "flame", name: "Flame", emoji: "🔥", price: 19.99, color: "#14b8a6", boosts: 8, popular: true,
    features: ["8 profile boosts/month (~2/week)", "Top search placement", "Featured on Live Feeds", "Full analytics dashboard", "Boost scheduling"],
  },
  {
    id: "blaze", name: "Blaze", emoji: "💥", price: 29.99, color: "#f97316", boosts: 14, popular: false,
    features: ["14 profile boosts/month (~3–4/week)", "Category top placement", "Full analytics dashboard", "Boost scheduling"],
  },
  {
    id: "inferno", name: "Inferno", emoji: "🌋", price: 39.99, color: "#ef4444", boosts: 22, popular: false,
    features: ["22 boosts/month — covers all weekday evenings", "Homepage featured spot", "Category top placement", "Premium analytics", "Priority support", "Boost scheduling & automation"],
  },
  {
    id: "legend", name: "Legend", emoji: "👑", price: 59.99, color: "#f59e0b", boosts: 36, popular: false,
    features: ["36 boosts/month — covers every recommended peak slot", "Homepage shoutout", "VIP badge on profile", "Custom boost scheduling", "Revenue analytics"],
  },
  {
    id: "titan", name: "Titan", emoji: "🏆", price: 99.99, color: "#a78bfa", boosts: 50, popular: false,
    features: ["50 boosts/month — peak + selected off-peak slots", "Top of every feed", "Custom profile frame", "Full revenue & analytics suite"],
  },
  {
    id: "pinnacle", name: "Pinnacle", emoji: "🌠", price: 249.99, color: "#00d4ff", boosts: 120, popular: false,
    features: [
      "120 boosts/month — maximum daily coverage, all timezones",
      "Guaranteed homepage placement daily",
      "Full revenue & analytics API access",
      "Dedicated VIP support line (< 1hr SLA)",
      "Pinnacle crown profile frame",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Convenience lookups
// ─────────────────────────────────────────────────────────────────────────────

export const MEMBER_BY_ID: Record<string, MemberTier> = Object.fromEntries(
  MEMBER_TIERS.map(t => [t.id, t])
);

export const BOOST_BY_ID: Record<string, BoostTier> = Object.fromEntries(
  BOOST_TIERS.map(t => [t.id, t])
);

/** Discount map consumed by AppContext */
export const MEMBERSHIP_DISCOUNTS: Record<string, number> = {
  free: 0,
  ...Object.fromEntries(MEMBER_TIERS.map(t => [t.id, t.discount])),
};

/** Flat info map consumed by Account.tsx (mirrors old MEMBERSHIP_INFO shape) */
export const MEMBERSHIP_INFO: Record<string, { name: string; price: number; color: string; emoji: string }> = {
  free: { name: "Free", price: 0, color: "#64748b", emoji: "🌟" },
  ...Object.fromEntries(MEMBER_TIERS.map(t => [t.id, { name: t.name, price: t.price, color: t.color, emoji: t.emoji }])),
};

/** Flat info map consumed by Account.tsx (mirrors old BOOST_INFO shape) */
export const BOOST_INFO: Record<string, { name: string; price: number; color: string; emoji: string }> = Object.fromEntries(
  BOOST_TIERS.map(t => [t.id, { name: `${t.name} Boost`, price: t.price, color: t.color, emoji: t.emoji }])
);
