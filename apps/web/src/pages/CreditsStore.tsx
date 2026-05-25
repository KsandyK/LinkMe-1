import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { CUSTOMER_TIERS } from "@/lib/mock-data";
import { credits as creditsApi } from "@/lib/api";

const PACKAGES = [
  { id: "starter", name: "Starter", credits: 100, bonusCredits: 0, price: 9.99, popular: false, emoji: "✨" },
  { id: "popular", name: "Popular", credits: 300, bonusCredits: 30, price: 24.99, popular: true, savings: "Save 17%", emoji: "🔥" },
  { id: "value", name: "Value", credits: 600, bonusCredits: 90, price: 44.99, popular: false, savings: "Save 25%", emoji: "💎" },
  { id: "premium", name: "Premium", credits: 1250, bonusCredits: 250, price: 84.99, popular: false, savings: "Save 32%", emoji: "⭐" },
  { id: "elite", name: "Elite", credits: 2500, bonusCredits: 600, price: 149.99, popular: false, savings: "Save 40%", emoji: "👑" },
  { id: "ultimate", name: "Ultimate", credits: 5000, bonusCredits: 1500, price: 274.99, popular: false, savings: "Save 45%", emoji: "🚀" },
  { id: "vip", name: "VIP", credits: 10000, bonusCredits: 4000, price: 499.99, popular: false, savings: "Save 50%", emoji: "💫" },
  { id: "diamond", name: "Diamond", credits: 25000, bonusCredits: 12500, price: 999.99, popular: false, savings: "Save 57%", emoji: "🌟" },
];

export default function CreditsStore() {
  const { credits, addCredits, isLoggedIn, showToast } = useApp();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const currentTier = CUSTOMER_TIERS.find(t => credits * 0.01 >= t.minSpend && credits * 0.01 <= t.maxSpend) || CUSTOMER_TIERS[0];
  const nextTier = CUSTOMER_TIERS[CUSTOMER_TIERS.indexOf(currentTier) + 1];
  const monthlySpend = 734;
  const progress = nextTier ? Math.min((monthlySpend / nextTier.minSpend) * 100, 100) : 100;

  const handlePurchase = async (pkg: typeof PACKAGES[0]) => {
    if (!isLoggedIn) {
      // Demo mode — add credits locally
      const total = pkg.credits + pkg.bonusCredits;
      addCredits(total, `Purchased ${pkg.name} package (${pkg.credits} + ${pkg.bonusCredits} bonus credits)`);
      return;
    }
    setPurchasing(pkg.id);
    try {
      const { redirectUrl } = await creditsApi.purchase(pkg.id);
      // Redirect to CCBill payment page
      window.location.href = redirectUrl;
    } catch (err: unknown) {
      // Fallback: add credits locally (useful during dev without CCBill configured)
      const msg = err instanceof Error ? err.message : "Purchase failed";
      showToast({ title: "Payment redirect failed", description: msg + " — adding credits locally for demo.", variant: "destructive" });
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
        <h2 className="text-xl font-bold text-foreground mb-4">Choose a Package</h2>
        <p className="text-muted-foreground text-sm mb-6">
          🔒 All purchases are processed securely via CCBill. No adult transactions on your statement.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PACKAGES.map(pkg => (
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
              <p className="text-xl font-bold text-foreground mb-3">${pkg.price}</p>
              <button onClick={() => handlePurchase(pkg)}
                disabled={purchasing === pkg.id}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-70"
                style={{ background: "#14B8A6" }}>
                {purchasing === pkg.id ? "Redirecting…" : "Purchase"}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 rounded-xl border border-border bg-card text-center">
          <p className="text-muted-foreground text-sm">
            🔒 Secure payment powered by <strong>CCBill</strong> — the industry standard for adult content billing.
            All transactions are discreet and encrypted.
          </p>
        </div>
      </div>
    </div>
  );
}
