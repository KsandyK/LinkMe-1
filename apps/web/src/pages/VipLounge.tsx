import { useState } from "react";
import { Link } from "wouter";
import { Crown, Star, Zap, Gift, Shield, Sparkles, Check } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

const PERKS = [
  { icon: Zap, title: "Priority Chat Access", desc: "Skip the queue — message creators first, every time" },
  { icon: Gift, title: "Exclusive Content Drops", desc: "Monthly private content releases for VIP members only" },
  { icon: Star, title: "20% Off Tips & Gifts", desc: "Send more love for less — discounted on every transaction" },
  { icon: Crown, title: "Early Creator Access", desc: "Be first to discover and connect with new creators" },
  { icon: Shield, title: "VIP Badge on Profile", desc: "Exclusive badge that creators and members can see" },
  { icon: Sparkles, title: "Exclusive VIP Streams", desc: "Access intimate streams only visible to VIP members" },
];

const TIERS = [
  {
    id: "vip",
    name: "VIP",
    price: "$29",
    cost: 290,
    period: "/month",
    color: "#14b8a6",
    features: ["Priority chat", "20% discount", "VIP badge", "Exclusive content"],
    cta: "Join VIP",
    popular: false,
  },
  {
    id: "elite",
    name: "VIP Elite",
    price: "$69",
    cost: 690,
    period: "/month",
    color: "#8b5cf6",
    features: ["All VIP perks", "VIP streams access", "30% discount", "Dedicated support", "Weekly creator picks"],
    cta: "Go Elite",
    popular: true,
  },
  {
    id: "diamond",
    name: "VIP Diamond",
    price: "$149",
    cost: 1490,
    period: "/month",
    color: "#e8a87c",
    features: ["All Elite perks", "1-on-1 creator calls", "50% discount", "Monthly credit bonus", "Diamond profile badge"],
    cta: "Go Diamond",
    popular: false,
  },
];

export default function VipLounge() {
  const { credits, spendCredits, showToast } = useApp();
  const [activeTier, setActiveTier] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = (tier: typeof TIERS[0]) => {
    if (activeTier === tier.id) return;
    setLoading(tier.id);
    setTimeout(() => {
      const ok = spendCredits(tier.cost, `${tier.name} subscription — ${tier.price}/month`);
      if (ok) {
        setActiveTier(tier.id);
        showToast({ title: `🎉 Welcome to ${tier.name}!`, description: `Your ${tier.name} membership is now active.` });
      }
      setLoading(null);
    }, 700);
  };

  return (
    <div className="min-h-screen py-10">
      <div className="container max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}>
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">VIP Lounge</h1>
          <p className="text-lg max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
            Unlock the full LinkMe experience with exclusive access for dedicated fans
          </p>
          {activeTier && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-bold"
              style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6" }}>
              <Check className="w-4 h-4" />
              {TIERS.find(t => t.id === activeTier)?.name} Active
            </div>
          )}
        </div>

        {/* Perks grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {PERKS.map(perk => (
            <div key={perk.title} className="vl-card p-5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{ background: "rgba(20,184,166,0.12)" }}>
                <perk.icon className="w-5 h-5" style={{ color: "#14b8a6" }} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{perk.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{perk.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing tiers */}
        <h2 className="vl-section-title mb-6">Choose Your Tier</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {TIERS.map(tier => {
            const isActive = activeTier === tier.id;
            const isLoading = loading === tier.id;
            return (
              <div key={tier.id} className="vl-card p-6 relative flex flex-col"
                style={tier.popular
                  ? { border: `1px solid rgba(139,92,246,0.4)` }
                  : isActive
                    ? { border: `1px solid ${tier.color}60` }
                    : {}
                }>
                {tier.popular && !isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: "#8b5cf6" }}>
                    MOST POPULAR
                  </div>
                )}
                {isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1"
                    style={{ background: tier.color }}>
                    <Check className="w-3 h-3" /> Active Plan
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-base font-bold text-white mb-1">{tier.name}</h3>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-3xl font-black" style={{ color: tier.color }}>{tier.price}</span>
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{tier.period}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>{tier.cost} credits/month</p>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                      <span style={{ color: tier.color }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(tier)}
                  disabled={isActive || isLoading}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:cursor-default"
                  style={{
                    background: isActive
                      ? `${tier.color}40`
                      : isLoading
                        ? `${tier.color}60`
                        : tier.color,
                    opacity: isActive ? 0.8 : 1,
                  }}>
                  {isLoading ? "Processing…" : isActive ? `✓ ${tier.name} Active` : tier.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Credits balance callout */}
        <div className="vl-card p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white mb-0.5">Your Current Balance</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              Credits are used for subscriptions, tips, gifts, and unlocking content
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xl font-black" style={{ color: "#14b8a6" }}>{credits.toLocaleString()}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>credits</p>
            </div>
            <Link href="/credits">
              <button className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)" }}>
                Get More
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
