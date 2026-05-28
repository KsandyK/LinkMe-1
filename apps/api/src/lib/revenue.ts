/**
 * CRAVR — Revenue share & earnings split logic
 *
 * All credit values are integers (1 credit = $0.10 USD).
 * Processing fee: ~4% avg CCBill charge, deducted from gross BEFORE split.
 * Grace period: first 90 days always 80% regardless of monthly volume.
 *
 * Tier thresholds are in USD (monthly earnings converted from credits).
 */

export const CREDITS_PER_USD = 10;          // 10 credits = $1
export const PROCESSING_FEE_RATE = 0.04;    // 4% CCBill avg

// Revenue tiers matched to legal-content.ts
const REVENUE_TIERS: { minUsd: number; pct: number }[] = [
  { minUsd: 0,        pct: 0.80 },
  { minUsd: 5001,     pct: 0.80 },
  { minUsd: 15001,    pct: 0.83 },
  { minUsd: 25001,    pct: 0.85 },
  { minUsd: 75001,    pct: 0.87 },
  { minUsd: 150001,   pct: 0.88 },
  { minUsd: 300001,   pct: 0.89 },
  { minUsd: 500001,   pct: 0.90 },
  { minUsd: 1000001,  pct: 0.90 }, // Pinnacle — 90% floor
];

export const GRACE_PERIOD_DAYS = 90;
const GRACE_PCT = 0.80;

/**
 * Returns the creator's revenue share % based on:
 * 1. Grace period (first 90 days = 80% flat)
 * 2. Monthly earnings volume tier after grace period
 */
export function getRevenueSharePct(
  creatorActivatedAt: Date | null | undefined,
  monthlyEarningsCredits: number,
): number {
  if (!creatorActivatedAt) return GRACE_PCT;

  const daysSinceActivation =
    (Date.now() - creatorActivatedAt.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceActivation <= GRACE_PERIOD_DAYS) return GRACE_PCT;

  const monthlyUsd = monthlyEarningsCredits / CREDITS_PER_USD;

  // Find highest tier the creator qualifies for
  let pct = GRACE_PCT;
  for (const tier of REVENUE_TIERS) {
    if (monthlyUsd >= tier.minUsd) pct = tier.pct;
  }
  return pct;
}

/**
 * Splits a gross credit spend into:
 * - processingFee: CCBill's cut (~4%), rounded up
 * - platformFee: CRAVR's cut of the net
 * - creatorCredits: what the creator receives
 */
export function splitEarning(
  grossCredits: number,
  revenueSharePct: number,
): { processingFee: number; creatorCredits: number; platformFee: number } {
  const processingFee = Math.ceil(grossCredits * PROCESSING_FEE_RATE);
  const net = grossCredits - processingFee;
  const creatorCredits = Math.floor(net * revenueSharePct);
  const platformFee = net - creatorCredits;

  return { processingFee, creatorCredits, platformFee };
}

/**
 * Human-readable tier label for a given revenue share % (and optionally the
 * monthly USD earnings, needed to distinguish Growth from Established — both
 * are 80% but Established is $5,001–$15,000/mo).
 */
export function revenueTierLabel(pct: number, monthlyUsd?: number): string {
  if (pct === 0.80) {
    // Both Growth and Established share 80% — differentiate by monthly volume
    if (monthlyUsd !== undefined && monthlyUsd >= 5001) return "Established";
    return "Growth";
  }
  const map: Record<number, string> = {
    0.83: "Elite",
    0.85: "Partner",
    0.87: "Senior Partner",
    0.88: "Exec Partner",
    0.89: "Premier Partner",
    0.90: "Top Partner / Pinnacle",
  };
  return map[pct] ?? "Growth";
}

/**
 * Returns the next tier the creator is working toward, with its threshold.
 */
export function nextRevenueTier(monthlyUsd: number): { label: string; thresholdUsd: number; pct: number } | null {
  const tiers = [
    { minUsd: 0,      label: "Growth",           pct: 0.80 },
    { minUsd: 5001,   label: "Established",       pct: 0.80 },
    { minUsd: 15001,  label: "Elite",             pct: 0.83 },
    { minUsd: 25001,  label: "Partner",           pct: 0.85 },
    { minUsd: 75001,  label: "Senior Partner",    pct: 0.87 },
    { minUsd: 150001, label: "Exec Partner",      pct: 0.88 },
    { minUsd: 300001, label: "Premier Partner",   pct: 0.89 },
    { minUsd: 500001, label: "Top Partner",       pct: 0.90 },
    { minUsd: 1000001, label: "Pinnacle",         pct: 0.90 },
  ];
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (monthlyUsd < tiers[i].minUsd) {
      return { label: tiers[i].label, thresholdUsd: tiers[i].minUsd, pct: tiers[i].pct };
    }
  }
  return null; // already at Pinnacle
}
