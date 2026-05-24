/**
 * VIBELINK — Boosts Page
 * Velvet Dark Design System
 */
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { MOCK_BOOST_PACKAGES } from "@/lib/mock-data";
import { Zap, TrendingUp, Lock, Eye } from "lucide-react";

export default function BoostsPage() {
  const { showToast } = useApp();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = (pkg: typeof MOCK_BOOST_PACKAGES[0]) => {
    setPurchasing(pkg.id);
    setTimeout(() => {
      showToast({ title: `${pkg.name} activated!`, description: `Your profile is now boosted for ${pkg.hours} hour(s)` });
      setPurchasing(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Profile Boosts
          </h1>
          <p className="text-lg" style={{ color: "rgba(255,255,255,0.6)" }}>
            Get your profile seen by more people and attract new matches
          </p>
        </div>

        {/* How It Works */}
        <div className="vl-card p-6 mb-12 flex items-start gap-4">
          <TrendingUp className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: "#14b8a6" }} />
          <div>
            <h3 className="font-bold text-white mb-2">How Boosts Work</h3>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              A boost temporarily places your profile at the top of search results and the browse page, increasing visibility and new follower acquisition. Higher tiers = more visibility multiplier.
            </p>
          </div>
        </div>

        {/* Boost Packages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {MOCK_BOOST_PACKAGES.map((pkg, idx) => (
            <div
              key={pkg.id}
              className="vl-card p-6 transition-all duration-300 hover:scale-105"
              style={{
                border: idx === 2 ? "2px solid #14b8a6" : "1px solid rgba(255,255,255,0.1)",
                boxShadow: idx === 2 ? "0 0 20px rgba(20,184,166,0.2)" : "none",
              }}
            >
              {idx === 2 && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold bg-teal-500 text-slate-900">
                  BEST VALUE
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-6 h-6" style={{ color: "#14b8a6" }} />
                <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
              </div>

              <div className="mb-4 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-3xl font-bold text-white">${pkg.price}</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>One-time purchase</p>
              </div>

              <div className="mb-6 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ color: "#14b8a6" }}>⏱️</span>
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>{pkg.hours} hour boost</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ color: "#14b8a6" }}>👁️</span>
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>{pkg.viewers} visibility</span>
                </div>
              </div>

              <button
                onClick={() => handlePurchase(pkg)}
                disabled={purchasing === pkg.id}
                className="w-full py-2.5 rounded-lg font-bold text-sm transition-all duration-200"
                style={{
                  background: idx === 2 ? "#14b8a6" : "rgba(20,184,166,0.2)",
                  color: idx === 2 ? "#0f172a" : "#14b8a6",
                  border: idx === 2 ? "none" : "1px solid rgba(20,184,166,0.3)",
                }}
              >
                {purchasing === pkg.id ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "currentColor", borderTopColor: "transparent" }} />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" />
                    Activate Boost
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="vl-card p-6">
            <h3 className="font-bold text-white mb-2">📈 Increased Visibility</h3>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              Your profile appears at the top of search results and browse pages.
            </p>
          </div>
          <div className="vl-card p-6">
            <h3 className="font-bold text-white mb-2">💬 More Matches</h3>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              Get more profile views, messages, and potential connections.
            </p>
          </div>
          <div className="vl-card p-6">
            <h3 className="font-bold text-white mb-2">⏰ Limited Time</h3>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              Boosts are time-limited. Stack multiple boosts for extended visibility.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
