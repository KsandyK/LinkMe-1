/**
 * VIBELINK — Credits Store
 * Velvet Dark Design System
 * Micro, Standard, Bulk, and Subscription credit packages
 */
import { Zap, TrendingUp, RotateCcw } from "lucide-react";
import { useState } from "react";
import { CREDIT_PACKAGES } from "@/lib/mock-data";
import { useLocation } from "wouter";

export default function CreditsStore() {
  const [, setLocation] = useLocation();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handlePurchase = (pkg: typeof CREDIT_PACKAGES[0]) => {
    setSelectedPackage(pkg.id);
    // Redirect to billing page with package info
    setLocation(`/billing?package=${pkg.id}&credits=${pkg.credits}&price=${pkg.price}`);
  };
  const categories = {
    micro: CREDIT_PACKAGES.filter(p => p.category === "micro"),
    standard: CREDIT_PACKAGES.filter(p => p.category === "standard"),
    bulk: CREDIT_PACKAGES.filter(p => p.category === "bulk"),
    subscription: CREDIT_PACKAGES.filter(p => p.category === "subscription"),
  };

  const renderPackageCard = (pkg: typeof CREDIT_PACKAGES[0], isBest = false) => (
    <div
      key={pkg.id}
      className="vl-card p-6 relative transition-all duration-300 hover:scale-105"
      style={{
        border: isBest ? "2px solid #14b8a6" : "1px solid rgba(255,255,255,0.1)",
        boxShadow: isBest ? "0 0 20px rgba(20,184,166,0.3)" : "none",
      }}
    >
      {isBest && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold bg-teal-500 text-slate-900">
          BEST VALUE
        </div>
      )}

      <div className="text-center mb-4">
        <p className="text-3xl font-bold text-white">{pkg.credits.toLocaleString()}</p>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Credits</p>
      </div>

      <div className="text-center mb-6 pb-6 border-b border-gray-700">
        <p className="text-2xl font-bold text-white">${pkg.price}</p>
        {pkg.savings > 0 && (
          <p className="text-xs mt-2" style={{ color: "#14b8a6" }}>
            Save {pkg.savings}%
          </p>
        )}
      </div>

      <div className="text-center mb-6">
        <p className="text-xs font-bold text-white mb-2">Price per Credit</p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
          ${(pkg.price / pkg.credits).toFixed(4)}
        </p>
      </div>

      <button
        onClick={() => handlePurchase(pkg)}
        className="w-full py-2.5 rounded-lg font-bold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: isBest ? "#14b8a6" : "rgba(20,184,166,0.2)",
          color: isBest ? "#0f172a" : "#14b8a6",
          border: isBest ? "none" : "1px solid rgba(20,184,166,0.3)",
        }}
      >
        {pkg.recurring ? "Subscribe Now" : "Buy Now"}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Credits Store
          </h1>
          <p className="text-lg" style={{ color: "rgba(255,255,255,0.6)" }}>
            Buy credits to unlock exclusive content, send gifts, and enjoy premium features
          </p>
        </div>

        {/* Micro Packages */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5" style={{ color: "#14b8a6" }} />
            <h2 className="text-2xl font-bold text-white">Quick Start</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.micro.map(pkg => renderPackageCard(pkg))}
          </div>
        </div>

        {/* Standard Packages */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5" style={{ color: "#14b8a6" }} />
            <h2 className="text-2xl font-bold text-white">Popular Packages</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.standard.map((pkg, idx) => renderPackageCard(pkg, idx === 1))}
          </div>
        </div>

        {/* Bulk Packages */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5" style={{ color: "#f97316" }} />
            <h2 className="text-2xl font-bold text-white">Bulk Deals (20-50% Off)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.bulk.map((pkg, idx) => renderPackageCard(pkg, idx === 1))}
          </div>
        </div>

        {/* Subscription Auto-Recharge */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <RotateCcw className="w-5 h-5" style={{ color: "#14b8a6" }} />
            <h2 className="text-2xl font-bold text-white">Auto-Recharge Subscriptions</h2>
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "rgba(20,184,166,0.2)", color: "#14b8a6" }}>
              SAVE UP TO 40%
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.subscription.map((pkg, idx) => renderPackageCard(pkg, idx === 1))}
          </div>
          <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.5)" }}>
            💡 Auto-recharge subscriptions renew monthly. Cancel anytime from your account settings.
          </p>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="vl-card p-6">
            <h3 className="font-bold text-white mb-2">💳 Secure Payment</h3>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              All transactions are encrypted and PCI DSS Level 1 compliant. Your payment info is safe.
            </p>
          </div>
          <div className="vl-card p-6">
            <h3 className="font-bold text-white mb-2">♾️ Credits Never Expire</h3>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              Your credits remain active as long as your account is open. Use them anytime.
            </p>
          </div>
          <div className="vl-card p-6">
            <h3 className="font-bold text-white mb-2">🎁 Bonus Credits</h3>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              VIP members earn monthly bonus credits. Higher tiers = bigger bonuses!
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { q: "What can I use credits for?", a: "Credits unlock exclusive photos/videos, send gifts, start video calls, and access premium content from creators." },
              { q: "Do credits expire?", a: "No! Credits never expire as long as your account is active. You can use them whenever you want." },
              { q: "Can I get a refund?", a: "Credit purchases are non-refundable, but you can use them on any content or feature on the platform." },
              { q: "Are there taxes?", a: "Prices shown include all applicable taxes and fees. No hidden charges." },
            ].map((item, i) => (
              <div key={i} className="vl-card p-4">
                <h4 className="font-bold text-white mb-2">{item.q}</h4>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
