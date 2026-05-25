import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { profiles as profilesApi, messages as messagesApi, CreatorProfileItem } from "@/lib/api";
import { MOCK_PROFILES } from "@/lib/mock-data";
import { useApp } from "@/contexts/AppContext";
import { Heart, Share2, Lock, Users, Star, ThumbsUp, Loader2 } from "lucide-react";

interface ContentItem {
  id: string;
  type: string;
  thumbnailUrl: string;
  creditCost: number;
  title: string;
}

export default function ProfileDetail() {
  const { id } = useParams<{ id: string }>();  // id is userId
  const [, setLocation] = useLocation();
  const { unlockContent, unlockedContent, isLoggedIn, showToast } = useApp();

  const [creator, setCreator] = useState<CreatorProfileItem | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    profilesApi.get(id)
      .then(data => {
        setCreator(data);
        // Placeholder content items for real API profiles
        setContentItems([
          { id: `${data.id}-ph-1`, creditCost: 50, title: "Exclusive Photo", type: "photo", thumbnailUrl: `https://picsum.photos/seed/${data.user.username}-a/400/300` },
          { id: `${data.id}-ph-2`, creditCost: 75, title: "Photo Set", type: "photo", thumbnailUrl: `https://picsum.photos/seed/${data.user.username}-b/400/300` },
          { id: `${data.id}-v-1`, creditCost: 150, title: "Private Video", type: "video", thumbnailUrl: `https://picsum.photos/seed/${data.user.username}-c/400/300` },
        ]);
      })
      .catch(() => {
        // API unavailable — look for matching mock profile
        const mock = MOCK_PROFILES.find(p => p.id === id || p.username === id);
        if (mock) {
          setCreator({
            id: mock.id,
            userId: mock.id,
            isLive: mock.isLive ?? false,
            isApproved: true,
            subscriberCount: mock.followersCount ?? 0,
            totalEarnings: mock.totalEarnings ?? 0,
            monthlyEarnings: 0,
            bio: mock.bio ?? null,
            subscriptionPrice: 0,
            user: {
              id: mock.id,
              username: mock.username,
              profile: {
                displayName: mock.displayName,
                avatarUrl: mock.avatarUrl,
                coverUrl: mock.coverUrl,
                location: mock.location,
                isVerified: false,
              },
            },
          });
          // Use the rich mock media items
          if (mock.mediaItems?.length) {
            setContentItems(mock.mediaItems.map(m => ({
              id: m.id,
              type: m.type,
              thumbnailUrl: m.thumbnailUrl,
              creditCost: m.creditCost,
              title: m.title,
            })));
          }
        } else {
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleMessage = async () => {
    if (!isLoggedIn) {
      setLocation("/login");
      return;
    }
    if (!creator) return;
    setMessaging(true);
    try {
      await messagesApi.getOrCreate(creator.userId);
      setLocation("/messages");
    } catch {
      showToast({ title: "Error", description: "Could not open conversation", variant: "destructive" });
    } finally {
      setMessaging(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#14b8a6" }} />
      </div>
    );
  }

  if (notFound || !creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-white mb-2">Profile not found</p>
          <Link href="/profiles"><span className="text-sm cursor-pointer" style={{ color: "#14b8a6" }}>← Back to creators</span></Link>
        </div>
      </div>
    );
  }

  const p = creator.user.profile;
  const displayName = p?.displayName ?? creator.user.username;
  const avatarUrl = p?.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.user.username}`;
  const coverUrl = p?.coverUrl ?? `https://picsum.photos/seed/${creator.user.username}-cover/1200/400`;
  const location = p?.location ?? "";

  return (
    <div className="min-h-screen">
      {/* Cover */}
      <div className="relative h-52 md:h-64 overflow-hidden">
        <img src={coverUrl} alt={displayName} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(9,9,26,0.95) 100%)" }} />
        {creator.isLive && (
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold"
            style={{ background: "rgba(239,68,68,0.9)", color: "white" }}>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        )}
      </div>

      {/* Profile header */}
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-6 mb-5 relative z-10">
          <img src={avatarUrl} alt={displayName}
            className="w-20 h-20 rounded-full border-4 object-cover flex-shrink-0"
            style={{ borderColor: "#14b8a6" }} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">{displayName}</h1>
              {p?.isVerified && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6" }}>
                  ✓ Verified
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              @{creator.user.username}{location ? ` · ${location}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg transition-all hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <Heart className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
            <button className="p-2 rounded-lg transition-all hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <Share2 className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
            {creator.isLive ? (
              <Link href={`/live/${creator.id}`}>
                <button className="px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2" style={{ background: "#ef4444", color: "white" }}>
                  ● JOIN LIVE
                </button>
              </Link>
            ) : (
              <button
                onClick={handleMessage}
                disabled={messaging}
                className="vl-btn-primary px-5 py-2 text-sm disabled:opacity-70 flex items-center gap-2"
              >
                {messaging && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Message
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-7">
          {[
            { icon: Users, value: creator.subscriberCount.toLocaleString(), label: "Subscribers" },
            { icon: ThumbsUp, value: "—", label: "Likes" },
            { icon: Star, value: "—", label: "Rating" },
          ].map(s => (
            <div key={s.label} className="vl-card p-4 text-center">
              <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: "rgba(255,255,255,0.35)" }} />
              <div className="font-bold text-white text-lg">{s.value}</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 pb-12">
          {/* Left panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="vl-card p-5">
              <h3 className="font-bold text-sm text-white mb-3">About</h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                {creator.bio ?? "No bio provided."}
              </p>
            </div>

            <div className="vl-card p-5">
              <h3 className="font-bold text-sm text-white mb-3">Details</h3>
              <div className="space-y-2">
                {[
                  { label: "Username", value: `@${creator.user.username}` },
                  { label: "Location", value: location },
                  { label: "Subscription", value: creator.subscriptionPrice > 0 ? `${creator.subscriptionPrice} credits/mo` : "Free" },
                ].map(d => d.value && (
                  <div key={d.label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{d.label}</span>
                    <span className="text-xs font-medium text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel — Exclusive Content */}
          <div className="lg:col-span-3">
            <h3 className="font-bold text-sm text-white mb-4">Exclusive Content</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {contentItems.map(item => {
                const isUnlocked = unlockedContent.has(item.id);
                return (
                  <div key={item.id} className="vl-card overflow-hidden cursor-pointer group"
                    onClick={() => !isUnlocked && unlockContent(item.id, item.creditCost)}>
                    <div className="relative h-28 overflow-hidden">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${!isUnlocked ? "blur-sm scale-105" : ""}`}
                      />
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center"
                          style={{ background: "rgba(9,9,26,0.5)" }}>
                          <Lock className="w-5 h-5 mb-1" style={{ color: "#14b8a6" }} />
                          <span className="text-xs font-bold" style={{ color: "#14b8a6" }}>{item.creditCost} credits</span>
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Tap to unlock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-white truncate">{item.title}</p>
                      <p className="text-xs capitalize" style={{ color: "rgba(255,255,255,0.35)" }}>{item.type}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
