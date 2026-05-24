import { Link } from "wouter";
import { DollarSign, Radio, Shield, Zap, Crown, TrendingUp, ChevronRight, Check } from "lucide-react";

const HERO_BG = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&w=1920&q=80";

const PERKS = [
  { icon: DollarSign, title: "Keep 80% of Earnings", desc: "Industry-leading revenue share. You earn more here than anywhere else.", color: "#14b8a6" },
  { icon: Radio, title: "HD Live Streaming", desc: "Go live instantly with crystal-clear video and ultra-low latency.", color: "#ef4444" },
  { icon: Zap, title: "Real-Time Tips & Gifts", desc: "Fans send credits and gifts during your streams — instant income.", color: "#e8a87c" },
  { icon: Shield, title: "Creator Protection", desc: "DMCA takedown support, content watermarking, and privacy controls.", color: "#a78bfa" },
  { icon: Crown, title: "VIP Subscription Tiers", desc: "Set custom subscription prices and offer exclusive gated content.", color: "#f97316" },
  { icon: TrendingUp, title: "Analytics & Insights", desc: "Track your earnings, viewers, and fan engagement in real time.", color: "#14b8a6" },
];

const STEPS = [
  { num: "01", title: "Create Your Account", desc: "Sign up for free in under 2 minutes. No credit card required." },
  { num: "02", title: "Verify Your Identity", desc: "Complete age & ID verification to unlock creator features. Fast and secure." },
  { num: "03", title: "Set Up Your Profile", desc: "Upload photos, write your bio, and set your subscription prices." },
  { num: "04", title: "Go Live & Earn", desc: "Hit Go Live and start connecting with fans who pay to spend time with you." },
];

const PLANS = [
  {
    name: "Starter",
    cut: "80%",
    features: ["Unlimited live streams", "Fan messaging", "Custom tip menu", "Basic analytics"],
    highlight: false,
  },
  {
    name: "Pro Creator",
    cut: "85%",
    features: ["Everything in Starter", "Priority search placement", "Advanced analytics", "Dedicated support", "Custom profile badge"],
    highlight: true,
  },
  {
    name: "Elite",
    cut: "90%",
    features: ["Everything in Pro", "VIP lounge access", "Co-streaming features", "Cross-promotion", "Personal account manager"],
    highlight: false,
  },
];

export default function BecomeCreator() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: "460px" }}>
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="Become a Creator" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(9,9,26,0.95) 0%, rgba(9,9,26,0.7) 50%, rgba(9,9,26,0.9) 100%)" }} />
        </div>
        <div className="relative z-10 container py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6", letterSpacing: "0.08em" }}>
              <Crown className="w-3.5 h-3.5" /> JOIN 2,400+ CREATORS EARNING TODAY
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
              Turn Your Vibe Into<br /><span style={{ color: "#14b8a6" }}>Real Income</span>
            </h1>
            <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.8 }}>
              LinkMe gives creators the tools, audience, and revenue share to build a real income stream — through live streams, subscriptions, tips, and exclusive content.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/register">
                <button className="vl-btn-primary px-7 py-3 text-sm">Start Earning — It's Free</button>
              </Link>
              <Link href="/profiles">
                <button className="px-7 py-3 rounded-xl font-bold text-sm transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
                  Browse Creators <ChevronRight className="w-4 h-4 inline" />
                </button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-8 mt-9">
              {[
                { label: "Avg Monthly Earnings", value: "$3,200" },
                { label: "Revenue Share", value: "Up to 90%" },
                { label: "Payout Speed", value: "24–48 hrs" },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-2xl font-bold font-mono" style={{ color: "#14b8a6" }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Perks grid */}
      <section className="py-14">
        <div className="container">
          <h2 className="vl-section-title text-center mb-2">Why Creators Choose LinkMe</h2>
          <p className="text-center text-sm mb-9" style={{ color: "rgba(255,255,255,0.45)" }}>Everything you need to build, grow, and monetize your audience.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PERKS.map(p => (
              <div key={p.title} className="vl-card p-5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${p.color}15`, border: `1px solid ${p.color}25` }}>
                  <p.icon className="w-5 h-5" style={{ color: p.color }} />
                </div>
                <h3 className="font-bold text-sm text-white mb-1.5">{p.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12" style={{ background: "rgba(20,184,166,0.02)", borderTop: "1px solid rgba(20,184,166,0.07)", borderBottom: "1px solid rgba(20,184,166,0.07)" }}>
        <div className="container max-w-3xl">
          <h2 className="vl-section-title text-center mb-9">How It Works</h2>
          <div className="space-y-5">
            {STEPS.map((s, i) => (
              <div key={s.num} className="vl-card p-5 flex items-start gap-5">
                <div className="text-3xl font-black font-mono flex-shrink-0" style={{ color: "rgba(20,184,166,0.25)", lineHeight: 1 }}>{s.num}</div>
                <div>
                  <h3 className="font-bold text-sm text-white mb-1">{s.title}</h3>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0 self-center" style={{ color: "rgba(255,255,255,0.15)" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing tiers */}
      <section className="py-14">
        <div className="container max-w-4xl">
          <h2 className="vl-section-title text-center mb-2">Creator Plans</h2>
          <p className="text-center text-sm mb-9" style={{ color: "rgba(255,255,255,0.45)" }}>No monthly fees. You only pay when you earn.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {PLANS.map(plan => (
              <div key={plan.name} className="vl-card p-6 flex flex-col relative"
                style={plan.highlight ? { border: "1px solid rgba(20,184,166,0.4)", boxShadow: "0 0 30px rgba(20,184,166,0.1)" } : {}}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white" }}>
                    Most Popular
                  </div>
                )}
                <h3 className="font-bold text-white mb-1">{plan.name}</h3>
                <div className="text-3xl font-black mb-0.5" style={{ color: "#14b8a6" }}>{plan.cut}</div>
                <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>of every dollar earned</p>
                <ul className="space-y-2.5 flex-1 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                      <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#14b8a6" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <button className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={plan.highlight
                      ? { background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white" }
                      : { background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }
                    }>
                    Get Started
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-14" style={{ background: "rgba(20,184,166,0.03)", borderTop: "1px solid rgba(20,184,166,0.08)" }}>
        <div className="container max-w-lg mx-auto text-center">
          <h2 className="vl-section-title text-2xl mb-3">Ready to Go Live?</h2>
          <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.5)" }}>
            Join thousands of creators already building their income on LinkMe. Setup takes less than 5 minutes.
          </p>
          <Link href="/register">
            <button className="vl-btn-primary px-10 py-3 text-sm">Create Creator Account — Free</button>
          </Link>
          <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.3)" }}>No credit card required · Cancel anytime · Instant payouts</p>
        </div>
      </section>
    </div>
  );
}
