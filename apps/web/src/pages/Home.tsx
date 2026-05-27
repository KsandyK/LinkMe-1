import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { profiles as profilesApi, livefeeds as liveApi, CreatorProfileItem, LiveFeedItem } from "@/lib/api";
import { MOCK_PROFILES, MOCK_LIVE_FEEDS } from "@/lib/mock-data";
import { Radio, Zap, Shield, Crown, ChevronRight, Eye, Star } from "lucide-react";

const HERO_BG = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&w=1920&q=80";

function CreatorCard({ creator }: { creator: CreatorProfileItem }) {
  const p = creator.user.profile;
  const displayName = p?.displayName ?? creator.user.username;
  const avatarUrl = p?.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.user.username}`;
  const coverUrl = p?.coverUrl ?? `https://picsum.photos/seed/${creator.user.username}-cover/600/200`;
  const location = p?.location ?? "";

  return (
    <Link href={`/profile/${creator.userId}`}>
      <div className="vl-card overflow-hidden cursor-pointer group">
        <div className="relative h-36 overflow-hidden">
          <img src={coverUrl} alt={displayName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(9,9,26,0.85) 0%, transparent 60%)" }} />
          {creator.isLive && (
            <div className="absolute top-2 left-2 vl-badge-live flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
              LIVE
            </div>
          )}
          <img src={avatarUrl} alt={displayName}
            className="absolute bottom-0 translate-y-1/2 left-3 w-12 h-12 rounded-full border-2 object-cover z-10"
            style={{ borderColor: "#14b8a6" }} />
        </div>
        <div className="p-3 pt-8">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-bold text-sm text-white">{displayName}</h3>
            {p?.isVerified && <span className="text-xs" style={{ color: "#14b8a6" }}>✓</span>}
          </div>
          {location && <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>📍 {location}</p>}
          {creator.bio && <p className="text-xs line-clamp-2 mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>{creator.bio}</p>}
          <div className="rounded-lg py-2 text-center text-xs font-bold text-white transition-all duration-200"
            style={{ background: creator.isLive ? "#ef4444" : "linear-gradient(135deg, #14b8a6, #0d9488)" }}>
            {creator.isLive ? "● Join Live" : "View Profile"}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Mock promoted creator data (simulates server-side featured ranking)
const PROMOTED_CREATORS = [
  { id: "promo-1", name: "Aria Valencia", username: "aria_v", location: "Los Angeles, CA", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ariavalencia", cover: "https://picsum.photos/seed/ariacov/600/200", boost: "Inferno", color: "#f97316" },
  { id: "promo-2", name: "Mia Rose",      username: "mia.rose",   location: "Miami, FL",       avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=miarose",      cover: "https://picsum.photos/seed/miacov/600/200",  boost: "Legend",  color: "#f59e0b" },
  { id: "promo-3", name: "Celeste Kim",   username: "celestek",   location: "New York, NY",    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=celestekim",   cover: "https://picsum.photos/seed/celestecov/600/200", boost: "Inferno", color: "#f97316" },
];

export default function Home() {
  const { ageVerificationStatus, activeBoost } = useApp();
  const hasFeaturedSpot = activeBoost === "inferno" || activeBoost === "legend";
  const [liveFeeds, setLiveFeeds] = useState<LiveFeedItem[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<CreatorProfileItem[]>([]);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    // Load live feeds and featured creators in parallel
    liveApi.list({ limit: 4 })
      .then(data => {
        const feeds = Array.isArray(data) ? data : [];
        setLiveFeeds(feeds);
        setLiveCount(feeds.length);
      })
      .catch(() => {
        // Mock fallback
        const mockFeeds: LiveFeedItem[] = MOCK_LIVE_FEEDS.slice(0, 4).map(f => ({
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
              profile: { displayName: f.hostName ?? null, avatarUrl: f.hostAvatarUrl ?? null },
            },
          },
        }));
        setLiveFeeds(mockFeeds);
        setLiveCount(mockFeeds.length);
      });

    profilesApi.list({ limit: 6 })
      .then(data => setFeaturedCreators(data.profiles ?? []))
      .catch(() => {
        // Mock fallback
        const mockCreators: CreatorProfileItem[] = MOCK_PROFILES.slice(0, 6).map(p => ({
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
        setFeaturedCreators(mockCreators);
      });
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: "420px" }}>
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="LINKME" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(9,9,26,0.92) 0%, rgba(9,9,26,0.6) 50%, rgba(9,9,26,0.85) 100%)" }} />
        </div>
        <div className="relative z-10 container py-14 md:py-20">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6", letterSpacing: "0.08em" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
              {liveCount > 0 ? `${liveCount} CREATORS LIVE NOW` : "LIVE STREAMING NOW"}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Connect. <span style={{ color: "#14b8a6" }}>Live.</span> Vibe.
            </h1>
            <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
              The premium hybrid dating and live interaction platform. Discover genuine connections with creators who match your vibe.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/profiles">
                <button className="vl-btn-primary px-6 py-2.5 text-sm">Browse Profiles</button>
              </Link>
              <Link href="/live">
                <button className="px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-200"
                  style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                  <Radio className="w-4 h-4" /> Watch Live
                </button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-8 mt-7">
              {[
                { label: "Active Creators", value: "2,400+" },
                { label: "Live Right Now", value: liveCount > 0 ? liveCount.toString() : "—" },
                { label: "Members", value: "180K+" },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-xl font-bold font-mono" style={{ color: "#14b8a6" }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Age Verification Banner */}
      {ageVerificationStatus !== "verified" && (
        <div className="py-3" style={{ borderBottom: "1px solid rgba(234,179,8,0.18)" }}>
          <div className="container flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 flex-shrink-0" style={{ color: "#fbbf24" }} />
              <div>
                <span className="text-sm font-semibold" style={{ color: "#14b8a6" }}>Complete Age Verification for Full Access</span>
                <span className="text-xs ml-2 hidden sm:inline" style={{ color: "rgba(251,191,36,0.5)" }}>Verify your age to unlock all creator content and platform features.</span>
              </div>
            </div>
            <Link href="/verify-age">
              <button className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)", color: "#fbbf24" }}>
                Verify Now <ChevronRight className="w-3 h-3 inline" />
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Live Now */}
      {liveFeeds.length > 0 && (
        <section className="py-10">
          <div className="container">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h2 className="vl-section-title">Live Now</h2>
              </div>
              <Link href="/live">
                <span className="text-sm font-semibold cursor-pointer" style={{ color: "#14b8a6" }}>View All <ChevronRight className="w-3.5 h-3.5 inline" /></span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {liveFeeds.map(feed => {
                const hostProfile = feed.creator?.user?.profile;
                const hostName = hostProfile?.displayName ?? feed.creator?.user?.username ?? "Creator";
                const thumbnail = feed.thumbnailUrl ?? `https://picsum.photos/seed/${feed.id}-thumb/400/300`;
                return (
                  <Link key={feed.id} href={`/live/${feed.id}`}>
                    <div className="vl-card overflow-hidden cursor-pointer group">
                      <div className="relative">
                        <img src={thumbnail} alt={feed.title} className="w-full h-36 object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(9,9,26,0.8) 0%, transparent 60%)" }} />
                        <div className="absolute top-2 left-2 vl-badge-live flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                          LIVE
                        </div>
                        <div className="absolute top-2 right-2 flex items-center gap-1 rounded px-2 py-0.5 text-xs" style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.8)" }}>
                          <Eye className="w-3 h-3" /> {feed.viewerCount.toLocaleString()}
                        </div>
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-xs font-semibold line-clamp-1">{feed.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{hostName}</p>
                        </div>
                      </div>
                      <div className="px-3 py-2">
                        {feed.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: "rgba(20,184,166,0.1)", color: "#14b8a6", border: "1px solid rgba(20,184,166,0.2)" }}>
                            {feed.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Promoted Creators (Homepage Featured Spot) ── */}
      <section className="py-10">
        <div className="container">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" style={{ color: "#f59e0b" }} />
              <h2 className="vl-section-title" style={{ color: "#f59e0b" }}>Featured Creators</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "rgba(249,115,22,0.12)", color: "#f97316", border: "1px solid rgba(249,115,22,0.25)" }}>
                PROMOTED
              </span>
            </div>
            {hasFeaturedSpot && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#f97316" }}>
                ✦ Your profile is featured here
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PROMOTED_CREATORS.map(p => (
              <Link key={p.id} href={`/profile/${p.id}`}>
                <div className="vl-card overflow-hidden cursor-pointer group relative">
                  {/* Featured badge */}
                  <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"
                    style={{ background: p.color, color: "#fff" }}>
                    <Star className="w-3 h-3" />{p.boost}
                  </div>
                  <div className="relative h-32 overflow-hidden">
                    <img src={p.cover} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(9,9,26,0.85) 0%, transparent 60%)" }} />
                    <img src={p.avatar} alt={p.name}
                      className="absolute bottom-0 translate-y-1/2 left-3 w-12 h-12 rounded-full border-2 object-cover z-10"
                      style={{ borderColor: p.color }} />
                  </div>
                  <div className="p-3 pt-8">
                    <h3 className="font-bold text-sm text-white">{p.name}</h3>
                    {p.location && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>📍 {p.location}</p>}
                    <div className="mt-2 rounded-lg py-1.5 text-center text-xs font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${p.color}cc, ${p.color}88)` }}>
                      View Profile
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {!hasFeaturedSpot && (
            <p className="text-xs text-center mt-3" style={{ color: "rgba(255,255,255,0.2)" }}>
              Get an <Link href="/boosts"><span className="underline cursor-pointer" style={{ color: "#f97316" }}>Inferno or Legend boost</span></Link> to feature your profile here
            </p>
          )}
        </div>
      </section>

      {/* Featured Creators */}
      <section className="py-10">
        <div className="container">
          <div className="flex items-center justify-between mb-5">
            <h2 className="vl-section-title">Featured Creators</h2>
            <Link href="/profiles">
              <span className="text-sm font-semibold cursor-pointer" style={{ color: "#14b8a6" }}>Browse All <ChevronRight className="w-3.5 h-3.5 inline" /></span>
            </Link>
          </div>
          {featuredCreators.length === 0 ? (
            <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.3)" }}>
              <p className="text-lg font-medium mb-2">No creators yet</p>
              <p className="text-sm mb-4">Be the first to join as a creator!</p>
              <Link href="/become-creator">
                <button className="vl-btn-primary px-6 py-2.5 text-sm">Apply as Creator</button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredCreators.map(creator => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why LinkMe */}
      <section className="py-12">
        <div className="container">
          <h2 className="vl-section-title text-center mb-8">Why LinkMe</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Shield, title: "Verified Creators", desc: "Every creator is age-verified and identity-confirmed before going live.", color: "#14b8a6" },
              { icon: Zap, title: "Real-Time Interaction", desc: "Send gifts, unlock content, and interact with creators in real time.", color: "#e8a87c" },
              { icon: Crown, title: "VIP Access", desc: "Exclusive VIP lounge with premium content and priority access.", color: "#a78bfa" },
              { icon: Radio, title: "HD Live Streams", desc: "Crystal-clear live streams with low latency for the best experience.", color: "#f97316" },
            ].map(f => (
              <div key={f.title} className="vl-card p-5 text-center">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${f.color}15`, border: `1px solid ${f.color}25` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-sm text-white mb-1.5">{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14">
        <div className="container max-w-lg mx-auto text-center">
          <h2 className="vl-section-title text-2xl mb-3">Ready to Join?</h2>
          <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.5)" }}>
            Create your free account and start connecting with premium creators today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <button className="vl-btn-primary px-8 py-2.5 text-sm">Create Free Account</button>
            </Link>
            <Link href="/become-creator">
              <button className="px-8 py-2.5 rounded-xl font-bold text-sm transition-all"
                style={{ background: "rgba(232,168,124,0.08)", border: "1px solid rgba(232,168,124,0.22)", color: "#e8a87c" }}>
                Become a Creator
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
