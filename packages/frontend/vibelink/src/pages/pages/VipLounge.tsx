/**
 * VIBELINK — VIP Lounge
 * Velvet Dark Design System
 * 8 subscription tiers with maximized monetization
 */
import { Check, X, Zap } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { VIP_TIERS } from "@/lib/mock-data";

const VIP_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663496736475/iocsuczeEqfyUdtEzAFeTS/vibelink-vip-banner-Pm74Zr3GYCpBL6NiKnjRtD.webp";

export default function VipLounge() {
  const [, setLocation] = useLocation();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const handleSubscribe = (tier: typeof VIP_TIERS[0]) => {
    setSelectedTier(tier.id);
    // Redirect to billing page with tier info
    setLocation(`/billing?tier=${tier.id}&price=${tier.price}`);
  };
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative" style={{ minHeight: "280px" }}>
        <img src={VIP_BG} alt="VIP Lounge" className="w-full h-full object-cover absolute inset-0" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(9,9,26,0.5) 0%, rgba(9,9,26,0.95) 100%)" }} />
        <div className="relative z-10 container py-16 text-center">
          <p className="text-sm font-bold mb-2" style={{ color: "#14b8a6" }}>💎 PREMIUM MEMBERSHIP</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", fontWeight: 700, color: "white", marginBottom: "0.5rem" }}>VIP Lounge</h1>
          <p style={{ color: "rgba(255,255,255,0.6)" }}>Choose your tier and unlock exclusive benefits, priority matching, and premium features</p>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto py-12 px-4">
        {/* Tier Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {VIP_TIERS.map((tier, idx) => {
            const isPopular = idx === 3; // Platinum is the most popular
            const sessionCount = idx === 0 ? 0 : idx === 1 ? 1 : idx === 2 ? 1 : idx === 3 ? 2 : idx === 4 ? 4 : idx === 5 ? 6 : idx === 6 ? 8 : 10;
            const discount = [0, 10, 15, 20, 25, 30, 35, 40][idx];

            return (
              <div
                key={tier.id}
                className="vl-card p-6 relative transition-all duration-300 hover:scale-105"
                style={{
                  border: isPopular ? `2px solid ${tier.color}` : "1px solid rgba(255,255,255,0.1)",
                  boxShadow: isPopular ? `0 0 20px ${tier.color}40` : "none",
                }}
              >
                {isPopular && (
                  <div
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: tier.color, color: "#0f172a" }}
                  >
                    MOST POPULAR
                  </div>
                )}

                {/* Badge & Name */}
                <div className="text-center mb-4">
                  <p className="text-3xl mb-2">{tier.badge}</p>
                  <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <p className="text-3xl font-bold text-white">${tier.price}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>/month</p>
                </div>

                {/* Credits & Minutes */}
                <div className="space-y-2 mb-6 pb-6 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" style={{ color: "#14b8a6" }} />
                    <span className="text-sm text-white font-semibold">{tier.monthlyCredits.toLocaleString()} Credits/mo</span>
                  </div>

                  {sessionCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" style={{ color: "#14b8a6" }} />
                      <span className="text-sm text-white font-semibold">{sessionCount} Private Sessions</span>
                    </div>
                  )}
                </div>

                {/* Top Features */}
                <div className="space-y-2 mb-6">
                  {tier.features.slice(0, 3).map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#14b8a6" }} />
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(tier)}
                  className="w-full py-2.5 rounded-lg font-bold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: isPopular ? tier.color : "rgba(20,184,166,0.2)",
                    color: isPopular ? "#0f172a" : "#14b8a6",
                    border: isPopular ? "none" : "1px solid rgba(20,184,166,0.3)",
                  }}
                >
                  {isPopular ? "Subscribe Now" : "Choose Plan"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Complete Feature Comparison
          </h2>
          <div className="vl-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <th className="text-left px-4 py-3 font-bold text-white">Feature</th>
                    {VIP_TIERS.map(tier => (
                      <th key={tier.id} className="text-center px-3 py-3 font-bold text-white text-xs">{tier.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.7)" }}>Monthly Price</td>
                    {VIP_TIERS.map(tier => (
                      <td key={tier.id} className="text-center px-3 py-3 text-white font-semibold">${tier.price}</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.7)" }}>Monthly Credits</td>
                    {VIP_TIERS.map(tier => (
                      <td key={tier.id} className="text-center px-3 py-3 text-white font-semibold">{tier.monthlyCredits.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.7)" }}>Video Call Minutes</td>
                    {VIP_TIERS.map(tier => (
                      <td key={tier.id} className="text-center px-3 py-3 text-white font-semibold">{tier.videoCallMinutes}</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.7)" }}>Private Sessions/Month</td>
                    {VIP_TIERS.map((tier, idx) => {
                      const sessions = [0, 1, 1, 2, 4, 6, 8, 10][idx];
                      return (
                        <td key={tier.id} className="text-center px-3 py-3 text-white font-semibold">{sessions}</td>
                      );
                    })}
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.7)" }}>Creator Discount</td>
                    {VIP_TIERS.map((tier, idx) => {
                      const discount = [0, 10, 15, 20, 25, 30, 35, 40][idx];
                      return (
                        <td key={tier.id} className="text-center px-3 py-3 text-white font-semibold">{discount}%</td>
                      );
                    })}
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.7)" }}>Profile Boost</td>
                    {VIP_TIERS.map((tier, idx) => {
                      const boosts = [0, 1, 2, 4, "Unlimited", "Unlimited", "Unlimited", "Unlimited"][idx];
                      return (
                        <td key={tier.id} className="text-center px-3 py-3 text-white font-semibold">{boosts}</td>
                      );
                    })}
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.7)" }}>Priority Support</td>
                    {VIP_TIERS.map((tier, idx) => (
                      <td key={tier.id} className="text-center px-3 py-3">
                        {idx >= 3 ? (
                          <Check className="w-5 h-5 mx-auto" style={{ color: "#14b8a6" }} />
                        ) : (
                          <X className="w-5 h-5 mx-auto" style={{ color: "rgba(255,255,255,0.2)" }} />
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.7)" }}>VIP Badge</td>
                    {VIP_TIERS.map((tier, idx) => (
                      <td key={tier.id} className="text-center px-3 py-3">
                        {idx >= 4 ? (
                          <Check className="w-5 h-5 mx-auto" style={{ color: "#14b8a6" }} />
                        ) : (
                          <X className="w-5 h-5 mx-auto" style={{ color: "rgba(255,255,255,0.2)" }} />
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.7)" }}>Concierge Service</td>
                    {VIP_TIERS.map((tier, idx) => (
                      <td key={tier.id} className="text-center px-3 py-3">
                        {idx >= 5 ? (
                          <Check className="w-5 h-5 mx-auto" style={{ color: "#14b8a6" }} />
                        ) : (
                          <X className="w-5 h-5 mx-auto" style={{ color: "rgba(255,255,255,0.2)" }} />
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
