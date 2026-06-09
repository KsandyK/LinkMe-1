/**
 * CRAVR — Stream Viewer Page
 * Velvet Dark Design System
 */

import { useState, useEffect, useRef, useCallback } from "react";
// hls.js is loaded dynamically so it doesn't bloat the initial bundle.
// It's only needed when a real HLS stream URL is present.
type HlsType = typeof import("hls.js").default;
import { Link, useParams, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { livefeeds as liveApi, gifts as giftsApi, LiveFeedItem, GiftItem } from "@/lib/api";
import { MOCK_LIVE_FEEDS, MOCK_GIFTS } from "@/lib/mock-data";
import { createLiveSocket, CravrSocket } from "@/lib/socket";
import {
  ChevronLeft, Eye, Gift, Zap, Send, Users, MessageCircle,
  Volume2, VolumeX, Maximize2, Minimize2, Crown, Radio, Loader2, ChevronDown, Target, BarChart, Sparkles, X,
  Bell, CheckCircle2, CreditCard, Star,
} from "lucide-react";
import { ReportButton } from "@/components/ReportButton";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMsg {
  id: string;
  userId: string;
  username: string;
  text: string;
  creditTip: number;
  createdAt: string;
  /** Equipped profile badge emoji, shown before username */
  badge?: string;
}

// ── Creator Drop (sent FROM creator TO viewers) ───────────────────────────────
const DROP_STORAGE_KEY = "vl_active_drop_v1";

interface CreatorDropClaim { username: string; claimedAt: number; }
interface CreatorDropState {
  id: string;
  creatorUsername: string;
  typeId: string;
  typeEmoji: string;
  typeName: string;
  description: string;
  quantity: number;        // -1 = unlimited
  claimWindowMs: number;
  startedAt: number;
  isActive: boolean;
  claims: CreatorDropClaim[];
}

// ── Creator subscription tiers ─────────────────────────────────────────────────
// These are CREATOR-specific subscriptions — money goes to the creator.
// Completely separate from the site's own membership/boost system.
// No platform credits involved.
interface CreatorSubTier {
  id: string; name: string; emoji: string;
  price: number; priceStr: string; color: string;
  popular: boolean; perks: string[];
}
const CREATOR_SUB_TIERS: CreatorSubTier[] = [
  // ── First 5 (shown by default) ────────────────────────────────────────────
  {
    id: "fan", name: "Fan", emoji: "❤️", price: 4.99, priceStr: "$4.99",
    color: "#f43f5e", popular: false,
    perks: [
      "Fan ❤️ badge displayed next to your name in live chat",
      "Access to subscriber-only posts & locked content",
      "Priority placement in the live chat queue",
    ],
  },
  {
    id: "supporter", name: "Supporter", emoji: "🔥", price: 9.99, priceStr: "$9.99",
    color: "#f97316", popular: false,
    perks: [
      "Supporter 🔥 badge in live chat",
      "Subscriber-only posts + content unlocked 48 hrs early",
      "Priority placement in the live chat queue",
      "Personal shoutout by name during live streams",
    ],
  },
  {
    id: "vip", name: "VIP", emoji: "⭐", price: 19.99, priceStr: "$19.99",
    color: "#8b5cf6", popular: true,
    perks: [
      "VIP ⭐ badge + direct message access to the creator",
      "Subscriber-only posts + early content + VIP-exclusive drops",
      "Priority chat placement in every live stream",
      "Monthly private Q&A session with the creator",
    ],
  },
  {
    id: "super_vip", name: "Super VIP", emoji: "👑", price: 49.99, priceStr: "$49.99",
    color: "#f59e0b", popular: false,
    perks: [
      "Super VIP 👑 badge + DM access + all subscriber content",
      "One custom content request per month",
      "Invitations to private subscriber-only streams",
      "Monthly 1-on-1 video call with the creator (15 min)",
    ],
  },
  {
    id: "elite", name: "Elite", emoji: "💎", price: 99.99, priceStr: "$99.99",
    color: "#06b6d4", popular: false,
    perks: [
      "Elite 💎 badge + DM access + all subscriber content",
      "Weekly 1-on-1 video calls (30 min each)",
      "Your name permanently featured in the creator's bio",
      "Guaranteed DM reply within 24 hours",
    ],
  },
  // ── Next 5 (revealed via Show More) ──────────────────────────────────────
  {
    id: "diamond", name: "Diamond", emoji: "💠", price: 299.99, priceStr: "$299.99",
    color: "#38bdf8", popular: false,
    perks: [
      "Diamond 💠 badge + all subscriber content",
      "Monthly personalized video message recorded just for you",
      "Behind-the-scenes content not available anywhere else",
      "First access to merchandise before public release",
      "Vote on upcoming content topics and formats",
    ],
  },
  {
    id: "platinum", name: "Platinum", emoji: "🪙", price: 499.99, priceStr: "$499.99",
    color: "#cbd5e1", popular: false,
    perks: [
      "Platinum 🪙 badge + bi-weekly calls + all subscriber content",
      "Unlimited direct messages to the creator, any time",
      "Your name credited in content descriptions & posts",
      "Guaranteed reply to every message within 24 hours",
    ],
  },
  {
    id: "legend", name: "Legend", emoji: "🏆", price: 999.99, priceStr: "$999.99",
    color: "#fbbf24", popular: false,
    perks: [
      "Legend 🏆 badge + unlimited DMs + all subscriber content",
      "Monthly exclusive private livestream for Legend members only",
      "Named as a character or reference in the creator's content",
      "Priority response to every DM within 12 hours",
    ],
  },
  {
    id: "icon", name: "Icon", emoji: "⚡", price: 2499.99, priceStr: "$2,499.99",
    color: "#f43f5e", popular: false,
    perks: [
      "Icon ⚡ status badge + every benefit across all tiers included",
      "Full creative collaboration — shape content direction together",
      "Lifetime VIP fan status that never expires, even if you pause",
      "Personal dedication in every new content release",
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function StreamView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { credits, spendCredits, recordPurchase, token, user, isLoggedIn, showToast } = useApp();

  // Auth gate — redirect to login if not signed in (debounced 500ms to avoid flash on load)
  useEffect(() => {
    if (!isLoggedIn) {
      const t = setTimeout(() => navigate("/login"), 500);
      return () => clearTimeout(t);
    }
  }, [isLoggedIn, navigate]);

  const [feed, setFeed] = useState<LiveFeedItem | null>(null);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedNotFound, setFeedNotFound] = useState(false);
  const [quickGifts, setQuickGifts] = useState<GiftItem[]>([]);

  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  /** Current user's equipped badge emoji — read from localStorage, refreshes on mount */
  const myBadge = localStorage.getItem("vl_equipped_badge_emoji_v1") || undefined;
  const [viewerCount, setViewerCount] = useState(0);
  const [muted, setMuted] = useState(true);
  const [showGifts, setShowGifts] = useState(false);
  const [showAllGifts, setShowAllGifts] = useState(false);
  const [allGifts, setAllGifts] = useState<GiftItem[]>([]);
  const [sentGift, setSentGift] = useState<string | null>(null);
  const [streamEnded, setStreamEnded] = useState(false);
  const [showTipMenu, setShowTipMenu] = useState(false);

  // Subscribe modal state — tier persisted per-creator in localStorage
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showMoreTiers, setShowMoreTiers] = useState(false);
  const [subscribedTier, setSubscribedTier] = useState<string | null>(() => {
    try { return localStorage.getItem(`vl_creator_sub_${id}`) ?? null; } catch { return null; }
  });
  // Reset "show more" expansion whenever the modal is closed
  useEffect(() => { if (!showSubscribeModal) setShowMoreTiers(false); }, [showSubscribeModal]);
  const [subscribeNoCard, setSubscribeNoCard] = useState(false);
  const [subscribePending, setSubscribePending] = useState<{
    tier: string; name: string; priceStr: string; emoji: string; onConfirm: () => void;
  } | null>(null);
  const [savedCards] = useState<{ id: string; last4: string; brand: string; isDefault: boolean }[]>(() => {
    try { return JSON.parse(localStorage.getItem("vl_saved_cards_v1") ?? "[]"); } catch { return []; }
  });
  const defaultCard = savedCards.find(c => c.isDefault) ?? savedCards[0] ?? null;

  // Drop state
  const [activeDrop, setActiveDrop] = useState<CreatorDropState | null>(null);
  const [dropSecsLeft, setDropSecsLeft] = useState(0);
  const [dropClaimed, setDropClaimed] = useState(false); // did THIS viewer claim?

  // Demo tip goal (simulates creator having set a goal — visible to viewers)
  const [tipGoal] = useState({ title: "Special Show 🔥", target: 1000, current: 347 });
  const [goalProgress, setGoalProgress] = useState(347);
  const [goalReached, setGoalReached] = useState(false);
  const prevGoalRef = useRef(347);

  // Confetti burst when tip goal crosses target threshold
  useEffect(() => {
    if (!goalReached && goalProgress >= tipGoal.target && prevGoalRef.current < tipGoal.target) {
      setGoalReached(true);
      showToast({ title: "🎉 Tip Goal Reached!", description: `${tipGoal.title} — the creator will perform the special show!` });
      setTimeout(() => setGoalReached(false), 4000);
    }
    prevGoalRef.current = goalProgress;
  }, [goalProgress, tipGoal.target, tipGoal.title, goalReached, showToast]);

  // Demo tip menu (mirrors what creators build in the Live Studio)
  const DEMO_TIP_MENU = [
    { emoji: "💋", name: "Blowing Kiss", credits: 25 },
    { emoji: "👋", name: "Wave to Cam", credits: 50 },
    { emoji: "💃", name: "Dance for Me", credits: 150 },
    { emoji: "🎵", name: "Song Request", credits: 200 },
    { emoji: "📸", name: "Selfie Snap", credits: 300 },
    { emoji: "🔥", name: "Special Show", credits: 1000 },
  ];

  const chatEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<CravrSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsChatOpen, setFsChatOpen] = useState(true);
  const [fsTipOpen, setFsTipOpen] = useState(false);
  const [fsTipTab, setFsTipTab] = useState<"gifts" | "menu">("gifts");
  const fsChatEndRef = useRef<HTMLDivElement>(null);
  const giftDropdownRef = useRef<HTMLDivElement>(null);

  // Close gift dropdown on outside click; reset expanded state when closed
  useEffect(() => {
    if (!showGifts) {
      setShowAllGifts(false);
      return;
    }
    const handler = (e: MouseEvent) => {
      if (giftDropdownRef.current && !giftDropdownRef.current.contains(e.target as Node)) {
        setShowGifts(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showGifts]);

  // Load feed from API (fallback to mock data when API is unreachable)
  useEffect(() => {
    if (!id) return;
    setLoadingFeed(true);
    liveApi.get(id)
      .then(data => {
        setFeed(data);
        setViewerCount(data.viewerCount);
      })
      .catch(() => {
        // Match by feed id OR by hostId (so /live/profile-1 works in demo mode)
        const mock = MOCK_LIVE_FEEDS.find(f => f.id === id || f.hostId === id);
        if (mock) {
          const feedItem: LiveFeedItem = {
            id: mock.id,
            creatorId: mock.hostId ?? mock.id,
            title: mock.title,
            category: mock.category ?? null,
            isVip: mock.isVip ?? false,
            viewerCount: mock.viewerCount ?? 0,
            thumbnailUrl: mock.thumbnailUrl ?? null,
            tags: mock.tags ?? [],
            isLive: true,
            startedAt: mock.startedAt ?? new Date().toISOString(),
            endedAt: null,
            creator: {
              id: mock.hostId ?? mock.id,
              userId: mock.hostId ?? mock.id,
              user: {
                id: mock.hostId ?? mock.id,
                username: mock.hostName ?? "creator",
                profile: { displayName: mock.hostName ?? null, avatarUrl: mock.hostAvatarUrl ?? null },
              },
            },
          };
          setFeed(feedItem);
          setViewerCount(feedItem.viewerCount);
        } else {
          setFeedNotFound(true);
        }
      })
      .finally(() => setLoadingFeed(false));
  }, [id]);

  // Load gift catalogue (take 5 for quick gifts; keep full list for "More")
  useEffect(() => {
    giftsApi.catalogue()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setQuickGifts(list.slice(0, 5));
        setAllGifts(list);
      })
      .catch(() => {
        const mock = MOCK_GIFTS as GiftItem[];
        setQuickGifts(mock.slice(0, 5));
        setAllGifts(mock);
      });
  }, []);

  // Scroll chat to bottom on new messages (both normal + fullscreen chat)
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    fsChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // Poll localStorage for active creator drop (every 2 s)
  useEffect(() => {
    const poll = () => {
      try {
        const stored = localStorage.getItem(DROP_STORAGE_KEY);
        if (!stored) { setActiveDrop(null); return; }
        const state: CreatorDropState = JSON.parse(stored);
        const expired = Date.now() > state.startedAt + state.claimWindowMs;
        const full = state.quantity !== -1 && state.claims.length >= state.quantity;
        if (!state.isActive || expired || full) {
          setActiveDrop(null);
        } else {
          setActiveDrop(state);
          // Check if this viewer already claimed
          const myUsername = user?.username;
          if (myUsername && state.claims.some(c => c.username === myUsername)) {
            setDropClaimed(true);
          }
        }
      } catch { setActiveDrop(null); }
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [user?.username]);

  // Drop countdown (1-second tick when a drop is active)
  useEffect(() => {
    if (!activeDrop) { setDropSecsLeft(0); return; }
    const tick = () => {
      const left = Math.max(0, Math.round((activeDrop.startedAt + activeDrop.claimWindowMs - Date.now()) / 1000));
      setDropSecsLeft(left);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeDrop?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── WebSocket connection ────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const accessToken = token ?? localStorage.getItem("cravr_token");
    if (!accessToken) return; // guest — WS not available

    const ws = createLiveSocket(accessToken);
    wsRef.current = ws;

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
        badge: typeof data.badge === "string" ? data.badge : undefined,
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

  // ── Demo viewer count fluctuation (when WS is not connected) ──────────────
  useEffect(() => {
    if (!feed || viewerCount === 0) return;
    // Simulate realistic viewership: ±2–8% change every 8s with a slow drift
    const baseCount = viewerCount;
    let drift = 0;
    const sim = setInterval(() => {
      drift += (Math.random() - 0.48) * 0.015; // slight upward bias
      drift = Math.max(-0.25, Math.min(0.35, drift)); // cap drift
      const fluctuation = (Math.random() - 0.5) * 0.06; // ±3% noise
      const factor = 1 + drift + fluctuation;
      setViewerCount(Math.max(1, Math.round(baseCount * factor)));
    }, 8000);
    return () => clearInterval(sim);
  }, [feed?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── HLS.js player — loads dynamically, attaches when feed.hlsUrl is set ────
  // Dynamic import keeps hls.js (~500KB) out of the initial bundle.
  const hlsRef = useRef<InstanceType<HlsType> | null>(null);
  const hlsUrl  = (feed as (typeof feed & { hlsUrl?: string }) | null)?.hlsUrl ?? null;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    hlsRef.current?.destroy();

    import("hls.js").then(({ default: Hls }) => {
      if (Hls.isSupported()) {
        const hls = new Hls({ lowLatencyMode: false, maxBufferLength: 30 });
        hlsRef.current = hls;
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS
        video.src = hlsUrl;
        video.addEventListener("loadedmetadata", () => { video.play().catch(() => {}); });
      }
    }).catch(() => {});

    return () => { hlsRef.current?.destroy(); hlsRef.current = null; };
  }, [hlsUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep video mute state in sync with the muted toggle button
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // ── Fullscreen ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // ── Chat message credit cost (matches private message cost in Messages.tsx) ──
  const CHAT_CREDIT_COST = 5;

  // ── Send chat message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    const text = draft.trim();
    if (!text) return;

    if (!isLoggedIn) {
      showToast({ title: "Sign in to chat", description: "Create a free account to join the conversation." });
      return;
    }

    // Deduct chat credits (same cost as private messages)
    const ok = spendCredits(CHAT_CREDIT_COST, `Chat message in live stream`);
    if (!ok) return; // spendCredits shows "Insufficient credits" toast automatically

    setDraft("");

    if (wsRef.current?.isOpen) {
      wsRef.current.send({ type: "chat", text, creditTip: 0 });
    } else {
      setMsgs(prev => [...prev, {
        id: String(Date.now()),
        userId: user?.id ?? "guest",
        username: user?.username ?? "You",
        text,
        creditTip: 0,
        createdAt: new Date().toISOString(),
        badge: myBadge,
      }]);
    }
  }, [draft, user, isLoggedIn, spendCredits, showToast]);

  // ── Send gift / tip ─────────────────────────────────────────────────────────
  const sendGift = useCallback(async (gift: GiftItem) => {
    if (!feed) return;

    if (isLoggedIn) {
      // Real API call
      try {
        await giftsApi.send({ giftId: gift.id, recipientId: feed.creator.userId, feedId: feed.id });
        setSentGift(gift.id);
        setTimeout(() => setSentGift(null), 1500);
        setGoalProgress(p => Math.min(p + gift.creditCost, tipGoal.target));
        const text = `${gift.emoji} +${gift.creditCost} tip — ${gift.name}!`;
        if (wsRef.current?.isOpen) {
          wsRef.current.send({ type: "chat", text, creditTip: gift.creditCost });
        } else {
          setMsgs(prev => [...prev, {
            id: String(Date.now()), userId: user?.id ?? "me",
            username: user?.username ?? "You", text, badge: myBadge,
            creditTip: gift.creditCost, createdAt: new Date().toISOString(),
          }]);
        }
      } catch {
        // Any error (network, HTTP 502/503) → API offline — fall back to local demo mode
        const hostName = feed.creator?.user?.profile?.displayName ?? feed.creator?.user?.username ?? "Creator";
        const ok = spendCredits(gift.creditCost, `${gift.emoji} ${gift.name} tip to ${hostName}`);
        if (!ok) return;
        setSentGift(gift.id);
        setTimeout(() => setSentGift(null), 1500);
        setGoalProgress(p => Math.min(p + gift.creditCost, tipGoal.target));
        const text = `${gift.emoji} +${gift.creditCost} tip — ${gift.name}!`;
        setMsgs(prev => [...prev, {
          id: String(Date.now()), userId: user?.id ?? "me",
          username: user?.username ?? "You", text, badge: myBadge,
          creditTip: gift.creditCost, createdAt: new Date().toISOString(),
        }]);
      }
    } else {
      // Demo fallback
      const hostName = feed.creator?.user?.profile?.displayName ?? feed.creator?.user?.username ?? "Creator";
      const ok = spendCredits(gift.creditCost, `${gift.emoji} ${gift.name} tip to ${hostName}`);
      if (!ok) return;
      setSentGift(gift.id);
      setTimeout(() => setSentGift(null), 1500);
      setGoalProgress(p => Math.min(p + gift.creditCost, tipGoal.target));
      const text = `${gift.emoji} +${gift.creditCost} tip — ${gift.name}!`;
      setMsgs(prev => [...prev, {
        id: String(Date.now()), userId: user?.id ?? "me",
        username: user?.username ?? "You", text, badge: myBadge,
        creditTip: gift.creditCost, createdAt: new Date().toISOString(),
      }]);
    }
  }, [feed, isLoggedIn, spendCredits, user, showToast, tipGoal.target]);

  // ── Send tip menu item ──────────────────────────────────────────────────────
  const sendTipItem = useCallback((item: { emoji: string; name: string; credits: number }) => {
    if (!feed) return;
    const hostName = feed.creator?.user?.profile?.displayName ?? feed.creator?.user?.username ?? "Creator";
    const ok = spendCredits(item.credits, `${item.emoji} ${item.name} to ${hostName}`);
    if (!ok) return;
    setSentGift(`tip-${item.name}`);
    setTimeout(() => setSentGift(null), 1500);
    setGoalProgress(p => Math.min(p + item.credits, tipGoal.target));
    const text = `${item.emoji} ${item.name} — ${item.credits} cr tip!`;
    if (wsRef.current?.isOpen) {
      wsRef.current.send({ type: "chat", text, creditTip: item.credits });
    } else {
      setMsgs(prev => [...prev, {
        id: String(Date.now()), userId: user?.id ?? "me",
        username: user?.username ?? "You", text, badge: myBadge,
        creditTip: item.credits, createdAt: new Date().toISOString(),
      }]);
    }
    showToast({ title: `${item.emoji} Sent!`, description: `You sent ${item.name} (${item.credits} cr)` });
  }, [feed, spendCredits, user, tipGoal.target, showToast]);

  // ── Claim an active Creator Drop (free — creator sends gifts to viewers) ─────
  const handleDropClaim = useCallback(() => {
    if (!activeDrop || !activeDrop.isActive || dropClaimed) return;
    const username = user?.username ?? "Viewer";

    // Write claim to shared localStorage so Studio picks it up
    try {
      const stored = localStorage.getItem(DROP_STORAGE_KEY);
      if (stored) {
        const state: CreatorDropState = JSON.parse(stored);
        // Guard: already claimed (race condition)
        if (state.claims.some(c => c.username === username)) {
          setDropClaimed(true);
          return;
        }
        const updated: CreatorDropState = {
          ...state,
          claims: [...state.claims, { username, claimedAt: Date.now() }],
        };
        localStorage.setItem(DROP_STORAGE_KEY, JSON.stringify(updated));
        setActiveDrop(updated);
      }
    } catch {}

    setDropClaimed(true);

    // Announce in chat
    setMsgs(prev => [...prev, {
      id: String(Date.now()),
      userId: user?.id ?? "me",
      username: user?.username ?? "You",
      text: `🎁 I just claimed the drop: ${activeDrop.typeEmoji} ${activeDrop.description}!`,
      creditTip: 0,
      createdAt: new Date().toISOString(),
      badge: myBadge,
    }]);

    showToast({ title: "🎁 Claimed!", description: activeDrop.description });
  }, [activeDrop, dropClaimed, user, showToast]);

  // ── Loading / 404 ────────────────────────────────────────────────────────────
  if (loadingFeed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#14b8a6" }} />
      </div>
    );
  }

  if (feedNotFound || !feed) {
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

  const hostProfile = feed.creator?.user?.profile;
  const hostName = hostProfile?.displayName ?? feed.creator?.user?.username ?? "Creator";
  const hostAvatar = hostProfile?.avatarUrl
    ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${feed.creator?.user?.username ?? feed.id}`;
  const thumbnail = feed.thumbnailUrl
    ?? `https://picsum.photos/seed/${feed.id}-thumb/1280/720`;

  // ── Stream ended screen ──────────────────────────────────────────────────────
  if (streamEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📺</div>
          <p className="text-xl font-bold text-white mb-2">Stream Ended</p>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
            {hostName} has ended the stream.
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
        {/* Left: back */}
        <Link href="/live">
          <button className="flex items-center gap-1.5 text-sm transition-colors hover:text-white"
            style={{ color: "rgba(255,255,255,0.5)" }}>
            <ChevronLeft className="w-4 h-4" /> Back to Live
          </button>
        </Link>

        {/* Center: LIVE + viewer count + Subscribe */}
        <div className="flex items-center gap-2">
          <span className="vl-badge-live flex items-center gap-1 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </span>
          <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }}>
            <Eye className="w-3 h-3" /> {viewerCount.toLocaleString()}
          </div>
          {/* Subscribe button */}
          <button
            onClick={() => setShowSubscribeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90 active:scale-95"
            style={subscribedTier
              ? { background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.4)", color: "#14b8a6" }
              : { background: "linear-gradient(135deg, #ec4899, #a855f7)", color: "white", boxShadow: "0 0 12px rgba(236,72,153,0.35)" }
            }
          >
            {subscribedTier
              ? <><CheckCircle2 className="w-3 h-3" /> Subscribed</>
              : <><Bell className="w-3 h-3" /> Subscribe</>
            }
          </button>
          {/* Report stream */}
          {feed?.creator?.userId && (
            <ReportButton
              reportedUserId={feed.creator.userId}
              contentType="stream"
              contentId={feed.id}
              variant="icon"
              className="p-1.5 rounded-lg transition-all hover:bg-white/5"
            />
          )}
        </div>

        {/* Right: gift dropdown + credits */}
        <div className="flex items-center gap-2">
          {/* Gift dropdown */}
          <div className="relative" ref={giftDropdownRef}>
            <button
              onClick={() => setShowGifts(g => !g)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: showGifts ? "rgba(232,168,124,0.18)" : "rgba(232,168,124,0.08)",
                border: `1px solid ${showGifts ? "rgba(232,168,124,0.45)" : "rgba(232,168,124,0.2)"}`,
                color: "#e8a87c",
              }}
            >
              <Gift className="w-3.5 h-3.5" />
              Send Gift
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showGifts ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown panel */}
            {showGifts && (
              <div
                className="absolute right-0 top-full mt-2 z-50 rounded-xl overflow-hidden"
                style={{
                  background: "rgba(13,13,30,0.97)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                  minWidth: "340px",
                }}
              >
                {/* Dropdown header */}
                <div className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5" style={{ color: "#e8a87c" }} />
                    Send a Gift
                  </span>
                  <span className="text-xs font-mono" style={{ color: "#14b8a6" }}>
                    ⚡ {credits.toLocaleString()} credits
                  </span>
                </div>

                {/* Gift grid */}
                {!showAllGifts ? (
                  <div className="flex gap-2 p-3 overflow-x-auto">
                    {quickGifts.map(gift => (
                      <button
                        key={gift.id}
                        onClick={() => { sendGift(gift); setShowGifts(false); }}
                        disabled={credits < gift.creditCost}
                        className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl flex-shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: sentGift === gift.id ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.05)",
                          border: sentGift === gift.id ? "1px solid #14b8a6" : "1px solid rgba(255,255,255,0.08)",
                          minWidth: "68px",
                        }}
                      >
                        <span className="text-2xl leading-none">{gift.emoji}</span>
                        <span className="text-xs text-white font-semibold mt-1">{gift.name}</span>
                        <span className="text-xs" style={{ color: "#14b8a6" }}>{gift.creditCost} cr</span>
                      </button>
                    ))}

                    {/* More gifts — expand inline */}
                    {allGifts.length > 5 && (
                      <button
                        onClick={() => setShowAllGifts(true)}
                        className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl flex-shrink-0 transition-all hover:scale-105"
                        style={{
                          background: "rgba(20,184,166,0.06)",
                          border: "1px solid rgba(20,184,166,0.2)",
                          minWidth: "68px",
                        }}>
                        <span className="text-2xl leading-none">🎁</span>
                        <span className="text-xs font-semibold mt-1" style={{ color: "#14b8a6" }}>More</span>
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Gifts</span>
                      </button>
                    )}
                  </div>
                ) : (
                  /* Expanded: all gifts in a scrollable grid */
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">All Gifts</span>
                      <button onClick={() => setShowAllGifts(false)} className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        ← Back
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto">
                      {allGifts.map(gift => (
                        <button
                          key={gift.id}
                          onClick={() => { sendGift(gift); setShowGifts(false); setShowAllGifts(false); }}
                          disabled={credits < gift.creditCost}
                          className="flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{
                            background: sentGift === gift.id ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.05)",
                            border: sentGift === gift.id ? "1px solid #14b8a6" : "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <span className="text-xl leading-none">{gift.emoji}</span>
                          <span className="text-xs text-white font-medium mt-0.5 text-center leading-tight">{gift.name}</span>
                          <span className="text-xs font-mono" style={{ color: "#14b8a6" }}>{gift.creditCost} cr</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Credits balance */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono"
            style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }}>
            <Zap className="w-3 h-3" /> {credits.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Tip goal bar + floating tip menu */}
      <div className="relative flex-shrink-0">
        <div className="px-4 py-2 flex items-center gap-4"
          style={{ background: "rgba(20,184,166,0.07)", borderBottom: "1px solid rgba(20,184,166,0.15)" }}>
          <Target className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#14b8a6" }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-white">{tipGoal.title}</span>
              <span className="text-xs font-mono" style={{ color: "#14b8a6" }}>
                {goalProgress.toLocaleString()} / {tipGoal.target.toLocaleString()} cr
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (goalProgress / tipGoal.target) * 100)}%`, background: "linear-gradient(90deg, #14b8a6, #0d9488)" }} />
            </div>
          </div>
          {/* Tip menu toggle */}
          <button onClick={() => setShowTipMenu(s => !s)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all"
            style={showTipMenu
              ? { background: "rgba(232,168,124,0.18)", border: "1px solid rgba(232,168,124,0.4)", color: "#e8a87c" }
              : { background: "rgba(232,168,124,0.07)", border: "1px solid rgba(232,168,124,0.2)", color: "#e8a87c" }
            }>
            <BarChart className="w-3.5 h-3.5" /> Tip Menu
          </button>
        </div>

        {/* Tip menu — absolute overlay so it floats over video, never shifts layout */}
        {showTipMenu && (
          <div className="absolute left-0 right-0 z-40 px-4 py-3"
            style={{
              top: "100%",
              background: "rgba(13,13,30,0.97)",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-white">💸 Tip Menu — tap to send:</p>
              <button onClick={() => setShowTipMenu(false)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                style={{ color: "rgba(255,255,255,0.35)" }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {DEMO_TIP_MENU.map(item => (
                <button
                  key={item.name}
                  onClick={() => { sendTipItem(item); setShowTipMenu(false); }}
                  disabled={credits < item.credits}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: sentGift === `tip-${item.name}` ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.05)",
                    border: sentGift === `tip-${item.name}` ? "1px solid #14b8a6" : "1px solid rgba(255,255,255,0.08)",
                  }}>
                  <span className="text-base">{item.emoji}</span>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-white">{item.name}</p>
                    <p className="text-xs font-mono" style={{ color: "#14b8a6" }}>{item.credits} cr</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── CREATOR DROP banner — free gift from creator to viewers ────────── */}
      {activeDrop && (
        <div className="px-4 py-2.5 flex items-center gap-3 flex-shrink-0"
          style={{ background: "linear-gradient(90deg, rgba(20,184,166,0.1), rgba(232,168,124,0.06))", borderBottom: "1px solid rgba(20,184,166,0.25)" }}>
          <Gift className="w-4 h-4 animate-pulse flex-shrink-0" style={{ color: "#14b8a6" }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white">
                {activeDrop.typeEmoji} DROP — {activeDrop.typeName}
              </span>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                style={{ background: "rgba(20,184,166,0.15)", color: "#5eead4" }}>
                {dropSecsLeft > 60
                  ? `${Math.floor(dropSecsLeft / 60)}m ${dropSecsLeft % 60}s left`
                  : `${dropSecsLeft}s left`}
              </span>
              {activeDrop.quantity !== -1 && (
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  · {activeDrop.quantity - activeDrop.claims.length} slots left
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              {activeDrop.description}
            </p>
          </div>
          {dropClaimed ? (
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0"
              style={{ background: "rgba(20,184,166,0.15)", color: "#5eead4", border: "1px solid rgba(20,184,166,0.3)" }}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Claimed!
            </div>
          ) : (
            <button
              onClick={handleDropClaim}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white", boxShadow: "0 4px 12px rgba(20,184,166,0.35)" }}>
              <Gift className="w-3.5 h-3.5" /> CLAIM NOW — FREE
            </button>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* ── Video column ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* ── Video area ────────────────────────────────────────────────────── */}
          {/* HLS.js when feed.hlsUrl is set; animated demo placeholder otherwise */}
          <div ref={videoContainerRef} className="relative flex-1 bg-black flex items-center justify-center" style={{ minHeight: 0 }}>
            {/* HLS video element — visible when live stream is active */}
            <video ref={videoRef} autoPlay playsInline muted={muted}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: hlsUrl ? "block" : "none" }} />

            {/* Demo placeholder — shown when no real HLS stream is attached */}
            {!hlsUrl && (<>
              <img src={thumbnail} alt={feed.title}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: 0.35, filter: "blur(12px)", transform: "scale(1.08)" }} />
              <div className="absolute inset-0" style={{
                background: "linear-gradient(135deg, rgba(9,9,26,0.7) 0%, rgba(20,184,166,0.08) 50%, rgba(9,9,26,0.7) 100%)",
                animation: "pulse 3s ease-in-out infinite",
              }} />
              <div className="relative z-10 text-center pointer-events-none select-none">
                <img src={hostAvatar} alt={hostName}
                  className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-4"
                  style={{ borderColor: "#14b8a6", boxShadow: "0 0 40px rgba(20,184,166,0.4)" }} />
                <p className="font-bold text-white text-lg mb-1">{hostName}</p>
                <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>{feed.title}</p>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(20,184,166,0.3)", color: "#5eead4", backdropFilter: "blur(8px)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                  DEMO STREAM — Live video coming soon
                </div>
              </div>
            </>)}

            {/* Confetti burst overlay when tip goal is reached */}
            {goalReached && (
              <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                <div className="text-center animate-bounce">
                  <div className="text-5xl mb-2">🎉</div>
                  <div className="text-xl font-bold text-white drop-shadow-lg">Goal Reached!</div>
                  <div className="text-sm mt-1" style={{ color: "#14b8a6" }}>{tipGoal.title}</div>
                </div>
                {["🎊", "✨", "🌟", "💫", "🎉"].map((e, idx) => (
                  <div key={idx} className="absolute text-2xl animate-ping"
                    style={{ top: `${20 + idx * 15}%`, left: `${10 + idx * 18}%`, animationDelay: `${idx * 0.15}s`, animationDuration: "0.8s" }}>
                    {e}
                  </div>
                ))}
              </div>
            )}

            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(9,9,26,0.85) 0%, transparent 45%, rgba(9,9,26,0.3) 100%)" }} />

            {/* ── Fullscreen chat overlay ──────────────────────────────────── */}
            {isFullscreen && (
              <>
                {/* Toggle button */}
                <button
                  onClick={() => setFsChatOpen(o => !o)}
                  className="absolute top-4 right-4 z-30 p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:opacity-90"
                  style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)" }}>
                  <MessageCircle className="w-4 h-4" />
                  {fsChatOpen ? "Hide Chat" : "Show Chat"}
                </button>

                {/* Chat panel */}
                {fsChatOpen && (
                  <div className="absolute top-0 right-0 bottom-0 z-20 flex flex-col"
                    style={{ width: "320px", background: "rgba(9,9,26,0.82)", backdropFilter: "blur(12px)", borderLeft: "1px solid rgba(255,255,255,0.08)" }}>

                    {/* Header */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-bold text-white">Live Chat</span>
                      <span className="text-xs ml-auto" style={{ color: "rgba(255,255,255,0.35)" }}>{msgs.length} messages</span>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ scrollbarWidth: "none" }}>
                      {msgs.length === 0 && (
                        <p className="text-xs text-center py-4" style={{ color: "rgba(255,255,255,0.3)" }}>Chat is live — say something!</p>
                      )}
                      {msgs.map(msg => (
                        <div key={msg.id} className="flex gap-2">
                          <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                            style={{ background: "linear-gradient(135deg,#14b8a6,#0d9488)", color: "white" }}>
                            {msg.username[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-1 flex-wrap">
                              {msg.badge && <span className="text-xs leading-none">{msg.badge}</span>}
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
                            <p className="text-xs leading-relaxed break-words" style={{ color: "rgba(255,255,255,0.75)" }}>{msg.text}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={fsChatEndRef} />
                    </div>

                    {/* ── Tip widget ─────────────────────────────────────── */}
                    <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                      {/* Toggle bar */}
                      <button
                        onClick={() => setFsTipOpen(o => !o)}
                        className="w-full flex items-center justify-between px-4 py-2.5 transition-all hover:bg-white/5"
                        style={{ color: fsTipOpen ? "#e8a87c" : "rgba(255,255,255,0.5)" }}>
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <Gift className="w-3.5 h-3.5" />
                          Send a Tip
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 transition-transform" style={{ transform: fsTipOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                      </button>

                      {/* Expanded tip panel */}
                      {fsTipOpen && (
                        <div style={{ background: "rgba(0,0,0,0.35)" }}>
                          {/* Tab switcher */}
                          <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                            <button
                              onClick={() => setFsTipTab("gifts")}
                              className="flex-1 py-2 text-xs font-semibold transition-colors"
                              style={{ color: fsTipTab === "gifts" ? "#14b8a6" : "rgba(255,255,255,0.35)", borderBottom: fsTipTab === "gifts" ? "2px solid #14b8a6" : "2px solid transparent" }}>
                              🎁 Gifts
                            </button>
                            <button
                              onClick={() => setFsTipTab("menu")}
                              className="flex-1 py-2 text-xs font-semibold transition-colors"
                              style={{ color: fsTipTab === "menu" ? "#e8a87c" : "rgba(255,255,255,0.35)", borderBottom: fsTipTab === "menu" ? "2px solid #e8a87c" : "2px solid transparent" }}>
                              💸 Tip Menu
                            </button>
                          </div>

                          {/* Gifts tab */}
                          {fsTipTab === "gifts" && (
                            <div className="grid grid-cols-3 gap-2 px-3 py-2.5 max-h-44 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                              {allGifts.map(gift => (
                                <button
                                  key={gift.id}
                                  onClick={() => { sendGift(gift); setFsTipOpen(false); }}
                                  disabled={credits < gift.creditCost}
                                  className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                  style={{
                                    background: sentGift === gift.id ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.05)",
                                    border: sentGift === gift.id ? "1px solid #14b8a6" : "1px solid rgba(255,255,255,0.1)",
                                  }}>
                                  <span className="text-2xl leading-none">{gift.emoji}</span>
                                  <span className="text-xs text-white font-semibold mt-1 text-center leading-tight">{gift.name}</span>
                                  <span className="text-xs font-mono" style={{ color: "#14b8a6" }}>{gift.creditCost} cr</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Tip menu tab */}
                          {fsTipTab === "menu" && (
                            <div className="grid grid-cols-2 gap-2 px-3 py-2.5">
                              {DEMO_TIP_MENU.map(item => (
                                <button
                                  key={item.name}
                                  onClick={() => { sendTipItem(item); setFsTipOpen(false); }}
                                  disabled={credits < item.credits}
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                  style={{
                                    background: sentGift === `tip-${item.name}` ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.05)",
                                    border: sentGift === `tip-${item.name}` ? "1px solid #14b8a6" : "1px solid rgba(255,255,255,0.08)",
                                  }}>
                                  <span className="text-lg">{item.emoji}</span>
                                  <div className="text-left min-w-0">
                                    <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                                    <p className="text-xs font-mono" style={{ color: "#e8a87c" }}>{item.credits} cr</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Input */}
                    <div className="px-3 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                      <div className="flex gap-2">
                        <input
                          value={draft}
                          onChange={e => setDraft(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                          placeholder={isLoggedIn ? "Say something…" : "Sign in to chat"}
                          disabled={!isLoggedIn}
                          className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!draft.trim() || !isLoggedIn}
                          className="p-2 rounded-xl transition-all disabled:opacity-40"
                          style={{ background: "#14b8a6" }}>
                          <Send className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      <p className="text-xs mt-1.5 text-center" style={{ color: "rgba(255,255,255,0.25)" }}>5 credits per message</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Stream info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-3">
                  <img src={hostAvatar} alt={hostName}
                    className="w-12 h-12 rounded-full border-2 object-cover"
                    style={{ borderColor: "#14b8a6" }} />
                  <div>
                    <p className="font-bold text-white text-sm">{hostName}</p>
                    <p className="text-xs line-clamp-1" style={{ color: "rgba(255,255,255,0.6)" }}>{feed.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMuted(m => !m)}
                    className="p-2 rounded-lg transition-all hover:bg-white/10"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                  >
                    {muted
                      ? <VolumeX className="w-4 h-4 text-white" />
                      : <Volume2 className="w-4 h-4 text-white" />}
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-lg transition-all hover:bg-white/10"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                    title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
                    {isFullscreen
                      ? <Minimize2 className="w-4 h-4 text-white" />
                      : <Maximize2 className="w-4 h-4 text-white" />}
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

            {/* Drop claimed confirmation flash */}
            {dropClaimed && activeDrop && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                style={{ animation: "fade-up 0.35s ease-out both" }}>
                <div className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold"
                  style={{
                    background: "rgba(13,13,30,0.97)",
                    border: "2px solid rgba(20,184,166,0.5)",
                    boxShadow: "0 0 32px rgba(20,184,166,0.3)",
                    color: "white",
                  }}>
                  <span className="text-2xl">{activeDrop.typeEmoji}</span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: "#5eead4" }}>🎁 Drop Claimed!</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{activeDrop.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── Chat sidebar ─────────────────────────────────────────────────── */}
        <div className="flex flex-col w-80 flex-shrink-0" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", background: "rgba(9,9,26,0.98)" }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <Users className="w-4 h-4" style={{ color: "rgba(255,255,255,0.35)" }} />
            <span className="text-sm font-semibold text-white">Live Chat</span>
            <span className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              {viewerCount.toLocaleString()} watching
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2" style={{ minHeight: 0 }}>
            {msgs.length === 0 && (
              <p className="text-xs text-center py-8" style={{ color: "rgba(255,255,255,0.25)" }}>
                Chat is live — say something!
              </p>
            )}
            {msgs.map(msg => (
              <div key={msg.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white" }}>
                  {msg.username[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1 flex-wrap">
                    {msg.badge && (
                      <span className="text-xs leading-none" title="Profile badge">{msg.badge}</span>
                    )}
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
              {CHAT_CREDIT_COST} credits per message · Be respectful
            </p>
          </div>
        </div>
      </div>

      {/* ── Creator Subscribe Modal ─────────────────────────────────────────── */}
      {showSubscribeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowSubscribeModal(false); }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "#0d0d1e", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.8)", maxHeight: "90vh" }}>

            {/* Header — creator identity */}
            <div className="relative px-6 pt-6 pb-5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "linear-gradient(180deg, rgba(236,72,153,0.07) 0%, transparent 100%)" }}>
              <button onClick={() => setShowSubscribeModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg transition-all hover:bg-white/10"
                style={{ color: "rgba(255,255,255,0.4)" }}>
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={hostAvatar} alt={hostName}
                    className="w-14 h-14 rounded-full object-cover border-2"
                    style={{ borderColor: "#ec4899" }} />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{ background: "#ec4899" }}>♥</span>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "#ec4899" }}>SUBSCRIBE TO</p>
                  <h2 className="text-xl font-black text-white leading-tight">{hostName}</h2>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
                    Monthly · Cancel anytime · Billed to your saved card
                  </p>
                </div>
              </div>
            </div>

            {/* Tier grid — scrollable, 5 visible + Show More */}
            <div className="overflow-y-auto flex-1">
              {(() => {
                // Reusable inline card renderer
                const renderCard = (tier: CreatorSubTier) => {
                  const isActive = subscribedTier === tier.id;
                  return (
                    <div key={tier.id} className="relative flex flex-col rounded-xl overflow-hidden transition-all duration-200"
                      style={{
                        background: isActive ? `${tier.color}14` : "rgba(255,255,255,0.03)",
                        border: `1px solid ${isActive ? tier.color + "60" : tier.popular ? tier.color + "35" : "rgba(255,255,255,0.08)"}`,
                      }}>
                      {/* Top banner */}
                      {tier.popular && !isActive && (
                        <div className="py-0.5 text-center text-xs font-black tracking-wide"
                          style={{ background: tier.color, color: "white" }}>MOST POPULAR</div>
                      )}
                      {isActive && (
                        <div className="py-0.5 text-center text-xs font-black tracking-wide flex items-center justify-center gap-1"
                          style={{ background: `${tier.color}30`, color: tier.color }}>
                          <CheckCircle2 className="w-3 h-3" /> SUBSCRIBED
                        </div>
                      )}
                      <div className={`p-3.5 flex flex-col flex-1 ${tier.popular || isActive ? "" : ""}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl leading-none">{tier.emoji}</span>
                          <div>
                            <p className="text-sm font-black text-white leading-tight">{tier.name}</p>
                            <p className="text-base font-black leading-tight" style={{ color: tier.color }}>
                              {tier.priceStr}<span className="text-xs font-normal" style={{ color: "rgba(255,255,255,0.32)" }}>/mo</span>
                            </p>
                          </div>
                        </div>
                        <div className="mb-2" style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
                        <ul className="space-y-1.5 flex-1 mb-3">
                          {tier.perks.map(perk => (
                            <li key={perk} className="flex items-start gap-1.5 text-xs leading-snug"
                              style={{ color: "rgba(255,255,255,0.6)" }}>
                              <span className="mt-0.5 flex-shrink-0" style={{ color: tier.color }}>✓</span>
                              {perk}
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => {
                            if (isActive) return;
                            if (!defaultCard) { setShowSubscribeModal(false); setSubscribeNoCard(true); return; }
                            setSubscribePending({
                              tier: tier.id, name: tier.name, priceStr: tier.priceStr, emoji: tier.emoji,
                              onConfirm: () => {
                                // Creator subscriptions are recurring real-money purchases.
                                // Until a payment processor is wired, never grant access in production.
                                if (!import.meta.env.DEV) {
                                  setSubscribePending(null);
                                  setShowSubscribeModal(false);
                                  showToast({ title: "Subscriptions coming soon", description: "Creator subscriptions aren't available just yet — please check back shortly.", variant: "destructive" });
                                  return;
                                }
                                recordPurchase(tier.price, `[Demo] ${tier.emoji} ${tier.name} subscription — ${hostName} — ${tier.priceStr}/mo`);
                                try { localStorage.setItem(`vl_creator_sub_${id ?? ""}`, tier.id); } catch {}
                                // Notify creator studio via localStorage (polled every 2s by CreatorLiveStudio)
                                try {
                                  const creatorUsername = feed.creator?.user?.username ?? id ?? "";
                                  const notifKey = `vl_sub_notifications_${creatorUsername}`;
                                  const existing = JSON.parse(localStorage.getItem(notifKey) ?? "[]");
                                  existing.push({
                                    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                                    subscriberUsername: user?.username ?? "anonymous",
                                    tierId: tier.id,
                                    tierName: tier.name,
                                    tierEmoji: tier.emoji,
                                    priceStr: tier.priceStr,
                                    price: tier.price,
                                    perks: tier.perks,
                                    subscribedAt: Date.now(),
                                    creatorUsername,
                                  });
                                  localStorage.setItem(notifKey, JSON.stringify(existing));
                                } catch {}
                                setSubscribedTier(tier.id);
                                setSubscribePending(null);
                                setShowSubscribeModal(false);
                                showToast({ title: `${tier.emoji} Subscribed to ${hostName}!`, description: `You're now a ${tier.name} — thank you for your support!` });
                              },
                            });
                          }}
                          className="w-full py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90 active:scale-95"
                          style={isActive
                            ? { background: `${tier.color}18`, border: `1px solid ${tier.color}40`, color: tier.color, cursor: "default" }
                            : { background: `linear-gradient(135deg, ${tier.color}dd, ${tier.color}99)`, color: "white" }
                          }>
                          {isActive ? "✓ Subscribed" : `Subscribe ${tier.priceStr}/mo`}
                        </button>
                      </div>
                    </div>
                  );
                };

                return (
                  <>
                    {/* First 5 tiers + "Show More" tile as the 6th cell */}
                    <div className="p-4 grid grid-cols-2 gap-3">
                      {CREATOR_SUB_TIERS.slice(0, 5).map(renderCard)}

                      {/* Show More tile (6th cell, same grid position) */}
                      {!showMoreTiers && (
                        <button
                          onClick={() => setShowMoreTiers(true)}
                          className="relative flex flex-col items-center justify-center rounded-xl p-4 transition-all hover:bg-white/5 active:scale-95"
                          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.14)", minHeight: 140 }}>
                          <div className="flex gap-0.5 mb-2 text-base">
                            {["💠","🔮","🪙","🏆","⚡"].map(e => <span key={e}>{e}</span>)}
                          </div>
                          <p className="text-sm font-bold text-white mb-0.5">5 More Plans</p>
                          <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.32)" }}>Up to $2,499.99/mo</p>
                          <div className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full"
                            style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}>
                            Show More <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Expanded: last 5 tiers */}
                    {showMoreTiers && (
                      <>
                        <div className="px-4 pb-1 flex items-center gap-3">
                          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                          <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.28)" }}>PREMIUM TIERS</span>
                          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                        </div>
                        <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                          {CREATOR_SUB_TIERS.slice(5, 10).map(renderCard)}
                        </div>
                        <div className="px-4 pb-4 text-center">
                          <button
                            onClick={() => setShowMoreTiers(false)}
                            className="text-xs font-semibold flex items-center gap-1 mx-auto transition-all hover:opacity-70"
                            style={{ color: "rgba(255,255,255,0.35)" }}>
                            <ChevronDown className="w-3.5 h-3.5 rotate-180" /> Show fewer plans
                          </button>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex items-center gap-2 text-xs justify-center"
              style={{ color: "rgba(255,255,255,0.28)" }}>
              <span>🔒</span>
              Secure billing · Payments go directly to {hostName} · Cancel anytime in Billing
            </div>
          </div>
        </div>
      )}

      {/* ── No Card Modal ─────────────────────────────────────────────────────── */}
      {subscribeNoCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={e => { if (e.target === e.currentTarget) setSubscribeNoCard(false); }}>
          <div className="w-full max-w-sm p-6 rounded-2xl text-center"
            style={{ background: "#0d0d1e", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(232,168,124,0.12)", border: "1px solid rgba(232,168,124,0.3)" }}>
              <CreditCard className="w-7 h-7" style={{ color: "#e8a87c" }} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Payment Method Required</h3>
            <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
              Add a payment method in Billing to subscribe to paid tiers.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setSubscribeNoCard(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}>
                Cancel
              </button>
              <button onClick={() => { setSubscribeNoCard(false); window.location.href = "/billing"; }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #e8a87c, #d97706)", color: "white" }}>
                Go to Billing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Subscribe Confirmation Modal ──────────────────────────────────────── */}
      {subscribePending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={e => { if (e.target === e.currentTarget) setSubscribePending(null); }}>
          <div className="w-full max-w-sm p-6 rounded-2xl"
            style={{ background: "#0d0d1e", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}>
            <div className="text-center mb-5">
              <div className="relative inline-block mb-3">
                <img src={hostAvatar} alt={hostName}
                  className="w-14 h-14 rounded-full object-cover border-2 mx-auto"
                  style={{ borderColor: "#ec4899" }} />
                <span className="absolute -bottom-1 -right-1 text-2xl leading-none">{subscribePending.emoji}</span>
              </div>
              <h3 className="text-lg font-black text-white mb-1">Support {hostName}</h3>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                <strong className="text-white">{subscribePending.name}</strong> tier · billed monthly
              </p>
            </div>
            <div className="p-3 rounded-xl mb-5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "rgba(255,255,255,0.5)" }}>Monthly subscription</span>
                <span className="font-black text-white">{subscribePending.priceStr}/mo</span>
              </div>
              {defaultCard && (
                <div className="flex items-center gap-2 mt-2 pt-2"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <CreditCard className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.35)" }} />
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {defaultCard.brand} •••• {defaultCard.last4}
                  </span>
                </div>
              )}
              <p className="text-xs mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.3)" }}>
                Payment goes directly to {hostName} · Cancel anytime
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSubscribePending(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}>
                Cancel
              </button>
              <button onClick={subscribePending.onConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)", color: "white" }}>
                Confirm Subscribe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
