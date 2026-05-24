/**
 * VIBELINK — Creator Dashboard
 * Velvet Dark Design System
 */
import { MOCK_CREATOR_STATS } from "@/lib/mock-data";
import { TrendingUp, Users, DollarSign, Eye, Radio, BarChart2 } from "lucide-react";

export default function CreatorDashboard() {
  const stats = MOCK_CREATOR_STATS;

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 700, color: "white" }}>Creator Dashboard</h1>
          <button className="vl-btn-primary px-4 py-2 text-sm flex items-center gap-2">
            <Radio className="w-4 h-4" /> Go Live
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { icon: DollarSign, label: "Total Earnings", value: `$${stats.totalEarnings.toLocaleString()}`, sub: `$${stats.monthlyEarnings} this month`, color: "#14b8a6" },
            { icon: Users, label: "Followers", value: stats.totalFollowers.toLocaleString(), sub: `+${stats.newFollowersThisMonth} this month`, color: "#e8a87c" },
            { icon: Eye, label: "Total Views", value: stats.totalViews.toLocaleString(), sub: `${stats.avgViewersPerStream} avg/stream`, color: "#a78bfa" },
            { icon: TrendingUp, label: "Content Unlocks", value: stats.contentUnlocks.toLocaleString(), sub: `${stats.giftsReceived} gifts received`, color: "#f97316" },
          ].map(s => (
            <div key={s.label} className="vl-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
              </div>
              <p className="text-2xl font-bold text-white mb-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>{s.value}</p>
              <p className="text-xs" style={{ color: s.color }}>{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue chart (simplified) */}
          <div className="vl-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4" style={{ color: "#14b8a6" }} />
              <h3 className="font-bold text-white text-sm">Monthly Revenue</h3>
            </div>
            <div className="flex items-end gap-2 h-32">
              {stats.monthlyRevenue.map((m: any, i: number) => {
                const maxVal = Math.max(...stats.monthlyRevenue.map((r: any) => r.amount));
                const height = (m.amount / maxVal) * 100;
                const isLast = i === stats.monthlyRevenue.length - 1;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-lg transition-all duration-500"
                      style={{ height: `${height}%`, background: isLast ? "linear-gradient(to top, #14b8a6, #5eead4)" : "rgba(20,184,166,0.25)" }} />
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue breakdown */}
          <div className="vl-card p-5">
            <h3 className="font-bold text-white text-sm mb-4">Revenue Breakdown</h3>
            <div className="space-y-3">
              {stats.revenueBreakdown.map((item: any) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>{item.label}</span>
                    <span className="font-bold" style={{ color: item.color }}>{item.value}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.value}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
