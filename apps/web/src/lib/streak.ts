/**
 * CRAVR — Daily login streak
 *
 * A habit loop: returning each day grants escalating bonus credits and grows
 * a visible streak counter. Missing a day resets the streak. All client-side
 * via localStorage — the credits are granted through AppContext.addCredits.
 */
const KEY = "vl_streak_v1";

export interface StreakState {
  count: number;
  lastClaim: string | null; // YYYY-MM-DD
}

function dayStr(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function getStreak(): StreakState {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (s && typeof s.count === "number") return s;
  } catch { /* ignore */ }
  return { count: 0, lastClaim: null };
}

export function isRewardAvailable(): boolean {
  return getStreak().lastClaim !== dayStr();
}

/** Escalating daily reward, capped so it stays a nudge not a payout. */
export function dailyRewardAmount(streakCount: number): number {
  return Math.min(50 + Math.max(0, streakCount - 1) * 10, 200);
}

/** The streak the user *would* be on if they claim right now. */
export function pendingStreak(): number {
  const s = getStreak();
  const yesterday = dayStr(new Date(Date.now() - 86_400_000));
  if (s.lastClaim === yesterday) return s.count + 1; // continued
  if (s.lastClaim === dayStr()) return s.count;       // already claimed today
  return 1;                                           // first day or streak broken
}

export function claimDaily(): { amount: number; streak: number } {
  const streak = pendingStreak();
  const amount = dailyRewardAmount(streak);
  try { localStorage.setItem(KEY, JSON.stringify({ count: streak, lastClaim: dayStr() })); } catch { /* ignore */ }
  return { amount, streak };
}
