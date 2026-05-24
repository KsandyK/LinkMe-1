import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { MOCK_PROFILES, MOCK_LIVE_FEEDS } from "@/lib/mock-data";
import { Radio, Zap, Shield, Crown, ChevronRight, Eye, Users } from "lucide-react";

const HERO_BG = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&w=1920&q=80";

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
            {profile.isLive ? "● Join Live" : "View Profile"}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { ageVerificationStatus } = useApp();
  const liveProfiles = MOCK_PROFILES.filter(p => p.isLive);
  const featuredProfiles = MOCK_PROFILES.slice(0, 6);

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
              {liveProfiles.length} CREATORS LIVE NOW
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
                { label: "Live Right Now", value: `${liveProfiles.length}` },
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
        <div className="py-3" style={{ background: "rgba(234,179,8,0.05)", borderBottom: "1px solid rgba(234,179,8,0.12)" }}>
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
            {MOCK_LIVE_FEEDS.map((feed) => {
              const profile = MOCK_PROFILES.find(p => p.id === feed.hostId);
              return (
                <Link key={feed.id} href={`/live/${feed.id}`}>
                  <div className="vl-card overflow-hidden cursor-pointer group">
                    <div className="relative">
                      <img src={feed.thumbnailUrl} alt={feed.title} className="w-full h-36 object-cover transition-transform duration-500 group-hover:scale-105" />
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
                        {profile && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{profile.displayName}</p>}
                      </div>
                    </div>
                    <div className="px-3 py-2">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(20,184,166,0.1)", color: "#14b8a6", border: "1px solid rgba(20,184,166,0.2)" }}>{feed.category}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Creators */}
      <section className="py-10" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="container">
          <div className="flex items-center justify-between mb-5">
            <h2 className="vl-section-title">Featured Creators</h2>
            <Link href="/profiles">
              <span className="text-sm font-semibold cursor-pointer" style={{ color: "#14b8a6" }}>Browse All <ChevronRight className="w-3.5 h-3.5 inline" /></span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredProfiles.map(profile => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        </div>
      </section>

      {/* Why LinkMe */}
      <section className="py-12" style={{ background: "rgba(20,184,166,0.02)", borderTop: "1px solid rgba(20,184,166,0.07)" }}>
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
