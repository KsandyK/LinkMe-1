import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { gifts as giftsApi, profiles as profilesApi, GiftItem, CreatorProfileItem } from "@/lib/api";
import { MOCK_GIFTS, MOCK_PROFILES } from "@/lib/mock-data";
import { Loader2 } from "lucide-react";

export default function GiftsStore() {
  const { spendCredits, isLoggedIn, showToast } = useApp();
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
      } catch (err) {
        if (err instanceof TypeError) {
          // API offline — fall back to local credit deduction (demo mode)
          const success = spendCredits(gift.creditCost, `${gift.emoji} ${gift.name} to ${recipientName}`);
          if (success) {
            setSentGift(gift.id);
            showToast({ title: `${gift.emoji} Gift Sent!`, description: `You sent a ${gift.name} to ${recipientName}` });
            setTimeout(() => setSentGift(null), 2000);
          }
        } else {
          const msg = err instanceof Error ? err.message : "Failed to send gift";
          showToast({ title: "Gift failed", description: msg, variant: "destructive" });
        }
      } finally {
        setSending(null);
      }
    } else {
      // Demo mode — spend credits locally
      const success = spendCredits(gift.creditCost, `${gift.emoji} ${gift.name} to ${recipientName}`);
      if (success) {
        setSentGift(gift.id);
        setTimeout(() => setSentGift(null), 2000);
      }
    }
  };

  const loading = loadingCatalogue || loadingCreators;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Gifts Store</h1>
        <p className="text-muted-foreground mb-6">Send virtual gifts to show appreciation</p>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#14b8a6" }} />
          </div>
        ) : (
          <>
            {/* Recipient selector */}
            {creators.length > 0 ? (
              <div className="p-4 rounded-xl border border-border bg-card mb-6">
                <p className="text-sm font-semibold text-foreground mb-3">Send gift to:</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {creators.map(c => {
                    const name = c.user.profile?.displayName ?? c.user.username;
                    const avatar = c.user.profile?.avatarUrl
                      ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user.username}`;
                    return (
                      <button key={c.userId} onClick={() => setSelectedRecipientId(c.userId)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all min-w-[80px] ${
                          selectedRecipientId === c.userId ? "border-primary bg-primary/10" : "border-border bg-background"
                        }`}>
                        <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
                        <p className="text-xs text-foreground font-medium whitespace-nowrap">{name.split(" ")[0]}</p>
                        {c.isLive && <span className="text-xs text-red-500 font-bold">LIVE</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-border bg-card mb-6 text-center">
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No creators available — gifts will go to a demo recipient</p>
              </div>
            )}

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
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">No gifts in this category</div>
            ) : (
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
                    <p className="text-center font-bold text-primary mb-2">{gift.creditCost} credits</p>
                    <button
                      onClick={() => sendGift(gift)}
                      disabled={sending === gift.id}
                      className="w-full py-2 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-1.5"
                      style={{ background: "#14B8A6" }}>
                      {sending === gift.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Send to {recipientName.split(" ")[0]}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
