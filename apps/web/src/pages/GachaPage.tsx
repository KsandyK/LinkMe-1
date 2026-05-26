/**
 * LINKME — The Pull (Gacha System)
 * Velvet Dark Design System
 * Spend credits to pull rare items from rotating banners.
 */
import { useState, useCallback } from "react";
import { Link } from "wouter";
import { Sparkles, Star, Zap, RefreshCw } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

// ── Item pool ─────────────────────────────────────────────────────────────────
type Rarity = "Common" | "Rare" | "Epic" | "Legendary";

interface GachaItem {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  desc: string;
}

const RARITY_CONFIG: Record<Rarity, { color: string; glow: string; chance: number; label: string }> = {
  Common:    { color: "#9ca3af", glow: "rgba(156,163,175,0.2)", chance: 0.50, label: "50%" },
  Rare:      { color: "#3b82f6", glow: "rgba(59,130,246,0.25)", chance: 0.30, label: "30%" },
  Epic:      { color: "#8b5cf6", glow: "rgba(139,92,246,0.3)",  chance: 0.15, label: "15%" },
  Legendary: { color: "#f59e0b", glow: "rgba(245,158,11,0.35)", chance: 0.05, label: "5%"  },
};

const POOL: GachaItem[] = [
  // Common — 50%
  { id: "frame_gold",    name: "Gold Frame",     emoji: "🖼️",  rarity: "Common",    desc: "Shiny gold profile frame" },
  { id: "frame_silver",  name: "Silver Frame",   emoji: "🪞",  rarity: "Common",    desc: "Elegant silver profile frame" },
  { id: "badge_heart",   name: "Heart Badge",    emoji: "❤️",  rarity: "Common",    desc: "A cute heart badge" },
  { id: "badge_star",    name: "Star Badge",     emoji: "⭐",  rarity: "Common",    desc: "A glowing star badge" },
  { id: "title_fan",     name: "Fan Title",      emoji: "📣",  rarity: "Common",    desc: "Show your fan pride" },
  { id: "emote_wave",    name: "Wave Emote",     emoji: "👋",  rarity: "Common",    desc: "Wave hello in chat" },
  { id: "emote_fire",    name: "Fire Emote",     emoji: "🔥",  rarity: "Common",    desc: "Light up the chat" },
  { id: "title_vibe",    name: "Vibe Chaser",    emoji: "🎵",  rarity: "Common",    desc: "You live for the vibe" },
  // Rare — 30%
  { id: "frame_neon",    name: "Neon Frame",     emoji: "💚",  rarity: "Rare",      desc: "Electric neon border" },
  { id: "frame_rose",    name: "Rose Frame",     emoji: "🌹",  rarity: "Rare",      desc: "Romantic rose border" },
  { id: "badge_crown",   name: "Mini Crown",     emoji: "👑",  rarity: "Rare",      desc: "A mini regal crown" },
  { id: "badge_gem",     name: "Gem Badge",      emoji: "💎",  rarity: "Rare",      desc: "A sparkling gem" },
  { id: "title_regular", name: "Regular",        emoji: "🎯",  rarity: "Rare",      desc: "A true platform regular" },
  { id: "emote_money",   name: "Money Rain",     emoji: "💸",  rarity: "Rare",      desc: "Make it rain in chat" },
  // Epic — 15%
  { id: "frame_galaxy",  name: "Galaxy Frame",   emoji: "🌌",  rarity: "Epic",      desc: "Cosmic galaxy border" },
  { id: "badge_lightning",name:"Lightning Badge", emoji: "⚡",  rarity: "Epic",      desc: "Electric energy badge" },
  { id: "title_vip",     name: "VIP Title",      emoji: "🎩",  rarity: "Epic",      desc: "You're in the VIP" },
  { id: "anim_sparkle",  name: "Sparkle Effect", emoji: "✨",  rarity: "Epic",      desc: "Animated sparkles on your profile" },
  // Legendary — 5%
  { id: "frame_legend",  name: "Legendary Aura", emoji: "🌟",  rarity: "Legendary", desc: "Mythic golden aura frame" },
  { id: "badge_unicorn", name: "Unicorn Badge",  emoji: "🦄",  rarity: "Legendary", desc: "One of a kind — rarest badge" },
  { id: "title_legend",  name: "Legend Title",   emoji: "🏆",  rarity: "Legendary", desc: "True legend status" },
];

const SINGLE_COST = 50;
const MULTI_COST  = 450; // 10-pull

function weightedPull(): GachaItem {
  const roll = Math.random();
  let cumulative = 0;
  const order: Rarity[] = ["Legendary", "Epic", "Rare", "Common"];
  for (const rarity of order) {
    cumulative += RARITY_CONFIG[rarity].chance;
    if (roll <= cumulative) {
      const bucket = POOL.filter(i => i.rarity === rarity);
      return bucket[Math.floor(Math.random() * bucket.length)];
    }
  }
  return POOL[Math.floor(Math.random() * POOL.length)];
}

// ── Rarity badge ─────────────────────────────────────────────────────────────
function RarityBadge({ rarity }: { rarity: Rarity }) {
  const cfg = RARITY_CONFIG[rarity];
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: cfg.glow, color: cfg.color, border: `1px solid ${cfg.color}50` }}>
      {rarity}
    </span>
  );
}

// ── Result card ──────────────────────────────────────────────────────────────
function ResultCard({ item, delay = 0 }: { item: GachaItem; delay?: number }) {
  const cfg = RARITY_CONFIG[item.rarity];
  return (
    <div className="flex flex-col items-center rounded-xl p-4 text-center"
      style={{
        background: `linear-gradient(135deg, ${cfg.glow}, rgba(0,0,0,0.3))`,
        border: `1px solid ${cfg.color}40`,
        boxShadow: `0 0 20px ${cfg.glow}`,
        animationDelay: `${delay}ms`,
      }}>
      <div className="text-4xl mb-2">{item.emoji}</div>
      <RarityBadge rarity={item.rarity} />
      <p className="text-sm font-bold text-white mt-2">{item.name}</p>
      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{item.desc}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GachaPage() {
  const { credits, spendCredits, gachaCollection, addGachaItem } = useApp();
  const [pulling, setPulling] = useState(false);
  const [results, setResults] = useState<GachaItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState<"pull" | "collection">("pull");

  const doPull = useCallback((count: 1 | 10) => {
    const cost = count === 1 ? SINGLE_COST : MULTI_COST;
    const ok = spendCredits(cost, `The Pull — ${count === 1 ? "Single" : "10×"} pull`);
    if (!ok) return;

    setPulling(true);
    setShowResults(false);

    setTimeout(() => {
      const pulled = Array.from({ length: count }, () => weightedPull());
      pulled.forEach(item => addGachaItem(item.id));
      setResults(pulled);
      setPulling(false);
      setShowResults(true);
    }, 900);
  }, [spendCredits, addGachaItem]);

  // Build collection with item metadata + count
  const collectionCounts = gachaCollection.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});
  const collectionItems = Object.entries(collectionCounts)
    .map(([id, count]) => ({ item: POOL.find(p => p.id === id) ?? null, count }))
    .filter(x => x.item !== null) as { item: GachaItem; count: number }[];

  // Sort: Legendary → Epic → Rare → Common
  const rarityOrder: Rarity[] = ["Legendary", "Epic", "Rare", "Common"];
  collectionItems.sort((a, b) => rarityOrder.indexOf(a.item.rarity) - rarityOrder.indexOf(b.item.rarity));

  return (
    <div className="min-h-screen py-10">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">The Pull</h1>
          <p className="text-base mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
            Spend credits to win rare items, badges, and profile cosmetics
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {(["Common","Rare","Epic","Legendary"] as Rarity[]).map(r => (
              <span key={r} className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: RARITY_CONFIG[r].glow, color: RARITY_CONFIG[r].color, border: `1px solid ${RARITY_CONFIG[r].color}40` }}>
                {r} · {RARITY_CONFIG[r].label}
              </span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {(["pull","collection"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all"
              style={activeTab === tab
                ? { background: "rgba(139,92,246,0.2)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.3)" }
                : { color: "rgba(255,255,255,0.45)" }}>
              {tab === "pull" ? "🎴 The Pull" : `📦 Collection (${gachaCollection.length})`}
            </button>
          ))}
        </div>

        {/* ── Pull tab ─────────────────────────────────────────────────────── */}
        {activeTab === "pull" && (
          <div>
            {/* Banner card */}
            <div className="vl-card p-6 mb-6 relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(139,92,246,0.12), transparent 70%)" }} />
              <div className="flex items-center gap-4 relative">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
                      ✦ LIMITED BANNER
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">Launch Banner</h2>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Collect exclusive frames, badges, emotes & titles. Legendaries guaranteed in every 20 pulls.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Zap className="w-4 h-4" style={{ color: "#14b8a6" }} />
                    <span className="text-sm" style={{ color: "#14b8a6" }}>
                      Balance: <strong>{credits.toLocaleString()}</strong> credits
                    </span>
                  </div>
                </div>
                <div className="text-5xl hidden sm:block select-none">🎴</div>
              </div>
            </div>

            {/* Pull buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => doPull(1)}
                disabled={pulling || credits < SINGLE_COST}
                className="p-5 rounded-xl text-center transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)" }}>
                <div className="text-3xl mb-2">🎴</div>
                <p className="text-base font-bold text-white mb-0.5">Single Pull</p>
                <p className="text-sm font-black" style={{ color: "#8b5cf6" }}>{SINGLE_COST} credits</p>
              </button>
              <button
                onClick={() => doPull(10)}
                disabled={pulling || credits < MULTI_COST}
                className="p-5 rounded-xl text-center transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative"
                style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" }}>
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "#f59e0b", color: "#000" }}>BEST VALUE</div>
                <div className="text-3xl mb-2">🃏×10</div>
                <p className="text-base font-bold text-white mb-0.5">10× Pull</p>
                <p className="text-sm font-black" style={{ color: "#f59e0b" }}>{MULTI_COST} credits</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Save {SINGLE_COST * 10 - MULTI_COST} cr</p>
              </button>
            </div>

            {/* Pulling animation */}
            {pulling && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="text-5xl mb-4" style={{ animation: "spin 0.6s linear infinite" }}>🎴</div>
                <p className="text-lg font-bold text-white">Drawing…</p>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>May fortune favor you</p>
                <style>{`@keyframes spin { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }`}</style>
              </div>
            )}

            {/* Results */}
            {showResults && !pulling && results.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white">
                    {results.length === 1 ? "Your Pull" : `Your ${results.length}× Pull`}
                  </h3>
                  <button onClick={() => setShowResults(false)}
                    className="flex items-center gap-1.5 text-xs font-semibold transition-all hover:opacity-80"
                    style={{ color: "rgba(255,255,255,0.4)" }}>
                    <RefreshCw className="w-3.5 h-3.5" /> Clear
                  </button>
                </div>
                {results.length === 1 ? (
                  <div className="max-w-xs mx-auto">
                    <ResultCard item={results[0]} />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {results.map((item, i) => (
                      <ResultCard key={i} item={item} delay={i * 80} />
                    ))}
                  </div>
                )}
                {/* Highlight legendaries */}
                {results.some(r => r.rarity === "Legendary") && (
                  <div className="mt-4 rounded-xl p-4 text-center"
                    style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
                    <p className="text-sm font-bold" style={{ color: "#f59e0b" }}>
                      🌟 Legendary drop! You're incredibly lucky.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Drop rates */}
            <div className="mt-8 vl-card p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Drop Rates</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["Common","Rare","Epic","Legendary"] as Rarity[]).map(r => (
                  <div key={r} className="rounded-lg p-3 text-center"
                    style={{ background: RARITY_CONFIG[r].glow, border: `1px solid ${RARITY_CONFIG[r].color}30` }}>
                    <p className="text-sm font-black" style={{ color: RARITY_CONFIG[r].color }}>
                      {RARITY_CONFIG[r].label}
                    </p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{r}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                Pity system: Legendary guaranteed within 20 pulls. Drop rates are independent per pull.
              </p>
            </div>
          </div>
        )}

        {/* ── Collection tab ────────────────────────────────────────────────── */}
        {activeTab === "collection" && (
          <div>
            {collectionItems.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🎴</div>
                <h3 className="text-lg font-bold text-white mb-2">No items yet</h3>
                <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Make your first pull to start collecting rare items!
                </p>
                <button onClick={() => setActiveTab("pull")}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}>
                  Go to The Pull
                </button>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {(["Legendary","Epic","Rare"] as Rarity[]).map(r => {
                    const count = collectionItems.filter(x => x.item.rarity === r).reduce((s, x) => s + x.count, 0);
                    return (
                      <div key={r} className="rounded-xl p-4 text-center"
                        style={{ background: RARITY_CONFIG[r].glow, border: `1px solid ${RARITY_CONFIG[r].color}30` }}>
                        <p className="text-2xl font-black" style={{ color: RARITY_CONFIG[r].color }}>{count}</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{r}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {collectionItems.map(({ item, count }) => {
                    const cfg = RARITY_CONFIG[item.rarity];
                    return (
                      <div key={item.id} className="vl-card p-4 text-center relative"
                        style={{ border: `1px solid ${cfg.color}30` }}>
                        {count > 1 && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: cfg.color, color: "#000" }}>
                            {count}
                          </div>
                        )}
                        <div className="text-3xl mb-2">{item.emoji}</div>
                        <RarityBadge rarity={item.rarity} />
                        <p className="text-xs font-bold text-white mt-2">{item.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Credits store link */}
        <div className="mt-10 text-center">
          <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Need more credits for pulls?
          </p>
          <Link href="/credits">
            <button className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)" }}>
              <Star className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Get Credits
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
