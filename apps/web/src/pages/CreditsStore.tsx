import { useState, useEffect, Fragment } from "react";
import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { CUSTOMER_TIERS } from "@/lib/mock-data";
import { credits as creditsApi } from "@/lib/api";
import { Tag, Zap, Crown, X, CreditCard, ShieldCheck, Clock } from "lucide-react";

// Live countdown to midnight (local) for the daily flash bonus
function useMidnightCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const end = (() => { const d = new Date(); d.setHours(24, 0, 0, 0); return d.getTime(); })();
  const ms = Math.max(0, end - now);
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
import { StripeCheckoutModal, isStripeEnabled, type CheckoutPkg } from "@/components/StripeCheckoutModal";
import { MEMBER_TIERS } from "@/lib/membership-tiers";

// Direct purchase packages intentionally offer modest bulk savings (2–15% max).
// Membership plans unlock 5–25% off ALL credit purchases — always better value
// than any direct package alone. Combine membership + bulk for maximum savings.
const PACKAGES = [
  { id: "starter",  name: "Starter",  credits: 100,   bonusCredits: 0,    price: 9.99,    popular: false,               emoji: "✨" },
  { id: "basic",    name: "Basic",    credits: 250,   bonusCredits: 5,    price: 24.99,   popular: false, savings: "Save 2%",  emoji: "⚡" },
  { id: "value",    name: "Value",    credits: 500,   bonusCredits: 25,   price: 49.99,   popular: true,  savings: "Save 5%",  emoji: "🔥" },
  { id: "plus",     name: "Plus",     credits: 1000,  bonusCredits: 75,   price: 99.99,   popular: false, savings: "Save 7%",  emoji: "💎" },
  { id: "pro",      name: "Pro",      credits: 2500,  bonusCredits: 250,  price: 249.99,  popular: false, savings: "Save 9%",  emoji: "⭐" },
  { id: "max",      name: "Max",      credits: 5000,  bonusCredits: 600,  price: 499.99,  popular: false, savings: "Save 11%", emoji: "👑" },
  { id: "ultra",    name: "Ultra",    credits: 10000, bonusCredits: 1500, price: 999.99,  popular: false, savings: "Save 13%", emoji: "💫" },
  { id: "diamond",  name: "Diamond",  credits: 20000, bonusCredits: 3500, price: 1999.99, popular: false, savings: "Save 15%", emoji: "🌟" },
];

// Membership plans — Free shown for comparison, paid tiers from single source of truth
const MEMBERSHIP_PLANS = [
  {
    id: "free", name: "Free", emoji: "🌟", price: 0, color: "#64748b", popular: false, cta: "Current Plan",
    bonusCredits: 0, discount: 0, vipSessions: 0,
    features: ["Browse all public creator profiles", "Watch free-tier live streams", "750 starter credits on signup", "Send messages (5 credits each)", "Basic search & discovery"],
    notIncluded: ["Bonus monthly credits", "Exclusive or PPV content", "VIP lounge access", "Credit discounts"],
  },
  ...MEMBER_TIERS.map(t => ({
    id: t.id, name: t.name, emoji: t.emoji, price: t.price, color: t.color, popular: t.popular, cta: t.cta,
    bonusCredits: t.bonusCredits, discount: Math.round(t.discount * 100), vipSessions: t.vipSessions,
    features: t.features, notIncluded: t.notIncluded,
  })),
];

const ULTRA_MEMBERSHIP_IDS = new Set(["diamond", "obsidian", "platinum_m"]);
const CORE_MEMBERSHIP_IDS = new Set(["free", "fan", "superfan", "devotee", "allaccess", "elite"]);

// Dark text needed on light-coloured buttons
const btnTextColor = (color: string) =>
  ["#f59e0b", "#d4af37", "#e2e8f0", "#ffd700"].includes(color) ? "#000" : "#fff";

type StoreTab = "credits" | "memberships";

export default function CreditsStore() {
  const {
    credits, addCredits, isLoggedIn, showToast, activeMembership, membershipDiscount,
    setActiveMembership, recordPurchase,
  } = useApp();

  const [tab, setTab] = useState<StoreTab>("credits");
  const flashCountdown = useMidnightCountdown();
  const [flashDismissed, setFlashDismissed] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [stripeModal, setStripeModal] = useState<{ pkg: CheckoutPkg; finalPrice: number } | null>(null);

  // ── Membership state ────────────────────────────────────────────────────────
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [loadingMembership, setLoadingMembership] = useState<string | null>(null);
  const [showAllMemberships, setShowAllMemberships] = useState(false);

  // Payment method guard (shared with Account billing)
  type SavedCardSnippet = { id: string; last4: string; brand: string; isDefault: boolean };
  const [savedCards] = useState<SavedCardSnippet[]>(() => {
    try { return JSON.parse(localStorage.getItem("vl_saved_cards_v1") ?? "[]"); } catch { return []; }
  });
  const defaultCard = savedCards.find(c => c.isDefault) ?? savedCards[0] ?? null;
  const [noCardModal, setNoCardModal] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<{
    name: string; emoji: string; priceStr: string; description: string; onConfirm: () => void;
  } | null>(null);

  // ── Tier progress (credits tab) ─────────────────────────────────────────────
  const currentTier = CUSTOMER_TIERS.find(t => credits * 0.01 >= t.minSpend && credits * 0.01 <= t.maxSpend) || CUSTOMER_TIERS[0];
  const nextTier = CUSTOMER_TIERS[CUSTOMER_TIERS.indexOf(currentTier) + 1];
  const monthlySpend = 734;
  const progress = nextTier ? Math.min((monthlySpend / nextTier.minSpend) * 100, 100) : 100;

  const discountedPrice = (price: number) =>
    membershipDiscount > 0 ? +(price * (1 - membershipDiscount)).toFixed(2) : price;
  const discountLabel = membershipDiscount > 0
    ? `${Math.round(membershipDiscount * 100)}% member discount`
    : null;

  // ── Credit purchase ─────────────────────────────────────────────────────────
  const handlePurchase = async (pkg: typeof PACKAGES[0]) => {
    const finalPrice = discountedPrice(pkg.price);
    if (isStripeEnabled && isLoggedIn) { setStripeModal({ pkg, finalPrice }); return; }
    if (!isLoggedIn) return;
    setPurchasing(pkg.id);
    try {
      const { redirectUrl } = await creditsApi.purchase(pkg.id);
      window.location.href = redirectUrl;
    } catch {
      if (import.meta.env.DEV) {
        const total = pkg.credits + pkg.bonusCredits;
        addCredits(total, `[Demo] ${pkg.name} package`);
        showToast({ title: "Demo mode", description: `Added ${total.toLocaleString()} credits locally (no real charge).` });
      } else {
        showToast({ title: "Payments coming soon", description: "Credit purchases aren't available just yet — please check back shortly.", variant: "destructive" });
      }
    } finally {
      setPurchasing(null);
    }
  };

  const handleStripeSuccess = (creditsEarned: number) => {
    addCredits(creditsEarned, `${stripeModal?.pkg.name ?? "Credits"} package purchased via Stripe`);
    setStripeModal(null);
    showToast({ title: "Purchase complete!", description: `${creditsEarned.toLocaleString()} credits added to your balance.` });
  };

  // ── Membership purchase ─────────────────────────────────────────────────────
  const _doSubscribeMembership = (plan: typeof MEMBERSHIP_PLANS[0]) => {
    if (!import.meta.env.DEV) {
      showToast({ title: "Memberships coming soon", description: "Paid memberships aren't available just yet — please check back shortly.", variant: "destructive" });
      return;
    }
    setLoadingMembership(plan.id);
    setTimeout(() => {
      setLoadingMembership(null);
      setActiveMembership(plan.id);
      const price = billingCycle === "annual" ? plan.price * 0.8 : plan.price;
      const priceStr = price % 1 === 0 ? price.toLocaleString() : price.toFixed(2);
      recordPurchase(price, `[Demo] ${plan.emoji} ${plan.name} Membership — $${priceStr}/${billingCycle === "annual" ? "yr" : "mo"}`);
      if (plan.bonusCredits > 0) addCredits(plan.bonusCredits, `[Demo] ${plan.emoji} ${plan.name} monthly bonus credits`);
      showToast({ title: `[Demo] ${plan.emoji} ${plan.name} Activated`, description: "Local simulation only — no charge." });
    }, 800);
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
      description: plan.bonusCredits > 0 ? `+${plan.bonusCredits.toLocaleString()} credits/month` : "Membership benefits",
      onConfirm: () => { setPendingPurchase(null); _doSubscribeMembership(plan); },
    });
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "#09091a" }}>
      <div className="max-w-6xl mx-auto">
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="vl-display text-white" style={{ fontSize: "2.75rem" }}>Store</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
              Top up credits or unlock a membership — everything you buy on CRAVR, in one place.
            </p>
          </div>
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl"
            style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.25)" }}>
            <Zap className="w-5 h-5" style={{ color: "#14b8a6" }} />
            <div>
              <p className="text-2xl font-black leading-none" style={{ color: "#14b8a6", fontFamily: "'DM Mono', monospace" }}>{credits.toLocaleString()}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Current balance</p>
            </div>
          </div>
        </div>

        {/* ── Tab switcher ────────────────────────────────────────────────────── */}
        <div className="vl-segment mb-8">
          <button className="vl-segment-btn" data-active={tab === "credits"} onClick={() => setTab("credits")}>
            <Zap className="w-4 h-4" /> Credits
          </button>
          <button className="vl-segment-btn" data-active={tab === "memberships"} onClick={() => setTab("memberships")}>
            <Crown className="w-4 h-4" /> Memberships
          </button>
        </div>

        {/* ═══════════════════════════════ CREDITS TAB ═══════════════════════════ */}
        {tab === "credits" && (
          <div className="animate-fade-up">
            {/* Daily flash bonus — urgency banner with live countdown to midnight */}
            {!flashDismissed && (
              <div className="rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap"
                style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.16), rgba(239,68,68,0.08))", border: "1px solid rgba(245,166,35,0.3)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,166,35,0.18)" }}>
                    <Zap className="w-5 h-5" style={{ color: "#f5a623" }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Today's flash bonus — extra credits on every pack</p>
                    <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                      <Clock className="w-3.5 h-3.5" style={{ color: "#f5a623" }} />
                      Ends in <span className="font-mono font-bold" style={{ color: "#f5a623" }}>{flashCountdown}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setFlashDismissed(true)}
                  className="p-1.5 rounded-lg transition-all hover:bg-white/10" style={{ color: "rgba(255,255,255,0.4)" }} aria-label="Dismiss">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Tier Progress */}
            <div className="vl-card-elevated p-6 mb-8">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-white">{currentTier.label}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Current tier</p>
                </div>
                {nextTier && (
                  <div className="text-right">
                    <p className="font-semibold text-white">{nextTier.label}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Next tier</p>
                  </div>
                )}
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier?.color || currentTier.color})` }} />
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>${monthlySpend}/mo spent</p>
                {nextTier && <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Need ${nextTier.minSpend}/mo for {nextTier.label}</p>}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: "Bonus Credits", value: `+${currentTier.bonusCredits}%` },
                  { label: "Discount", value: currentTier.discount ? `${currentTier.discount}%` : "—" },
                  { label: "Boosts/Month", value: currentTier.boosts || "—" },
                ].map(b => (
                  <div key={b.label} className="p-3 rounded-xl text-center"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="font-bold" style={{ color: "#14b8a6" }}>{b.value}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{b.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Packages header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-xl font-bold text-white">Choose a package</h2>
              {discountLabel && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6" }}>
                  <Tag className="w-3.5 h-3.5" /> {discountLabel} applied
                </div>
              )}
            </div>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
              🔒 Secure, <strong>one-time</strong> charge in USD — credits never auto-renew. Charges appear on your
              statement as a neutral descriptor (e.g. <span className="font-mono">CCBILL*CRAVR</span>).
            </p>

            {/* Packages grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PACKAGES.map(pkg => {
                const finalPrice = discountedPrice(pkg.price);
                const hasDiscount = finalPrice < pkg.price;
                return (
                  <div key={pkg.id}
                    className="vl-tier-card relative p-5 rounded-2xl border"
                    style={pkg.popular
                      ? { background: "linear-gradient(150deg, rgba(20,184,166,0.16), rgba(20,184,166,0.04))", borderColor: "#14b8a6", boxShadow: "0 20px 44px -24px rgba(20,184,166,0.6)" }
                      : { background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.08)" }}>
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-xs font-bold whitespace-nowrap"
                        style={{ background: "#14b8a6" }}>MOST POPULAR</div>
                    )}
                    {pkg.savings && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>{pkg.savings}</div>
                    )}
                    <div className="text-3xl mb-2">{pkg.emoji}</div>
                    <h3 className="font-bold text-white mb-1">{pkg.name}</h3>
                    <p className="text-2xl font-black mb-1" style={{ color: "#14b8a6", fontFamily: "'DM Mono', monospace" }}>{pkg.credits.toLocaleString()}</p>
                    {pkg.bonusCredits > 0 && <p className="text-xs mb-2" style={{ color: "#4ade80" }}>+ {pkg.bonusCredits} bonus credits</p>}
                    <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                      = {(pkg.credits + pkg.bonusCredits).toLocaleString()} total credits
                    </p>
                    <div className="mb-3">
                      {hasDiscount ? (
                        <>
                          <p className="text-xs line-through" style={{ color: "rgba(255,255,255,0.35)" }}>${pkg.price}</p>
                          <p className="text-xl font-bold" style={{ color: "#14b8a6" }}>${finalPrice}</p>
                        </>
                      ) : (
                        <p className="text-xl font-bold text-white">${pkg.price}</p>
                      )}
                    </div>
                    <button onClick={() => handlePurchase(pkg)} disabled={purchasing === pkg.id}
                      className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-70"
                      style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)" }}>
                      {purchasing === pkg.id ? "Redirecting…" : "Purchase"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-4 rounded-2xl text-center"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                🔒 Secure payment — industry-standard encryption on every transaction. Credit purchases are
                one-time and non-recurring. All charges are discreet and statement-friendly.
                {isStripeEnabled && " · Powered by Stripe"}
              </p>
              <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                By purchasing you agree to our{" "}
                <a href="/legal/terms" className="hover:underline" style={{ color: "#14b8a6" }}>Terms</a> and{" "}
                <a href="/legal/refund" className="hover:underline" style={{ color: "#14b8a6" }}>Refund &amp; Cancellation Policy</a>.
              </p>
            </div>
          </div>
        )}

        {/* ════════════════════════════ MEMBERSHIPS TAB ══════════════════════════ */}
        {tab === "memberships" && (
          <div className="animate-fade-up">
            {/* Section header + billing toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(236,72,153,0.15)", color: "#ec4899", border: "1px solid rgba(236,72,153,0.25)" }}>
                  FOR FANS
                </span>
                <p className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Unlock content · Earn bonus credits · Access VIP sessions
                </p>
              </div>
              <div className="vl-segment self-start sm:self-auto">
                <button className="vl-segment-btn" data-active={billingCycle === "monthly"} onClick={() => setBillingCycle("monthly")}>Monthly</button>
                <button className="vl-segment-btn" data-active={billingCycle === "annual"} onClick={() => setBillingCycle("annual")}>
                  Annual
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80" }}>-20%</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {MEMBERSHIP_PLANS.filter(p => showAllMemberships || CORE_MEMBERSHIP_IDS.has(p.id)).map((plan, i, arr) => {
                const rawPrice = billingCycle === "annual" ? plan.price * 0.8 : plan.price;
                const price = rawPrice % 1 === 0 ? rawPrice.toLocaleString() : rawPrice.toFixed(2);
                const annualTotal = rawPrice * 12;
                const annualTotalStr = annualTotal % 1 === 0 ? annualTotal.toLocaleString() : annualTotal.toFixed(2);
                const isBlackCard = plan.id === "blackcard";
                const isUltra = ULTRA_MEMBERSHIP_IDS.has(plan.id);
                const isFirstUltra = isUltra && !ULTRA_MEMBERSHIP_IDS.has(arr[i - 1]?.id ?? "");
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
                    <div className={`vl-tier-card relative flex flex-col p-5 rounded-2xl border ${plan.popular ? "shadow-2xl" : ""}`}
                      style={{
                        borderColor: isBlackCard ? "rgba(212,175,55,0.45)" : isUltra ? `${plan.color}55` : plan.popular ? plan.color : "rgba(255,255,255,0.07)",
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
                          style={{ background: "linear-gradient(90deg, #d4af37, #b8962a)", color: "#000" }}>✦ EXCLUSIVE</div>
                      )}
                      {isUltra && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold whitespace-nowrap"
                          style={{ background: `linear-gradient(90deg, ${plan.color}, ${plan.color}bb)`, color: btnTextColor(plan.color) }}>✦ ULTRA-PREMIUM</div>
                      )}
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{plan.emoji}</span>
                        <div>
                          <h3 className="text-lg font-black text-white">{plan.name}</h3>
                          {plan.bonusCredits > 0 && (
                            <p className="text-xs" style={{ color: isBlackCard ? "#d4af37" : plan.color }}>
                              +{plan.bonusCredits >= 999999 ? "∞" : plan.bonusCredits.toLocaleString()} credits/mo
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mb-3">
                        <span className="text-3xl font-black text-white">{plan.price === 0 ? "Free" : `$${price}`}</span>
                        {plan.price > 0 && <span className="text-sm ml-1" style={{ color: "rgba(255,255,255,0.35)" }}>/mo</span>}
                        {billingCycle === "annual" && plan.price > 0 && (
                          <p className="text-xs mt-0.5" style={{ color: "#4ade80" }}>Billed ${annualTotalStr}/year</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {plan.discount > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: `${isBlackCard ? "#d4af37" : plan.color}20`, color: isBlackCard ? "#d4af37" : plan.color, border: `1px solid ${isBlackCard ? "#d4af37" : plan.color}30` }}>
                            {plan.discount}% off credits
                          </span>
                        )}
                        {plan.vipSessions > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.25)" }}>
                            {plan.vipSessions >= 9999 ? "Unlimited VIP" : `${plan.vipSessions} VIP sessions`}
                          </span>
                        )}
                      </div>
                      <ul className="space-y-1.5 flex-1 mb-4">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-start gap-2 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                            <span className="mt-0.5 font-bold flex-shrink-0" style={{ color: isBlackCard ? "#d4af37" : plan.color }}>✓</span>
                            {f}
                          </li>
                        ))}
                        {plan.notIncluded.map(f => (
                          <li key={f} className="flex items-start gap-2 text-xs opacity-35" style={{ color: "rgba(255,255,255,0.6)" }}>
                            <span className="mt-0.5 flex-shrink-0">✗</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button onClick={() => handleSubscribeMembership(plan)}
                        disabled={plan.id === "free" || activeMembership === plan.id || loadingMembership === plan.id}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-default"
                        style={
                          plan.id === "free" || activeMembership === plan.id
                            ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }
                            : isBlackCard
                              ? { background: "linear-gradient(90deg, #d4af37, #b8962a)", color: "#000" }
                              : { background: plan.color, color: btnTextColor(plan.color) }
                        }>
                        {loadingMembership === plan.id ? "Processing…"
                          : activeMembership === plan.id ? "✓ Active Plan"
                          : plan.id === "free" ? "Current (Free)"
                          : plan.cta}
                      </button>
                    </div>
                  </Fragment>
                );
              })}
            </div>

            <div className="text-center my-5">
              <button onClick={() => setShowAllMemberships(!showAllMemberships)}
                className="px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                {showAllMemberships ? "▲ Show fewer plans" : `▼ Show all ${MEMBERSHIP_PLANS.length} plans`}
              </button>
            </div>

            <div className="p-4 rounded-2xl text-center"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                🔒 Memberships billed monthly to your saved card. Cancel anytime from Account Settings.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stripe checkout modal */}
      {stripeModal && (
        <StripeCheckoutModal
          pkg={stripeModal.pkg}
          finalPrice={stripeModal.finalPrice}
          onSuccess={handleStripeSuccess}
          onClose={() => setStripeModal(null)}
        />
      )}

      {/* No-card modal */}
      {noCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setNoCardModal(false); }}>
          <div className="relative w-full max-w-sm rounded-2xl p-6 animate-scale-in"
            style={{ background: "#0f1622", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.25)" }}>
              <CreditCard className="w-5 h-5" style={{ color: "#14b8a6" }} />
            </div>
            <h3 className="font-bold text-white text-base mb-1.5">Add a payment method first</h3>
            <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
              You'll need a saved card before subscribing to a membership. Add one in your account billing settings.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setNoCardModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                Not now
              </button>
              <Link href="/account" className="flex-1">
                <button className="w-full py-2.5 rounded-xl text-sm font-bold text-white vl-btn-primary">Go to Billing</button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Confirm purchase modal */}
      {pendingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setPendingPurchase(null); }}>
          <div className="relative w-full max-w-sm rounded-2xl p-6 animate-scale-in"
            style={{ background: "#0f1622", border: "1px solid rgba(255,255,255,0.1)" }}>
            <button onClick={() => setPendingPurchase(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10" style={{ color: "rgba(255,255,255,0.4)" }}>
              <X className="w-4 h-4" />
            </button>
            <div className="text-3xl mb-3">{pendingPurchase.emoji}</div>
            <h3 className="font-bold text-white text-base mb-1">Confirm {pendingPurchase.name}</h3>
            <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>{pendingPurchase.description}</p>
            <div className="flex items-center gap-2 mb-5 mt-3 p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <CreditCard className="w-4 h-4" style={{ color: "#14b8a6" }} />
              <span className="text-sm text-white">
                {pendingPurchase.priceStr}/{billingCycle === "annual" ? "yr" : "mo"} · {defaultCard?.brand} ••••{defaultCard?.last4}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mb-4 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              <ShieldCheck className="w-3.5 h-3.5" /> Cancel anytime from Account Settings
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPendingPurchase(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                Cancel
              </button>
              <button onClick={pendingPurchase.onConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white vl-btn-primary">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
