import { useState } from "react";
import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { DollarSign, Users, Eye, Radio, TrendingUp, Upload, Settings, ChevronRight, Zap } from "lucide-react";

const MOCK_EARNINGS = [
  { month: "Jan", amount: 2400 },
  { month: "Feb", amount: 3100 },
  { month: "Mar", amount: 2800 },
  { month: "Apr", amount: 4200 },
  { month: "May", amount: 3920 },
];

const RECENT_ACTIVITY = [
  { type: "tip", fan: "StarGazer99", amount: 50, time: "2m ago" },
  { type: "sub", fan: "NightOwl_X", amount: 29, time: "14m ago" },
  { type: "gift", fan: "LuxVibes", amount: 120, time: "31m ago" },
  { type: "tip", fan: "Anonymous", amount: 10, time: "1h ago" },
  { type: "sub", fan: "WaveRider22", amount: 29, time: "2h ago" },
];

const QUICK_ACTIONS = [
  { label: "Go Live", icon: Radio, color: "#ef4444", href: "/live" },
  { label: "Upload Content", icon: Upload, color: "#14b8a6", href: "#" },
  { label: "Manage Tiers", icon: Zap, color: "#e8a87c", href: "/boosts" },
  { label: "Account Settings", icon: Settings, color: "#a78bfa", href: "/account" },
];

export default function CreatorDashboard() {
  const { credits } = useApp();
  const [activeTab, setActiveTab] = useState<"overview" | "content" | "fans">("overview");

  const totalEarnings = 12840;
  const thisMonth = 3920;
  const subscribers = 2341;
  const liveViews = 847;

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Creator Dashboard</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Welcome back — here's how you're doing</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
            <Radio className="w-4 h-4" />
            Go Live
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {[
            { icon: DollarSign, label: "Total Earnings", value: `$${totalEarnings.toLocaleString()}`, color: "#14b8a6" },
            { icon: TrendingUp, label: "This Month", value: `$${thisMonth.toLocaleString()}`, color: "#e8a87c" },
            { icon: Users, label: "Subscribers", value: subscribers.toLocaleString(), color: "#a78bfa" },
            { icon: Eye, label: "Live Views", value: liveViews.toLocaleString(), color: "#f97316" },
          ].map(stat => (
            <div key={stat.label} className="vl-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}25` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.label}</p>
                <p className="text-lg font-black text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 vl-card p-1.5 w-fit">
          {(["overview", "content", "fans"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all"
              style={activeTab === tab
                ? { background: "rgba(20,184,166,0.15)", color: "#14b8a6" }
                : { color: "rgba(255,255,255,0.45)" }
              }>
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-5">
            {activeTab === "overview" && (
              <>
                {/* Earnings chart (simplified) */}
                <div className="vl-card p-5">
                  <h3 className="text-sm font-bold text-white mb-4">Earnings — Last 5 Months</h3>
                  <div className="flex items-end gap-3 h-32">
                    {MOCK_EARNINGS.map(e => {
                      const maxAmt = Math.max(...MOCK_EARNINGS.map(x => x.amount));
                      const pct = (e.amount / maxAmt) * 100;
                      return (
                        <div key={e.month} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-mono" style={{ color: "#14b8a6" }}>${(e.amount / 1000).toFixed(1)}k</span>
                          <div className="w-full rounded-t-lg transition-all duration-500"
                            style={{ height: `${pct}%`, background: "linear-gradient(to top, #0d9488, #14b8a6)" }} />
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{e.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="vl-card p-5">
                  <h3 className="text-sm font-bold text-white mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {QUICK_ACTIONS.map(action => (
                      <Link key={action.label} href={action.href}>
                        <button className="w-full vl-card p-3 text-center hover:border-white/20 transition-all group">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2"
                            style={{ background: `${action.color}15`, border: `1px solid ${action.color}25` }}>
                            <action.icon className="w-4 h-4" style={{ color: action.color }} />
                          </div>
                          <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.65)" }}>{action.label}</p>
                        </button>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === "content" && (
              <div className="vl-card p-5">
                <h3 className="text-sm font-bold text-white mb-4">Content Library</h3>
                <div className="text-center py-12">
                  <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No content uploaded yet</p>
                  <p className="text-xs mt-1 mb-4" style={{ color: "rgba(255,255,255,0.25)" }}>Upload photos and videos to share with your subscribers</p>
                  <button className="vl-btn-primary px-6 py-2 text-sm">Upload First Content</button>
                </div>
              </div>
            )}

            {activeTab === "fans" && (
              <div className="vl-card p-5">
                <h3 className="text-sm font-bold text-white mb-4">Top Fans</h3>
                {["StarGazer99", "LuxVibes", "NightOwl_X", "WaveRider22", "CryptoCat"].map((fan, i) => (
                  <div key={fan} className="flex items-center justify-between py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: "rgba(20,184,166,0.15)", color: "#14b8a6" }}>
                        {fan[0]}
                      </div>
                      <span className="text-sm text-white">{fan}</span>
                    </div>
                    <span className="text-xs font-mono" style={{ color: "#14b8a6" }}>${[240, 185, 130, 95, 60][i]} spent</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Credits balance */}
            <div className="vl-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4" style={{ color: "#14b8a6" }} />
                <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>Your Credits</span>
              </div>
              <p className="text-2xl font-black" style={{ color: "#14b8a6" }}>{credits.toLocaleString()}</p>
              <Link href="/credits">
                <button className="mt-3 w-full py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }}>
                  Buy Credits
                </button>
              </Link>
            </div>

            {/* Recent activity */}
            <div className="vl-card p-4">
              <h3 className="text-sm font-bold text-white mb-3">Recent Activity</h3>
              <div className="space-y-3">
                {RECENT_ACTIVITY.map((act, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-white">{act.fan}</p>
                      <p className="text-xs capitalize" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {act.type === "tip" ? "💸 Tip" : act.type === "sub" ? "⭐ Subscribed" : "🎁 Gift"} · {act.time}
                      </p>
                    </div>
                    <span className="text-xs font-bold font-mono" style={{ color: "#14b8a6" }}>+${act.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payout */}
            <div className="vl-card p-4">
              <h3 className="text-sm font-bold text-white mb-1">Next Payout</h3>
              <p className="text-2xl font-black text-white mb-0.5">$1,247.50</p>
              <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>Estimated — Jun 1, 2026</p>
              <Link href="/billing">
                <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/5"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" }}>
                  Manage Billing <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
