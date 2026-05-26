import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { boosts as boostsApi } from "@/lib/api";
import { Calendar, Zap, Clock, ToggleLeft, ToggleRight, TrendingUp, Home, Radio, Star } from "lucide-react";

// ── Boost tier helpers ────────────────────────────────────────────────────────
const BOOST_TIER_RANK: Record<string, number> = { spark: 1, flame: 2, inferno: 3, legend: 4 };
function boostRank(id: string | null) { return id ? (BOOST_TIER_RANK[id] ?? 0) : 0; }

// ── Schedule helpers ──────────────────────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS = [
  { id: "morning",   label: "Morning",   time: "6am–12pm" },
  { id: "afternoon", label: "Afternoon", time: "12–6pm"   },
  { id: "evening",   label: "Evening",   time: "6–10pm"   },
  { id: "night",     label: "Night",     time: "10pm–6am" },
];
// Peak hours recommended by the "algorithm"
const PEAK_CELLS = new Set(["Mon-evening","Tue-evening","Wed-evening","Thu-evening","Fri-evening","Sat-afternoon","Sat-evening","Sun-afternoon"]);
type ScheduleMap = Record<string, boolean>; // key: "Mon-morning"

const BOOST_PACKAGES = [
  { id: "spark", name: "Spark", emoji: "✨", boosts: 5, price: 9.99, features: ["5 profile boosts/month", "Priority in search results", "Boost notification to followers", "Basic analytics"], popular: false, color: "#64748b" },
  { id: "flame", name: "Flame", emoji: "🔥", boosts: 12, price: 19.99, features: ["12 profile boosts/month", "Top search placement", "Featured on Live Feeds", "Full analytics dashboard", "Boost scheduling"], popular: true, color: "#14B8A6" },
  { id: "inferno", name: "Inferno", emoji: "💥", boosts: 20, price: 34.99, features: ["20 profile boosts/month", "Homepage featured spot", "Category top placement", "Premium analytics", "Priority support", "Boost scheduling & automation"], popular: false, color: "#f97316" },
  { id: "legend", name: "Legend", emoji: "👑", boosts: 35, price: 59.99, features: ["35 boosts/month (MAX)", "Homepage shoutout", "VIP badge on profile", "Custom boost scheduling", "Revenue analytics"], popular: false, color: "#f59e0b" },
];

const MEMBERSHIP_PLANS = [
  {
    id: "free",
    name: "Free",
    emoji: "🌟",
    price: 0,
    billingPeriod: "Free forever",
    credits: 0,
    features: [
      "Browse all public creator profiles",
      "Watch free-tier live streams",
      "750 starter credits on signup",
      "Send messages (2 credits each)",
      "Basic search & discovery",
    ],
    notIncluded: ["Bonus monthly credits", "Exclusive or PPV content", "VIP lounge access", "Credit discounts"],
    color: "#64748b",
    popular: false,
    cta: "Current Plan",
  },
  {
    id: "fan",
    name: "Fan",
    emoji: "❤️",
    price: 4.99,
    billingPeriod: "per month",
    credits: 150,
    features: [
      "Everything in Free",
      "50 bonus credits/month",
      "Follow unlimited creators",
      "Fan badge on profile",
      "Priority message delivery",
      "Like & comment on all posts",
    ],
    notIncluded: ["PPV & exclusive content", "VIP lounge access", "Credit discounts"],
    color: "#f43f5e",
    popular: false,
    cta: "Subscribe",
  },
  {
    id: "supporter",
    name: "Supporter",
    emoji: "🔥",
    price: 9.99,
    billingPeriod: "per month",
    credits: 150,
    features: [
      "Everything in Fan",
      "100 bonus credits/month",
      "5% discount on credit purchases",
      "Access to supporter-only posts",
      "2 profile boosts/month",
      "Supporter flame badge",
      "Early access to new creator content",
    ],
    notIncluded: ["PPV & exclusive content", "VIP lounge access"],
    color: "#f97316",
    popular: false,
    cta: "Subscribe",
  },
  {
    id: "superfan",
    name: "Super Fan",
    emoji: "💎",
    price: 14.99,
    billingPeriod: "per month",
    credits: 750,
    features: [
      "Everything in Supporter",
      "150 bonus credits/month",
      "10% discount on credit purchases",
      "Unlock exclusive creator content",
      "5 profile boosts/month",
      "VIP queue in all live chats",
      "Creator DM priority",
      "Super Fan diamond badge",
    ],
    notIncluded: ["VIP lounge access", "Personal account manager"],
    color: "#8b5cf6",
    popular: true,
    cta: "Subscribe",
  },
  {
    id: "allaccess",
    name: "All-Access",
    emoji: "🏆",
    price: 24.99,
    billingPeriod: "per month",
    credits: 750,
    features: [
      "Everything in Super Fan",
      "250 bonus credits/month",
      "15% discount on credit purchases",
      "VIP Lounge access (3 sessions/mo)",
      "10 profile boosts/month",
      "PPV content bundle (3 unlocks/mo)",
      "All-Access gold trophy badge",
      "Dedicated support agent",
    ],
    notIncluded: ["Unlimited VIP access", "Personal account manager"],
    color: "#f59e0b",
    popular: false,
    cta: "Subscribe",
  },
  {
    id: "creatorpass",
    name: "Creator Pass",
    emoji: "👑",
    price: 49.99,
    billingPeriod: "per month",
    credits: 1500,
    features: [
      "Everything in All-Access",
      "1,500 bonus credits/month",
      "20% discount on credit purchases",
      "20 VIP Lounge sessions/month",
      "20 profile boosts/month",
      "Exclusive Creator Pass events",
      "Custom profile crown frame",
      "Creator Pass crown badge",
      "Priority billing support",
    ],
    notIncluded: [],
    color: "#14B8A6",
    popular: false,
    cta: "Get Creator Pass",
  },
];

export default function BoostsPage() {
  const { spendCredits, isLoggedIn, showToast, activeMembership, setActiveMembership, activeBoost, setActiveBoost } = useApp();
  const [activeTab, setActiveTab] = useState<"boosts" | "memberships">("memberships");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [loadingMembership, setLoadingMembership] = useState<string | null>(null);
  const [loadingBoost, setLoadingBoost] = useState<string | null>(null);

  // Scheduler state
  const [schedule, setSchedule] = useState<ScheduleMap>(() => {
    try { return JSON.parse(localStorage.getItem("vl_boost_schedule_v1") ?? "{}"); } catch { return {}; }
  });
  const [autoBoost, setAutoBoost] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem("vl_boost_auto_v1") ?? "false"); } catch { return false; }
  });

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
      // Auto-fill peak cells
      const auto: ScheduleMap = {};
      PEAK_CELLS.forEach(k => { auto[k] = true; });
      saveSchedule(auto);
      showToast({ title: "Auto-Boost enabled", description: "Your boosts are now scheduled at peak engagement hours." });
    }
  };

  const scheduledCount = Object.values(schedule).filter(Boolean).length;
  const rank = boostRank(activeBoost);
  const hasScheduling  = rank >= 2; // Flame+
  const hasAutomation  = rank >= 3; // Inferno+
  const hasFeaturedHome = rank >= 3; // Inferno+
  const hasFeaturedLive = rank >= 2; // Flame+
  const hasCategoryTop  = rank >= 3; // Inferno+

  // Load active boost on mount (try API, fall back to context)
  useEffect(() => {
    if (!isLoggedIn) return;
    boostsApi.active()
      .then((data: any) => {
        if (data?.package) setActiveBoost(data.package);
      })
      .catch(() => null);
  }, [isLoggedIn]);

  const handleSubscribeBoost = async (pkg: typeof BOOST_PACKAGES[0]) => {
    if (activeBoost === pkg.id) return;
    setLoadingBoost(pkg.id);
    if (isLoggedIn) {
      try {
        await boostsApi.subscribe(pkg.id);
        setActiveBoost(pkg.id);
        showToast({ title: `${pkg.emoji} ${pkg.name} Boost Active!`, description: `${pkg.boosts} boosts/month for 30 days` });
      } catch {
        spendCredits(Math.round(pkg.price * 10), `${pkg.name} Boost — ${pkg.boosts} boosts/month`);
        setActiveBoost(pkg.id);
        showToast({ title: `${pkg.emoji} ${pkg.name} Boost Active!`, description: `${pkg.boosts} boosts/month activated` });
      }
    } else {
      spendCredits(Math.round(pkg.price * 10), `${pkg.name} Boost — ${pkg.boosts} boosts/month`);
      setActiveBoost(pkg.id);
    }
    setLoadingBoost(null);
  };

  const handleSubscribeMembership = (plan: typeof MEMBERSHIP_PLANS[0]) => {
    if (plan.id === "free" || activeMembership === plan.id) return;
    setLoadingMembership(plan.id);
    setTimeout(() => {
      setLoadingMembership(null);
      setActiveMembership(plan.id);
      const price = billingCycle === "annual" ? plan.price * 0.8 : plan.price;
      spendCredits(Math.round(price * 10), `${plan.name} Membership — $${price.toFixed(2)}/${billingCycle === "annual" ? "yr" : "mo"} via CCBill`);
      showToast({ title: `${plan.emoji} ${plan.name} Activated!`, description: `Your membership benefits are now active.` });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Subscriptions & Boosts</h1>
        <p className="text-muted-foreground mb-6">Enhance your LinkMe experience</p>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-8">
          {[
            { id: "memberships" as const, label: "Membership Plans", emoji: "💎" },
            { id: "boosts" as const, label: "Profile Boosts", emoji: "🚀" },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
              }`}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {activeTab === "memberships" && (
          <>
            {/* Billing toggle */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-3 p-1 rounded-xl bg-card border border-border">
                <button onClick={() => setBillingCycle("monthly")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === "monthly" ? "text-white" : "text-muted-foreground"}`}
                  style={billingCycle === "monthly" ? { background: "#14B8A6" } : {}}>
                  Monthly
                </button>
                <button onClick={() => setBillingCycle("annual")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${billingCycle === "annual" ? "text-white" : "text-muted-foreground"}`}
                  style={billingCycle === "annual" ? { background: "#14B8A6" } : {}}>
                  Annual
                  <span className="px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">Save 20%</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {MEMBERSHIP_PLANS.map(plan => {
                const price = billingCycle === "annual" ? (plan.price * 0.8).toFixed(2) : plan.price.toFixed(2);
                return (
                  <div key={plan.id}
                    className={`relative flex flex-col p-5 rounded-2xl border transition-all ${plan.popular ? "shadow-xl" : ""}`}
                    style={{ borderColor: plan.popular ? plan.color : "hsl(var(--border))", background: plan.popular ? `linear-gradient(135deg, ${plan.color}15, ${plan.color}08)` : "" }}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-xs font-bold whitespace-nowrap"
                        style={{ background: plan.color }}>MOST POPULAR</div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{plan.emoji}</span>
                      <div>
                        <h3 className="text-lg font-black text-foreground">{plan.name}</h3>
                        {plan.credits > 0 && <p className="text-xs" style={{ color: plan.color }}>+{plan.credits.toLocaleString()} credits/mo</p>}
                      </div>
                    </div>
                    <div className="mb-4">
                      <span className="text-3xl font-black text-foreground">{plan.price === 0 ? "Free" : `$${price}`}</span>
                      {plan.price > 0 && <span className="text-muted-foreground text-sm ml-1">/mo</span>}
                      {billingCycle === "annual" && plan.price > 0 && (
                        <p className="text-green-400 text-xs mt-0.5">Billed ${(parseFloat(price) * 12).toFixed(2)}/year</p>
                      )}
                    </div>
                    <ul className="space-y-1.5 flex-1 mb-4">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="mt-0.5 font-bold" style={{ color: plan.color }}>✓</span>
                          {f}
                        </li>
                      ))}
                      {plan.notIncluded.map(f => (
                        <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground opacity-40">
                          <span className="mt-0.5">✗</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleSubscribeMembership(plan)}
                      disabled={plan.id === "free" || activeMembership === plan.id || loadingMembership === plan.id}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-default"
                      style={plan.id === "free" || activeMembership === plan.id
                        ? { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                        : { background: plan.color, color: plan.color === "#f59e0b" ? "#000" : "#fff" }}>
                      {loadingMembership === plan.id
                        ? "Processing…"
                        : activeMembership === plan.id
                          ? `✓ Active Plan`
                          : plan.id === "free"
                            ? "Current (Free)"
                            : plan.cta}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-4 rounded-xl border border-border bg-card text-center">
              <p className="text-muted-foreground text-sm">
                🔒 Memberships billed monthly via <strong className="text-foreground">CCBill</strong>. Cancel anytime. Statement shows "CCBILL*LinkMe".
              </p>
            </div>
          </>
        )}

        {activeTab === "boosts" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {BOOST_PACKAGES.map(pkg => (
                <div key={pkg.id} className={`relative flex flex-col p-5 rounded-xl border transition-all duration-200 ${
                  pkg.popular ? "border-primary shadow-lg" : "border-border bg-card"
                }`} style={pkg.popular ? { background: "linear-gradient(135deg, hsl(173 60% 12%), hsl(173 60% 8%))", borderColor: "#14B8A6" } : {}}>
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-xs font-bold"
                      style={{ background: "#14B8A6" }}>MOST POPULAR</div>
                  )}
                  <div className="text-4xl mb-2">{pkg.emoji}</div>
                  <h3 className="text-xl font-bold text-foreground mb-1">{pkg.name}</h3>
                  <p className="text-3xl font-black text-primary mb-1">{pkg.boosts}</p>
                  <p className="text-muted-foreground text-xs mb-4">boosts per month</p>
                  <p className="text-2xl font-bold text-foreground mb-4">${pkg.price}<span className="text-sm text-muted-foreground">/mo</span></p>
                  <ul className="space-y-2 flex-1 mb-5">
                    {pkg.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="text-primary mt-0.5">✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSubscribeBoost(pkg)}
                    disabled={activeBoost === pkg.id || loadingBoost === pkg.id}
                    className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-70 disabled:cursor-default"
                    style={{
                      background: activeBoost === pkg.id ? "hsl(var(--muted))" : pkg.color,
                      color: activeBoost === pkg.id ? "hsl(var(--muted-foreground))" : "#fff",
                    }}>
                    {loadingBoost === pkg.id
                      ? "Processing…"
                      : activeBoost === pkg.id
                        ? `✓ Active — ${pkg.boosts} boosts/mo`
                        : `Subscribe — $${pkg.price}/mo`}
                  </button>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <h2 className="text-lg font-bold text-foreground mb-4">How Boosts Work</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { step: "1", icon: "🚀", title: "Activate a Boost", desc: "Use one of your monthly boosts to push your profile to the top of search results and feeds." },
                  { step: "2", icon: "👁", title: "Get Discovered", desc: "Your profile is featured prominently to users browsing in your category and location." },
                  { step: "3", icon: "❤️", title: "Gain Followers", desc: "More visibility means more followers, messages, and connection opportunities." },
                ].map(step => (
                  <div key={step.step} className="text-center p-4">
                    <div className="w-10 h-10 rounded-full border-2 border-primary text-primary font-bold text-lg flex items-center justify-center mx-auto mb-3">{step.step}</div>
                    <div className="text-3xl mb-2">{step.icon}</div>
                    <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Active Placement Status ───────────────────────────────────── */}
            {activeBoost && (
              <div className="p-6 rounded-xl border" style={{ borderColor: "rgba(20,184,166,0.25)", background: "rgba(20,184,166,0.04)" }}>
                <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" style={{ color: "#14b8a6" }} />
                  Your Active Placements
                </h2>
                <p className="text-xs text-muted-foreground mb-5">
                  Active boost: <strong style={{ color: BOOST_PACKAGES.find(p => p.id === activeBoost)?.color }}>{BOOST_PACKAGES.find(p => p.id === activeBoost)?.emoji} {BOOST_PACKAGES.find(p => p.id === activeBoost)?.name}</strong>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { icon: Radio,       label: "Featured on Live Feeds",   active: hasFeaturedLive,  href: "/live",     desc: "Your streams appear in the Featured row" },
                    { icon: Home,        label: "Homepage Featured Spot",   active: hasFeaturedHome,  href: "/",         desc: "Your profile is pinned at the top of Home" },
                    { icon: Star,        label: "Category Top Placement",   active: hasCategoryTop,   href: "/profiles", desc: "Your profile ranks first in category browsing" },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl p-4"
                      style={{ background: item.active ? "rgba(20,184,166,0.07)" : "rgba(255,255,255,0.02)", border: `1px solid ${item.active ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.06)"}` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <item.icon className="w-4 h-4" style={{ color: item.active ? "#14b8a6" : "rgba(255,255,255,0.25)" }} />
                        <span className="text-xs font-bold" style={{ color: item.active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)" }}>{item.label}</span>
                      </div>
                      {item.active ? (
                        <>
                          <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{item.desc}</p>
                          <Link href={item.href}>
                            <button className="text-xs font-semibold px-3 py-1 rounded-lg"
                              style={{ background: "rgba(20,184,166,0.15)", color: "#14b8a6", border: "1px solid rgba(20,184,166,0.2)" }}>
                              View Page →
                            </button>
                          </Link>
                        </>
                      ) : (
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                          Requires {item.icon === Radio ? "Flame" : "Inferno"}+ boost
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Boost Scheduler ─────────────────────────────────────────── */}
            {activeBoost ? (
              hasScheduling ? (
                <div className="p-6 rounded-xl border border-border bg-card">
                  <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Calendar className="w-5 h-5" style={{ color: "#f97316" }} />
                        Boost Scheduler
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Choose when your boosts fire. {scheduledCount > 0 ? `${scheduledCount} slot${scheduledCount !== 1 ? "s" : ""} scheduled.` : "No slots selected yet."}
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

                  {autoBoost && hasAutomation && (
                    <div className="rounded-lg px-4 py-2 mb-4 text-xs flex items-center gap-2"
                      style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c" }}>
                      <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                      Auto-Boost active — your boosts fire automatically at peak engagement windows (highlighted below).
                    </div>
                  )}

                  {/* Grid */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left pb-2 pr-3 font-semibold" style={{ color: "rgba(255,255,255,0.35)", width: 100 }}>
                            <Clock className="w-3.5 h-3.5 inline mr-1" />Slot
                          </th>
                          {DAYS.map(d => (
                            <th key={d} className="text-center pb-2 font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>{d}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="space-y-1">
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
                                    title={isPeak ? "Peak hours" : ""}
                                    disabled={autoBoost}
                                    className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center transition-all"
                                    style={{
                                      background: isOn
                                        ? isPeak ? "rgba(249,115,22,0.3)" : "rgba(20,184,166,0.2)"
                                        : isPeak ? "rgba(249,115,22,0.06)" : "rgba(255,255,255,0.03)",
                                      border: isOn
                                        ? isPeak ? "1px solid rgba(249,115,22,0.5)" : "1px solid rgba(20,184,166,0.4)"
                                        : "1px solid rgba(255,255,255,0.07)",
                                      cursor: autoBoost ? "default" : "pointer",
                                    }}>
                                    {isOn ? (
                                      <Zap className="w-3.5 h-3.5" style={{ color: isPeak ? "#f97316" : "#14b8a6" }} />
                                    ) : isPeak ? (
                                      <span style={{ color: "rgba(249,115,22,0.35)", fontSize: 10 }}>⬡</span>
                                    ) : null}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded" style={{ background: "rgba(20,184,166,0.25)", border: "1px solid rgba(20,184,166,0.5)", display: "inline-block" }} />
                      Scheduled
                    </span>
                    {hasAutomation && (
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded" style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)", display: "inline-block" }} />
                        Peak hours (auto)
                      </span>
                    )}
                    {!hasAutomation && (
                      <span>Upgrade to Inferno for auto-scheduling at peak hours</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-border bg-card text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
                  <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Boost Scheduling</p>
                  <p className="text-xs mt-1 mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Upgrade to <strong style={{ color: "#14b8a6" }}>Flame</strong> or higher to schedule your boosts
                  </p>
                </div>
              )
            ) : (
              <div className="p-6 rounded-xl border border-border bg-card text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
                <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Boost Scheduler</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>Subscribe to a boost package above to unlock scheduling</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
