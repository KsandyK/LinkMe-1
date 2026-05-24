import { useState } from "react";
import { Link } from "wouter";
import { MOCK_LIVE_FEEDS } from "@/lib/mock-data";
import { Eye, Clock, Crown } from "lucide-react";

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
  const [category, setCategory] = useState<Category>("all");

  const filtered = MOCK_LIVE_FEEDS.filter(
    f => category === "all" || f.category === category
  );

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Live Now</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              {MOCK_LIVE_FEEDS.length} creators streaming live
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </div>
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

        {/* Streams grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(feed => (
            <Link key={feed.id} href={`/live/${feed.id}`}>
              <div className="vl-card overflow-hidden cursor-pointer group">
                {/* Thumbnail */}
                <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <img
                    src={feed.thumbnailUrl}
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
                    src={feed.hostAvatarUrl}
                    alt={feed.hostName}
                    className="absolute bottom-0 translate-y-1/2 left-3 w-10 h-10 rounded-full border-2 object-cover z-10"
                    style={{ borderColor: "#14b8a6" }}
                  />
                </div>

                {/* Info */}
                <div className="p-3 pt-7">
                  <p className="text-xs font-semibold text-white truncate mb-0.5">{feed.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{feed.hostName}</span>
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
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20" style={{ color: "rgba(255,255,255,0.3)" }}>
            <p className="text-lg font-medium mb-2">No live streams in this category</p>
            <p className="text-sm">Try a different filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
