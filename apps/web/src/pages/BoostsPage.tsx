import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { boosts as boostsApi } from "@/lib/api";

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
  const { spendCredits, isLoggedIn, showToast, activeMembership, setActiveMembership } = useApp();
  const [activeTab, setActiveTab] = useState<"boosts" | "memberships">("memberships");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [activeBoost, setActiveBoost] = useState<string | null>(null);
  const [loadingMembership, setLoadingMembership] = useState<string | null>(null);
  const [loadingBoost, setLoadingBoost] = useState<string | null>(null);

  // Load active boost on mount
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
        // Any error (network, HTTP 502/503) → demo mode fallback
        spendCredits(Math.round(pkg.price * 10), `${pkg.name} Boost — ${pkg.boosts} boosts/month`);
        setActiveBoost(pkg.id);
        showToast({ title: `${pkg.emoji} ${pkg.name} Boost Active!`, description: `${pkg.boosts} boosts/month activated` });
      }
    } else {
      // Demo mode
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
          </>
        )}
      </div>
    </div>
  );
}
