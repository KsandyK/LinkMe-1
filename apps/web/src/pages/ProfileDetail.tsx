import { Link, useParams } from "wouter";
import { MOCK_PROFILES } from "@/lib/mock-data";
import { useApp } from "@/contexts/AppContext";
import { Heart, Share2, Lock, Users, Star, ThumbsUp, ChevronLeft } from "lucide-react";

export default function ProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const { credits, unlockContent, unlockedContent } = useApp();
  const profile = MOCK_PROFILES.find(p => p.id === id);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-white mb-2">Profile not found</p>
          <Link href="/profiles"><span className="text-sm cursor-pointer" style={{ color: "#14b8a6" }}>← Back to creators</span></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Cover */}
      <div className="relative h-52 md:h-64 overflow-hidden">
        <img src={profile.coverUrl} alt={profile.displayName} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(9,9,26,0.95) 100%)" }} />
        {profile.isLive && (
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold"
            style={{ background: "rgba(239,68,68,0.9)", color: "white" }}>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            LIVE — {profile.viewerCount?.toLocaleString()} VIEWERS
          </div>
        )}
      </div>

      {/* Profile header */}
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-6 mb-5 relative z-10">
          <img src={profile.avatarUrl} alt={profile.displayName}
            className="w-20 h-20 rounded-full border-4 object-cover flex-shrink-0"
            style={{ borderColor: "#14b8a6" }} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">{profile.displayName}</h1>
              {profile.badges.map(b => (
                <span key={b.id} className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${b.color}18`, border: `1px solid ${b.color}35`, color: b.color }}>
                  {b.icon} {b.name}
                </span>
              ))}
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              @{profile.username} · {profile.age} · {profile.location}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg transition-all hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <Heart className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
            <button className="p-2 rounded-lg transition-all hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <Share2 className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
            {profile.isLive ? (
              <Link href={`/live/${profile.id}`}>
                <button className="px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2" style={{ background: "#ef4444", color: "white" }}>
                  ● JOIN LIVE
                </button>
              </Link>
            ) : (
              <Link href="/messages">
                <button className="vl-btn-primary px-5 py-2 text-sm">Message</button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-7">
          {[
            { icon: Users, value: profile.followersCount?.toLocaleString() ?? "—", label: "Followers" },
            { icon: ThumbsUp, value: profile.likesCount?.toLocaleString() ?? "—", label: "Likes" },
            { icon: Star, value: profile.rating?.toFixed(1) ?? "—", label: "Rating" },
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
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{profile.bio}</p>
            </div>

            <div className="vl-card p-5">
              <h3 className="font-bold text-sm text-white mb-3">Details</h3>
              <div className="space-y-2">
                {[
                  { label: "Location", value: profile.location },
                  { label: "Height", value: profile.height },
                  { label: "Body Type", value: profile.bodyType },
                  { label: "Ethnicity", value: profile.ethnicity },
                ].map(d => d.value && (
                  <div key={d.label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{d.label}</span>
                    <span className="text-xs font-medium text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {profile.liveSchedule && (
              <div className="vl-card p-5">
                <h3 className="font-bold text-sm text-white mb-2">Live Schedule</h3>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{profile.liveSchedule}</p>
              </div>
            )}
          </div>

          {/* Right panel — Exclusive Content */}
          <div className="lg:col-span-3">
            <h3 className="font-bold text-sm text-white mb-4">Exclusive Content</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {profile.mediaItems?.map(item => {
                const isUnlocked = unlockedContent.has(item.id);
                return (
                  <div key={item.id} className="vl-card overflow-hidden cursor-pointer group"
                    onClick={() => !isUnlocked && unlockContent(item.id, item.creditCost)}>
                    <div className="relative h-28 overflow-hidden">
                      <img src={item.thumbnailUrl} alt={item.title}
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${!isUnlocked ? "blur-sm scale-105" : ""}`} />
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
