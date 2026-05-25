import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { creator as creatorApi, CreatorDashboardData } from "@/lib/api";
import { MOCK_PROFILES } from "@/lib/mock-data";
import { DollarSign, Users, Eye, Radio, TrendingUp, Upload, Settings, ChevronRight, Zap, Loader2, AlertCircle } from "lucide-react";

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
  recentSubs: [
    {
      id: "s1",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      subscriber: { username: "fan_marco", profile: { displayName: "Marco F." } },
    },
    {
      id: "s2",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      subscriber: { username: "chloe_xo", profile: { displayName: "Chloe" } },
    },
  ],
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
  const { credits, isLoggedIn, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<"overview" | "content" | "fans">("overview");
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
        <div className="flex gap-1 mb-6 vl-card p-1.5 w-fit">
          {(["overview", "content", "fans"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-lg text-base font-semibold capitalize transition-all"
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
                <h3 className="text-base font-bold text-white mb-4">Recent Subscribers</h3>
                {(data?.recentSubs ?? []).length === 0 ? (
                  <p className="text-base text-center py-8" style={{ color: "rgba(255,255,255,0.4)" }}>No subscribers yet</p>
                ) : (
                  (data?.recentSubs ?? []).map((sub, i) => (
                    <div key={sub.id} className="flex items-center justify-between py-3 border-b"
                      style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ background: "rgba(20,184,166,0.15)", color: "#14b8a6" }}>
                          {(sub.subscriber.profile?.displayName ?? sub.subscriber.username)[0].toUpperCase()}
                        </div>
                        <span className="text-base text-white">
                          {sub.subscriber.profile?.displayName ?? sub.subscriber.username}
                        </span>
                      </div>
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
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
