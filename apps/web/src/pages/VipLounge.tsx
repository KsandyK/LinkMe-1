/**
 * LINKME — VIP Lounge
 * Velvet Dark Design System
 * Gated to All-Access (10 sessions/month) and Creator Pass (20 sessions/month).
 */
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Crown, Star, Zap, Gift, Shield, Sparkles, Lock, Clock, Play, Image, Film } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

// Session allowance per membership
const SESSION_LIMITS: Record<string, number> = {
  allaccess: 10,
  creatorpass: 20,
};

// VIP-exclusive content cards
const EXCLUSIVE_CONTENT = [
  { id: "c1", type: "photo",  title: "Behind the Scenes",       creator: "Aria V.",    emoji: "📸", locked: false },
  { id: "c2", type: "video",  title: "Private Unboxing",        creator: "Mia Rose",   emoji: "🎬", locked: false },
  { id: "c3", type: "stream", title: "Intimate Q&A Stream",     creator: "Celeste K.", emoji: "🎙️", locked: false },
  { id: "c4", type: "photo",  title: "Photoshoot Extras",       creator: "Aria V.",    emoji: "📸", locked: true  },
  { id: "c5", type: "video",  title: "Exclusive Vlog",          creator: "Mia Rose",   emoji: "🎬", locked: true  },
  { id: "c6", type: "stream", title: "VIP-Only Live",           creator: "Celeste K.", emoji: "🎙️", locked: true  },
];

const PERKS = [
  { icon: Zap,      title: "Priority Chat Access",    desc: "Skip the queue — message creators first, every time" },
  { icon: Gift,     title: "Exclusive Content Drops", desc: "Monthly private content releases for VIP members only" },
  { icon: Star,     title: "20% Off Tips & Gifts",    desc: "Send more love for less — discounted on every transaction" },
  { icon: Crown,    title: "Early Creator Access",    desc: "Be first to discover and connect with new creators" },
  { icon: Shield,   title: "VIP Badge on Profile",   desc: "Exclusive badge that creators and members can see" },
  { icon: Sparkles, title: "Exclusive VIP Streams",  desc: "Access intimate streams only visible to VIP members" },
];

function getSessionKey() {
  const now = new Date();
  return `vl_vip_sessions_${now.getFullYear()}_${now.getMonth() + 1}`;
}

export default function VipLounge() {
  const { credits, activeMembership } = useApp();
  const limit = SESSION_LIMITS[activeMembership] ?? 0;
  const hasAccess = limit > 0;

  const [sessionsUsed, setSessionsUsed] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(getSessionKey()) ?? "0", 10) || 0; }
    catch { return 0; }
  });
  const [openedContent, setOpenedContent] = useState<Set<string>>(new Set());
  const [viewingId, setViewingId] = useState<string | null>(null);

  const sessionsLeft = Math.max(0, limit - sessionsUsed);

  const handleOpenContent = (id: string) => {
    if (sessionsLeft === 0 && !openedContent.has(id)) return;
    if (!openedContent.has(id)) {
      const next = sessionsUsed + 1;
      setSessionsUsed(next);
      try { localStorage.setItem(getSessionKey(), String(next)); } catch {}
    }
    setOpenedContent(prev => new Set([...prev, id]));
    setViewingId(id);
  };

  // ── Locked state ──────────────────────────────────────────────────────────
  if (!hasAccess) {
    return (
      <div className="min-h-screen py-10 flex items-center justify-center">
        <div className="container max-w-lg text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
            style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.1))", border: "1px solid rgba(139,92,246,0.3)" }}>
            <Lock className="w-10 h-10" style={{ color: "#8b5cf6" }} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">VIP Lounge</h1>
          <p className="text-base mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
            Exclusive access for <span className="font-bold" style={{ color: "#14b8a6" }}>All-Access</span> and{" "}
            <span className="font-bold" style={{ color: "#e8a87c" }}>Creator Pass</span> members.
          </p>
          <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.35)" }}>
            Your current plan: <span className="font-semibold text-white capitalize">{activeMembership === "free" ? "Free" : activeMembership}</span>
          </p>

          {/* Perk preview */}
          <div className="grid grid-cols-2 gap-3 mb-8 text-left">
            {PERKS.slice(0, 4).map(perk => (
              <div key={perk.title} className="rounded-xl p-4 opacity-60"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <perk.icon className="w-4 h-4 mb-2" style={{ color: "#8b5cf6" }} />
                <p className="text-xs font-semibold text-white">{perk.title}</p>
              </div>
            ))}
          </div>

          {/* Session limits table */}
          <div className="rounded-xl overflow-hidden mb-8"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="grid grid-cols-3 text-xs font-bold py-2 px-4"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}>
              <span>Plan</span>
              <span className="text-center">VIP Sessions</span>
              <span className="text-right">Price</span>
            </div>
            {[
              { name: "All-Access",    sessions: "10 / month",  price: "$49.99/mo", color: "#14b8a6" },
              { name: "Creator Pass",  sessions: "20 / month",  price: "$99.99/mo", color: "#e8a87c" },
            ].map(r => (
              <div key={r.name} className="grid grid-cols-3 text-xs py-3 px-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="font-semibold" style={{ color: r.color }}>{r.name}</span>
                <span className="text-center" style={{ color: "rgba(255,255,255,0.7)" }}>{r.sessions}</span>
                <span className="text-right font-bold text-white">{r.price}</span>
              </div>
            ))}
          </div>

          <Link href="/boosts">
            <button className="px-8 py-3 rounded-xl font-bold text-white"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}>
              Upgrade Membership
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Viewing a content item ─────────────────────────────────────────────────
  if (viewingId) {
    const item = EXCLUSIVE_CONTENT.find(c => c.id === viewingId);
    return (
      <div className="min-h-screen py-10">
        <div className="container max-w-3xl">
          <button onClick={() => setViewingId(null)}
            className="flex items-center gap-2 text-sm mb-6 transition-all hover:opacity-80"
            style={{ color: "rgba(255,255,255,0.5)" }}>
            ← Back to VIP Lounge
          </button>
          <div className="vl-card overflow-hidden">
            {/* Mock content viewer */}
            <div className="flex items-center justify-center text-6xl"
              style={{ height: 280, background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(20,184,166,0.08))" }}>
              {item?.emoji}
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold capitalize"
                  style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}>
                  {item?.type}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "rgba(20,184,166,0.1)", color: "#14b8a6" }}>
                  VIP Exclusive
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-2 mb-1">{item?.title}</h2>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>By {item?.creator}</p>
              <p className="text-sm mt-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                This exclusive VIP content is available only to your membership tier.
                Enjoy unlimited viewing within your monthly session allowance.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main VIP Lounge ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-10">
      <div className="container max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}>
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">VIP Lounge</h1>
          <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold capitalize"
              style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.25)", color: "#14b8a6" }}>
              {activeMembership === "allaccess" ? "All-Access" : "Creator Pass"} Member
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", color: "#8b5cf6" }}>
              <Clock className="w-3 h-3" />
              {sessionsLeft} / {limit} sessions remaining
            </span>
          </div>
        </div>

        {/* Session progress */}
        <div className="vl-card p-5 mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-white">Monthly VIP Sessions</p>
            <p className="text-sm font-bold" style={{ color: sessionsLeft === 0 ? "#f87171" : "#14b8a6" }}>
              {sessionsLeft} left
            </p>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(sessionsUsed / limit) * 100}%`, background: sessionsLeft === 0 ? "#ef4444" : "linear-gradient(90deg, #8b5cf6, #14b8a6)" }} />
          </div>
          <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>
            Resets the 1st of each month · {sessionsUsed} session{sessionsUsed !== 1 ? "s" : ""} used this month
          </p>
        </div>

        {/* Perks grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {PERKS.map(perk => (
            <div key={perk.title} className="vl-card p-5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{ background: "rgba(139,92,246,0.12)" }}>
                <perk.icon className="w-5 h-5" style={{ color: "#8b5cf6" }} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{perk.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{perk.desc}</p>
            </div>
          ))}
        </div>

        {/* Exclusive content */}
        <h2 className="vl-section-title mb-5">Exclusive VIP Content</h2>
        {sessionsLeft === 0 && (
          <div className="rounded-xl p-4 mb-5 text-center"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <p className="text-sm font-semibold" style={{ color: "#f87171" }}>Session limit reached for this month</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Previously opened content is still accessible below.</p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {EXCLUSIVE_CONTENT.map(item => {
            const canOpen = openedContent.has(item.id) || (!item.locked && sessionsLeft > 0) || (item.locked === false && sessionsLeft > 0);
            const isViewed = openedContent.has(item.id);
            const TypeIcon = item.type === "photo" ? Image : item.type === "video" ? Film : Play;
            return (
              <div key={item.id} className="vl-card overflow-hidden flex flex-col">
                <div className="flex items-center justify-center text-4xl relative"
                  style={{ height: 140, background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(20,184,166,0.06))" }}>
                  <span>{item.emoji}</span>
                  {!canOpen && (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
                      <Lock className="w-6 h-6" style={{ color: "rgba(255,255,255,0.5)" }} />
                    </div>
                  )}
                  {isViewed && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: "rgba(20,184,166,0.2)", color: "#14b8a6" }}>Viewed</div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TypeIcon className="w-3.5 h-3.5" style={{ color: "#8b5cf6" }} />
                    <span className="text-xs capitalize" style={{ color: "#8b5cf6" }}>{item.type}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-0.5">{item.title}</h3>
                  <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>by {item.creator}</p>
                  <button
                    onClick={() => handleOpenContent(item.id)}
                    disabled={!canOpen}
                    className="mt-auto w-full py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: canOpen ? (isViewed ? "rgba(20,184,166,0.15)" : "rgba(139,92,246,0.2)") : "rgba(255,255,255,0.04)",
                      border: `1px solid ${canOpen ? (isViewed ? "rgba(20,184,166,0.3)" : "rgba(139,92,246,0.3)") : "rgba(255,255,255,0.08)"}`,
                      color: canOpen ? (isViewed ? "#14b8a6" : "#8b5cf6") : "rgba(255,255,255,0.3)",
                      cursor: canOpen ? "pointer" : "not-allowed",
                    }}>
                    {!canOpen ? "🔒 Session limit reached" : isViewed ? "▶ Watch Again" : "▶ Open Content"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Credits callout */}
        <div className="vl-card p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white mb-0.5">Your Current Balance</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              Credits are used for tips, gifts, and unlocking content
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xl font-black" style={{ color: "#14b8a6" }}>{credits.toLocaleString()}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>credits</p>
            </div>
            <Link href="/credits">
              <button className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)" }}>
                Get More
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
