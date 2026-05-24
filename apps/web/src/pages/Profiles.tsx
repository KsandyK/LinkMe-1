import { useState } from "react";
import { Link } from "wouter";
import { MOCK_PROFILES } from "@/lib/mock-data";
import { Search, Radio } from "lucide-react";

type Filter = "all" | "live";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live Only" },
];

function ProfileCard({ profile }: { profile: typeof MOCK_PROFILES[0] }) {
  return (
    <Link href={`/profile/${profile.id}`}>
      <div className="vl-card overflow-hidden cursor-pointer group">
        <div className="relative h-36 overflow-hidden">
          <img src={profile.coverUrl} alt={profile.displayName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(9,9,26,0.85) 0%, transparent 60%)" }} />
          {profile.isLive && (
            <div className="absolute top-2 left-2 vl-badge-live flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
              LIVE
            </div>
          )}
          <img src={profile.avatarUrl} alt={profile.displayName}
            className="absolute bottom-0 translate-y-1/2 left-3 w-12 h-12 rounded-full border-2 object-cover z-10"
            style={{ borderColor: "#14b8a6" }} />
        </div>
        <div className="p-3 pt-8">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-bold text-sm text-white">{profile.displayName}</h3>
            <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>{profile.age}</span>
          </div>
          <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>📍 {profile.location}</p>
          <p className="text-xs line-clamp-2 mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>{profile.tagline}</p>
          <div className="flex gap-1 flex-wrap mb-3">
            {profile.badges.slice(0, 2).map(badge => (
              <span key={badge.id} className="text-xs px-2 py-0.5 rounded-full" style={{ border: "1px solid rgba(255,255,255,0.08)", color: badge.color, fontSize: "0.65rem" }}>
                {badge.icon} {badge.name}
              </span>
            ))}
          </div>
          <div className="rounded-lg py-2 text-center text-xs font-bold text-white transition-all duration-200"
            style={{ background: profile.isLive ? "#ef4444" : "linear-gradient(135deg, #14b8a6, #0d9488)" }}>
            {profile.isLive ? "● Live" : "View"}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Profiles() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = MOCK_PROFILES.filter(p => {
    const matchSearch = !search || p.displayName.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "live" ? p.isLive : true;
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-white mb-1">Browse Creators</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Discover {MOCK_PROFILES.length}+ verified adult creators</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
          <input
            type="text"
            placeholder="Search creators..."
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

        <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>Showing {filtered.length} creators</p>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(profile => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20" style={{ color: "rgba(255,255,255,0.3)" }}>
            <p className="text-lg font-medium mb-2">No creators found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
