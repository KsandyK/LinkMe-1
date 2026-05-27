import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { CUSTOMER_TIERS } from "@/lib/mock-data";
import { credits as creditsApi } from "@/lib/api";
import { Tag } from "lucide-react";

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

export default function CreditsStore() {
  const { credits, addCredits, isLoggedIn, showToast, activeMembership, membershipDiscount } = useApp();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const currentTier = CUSTOMER_TIERS.find(t => credits * 0.01 >= t.minSpend && credits * 0.01 <= t.maxSpend) || CUSTOMER_TIERS[0];
  const nextTier = CUSTOMER_TIERS[CUSTOMER_TIERS.indexOf(currentTier) + 1];
  const monthlySpend = 734;
  const progress = nextTier ? Math.min((monthlySpend / nextTier.minSpend) * 100, 100) : 100;

  const discountedPrice = (price: number) =>
    membershipDiscount > 0 ? +(price * (1 - membershipDiscount)).toFixed(2) : price;

  const discountLabel = membershipDiscount > 0
    ? `${Math.round(membershipDiscount * 100)}% member discount`
    : null;

  const handlePurchase = async (pkg: typeof PACKAGES[0]) => {
    const finalPrice = discountedPrice(pkg.price);
    if (!isLoggedIn) {
      // Demo mode — add credits locally
      const total = pkg.credits + pkg.bonusCredits;
      addCredits(total, `Purchased ${pkg.name} package (${pkg.credits} + ${pkg.bonusCredits} bonus credits)`);
      return;
    }
    setPurchasing(pkg.id);
    try {
      const { redirectUrl } = await creditsApi.purchase(pkg.id);
      window.location.href = redirectUrl;
    } catch {
      // Fallback: add credits locally (useful during dev without CCBill configured)
      showToast({ title: "Payment redirect failed", description: `Adding ${pkg.credits + pkg.bonusCredits} credits locally for demo.`, variant: "destructive" });
      const total = pkg.credits + pkg.bonusCredits;
      addCredits(total, `[Demo] ${pkg.name} package`);
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Balance */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Credits Store</h1>
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl border border-primary/30 bg-primary/10">
            <span className="text-2xl">💰</span>
            <div>
              <p className="text-2xl font-bold text-primary">{credits.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Current Balance</p>
            </div>
          </div>
        </div>

        {/* Tier Progress */}
        <div className="p-6 rounded-xl border border-border bg-card mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-foreground">{currentTier.label}</p>
              <p className="text-xs text-muted-foreground">Current Tier</p>
            </div>
            {nextTier && (
              <div className="text-right">
                <p className="font-semibold text-foreground">{nextTier.label}</p>
                <p className="text-xs text-muted-foreground">Next Tier</p>
              </div>
            )}
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier?.color || currentTier.color})` }} />
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-xs text-muted-foreground">${monthlySpend}/mo spent</p>
            {nextTier && <p className="text-xs text-muted-foreground">Need ${nextTier.minSpend}/mo for {nextTier.label}</p>}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "Bonus Credits", value: `+${currentTier.bonusCredits}%` },
              { label: "Discount", value: currentTier.discount ? `${currentTier.discount}%` : "—" },
              { label: "Boosts/Month", value: currentTier.boosts || "—" },
            ].map(b => (
              <div key={b.label} className="p-3 rounded-lg bg-background border border-border text-center">
                <p className="font-bold text-primary">{b.value}</p>
                <p className="text-xs text-muted-foreground">{b.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Packages */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-xl font-bold text-foreground">Choose a Package</h2>
          {discountLabel && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6" }}>
              <Tag className="w-3.5 h-3.5" />
              {discountLabel} applied
            </div>
          )}
        </div>
        <p className="text-muted-foreground text-sm mb-6">
          🔒 All purchases are processed securely. No explicit descriptors on your statement.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PACKAGES.map(pkg => {
            const finalPrice = discountedPrice(pkg.price);
            const hasDiscount = finalPrice < pkg.price;
            return (
              <div key={pkg.id} className={`relative p-5 rounded-xl border transition-all duration-200 hover:scale-105 ${
                pkg.popular ? "border-primary shadow-lg" : "border-border bg-card"
              }`} style={pkg.popular ? { background: "linear-gradient(135deg, hsl(173 60% 12%), hsl(173 60% 8%))", borderColor: "#14B8A6" } : {}}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-xs font-bold"
                    style={{ background: "#14B8A6" }}>MOST POPULAR</div>
                )}
                {pkg.savings && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-green-600/20 text-green-400 text-xs font-semibold">{pkg.savings}</div>
                )}
                <div className="text-3xl mb-2">{pkg.emoji}</div>
                <h3 className="font-bold text-foreground mb-1">{pkg.name}</h3>
                <p className="text-2xl font-black text-primary mb-1">{pkg.credits.toLocaleString()}</p>
                {pkg.bonusCredits > 0 && (
                  <p className="text-green-400 text-xs mb-2">+ {pkg.bonusCredits} bonus credits</p>
                )}
                <p className="text-muted-foreground text-xs mb-3">
                  = {(pkg.credits + pkg.bonusCredits).toLocaleString()} total credits
                </p>
                <div className="mb-3">
                  {hasDiscount ? (
                    <>
                      <p className="text-xs line-through" style={{ color: "rgba(255,255,255,0.35)" }}>${pkg.price}</p>
                      <p className="text-xl font-bold" style={{ color: "#14b8a6" }}>${finalPrice}</p>
                    </>
                  ) : (
                    <p className="text-xl font-bold text-foreground">${pkg.price}</p>
                  )}
                </div>
                <button onClick={() => handlePurchase(pkg)}
                  disabled={purchasing === pkg.id}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-70"
                  style={{ background: "#14B8A6" }}>
                  {purchasing === pkg.id ? "Redirecting…" : "Purchase"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-4 rounded-xl border border-border bg-card text-center">
          <p className="text-muted-foreground text-sm">
            🔒 Secure payment — industry-standard encryption on every transaction.
            All transactions are discreet and statement-friendly.
          </p>
        </div>
      </div>
    </div>
  );
}
