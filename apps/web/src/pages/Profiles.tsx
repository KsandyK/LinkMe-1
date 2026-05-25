import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { profiles as profilesApi, CreatorProfileItem } from "@/lib/api";
import { MOCK_PROFILES } from "@/lib/mock-data";
import { Search, Radio, Loader2 } from "lucide-react";

// Map mock profiles to CreatorProfileItem shape for fallback display
const MOCK_CREATORS: CreatorProfileItem[] = MOCK_PROFILES.map(p => ({
  id: p.id,
  userId: p.id,
  isLive: p.isLive ?? false,
  isApproved: true,
  subscriberCount: p.followersCount ?? 0,
  totalEarnings: 0,
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

type Filter = "all" | "live";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live Only" },
];

function ProfileCard({ creator }: { creator: CreatorProfileItem }) {
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
            {p?.isVerified && (
              <span className="text-xs" style={{ color: "#14b8a6" }}>✓</span>
            )}
          </div>
          {location && (
            <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>📍 {location}</p>
          )}
          {creator.bio && (
            <p className="text-xs line-clamp-2 mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>{creator.bio}</p>
          )}
          <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            {creator.subscriberCount.toLocaleString()} subscribers
          </p>
          <div className="rounded-lg py-2 text-center text-xs font-bold text-white transition-all duration-200"
            style={{ background: creator.isLive ? "#ef4444" : "linear-gradient(135deg, #14b8a6, #0d9488)" }}>
            {creator.isLive ? "● Live" : "View"}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Profiles() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [creators, setCreators] = useState<CreatorProfileItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await profilesApi.list({
        search: debouncedSearch || undefined,
        live: filter === "live" ? "true" : undefined,
        limit: 40,
      });
      setCreators(data.profiles);
      setTotal(data.total);
      setUsingFallback(false);
    } catch {
      // API unavailable — filter mock data client-side
      const q = debouncedSearch.toLowerCase();
      let results = MOCK_CREATORS;
      if (q) results = results.filter(c =>
        (c.user.profile?.displayName ?? c.user.username).toLowerCase().includes(q) ||
        (c.user.profile?.location ?? "").toLowerCase().includes(q)
      );
      if (filter === "live") results = results.filter(c => c.isLive);
      setCreators(results);
      setTotal(results.length);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-white mb-1">Browse Creators</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            {loading ? "Loading…" : `Discover ${total}+ verified adult creators`}
            {usingFallback && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(232,168,124,0.1)", border: "1px solid rgba(232,168,124,0.2)", color: "#e8a87c" }}>
                Demo
              </span>
            )}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
          <input
            type="text"
            placeholder="Search creators…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", outline: "none" }}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={filter === f.id
                ? { background: "#14b8a6", color: "white" }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }
              }
            >
              {f.id === "live" && <Radio className="w-3.5 h-3.5" />}
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#14b8a6" }} />
          </div>
        ) : (
          <>
            <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>Showing {creators.length} creators</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {creators.map(creator => (
                <ProfileCard key={creator.id} creator={creator} />
              ))}
            </div>
            {creators.length === 0 && (
              <div className="text-center py-20" style={{ color: "rgba(255,255,255,0.3)" }}>
                <p className="text-lg font-medium mb-2">No creators found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
