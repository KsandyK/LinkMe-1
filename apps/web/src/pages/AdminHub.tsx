/**
 * CRAVR — Admin Hub
 *
 * Central landing page for all platform-admin tools. Lists every admin area
 * with live pending-item counts so staff can see at a glance what needs
 * attention. Gated by RequireAuth admin at the route level.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { ageVerify as ageVerifyApi } from "@/lib/api";
import { Shield, Flag, ShieldCheck, ChevronRight, AlertTriangle, Loader2 } from "lucide-react";

interface ModerationStats { pendingReports: number; criticalReports: number; pendingFlags?: number; }

export default function AdminHub() {
  const { token, user } = useApp();
  const [verifyCount, setVerifyCount] = useState<number | null>(null);
  const [modStats, setModStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const apiBase = (import.meta as any).env?.VITE_API_URL ?? "";
    const headers = { Authorization: `Bearer ${token}` };

    // Live queue counts — both calls run in parallel, each tolerates failure
    Promise.allSettled([
      ageVerifyApi.queue().then(items => setVerifyCount(items.length)).catch(() => setVerifyCount(null)),
      fetch(`${apiBase}/api/moderation/stats`, { headers })
        .then(r => r.ok ? r.json() : null)
        .then((s: ModerationStats | null) => s && setModStats(s))
        .catch(() => {/* leave null */}),
    ]).finally(() => setLoading(false));
  }, [token]);

  const tiles = [
    {
      href: "/admin/verify-queue",
      icon: ShieldCheck,
      title: "Identity Verification",
      desc: "Review government ID + selfie submissions from new creators",
      count: verifyCount,
      countLabel: "pending review",
      color: "#14b8a6",
    },
    {
      href: "/admin/moderation",
      icon: Flag,
      title: "Moderation Reports",
      desc: "User-submitted reports for harassment, illegal content, spam",
      count: modStats?.pendingReports ?? null,
      countLabel: "open reports",
      color: "#f97316",
      critical: modStats?.criticalReports ?? 0,
      disabled: true, // backend exists, UI not built yet — show as coming soon
    },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6" style={{ color: "#d4af37" }} />
          <h1 className="text-3xl font-bold text-white">Admin</h1>
        </div>
        <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.4)" }}>
          Signed in as <strong style={{ color: "rgba(255,255,255,0.7)" }}>@{user?.username}</strong> · staff tools and review queues
        </p>

        {/* Queue tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {tiles.map(t => {
            const showBadge = !t.disabled && typeof t.count === "number" && t.count > 0;
            const card = (
              <div className="vl-card p-5 h-full transition-all"
                style={{
                  cursor: t.disabled ? "not-allowed" : "pointer",
                  opacity: t.disabled ? 0.55 : 1,
                  borderColor: showBadge ? `${t.color}55` : "rgba(255,255,255,0.08)",
                }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${t.color}15`, border: `1px solid ${t.color}25` }}>
                    <t.icon className="w-5 h-5" style={{ color: t.color }} />
                  </div>
                  {showBadge && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: `${t.color}1f`, color: t.color, border: `1px solid ${t.color}55` }}>
                      {t.count} {t.countLabel}
                    </span>
                  )}
                  {t.critical && t.critical > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full ml-1 flex items-center gap-1"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.4)" }}>
                      <AlertTriangle className="w-3 h-3" /> {t.critical} critical
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{t.title}</h3>
                  {!t.disabled && <ChevronRight className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />}
                </div>
                <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{t.desc}</p>
                {t.disabled && (
                  <p className="text-[10px] font-bold mt-3 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
                    UI coming soon · backend live
                  </p>
                )}
              </div>
            );
            return t.disabled
              ? <div key={t.href}>{card}</div>
              : <Link key={t.href} href={t.href}>{card}</Link>;
          })}
        </div>

        {loading && (
          <p className="text-xs flex items-center gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Loader2 className="w-3 h-3 animate-spin" /> Loading queue counts…
          </p>
        )}

        {/* Quick reference */}
        <div className="vl-card p-5">
          <h3 className="text-sm font-bold text-white mb-3">Quick admin reference</h3>
          <ul className="space-y-2 text-xs" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
            <li>• Identity verification is required before a creator can publish content or earn payouts</li>
            <li>• Approving a creator sets <code style={{ color: "#5eead4" }}>isApproved = true</code> and starts the 90-day revenue-share grace period</li>
            <li>• Rejected ID documents are deleted from storage immediately; approved docs are retained for 2257 compliance</li>
            <li>• Manual age-verification requests appear in the verification queue with <code style={{ color: "#5eead4" }}>documentType = "manual_request"</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
