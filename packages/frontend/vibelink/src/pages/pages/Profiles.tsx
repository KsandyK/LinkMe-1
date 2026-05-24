/**
 * VIBELINK — Profiles / Browse Creators Page
 * Velvet Dark Design System
 */
import { useState } from "react";
import { Link } from "wouter";
import { MOCK_PROFILES } from "@/lib/mock-data";
import { Search, Filter, Users, Radio } from "lucide-react";

const GENDERS = ["All", "Female", "Male", "Non-binary"];
const SORT_OPTIONS = ["Popular", "Live Now", "New", "Rating"];

export default function Profiles() {
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("All");
  const [sort, setSort] = useState("Popular");
  const [showLiveOnly, setShowLiveOnly] = useState(false);

  const filtered = MOCK_PROFILES.filter(p => {
    if (showLiveOnly && !p.isLive) return false;
    if (gender !== "All" && p.gender !== gender) return false;
    if (search && !p.displayName.toLowerCase().includes(search.toLowerCase()) && !p.tagline.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        {/* Header */}
        <div className="mb-6">
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 700, color: "white" }}>Browse Creators</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>Discover {MOCK_PROFILES.length}+ verified adult creators</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input type="text" placeholder="Search creators..." value={search} onChange={e => setSearch(e.target.value)}
              className="vl-input pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {GENDERS.map(g => (
              <button key={g} onClick={() => setGender(g)}
                className="px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                style={{
                  background: gender === g ? "rgba(20,184,166,0.15)" : "rgba(255,255,255,0.04)",
                  border: gender === g ? "1px solid rgba(20,184,166,0.35)" : "1px solid rgba(255,255,255,0.08)",
                  color: gender === g ? "#14b8a6" : "rgba(255,255,255,0.5)",
                }}
              >{g}</button>
            ))}
            <button onClick={() => setShowLiveOnly(!showLiveOnly)}
              className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200"
              style={{
                background: showLiveOnly ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)",
                border: showLiveOnly ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(255,255,255,0.08)",
                color: showLiveOnly ? "#fca5a5" : "rgba(255,255,255,0.5)",
              }}
            >
              <Radio className="w-3.5 h-3.5" /> Live Only
            </button>
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
          Showing {filtered.length} creator{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-white font-semibold">No creators found</p>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {filtered.map((profile, i) => (
              <Link key={profile.id} href={`/profile/${profile.id}`}>
                <div className="vl-card overflow-hidden cursor-pointer group animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="relative h-28">
                    <img src={profile.coverUrl} alt={profile.displayName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(9,9,26,0.9) 0%, transparent 60%)" }} />
                    <img src={profile.avatarUrl} alt={profile.displayName}
                      className="absolute bottom-2 left-2 w-10 h-10 rounded-full border-2 object-cover"
                      style={{ borderColor: "#14b8a6" }} />
                    {profile.isLive && (
                      <div className="absolute top-2 right-2 vl-badge-live flex items-center gap-1" style={{ fontSize: "0.55rem" }}>
                        <span className="w-1 h-1 rounded-full bg-white inline-block" />
                        LIVE
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-bold text-xs text-white truncate">{profile.displayName}</h3>
                      <span className="text-xs ml-1 flex-shrink-0" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono', monospace" }}>{profile.age}</span>
                    </div>
                    <p className="text-xs truncate mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>📍 {profile.location}</p>
                    <div className="rounded-lg py-1.5 text-center text-xs font-bold text-white"
                      style={{ background: profile.isLive ? "#ef4444" : "linear-gradient(135deg, #14b8a6, #0d9488)" }}>
                      {profile.isLive ? "🔴 Live" : "View"}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
