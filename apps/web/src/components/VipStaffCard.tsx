/**
 * CRAVR — Direct VIP Staff Access
 *
 * Perk unlocked by the top tiers ("Direct access to VIP staff"):
 *   • Platinum membership ($4,999.99 — id "platinum_m")
 *   • Sovereign profile boost ($4,999.99 — id "sovereign")
 *
 * Renders nothing for anyone who doesn't hold one of those tiers.
 */
import { useApp } from "@/contexts/AppContext";
import { Crown, Mail } from "lucide-react";

const VIP_EMAIL = "vip@cravr.fun";

export function VipStaffCard() {
  const { activeBoost, activeMembership, user } = useApp();
  const isAdmin = user?.role === "ADMIN";
  const eligible = isAdmin || activeBoost === "sovereign" || activeMembership === "platinum_m";
  if (!eligible) return null;

  const tierLabel = isAdmin ? "platform admin" : activeMembership === "platinum_m" ? "Platinum member" : "Sovereign tier";

  return (
    <div className="vl-card p-5"
      style={{ border: "1px solid rgba(212,175,55,0.35)", background: "linear-gradient(135deg, rgba(212,175,55,0.09), rgba(212,175,55,0.02))" }}>
      <div className="flex items-center gap-2 mb-2">
        <Crown className="w-4 h-4" style={{ color: "#d4af37" }} />
        <span className="text-sm font-bold" style={{ color: "#d4af37" }}>Direct VIP Staff Access</span>
      </div>
      <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
        As a <strong style={{ color: "#d4af37" }}>{tierLabel}</strong>, you have a dedicated line to our VIP team —
        a personal account concierge, priority escalation, and guaranteed responses within 1 hour.
      </p>
      <a
        href={`mailto:${VIP_EMAIL}?subject=${encodeURIComponent("VIP Priority Request")}`}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #d4af37, #b8860b)", color: "#09091a" }}>
        <Mail className="w-4 h-4" /> Contact VIP Staff
      </a>
      <p className="text-xs text-center mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>
        Priority SLA &lt; 1 hour · {VIP_EMAIL}
      </p>
    </div>
  );
}

export default VipStaffCard;
