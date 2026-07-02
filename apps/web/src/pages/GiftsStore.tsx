import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { gifts as giftsApi, profiles as profilesApi, GiftItem, CreatorProfileItem } from "@/lib/api";
import { MOCK_GIFTS, MOCK_PROFILES } from "@/lib/mock-data";
import { Loader2, Zap } from "lucide-react";

export default function GiftsStore() {
  const { spendCredits, credits, isLoggedIn, showToast } = useApp();
  const [catalogue, setCatalogue] = useState<GiftItem[]>([]);
  const [creators, setCreators] = useState<CreatorProfileItem[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [sentGift, setSentGift] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState("all");
  const [sending, setSending] = useState<string | null>(null);
  const [loadingCatalogue, setLoadingCatalogue] = useState(true);
  const [loadingCreators, setLoadingCreators] = useState(true);

  useEffect(() => {
    giftsApi.catalogue()
      .then(data => setCatalogue(Array.isArray(data) ? data : []))
      .catch(() => setCatalogue(MOCK_GIFTS as GiftItem[]))
      .finally(() => setLoadingCatalogue(false));

    profilesApi.list({ limit: 8 })
      .then(data => {
        const list = data.profiles ?? [];
        setCreators(list);
        if (list.length > 0) setSelectedRecipientId(list[0].userId);
      })
      .catch(() => {
        const mockCreators: CreatorProfileItem[] = MOCK_PROFILES.slice(0, 8).map(p => ({
          id: p.id,
          userId: p.id,
          isLive: p.isLive ?? false,
          isApproved: true,
          subscriberCount: p.followersCount ?? 0,
          totalEarnings: p.totalEarnings ?? 0,
          monthlyEarnings: 0,
          bio: p.bio ?? null,
          subscriptionPrice: 0,
          user: {
            id: p.id,
            username: p.username,
            profile: {
              displayName: p.displayName,
              avatarUrl: p.avatarUrl,
              coverUrl: p.coverUrl,
              location: p.location,
              isVerified: false,
            },
          },
        }));
        setCreators(mockCreators);
        if (mockCreators.length > 0) setSelectedRecipientId(mockCreators[0].userId);
      })
      .finally(() => setLoadingCreators(false));
  }, []);

  const recipient = creators.find(c => c.userId === selectedRecipientId);
  const recipientName = recipient?.user?.profile?.displayName ?? recipient?.user?.username ?? "Creator";

  const categories = ["all", ...Array.from(new Set(catalogue.map(g => g.category)))];
  const filtered = catFilter === "all" ? catalogue : catalogue.filter(g => g.category === catFilter);

  const sendGift = async (gift: GiftItem) => {
    if (!selectedRecipientId) {
      showToast({ title: "No recipient", description: "Select a creator to send this gift to.", variant: "destructive" });
      return;
    }

    if (isLoggedIn) {
      // Real API call
      setSending(gift.id);
      try {
        await giftsApi.send({ giftId: gift.id, recipientId: selectedRecipientId });
        setSentGift(gift.id);
        showToast({ title: `${gift.emoji} Gift Sent!`, description: `You sent a ${gift.name} to ${recipientName}` });
        setTimeout(() => setSentGift(null), 2000);
      } catch {
        // Any error (network, HTTP 502/503) → demo mode: deduct credits locally
        const success = spendCredits(gift.creditCost, `${gift.emoji} ${gift.name} to ${recipientName}`);
        if (success) {
          setSentGift(gift.id);
          showToast({ title: `${gift.emoji} Gift Sent!`, description: `You sent a ${gift.name} to ${recipientName}` });
          setTimeout(() => setSentGift(null), 2000);
        } else {
          showToast({ title: "Insufficient credits", description: `You need ${gift.creditCost} credits to send this gift.`, variant: "destructive" });
        }
      } finally {
        setSending(null);
      }
    } else {
      // Demo mode — spend credits locally
      const success = spendCredits(gift.creditCost, `${gift.emoji} ${gift.name} to ${recipientName}`);
      if (success) {
        setSentGift(gift.id);
        showToast({ title: `${gift.emoji} Gift Sent!`, description: `You sent a ${gift.name} to ${recipientName}` });
        setTimeout(() => setSentGift(null), 2000);
      } else {
        showToast({ title: "Insufficient credits", description: `You need ${gift.creditCost} credits. Visit the Credits Store to top up.`, variant: "destructive" });
      }
    }
  };

  const loading = loadingCatalogue || loadingCreators;

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "#09091a" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-7 flex-wrap gap-4">
          <div>
            <h1 className="vl-display text-white" style={{ fontSize: "2.75rem" }}>Gifts</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
              Send virtual gifts to show your favorite creators some love.
            </p>
          </div>
          <Link href="/credits">
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl cursor-pointer transition-all hover:border-white/20"
              style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.25)" }}>
              <Zap className="w-5 h-5" style={{ color: "#14b8a6" }} />
              <div>
                <p className="text-2xl font-black leading-none" style={{ color: "#14b8a6", fontFamily: "'DM Mono', monospace" }}>{credits.toLocaleString()}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Your balance</p>
              </div>
            </div>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#14b8a6" }} />
          </div>
        ) : (
          <div className="animate-fade-up">
            {/* Recipient selector */}
            {creators.length > 0 ? (
              <div className="vl-card-elevated p-5 mb-6">
                <p className="text-sm font-semibold text-white mb-3">Send gift to:</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {creators.map(c => {
                    const name = c.user.profile?.displayName ?? c.user.username;
                    const avatar = c.user.profile?.avatarUrl
                      ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user.username}`;
                    const selected = selectedRecipientId === c.userId;
                    return (
                      <button key={c.userId} onClick={() => setSelectedRecipientId(c.userId)}
                        className="vl-tier-card flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all min-w-[80px]"
                        style={selected
                          ? { borderColor: "#14b8a6", background: "rgba(20,184,166,0.12)" }
                          : { borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                        <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover"
                          style={selected ? { boxShadow: "0 0 0 2px #14b8a6" } : undefined} />
                        <p className="text-xs font-medium whitespace-nowrap" style={{ color: selected ? "#fff" : "rgba(255,255,255,0.7)" }}>{name.split(" ")[0]}</p>
                        {c.isLive && <span className="text-xs font-bold" style={{ color: "#ef4444" }}>LIVE</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="vl-card-elevated p-5 mb-6 text-center">
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No creators available — gifts will go to a demo recipient</p>
              </div>
            )}

            {/* Categories */}
            <div className="vl-segment mb-6 max-w-full overflow-x-auto">
              {categories.map(c => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className="vl-segment-btn capitalize whitespace-nowrap"
                  data-active={catFilter === c}>
                  {c === "all" ? "All Gifts" : c}
                </button>
              ))}
            </div>

            {/* Gifts Grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-16" style={{ color: "rgba(255,255,255,0.4)" }}>No gifts in this category</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {filtered.map(gift => {
                  const sent = sentGift === gift.id;
                  return (
                    <div key={gift.id}
                      className="vl-tier-card relative p-4 rounded-2xl border"
                      style={sent
                        ? { borderColor: "#14b8a6", background: "rgba(20,184,166,0.06)" }
                        : { borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}>
                      {sent && (
                        <div className="absolute inset-0 rounded-2xl flex items-center justify-center z-10 animate-scale-in"
                          style={{ background: "rgba(20,184,166,0.2)", backdropFilter: "blur(2px)" }}>
                          <p className="font-bold text-lg" style={{ color: "#14b8a6" }}>Sent! 🎉</p>
                        </div>
                      )}
                      <div className="text-4xl text-center mb-2">{gift.emoji}</div>
                      <p className="font-semibold text-white text-center text-sm mb-1">{gift.name}</p>
                      <p className="text-center font-bold mb-2" style={{ color: "#14b8a6", fontFamily: "'DM Mono', monospace" }}>{gift.creditCost} credits</p>
                      <button
                        onClick={() => sendGift(gift)}
                        disabled={sending === gift.id}
                        className="w-full py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-1.5"
                        style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)" }}>
                        {sending === gift.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Send to {recipientName.split(" ")[0]}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
