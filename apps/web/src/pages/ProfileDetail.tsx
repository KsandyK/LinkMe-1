import { useEffect, useState, useCallback } from "react";
import { Link, useParams, useLocation } from "wouter";
import { profiles as profilesApi, messages as messagesApi, content as contentApi, CreatorProfileItem } from "@/lib/api";
import { MOCK_PROFILES } from "@/lib/mock-data";
import { useApp } from "@/contexts/AppContext";
import { Heart, Share2, Lock, Users, Star, ThumbsUp, Loader2, Bot } from "lucide-react";
import { ReportButton } from "@/components/ReportButton";
import { SimilarCreators } from "@/components/SimilarCreators";
import { recordView } from "@/lib/viewHistory";

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
  // Real signed media URLs for unlocked content, keyed by contentId
  const [accessUrls, setAccessUrls] = useState<Record<string, string>>({});
  const [revealing, setRevealing] = useState<Record<string, boolean>>({});

  // Fetch a short-lived signed URL for unlocked content. Retries briefly to
  // cover the gap between an optimistic unlock and the server writing the
  // ContentUnlock row. Falls back silently (tile shows the blurred preview).
  const revealContent = useCallback(async (contentId: string) => {
    if (accessUrls[contentId] || revealing[contentId]) return;
    setRevealing(prev => ({ ...prev, [contentId]: true }));
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const { accessUrl } = await contentApi.access(contentId);
        if (accessUrl) {
          setAccessUrls(prev => ({ ...prev, [contentId]: accessUrl }));
          break;
        }
      } catch {
        // 403 (unlock row not written yet) or API offline — wait and retry
        await new Promise(r => setTimeout(r, 700));
      }
    }
    setRevealing(prev => ({ ...prev, [contentId]: false }));
  }, [accessUrls, revealing]);

  // Persist heart/favourite to localStorage
  const FAV_KEY = "vl_favorites_v1";
  function loadFavs(): { id: string; username: string; displayName: string | null; avatarUrl: string | null; isLive: boolean }[] {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]"); } catch { return []; }
  }
  const [liked, setLiked] = useState(() => loadFavs().some(f => f.id === id));

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    recordView(id); // remember for "For You" + similar recommendations

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    profilesApi.get(id)
      .then(async data => {
        setCreator(data);
        // Fetch real content for this creator
        try {
          const items = await contentApi.getForCreator(data.userId);
          setContentItems(
            items.map(item => ({
              id: item.id,
              title: item.title,
              type: item.type.toLowerCase(),   // API returns PHOTO/VIDEO → normalize to lowercase
              thumbnailUrl: item.thumbnailUrl
                ?? `https://picsum.photos/seed/${item.id}/400/300`,
              creditCost: item.creditCost,
            }))
          );
        } catch {
          // Content fetch failed (API offline) — leave empty, no placeholder
          setContentItems([]);
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        // API unavailable — look for matching mock profile
        const mock = MOCK_PROFILES.find(p => p.id === id || p.username === id);
        if (mock) {
          setCreator({
            id: mock.id,
            userId: mock.id,
            isLive: mock.isLive ?? false,
            isApproved: true,
            isAiPersona: true,   // all demo/mock profiles are AI companions
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
      .finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [id]);

  // Auto-reveal real media for content the user has already unlocked
  useEffect(() => {
    if (!isLoggedIn || contentItems.length === 0) return;
    contentItems.forEach(item => {
      if (unlockedContent.has(item.id)) revealContent(item.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentItems, isLoggedIn]);

  const handleLike = () => {
    const adding = !liked;
    setLiked(adding);
    const favs = loadFavs().filter(f => f.id !== id);
    if (adding && creator) {
      favs.push({
        id: creator.id,
        username: creator.user.username,
        displayName: creator.user.profile?.displayName ?? null,
        avatarUrl: creator.user.profile?.avatarUrl ?? null,
        isLive: creator.isLive,
      });
    }
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    showToast({
      title: adding ? "Added to favourites" : "Removed from favourites",
      description: adding ? `You liked ${creator?.user?.profile?.displayName ?? creator?.user?.username ?? "this creator"}` : "",
    });
  };

  const handleShare = () => {
    // Share a clean username URL, not the internal id
    const handle = creator?.user?.username;
    const url = handle ? `${window.location.origin}/profile/${handle}` : window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showToast({ title: "Link copied!", description: "Profile link copied to clipboard." });
      }).catch(() => {
        showToast({ title: "Share", description: url });
      });
    } else {
      showToast({ title: "Share", description: url });
    }
  };

  const handleMessage = async () => {
    if (!isLoggedIn) {
      setLocation("/login");
      return;
    }
    if (!creator) return;
    setMessaging(true);
    try {
      // Race API call against 3s timeout — avoids hanging when backend is offline
      const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000));
      await Promise.race([messagesApi.getOrCreate(creator.userId), timeout]);
    } catch {
      // Any error (network, HTTP 502/503, timeout) → demo mode: go to messages with context
    } finally {
      setMessaging(false);
    }
    const dn = p?.displayName ?? creator.user.username;
    setLocation(
      `/messages?with=${encodeURIComponent(creator.userId)}&username=${encodeURIComponent(creator.user.username)}&name=${encodeURIComponent(dn)}`
    );
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
              {creator.isAiPersona && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                  style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.35)", color: "#a78bfa" }}
                  title="This is an AI companion — always available to chat">
                  <Bot className="w-3 h-3" /> AI Companion
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              @{creator.user.username}{location ? ` · ${location}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className="p-2 rounded-lg transition-all hover:bg-white/5"
              style={{ border: `1px solid ${liked ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}` }}>
              <Heart className="w-4 h-4" style={{ color: liked ? "#f87171" : "rgba(255,255,255,0.5)", fill: liked ? "#f87171" : "none" }} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-lg transition-all hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <Share2 className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
            <ReportButton
              reportedUserId={creator.userId}
              contentType="profile"
              variant="icon"
              className="p-2 rounded-lg transition-all hover:bg-white/5"
            />
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
            {contentItems.length === 0 ? (
              <div className="vl-card p-10 text-center">
                <Lock className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
                <p className="text-sm font-medium text-white mb-1">No content yet</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  This creator hasn't uploaded any exclusive content.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {contentItems.map(item => {
                  const isUnlocked = unlockedContent.has(item.id);
                  const realUrl = accessUrls[item.id];
                  const isRevealing = revealing[item.id];
                  const handleUnlock = () => {
                    if (isUnlocked) return;
                    const ok = unlockContent(
                      item.id,
                      item.creditCost,
                      undefined,
                      creator?.userId,
                      item.type === "video" ? "VIDEO" : "PHOTO",
                    );
                    if (ok) revealContent(item.id);   // fetch the real signed URL
                  };
                  return (
                    <div key={item.id} className="vl-card overflow-hidden group"
                      onClick={handleUnlock}
                      style={{ cursor: isUnlocked ? "default" : "pointer" }}>
                      <div className="relative h-28 overflow-hidden">
                        {/* Unlocked + real media available */}
                        {isUnlocked && realUrl ? (
                          item.type === "video" ? (
                            <video src={realUrl} controls playsInline
                              className="w-full h-full object-cover bg-black" />
                          ) : (
                            <img src={realUrl} alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          )
                        ) : (
                          <>
                            {/* Locked, or unlocked-but-still-fetching → blurred public preview.
                                On hover the blur + overlay ease back to "peek" at the content. */}
                            <img
                              src={item.thumbnailUrl ?? `https://picsum.photos/seed/${item.id}/400/300`}
                              alt={item.title}
                              className="w-full h-full object-cover transition-all duration-300 scale-105 group-hover:scale-110 blur-sm group-hover:blur-[2px]"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center transition-colors duration-300 bg-[rgba(9,9,26,0.55)] group-hover:bg-[rgba(9,9,26,0.3)]">
                              {isUnlocked && isRevealing ? (
                                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#14b8a6" }} />
                              ) : (
                                <>
                                  <Lock className="w-5 h-5 mb-1 transition-transform duration-300 group-hover:scale-110" style={{ color: "#14b8a6" }} />
                                  <span className="text-xs font-bold" style={{ color: "#14b8a6" }}>{item.creditCost} credits</span>
                                  <span className="text-xs font-semibold group-hover:hidden" style={{ color: "rgba(255,255,255,0.5)" }}>Tap to unlock</span>
                                  <span className="text-xs font-semibold hidden group-hover:inline" style={{ color: "#5eead4" }}>👀 Unlock to reveal</span>
                                </>
                              )}
                            </div>
                          </>
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
            )}
          </div>
        </div>
      </div>

      <SimilarCreators
        currentId={creator.userId}
        gender={MOCK_PROFILES.find(p => p.id === creator.userId || p.username === creator.user.username)?.gender}
      />
    </div>
  );
}
