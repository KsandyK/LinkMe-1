/**
 * VIBELINK — Profile Detail Page
 * Velvet Dark Design System
 */
import { useParams, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { MOCK_PROFILES } from "@/lib/mock-data";
import { Lock, Heart, Share2, MessageCircle, Radio, Eye, Users, Star } from "lucide-react";

export default function ProfileDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { unlockContent, isUnlocked, getMediaUrl, ageVerificationStatus, showToast } = useApp();

  const profile = MOCK_PROFILES.find(p => p.id === params.id);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white font-semibold">Creator not found</p>
          <button onClick={() => navigate("/profiles")} className="vl-btn-primary mt-4 px-5 py-2 text-sm">Browse Creators</button>
        </div>
      </div>
    );
  }

  const handleUnlock = (item: typeof profile.mediaItems[0]) => {
    if (ageVerificationStatus !== "verified") {
      showToast({ title: "Age verification required", description: "Please verify your age to unlock content.", variant: "destructive" });
      navigate("/verify-age");
      return;
    }
    unlockContent(item.id, item.creditCost, item.thumbnailUrl);
  };

  return (
    <div className="min-h-screen">
      {/* Cover */}
      <div className="relative h-48 md:h-64">
        <img src={profile.coverUrl} alt={profile.displayName} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(9,9,26,0.95) 100%)" }} />
        {profile.isLive && (
          <div className="absolute top-4 right-4 vl-badge-live flex items-center gap-1.5 text-sm px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block" />
            LIVE — {profile.viewerCount.toLocaleString()} viewers
          </div>
        )}
      </div>

      <div className="container max-w-4xl mx-auto -mt-16 relative z-10 pb-12">
        {/* Profile header */}
        <div className="flex items-end gap-4 mb-6">
          <img src={profile.avatarUrl} alt={profile.displayName}
            className="w-20 h-20 rounded-2xl border-2 object-cover flex-shrink-0"
            style={{ borderColor: "#14b8a6", boxShadow: "0 0 20px rgba(20,184,166,0.3)" }} />
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.75rem", fontWeight: 700, color: "white" }}>{profile.displayName}</h1>
              {profile.badges.map(b => (
                <span key={b.id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${b.color}15`, border: `1px solid ${b.color}40`, color: b.color }}>
                  {b.icon} {b.name}
                </span>
              ))}
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>@{profile.username} • {profile.age} • {profile.location}</p>
          </div>
          <div className="flex gap-2 pb-1">
            <button className="p-2 rounded-xl transition-all duration-200 hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <Heart className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
            <button className="p-2 rounded-xl transition-all duration-200 hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <Share2 className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
            {profile.isLive ? (
              <button className="vl-badge-live px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5">
                <Radio className="w-4 h-4" /> Join Live
              </button>
            ) : (
              <button className="vl-btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" /> Message
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Users, label: "Followers", value: profile.followersCount.toLocaleString() },
            { icon: Heart, label: "Likes", value: profile.likesCount.toLocaleString() },
            { icon: Star, label: "Rating", value: profile.rating.toFixed(1) },
          ].map(s => (
            <div key={s.label} className="vl-card p-4 text-center">
              <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: "#14b8a6" }} />
              <p className="font-bold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>{s.value}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Bio & Info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="vl-card p-4">
              <h3 className="font-bold text-white mb-2 text-sm">About</h3>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{profile.bio}</p>
            </div>
            <div className="vl-card p-4">
              <h3 className="font-bold text-white mb-3 text-sm">Details</h3>
              <div className="space-y-2">
                {[
                  { label: "Gender", value: profile.gender },
                  { label: "Location", value: profile.location },
                  { label: "Height", value: profile.height },
                  { label: "Body Type", value: profile.bodyType },
                  { label: "Ethnicity", value: profile.ethnicity },
                ].map(d => (
                  <div key={d.label} className="flex justify-between text-xs">
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>{d.label}</span>
                    <span className="text-white font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="vl-card p-4">
              <h3 className="font-bold text-white mb-2 text-sm">Live Schedule</h3>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{profile.liveSchedule}</p>
            </div>
          </div>

          {/* Right: Media */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-white mb-3">Exclusive Content</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {profile.mediaItems.map(item => {
                const unlocked = isUnlocked(item.id);
                const mediaUrl = getMediaUrl(item.id);
                return (
                  <div key={item.id} className="relative rounded-xl overflow-hidden cursor-pointer group" style={{ aspectRatio: "4/5" }}
                    onClick={() => !unlocked && handleUnlock(item)}>
                    <img src={unlocked && mediaUrl ? mediaUrl : item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    {!unlocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center"
                        style={{ background: "rgba(9,9,26,0.75)", backdropFilter: "blur(4px)" }}>
                        <Lock className="w-6 h-6 mb-1.5" style={{ color: "#14b8a6" }} />
                        <p className="text-xs font-bold text-white">{item.creditCost} credits</p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>Tap to unlock</p>
                      </div>
                    )}
                    {unlocked && (
                      <div className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: "rgba(20,184,166,0.9)", color: "white" }}>✓ Unlocked</div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-2" style={{ background: "linear-gradient(to top, rgba(9,9,26,0.9), transparent)" }}>
                      <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{item.type}</p>
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
