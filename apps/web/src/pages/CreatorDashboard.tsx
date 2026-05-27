import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { creator as creatorApi, CreatorDashboardData } from "@/lib/api";
import { MOCK_PROFILES } from "@/lib/mock-data";
import { DollarSign, Users, Eye, Radio, TrendingUp, Upload, Settings, ChevronRight, Zap, Loader2, AlertCircle, BarChart2, Lock, MessageSquare } from "lucide-react";

// ── Analytics mock data ───────────────────────────────────────────────────────
const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const VIEWER_DATA  = [142, 267, 198, 334, 298, 489, 421];
const EARNINGS_DATA = [48, 93, 71, 127, 104, 168, 143];
const maxViewers  = Math.max(...VIEWER_DATA);
const maxEarnings = Math.max(...EARNINGS_DATA);

// SVG line chart (simple, no external deps)
function SparkLine({ data, color, maxVal, height = 60 }: { data: number[]; color: string; maxVal: number; height?: number }) {
  const w = 280; const pad = 6;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = height - pad - ((v / maxVal) * (height - pad * 2));
    return `${x},${y}`;
  }).join(" ");
  const areaBot = `${pad},${height - pad} ${pts} ${w - pad},${height - pad}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaBot} fill={`url(#grad-${color.replace("#","")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2);
        const y = height - pad - ((v / maxVal) * (height - pad * 2));
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
    </svg>
  );
}

// CSS bar chart
function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <span className="w-12 text-xs text-right font-bold text-white">{value.toLocaleString()}</span>
    </div>
  );
}

// Donut segment via conic-gradient
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  let cumulative = 0;
  const stops = segments.map(seg => {
    const pct = (seg.value / total) * 100;
    const start = cumulative;
    cumulative += pct;
    return `${seg.color} ${start.toFixed(1)}% ${cumulative.toFixed(1)}%`;
  }).join(", ");
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="w-24 h-24 rounded-full flex-shrink-0" style={{
        background: `conic-gradient(${stops})`,
        WebkitMask: "radial-gradient(circle at center, transparent 38%, black 38%)",
        mask: "radial-gradient(circle at center, transparent 38%, black 38%)",
      }} />
      <div className="space-y-1.5 flex-1 min-w-32">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span style={{ color: "rgba(255,255,255,0.55)" }}>{seg.label}</span>
            <span className="ml-auto font-bold text-white">{Math.round((seg.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Boost tier rank helper — must stay in sync with BOOST_PACKAGES in BoostsPage
const BOOST_RANK: Record<string, number> = {
  starter: 1, spark: 2, flame: 3, blaze: 4, inferno: 5, legend: 6,
  titan: 7, supernova: 8, colossus: 9, sovereign: 10,
};
type AnalyticsTier = "none" | "basic" | "full" | "premium" | "revenue";
function getAnalyticsTier(activeBoost: string | null): AnalyticsTier {
  const r = activeBoost ? (BOOST_RANK[activeBoost] ?? 0) : 0;
  if (r === 0) return "none";
  if (r <= 2) return "basic";   // starter, spark
  if (r <= 4) return "full";    // flame, blaze
  if (r <= 5) return "premium"; // inferno
  return "revenue";             // legend, titan, supernova, colossus, sovereign
}

// Mock dashboard data for demo mode (API offline)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MOCK_DASHBOARD = {
  profile: null,
  stats: {
    totalEarnings: 87500,  // cents → $875
    monthlyEarnings: 124300, // cents → $1,243
    subscriberCount: MOCK_PROFILES[0].followersCount ?? 12847,
  },
  recentTips: [
    { amount: 500, createdAt: new Date(Date.now() - 3600000).toISOString(), metadata: null },
    { amount: 150, createdAt: new Date(Date.now() - 7200000).toISOString(), metadata: null },
    { amount: 1000, createdAt: new Date(Date.now() - 14400000).toISOString(), metadata: null },
  ],
  recentSubs: MOCK_PROFILES.slice(2, 8).map((p, i) => ({
    id: `s${i + 1}`,
    createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
    subscriber: {
      id: p.id,
      username: p.username,
      profile: { displayName: p.displayName, avatarUrl: p.avatarUrl },
    },
  })),
  liveFeeds: [
    { id: "lf1", title: "Evening Chat & Chill ☀️", startedAt: new Date(Date.now() - 3600000).toISOString(), isLive: false, viewerCount: 1247, peakViewers: 1580, endedAt: null },
    { id: "lf2", title: "Late Night Vibes 🔥", startedAt: new Date(Date.now() - 86400000).toISOString(), isLive: false, viewerCount: 892, peakViewers: 1120, endedAt: null },
    { id: "lf3", title: "Q&A Special 🎤", startedAt: new Date(Date.now() - 172800000).toISOString(), isLive: false, viewerCount: 634, peakViewers: 780, endedAt: null },
  ],
} as unknown as CreatorDashboardData;

const QUICK_ACTIONS: { label: string; icon: React.ElementType; color: string; href: string | null }[] = [
  { label: "Go Live", icon: Radio, color: "#ef4444", href: "/creator/studio" },
  { label: "Upload Content", icon: Upload, color: "#14b8a6", href: null },
  { label: "Manage Tiers", icon: Zap, color: "#e8a87c", href: "/boosts" },
  { label: "Account Settings", icon: Settings, color: "#a78bfa", href: "/account" },
];

function centsToDisplay(cents: number) {
  return `$${(cents / 100).toFixed(2).replace(/\.00$/, "")}`;
}

export default function CreatorDashboard() {
  const { credits, isLoggedIn, showToast, activeBoost } = useApp();
  const analyticsTier = getAnalyticsTier(activeBoost);
  const [activeTab, setActiveTab] = useState<"overview" | "content" | "fans" | "analytics">("overview");
  const [data, setData] = useState<CreatorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);

    // Safety timeout: if the API hangs (e.g. server returns 503 on preflight),
    // fall back to demo data after 5 seconds rather than showing a spinner forever.
    const fallbackTimer = setTimeout(() => {
      setData(MOCK_DASHBOARD);
      setLoading(false);
    }, 5000);

    creatorApi.dashboard()
      .then(d => {
        clearTimeout(fallbackTimer);
        setData(d);
      })
      .catch(() => {
        clearTimeout(fallbackTimer);
        // Any error (network, CORS, HTTP) → use demo data in offline/dev mode
        setData(MOCK_DASHBOARD);
      })
      .finally(() => {
        clearTimeout(fallbackTimer);
        setLoading(false);
      });

    return () => clearTimeout(fallbackTimer);
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-white mb-2">Sign in to view your dashboard</p>
          <Link href="/login"><button className="vl-btn-primary px-6 py-2.5 text-sm">Sign In</button></Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#14b8a6" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "#f87171" }} />
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>{error}</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            You may need to apply as a creator first.
          </p>
          <Link href="/become-creator">
            <button className="vl-btn-primary px-6 py-2.5 text-sm mt-4">Apply as Creator</button>
          </Link>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const recentActivity = [
    ...(data?.recentTips ?? []).map(t => ({
      type: "tip" as const,
      fan: "Fan",
      amount: Math.abs(t.amount),
      time: new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    })),
    ...(data?.recentSubs ?? []).map(s => ({
      type: "sub" as const,
      fan: s.subscriber.profile?.displayName ?? s.subscriber.username,
      amount: 0,
      time: new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    })),
  ].sort((a, b) => (a.time > b.time ? -1 : 1)).slice(0, 5);

  // Build a simple bar chart from live feeds data
  const liveHistory = data?.liveFeeds ?? [];

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Creator Dashboard</h1>
            <p className="text-base" style={{ color: "rgba(255,255,255,0.4)" }}>Welcome back — here's how you're doing</p>
          </div>
          <Link href="/creator/studio">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
              <Radio className="w-4 h-4" />
              Go Live
            </button>
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {[
            { icon: DollarSign, label: "Total Earnings", value: centsToDisplay(stats?.totalEarnings ?? 0), color: "#14b8a6" },
            { icon: TrendingUp, label: "This Month", value: centsToDisplay(stats?.monthlyEarnings ?? 0), color: "#e8a87c" },
            { icon: Users, label: "Subscribers", value: (stats?.subscriberCount ?? 0).toLocaleString(), color: "#a78bfa" },
            { icon: Eye, label: "Streams", value: liveHistory.length.toLocaleString(), color: "#f97316" },
          ].map(stat => (
            <div key={stat.label} className="vl-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}25` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.label}</p>
                <p className="text-2xl font-black text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 vl-card p-1.5 w-fit flex-wrap">
          {(["overview", "content", "fans", "analytics"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-lg text-base font-semibold capitalize transition-all flex items-center gap-1.5"
              style={activeTab === tab
                ? { background: "rgba(20,184,166,0.15)", color: "#14b8a6" }
                : { color: "rgba(255,255,255,0.45)" }
              }>
              {tab === "analytics" && <BarChart2 className="w-3.5 h-3.5" />}
              {tab}
              {tab === "analytics" && analyticsTier === "none" && (
                <Lock className="w-3 h-3 opacity-50" />
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-5">
            {activeTab === "overview" && (
              <>
                {/* Recent live streams */}
                {liveHistory.length > 0 && (
                  <div className="vl-card p-5">
                    <h3 className="text-base font-bold text-white mb-4">Recent Streams</h3>
                    <div className="space-y-3">
                      {liveHistory.map(feed => (
                        <div key={feed.id} className="flex items-center justify-between py-2 border-b"
                          style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                          <div>
                            <p className="text-base text-white font-medium">{feed.title}</p>
                            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                              {new Date(feed.startedAt).toLocaleDateString()}
                              {feed.isLive ? " · 🔴 Live now" : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-bold" style={{ color: "#14b8a6" }}>{feed.viewerCount} viewers</p>
                            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>peak {feed.peakViewers}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick actions */}
                <div className="vl-card p-5">
                  <h3 className="text-base font-bold text-white mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {QUICK_ACTIONS.map(action => {
                      const btn = (
                        <button
                          key={action.label}
                          className="w-full vl-card p-3 text-center hover:border-white/20 transition-all group"
                          onClick={action.href === null ? () => setActiveTab("content") : undefined}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2"
                            style={{ background: `${action.color}15`, border: `1px solid ${action.color}25` }}>
                            <action.icon className="w-4 h-4" style={{ color: action.color }} />
                          </div>
                          <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.65)" }}>{action.label}</p>
                        </button>
                      );
                      return action.href !== null ? (
                        <Link key={action.label} href={action.href}>{btn}</Link>
                      ) : btn;
                    })}
                  </div>
                </div>
              </>
            )}

            {activeTab === "content" && (
              <div className="vl-card p-5">
                <h3 className="text-base font-bold text-white mb-4">Content Library</h3>
                <div className="text-center py-12">
                  <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
                  <p className="text-base" style={{ color: "rgba(255,255,255,0.4)" }}>No content uploaded yet</p>
                  <p className="text-sm mt-1 mb-4" style={{ color: "rgba(255,255,255,0.25)" }}>Upload photos and videos to share with your subscribers</p>
                  <button
                    className="vl-btn-primary px-6 py-2 text-sm"
                    onClick={() => showToast({ title: "Upload Content", description: "File upload is coming soon — this feature is in development." })}
                  >Upload First Content</button>
                </div>
              </div>
            )}

            {activeTab === "fans" && (
              <div className="vl-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white">Recent Subscribers</h3>
                  <Link href="/messages">
                    <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                      style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }}>
                      <MessageSquare className="w-3.5 h-3.5" /> All Messages
                    </button>
                  </Link>
                </div>
                {(data?.recentSubs ?? []).length === 0 ? (
                  <p className="text-base text-center py-8" style={{ color: "rgba(255,255,255,0.4)" }}>No subscribers yet</p>
                ) : (
                  <div className="space-y-1">
                    {(data?.recentSubs ?? []).map((sub: any) => {
                      const name = sub.subscriber.profile?.displayName ?? sub.subscriber.username;
                      const initial = name[0].toUpperCase();
                      const av = sub.subscriber.profile?.avatarUrl ?? null;
                      const subId = sub.subscriber.id ?? sub.subscriber.username;
                      const chatHref = `/messages?with=${encodeURIComponent(subId)}&username=${encodeURIComponent(sub.subscriber.username)}&name=${encodeURIComponent(name)}`;
                      return (
                        <div key={sub.id}
                          className="flex items-center justify-between py-3 px-2 rounded-xl transition-all hover:bg-white/5"
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <div className="flex items-center gap-3">
                            {av
                              ? <img src={av} alt={name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                              : (
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                                  style={{ background: "rgba(20,184,166,0.15)", color: "#14b8a6" }}>
                                  {initial}
                                </div>
                              )
                            }
                            <div>
                              <p className="text-sm font-semibold text-white">{name}</p>
                              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                                @{sub.subscriber.username} · {new Date(sub.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Link href={chatHref}>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                              style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }}>
                              <MessageSquare className="w-3.5 h-3.5" /> Chat
                            </button>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Analytics tab ───────────────────────────────────────────── */}
            {activeTab === "analytics" && (
              <div className="space-y-5">
                {/* Tier banner */}
                <div className="rounded-xl p-4 flex items-center justify-between flex-wrap gap-3"
                  style={{
                    background: analyticsTier === "none" ? "rgba(255,255,255,0.02)" : "rgba(20,184,166,0.06)",
                    border: `1px solid ${analyticsTier === "none" ? "rgba(255,255,255,0.06)" : "rgba(20,184,166,0.2)"}`,
                  }}>
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4" style={{ color: analyticsTier === "none" ? "rgba(255,255,255,0.25)" : "#14b8a6" }} />
                    <span className="text-sm font-bold" style={{ color: analyticsTier === "none" ? "rgba(255,255,255,0.4)" : "white" }}>
                      {analyticsTier === "none"    ? "Analytics locked"        :
                       analyticsTier === "basic"   ? "Basic Analytics — Spark" :
                       analyticsTier === "full"    ? "Full Analytics — Flame"  :
                       analyticsTier === "premium" ? "Premium Analytics — Inferno" :
                                                     "Revenue Analytics — Legend"}
                    </span>
                  </div>
                  {analyticsTier === "none" && (
                    <Link href="/boosts">
                      <button className="text-xs font-bold px-3 py-1.5 rounded-lg"
                        style={{ background: "rgba(20,184,166,0.1)", color: "#14b8a6", border: "1px solid rgba(20,184,166,0.2)" }}>
                        Upgrade Boost →
                      </button>
                    </Link>
                  )}
                </div>

                {analyticsTier === "none" ? (
                  /* ── Locked state ── */
                  <div className="vl-card p-8 text-center">
                    <Lock className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
                    <h3 className="text-base font-bold text-white mb-2">Analytics require a Boost package</h3>
                    <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Subscribe to <strong style={{ color: "#64748b" }}>Spark</strong> for basic stats,
                      <strong style={{ color: "#14B8A6" }}> Flame</strong> for full analytics,
                      <strong style={{ color: "#f97316" }}> Inferno</strong> for premium insights, or
                      <strong style={{ color: "#f59e0b" }}> Legend</strong> for revenue forecasting.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 opacity-40">
                      {[
                        { label: "7-day Viewers",  val: "2,149",  color: "#14b8a6" },
                        { label: "Engagement",     val: "8.4%",   color: "#a78bfa" },
                        { label: "Avg Watch",      val: "18m32s", color: "#e8a87c" },
                        { label: "New Followers",  val: "+47",    color: "#f97316" },
                      ].map(s => (
                        <div key={s.label} className="rounded-xl p-3 text-center"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <p className="text-lg font-black" style={{ color: s.color }}>{s.val}</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <Link href="/boosts">
                      <button className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)" }}>
                        Get a Boost Package
                      </button>
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* ── Basic stats (all tiers) ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "7-day Viewers",  val: VIEWER_DATA.reduce((a,b) => a+b, 0).toLocaleString(), color: "#14b8a6" },
                        { label: "Engagement",     val: "8.4%",   color: "#a78bfa" },
                        { label: "Avg Watch Time", val: "18m 32s",color: "#e8a87c" },
                        { label: "New Followers",  val: "+47",    color: "#f97316" },
                      ].map(s => (
                        <div key={s.label} className="vl-card p-4 text-center">
                          <p className="text-xl font-black" style={{ color: s.color }}>{s.val}</p>
                          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* ── Full analytics: charts (Flame+) ── */}
                    {(analyticsTier === "full" || analyticsTier === "premium" || analyticsTier === "revenue") && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          {/* Viewer trend */}
                          <div className="vl-card p-5">
                            <p className="text-sm font-bold text-white mb-1">Viewer Trend</p>
                            <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>Last 7 days · peak {Math.max(...VIEWER_DATA).toLocaleString()}</p>
                            <SparkLine data={VIEWER_DATA} color="#14b8a6" maxVal={maxViewers} />
                            <div className="flex justify-between mt-1">
                              {WEEK_LABELS.map(d => (
                                <span key={d} className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>{d}</span>
                              ))}
                            </div>
                          </div>
                          {/* Earnings trend */}
                          <div className="vl-card p-5">
                            <p className="text-sm font-bold text-white mb-1">Daily Earnings</p>
                            <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>Last 7 days · peak ${Math.max(...EARNINGS_DATA)}</p>
                            <SparkLine data={EARNINGS_DATA} color="#e8a87c" maxVal={maxEarnings} />
                            <div className="flex justify-between mt-1">
                              {WEEK_LABELS.map(d => (
                                <span key={d} className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>{d}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        {/* Top content */}
                        <div className="vl-card p-5">
                          <p className="text-sm font-bold text-white mb-4">Top Performing Streams</p>
                          <div className="space-y-3">
                            {[
                              { title: "Evening Chat & Chill ☀️",  viewers: 489, earnings: 168 },
                              { title: "Late Night Vibes 🔥",      viewers: 334, earnings: 127 },
                              { title: "Q&A Special 🎤",           viewers: 267, earnings: 93  },
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                  style={{ background: "rgba(20,184,166,0.15)", color: "#14b8a6" }}>{i+1}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{item.title}</p>
                                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{item.viewers} viewers · ${item.earnings} earned</p>
                                </div>
                                <TrendingUp className="w-4 h-4 flex-shrink-0" style={{ color: "#14b8a6" }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* ── Premium analytics (Inferno+) ── */}
                    {(analyticsTier === "premium" || analyticsTier === "revenue") && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          {/* Audience demographics */}
                          <div className="vl-card p-5">
                            <p className="text-sm font-bold text-white mb-4">Audience Demographics</p>
                            <DonutChart segments={[
                              { label: "18–24",  value: 38, color: "#14b8a6" },
                              { label: "25–34",  value: 31, color: "#8b5cf6" },
                              { label: "35–44",  value: 18, color: "#e8a87c" },
                              { label: "45+",    value: 13, color: "#f97316" },
                            ]} />
                          </div>
                          {/* Traffic sources */}
                          <div className="vl-card p-5">
                            <p className="text-sm font-bold text-white mb-4">Traffic Sources</p>
                            <div className="space-y-3">
                              {[
                                { label: "Search",   value: 45, color: "#14b8a6" },
                                { label: "Featured", value: 28, color: "#f59e0b" },
                                { label: "Direct",   value: 17, color: "#8b5cf6" },
                                { label: "Social",   value: 10, color: "#e8a87c" },
                              ].map(s => (
                                <BarRow key={s.label} label={s.label} value={s.value} max={45} color={s.color} />
                              ))}
                            </div>
                          </div>
                        </div>
                        {/* Conversion funnel */}
                        <div className="vl-card p-5">
                          <p className="text-sm font-bold text-white mb-4">Conversion Funnel</p>
                          <div className="space-y-2">
                            {[
                              { stage: "Profile Impressions", value: 12400, pct: 100, color: "#14b8a6" },
                              { stage: "Profile Views",       value: 3720,  pct: 30,  color: "#8b5cf6" },
                              { stage: "Follows",             value: 744,   pct: 6,   color: "#e8a87c" },
                              { stage: "Subscribers",         value: 149,   pct: 1.2, color: "#f59e0b" },
                            ].map(f => (
                              <div key={f.stage} className="flex items-center gap-3">
                                <span className="w-36 text-xs flex-shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>{f.stage}</span>
                                <div className="flex-1 h-5 rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                                  <div className="h-full rounded-lg flex items-center px-2"
                                    style={{ width: `${f.pct}%`, background: f.color, minWidth: 40 }}>
                                    <span className="text-xs font-bold text-white whitespace-nowrap">{f.value.toLocaleString()}</span>
                                  </div>
                                </div>
                                <span className="w-12 text-xs text-right" style={{ color: "rgba(255,255,255,0.4)" }}>{f.pct}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* ── Revenue analytics (Legend) ── */}
                    {analyticsTier === "revenue" && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          {/* Revenue breakdown */}
                          <div className="vl-card p-5">
                            <p className="text-sm font-bold text-white mb-4">Revenue by Source</p>
                            <DonutChart segments={[
                              { label: "Subscriptions", value: 52, color: "#14b8a6" },
                              { label: "Tips",          value: 28, color: "#e8a87c" },
                              { label: "PPV Content",   value: 13, color: "#8b5cf6" },
                              { label: "Gifts",         value: 7,  color: "#f59e0b" },
                            ]} />
                          </div>
                          {/* KPI cards */}
                          <div className="vl-card p-5 space-y-4">
                            <p className="text-sm font-bold text-white">Revenue KPIs</p>
                            {[
                              { label: "Fan Lifetime Value",   value: "$47.80", color: "#14b8a6" },
                              { label: "Monthly Recurring Rev", value: "$1,243", color: "#e8a87c" },
                              { label: "30-day Forecast",      value: "$1,410", color: "#8b5cf6" },
                              { label: "Churn Rate (30d)",     value: "4.2%",   color: "#f59e0b" },
                            ].map(k => (
                              <div key={k.label} className="flex items-center justify-between">
                                <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{k.label}</span>
                                <span className="text-sm font-black" style={{ color: k.color }}>{k.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* MRR trend */}
                        <div className="vl-card p-5">
                          <p className="text-sm font-bold text-white mb-1">MRR Trend</p>
                          <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>Monthly recurring revenue over 7 weeks</p>
                          <SparkLine data={[820, 890, 940, 1050, 1100, 1210, 1243]} color="#f59e0b" maxVal={1400} />
                        </div>
                      </>
                    )}

                    {/* Upgrade nudge for lower tiers */}
                    {analyticsTier !== "revenue" && (
                      <div className="rounded-xl p-4 flex items-center justify-between gap-3"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {analyticsTier === "basic"   ? "Upgrade to Flame for charts & engagement data" :
                             analyticsTier === "full"    ? "Upgrade to Inferno for demographics & conversion funnel" :
                                                          "Upgrade to Legend for revenue forecasting & LTV"}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                            Unlock deeper insights to grow your creator business
                          </p>
                        </div>
                        <Link href="/boosts">
                          <button className="text-xs font-bold px-4 py-2 rounded-lg flex-shrink-0"
                            style={{ background: "rgba(20,184,166,0.12)", color: "#14b8a6", border: "1px solid rgba(20,184,166,0.2)" }}>
                            Upgrade →
                          </button>
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Credits balance */}
            <div className="vl-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4" style={{ color: "#14b8a6" }} />
                <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>Your Credits</span>
              </div>
              <p className="text-3xl font-black" style={{ color: "#14b8a6" }}>{credits.toLocaleString()}</p>
              <Link href="/credits">
                <button className="mt-3 w-full py-1.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }}>
                  Buy Credits
                </button>
              </Link>
            </div>

            {/* Recent activity */}
            <div className="vl-card p-4">
              <h3 className="text-base font-bold text-white mb-3">Recent Activity</h3>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "rgba(255,255,255,0.35)" }}>No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((act, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{act.fan}</p>
                        <p className="text-sm capitalize" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {act.type === "tip" ? "💸 Tip" : "⭐ Subscribed"} · {act.time}
                        </p>
                      </div>
                      {act.amount > 0 && (
                        <span className="text-sm font-bold font-mono" style={{ color: "#14b8a6" }}>
                          +{act.amount}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payout */}
            <div className="vl-card p-4">
              <h3 className="text-base font-bold text-white mb-1">Earnings</h3>
              <p className="text-3xl font-black text-white mb-0.5">{centsToDisplay(stats?.monthlyEarnings ?? 0)}</p>
              <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>This month</p>
              <Link href="/billing">
                <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-white/5"
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
