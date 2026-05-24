/**
 * LINKME â€” Gifts Store
 * Velvet Dark Design System
 * 20+ gift options at various price points
 */
import { Gift, Heart, Zap } from "lucide-react";
import { useState } from "react";
import { GIFT_OPTIONS } from "@/lib/mock-data";

export default function GiftsStore() {
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSendGift = (gift: any) => {
    setSelectedGift(gift.id);
    setShowConfirmation(true);
    // Auto-dismiss after 2 seconds
    setTimeout(() => setShowConfirmation(false), 2000);
  };
  const categories = {
    social: GIFT_OPTIONS.filter((g: any) => g.category === "social"),
    romantic: GIFT_OPTIONS.filter((g: any) => g.category === "romantic"),
    date: GIFT_OPTIONS.filter((g: any) => g.category === "date"),
    experience: GIFT_OPTIONS.filter((g: any) => g.category === "experience"),
    luxury: GIFT_OPTIONS.filter((g: any) => g.category === "luxury"),
    vip: GIFT_OPTIONS.filter((g: any) => g.category === "vip"),
    ultra_luxury: GIFT_OPTIONS.filter((g: any) => g.category === "ultra_luxury"),
  };

  const renderGiftCard = (gift: any) => (
    <div
      key={gift.id}
      className="vl-card p-4 text-center transition-all duration-300 hover:scale-105 cursor-pointer"
    >
      <p className="text-4xl mb-2">{gift.emoji}</p>
      <h3 className="font-bold text-white mb-1">{gift.name}</h3>
      <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
        {gift.description}
      </p>
      <button
        onClick={() => handleSendGift(gift)}
        className="w-full py-2 rounded-lg font-bold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: "rgba(20,184,166,0.2)",
          color: "#14b8a6",
          border: "1px solid rgba(20,184,166,0.3)",
        }}
      >
        Send ${gift.price}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Gifts Store
          </h1>
          <p className="text-lg" style={{ color: "rgba(255,255,255,0.6)" }}>
            Send gifts to creators and show your appreciation. Every gift supports their earnings.
          </p>
        </div>

        {/* Social Gifts */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="w-5 h-5" style={{ color: "#14b8a6" }} />
            <h2 className="text-2xl font-bold text-white">Social Gifts ($1â€“$5)</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.social.map((gift: any) => renderGiftCard(gift))}
          </div>
        </div>

        {/* Romantic & Date Gifts */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="w-5 h-5" style={{ color: "#ec4899" }} />
            <h2 className="text-2xl font-bold text-white">Date Gifts ($10â€“$25)</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...categories.romantic, ...categories.date].map((gift: any) => renderGiftCard(gift))}
          </div>
        </div>

        {/* Experience & Luxury Gifts */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5" style={{ color: "#f97316" }} />
            <h2 className="text-2xl font-bold text-white">Luxury Gifts ($50â€“$500)</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...categories.experience, ...categories.luxury].map((gift: any) => renderGiftCard(gift))}
          </div>
        </div>

        {/* VIP & Ultra Luxury */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Gift className="w-5 h-5" style={{ color: "#a78bfa" }} />
            <h2 className="text-2xl font-bold text-white">Ultra Luxury ($250â€“$5000)</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...categories.vip, ...categories.ultra_luxury].map((gift: any) => renderGiftCard(gift))}
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="vl-card p-6">
            <h3 className="font-bold text-white mb-2">ðŸ’ Creator Earnings</h3>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              Creators earn 70% of gift value. Your support directly funds their content.
            </p>
          </div>
          <div className="vl-card p-6">
            <h3 className="font-bold text-white mb-2">ðŸŽ Public Recognition</h3>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              Your gift appears publicly in their stream. Creators love seeing supporter names!
            </p>
          </div>
          <div className="vl-card p-6">
            <h3 className="font-bold text-white mb-2">â­ Spender Rewards</h3>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              Earn cashback on gifts. Higher spender tiers = bigger rewards (5â€“25%).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
