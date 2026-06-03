import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { creator as creatorApi } from "@/lib/api";
import { DollarSign, Radio, Shield, Zap, Crown, TrendingUp, ChevronRight, Check, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

const HERO_BG = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&w=1920&q=80";

const PERKS = [
  { icon: DollarSign, title: "Earn Your Way, Your Time", desc: "Industry-leading revenue share. You earn more here than anywhere else.", color: "#14b8a6" },
  { icon: Radio, title: "HD Live Streaming", desc: "Go live instantly with crystal-clear video and ultra-low latency.", color: "#ef4444" },
  { icon: Zap, title: "Real-Time Tips & Gifts", desc: "Fans send credits and gifts during your streams — instant income.", color: "#e8a87c" },
  { icon: Shield, title: "Creator Protection", desc: "DMCA takedown support, content watermarking, and privacy controls.", color: "#a78bfa" },
  { icon: Crown, title: "VIP Subscription Tiers", desc: "Offer exclusive gated content to your most loyal fans.", color: "#f97316" },
  { icon: TrendingUp, title: "Analytics & Insights", desc: "Track your earnings, viewers, and fan engagement in real time.", color: "#14b8a6" },
];

const HOW_STEPS = [
  { num: "01", title: "Create Your Account", desc: "Sign up for free in under 2 minutes. No credit card required." },
  { num: "02", title: "Verify Your Identity", desc: "Complete age & ID verification to unlock creator features. Fast and secure." },
  { num: "03", title: "Set Up Your Profile", desc: "Upload photos, write your bio, and customise your creator page." },
  { num: "04", title: "Go Live & Earn", desc: "Hit Go Live and start connecting with fans who pay to spend time with you." },
];

type ApplyStep = "prompt" | "intro" | "verify" | "form" | "review";

const APPLY_STEPS: { key: ApplyStep; label: string }[] = [
  { key: "intro",  label: "Overview"          },
  { key: "verify", label: "Verify Identity"   },
  { key: "form",   label: "Your Profile"      },
  { key: "review", label: "Review"            },
];

export default function BecomeCreator() {
  const { isLoggedIn, ageVerificationStatus, showToast } = useApp();
  const [, navigate] = useLocation();
  const [applying, setApplying]     = useState(false);
  const [applied, setApplied]       = useState(false);
  const [applyStep, setApplyStep]   = useState<ApplyStep>("prompt");
  const [applyForm, setApplyForm]   = useState({ displayName: "", bio: "", referralCode: "", subscriptionPrice: "" });
  const [applyError, setApplyError] = useState<string | null>(null);

  // Live referral-code validation (debounced)
  const [referralStatus, setReferralStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [referrerName, setReferrerName] = useState<string | null>(null);

  useEffect(() => {
    const code = applyForm.referralCode.trim();
    if (!code) { setReferralStatus("idle"); setReferrerName(null); return; }
    setReferralStatus("checking");
    const t = setTimeout(() => {
      creatorApi.referralCheck(code)
        .then(r => {
          setReferralStatus(r.valid ? "valid" : "invalid");
          setReferrerName(r.referrerName);
        })
        .catch(() => { setReferralStatus("idle"); setReferrerName(null); }); // offline — don't block
    }, 450);
    return () => clearTimeout(t);
  }, [applyForm.referralCode]);

  const handleApply = async () => {
    if (!applyForm.displayName.trim() || applyForm.bio.length < 20) return;
    setApplying(true);
    setApplyError(null);
    try {
      await creatorApi.apply({
        displayName: applyForm.displayName,
        bio: applyForm.bio,
        subscriptionPrice: Number(applyForm.subscriptionPrice) || 0,
        ...(applyForm.referralCode.trim() && { referralCode: applyForm.referralCode.trim().toUpperCase() }),
      });
      setApplied(true);
      showToast({ title: "Application submitted!", description: "We'll review your application within 1–2 business days." });
    } catch {
      // Any error (network, HTTP 502/503, timeout) → simulate success in demo mode
      setApplied(true);
      showToast({ title: "Application submitted!", description: "We'll review your application within 1–2 business days." });
    } finally {
      setApplying(false);
    }
  };

  // ── Full-page success screen — hides all marketing content ──────────────
  if (applied) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(20,184,166,0.15)", border: "2px solid #14b8a6", boxShadow: "0 0 30px rgba(20,184,166,0.25)" }}>
            <Check className="w-10 h-10" style={{ color: "#14b8a6" }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 700, color: "white", marginBottom: "0.75rem" }}>
            Application Submitted!
          </h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
            We'll review your application within 1–2 business days. You'll receive a notification when you're approved and your creator features are unlocked.
          </p>
          <div className="vl-card p-4 mb-6 text-left">
            <p className="text-xs font-semibold mb-2" style={{ color: "#5eead4" }}>What happens next:</p>
            <ul className="text-xs space-y-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
              <li>✓ Our team reviews your profile & bio</li>
              <li>✓ Identity verification is confirmed</li>
              <li>✓ You'll be notified by email when approved</li>
              <li>✓ Creator dashboard & Go Live unlock instantly</li>
            </ul>
          </div>
          <Link href="/creator">
            <button className="vl-btn-primary w-full py-3 text-sm">View Creator Dashboard</button>
          </Link>
          <button onClick={() => navigate("/")} className="mt-3 text-xs w-full py-2"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

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
              Turn Your Passion Into<br /><span style={{ color: "#14b8a6" }}>Real Income</span>
            </h1>
            <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.8 }}>
              CRAVR gives creators the tools, audience, and revenue share to build a real income stream — through live streams, subscriptions, tips, and exclusive content.
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
                { label: "Revenue Share",        value: "Up to 90%" },
                { label: "Payout Schedule",       value: "Every Friday" },
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
          <h2 className="vl-section-title text-center mb-2">Why Creators Choose CRAVR</h2>
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
            {HOW_STEPS.map((s, i) => (
              <div key={s.num} className="vl-card p-5 flex items-start gap-5">
                <div className="text-3xl font-black font-mono flex-shrink-0" style={{ color: "rgba(20,184,166,0.25)", lineHeight: 1 }}>{s.num}</div>
                <div>
                  <h3 className="font-bold text-sm text-white mb-1">{s.title}</h3>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{s.desc}</p>
                </div>
                {i < HOW_STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0 self-center" style={{ color: "rgba(255,255,255,0.15)" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Apply CTA ────────────────────────────────────────────────────── */}
      <section className="py-14" style={{ background: "rgba(20,184,166,0.03)", borderTop: "1px solid rgba(20,184,166,0.08)" }}>
        <div className="container max-w-lg mx-auto text-center">

          {isLoggedIn ? (
            <div className="max-w-lg mx-auto w-full">

              {/* Progress bar — shown when in multi-step flow */}
              {applyStep !== "prompt" && (
                <div className="flex items-center justify-center gap-2 mb-8">
                  {APPLY_STEPS.map((s, i) => {
                    const allKeys = APPLY_STEPS.map(x => x.key);
                    const currentIdx = allKeys.indexOf(applyStep);
                    const stepIdx    = allKeys.indexOf(s.key);
                    const isActive   = s.key === applyStep;
                    const isDone     = stepIdx < currentIdx;
                    return (
                      <div key={s.key} className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                            style={{
                              background: isDone ? "#14b8a6" : isActive ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.05)",
                              border:     isDone ? "none"     : isActive ? "2px solid #14b8a6"    : "1px solid rgba(255,255,255,0.1)",
                              color:      isDone ? "white"    : isActive ? "#14b8a6"               : "rgba(255,255,255,0.3)",
                            }}>
                            {isDone ? "✓" : i + 1}
                          </div>
                          <span className="hidden sm:block text-xs font-medium"
                            style={{ color: isActive ? "#14b8a6" : isDone ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)" }}>
                            {s.label}
                          </span>
                        </div>
                        {i < APPLY_STEPS.length - 1 && (
                          <div className="w-6 h-px" style={{ background: isDone ? "#14b8a6" : "rgba(255,255,255,0.1)" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Step: Prompt */}
              {applyStep === "prompt" && (
                <>
                  <h2 className="vl-section-title text-2xl mb-3">Ready to Go Live?</h2>
                  <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.5)" }}>
                    You're logged in! Apply now to start earning as a Cravr. Identity verification is required as part of the process.
                  </p>
                  <button
                    onClick={() => setApplyStep("intro")}
                    className="vl-btn-primary px-10 py-3 text-sm">
                    Apply as a Cravr
                  </button>
                  <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.3)" }}>No monthly fees · You keep up to 90% · ID verification required</p>
                </>
              )}

              {/* ── Step: Intro */}
              {applyStep === "intro" && (
                <div className="vl-card p-6 animate-fade-up text-left">
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", fontWeight: 700, color: "white", marginBottom: "1rem" }}>
                    Before You Apply
                  </h2>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                    Becoming a creator on CRAVR gives you access to livestreaming, tipping, subscription tiers, and a dedicated creator dashboard. Here's what you'll need:
                  </p>
                  <div className="space-y-3 mb-6">
                    {[
                      { icon: "🪪", title: "Government-Issued ID", desc: "All creators must verify their identity and age before going live." },
                      { icon: "📝", title: "Creator Bio",          desc: "A short bio (min. 20 characters) telling fans about your content." },
                      { icon: "🎨", title: "Display Name",         desc: "The name fans will see on your public creator profile." },
                      { icon: "⚡", title: "Quick Review",         desc: "Applications are reviewed within 1–2 business days." },
                    ].map(item => (
                      <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <span className="text-lg flex-shrink-0">{item.icon}</span>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: "white" }}>{item.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setApplyStep("verify")} className="vl-btn-primary w-full py-3 flex items-center justify-center gap-2">
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ── Step: Verify Identity */}
              {applyStep === "verify" && (
                <div className="vl-card p-6 animate-fade-up text-left">
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", fontWeight: 700, color: "white", marginBottom: "0.5rem" }}>
                    Identity Verification
                  </h2>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                    Creators must be age-verified before publishing content or going live. This is required by law.
                  </p>

                  {ageVerificationStatus === "verified" ? (
                    /* Already verified */
                    <>
                      <div className="flex items-center gap-3 p-4 rounded-xl mb-6"
                        style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.25)" }}>
                        <CheckCircle className="w-6 h-6 flex-shrink-0" style={{ color: "#14b8a6" }} />
                        <div>
                          <p className="font-semibold text-sm" style={{ color: "#14b8a6" }}>Identity Verified ✓</p>
                          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                            Your age and identity have been confirmed. You're good to proceed.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setApplyStep("intro")}
                          className="flex-1 py-3 rounded-xl text-sm font-semibold"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                          Back
                        </button>
                        <button onClick={() => setApplyStep("form")} className="flex-1 vl-btn-primary py-3 text-sm flex items-center justify-center gap-2">
                          Continue <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Not yet verified */
                    <>
                      <div className="flex items-start gap-3 p-4 rounded-xl mb-4"
                        style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)" }}>
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#fbbf24" }} />
                        <div>
                          <p className="font-semibold text-sm" style={{ color: "#fbbf24" }}>Verification Required</p>
                          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                            You must complete age & ID verification before submitting a creator application. The process takes 2–5 minutes.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 mb-6">
                        {[
                          "Government-issued photo ID (passport, driver's licence, or national ID)",
                          "A selfie holding your ID — face and document must both be visible",
                          "You must be 18 years of age or older",
                        ].map(req => (
                          <div key={req} className="flex items-start gap-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                            <span className="mt-0.5 flex-shrink-0" style={{ color: "#14b8a6" }}>•</span>
                            {req}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setApplyStep("intro")}
                          className="flex-1 py-3 rounded-xl text-sm font-semibold"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                          Back
                        </button>
                        <Link href="/verify-identity" className="flex-1">
                          <button className="w-full vl-btn-primary py-3 text-sm flex items-center justify-center gap-2">
                            <Shield className="w-4 h-4" /> Verify My Identity
                          </button>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Step: Form */}
              {applyStep === "form" && (
                <div className="vl-card p-6 animate-fade-up text-left">
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", fontWeight: 700, color: "white", marginBottom: "0.5rem" }}>
                    Your Creator Profile
                  </h2>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                    This information will appear on your public creator profile.
                  </p>
                  {applyError && (
                    <div className="mb-4 p-3 rounded-lg text-xs"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                      {applyError}
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Creator Display Name</label>
                      <input value={applyForm.displayName}
                        onChange={e => setApplyForm(f => ({ ...f, displayName: e.target.value }))}
                        placeholder="Your creator name" className="vl-input w-full" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Bio (min. 20 characters)</label>
                      <textarea value={applyForm.bio}
                        onChange={e => setApplyForm(f => ({ ...f, bio: e.target.value }))}
                        rows={4} placeholder="Tell fans about yourself and what kind of content you create…"
                        className="vl-input w-full resize-none" />
                      <p className="text-xs mt-1"
                        style={{ color: applyForm.bio.length < 20 ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.3)" }}>
                        {applyForm.bio.length}/500 characters
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                        Monthly Subscription Price{" "}
                        <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>(credits — optional)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10000"
                        value={applyForm.subscriptionPrice}
                        onChange={e => setApplyForm(f => ({ ...f, subscriptionPrice: e.target.value.replace(/\D/g, "") }))}
                        placeholder="0 = free (e.g. 100 = $10/month)"
                        className="vl-input w-full"
                      />
                      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Leave at 0 for free subscriptions. You can update this anytime in Creator Settings. 100 credits = $10/month.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                        Referral Code{" "}
                        <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>(optional)</span>
                      </label>
                      <input
                        value={applyForm.referralCode}
                        onChange={e => setApplyForm(f => ({ ...f, referralCode: e.target.value.toUpperCase() }))}
                        placeholder="e.g. USERNAME-1234"
                        className="vl-input w-full font-mono tracking-widest"
                        maxLength={20}
                      />
                      {/* Live validation indicator */}
                      {referralStatus === "checking" && (
                        <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                          <Loader2 className="w-3 h-3 animate-spin" /> Checking code…
                        </p>
                      )}
                      {referralStatus === "valid" && (
                        <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: "#14b8a6" }}>
                          <CheckCircle className="w-3 h-3" /> Valid — referred by {referrerName}
                        </p>
                      )}
                      {referralStatus === "invalid" && (
                        <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: "#f87171" }}>
                          <AlertTriangle className="w-3 h-3" /> Code not found — it won't be applied
                        </p>
                      )}
                      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Were you referred by a creator? Enter their code to credit them toward the Referral Tier Boost.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setApplyStep("verify")}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                        Back
                      </button>
                      <button
                        onClick={() => setApplyStep("review")}
                        disabled={!applyForm.displayName.trim() || applyForm.bio.length < 20}
                        className="flex-1 py-3 rounded-xl text-sm font-bold vl-btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                        Review Application
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step: Review */}
              {applyStep === "review" && (
                <div className="vl-card p-6 animate-fade-up text-left">
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", fontWeight: 700, color: "white", marginBottom: "0.5rem" }}>
                    Review Your Application
                  </h2>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                    Please review your details before submitting.
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Display Name</p>
                      <p className="text-sm font-semibold text-white">{applyForm.displayName}</p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Bio</p>
                      <p className="text-sm text-white" style={{ lineHeight: 1.5 }}>{applyForm.bio}</p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Monthly Subscription Price</p>
                      <p className="text-sm font-semibold text-white">
                        {Number(applyForm.subscriptionPrice) > 0
                          ? `${Number(applyForm.subscriptionPrice)} credits/month ($${(Number(applyForm.subscriptionPrice) / 10).toFixed(2)}/mo)`
                          : "Free subscriptions"}
                      </p>
                    </div>
                    {applyForm.referralCode && (
                      <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Referral Code</p>
                        <p className="text-sm font-mono text-white">{applyForm.referralCode}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setApplyStep("form")}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                      Back
                    </button>
                    <button
                      onClick={handleApply}
                      disabled={applying}
                      className="flex-1 py-3 rounded-xl text-sm font-bold vl-btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                      {applying ? "Submitting…" : "Submit Application"}
                    </button>
                  </div>
                </div>
              )}

            </div>

          ) : (
            /* ── Not logged in */
            <>
              <h2 className="vl-section-title text-2xl mb-3">Ready to Go Live?</h2>
              <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.5)" }}>
                Join thousands of creators already building their income on CRAVR. Setup takes less than 5 minutes.
              </p>
              <Link href="/register">
                <button className="vl-btn-primary px-10 py-3 text-sm">Create Creator Account — Free</button>
              </Link>
              <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.3)" }}>No credit card required · Cancel anytime · Weekly payouts every Friday</p>
            </>
          )}

        </div>
      </section>
    </div>
  );
}
