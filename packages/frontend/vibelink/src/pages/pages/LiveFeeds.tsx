/**
 * VIBELINK — Live Feeds Page
 * Velvet Dark Design System
 */
import { Link } from "wouter";
import { MOCK_LIVE_FEEDS, MOCK_PROFILES } from "@/lib/mock-data";
import { Radio, Eye, Users } from "lucide-react";

export default function LiveFeeds() {
  const totalViewers = MOCK_LIVE_FEEDS.reduce((a, f) => a + f.viewerCount, 0);

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 700, color: "white" }}>Live Now</h1>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}>
            <Users className="w-3 h-3" /> {totalViewers.toLocaleString()} watching
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MOCK_LIVE_FEEDS.map((feed, i) => {
            const profile = MOCK_PROFILES.find(p => p.id === feed.creatorId);
            return (
              <Link key={feed.id} href={`/live/${feed.id}`}>
                <div className="vl-card overflow-hidden cursor-pointer group animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="relative">
                    <img src={feed.thumbnailUrl} alt={feed.title} className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(9,9,26,0.85) 0%, transparent 50%)" }} />
                    <div className="absolute top-2 left-2 vl-badge-live flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                      LIVE
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded px-2 py-0.5 text-xs" style={{ background: "rgba(0,0,0,0.65)", color: "rgba(255,255,255,0.85)" }}>
                      <Eye className="w-3 h-3" /> {feed.viewerCount.toLocaleString()}
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-sm font-bold line-clamp-1">{feed.title}</p>
                      {profile && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <img src={profile.avatarUrl} alt={profile.displayName} className="w-5 h-5 rounded-full" />
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>{profile.displayName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-3 py-2.5 flex items-center justify-between">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(20,184,166,0.1)", color: "#14b8a6", border: "1px solid rgba(20,184,166,0.2)" }}>{feed.category}</span>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Started {feed.duration}m ago</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {MOCK_LIVE_FEEDS.length === 0 && (
          <div className="text-center py-16">
            <Radio className="w-12 h-12 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-white font-semibold">No live streams right now</p>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Check back soon or browse creator profiles</p>
          </div>
        )}
      </div>
    </div>
  );
}
