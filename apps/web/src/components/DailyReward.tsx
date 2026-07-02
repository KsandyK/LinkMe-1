/**
 * CRAVR — Daily reward + streak
 *
 * Shown to logged-in users on the homepage. Always makes the current streak
 * and the *next* reward visible (before and after claiming), with a small
 * ladder of upcoming days so the escalating rewards are obvious. Claiming
 * grants escalating bonus credits and advances the streak; a missed day
 * resets it.
 */
import { useState } from "react";
import { Flame, Gift, Check } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { isRewardAvailable, pendingStreak, dailyRewardAmount, claimDaily, getStreak } from "@/lib/streak";

export function DailyReward() {
  const { isLoggedIn, addCredits, showToast } = useApp();
  const available = isRewardAvailable();
  const [claimed, setClaimed] = useState(() => !available);
  const [streak, setStreak] = useState(() => (available ? pendingStreak() : getStreak().count));

  if (!isLoggedIn) return null;

  const todayAmount = dailyRewardAmount(streak);
  const nextAmount = dailyRewardAmount(streak + 1);

  const handleClaim = () => {
    const res = claimDaily();
    addCredits(res.amount, `🔥 Daily reward — day ${res.streak}`);
    setStreak(res.streak);
    setClaimed(true);
    showToast({
      title: `+${res.amount} credits!`,
      description: `Day ${res.streak} streak — come back tomorrow for +${dailyRewardAmount(res.streak + 1)}.`,
    });
  };

  // Current day + next 3 — shows the escalating reward ladder
  const ladder = [0, 1, 2, 3].map(i => {
    const day = streak + i;
    return {
      day,
      amount: dailyRewardAmount(day),
      done: claimed && i === 0,   // today, already claimed
      active: !claimed && i === 0, // today, claimable now
      next: claimed && i === 1,    // tomorrow's reward
    };
  });

  return (
    <div className="rounded-2xl p-4 mb-6"
      style={{
        background: claimed
          ? "rgba(255,255,255,0.03)"
          : "linear-gradient(135deg, rgba(245,166,35,0.14), rgba(239,68,68,0.08))",
        border: `1px solid ${claimed ? "rgba(255,255,255,0.08)" : "rgba(245,166,35,0.3)"}`,
      }}>
      {/* Top row — streak + primary action */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(245,166,35,0.18)" }}>
            <Flame className="w-5 h-5" style={{ color: "#f5a623" }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white flex items-center gap-1.5">
              <span style={{ color: "#f5a623" }}>{streak}-day streak</span> 🔥
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {claimed
                ? <>Claimed today · come back tomorrow for <strong style={{ color: "#f5a623" }}>+{nextAmount} credits</strong></>
                : <>Claim <strong style={{ color: "#f5a623" }}>+{todayAmount} credits</strong> for logging in today</>}
            </p>
          </div>
        </div>
        {claimed ? (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
            <Check className="w-3.5 h-3.5" style={{ color: "#2ecc8a" }} /> Next reward tomorrow
          </div>
        ) : (
          <button onClick={handleClaim}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #f5a623, #e8862a)" }}>
            <Gift className="w-4 h-4" /> Claim +{todayAmount}
          </button>
        )}
      </div>

      {/* Reward ladder — current + upcoming days */}
      <div className="flex items-center gap-2 mt-3.5">
        {ladder.map((d, i) => (
          <div key={i} className="flex-1 rounded-lg px-2 py-1.5 text-center"
            style={{
              background: d.active ? "rgba(245,166,35,0.16)" : d.next ? "rgba(46,204,138,0.1)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${d.active ? "rgba(245,166,35,0.4)" : d.next ? "rgba(46,204,138,0.3)" : "rgba(255,255,255,0.06)"}`,
            }}>
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>
              {d.done ? "Today" : d.active ? "Today" : d.next ? "Tomorrow" : `Day ${d.day}`}
            </p>
            <p className="text-xs font-black flex items-center justify-center gap-0.5"
              style={{ color: d.done ? "#2ecc8a" : d.active ? "#f5a623" : d.next ? "#2ecc8a" : "rgba(255,255,255,0.6)" }}>
              {d.done ? <Check className="w-3 h-3" /> : `+${d.amount}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
