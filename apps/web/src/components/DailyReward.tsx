/**
 * CRAVR — Daily reward banner
 *
 * Shown to logged-in users once per day. Claiming grants escalating bonus
 * credits and advances the login streak. After claiming it collapses into a
 * quiet "come back tomorrow" state. Drives daily-active-user habit.
 */
import { useState } from "react";
import { Flame, Gift } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { isRewardAvailable, pendingStreak, dailyRewardAmount, claimDaily, getStreak } from "@/lib/streak";

export function DailyReward() {
  const { isLoggedIn, addCredits, showToast } = useApp();
  const [claimed, setClaimed] = useState(() => !isRewardAvailable());
  const [streak, setStreak] = useState(() => (isRewardAvailable() ? pendingStreak() : getStreak().count));
  const amount = dailyRewardAmount(streak);

  if (!isLoggedIn) return null;

  const handleClaim = () => {
    const res = claimDaily();
    addCredits(res.amount, `🔥 Daily reward — day ${res.streak}`);
    setStreak(res.streak);
    setClaimed(true);
    showToast({ title: `+${res.amount} credits!`, description: `Day ${res.streak} streak — see you tomorrow.` });
  };

  return (
    <div className="rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap"
      style={{
        background: claimed
          ? "rgba(255,255,255,0.03)"
          : "linear-gradient(135deg, rgba(245,166,35,0.14), rgba(239,68,68,0.08))",
        border: `1px solid ${claimed ? "rgba(255,255,255,0.07)" : "rgba(245,166,35,0.3)"}`,
      }}>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: claimed ? "rgba(255,255,255,0.05)" : "rgba(245,166,35,0.18)" }}>
          <Flame className="w-5 h-5" style={{ color: claimed ? "rgba(255,255,255,0.4)" : "#f5a623" }} />
        </div>
        <div>
          {claimed ? (
            <>
              <p className="text-sm font-bold text-white">{streak}-day streak 🔥</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Reward claimed — come back tomorrow to keep it going.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-white">Daily reward ready · Day {streak}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>Claim <strong style={{ color: "#f5a623" }}>+{amount} credits</strong> for logging in today.</p>
            </>
          )}
        </div>
      </div>
      {!claimed && (
        <button onClick={handleClaim}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #f5a623, #e8862a)" }}>
          <Gift className="w-4 h-4" /> Claim +{amount}
        </button>
      )}
    </div>
  );
}
