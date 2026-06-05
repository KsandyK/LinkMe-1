import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { profiles as profilesApi, CreatorProfileItem } from "@/lib/api";
import { MOCK_PROFILES } from "@/lib/mock-data";
import { Search, Radio, Loader2, ArrowUpDown, ChevronDown } from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    q:        p.get("q") ?? "",
    category: (p.get("category") ?? "all") as Category,
    sort:     (p.get("sort") ?? "popular") as SortOption,
    live:     p.get("live") === "true",
  };
}

function pushParams(q: string, category: Category, sort: SortOption, live: boolean) {
  const p = new URLSearchParams();
  if (q)                 p.set("q", q);
  if (category !== "all") p.set("category", category);
  if (sort !== "popular") p.set("sort", sort);
  if (live)              p.set("live", "true");
  const qs = p.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}

// Assign a demo category to each mock profile based on their interests
const CREATOR_CATEGORIES: Record<string, Category> = {
  "profile-1":  "dating",
  "profile-2":  "entertainment",
  "profile-3":  "chat",
  "profile-4":  "entertainment",
  "profile-5":  "dating",
  "profile-6":  "dating",
  "profile-7":  "chat",
  "profile-8":  "entertainment",
  "profile-9":  "chat",
  "profile-10": "entertainment",
};

// Map mock profiles to CreatorProfileItem shape for fallback display
const MOCK_CREATORS: (CreatorProfileItem & { _joinedDate: string; _totalEarnings: number; _category: Category })[] =
  MOCK_PROFILES.map(p => ({
    id:               p.id,
    userId:           p.id,
    isLive:           p.isLive ?? false,
    isApproved:       true,
    subscriberCount:  p.followersCount ?? 0,
    totalEarnings:    p.totalEarnings ?? 0,
    monthlyEarnings:  0,
    bio:              p.bio ?? null,
    subscriptionPrice: 0,
    _joinedDate:      p.joinedDate ?? "2024-01-01",
    _totalEarnings:   p.totalEarnings ?? 0,
    _category:        CREATOR_CATEGORIES[p.id] ?? "chat",
    user: {
      id:       p.id,
      username: p.username,
      profile: {
        displayName: p.displayName,
        avatarUrl:   p.avatarUrl,
        coverUrl:    p.coverUrl,
        location:    p.location,
        isVerified:  false,
      },
    },
  }));

// ── Types ─────────────────────────────────────────────────────────────────────

type Category   = "all" | "dating" | "entertainment" | "chat" | "gaming" | "fitness" | "music" | "lifestyle";
type SortOption = "popular" | "newest" | "top-rated";
type LiveFilter = boolean;

const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: "all",           label: "All",           emoji: "✦" },
  { id: "dating",        label: "Dating",        emoji: "💋" },
  { id: "entertainment", label: "Entertainment", emoji: "🎭" },
  { id: "chat",          label: "Chat",          emoji: "💬" },
  { id: "gaming",        label: "Gaming",        emoji: "🎮" },
  { id: "fitness",       label: "Fitness",       emoji: "💪" },
  { id: "music",         label: "Music",         emoji: "🎵" },
  { id: "lifestyle",     label: "Lifestyle",     emoji: "✨" },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "popular",   label: "Most Popular" },
  { id: "newest",    label: "New Arrivals" },
  { id: "top-rated", label: "Top Earning" },
];

const PAGE_SIZE = 24;

// ── ProfileCard ───────────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Profiles() {
  const init = getParams();
  const [search,   setSearch]   = useState(init.q);
  const [debouncedSearch, setDebouncedSearch] = useState(init.q);
  const [category, setCategory] = useState<Category>(init.category);
  const [sort,     setSort]     = useState<SortOption>(init.sort);
  const [liveOnly, setLiveOnly] = useState<LiveFilter>(init.live);
  const [showSort, setShowSort] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const [creators,      setCreators]      = useState<CreatorProfileItem[]>([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [hasMore,       setHasMore]       = useState(false);
  const [loadingMore,   setLoadingMore]   = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Sync URL whenever filters change
  useEffect(() => {
    pushParams(debouncedSearch, category, sort, liveOnly);
  }, [debouncedSearch, category, sort, liveOnly]);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSort(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const load = useCallback(async (pageNum = 1, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    try {
      const data = await profilesApi.list({
        search:   debouncedSearch || undefined,
        category: category !== "all" ? category : undefined,
        live:     liveOnly ? "true" : undefined,
        sort:     sort === "top-rated" ? "top" : sort === "newest" ? "newest" : undefined,
        limit:    PAGE_SIZE,
        offset:   (pageNum - 1) * PAGE_SIZE,
      });
      const profiles = data.profiles ?? [];
      setCreators(prev => append ? [...prev, ...profiles] : profiles);
      setTotal(data.total);
      setHasMore((pageNum * PAGE_SIZE) < data.total);
      setUsingFallback(false);
    } catch {
      // API unavailable — filter & sort mock data client-side
      const q = debouncedSearch.toLowerCase();
      let results = MOCK_CREATORS as (CreatorProfileItem & { _joinedDate: string; _totalEarnings: number; _category: Category })[];

      if (q) {
        results = results.filter(c =>
          (c.user.profile?.displayName ?? c.user.username).toLowerCase().includes(q) ||
          (c.bio ?? "").toLowerCase().includes(q) ||
          (c.user.profile?.location ?? "").toLowerCase().includes(q)
        );
      }
      if (category !== "all") results = results.filter(c => c._category === category);
      if (liveOnly)           results = results.filter(c => c.isLive);

      if (sort === "popular")   results = [...results].sort((a, b) => b.subscriberCount - a.subscriberCount);
      if (sort === "newest")    results = [...results].sort((a, b) => b._joinedDate.localeCompare(a._joinedDate));
      if (sort === "top-rated") results = [...results].sort((a, b) => b._totalEarnings - a._totalEarnings);

      setCreators(results);
      setTotal(results.length);
      setHasMore(false);
      setUsingFallback(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, category, sort, liveOnly]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
    load(1, false);
  }, [load]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next, true);
  };

  const currentSortLabel = SORT_OPTIONS.find(s => s.id === sort)?.label ?? "Sort";

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
            placeholder="Search creators by name, bio, or location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", outline: "none" }}
          />
        </div>

        {/* Filters row */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          {/* Left: category + live chips — scrollable on mobile */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5"
                style={category === c.id
                  ? { background: "#14b8a6", color: "white" }
                  : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }
                }
              >
                <span className="text-xs">{c.emoji}</span>
                {c.label}
              </button>
            ))}
            <button
              onClick={() => setLiveOnly(!liveOnly)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={liveOnly
                ? { background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171" }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }
              }
            >
              <Radio className="w-3.5 h-3.5" />
              Live Only
            </button>
          </div>

          {/* Right: sort dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setShowSort(!showSort)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {currentSortLabel}
              <ChevronDown className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.35)", transform: showSort ? "rotate(180deg)" : undefined, transition: "transform 0.15s" }} />
            </button>
            {showSort && (
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl overflow-hidden z-30"
                style={{ background: "#0f1622", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 16px 32px rgba(0,0,0,0.5)" }}>
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setSort(opt.id); setShowSort(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm transition-all hover:bg-white/5"
                    style={{ color: sort === opt.id ? "#14b8a6" : "rgba(255,255,255,0.7)", fontWeight: sort === opt.id ? 700 : 400 }}
                  >
                    {opt.label}
                    {sort === opt.id && <span className="float-right">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#14b8a6" }} />
          </div>
        ) : (
          <>
            <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Showing {creators.length} creator{creators.length !== 1 ? "s" : ""}
              {category !== "all" && <span> in <span style={{ color: "#14b8a6" }}>{CATEGORIES.find(c => c.id === category)?.label}</span></span>}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {creators.map(creator => (
                <ProfileCard key={creator.id} creator={creator} />
              ))}
            </div>

            {creators.length === 0 && (
              <div className="text-center py-20" style={{ color: "rgba(255,255,255,0.3)" }}>
                <p className="text-lg font-medium mb-2">No creators found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
                {(category !== "all" || liveOnly || search) && (
                  <button
                    onClick={() => { setCategory("all"); setLiveOnly(false); setSearch(""); }}
                    className="mt-4 vl-btn-primary px-5 py-2 text-sm">
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.25)", color: "#14b8a6" }}>
                  {loadingMore
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>
                    : <>Load More Creators <ChevronDown className="w-4 h-4" /></>}
                </button>
              </div>
            )}
            {!hasMore && creators.length > 0 && !usingFallback && (
              <p className="text-center mt-8 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
                Showing all {total} creator{total !== 1 ? "s" : ""}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
