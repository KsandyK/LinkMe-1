import { useState, useEffect, Fragment } from "react";
import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { boosts as boostsApi } from "@/lib/api";
import { Calendar, Zap, Clock, ToggleLeft, ToggleRight, TrendingUp, Home, Radio, Star, X, CreditCard } from "lucide-react";
import { MEMBER_TIERS, BOOST_TIERS, MEMBER_BY_ID, type MemberTier, type BoostTier } from "@/lib/membership-tiers";

// ── Boost tier helpers ────────────────────────────────────────────────────────
const BOOST_TIER_RANK: Record<string, number> = { starter: 1, spark: 2, flame: 3, blaze: 4, inferno: 5, legend: 6, titan: 7, supernova: 8, colossus: 9, sovereign: 10 };
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

// ── Boost & Membership data imported from single source of truth ──────────────
// Prices defined in: src/lib/membership-tiers.ts
const BOOST_PACKAGES = BOOST_TIERS;
const MEMBERSHIP_PLANS = [
  // Free default tier (not a paid subscription — shown for comparison only)
  {
    id: "free", name: "Free", emoji: "🌟", price: 0, billingPeriod: "Free forever",
    credits: 0, discount: 0, vipSessions: 0, color: "#64748b", popular: false, cta: "Current Plan",
    features: ["Browse all public creator profiles", "Watch free-tier live streams", "750 starter credits on signup", "Send messages (5 credits each)", "Basic search & discovery"],
    notIncluded: ["Bonus monthly credits", "Exclusive or PPV content", "VIP lounge access", "Credit discounts"],
  },
  // All paid tiers from canonical source — prices always in sync
  ...MEMBER_TIERS.map(t => ({
    id: t.id, name: t.name, emoji: t.emoji, price: t.price, billingPeriod: "per month",
    credits: t.bonusCredits, discount: Math.round(t.discount * 100), vipSessions: t.vipSessions,
    color: t.color, popular: t.popular, cta: t.cta,
    features: t.features, notIncluded: t.notIncluded,
  })),
];

const ULTRA_MEMBERSHIP_IDS = new Set(["diamond", "obsidian", "platinum_m"]);
const ULTRA_BOOST_IDS      = new Set(["supernova", "colossus", "sovereign"]);

export default function BoostsPage() {
  const { spendCredits, addCredits, recordPurchase, isLoggedIn, showToast, activeMembership, setActiveMembership, activeBoost, setActiveBoost } = useApp();
  const [activeTab, setActiveTab] = useState<"boosts" | "memberships">("memberships");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [loadingMembership, setLoadingMembership] = useState<string | null>(null);
  const [loadingBoost, setLoadingBoost] = useState<string | null>(null);

  // ── Payment method guard ──────────────────────────────────────────────────
  type SavedCardSnippet = { id: string; last4: string; brand: string; isDefault: boolean };
  const [savedCards] = useState<SavedCardSnippet[]>(() => {
    try { return JSON.parse(localStorage.getItem("vl_saved_cards_v1") ?? "[]"); } catch { return []; }
  });
  const defaultCard = savedCards.find(c => c.isDefault) ?? savedCards[0] ?? null;

  // Modals
  const [noCardModal, setNoCardModal] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<{
    name: string; emoji: string; priceStr: string; description: string; onConfirm: () => void;
  } | null>(null);

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
      const auto: ScheduleMap = {};
      PEAK_CELLS.forEach(k => { auto[k] = true; });
      saveSchedule(auto);
      showToast({ title: "Auto-Boost enabled", description: "Your boosts are now scheduled at peak engagement hours." });
    }
  };

  const scheduledCount = Object.values(schedule).filter(Boolean).length;
  const rank = boostRank(activeBoost);
  const hasScheduling   = rank >= 3; // Flame+
  const hasAutomation   = rank >= 5; // Inferno+
  const hasFeaturedHome = rank >= 5; // Inferno+
  const hasFeaturedLive = rank >= 3; // Flame+
  const hasCategoryTop  = rank >= 4; // Blaze+

  useEffect(() => {
    if (!isLoggedIn) return;
    boostsApi.active()
      .then((data: any) => {
        if (data?.package) setActiveBoost(data.package);
      })
      .catch(() => null);
  }, [isLoggedIn]);

  // ── Internal purchase executors (called after confirmation) ─────────────
  const _doSubscribeBoost = async (pkg: typeof BOOST_PACKAGES[0]) => {
    setLoadingBoost(pkg.id);
    const priceStr = pkg.price % 1 === 0 ? pkg.price.toLocaleString() : pkg.price.toFixed(2);
    if (isLoggedIn) {
      try {
        await boostsApi.subscribe(pkg.id);
        setActiveBoost(pkg.id);
        recordPurchase(pkg.price, `${pkg.emoji} ${pkg.name} Boost — ${pkg.boosts} boosts/month`);
        showToast({ title: `${pkg.emoji} ${pkg.name} Boost Active!`, description: `${pkg.boosts} boosts/month for 30 days` });
      } catch {
        recordPurchase(pkg.price, `${pkg.emoji} ${pkg.name} Boost — ${pkg.boosts} boosts/month`);
        setActiveBoost(pkg.id);
        showToast({ title: `${pkg.emoji} ${pkg.name} Boost Active!`, description: `${pkg.boosts} boosts/month activated` });
      }
    } else {
      recordPurchase(pkg.price, `${pkg.emoji} ${pkg.name} Boost — ${pkg.boosts} boosts/month`);
      setActiveBoost(pkg.id);
    }
    setLoadingBoost(null);
  };

  const _doSubscribeMembership = (plan: typeof MEMBERSHIP_PLANS[0]) => {
    setLoadingMembership(plan.id);
    setTimeout(() => {
      setLoadingMembership(null);
      setActiveMembership(plan.id);
      const price = billingCycle === "annual" ? plan.price * 0.8 : plan.price;
      const priceStr = price % 1 === 0 ? price.toLocaleString() : price.toFixed(2);
      recordPurchase(price, `${plan.emoji} ${plan.name} Membership — $${priceStr}/${billingCycle === "annual" ? "yr" : "mo"}`);
      // Award monthly bonus credits included in the plan
      if (plan.credits > 0) {
        addCredits(plan.credits, `${plan.emoji} ${plan.name} monthly bonus credits`);
      }
      showToast({ title: `${plan.emoji} ${plan.name} Activated!`, description: `Your membership benefits are now active.` });
    }, 800);
  };

  // ── Purchase interceptors — check card, then show confirm modal ──────────
  const handleSubscribeBoost = (pkg: typeof BOOST_PACKAGES[0]) => {
    if (activeBoost === pkg.id) return;
    if (!defaultCard) { setNoCardModal(true); return; }
    const priceStr = pkg.price % 1 === 0 ? `$${pkg.price.toLocaleString()}` : `$${pkg.price}`;
    setPendingPurchase({
      name: `${pkg.name} Boost`,
      emoji: pkg.emoji,
      priceStr,
      description: `${pkg.boosts} profile boosts/month`,
      onConfirm: () => { setPendingPurchase(null); _doSubscribeBoost(pkg); },
    });
  };

  const handleSubscribeMembership = (plan: typeof MEMBERSHIP_PLANS[0]) => {
    if (plan.id === "free" || activeMembership === plan.id) return;
    if (!defaultCard) { setNoCardModal(true); return; }
    const rawPrice = billingCycle === "annual" ? plan.price * 0.8 : plan.price;
    const priceStr = rawPrice % 1 === 0 ? `$${rawPrice.toLocaleString()}` : `$${rawPrice.toFixed(2)}`;
    setPendingPurchase({
      name: `${plan.name} Membership`,
      emoji: plan.emoji,
      priceStr,
      description: plan.credits > 0 ? `+${plan.credits.toLocaleString()} credits/month` : "Membership benefits",
      onConfirm: () => { setPendingPurchase(null); _doSubscribeMembership(plan); },
    });
  };

  // Dark text needed on light-coloured buttons (amber, gold, platinum, apex)
  const btnTextColor = (color: string) =>
    ["#f59e0b", "#d4af37", "#e2e8f0", "#ffd700"].includes(color) ? "#000" : "#fff";

  return (
    <>
    <div className="min-h-screen py-8 px-4" style={{ background: "#09091a" }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-1">Plans & Boosts</h1>
        <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>Two separate products — choose what fits your goals</p>

        {/* ── Two-product callout ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setActiveTab("memberships")}
            className="text-left p-5 rounded-xl border transition-all duration-200 hover:scale-[1.01]"
            style={{
              background: activeTab === "memberships" ? "rgba(236,72,153,0.08)" : "rgba(236,72,153,0.03)",
              borderColor: activeTab === "memberships" ? "rgba(236,72,153,0.4)" : "rgba(236,72,153,0.15)",
            }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">💎</span>
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(236,72,153,0.2)", color: "#ec4899" }}>FOR FANS</span>
                <span className="text-base font-bold text-white">Membership Plans</span>
              </div>
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              Unlock exclusive content, earn bonus credits every month, and access VIP live sessions with your favourite creators.
            </p>
          </button>

          <button
            onClick={() => setActiveTab("boosts")}
            className="text-left p-5 rounded-xl border transition-all duration-200 hover:scale-[1.01]"
            style={{
              background: activeTab === "boosts" ? "rgba(249,115,22,0.08)" : "rgba(249,115,22,0.03)",
              borderColor: activeTab === "boosts" ? "rgba(249,115,22,0.4)" : "rgba(249,115,22,0.15)",
            }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🚀</span>
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(249,115,22,0.2)", color: "#f97316" }}>FOR CREATORS</span>
                <span className="text-base font-bold text-white">Profile Boosts</span>
              </div>
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              Get discovered faster. Rank higher in search, appear on the homepage, and be featured on live feeds with monthly boost credits.
            </p>
          </button>
        </div>

        {/* ── Tab bar ─────────────────────────────────────────────────────── */}
        <div className="flex gap-1 border-b mb-8" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <button
            onClick={() => setActiveTab("memberships")}
            className="px-5 py-2.5 text-sm font-medium border-b-2 transition-colors"
            style={{
              color: activeTab === "memberships" ? "#ec4899" : "rgba(255,255,255,0.4)",
              borderBottomColor: activeTab === "memberships" ? "#ec4899" : "transparent",
            }}>
            💎 Membership Plans
          </button>
          <button
            onClick={() => setActiveTab("boosts")}
            className="px-5 py-2.5 text-sm font-medium border-b-2 transition-colors"
            style={{
              color: activeTab === "boosts" ? "#f97316" : "rgba(255,255,255,0.4)",
              borderBottomColor: activeTab === "boosts" ? "#f97316" : "transparent",
            }}>
            🚀 Profile Boosts
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            MEMBERSHIPS TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "memberships" && (
          <>
            {/* Section header + billing toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full mr-2"
                  style={{ background: "rgba(236,72,153,0.15)", color: "#ec4899", border: "1px solid rgba(236,72,153,0.25)" }}>
                  FOR FANS
                </span>
                <p className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Unlock content · Earn credits · Access VIP sessions
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl self-start sm:self-auto"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <button onClick={() => setBillingCycle("monthly")}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={billingCycle === "monthly"
                    ? { background: "#ec4899", color: "#fff" }
                    : { color: "rgba(255,255,255,0.4)" }}>
                  Monthly
                </button>
                <button onClick={() => setBillingCycle("annual")}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
                  style={billingCycle === "annual"
                    ? { background: "#ec4899", color: "#fff" }
                    : { color: "rgba(255,255,255,0.4)" }}>
                  Annual
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80" }}>-20%</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {MEMBERSHIP_PLANS.map((plan, i) => {
                const rawPrice = billingCycle === "annual" ? plan.price * 0.8 : plan.price;
                const price = rawPrice % 1 === 0 ? rawPrice.toLocaleString() : rawPrice.toFixed(2);
                const annualTotal = rawPrice * 12;
                const annualTotalStr = annualTotal % 1 === 0 ? annualTotal.toLocaleString() : annualTotal.toFixed(2);
                const isBlackCard = plan.id === "blackcard";
                const isUltra = ULTRA_MEMBERSHIP_IDS.has(plan.id);
                const isFirstUltra = isUltra && !ULTRA_MEMBERSHIP_IDS.has(MEMBERSHIP_PLANS[i - 1]?.id ?? "");
                return (
                  <Fragment key={plan.id}>
                    {isFirstUltra && (
                      <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-center gap-4 pt-6 pb-3">
                        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1))" }} />
                        <span className="text-xs font-bold px-4 py-1.5 rounded-full tracking-widest"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)", letterSpacing: "0.12em" }}>
                          ✦ ULTRA-PREMIUM
                        </span>
                        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.1), transparent)" }} />
                      </div>
                    )}
                  <div
                    className={`relative flex flex-col p-5 rounded-2xl border transition-all ${plan.popular ? "shadow-2xl" : ""}`}
                    style={{
                      borderColor: isBlackCard
                        ? "rgba(212,175,55,0.45)"
                        : isUltra
                          ? `${plan.color}55`
                          : plan.popular
                            ? plan.color
                            : "rgba(255,255,255,0.07)",
                      background: isBlackCard
                        ? "linear-gradient(135deg, rgba(12,10,4,0.97), rgba(25,20,8,0.9))"
                        : isUltra
                          ? `linear-gradient(135deg, rgba(6,6,18,0.98) 0%, ${plan.color}18 100%)`
                          : plan.popular
                            ? `linear-gradient(135deg, ${plan.color}18, ${plan.color}07)`
                            : "rgba(255,255,255,0.02)",
                    }}>
                    {plan.popular && !isUltra && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-xs font-bold whitespace-nowrap"
                        style={{ background: plan.color }}>MOST POPULAR</div>
                    )}
                    {isBlackCard && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold whitespace-nowrap"
                        style={{ background: "linear-gradient(90deg, #d4af37, #b8962a)", color: "#000" }}>
                        ✦ EXCLUSIVE
                      </div>
                    )}
                    {isUltra && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold whitespace-nowrap"
                        style={{ background: `linear-gradient(90deg, ${plan.color}, ${plan.color}bb)`, color: btnTextColor(plan.color) }}>
                        ✦ ULTRA-PREMIUM
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{plan.emoji}</span>
                      <div>
                        <h3 className="text-lg font-black text-white">{plan.name}</h3>
                        {plan.credits > 0 && (
                          <p className="text-xs" style={{ color: isBlackCard ? "#d4af37" : plan.color }}>
                            +{plan.credits >= 999999 ? "∞" : plan.credits.toLocaleString()} credits/mo
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mb-3">
                      <span className="text-3xl font-black text-white">{plan.price === 0 ? "Free" : `$${price}`}</span>
                      {plan.price > 0 && <span className="text-sm ml-1" style={{ color: "rgba(255,255,255,0.35)" }}>/mo</span>}
                      {billingCycle === "annual" && plan.price > 0 && (
                        <p className="text-xs mt-0.5" style={{ color: "#4ade80" }}>
                          Billed ${annualTotalStr}/year
                        </p>
                      )}
                    </div>
                    {/* Perks chips */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {plan.discount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: `${isBlackCard ? "#d4af37" : plan.color}20`,
                            color: isBlackCard ? "#d4af37" : plan.color,
                            border: `1px solid ${isBlackCard ? "#d4af37" : plan.color}30`,
                          }}>
                          {plan.discount}% off credits
                        </span>
                      )}
                      {plan.vipSessions > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.25)" }}>
                          {plan.vipSessions === 999 ? "∞" : plan.vipSessions} VIP sessions
                        </span>
                      )}
                    </div>
                    <ul className="space-y-1.5 flex-1 mb-4">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                          <span className="mt-0.5 font-bold flex-shrink-0"
                            style={{ color: isBlackCard ? "#d4af37" : plan.color }}>✓</span>
                          {f}
                        </li>
                      ))}
                      {plan.notIncluded.map(f => (
                        <li key={f} className="flex items-start gap-2 text-xs opacity-35"
                          style={{ color: "rgba(255,255,255,0.6)" }}>
                          <span className="mt-0.5 flex-shrink-0">✗</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleSubscribeMembership(plan)}
                      disabled={plan.id === "free" || activeMembership === plan.id || loadingMembership === plan.id}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-default"
                      style={
                        plan.id === "free" || activeMembership === plan.id
                          ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }
                          : isBlackCard
                            ? { background: "linear-gradient(90deg, #d4af37, #b8962a)", color: "#000" }
                            : { background: plan.color, color: btnTextColor(plan.color) }
                      }>
                      {loadingMembership === plan.id
                        ? "Processing…"
                        : activeMembership === plan.id
                          ? "✓ Active Plan"
                          : plan.id === "free"
                            ? "Current (Free)"
                            : plan.cta}
                    </button>
                  </div>
                  </Fragment>
                );
              })}
            </div>

            <div className="mt-8 p-4 rounded-xl text-center"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                🔒 Memberships billed monthly to your saved card. Cancel anytime from Account Settings.
              </p>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            BOOSTS TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "boosts" && (
          <>
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.25)" }}>
                FOR CREATORS
              </span>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                Rank higher · Get discovered · Grow your audience
              </p>
            </div>

            {/* Boost cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {BOOST_PACKAGES.map((pkg, i) => {
                const isUltraBoost = ULTRA_BOOST_IDS.has(pkg.id);
                const isFirstUltraBoost = isUltraBoost && !ULTRA_BOOST_IDS.has(BOOST_PACKAGES[i - 1]?.id ?? "");
                return (
                <Fragment key={pkg.id}>
                  {isFirstUltraBoost && (
                    <div className="col-span-2 sm:col-span-3 lg:col-span-4 flex items-center gap-4 pt-6 pb-3">
                      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.25))" }} />
                      <span className="text-xs font-bold px-4 py-1.5 rounded-full tracking-widest"
                        style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.18)", color: "rgba(249,115,22,0.7)", letterSpacing: "0.12em" }}>
                        ✦ ULTRA-PREMIUM
                      </span>
                      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(249,115,22,0.25), transparent)" }} />
                    </div>
                  )}
                <div
                  className="relative flex flex-col p-4 rounded-xl border transition-all duration-200"
                  style={{
                    borderColor: isUltraBoost ? `${pkg.color}55` : pkg.popular ? pkg.color : "rgba(255,255,255,0.08)",
                    background: isUltraBoost
                      ? `linear-gradient(135deg, rgba(6,6,18,0.98) 0%, ${pkg.color}18 100%)`
                      : pkg.popular
                        ? `linear-gradient(135deg, ${pkg.color}18, ${pkg.color}07)`
                        : "rgba(255,255,255,0.02)",
                  }}>
                  {pkg.popular && !isUltraBoost && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-xs font-bold whitespace-nowrap"
                      style={{ background: pkg.color }}>MOST POPULAR</div>
                  )}
                  {isUltraBoost && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold whitespace-nowrap"
                      style={{ background: `linear-gradient(90deg, ${pkg.color}, ${pkg.color}bb)`, color: btnTextColor(pkg.color) }}>
                      ✦ ULTRA
                    </div>
                  )}
                  <div className="text-3xl mb-1.5">{pkg.emoji}</div>
                  <h3 className="text-base font-bold text-white mb-0.5">{pkg.name}</h3>
                  <p className="font-black text-2xl mb-0" style={{ color: pkg.color }}>{pkg.boosts}</p>
                  <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>boosts/mo</p>
                  <p className="text-xl font-bold text-white mb-3">
                    ${pkg.price % 1 === 0 ? pkg.price.toLocaleString() : pkg.price}
                    <span className="text-xs font-normal" style={{ color: "rgba(255,255,255,0.35)" }}>/mo</span>
                  </p>
                  <ul className="space-y-1.5 flex-1 mb-4">
                    {pkg.features.map(f => (
                      <li key={f} className="flex items-start gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                        <span className="flex-shrink-0 font-bold mt-0.5" style={{ color: pkg.color }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSubscribeBoost(pkg)}
                    disabled={activeBoost === pkg.id || loadingBoost === pkg.id}
                    className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-70 disabled:cursor-default"
                    style={{
                      background: activeBoost === pkg.id ? "rgba(255,255,255,0.06)" : pkg.color,
                      color: activeBoost === pkg.id ? "rgba(255,255,255,0.4)" : btnTextColor(pkg.color),
                    }}>
                    {loadingBoost === pkg.id
                      ? "Processing…"
                      : activeBoost === pkg.id
                        ? `✓ Active — ${pkg.boosts}/mo`
                        : `$${pkg.price % 1 === 0 ? pkg.price.toLocaleString() : pkg.price}/mo`}
                  </button>
                </div>
                </Fragment>
                );
              })}
            </div>

            {/* How Boosts Work */}
            <div className="p-6 rounded-xl border mb-6"
              style={{ background: "rgba(249,115,22,0.03)", borderColor: "rgba(249,115,22,0.12)" }}>
              <h2 className="text-base font-bold text-white mb-4">How Boosts Work</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { step: "1", icon: "🚀", title: "Activate a Boost", desc: "Use one of your monthly boosts to push your profile to the top of search results and feeds." },
                  { step: "2", icon: "👁", title: "Get Discovered", desc: "Your profile is featured prominently to users browsing in your category and location." },
                  { step: "3", icon: "❤️", title: "Gain Followers", desc: "More visibility means more followers, messages, and connection opportunities." },
                ].map(step => (
                  <div key={step.step} className="text-center p-4">
                    <div className="w-8 h-8 rounded-full border-2 font-bold text-sm flex items-center justify-center mx-auto mb-3"
                      style={{ borderColor: "#f97316", color: "#f97316" }}>{step.step}</div>
                    <div className="text-3xl mb-2">{step.icon}</div>
                    <h4 className="font-semibold text-white mb-1 text-sm">{step.title}</h4>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Auto-Boost Explainer ─────────────────────────────────────── */}
            <div className="p-6 rounded-xl border mb-6"
              style={{ background: "rgba(249,115,22,0.03)", borderColor: "rgba(249,115,22,0.12)" }}>
              <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: "#f97316" }} />
                How Auto-Boost Works
              </h2>
              <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Available on <strong style={{ color: "#ef4444" }}>Inferno</strong> and above. Here's exactly what happens when you turn it on.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                {[
                  {
                    step: "1", icon: "📊",
                    title: "We read the data",
                    desc: "Our system tracks when fans are most active on LINKME — by day, time slot, and category — and identifies your personal peak windows.",
                  },
                  {
                    step: "2", icon: "⚡",
                    title: "Boosts fire automatically",
                    desc: "At the start of each peak window, one of your monthly boosts is spent. Your profile jumps to the top of search and discovery feeds right when traffic is highest.",
                  },
                  {
                    step: "3", icon: "📈",
                    title: "You gain followers while idle",
                    desc: "You don't have to be online. Auto-Boost works in the background so you wake up to new followers, messages, and views every morning.",
                  },
                ].map(step => (
                  <div key={step.step} className="rounded-xl p-4"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(249,115,22,0.18)", color: "#f97316" }}>{step.step}</span>
                      <span className="text-lg">{step.icon}</span>
                    </div>
                    <p className="text-xs font-bold text-white mb-1">{step.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{step.desc}</p>
                  </div>
                ))}
              </div>
              {/* FAQ-style answers */}
              <div className="space-y-2">
                {[
                  {
                    q: "What are the peak windows?",
                    a: "Monday–Friday evenings (6–10 pm), Saturday–Sunday afternoons (12–6 pm) and evenings. There are ~35 peak slots per month — the Legend tier (36 boosts) is designed to cover every single one.",
                  },
                  {
                    q: "Will it use all my boosts at once?",
                    a: "No. One boost fires per scheduled window. The hard ceiling is 120 slots per month (4 time slots/day × 30 days). Any boosts not used by auto-scheduling stay available as manual boosts.",
                  },
                  {
                    q: "Can I override it?",
                    a: "Yes. Toggle Auto-Boost off in the Boost Scheduler below at any time. Your manually selected slots take over instantly — nothing is lost.",
                  },
                  {
                    q: "Do I need to be logged in when it fires?",
                    a: "No. Boosts run server-side on our infrastructure. Your profile is promoted even when you're offline, asleep, or not streaming.",
                  },
                ].map(item => (
                  <div key={item.q} className="rounded-lg px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-xs font-semibold text-white mb-0.5">{item.q}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{item.a}</p>
                  </div>
                ))}
              </div>
              {!hasAutomation && (
                <div className="mt-4 flex items-center gap-2 text-xs"
                  style={{ color: "rgba(255,255,255,0.3)" }}>
                  <ToggleLeft className="w-4 h-4 flex-shrink-0" />
                  Upgrade to <strong style={{ color: "#ef4444" }}>&nbsp;Inferno&nbsp;</strong> or higher to unlock Auto-Boost.
                </div>
              )}
            </div>

            {/* Active Placement Status */}
            {activeBoost && (
              <div className="p-6 rounded-xl border mb-6"
                style={{ borderColor: "rgba(249,115,22,0.2)", background: "rgba(249,115,22,0.04)" }}>
                <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: "#f97316" }} />
                  Your Active Placements
                </h2>
                <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Active boost: <strong style={{ color: BOOST_PACKAGES.find(p => p.id === activeBoost)?.color }}>
                    {BOOST_PACKAGES.find(p => p.id === activeBoost)?.emoji}{" "}
                    {BOOST_PACKAGES.find(p => p.id === activeBoost)?.name}
                  </strong>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { icon: Radio, label: "Featured on Live Feeds",  active: hasFeaturedLive,  href: "/live",     reqTier: "Flame" },
                    { icon: Home,  label: "Homepage Featured Spot",  active: hasFeaturedHome,  href: "/",         reqTier: "Inferno" },
                    { icon: Star,  label: "Category Top Placement",  active: hasCategoryTop,   href: "/profiles", reqTier: "Blaze" },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl p-4"
                      style={{
                        background: item.active ? "rgba(249,115,22,0.07)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${item.active ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.06)"}`,
                      }}>
                      <div className="flex items-center gap-2 mb-2">
                        <item.icon className="w-4 h-4" style={{ color: item.active ? "#f97316" : "rgba(255,255,255,0.2)" }} />
                        <span className="text-xs font-bold"
                          style={{ color: item.active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)" }}>
                          {item.label}
                        </span>
                      </div>
                      {item.active ? (
                        <>
                          <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                            Your profile is featured here right now.
                          </p>
                          <Link href={item.href}>
                            <button className="text-xs font-semibold px-3 py-1 rounded-lg"
                              style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }}>
                              View Page →
                            </button>
                          </Link>
                        </>
                      ) : (
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                          Requires {item.reqTier}+ boost
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Boost Scheduler */}
            {activeBoost ? (
              hasScheduling ? (
                <div className="p-6 rounded-xl border"
                  style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                  <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4" style={{ color: "#f97316" }} />
                        Boost Scheduler
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                        Choose when your boosts fire.{" "}
                        {scheduledCount > 0 ? `${scheduledCount} slot${scheduledCount !== 1 ? "s" : ""} scheduled.` : "No slots selected yet."}
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

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left pb-2 pr-3 font-semibold" style={{ color: "rgba(255,255,255,0.3)", width: 100 }}>
                            <Clock className="w-3.5 h-3.5 inline mr-1" />Slot
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
                                    title={isPeak ? "Peak hours" : ""}
                                    disabled={autoBoost}
                                    className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center transition-all"
                                    style={{
                                      background: isOn
                                        ? isPeak ? "rgba(249,115,22,0.3)" : "rgba(249,115,22,0.15)"
                                        : isPeak ? "rgba(249,115,22,0.06)" : "rgba(255,255,255,0.03)",
                                      border: isOn
                                        ? isPeak ? "1px solid rgba(249,115,22,0.5)" : "1px solid rgba(249,115,22,0.3)"
                                        : "1px solid rgba(255,255,255,0.07)",
                                      cursor: autoBoost ? "default" : "pointer",
                                    }}>
                                    {isOn ? (
                                      <Zap className="w-3.5 h-3.5" style={{ color: "#f97316" }} />
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

                  <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded inline-block"
                        style={{ background: "rgba(249,115,22,0.2)", border: "1px solid rgba(249,115,22,0.4)" }} />
                      Scheduled
                    </span>
                    {hasAutomation ? (
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded inline-block"
                          style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)" }} />
                        Peak hours (auto)
                      </span>
                    ) : (
                      <span>Upgrade to Inferno+ to enable auto-scheduling at peak hours</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl text-center"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
                  <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Boost Scheduling</p>
                  <p className="text-xs mt-1 mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Upgrade to <strong style={{ color: "#14b8a6" }}>Flame</strong> or higher to schedule your boosts
                  </p>
                </div>
              )
            ) : (
              <div className="p-6 rounded-xl text-center"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
                <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Boost Scheduler</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Subscribe to a boost package above to unlock scheduling
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>

    {/* ── No Payment Method Modal ───────────────────────────────────────── */}
    {noCardModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
        onClick={e => { if (e.target === e.currentTarget) setNoCardModal(false); }}>
        <div className="w-full max-w-sm rounded-2xl p-6"
          style={{ background: "#0f1622", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 30px 70px rgba(0,0,0,0.7)" }}>
          <div className="text-center mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)" }}>
              <CreditCard className="w-7 h-7" style={{ color: "#14b8a6" }} />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Payment Method Required</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              You need a saved card before subscribing to a plan or boost package. Add one in Billing &amp; Payments.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setNoCardModal(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" }}>
              Cancel
            </button>
            <Link href="/billing" className="flex-1">
              <button onClick={() => setNoCardModal(false)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)" }}>
                Add Card →
              </button>
            </Link>
          </div>
        </div>
      </div>
    )}

    {/* ── Purchase Confirmation Modal ───────────────────────────────────── */}
    {pendingPurchase && defaultCard && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
        onClick={e => { if (e.target === e.currentTarget) setPendingPurchase(null); }}>
        <div className="w-full max-w-sm rounded-2xl p-6 relative"
          style={{ background: "#0f1622", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 30px 70px rgba(0,0,0,0.7)" }}>
          <button onClick={() => setPendingPurchase(null)}
            className="absolute top-4 right-4 p-1.5 rounded-lg transition-all hover:bg-white/10"
            style={{ color: "rgba(255,255,255,0.35)" }}>
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="text-center mb-5">
            <div className="text-5xl mb-3">{pendingPurchase.emoji}</div>
            <h2 className="text-lg font-bold text-white mb-1">Confirm Purchase</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              Review your order before confirming
            </p>
          </div>

          {/* Order summary */}
          <div className="rounded-xl p-4 space-y-3 mb-4"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Plan</span>
              <span className="text-sm font-bold text-white">{pendingPurchase.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Amount</span>
              <span className="text-base font-black" style={{ color: "#14b8a6" }}>
                {pendingPurchase.priceStr}<span className="text-xs font-normal" style={{ color: "rgba(255,255,255,0.35)" }}>/mo</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Includes</span>
              <span className="text-xs font-medium text-white text-right max-w-[60%]">{pendingPurchase.description}</span>
            </div>
            <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Charged to</span>
              <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
                {defaultCard.brand} •••• {defaultCard.last4}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Billing</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Monthly · Cancel anytime</span>
            </div>
          </div>

          <p className="text-xs text-center mb-4" style={{ color: "rgba(255,255,255,0.25)" }}>
            🔒 Charged securely to your saved card on file · Statement shows "LINKME"
          </p>

          <div className="flex gap-3">
            <button onClick={() => setPendingPurchase(null)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" }}>
              Cancel
            </button>
            <button onClick={pendingPurchase.onConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)" }}>
              Confirm Purchase
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
