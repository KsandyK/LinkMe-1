import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { livefeeds as liveApi, LiveFeedItem } from "@/lib/api";
import { MOCK_LIVE_FEEDS } from "@/lib/mock-data";
import { Eye, Clock, Crown, Loader2, Star, Flame } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

// Mock featured streams (always pinned to simulate server-side featured ranking)
const FEATURED_STREAMS = [
  { id: "feat-1", title: "VIP Lounge Night 🔥",        host: "Aria Valencia", viewers: 3218, thumbnail: "https://picsum.photos/seed/feat1/640/360", boost: "Legend",  boostColor: "#f59e0b" },
  { id: "feat-2", title: "Midnight Chat Session ✨",    host: "Mia Rose",      viewers: 1847, thumbnail: "https://picsum.photos/seed/feat2/640/360", boost: "Inferno", boostColor: "#f97316" },
  { id: "feat-3", title: "Exclusive Q&A with Celeste", host: "Celeste Kim",   viewers: 1293, thumbnail: "https://picsum.photos/seed/feat3/640/360", boost: "Inferno", boostColor: "#f97316" },
];

// Map mock feeds to LiveFeedItem shape for fallback
const MOCK_FEED_ITEMS: LiveFeedItem[] = MOCK_LIVE_FEEDS.map(f => ({
  id: f.id,
  creatorId: f.hostId ?? f.id,
  title: f.title,
  category: f.category ?? null,
  isVip: f.isVip ?? false,
  viewerCount: f.viewerCount ?? 0,
  thumbnailUrl: f.thumbnailUrl ?? null,
  tags: f.tags ?? [],
  isLive: true,
  startedAt: f.startedAt ?? new Date().toISOString(),
  endedAt: null,
  creator: {
    id: f.hostId ?? f.id,
    userId: f.hostId ?? f.id,
    user: {
      id: f.hostId ?? f.id,
      username: f.hostName ?? "creator",
      profile: {
        displayName: f.hostName ?? null,
        avatarUrl: f.hostAvatarUrl ?? null,
      },
    },
  },
}));

type Category = "all" | "dating" | "entertainment" | "chat";

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "all", label: "All Streams" },
  { id: "dating", label: "Dating" },
  { id: "entertainment", label: "Entertainment" },
  { id: "chat", label: "Chat" },
];

function elapsed(isoStr: string) {
  const mins = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
  if (mins < 60) return `${mins}m live`;
  return `${Math.floor(mins / 60)}h live`;
}

export default function LiveFeeds() {
  const { activeBoost } = useApp();
  const hasFeaturedLive = activeBoost === "flame" || activeBoost === "inferno" || activeBoost === "legend";
  const [category, setCategory] = useState<Category>("all");
  const [feeds, setFeeds] = useState<LiveFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await liveApi.list({
        category: category !== "all" ? category : undefined,
        limit: 30,
      });
      setFeeds(Array.isArray(data) ? data : []);
      setUsingFallback(false);
    } catch {
      // API unavailable — use mock data, filter client-side
      const results = category === "all"
        ? MOCK_FEED_ITEMS
        : MOCK_FEED_ITEMS.filter(f => f.category === category);
      setFeeds(results);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const displayed = feeds;

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Live Now</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              {loading ? "Loading…" : `${displayed.length} creators streaming live`}
              {usingFallback && !loading && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(232,168,124,0.1)", border: "1px solid rgba(232,168,124,0.2)", color: "#e8a87c" }}>
                  Demo
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </div>
        </div>

        {/* ── Featured Streams ─────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4" style={{ color: "#f97316" }} />
              <h2 className="text-base font-bold text-white">Featured Streams</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "rgba(249,115,22,0.12)", color: "#f97316", border: "1px solid rgba(249,115,22,0.25)" }}>
                PROMOTED
              </span>
            </div>
            {hasFeaturedLive && (
              <span className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full"
                style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#f97316" }}>
                ✦ Your streams appear here
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FEATURED_STREAMS.map(fs => (
              <Link key={fs.id} href={`/live/${fs.id}`}>
                <div className="vl-card overflow-hidden cursor-pointer group relative">
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: "rgba(0,0,0,0.7)", border: `1px solid ${fs.boostColor}60`, color: fs.boostColor }}>
                    <Star className="w-3 h-3" />{fs.boost}
                  </div>
                  <div className="absolute top-2 right-2 z-10 vl-badge-live flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE
                  </div>
                  <div className="relative" style={{ aspectRatio: "16/9" }}>
                    <img src={fs.thumbnail} alt={fs.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(9,9,26,0.85) 0%, transparent 60%)" }} />
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                      style={{ background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.85)" }}>
                      <Eye className="w-3 h-3" />{fs.viewers.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-bold text-white line-clamp-1">{fs.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{fs.host}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {!hasFeaturedLive && (
            <p className="text-xs text-center mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
              Get a <Link href="/boosts"><span className="underline cursor-pointer" style={{ color: "#f97316" }}>Flame+ boost</span></Link> to feature your stream here
            </p>
          )}
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 mb-7 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={category === c.id
                ? { background: "#14b8a6", color: "white" }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }
              }
            >
              {c.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#14b8a6" }} />
          </div>
        ) : (
          <>
            {/* Streams grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayed.map(feed => {
                const hostProfile = feed.creator?.user?.profile;
                const hostName = hostProfile?.displayName ?? feed.creator?.user?.username ?? "Creator";
                const hostAvatar = hostProfile?.avatarUrl
                  ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${feed.creator?.user?.username ?? feed.id}`;
                const thumbnail = feed.thumbnailUrl
                  ?? `https://picsum.photos/seed/${feed.id}-thumb/640/360`;

                return (
                  <Link key={feed.id} href={`/live/${feed.id}`}>
                    <div className="vl-card overflow-hidden cursor-pointer group">
                      {/* Thumbnail */}
                      <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                        <img
                          src={thumbnail}
                          alt={feed.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(9,9,26,0.8) 0%, transparent 60%)" }} />

                        {/* LIVE badge */}
                        <div className="absolute top-2.5 left-2.5 vl-badge-live flex items-center gap-1.5 text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          LIVE
                        </div>

                        {/* VIP badge */}
                        {feed.isVip && (
                          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold"
                            style={{ background: "rgba(139,92,246,0.9)", color: "white" }}>
                            <Crown className="w-3 h-3" />
                            VIP
                          </div>
                        )}

                        {/* Viewer count */}
                        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
                          style={{ background: "rgba(0,0,0,0.65)", color: "rgba(255,255,255,0.9)" }}>
                          <Eye className="w-3 h-3" />
                          {feed.viewerCount.toLocaleString()}
                        </div>

                        {/* Host avatar */}
                        <img
                          src={hostAvatar}
                          alt={hostName}
                          className="absolute bottom-0 translate-y-1/2 left-3 w-10 h-10 rounded-full border-2 object-cover z-10"
                          style={{ borderColor: "#14b8a6" }}
                        />
                      </div>

                      {/* Info */}
                      <div className="p-3 pt-7">
                        <p className="text-xs font-semibold text-white truncate mb-0.5">{feed.title}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{hostName}</span>
                          <div className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                            <Clock className="w-3 h-3" />
                            {elapsed(feed.startedAt)}
                          </div>
                        </div>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {feed.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs px-2 py-0.5 rounded-full capitalize"
                              style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {displayed.length === 0 && (
              <div className="text-center py-20" style={{ color: "rgba(255,255,255,0.3)" }}>
                <p className="text-lg font-medium mb-2">No live streams right now</p>
                <p className="text-sm">Check back later or try a different filter</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
