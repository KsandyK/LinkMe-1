/**
 * LINKME — Stream Viewer Page
 * Velvet Dark Design System
 *
 * Individual live-stream view with:
 *   - Video area (WebRTC — connects via WS signaling)
 *   - Real-time chat sidebar (WS or mock fallback)
 *   - Viewer count, gift panel, tip button
 *   - Back to grid link
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { MOCK_LIVE_FEEDS, MOCK_GIFTS } from "@/lib/mock-data";
import { createLiveSocket, LinkMeSocket } from "@/lib/socket";
import {
  ChevronLeft, Eye, Gift, Zap, Send, Users,
  Volume2, VolumeX, Maximize2, Crown, Radio,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMsg {
  id: string;
  userId: string;
  username: string;
  text: string;
  creditTip: number;
  createdAt: string;
}

// ── Quick-tip gift set (shown inline) ─────────────────────────────────────────

const QUICK_GIFTS = MOCK_GIFTS.filter(g =>
  ["rose", "kiss", "fire", "champagne", "crown"].includes(g.id)
);

// ── Fake chat messages to seed the view while WS connects ─────────────────────

function seedMessages(hostName: string): ChatMsg[] {
  return [
    { id: "s1", userId: "u1", username: "StargazerKai", text: "omg just tuned in 🔥", creditTip: 0, createdAt: new Date(Date.now() - 120_000).toISOString() },
    { id: "s2", userId: "u2", username: "NightOwl99", text: `${hostName} you're the best!!`, creditTip: 0, createdAt: new Date(Date.now() - 90_000).toISOString() },
    { id: "s3", userId: "u3", username: "VibeChecker", text: "stream quality is 🔥🔥🔥", creditTip: 50, createdAt: new Date(Date.now() - 60_000).toISOString() },
    { id: "s4", userId: "u4", username: "LoungeQueen", text: "sending love from London 💜", creditTip: 0, createdAt: new Date(Date.now() - 30_000).toISOString() },
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StreamView() {
  const { id } = useParams<{ id: string }>();
  const { credits, spendCredits, token, user } = useApp();

  const feed = MOCK_LIVE_FEEDS.find(f => f.id === id);

  const [msgs, setMsgs] = useState<ChatMsg[]>(feed ? seedMessages(feed.hostName) : []);
  const [draft, setDraft] = useState("");
  const [viewerCount, setViewerCount] = useState(feed?.viewerCount ?? 0);
  const [muted, setMuted] = useState(true);
  const [showGifts, setShowGifts] = useState(false);
  const [sentGift, setSentGift] = useState<string | null>(null);
  const [streamEnded, setStreamEnded] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<LinkMeSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // ── WebSocket connection ────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const accessToken = token ?? localStorage.getItem("linkme_token");
    if (!accessToken) return; // guest — WS not available, mock chat only

    const ws = createLiveSocket(accessToken);
    wsRef.current = ws;

    // Join feed room
    ws.on("auth_ok", () => {
      ws.send({ type: "join_feed", feedId: id });
    });

    ws.on("chat_msg", (data) => {
      setMsgs(prev => [...prev.slice(-199), {
        id: String(Date.now() + Math.random()),
        userId: String(data.userId ?? "?"),
        username: String(data.username ?? "Anonymous"),
        text: String(data.text ?? ""),
        creditTip: Number(data.creditTip ?? 0),
        createdAt: String(data.createdAt ?? new Date().toISOString()),
      }]);
    });

    ws.on("viewer_count", (data) => setViewerCount(Number(data.count ?? 0)));
    ws.on("stream_ended", () => setStreamEnded(true));

    return () => {
      ws.send({ type: "leave_feed" });
      ws.close();
      wsRef.current = null;
    };
  }, [id, token]);

  // ── Send chat message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");

    if (wsRef.current?.isOpen) {
      wsRef.current.send({ type: "chat", text, creditTip: 0 });
    } else {
      // Optimistic fallback (guest / no WS)
      setMsgs(prev => [...prev, {
        id: String(Date.now()),
        userId: user?.id ?? "guest",
        username: user?.username ?? "You",
        text,
        creditTip: 0,
        createdAt: new Date().toISOString(),
      }]);
    }
  }, [draft, user]);

  // ── Send gift / tip ─────────────────────────────────────────────────────────
  const sendGift = useCallback((gift: typeof QUICK_GIFTS[0]) => {
    const ok = spendCredits(gift.creditCost, `${gift.emoji} ${gift.name} tip to ${feed?.hostName}`);
    if (!ok) return;
    setSentGift(gift.id);
    setTimeout(() => setSentGift(null), 1500);

    const text = `${gift.emoji} +${gift.creditCost} tip — ${gift.name}!`;
    if (wsRef.current?.isOpen) {
      wsRef.current.send({ type: "chat", text, creditTip: gift.creditCost });
    } else {
      setMsgs(prev => [...prev, {
        id: String(Date.now()),
        userId: user?.id ?? "me",
        username: user?.username ?? "You",
        text,
        creditTip: gift.creditCost,
        createdAt: new Date().toISOString(),
      }]);
    }
  }, [spendCredits, feed, user]);

  // ── 404 ─────────────────────────────────────────────────────────────────────
  if (!feed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Radio className="w-10 h-10 mx-auto mb-4" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p className="text-lg font-semibold text-white mb-2">Stream not found</p>
          <Link href="/live">
            <span className="text-sm cursor-pointer" style={{ color: "#14b8a6" }}>← Back to Live</span>
          </Link>
        </div>
      </div>
    );
  }

  // ── Stream ended screen ──────────────────────────────────────────────────────
  if (streamEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📺</div>
          <p className="text-xl font-bold text-white mb-2">Stream Ended</p>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
            {feed.hostName} has ended the stream.
          </p>
          <Link href="/live">
            <button className="vl-btn-primary px-6 py-2.5 text-sm">Browse Other Streams</button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Main layout ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#09091a" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/live">
          <button className="flex items-center gap-1.5 text-sm transition-colors hover:text-white"
            style={{ color: "rgba(255,255,255,0.5)" }}>
            <ChevronLeft className="w-4 h-4" /> Back to Live
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="vl-badge-live flex items-center gap-1 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </span>
          <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }}>
            <Eye className="w-3 h-3" /> {viewerCount.toLocaleString()}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono"
          style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }}>
          <Zap className="w-3 h-3" /> {credits.toLocaleString()}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 114px)" }}>
        {/* ── Video column ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Video area */}
          <div className="relative flex-1 bg-black flex items-center justify-center" style={{ minHeight: 0 }}>
            {/* Thumbnail as placeholder until WebRTC connects */}
            <img
              src={feed.thumbnailUrl}
              alt={feed.title}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.6 }}
            />
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={muted}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: "none" }}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(9,9,26,0.8) 0%, transparent 50%, rgba(9,9,26,0.4) 100%)" }} />

            {/* Stream info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-3">
                  <img src={feed.hostAvatarUrl} alt={feed.hostName}
                    className="w-12 h-12 rounded-full border-2 object-cover"
                    style={{ borderColor: "#14b8a6" }} />
                  <div>
                    <p className="font-bold text-white text-sm">{feed.hostName}</p>
                    <p className="text-xs line-clamp-1" style={{ color: "rgba(255,255,255,0.6)" }}>{feed.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Mute toggle */}
                  <button
                    onClick={() => setMuted(m => !m)}
                    className="p-2 rounded-lg transition-all hover:bg-white/10"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                  >
                    {muted
                      ? <VolumeX className="w-4 h-4 text-white" />
                      : <Volume2 className="w-4 h-4 text-white" />}
                  </button>
                  <button className="p-2 rounded-lg transition-all hover:bg-white/10" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <Maximize2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="absolute top-3 left-3 flex gap-1 flex-wrap">
              {feed.isVip && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold"
                  style={{ background: "rgba(139,92,246,0.9)", color: "white" }}>
                  <Crown className="w-3 h-3" /> VIP
                </span>
              )}
              {feed.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-xs"
                  style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.7)" }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Gift panel (expandable) */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(9,9,26,0.95)" }}>
            <button
              onClick={() => setShowGifts(g => !g)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-all hover:bg-white/5"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              <span className="flex items-center gap-2">
                <Gift className="w-4 h-4" style={{ color: "#e8a87c" }} />
                Send a Gift
              </span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                {showGifts ? "▲ Hide" : "▼ Show"} • {credits.toLocaleString()} credits
              </span>
            </button>

            {showGifts && (
              <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
                {QUICK_GIFTS.map(gift => (
                  <button
                    key={gift.id}
                    onClick={() => sendGift(gift)}
                    disabled={credits < gift.creditCost}
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-center flex-shrink-0 transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: sentGift === gift.id ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.04)",
                      border: sentGift === gift.id ? "1px solid #14b8a6" : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <span className="text-2xl">{gift.emoji}</span>
                    <span className="text-xs text-white font-medium">{gift.name}</span>
                    <span className="text-xs" style={{ color: "#14b8a6" }}>{gift.creditCost} cr</span>
                  </button>
                ))}
                <Link href="/gifts">
                  <button className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl flex-shrink-0 transition-all hover:scale-105"
                    style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)" }}>
                    <span className="text-2xl">🎁</span>
                    <span className="text-xs font-medium" style={{ color: "#14b8a6" }}>More</span>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Gifts</span>
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Chat sidebar ─────────────────────────────────────────────────── */}
        <div className="flex flex-col w-80 flex-shrink-0" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", background: "rgba(9,9,26,0.98)" }}>
          {/* Chat header */}
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <Users className="w-4 h-4" style={{ color: "rgba(255,255,255,0.35)" }} />
            <span className="text-sm font-semibold text-white">Live Chat</span>
            <span className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              {viewerCount.toLocaleString()} watching
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2" style={{ minHeight: 0 }}>
            {msgs.map(msg => (
              <div key={msg.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white" }}>
                  {msg.username[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1 flex-wrap">
                    <span className="text-xs font-bold" style={{ color: msg.creditTip > 0 ? "#e8a87c" : "#14b8a6" }}>
                      {msg.username}
                    </span>
                    {msg.creditTip > 0 && (
                      <span className="text-xs px-1.5 rounded font-bold"
                        style={{ background: "rgba(232,168,124,0.15)", color: "#e8a87c" }}>
                        +{msg.creditTip} tip
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed break-words" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {msg.text}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Say something…"
                maxLength={500}
                className="flex-1 px-3 py-2 rounded-lg text-sm text-white min-w-0"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }}
              />
              <button
                onClick={sendMessage}
                disabled={!draft.trim()}
                className="p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: draft.trim() ? "#14b8a6" : "rgba(255,255,255,0.05)" }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-xs mt-1.5 text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
              Be respectful · No spam
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
