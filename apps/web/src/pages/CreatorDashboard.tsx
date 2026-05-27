import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { creator as creatorApi, CreatorDashboardData } from "@/lib/api";
import { MOCK_PROFILES } from "@/lib/mock-data";
import { DollarSign, Users, Eye, Radio, TrendingUp, Upload, Settings, ChevronRight, Zap, Loader2, AlertCircle, BarChart2, Lock, MessageSquare, Gift, Copy, Check as CheckIcon, Star, Calendar, Clock, ToggleLeft, ToggleRight, Home, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { BOOST_TIERS } from "@/lib/membership-tiers";
import { DAYS, SLOTS, PEAK_CELLS, MOCK_BOOST_LOG, type ScheduleMap } from "@/lib/boost-data";

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

// Boost tier rank — index 0-based from BOOST_TIERS array (single source of truth)
const BOOST_RANK: Record<string, number> = Object.fromEntries(
  BOOST_TIERS.map((t, i) => [t.id, i + 1])
);

// Membership plans that unlock analytics (higher memberships grant higher tiers)
// This lets ultra-premium members get analytics without a separate boost purchase.
const MEMBERSHIP_ANALYTICS: Record<string, number> = {
  // free / fan / supporter / superfan → 0 (no analytics, boost required)
  devotee:     1, // basic
  allaccess:   1, // basic
  elite:       2, // full
  creatorpass: 2, // full
  blackcard:   3, // premium
  diamond:     4, // revenue
  obsidian:    4, // revenue
  platinum_m:  4, // revenue — $4,999/mo absolutely includes revenue analytics
};

const TIER_LEVELS = ["none", "basic", "full", "premium", "revenue"] as const;
type AnalyticsTier = typeof TIER_LEVELS[number];

function getAnalyticsTier(activeBoost: string | null, activeMembership: string): AnalyticsTier {
  // Boost-based level
  const r = activeBoost ? (BOOST_RANK[activeBoost] ?? 0) : 0;
  let boostLevel = 0;
  if (r > 0)  boostLevel = 1; // basic
  if (r > 2)  boostLevel = 2; // full  (flame, blaze)
  if (r > 4)  boostLevel = 3; // premium (inferno)
  if (r > 5)  boostLevel = 4; // revenue (legend+)

  // Membership-based level (caps at 4 = revenue)
  const membershipLevel = MEMBERSHIP_ANALYTICS[activeMembership] ?? 0;

  // Take the higher of the two — membership OR boost unlocks analytics
  const level = Math.max(boostLevel, membershipLevel);
  return TIER_LEVELS[level];
}

// Deterministic referral code from username
function makeReferralCode(username: string): string {
  const slug = username.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8).padEnd(4, "X");
  const hash = username.split("").reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffff, 7);
  return `${slug}-${String(hash % 10000).padStart(4, "0")}`;
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
  const { credits, isLoggedIn, showToast, activeBoost, activeMembership, user } = useApp();
  const analyticsTier = getAnalyticsTier(activeBoost, activeMembership);
  const [activeTab, setActiveTab] = useState<"overview" | "content" | "fans" | "analytics" | "boosts" | "referral">("overview");
  const [codeCopied, setCodeCopied] = useState(false);
  const [boostClaimed, setBoostClaimed] = useState(() => {
    try { return localStorage.getItem("linkme_referral_claimed") === "1"; } catch { return false; }
  });
  // Boost scheduling state (persisted to localStorage, same keys as BoostsPage)
  const [schedule, setSchedule] = useState<ScheduleMap>(() => {
    try { return JSON.parse(localStorage.getItem("vl_boost_schedule_v1") ?? "{}"); } catch { return {}; }
  });
  const [autoBoost, setAutoBoost] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem("vl_boost_auto_v1") ?? "false"); } catch { return false; }
  });
  const [showAllLog, setShowAllLog] = useState(false);

  const saveSchedule = (s: ScheduleMap) => {
    setSchedule(s);
    try { localStorage.setItem("vl_boost_schedule_v1", JSON.stringify(s)); } catch {}
  };
  const toggleCell = (key: string) => saveSchedule({ ...schedule, [key]: !schedule[key] });
  const toggleAutoBoost = () => {
    const next = !autoBoost;
    setAutoBoost(next);
    try { localStorage.setItem("vl_boost_auto_v1", JSON.stringify(next)); } catch {}
    if (next) {
      const auto: ScheduleMap = {};
      PEAK_CELLS.forEach(k => { auto[k] = true; });
      saveSchedule(auto);
      showToast({ title: "Auto-Boost enabled", description: "Boosts will fire automatically at peak engagement windows." });
    }
  };
  const scheduledCount = Object.values(schedule).filter(Boolean).length;

  // Demo referral progress — in production these come from the API
  const REFERRAL_TARGET_COUNT = 25;
  const REFERRAL_TARGET_EARNINGS = 10000;
  const referralCount = 7;   // mock: 7 of 25 referrals so far
  const referralEarnings = 2840; // mock: $2,840 of $10,000/mo earned by referrals
  const referralCode = makeReferralCode(user?.username ?? "creator");
  const referralMet = referralCount >= REFERRAL_TARGET_COUNT && referralEarnings >= REFERRAL_TARGET_EARNINGS;
  const [data, setData] = useState<CreatorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoData, setIsDemoData] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    setIsDemoData(false);

    // Safety timeout: if the API hangs (e.g. server returns 503 on preflight),
    // fall back to demo data after 5 seconds rather than showing a spinner forever.
    const fallbackTimer = setTimeout(() => {
      setData(MOCK_DASHBOARD);
      setIsDemoData(true);
      setLoading(false);
    }, 5000);

    creatorApi.dashboard()
      .then(d => {
        clearTimeout(fallbackTimer);
        setData(d);
        setIsDemoData(false);
      })
      .catch(() => {
        clearTimeout(fallbackTimer);
        // Any error (network, CORS, HTTP) → use demo data in offline/dev mode
        setData(MOCK_DASHBOARD);
        setIsDemoData(true);
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
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-white">Creator Dashboard</h1>
              {isDemoData && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)", color: "#fb923c" }}>
                  Demo Data
                </span>
              )}
            </div>
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

        {/* Tabs — horizontally scrollable on narrow screens */}
        <div className="overflow-x-auto pb-1 -mx-4 px-4 mb-6">
        <div className="flex gap-1 vl-card p-1.5 w-fit min-w-full sm:min-w-0">
          {(["overview", "content", "fans", "analytics", "boosts", "referral"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-lg text-base font-semibold capitalize transition-all flex items-center gap-1.5"
              style={activeTab === tab
                ? { background: tab === "referral" ? "rgba(232,168,124,0.15)" : tab === "boosts" ? "rgba(249,115,22,0.15)" : "rgba(20,184,166,0.15)", color: tab === "referral" ? "#e8a87c" : tab === "boosts" ? "#f97316" : "#14b8a6" }
                : { color: "rgba(255,255,255,0.45)" }
              }>
              {tab === "analytics" && <BarChart2 className="w-3.5 h-3.5" />}
              {tab === "boosts"    && <Zap        className="w-3.5 h-3.5" />}
              {tab === "referral"  && <Gift       className="w-3.5 h-3.5" />}
              {tab}
              {tab === "analytics" && analyticsTier === "none" && (
                <Lock className="w-3 h-3 opacity-50" />
              )}
              {tab === "boosts" && activeBoost && (
                <span className="w-2 h-2 rounded-full" style={{ background: "#f97316" }} />
              )}
              {tab === "referral" && !boostClaimed && referralCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-orange-400 ml-0.5" />
              )}
            </button>
          ))}
        </div>
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
                      Get a <strong style={{ color: "#64748b" }}>Spark</strong> boost for basic stats,
                      <strong style={{ color: "#14B8A6" }}> Flame</strong> for full analytics,
                      <strong style={{ color: "#f97316" }}> Inferno</strong> for premium insights, or
                      <strong style={{ color: "#f59e0b" }}> Legend</strong> for revenue forecasting.
                      High-tier memberships (Elite+) also unlock analytics.
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
                            {analyticsTier === "basic"   ? "Upgrade to Flame boost or Elite+ membership for charts & engagement" :
                             analyticsTier === "full"    ? "Upgrade to Inferno boost or Black Card+ membership for demographics & funnel" :
                                                          "Upgrade to Legend boost or Diamond+ membership for revenue forecasting & LTV"}
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
            {/* ── Boosts tab ───────────────────────────────────────────── */}
            {activeTab === "boosts" && (() => {
              const activePkg = activeBoost ? BOOST_TIERS.find(t => t.id === activeBoost) : null;
              const boostIdx  = activeBoost ? BOOST_TIERS.findIndex(t => t.id === activeBoost) : -1;
              const hasScheduling   = boostIdx >= 2; // Flame+
              const hasAutomation   = boostIdx >= 4; // Inferno+
              const hasFeaturedHome = boostIdx >= 4;
              const hasFeaturedLive = boostIdx >= 2;
              const hasCategoryTop  = boostIdx >= 3; // Blaze+
              const isUnlimited = (activePkg?.boosts ?? 0) >= 9999;
              const used = MOCK_BOOST_LOG.length;
              const remaining = isUnlimited ? null : (activePkg?.boosts ?? 0) - used;
              const usagePct = isUnlimited ? 20 : activePkg ? Math.min((used / activePkg.boosts) * 100, 100) : 0;
              const resetDate = (() => {
                const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(1);
                return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              })();
              const logColor = activePkg?.color ?? "#f97316";
              const visibleLog = showAllLog ? MOCK_BOOST_LOG : MOCK_BOOST_LOG.slice(0, 8);
              const totalImpressions = MOCK_BOOST_LOG.reduce((s, e) => s + e.impressions, 0);
              const totalViews       = MOCK_BOOST_LOG.reduce((s, e) => s + e.views, 0);
              const totalFollows     = MOCK_BOOST_LOG.reduce((s, e) => s + e.follows, 0);

              if (!activePkg) {
                return (
                  <div className="vl-card p-8 text-center">
                    <Zap className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
                    <h3 className="text-base font-bold text-white mb-2">No active boost</h3>
                    <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Get a Profile Boost to unlock the scheduler, usage tracker, and activity log here.
                    </p>
                    <Link href="/boosts">
                      <button className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                        Browse Boost Plans
                      </button>
                    </Link>
                  </div>
                );
              }

              return (
                <div className="space-y-5">
                  {/* ── Monthly Usage ─────────────────────────────── */}
                  <div className="vl-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" style={{ color: activePkg.color }} />
                        <p className="text-sm font-bold text-white">Monthly Boost Usage</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${activePkg.color}18`, border: `1px solid ${activePkg.color}35`, color: activePkg.color }}>
                          {activePkg.emoji} {activePkg.name}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Resets {resetDate}</p>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${usagePct}%`, background: `linear-gradient(90deg, ${activePkg.color}, ${activePkg.color}bb)` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: "rgba(255,255,255,0.5)" }}><strong className="text-white">{used}</strong> boosts fired this month</span>
                      <span style={{ color: activePkg.color, fontWeight: 700 }}>
                        {isUnlimited ? "∞ unlimited" : <><strong>{remaining}</strong> remaining of {activePkg.boosts}</>}
                      </span>
                    </div>
                    {(autoBoost || scheduledCount > 0) && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        <Clock className="w-3 h-3" style={{ color: activePkg.color }} />
                        Next boost: <span style={{ color: activePkg.color }}>
                          {autoBoost ? "Tonight, 6:00 PM (Evening)" : "Next scheduled slot"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ── Active Placements ─────────────────────────── */}
                  <div className="vl-card p-5">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" style={{ color: "#f97316" }} />
                      Active Placements
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { icon: Radio,   label: "Live Feeds Featured",  active: hasFeaturedLive,  href: "/live",     reqTier: "Flame"   },
                        { icon: Home,    label: "Homepage Featured",     active: hasFeaturedHome,  href: "/",         reqTier: "Inferno"  },
                        { icon: Star,    label: "Category Top",          active: hasCategoryTop,   href: "/profiles", reqTier: "Blaze"   },
                      ].map(item => (
                        <div key={item.label} className="rounded-xl p-4"
                          style={{
                            background: item.active ? "rgba(249,115,22,0.07)" : "rgba(255,255,255,0.02)",
                            border: `1px solid ${item.active ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.06)"}`,
                          }}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <item.icon className="w-3.5 h-3.5" style={{ color: item.active ? "#f97316" : "rgba(255,255,255,0.2)" }} />
                            <span className="text-xs font-bold" style={{ color: item.active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)" }}>
                              {item.label}
                            </span>
                          </div>
                          {item.active ? (
                            <Link href={item.href}>
                              <button className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                                style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }}>
                                View →
                              </button>
                            </Link>
                          ) : (
                            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Requires {item.reqTier}+</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Boost Scheduler ───────────────────────────── */}
                  {hasScheduling ? (
                    <div className="vl-card p-5">
                      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Calendar className="w-4 h-4" style={{ color: "#f97316" }} />
                            Boost Scheduler
                          </h3>
                          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                            {scheduledCount > 0 ? `${scheduledCount} slot${scheduledCount !== 1 ? "s" : ""} scheduled` : "No slots selected yet"}
                          </p>
                        </div>
                        {hasAutomation && (
                          <button onClick={toggleAutoBoost}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                            style={{
                              background: autoBoost ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.04)",
                              border: `1px solid ${autoBoost ? "rgba(249,115,22,0.3)" : "rgba(255,255,255,0.1)"}`,
                              color: autoBoost ? "#f97316" : "rgba(255,255,255,0.5)",
                            }}>
                            {autoBoost ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            Auto-Boost {autoBoost ? "ON" : "OFF"}
                          </button>
                        )}
                      </div>
                      {autoBoost && (
                        <div className="rounded-lg px-3 py-2 mb-4 text-xs flex items-center gap-2"
                          style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c" }}>
                          <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                          Auto-Boost active — firing at peak engagement windows (highlighted below).
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr>
                              <th className="text-left pb-2 pr-3 font-semibold" style={{ color: "rgba(255,255,255,0.3)", width: 90 }}>
                                <Clock className="w-3 h-3 inline mr-1" />Slot
                              </th>
                              {DAYS.map(d => (
                                <th key={d} className="text-center pb-2 font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>{d}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {SLOTS.map(slot => (
                              <tr key={slot.id}>
                                <td className="pr-3 py-1.5">
                                  <p className="font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>{slot.label}</p>
                                  <p style={{ color: "rgba(255,255,255,0.25)" }}>{slot.time}</p>
                                </td>
                                {DAYS.map(day => {
                                  const key = `${day}-${slot.id}`;
                                  const isPeak = PEAK_CELLS.has(key);
                                  const isOn   = schedule[key];
                                  return (
                                    <td key={day} className="text-center py-1.5">
                                      <button
                                        onClick={() => !autoBoost && toggleCell(key)}
                                        disabled={autoBoost}
                                        className="w-7 h-7 rounded-lg mx-auto flex items-center justify-center transition-all"
                                        style={{
                                          background: isOn ? (isPeak ? "rgba(249,115,22,0.3)" : "rgba(249,115,22,0.15)") : (isPeak ? "rgba(249,115,22,0.06)" : "rgba(255,255,255,0.03)"),
                                          border: isOn ? (isPeak ? "1px solid rgba(249,115,22,0.5)" : "1px solid rgba(249,115,22,0.3)") : "1px solid rgba(255,255,255,0.07)",
                                          cursor: autoBoost ? "default" : "pointer",
                                        }}>
                                        {isOn ? <Zap className="w-3 h-3" style={{ color: "#f97316" }} />
                                          : isPeak ? <span style={{ color: "rgba(249,115,22,0.35)", fontSize: 9 }}>⬡</span>
                                          : null}
                                      </button>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded inline-block" style={{ background: "rgba(249,115,22,0.2)", border: "1px solid rgba(249,115,22,0.4)" }} />
                          Scheduled
                        </span>
                        {hasAutomation
                          ? <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.25)" }} />Peak (auto)</span>
                          : <span>Upgrade to Inferno+ for auto-scheduling</span>
                        }
                      </div>
                    </div>
                  ) : (
                    <div className="vl-card p-5 text-center">
                      <Calendar className="w-7 h-7 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
                      <p className="text-sm font-semibold text-white mb-1">Boost Scheduling</p>
                      <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                        Upgrade to <strong style={{ color: "#14b8a6" }}>Flame</strong> or above to schedule your boosts
                      </p>
                      <Link href="/boosts"><button className="text-xs px-4 py-2 rounded-lg font-semibold" style={{ background: "rgba(249,115,22,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }}>Upgrade Plan</button></Link>
                    </div>
                  )}

                  {/* ── Activity Log ──────────────────────────────── */}
                  <div className="vl-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <BarChart2 className="w-4 h-4" style={{ color: logColor }} />
                        Boost Activity Log
                      </h3>
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: `${logColor}14`, border: `1px solid ${logColor}30`, color: logColor }}>
                        {MOCK_BOOST_LOG.length} boosts this month
                      </span>
                    </div>

                    {/* Totals */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: "Impressions",   value: totalImpressions.toLocaleString(), color: logColor                  },
                        { label: "Profile Views", value: totalViews.toLocaleString(),        color: "rgba(255,255,255,0.85)"  },
                        { label: "New Follows",   value: `+${totalFollows}`,                 color: "#4ade80"                 },
                      ].map(s => (
                        <div key={s.label} className="rounded-xl p-3 text-center"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <p className="text-lg font-black mb-0.5" style={{ color: s.color }}>{s.value}</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Column headings */}
                    <div className="hidden sm:grid text-xs font-semibold mb-1 px-3"
                      style={{ color: "rgba(255,255,255,0.25)", gridTemplateColumns: "1fr 90px 72px 72px" }}>
                      <span>Fired · Placement</span>
                      <span className="text-right">Impressions</span>
                      <span className="text-right">Views</span>
                      <span className="text-right">Follows</span>
                    </div>

                    {/* Rows */}
                    <div className="space-y-1">
                      {visibleLog.map(entry => (
                        <div key={entry.id}
                          className="flex sm:grid items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/5"
                          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", gridTemplateColumns: "1fr 90px 72px 72px" }}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-semibold text-white">{entry.firedAt}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                                style={{ background: `${entry.placementColor}18`, color: entry.placementColor, border: `1px solid ${entry.placementColor}30` }}>
                                {entry.placement}
                              </span>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{entry.slot} slot</p>
                          </div>
                          <div className="flex sm:contents items-center gap-3 flex-shrink-0">
                            <span className="text-xs font-mono font-bold sm:text-right" style={{ color: logColor }}>+{entry.impressions.toLocaleString()}</span>
                            <span className="text-xs font-mono sm:text-right" style={{ color: "rgba(255,255,255,0.6)" }}>{entry.views}</span>
                            <span className="text-xs font-mono font-bold sm:text-right" style={{ color: entry.follows > 0 ? "#4ade80" : "rgba(255,255,255,0.2)" }}>
                              {entry.follows > 0 ? `+${entry.follows}` : "—"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {MOCK_BOOST_LOG.length > 8 && (
                      <button onClick={() => setShowAllLog(v => !v)}
                        className="w-full mt-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:bg-white/5"
                        style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                        {showAllLog ? <><ChevronUp className="w-3.5 h-3.5" />Show less</> : <><ChevronDown className="w-3.5 h-3.5" />Show all {MOCK_BOOST_LOG.length} boosts</>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ── Referral tab ─────────────────────────────────────────── */}
            {activeTab === "referral" && (
              <div className="space-y-5">
                {/* Header card */}
                <div className="rounded-xl p-5"
                  style={{ background: "linear-gradient(135deg, rgba(232,168,124,0.08), rgba(247,154,76,0.05))", border: "1px solid rgba(232,168,124,0.2)" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <Gift className="w-5 h-5" style={{ color: "#e8a87c" }} />
                    <h3 className="text-base font-bold text-white">Creator Referral Tier Boost</h3>
                    {boostClaimed && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(20,184,166,0.15)", color: "#14b8a6", border: "1px solid rgba(20,184,166,0.3)" }}>
                        ✓ Claimed
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
                    Bring in <strong className="text-white">25 subscribers or creators</strong> using your code, and when those referrals collectively earn <strong className="text-white">$10,000/month</strong> on-platform — you get a <strong style={{ color: "#e8a87c" }}>permanent revenue share rate boost</strong> to the next bracket (e.g. 80% → 83%). One-time only.
                  </p>
                </div>

                {/* Your referral code */}
                <div className="vl-card p-5">
                  <p className="text-sm font-bold text-white mb-3">Your Creator / Streamer Code</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-4 py-3 rounded-xl font-mono text-lg font-black tracking-widest text-center"
                      style={{ background: "rgba(232,168,124,0.08)", border: "1px solid rgba(232,168,124,0.25)", color: "#e8a87c" }}>
                      {referralCode}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(referralCode).catch(() => {});
                        setCodeCopied(true);
                        setTimeout(() => setCodeCopied(false), 2000);
                      }}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all"
                      style={{ background: codeCopied ? "rgba(20,184,166,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid ${codeCopied ? "rgba(20,184,166,0.3)" : "rgba(255,255,255,0.1)"}`, color: codeCopied ? "#14b8a6" : "rgba(255,255,255,0.65)" }}>
                      {codeCopied ? <CheckIcon className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {codeCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Share this code with creators and fans. New accounts enter it during sign-up to count toward your milestone.
                  </p>
                </div>

                {/* Progress */}
                <div className="vl-card p-5">
                  <p className="text-sm font-bold text-white mb-4">Milestone Progress</p>
                  <div className="space-y-5">
                    {/* Referral count bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5" style={{ color: "#e8a87c" }} />
                          <span className="text-sm font-semibold text-white">Qualifying Referrals</span>
                        </div>
                        <span className="text-sm font-black" style={{ color: referralCount >= REFERRAL_TARGET_COUNT ? "#14b8a6" : "#e8a87c" }}>
                          {referralCount} / {REFERRAL_TARGET_COUNT}
                        </span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(100, (referralCount / REFERRAL_TARGET_COUNT) * 100)}%`, background: referralCount >= REFERRAL_TARGET_COUNT ? "#14b8a6" : "linear-gradient(90deg, #e8a87c, #f97316)" }} />
                      </div>
                      <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {REFERRAL_TARGET_COUNT - referralCount > 0 ? `${REFERRAL_TARGET_COUNT - referralCount} more referrals needed` : "✓ Referral count met!"}
                      </p>
                    </div>

                    {/* Collective earnings bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5" style={{ color: "#e8a87c" }} />
                          <span className="text-sm font-semibold text-white">Referral Collective Earnings</span>
                        </div>
                        <span className="text-sm font-black" style={{ color: referralEarnings >= REFERRAL_TARGET_EARNINGS ? "#14b8a6" : "#e8a87c" }}>
                          ${referralEarnings.toLocaleString()} / ${REFERRAL_TARGET_EARNINGS.toLocaleString()}/mo
                        </span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(100, (referralEarnings / REFERRAL_TARGET_EARNINGS) * 100)}%`, background: referralEarnings >= REFERRAL_TARGET_EARNINGS ? "#14b8a6" : "linear-gradient(90deg, #e8a87c, #f97316)" }} />
                      </div>
                      <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {referralEarnings < REFERRAL_TARGET_EARNINGS
                          ? `$${(REFERRAL_TARGET_EARNINGS - referralEarnings).toLocaleString()} more/mo needed from your referrals`
                          : "✓ Earnings threshold met!"}
                      </p>
                    </div>
                  </div>

                  {/* Claim button */}
                  <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    {boostClaimed ? (
                      <div className="flex items-center gap-2 justify-center py-3 rounded-xl"
                        style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)" }}>
                        <CheckIcon className="w-4 h-4" style={{ color: "#14b8a6" }} />
                        <span className="text-sm font-bold" style={{ color: "#14b8a6" }}>Tier boost already claimed — enjoy the extra %!</span>
                      </div>
                    ) : (
                      <button
                        disabled={!referralMet}
                        onClick={() => {
                          if (!referralMet) return;
                          setBoostClaimed(true);
                          try { localStorage.setItem("linkme_referral_claimed", "1"); } catch {}
                          showToast({ title: "🎉 Tier Boost Unlocked!", description: "Your revenue share rate has been permanently boosted to the next bracket (e.g. 80% → 83%). Check your Creator Agreement §2.9 for details." });
                        }}
                        className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                        style={referralMet
                          ? { background: "linear-gradient(135deg, #e8a87c, #f97316)", color: "#09091a" }
                          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.25)", cursor: "not-allowed" }
                        }>
                        {referralMet ? "🏆 Claim Your Tier Boost" : `Complete both milestones to claim`}
                      </button>
                    )}
                    {!referralMet && !boostClaimed && (
                      <p className="text-xs text-center mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>
                        Both milestones must be met simultaneously to claim
                      </p>
                    )}
                  </div>
                </div>

                {/* How it works */}
                <div className="vl-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-4 h-4" style={{ color: "#e8a87c" }} />
                    <p className="text-sm font-bold text-white">How It Works</p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { num: "1", title: "Share your code", desc: "Give your Creator/Streamer Code to subscribers, friends, or other creators. They enter it when signing up." },
                      { num: "2", title: "Watch them grow", desc: "Once 25 referrals are active for 30+ days and collectively earn $10,000/month on-platform, both milestones turn green." },
                      { num: "3", title: "Claim your boost", desc: "Hit the Claim button — your revenue share tier is permanently boosted by one level. One time, forever." },
                    ].map(step => (
                      <div key={step.num} className="flex items-start gap-4">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                          style={{ background: "rgba(232,168,124,0.12)", border: "1px solid rgba(232,168,124,0.25)", color: "#e8a87c" }}>
                          {step.num}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{step.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 p-3 rounded-xl text-xs" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                    One-time reward per account. Non-repeatable. Rate boosted to next bracket (e.g. 80%→83%, 85%→87%), capped at 90%. Referrals must stay active 30+ days. Earnings measured on a rolling 30-day window. See Creator Agreement §2.9.
                  </div>
                </div>
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
