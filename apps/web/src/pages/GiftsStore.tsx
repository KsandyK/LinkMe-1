import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { MOCK_GIFTS, MOCK_PROFILES } from "@/lib/mock-data";

export default function GiftsStore() {
  const { spendCredits } = useApp();
  const [selectedRecipient, setSelectedRecipient] = useState("profile-1");
  const [sentGift, setSentGift] = useState<string | null>(null);

  const recipient = MOCK_PROFILES.find(p => p.id === selectedRecipient);

  const sendGift = (gift: typeof MOCK_GIFTS[0]) => {
    const success = spendCredits(gift.creditCost, `${gift.emoji} ${gift.name} to ${recipient?.displayName}`);
    if (success) {
      setSentGift(gift.id);
      setTimeout(() => setSentGift(null), 2000);
    }
  };

  const categories = ["all", "romantic", "sweet", "fun", "luxury", "prestige", "ultimate"];
  const [catFilter, setCatFilter] = useState("all");

  const filtered = catFilter === "all" ? MOCK_GIFTS : MOCK_GIFTS.filter(g => g.category === catFilter);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Gifts Store</h1>
        <p className="text-muted-foreground mb-6">Send virtual gifts to show appreciation</p>

        {/* Recipient */}
        <div className="p-4 rounded-xl border border-border bg-card mb-6">
          <p className="text-sm font-semibold text-foreground mb-3">Send gift to:</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {MOCK_PROFILES.filter(p => p.isCreator).slice(0, 6).map(p => (
              <button key={p.id} onClick={() => setSelectedRecipient(p.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all min-w-[80px] ${
                  selectedRecipient === p.id ? "border-primary bg-primary/10" : "border-border bg-background"
                }`}>
                <img src={p.avatarUrl} alt={p.displayName} className="w-10 h-10 rounded-full" />
                <p className="text-xs text-foreground font-medium whitespace-nowrap">{p.displayName.split(" ")[0]}</p>
                {p.isLive && <span className="text-xs text-red-500 font-bold">LIVE</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-4 py-1.5 rounded-full text-sm capitalize whitespace-nowrap transition-colors ${
                catFilter === c ? "text-white" : "text-muted-foreground border border-border bg-card"
              }`}
              style={catFilter === c ? { background: "#14B8A6" } : {}}>
              {c === "all" ? "All Gifts" : c}
            </button>
          ))}
        </div>

        {/* Gifts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {filtered.map(gift => (
            <div key={gift.id} className={`relative p-4 rounded-xl border transition-all duration-200 hover:scale-105 ${
              sentGift === gift.id ? "border-primary" : "border-border bg-card"
            }`}>
              {sentGift === gift.id && (
                <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-primary/20 z-10">
                  <p className="text-primary font-bold text-lg">Sent! 🎉</p>
                </div>
              )}
              <div className="text-4xl text-center mb-2">{gift.emoji}</div>
              <p className="font-semibold text-foreground text-center text-sm mb-1">{gift.name}</p>
              <p className="text-xs text-muted-foreground text-center mb-3 line-clamp-2">{gift.description}</p>
              <p className="text-center font-bold text-primary mb-2">{gift.creditCost} credits</p>
              <button onClick={() => sendGift(gift)}
                className="w-full py-2 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: "#14B8A6" }}>
                Send to {recipient?.displayName.split(" ")[0]}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
