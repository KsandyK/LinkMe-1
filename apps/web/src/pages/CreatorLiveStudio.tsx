/**
 * LINKME — Creator Live Studio
 * Full streaming control center for creators.
 *
 * Competitive feature parity:
 * ✅ Tip goal + live progress bar  (Chaturbate, Fansly, OnlyFans)
 * ✅ Tip menu builder              (Chaturbate, ManyVids)
 * ✅ Chat slow / sub-only mode     (Chaturbate, Twitch, OnlyFans)
 * ✅ Room notice broadcast         (Chaturbate)
 * ✅ Live polls w/ voting results  (Chaturbate, Twitch, OnlyFans)
 * ✅ Kick / ban viewer from chat   (all platforms)
 * ✅ Top tippers leaderboard       (Chaturbate, Fansly)
 * ✅ Real-time session stats       (all platforms)
 * ✅ Stream settings editor        (all platforms)
 * ✅ Simulated live demo activity  (works offline / no backend)
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { livefeeds as liveApi } from "@/lib/api";
import {
  Radio, Target, MessageSquare, Settings2, BarChart2,
  Plus, Trash2, ChevronLeft, Eye, Zap, Trophy, Clock,
  Send, Crown, Bell, CheckCircle, Megaphone, Square,
  DollarSign, Users, Star, X, Edit3, Mic, MicOff,
  Shield, Hash, Volume2, VolumeX, ChevronDown, ChevronUp,
  BarChart, AlertCircle, Pin, Loader2, RefreshCw, Sparkles, Gift,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TipMenuItem {
  id: string;
  emoji: string;
  name: string;
  credits: number;
}

interface TipGoal {
  title: string;
  target: number;
  current: number;
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  question: string;
  options: PollOption[];
  totalVotes: number;
  endsAt: number; // unix ms
}

interface ChatMsg {
  id: string;
  username: string;
  text: string;
  creditTip: number;
  isNotice?: boolean;
  isPinned?: boolean;
  timestamp: number;
}

interface TopTipper {
  username: string;
  total: number;
  rank: number;
}

type ChatMode = "normal" | "slow" | "sub-only" | "followers-only";
type StudioTab = "goals" | "tipmenu" | "chatmod" | "settings" | "stats" | "drop" | "subs";

// ── Subscriber notification (written by StreamView, polled here) ──────────────
interface SubNotification {
  id: string;
  subscriberUsername: string;
  tierId: string;
  tierName: string;
  tierEmoji: string;
  priceStr: string;
  price: number;
  perks: string[];
  subscribedAt: number;
  creatorUsername: string;
}

// Perks that require explicit creator action, keyed by tier ID
const TIER_ACTION_ITEMS: Record<string, string[]> = {
  vip:       ["📅 Schedule their monthly Q&A session"],
  super_vip: ["🎬 Fulfill their custom content request this month", "📞 Schedule 15-min 1-on-1 video call", "🔒 Add to private subscriber stream invite list"],
  elite:     ["📞 Schedule weekly 30-min video calls with them", "✍️ Add their name permanently to your bio"],
  diamond:   ["🎥 Record a personalized video message this month", "📦 Grant early merchandise access"],
  obsidian:  ["📞 Schedule bi-weekly video calls", "📦 Ship signed physical merchandise this month", "🗳️ Add to content topic vote list"],
  platinum:  ["💬 Enable unlimited priority DM access for them", "✍️ Credit their name in upcoming content descriptions"],
  legend:    ["🎥 Schedule exclusive Legend-only private livestream", "📞 Enable on-request video call access for them"],
  icon:      ["🤝 Schedule full creative collaboration session", "🎖️ Grant lifetime VIP status — never expires", "📝 Dedicate next content release to them"],
};

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEFAULT_TIP_MENU: TipMenuItem[] = [
  { id: "1", emoji: "💋", name: "Blowing Kiss", credits: 25 },
  { id: "2", emoji: "👋", name: "Wave to Cam", credits: 50 },
  { id: "3", emoji: "💃", name: "Dance for Me", credits: 150 },
  { id: "4", emoji: "🎵", name: "Song Request", credits: 200 },
  { id: "5", emoji: "📸", name: "Selfie Snap", credits: 300 },
  { id: "6", emoji: "👙", name: "Outfit Change", credits: 500 },
  { id: "7", emoji: "🔥", name: "Special Show", credits: 1000 },
];

const DEMO_USERNAMES = ["fan_marco", "chloe_xo", "xoxo_lara", "max_vibes", "star_boy88", "diamond_dan", "lucky_luna", "tip_king_99", "rose_fan_22", "night_owl_x"];
const DEMO_MSGS = [
  "You're absolutely amazing! 💕",
  "First time watching — instant fan! ✨",
  "This is the best stream tonight!",
  "Your energy is unmatched 🔥",
  "Love your vibe so much!",
  "Can we get a dance? 💃",
  "Following you everywhere now!",
  "You make my night every time ✨",
  "Wow just wow 😍",
  "Best creator on the platform!",
  "Just told all my friends about you!",
  "Please more content like this!",
  "This is everything 🙌",
  "You are too cute!",
];
const DEMO_TIPS = [25, 25, 50, 50, 100, 100, 150, 200, 300, 500];
const DEMO_TIP_EMOJIS = ["💸", "🔥", "💎", "⭐", "🚀", "❤️"];
const CATEGORIES = ["General", "Music", "Gaming", "ASMR", "Fitness", "Cooking", "Talk", "Adult"];
const EMOJI_OPTIONS = ["💋", "👋", "💃", "🎵", "📸", "👙", "🔥", "⭐", "🎯", "🎁", "💎", "🌹", "😘", "✨", "🏆", "🎶"];

// ── Creator Drop (gift sent FROM creator TO viewers) ─────────────────────────
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

const CREATOR_DROP_TYPES = [
  { id: "content",     emoji: "📸", name: "Content Unlock",    hint: "Describe the exclusive photo/video you'll unlock for them" },
  { id: "shoutout",    emoji: "📢", name: "Live Shoutout",      hint: "You'll personally shout out each claimer on stream" },
  { id: "dm",          emoji: "💬", name: "DM Session",         hint: "A free private message session — describe the time limit" },
  { id: "vip_chat",    emoji: "⭐", name: "VIP Chat (24h)",     hint: "24-hour VIP badge in this chat for all claimers" },
  { id: "collectible", emoji: "🏆", name: "Stream Collectible", hint: "An exclusive digital collectible from this stream" },
  { id: "custom",      emoji: "🎁", name: "Custom Prize",       hint: "Describe your own unique prize or reward" },
] as const;

const DROP_CLAIM_WINDOWS = [
  { label: "30 sec", secs: 30 },
  { label: "1 min",  secs: 60 },
  { label: "5 min",  secs: 300 },
  { label: "10 min", secs: 600 },
  { label: "30 min", secs: 1800 },
] as const;

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreatorLiveStudio() {
  const [, navigate] = useLocation();
  const { user, isLoggedIn, showToast, credits } = useApp();

  // ── Pre-stream setup ──────────────────────────────────────────────────────
  const [isLive, setIsLive] = useState(false);
  const [feedId, setFeedId] = useState<string | null>(null);

  const [setupTitle, setSetupTitle] = useState("My Live Show ✨");
  const [setupCategory, setSetupCategory] = useState("General");
  const [setupTagInput, setSetupTagInput] = useState("");
  const [setupTags, setSetupTags] = useState<string[]>(["interactive", "chat", "fun"]);
  const [setupVip, setSetupVip] = useState(false);

  // ── Live state ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<StudioTab>("goals");
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [pinnedMsgId, setPinnedMsgId] = useState<string | null>(null);
  const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set());

  const [currentViewers, setCurrentViewers] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sessionEarnings, setSessionEarnings] = useState(0);
  const [topTippers, setTopTippers] = useState<TopTipper[]>([]);

  // Goal
  const [goal, setGoal] = useState<TipGoal | null>(null);
  const [goalTitle, setGoalTitle] = useState("Special Show");
  const [goalTarget, setGoalTarget] = useState("1000");

  // Tip menu
  const [tipMenu, setTipMenu] = useState<TipMenuItem[]>(DEFAULT_TIP_MENU);
  const [newItemEmoji, setNewItemEmoji] = useState("🎁");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCredits, setNewItemCredits] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Chat mod
  const [chatMode, setChatMode] = useState<ChatMode>("normal");
  const [slowInterval, setSlowInterval] = useState(15);
  const [noticeText, setNoticeText] = useState("");
  const [kickInput, setKickInput] = useState("");

  // Poll
  const [poll, setPoll] = useState<Poll | null>(null);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDuration, setPollDuration] = useState(60);

  // Settings (live edit)
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTagInput, setEditTagInput] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editVip, setEditVip] = useState(false);

  // Mic
  const [micOn, setMicOn] = useState(true);

  const chatEndRef    = useRef<HTMLDivElement>(null);
  const chatPanelRef  = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Drop state
  const [dropIsActive, setDropIsActive] = useState(false);
  const [dropStartedAt, setDropStartedAt] = useState<number | null>(null);
  const [dropClaims, setDropClaims] = useState<CreatorDropClaim[]>([]);
  const [dropSecsLeft, setDropSecsLeft] = useState(0);
  const [dropType, setDropType] = useState(CREATOR_DROP_TYPES[0].id);
  const [dropDescription, setDropDescription] = useState("");
  const [dropQuantity, setDropQuantity] = useState(10);
  const [dropWindow, setDropWindow] = useState(DROP_CLAIM_WINDOWS[2].secs); // 5 min default
  const [dropWindowMs, setDropWindowMs] = useState(DROP_CLAIM_WINDOWS[2].secs * 1000);
  const dropTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dropClaimCountRef = useRef(0);

  // Subscriber notifications
  const [sessionSubs, setSessionSubs] = useState<SubNotification[]>([]);
  const [activeSubAlert, setActiveSubAlert] = useState<SubNotification | null>(null);
  const subReadCountRef = useRef(0);
  const subAlertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) navigate("/login");
  }, [isLoggedIn, navigate]);

  // Auto-scroll chat — scroll the panel container, not the whole page
  useEffect(() => {
    const el = chatPanelRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMsgs]);

  // ── Demo: simulated live activity ─────────────────────────────────────────
  useEffect(() => {
    if (!isLive) return;

    // Kick off initial viewers
    const initViewers = 45 + Math.floor(Math.random() * 80);
    setCurrentViewers(initViewers);
    setPeakViewers(initViewers);

    // Viewer fluctuation
    const viewerInterval = setInterval(() => {
      setCurrentViewers(prev => {
        const delta = Math.floor(Math.random() * 18) - 6;
        const next = Math.max(1, prev + delta);
        setPeakViewers(p => Math.max(p, next));
        return next;
      });
    }, 7000);

    // Stream duration tick
    const durationInterval = setInterval(() => setDuration(d => d + 1), 1000);

    // Simulated chat messages + tips
    let msgTimeout: ReturnType<typeof setTimeout>;
    function scheduleMsg() {
      const delay = 3500 + Math.random() * 5000;
      msgTimeout = setTimeout(() => {
        if (!isLive) return;
        const username = DEMO_USERNAMES[Math.floor(Math.random() * DEMO_USERNAMES.length)];
        const isTip = Math.random() < 0.22;
        const tipAmount = isTip ? DEMO_TIPS[Math.floor(Math.random() * DEMO_TIPS.length)] : 0;
        const baseText = DEMO_MSGS[Math.floor(Math.random() * DEMO_MSGS.length)];
        const text = isTip
          ? `${DEMO_TIP_EMOJIS[Math.floor(Math.random() * DEMO_TIP_EMOJIS.length)]} +${tipAmount} — ${baseText}`
          : baseText;

        const msg: ChatMsg = {
          id: `${Date.now()}-${Math.random()}`,
          username,
          text,
          creditTip: tipAmount,
          timestamp: Date.now(),
        };

        setChatMsgs(prev => [...prev.slice(-79), msg]);

        if (isTip) {
          setSessionEarnings(prev => prev + tipAmount);
          setGoal(prev => prev ? { ...prev, current: Math.min(prev.current + tipAmount, prev.target) } : prev);
          setPoll(prev => {
            if (!prev || Date.now() > prev.endsAt) return prev;
            const idx = Math.floor(Math.random() * prev.options.length);
            return {
              ...prev,
              totalVotes: prev.totalVotes + 1,
              options: prev.options.map((o, i) => i === idx ? { ...o, votes: o.votes + 1 } : o),
            };
          });
          setTopTippers(prev => {
            const existing = prev.find(t => t.username === username);
            let next: TopTipper[];
            if (existing) {
              next = prev.map(t => t.username === username ? { ...t, total: t.total + tipAmount } : t);
            } else {
              next = [...prev, { username, total: tipAmount, rank: 0 }];
            }
            return next.sort((a, b) => b.total - a.total).slice(0, 10).map((t, i) => ({ ...t, rank: i + 1 }));
          });
        }
        scheduleMsg();
      }, delay);
    }
    scheduleMsg();

    return () => {
      clearInterval(viewerInterval);
      clearInterval(durationInterval);
      clearTimeout(msgTimeout);
    };
  }, [isLive]);

  // Poll countdown
  useEffect(() => {
    if (!poll) return;
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(() => {
      if (Date.now() >= poll.endsAt) {
        clearInterval(pollTimerRef.current!);
      } else {
        setPoll(p => p ? { ...p } : null); // force re-render for countdown
      }
    }, 1000);
    return () => { if (pollTimerRef.current) clearInterval(pollTimerRef.current); };
  }, [poll?.endsAt]);

  // Drop countdown (1-second tick)
  useEffect(() => {
    if (!dropIsActive || !dropStartedAt) {
      if (dropTimerRef.current) clearInterval(dropTimerRef.current);
      return;
    }
    dropTimerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((dropWindowMs - (Date.now() - dropStartedAt)) / 1000));
      setDropSecsLeft(remaining);
      if (remaining <= 0) {
        if (dropTimerRef.current) clearInterval(dropTimerRef.current);
        setDropIsActive(false);
        setDropStartedAt(null);
        try {
          const stored = localStorage.getItem(DROP_STORAGE_KEY);
          if (stored) {
            const s: CreatorDropState = JSON.parse(stored);
            localStorage.setItem(DROP_STORAGE_KEY, JSON.stringify({ ...s, isActive: false }));
          }
        } catch {}
        setChatMsgs(prev => [...prev, {
          id: `drop-expire-${Date.now()}`,
          username: "🎁 Drop",
          text: `Drop ended! ${dropClaimCountRef.current} viewer${dropClaimCountRef.current !== 1 ? "s" : ""} claimed their gift. 🎉`,
          creditTip: 0,
          isNotice: true,
          timestamp: Date.now(),
        }]);
      }
    }, 1000);
    return () => { if (dropTimerRef.current) clearInterval(dropTimerRef.current); };
  }, [dropIsActive, dropStartedAt, dropWindowMs]);

  // Poll localStorage for new claims (every 2 s while drop active)
  useEffect(() => {
    if (!dropIsActive) return;
    const interval = setInterval(() => {
      try {
        const stored = localStorage.getItem(DROP_STORAGE_KEY);
        if (!stored) return;
        const state: CreatorDropState = JSON.parse(stored);
        const prev = dropClaimCountRef.current;
        if (state.claims.length > prev) {
          const newClaims = state.claims.slice(prev);
          dropClaimCountRef.current = state.claims.length;
          setDropClaims(state.claims);
          newClaims.forEach(claim => {
            setChatMsgs(prev2 => [...prev2, {
              id: `claim-${claim.claimedAt}-${claim.username}`,
              username: "🎁 Drop",
              text: `${claim.username} just claimed the drop! 🎉`,
              creditTip: 0,
              isNotice: true,
              timestamp: claim.claimedAt,
            }]);
          });
          // Auto-stop if quantity reached
          if (state.quantity !== -1 && state.claims.length >= state.quantity) {
            setDropIsActive(false);
            setDropStartedAt(null);
            localStorage.setItem(DROP_STORAGE_KEY, JSON.stringify({ ...state, isActive: false }));
            setChatMsgs(prev2 => [...prev2, {
              id: `drop-full-${Date.now()}`,
              username: "🎁 Drop",
              text: `All ${state.quantity} slots claimed! Drop is now closed. 🎊`,
              creditTip: 0,
              isNotice: true,
              timestamp: Date.now(),
            }]);
          }
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [dropIsActive]);

  // Poll localStorage for new subscriber notifications (every 2 s while live)
  useEffect(() => {
    if (!isLive || !user?.username) return;
    const subKey = `vl_sub_notifications_${user.username}`;
    const interval = setInterval(() => {
      try {
        const stored = localStorage.getItem(subKey);
        if (!stored) return;
        const notifs: SubNotification[] = JSON.parse(stored);
        const prev = subReadCountRef.current;
        if (notifs.length > prev) {
          const newNotifs = notifs.slice(prev);
          subReadCountRef.current = notifs.length;
          setSessionSubs(notifs);
          newNotifs.forEach(notif => {
            // Inject into chat
            setChatMsgs(p => [...p, {
              id: `sub-${notif.id}`,
              username: "⭐ New Subscriber",
              text: `${notif.subscriberUsername} just subscribed as ${notif.tierEmoji} ${notif.tierName} (${notif.priceStr}/mo)! 🎉`,
              creditTip: 0,
              isNotice: true,
              timestamp: notif.subscribedAt,
            }]);
            // Add 70% of subscription price to session earnings (creator's share)
            setSessionEarnings(p => p + Math.round(notif.price * 0.7));
            // Show overlay alert — clear previous timer, set new one
            if (subAlertTimerRef.current) clearTimeout(subAlertTimerRef.current);
            setActiveSubAlert(notif);
            subAlertTimerRef.current = setTimeout(() => setActiveSubAlert(null), 9000);
          });
        }
      } catch {}
    }, 2000);
    return () => {
      clearInterval(interval);
      if (subAlertTimerRef.current) clearTimeout(subAlertTimerRef.current);
    };
  }, [isLive, user?.username]);

  // Reset sub notification state when stream ends
  useEffect(() => {
    if (!isLive) {
      subReadCountRef.current = 0;
      setSessionSubs([]);
      setActiveSubAlert(null);
    }
  }, [isLive]);

  // ── Go Live ───────────────────────────────────────────────────────────────
  const goLive = useCallback(() => {
    if (!setupTitle.trim()) { showToast({ title: "Title required", variant: "destructive" }); return; }

    // Enter live mode instantly — API call attempted in background (fire-and-forget)
    // Avoids hanging when backend is offline / Vite proxy holds connection open
    const demoId = `demo-${Date.now()}`;
    setFeedId(demoId);
    setEditTitle(setupTitle);
    setEditCategory(setupCategory);
    setEditTags(setupTags);
    setEditVip(setupVip);
    setIsLive(true);
    setChatMsgs([{
      id: "welcome",
      username: "LinkMe",
      text: `🎉 ${user?.username ?? "Creator"} is now live! Welcome everyone!`,
      creditTip: 0,
      isNotice: true,
      timestamp: Date.now(),
    }]);

    // Background API attempt — updates feedId if backend is running
    liveApi.create({ title: setupTitle, category: setupCategory, isVip: setupVip, tags: setupTags })
      .then(feed => setFeedId(feed.id))
      .catch(() => { /* offline — demoId already set */ });
  }, [setupTitle, setupCategory, setupVip, setupTags, user, showToast]);

  // ── End stream ────────────────────────────────────────────────────────────
  const endStream = useCallback(async () => {
    if (feedId) {
      try { await liveApi.end(feedId); } catch { /* offline ok */ }
    }
    setIsLive(false);
    setDuration(0);
    showToast({ title: "Stream ended", description: `You earned ${sessionEarnings.toLocaleString()} credits this session!` });
    navigate("/creator");
  }, [feedId, sessionEarnings, showToast, navigate]);

  // ── Send chat notice as creator ───────────────────────────────────────────
  const sendCreatorMsg = useCallback(() => {
    if (!chatDraft.trim()) return;
    setChatMsgs(prev => [...prev, {
      id: String(Date.now()),
      username: user?.username ?? "Creator",
      text: chatDraft.trim(),
      creditTip: 0,
      isNotice: true,
      timestamp: Date.now(),
    }]);
    setChatDraft("");
  }, [chatDraft, user]);

  // ── Broadcast room notice ─────────────────────────────────────────────────
  const broadcastNotice = useCallback(() => {
    if (!noticeText.trim()) return;
    setChatMsgs(prev => [...prev, {
      id: String(Date.now()),
      username: "📢 Notice",
      text: noticeText.trim(),
      creditTip: 0,
      isNotice: true,
      timestamp: Date.now(),
    }]);
    setNoticeText("");
    showToast({ title: "Notice sent to all viewers" });
  }, [noticeText, showToast]);

  // ── Tip goal ─────────────────────────────────────────────────────────────
  const setNewGoal = useCallback(() => {
    const t = parseInt(goalTarget, 10);
    if (!goalTitle.trim() || isNaN(t) || t < 10) {
      showToast({ title: "Invalid goal", description: "Title required and target must be ≥ 10 credits", variant: "destructive" });
      return;
    }
    setGoal({ title: goalTitle.trim(), target: t, current: 0 });
    showToast({ title: "Goal set!", description: `${goalTitle} — ${t.toLocaleString()} credits` });
  }, [goalTitle, goalTarget, showToast]);

  // ── Tip menu item ─────────────────────────────────────────────────────────
  const addTipItem = useCallback(() => {
    const c = parseInt(newItemCredits, 10);
    if (!newItemName.trim() || isNaN(c) || c < 1) {
      showToast({ title: "Invalid item", variant: "destructive" }); return;
    }
    setTipMenu(prev => [...prev, { id: String(Date.now()), emoji: newItemEmoji, name: newItemName.trim(), credits: c }]);
    setNewItemName(""); setNewItemCredits("");
    showToast({ title: "Item added to tip menu" });
  }, [newItemEmoji, newItemName, newItemCredits, showToast]);

  // ── Poll ──────────────────────────────────────────────────────────────────
  const createPoll = useCallback(() => {
    const opts = pollOptions.filter(o => o.trim());
    if (!pollQuestion.trim() || opts.length < 2) {
      showToast({ title: "Poll needs a question and ≥ 2 options", variant: "destructive" }); return;
    }
    const newPoll: Poll = {
      question: pollQuestion.trim(),
      options: opts.map((text, i) => ({ id: String(i), text: text.trim(), votes: 0 })),
      totalVotes: 0,
      endsAt: Date.now() + pollDuration * 1000,
    };
    setPoll(newPoll);
    setChatMsgs(prev => [...prev, {
      id: `poll-${Date.now()}`,
      username: "📊 Poll",
      text: `Poll: ${newPoll.question} (${pollDuration}s)`,
      creditTip: 0,
      isNotice: true,
      timestamp: Date.now(),
    }]);
    showToast({ title: "Poll started!", description: newPoll.question });
    setPollQuestion(""); setPollOptions(["", ""]);
  }, [pollQuestion, pollOptions, pollDuration, showToast]);

  // ── Kick user ─────────────────────────────────────────────────────────────
  const kickUser = useCallback(() => {
    if (!kickInput.trim()) return;
    const username = kickInput.trim();
    setMutedUsers(prev => new Set([...prev, username]));
    setChatMsgs(prev => [...prev, {
      id: String(Date.now()),
      username: "🛡️ Mod",
      text: `${username} has been removed from chat.`,
      creditTip: 0,
      isNotice: true,
      timestamp: Date.now(),
    }]);
    setKickInput("");
    showToast({ title: `${username} kicked`, description: "Removed from chat" });
  }, [kickInput, showToast]);

  // ── Update live settings ──────────────────────────────────────────────────
  const saveSettings = useCallback(() => {
    setSetupTitle(editTitle);
    setSetupCategory(editCategory);
    setSetupTags(editTags);
    setSetupVip(editVip);
    showToast({ title: "Stream settings updated" });
  }, [editTitle, editCategory, editTags, editVip, showToast]);

  // ── Drop ─────────────────────────────────────────────────────────────────
  const selectedDropType = CREATOR_DROP_TYPES.find(t => t.id === dropType) ?? CREATOR_DROP_TYPES[0];

  const startDrop = useCallback(() => {
    const desc = dropDescription.trim();
    if (!desc) { showToast({ title: "Add a description", description: "Tell viewers what they'll receive", variant: "destructive" }); return; }
    const now = Date.now();
    const windowMs = dropWindow * 1000;
    const state: CreatorDropState = {
      id: `drop-${now}`,
      creatorUsername: user?.username ?? "Creator",
      typeId: selectedDropType.id,
      typeEmoji: selectedDropType.emoji,
      typeName: selectedDropType.name,
      description: desc,
      quantity: dropQuantity,
      claimWindowMs: windowMs,
      startedAt: now,
      isActive: true,
      claims: [],
    };
    localStorage.setItem(DROP_STORAGE_KEY, JSON.stringify(state));
    dropClaimCountRef.current = 0;
    setDropWindowMs(windowMs);
    setDropIsActive(true);
    setDropStartedAt(now);
    setDropClaims([]);
    setDropSecsLeft(dropWindow);
    const qtyLabel = dropQuantity === -1 ? "unlimited slots" : `${dropQuantity} slot${dropQuantity !== 1 ? "s" : ""}`;
    const winLabel = DROP_CLAIM_WINDOWS.find(w => w.secs === dropWindow)?.label ?? `${dropWindow}s`;
    setChatMsgs(prev => [...prev, {
      id: `drop-start-${now}`,
      username: "🎁 Drop",
      text: `${selectedDropType.emoji} CREATOR DROP! ${desc} — ${qtyLabel} available · ${winLabel} to claim! Click CLAIM in your app!`,
      creditTip: 0,
      isNotice: true,
      timestamp: now,
    }]);
    showToast({ title: `${selectedDropType.emoji} Drop launched!`, description: `${qtyLabel} · ${winLabel} window` });
  }, [user, showToast, selectedDropType, dropDescription, dropQuantity, dropWindow]);

  const stopDrop = useCallback(() => {
    setDropIsActive(false);
    setDropStartedAt(null);
    setDropSecsLeft(0);
    try {
      const stored = localStorage.getItem(DROP_STORAGE_KEY);
      if (stored) {
        const state: CreatorDropState = JSON.parse(stored);
        localStorage.setItem(DROP_STORAGE_KEY, JSON.stringify({ ...state, isActive: false }));
      }
    } catch {}
    setChatMsgs(prev => [...prev, {
      id: `drop-end-${Date.now()}`,
      username: "🎁 Drop",
      text: `Drop closed — ${dropClaimCountRef.current} viewer${dropClaimCountRef.current !== 1 ? "s" : ""} claimed their gift!`,
      creditTip: 0,
      isNotice: true,
      timestamp: Date.now(),
    }]);
    showToast({ title: "Drop closed", description: `${dropClaimCountRef.current} claims total` });
  }, [showToast]);

  // ── Tab data badge ────────────────────────────────────────────────────────
  const pollSecsLeft = poll ? Math.max(0, Math.round((poll.endsAt - Date.now()) / 1000)) : 0;

  // ── Pre-stream setup ──────────────────────────────────────────────────────
  if (!isLive) {
    return (
      <div className="min-h-screen py-10" style={{ background: "#09091a" }}>
        <div className="container max-w-xl">
          <Link href="/creator">
            <button className="flex items-center gap-1.5 text-sm mb-8 transition-colors hover:text-white"
              style={{ color: "rgba(255,255,255,0.45)" }}>
              <ChevronLeft className="w-4 h-4" /> Back to Dashboard
            </button>
          </Link>

          <div className="vl-card p-8">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <Radio className="w-6 h-6" style={{ color: "#f87171" }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Go Live</h1>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Set up your broadcast</p>
              </div>
            </div>

            {/* Title */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-white mb-2">Stream Title</label>
              <input
                value={setupTitle}
                onChange={e => setSetupTitle(e.target.value)}
                placeholder="Give your stream a catchy title…"
                className="w-full px-4 py-3 rounded-xl text-sm text-white"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }}
              />
            </div>

            {/* Category */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-white mb-2">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setSetupCategory(cat)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={setupCategory === cat
                      ? { background: "rgba(20,184,166,0.18)", border: "1px solid rgba(20,184,166,0.5)", color: "#14b8a6" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }
                    }>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-white mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {setupTags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.25)", color: "#14b8a6" }}>
                    #{tag}
                    <button onClick={() => setSetupTags(t => t.filter(x => x !== tag))}
                      className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={setupTagInput}
                  onChange={e => setSetupTagInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  onKeyDown={e => {
                    if ((e.key === "Enter" || e.key === " ") && setupTagInput.trim()) {
                      e.preventDefault();
                      if (!setupTags.includes(setupTagInput.trim()))
                        setSetupTags(t => [...t, setupTagInput.trim()]);
                      setSetupTagInput("");
                    }
                  }}
                  placeholder="Add tag + Enter"
                  className="flex-1 px-3 py-2 rounded-lg text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }}
                />
              </div>
            </div>

            {/* VIP toggle */}
            <div className="flex items-center justify-between mb-8 p-4 rounded-xl"
              style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.18)" }}>
              <div className="flex items-center gap-3">
                <Crown className="w-4 h-4" style={{ color: "#a78bfa" }} />
                <div>
                  <p className="text-sm font-semibold text-white">VIP Only</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Restrict to subscribers & VIP members</p>
                </div>
              </div>
              <button onClick={() => setSetupVip(v => !v)}
                className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
                style={{ background: setupVip ? "#a78bfa" : "rgba(255,255,255,0.1)" }}>
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                  style={{ left: setupVip ? "calc(100% - 22px)" : "2px" }} />
              </button>
            </div>

            <button
              onClick={goLive}
              className="w-full py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white" }}
            >
              <Radio className="w-5 h-5" />
              Start Broadcasting
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LIVE STUDIO ────────────────────────────────────────────────────────────
  const pinnedMsg = pinnedMsgId ? chatMsgs.find(m => m.id === pinnedMsgId) : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#09091a" }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(9,9,26,0.97)" }}>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            LIVE
          </span>
          <span className="text-sm font-semibold text-white truncate max-w-xs">{setupTitle}</span>
          {setupVip && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold"
              style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>
              <Crown className="w-3 h-3" /> VIP
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Duration */}
          <div className="flex items-center gap-1.5 text-sm font-mono"
            style={{ color: "rgba(255,255,255,0.55)" }}>
            <Clock className="w-3.5 h-3.5" /> {formatDuration(duration)}
          </div>
          {/* Viewers */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)" }}>
            <Eye className="w-3.5 h-3.5" /> {currentViewers.toLocaleString()}
          </div>
          {/* Mic */}
          <button onClick={() => setMicOn(m => !m)}
            className="p-2 rounded-lg transition-all"
            style={{ background: micOn ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.06)", color: micOn ? "#14b8a6" : "rgba(255,255,255,0.4)" }}>
            {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
          {/* Session earnings */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-mono"
            style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }}>
            <Zap className="w-3.5 h-3.5" /> {sessionEarnings.toLocaleString()}
          </div>
          {/* End stream */}
          <button onClick={endStream}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5" }}>
            <Square className="w-3.5 h-3.5" /> End Stream
          </button>
        </div>
      </div>

      {/* ── Tip goal banner ───────────────────────────────────────────────── */}
      {goal && (
        <div className="px-5 py-2 flex items-center gap-4"
          style={{ background: "rgba(20,184,166,0.07)", borderBottom: "1px solid rgba(20,184,166,0.15)" }}>
          <Target className="w-4 h-4 flex-shrink-0" style={{ color: "#14b8a6" }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-white">{goal.title}</span>
              <span className="text-xs font-mono" style={{ color: "#14b8a6" }}>
                {goal.current.toLocaleString()} / {goal.target.toLocaleString()}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%`, background: "linear-gradient(90deg, #14b8a6, #0d9488)" }} />
            </div>
          </div>
          {goal.current >= goal.target && (
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "rgba(20,184,166,0.2)", color: "#14b8a6" }}>
              🎉 Goal Reached!
            </span>
          )}
          <button onClick={() => setGoal(null)} className="flex-shrink-0 hover:text-white transition-colors"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Active poll banner ────────────────────────────────────────────── */}
      {poll && pollSecsLeft > 0 && (
        <div className="px-5 py-2.5" style={{ background: "rgba(139,92,246,0.07)", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
          <div className="flex items-center gap-2 mb-2">
            <BarChart className="w-4 h-4" style={{ color: "#a78bfa" }} />
            <span className="text-xs font-bold text-white">{poll.question}</span>
            <span className="ml-auto text-xs font-mono" style={{ color: "#a78bfa" }}>{pollSecsLeft}s left</span>
            <button onClick={() => setPoll(null)} className="hover:text-white transition-colors"
              style={{ color: "rgba(255,255,255,0.3)" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {poll.options.map(opt => {
              const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
              return (
                <div key={opt.id} className="relative overflow-hidden rounded-lg px-3 py-1.5"
                  style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                  <div className="absolute inset-0 rounded-lg" style={{ width: `${pct}%`, background: "rgba(139,92,246,0.18)", transition: "width 0.5s" }} />
                  <div className="relative flex items-center justify-between">
                    <span className="text-xs text-white">{opt.text}</span>
                    <span className="text-xs font-bold" style={{ color: "#a78bfa" }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── New Subscriber Alert Overlay ─────────────────────────────────── */}
      {activeSubAlert && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ top: "80px", right: "24px", width: "320px" }}
        >
          <div
            className="rounded-2xl p-4 shadow-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(13,13,30,0.98), rgba(20,10,40,0.98))",
              border: "1px solid rgba(236,72,153,0.5)",
              boxShadow: "0 0 40px rgba(236,72,153,0.25), 0 8px 32px rgba(0,0,0,0.6)",
              animation: "slideInRight 0.4s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            {/* Pulsing top border accent */}
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
              style={{ background: "linear-gradient(90deg, #ec4899, #a855f7, #ec4899)", backgroundSize: "200% 100%", animation: "shimmer 2s linear infinite" }} />

            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "rgba(236,72,153,0.15)", border: "2px solid rgba(236,72,153,0.4)" }}>
                {activeSubAlert.tierEmoji}
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>NEW SUBSCRIBER</p>
                <p className="text-base font-black text-white leading-tight">{activeSubAlert.subscriberUsername}</p>
              </div>
              <button
                className="ml-auto pointer-events-auto p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                style={{ color: "rgba(255,255,255,0.4)" }}
                onClick={() => setActiveSubAlert(null)}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between px-3 py-2 rounded-xl mb-3"
              style={{ background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.2)" }}>
              <span className="text-sm font-bold text-white">{activeSubAlert.tierEmoji} {activeSubAlert.tierName}</span>
              <span className="text-sm font-black" style={{ color: "#ec4899" }}>{activeSubAlert.priceStr}/mo</span>
            </div>

            {/* Action items if any */}
            {(TIER_ACTION_ITEMS[activeSubAlert.tierId] ?? []).length > 0 && (
              <div className="px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
                <p className="text-xs font-bold mb-1.5" style={{ color: "#f59e0b" }}>⚡ Action required</p>
                {(TIER_ACTION_ITEMS[activeSubAlert.tierId] ?? []).map((action, i) => (
                  <p key={i} className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>• {action}</p>
                ))}
              </div>
            )}

            <p className="text-center text-xs mt-3" style={{ color: "rgba(255,255,255,0.3)" }}>
              See Subs tab for full details
            </p>
          </div>
        </div>
      )}

      {/* ── 3-column body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>

        {/* ── Col 1: Chat ─────────────────────────────────────────────────── */}
        <div className="flex flex-col w-72 flex-shrink-0" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-4 py-2.5 flex items-center gap-2"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <MessageSquare className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
            <span className="text-sm font-semibold text-white">Live Chat</span>
            {chatMode !== "normal" && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded font-semibold"
                style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}>
                {chatMode === "slow" ? `⏱ ${slowInterval}s` : chatMode === "sub-only" ? "⭐ Subs" : "👥 Followers"}
              </span>
            )}
          </div>

          {/* Pinned message */}
          {pinnedMsg && (
            <div className="mx-3 mt-2 px-3 py-2 rounded-lg flex items-start gap-2"
              style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)" }}>
              <Pin className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "#14b8a6" }} />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold" style={{ color: "#14b8a6" }}>{pinnedMsg.username}: </span>
                <span className="text-xs text-white">{pinnedMsg.text}</span>
              </div>
              <button onClick={() => setPinnedMsgId(null)}
                style={{ color: "rgba(255,255,255,0.3)" }} className="hover:text-white flex-shrink-0">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Messages */}
          <div ref={chatPanelRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5" style={{ minHeight: 0 }}>
            {chatMsgs.filter(m => !mutedUsers.has(m.username)).map(msg => {
              // ── Poll message — render as interactive live-results card ──────
              if (msg.id.startsWith("poll-")) {
                const isActive = !!poll && pollSecsLeft > 0;
                return (
                  <div key={msg.id} className="rounded-xl p-3"
                    style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.22)" }}>
                    {/* Header */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <BarChart className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#a78bfa" }} />
                      <span className="text-xs font-bold" style={{ color: "#a78bfa" }}>Poll</span>
                      {isActive ? (
                        <span className="ml-auto text-xs font-mono px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(139,92,246,0.18)", color: "#a78bfa" }}>
                          {pollSecsLeft}s left
                        </span>
                      ) : (
                        <span className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Ended</span>
                      )}
                    </div>
                    {/* Live results */}
                    {poll ? (
                      <>
                        <p className="text-xs font-semibold text-white mb-2">{poll.question}</p>
                        <div className="space-y-1">
                          {poll.options.map(opt => {
                            const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                            return (
                              <div key={opt.id} className="relative overflow-hidden rounded-lg px-2 py-1.5"
                                style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)" }}>
                                <div className="absolute inset-y-0 left-0 rounded-lg"
                                  style={{ width: `${pct}%`, background: "rgba(139,92,246,0.22)", transition: "width 0.6s ease" }} />
                                <div className="relative flex items-center justify-between gap-2">
                                  <span className="text-xs text-white truncate">{opt.text}</span>
                                  <span className="text-xs font-black flex-shrink-0" style={{ color: "#a78bfa" }}>{pct}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                          {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
                          {isActive && " · updating live"}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{msg.text}</p>
                    )}
                    {/* End poll button (creator only) */}
                    {isActive && (
                      <button onClick={() => setPoll(null)}
                        className="mt-2 w-full text-xs py-1 rounded-lg transition-all hover:opacity-80"
                        style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "rgba(167,139,250,0.7)" }}>
                        End Poll
                      </button>
                    )}
                  </div>
                );
              }

              // ── Regular message ─────────────────────────────────────────────
              return (
                <div key={msg.id}
                  className={`group flex gap-2 rounded-lg px-2 py-1.5 transition-all hover:bg-white/5 ${msg.isNotice ? "border-l-2" : ""}`}
                  style={msg.isNotice ? { borderColor: "#14b8a6", background: "rgba(20,184,166,0.05)" } : {}}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1 flex-wrap">
                      <span className="text-xs font-bold"
                        style={{ color: msg.isNotice ? "#14b8a6" : msg.creditTip > 0 ? "#e8a87c" : "rgba(255,255,255,0.6)" }}>
                        {msg.username}
                      </span>
                      {msg.creditTip > 0 && (
                        <span className="text-xs px-1 rounded font-bold"
                          style={{ background: "rgba(232,168,124,0.15)", color: "#e8a87c" }}>
                          +{msg.creditTip}
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed break-words" style={{ color: "rgba(255,255,255,0.75)" }}>
                      {msg.text}
                    </p>
                  </div>
                  {/* Mod actions (hover) */}
                  {!msg.isNotice && (
                    <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button title="Pin message"
                        onClick={() => setPinnedMsgId(pinnedMsgId === msg.id ? null : msg.id)}
                        className="p-0.5 rounded hover:bg-white/10 transition-colors"
                        style={{ color: pinnedMsgId === msg.id ? "#14b8a6" : "rgba(255,255,255,0.3)" }}>
                        <Pin className="w-3 h-3" />
                      </button>
                      <button title="Kick user"
                        onClick={() => {
                          setMutedUsers(s => new Set([...s, msg.username]));
                          showToast({ title: `${msg.username} kicked` });
                        }}
                        className="p-0.5 rounded hover:bg-white/10 transition-colors"
                        style={{ color: "rgba(255,255,255,0.3)" }}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Creator message input */}
          <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex gap-2">
              <input
                value={chatDraft}
                onChange={e => setChatDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); sendCreatorMsg(); } }}
                placeholder="Say something to chat…"
                className="flex-1 px-3 py-2 rounded-lg text-xs text-white min-w-0"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }}
              />
              <button onClick={sendCreatorMsg} disabled={!chatDraft.trim()}
                className="p-2 rounded-lg transition-all disabled:opacity-40"
                style={{ background: chatDraft.trim() ? "#14b8a6" : "rgba(255,255,255,0.05)" }}>
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Col 2: Controls ──────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>

          {/* Tab bar */}
          <div className="flex overflow-x-auto flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {([
              { id: "goals",    label: "Tip Goal",  icon: Target    },
              { id: "tipmenu",  label: "Tip Menu",  icon: DollarSign },
              { id: "chatmod",  label: "Chat Mod",  icon: Shield    },
              { id: "settings", label: "Settings",  icon: Settings2 },
              { id: "stats",    label: "Stats",     icon: BarChart2 },
              { id: "drop",     label: "Drop",      icon: Sparkles  },
              { id: "subs",     label: "Subs",      icon: Bell      },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
                style={activeTab === tab.id
                  ? { color: "#14b8a6", borderBottom: "2px solid #14b8a6" }
                  : { color: "rgba(255,255,255,0.4)", borderBottom: "2px solid transparent" }
                }>
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                {tab.id === "subs" && sessionSubs.length > 0 && (
                  <span className="absolute top-1.5 right-1 w-4 h-4 rounded-full text-white flex items-center justify-center font-black"
                    style={{ background: "#ec4899", fontSize: "9px" }}>
                    {sessionSubs.length > 9 ? "9+" : sessionSubs.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-5" style={{ minHeight: 0 }}>

            {/* ── Goals tab ─────────────────────────────────────────────── */}
            {activeTab === "goals" && (
              <div className="space-y-4">

                {/* ── ACTIVE GOAL card ──────────────────────────────────────── */}
                {goal ? (
                  <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(20,184,166,0.25)", background: "rgba(20,184,166,0.05)" }}>
                    {/* Header row */}
                    <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(20,184,166,0.15)" }}>
                        <Target className="w-4 h-4" style={{ color: "#14b8a6" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#14b8a6" }}>Active Goal</p>
                        <p className="text-base font-bold text-white truncate">{goal.title}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-black font-mono" style={{ color: "#14b8a6" }}>
                          {Math.round(Math.min(100, (goal.current / goal.target) * 100))}%
                        </p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {goal.current.toLocaleString()} / {goal.target.toLocaleString()} cr
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="px-4 pb-3">
                      <div className="h-5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                        <div className="h-full rounded-full transition-all duration-700 relative flex items-center"
                          style={{
                            width: `${Math.min(100, (goal.current / goal.target) * 100)}%`,
                            background: goal.current >= goal.target
                              ? "linear-gradient(90deg, #14b8a6, #10b981)"
                              : "linear-gradient(90deg, #14b8a6, #0d9488)",
                            minWidth: goal.current > 0 ? "2.5rem" : "0",
                          }}>
                          {(goal.current / goal.target) > 0.12 && (
                            <span className="absolute right-2 text-xs font-black text-white">
                              {Math.round((goal.current / goal.target) * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Goal reached state */}
                    {goal.current >= goal.target ? (
                      <div className="mx-4 mb-4 px-4 py-3 rounded-xl text-center"
                        style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}>
                        <p className="text-sm font-bold mb-0.5" style={{ color: "#34d399" }}>🎉 Goal Reached!</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Deliver the show, then start a new goal below.</p>
                      </div>
                    ) : (
                      <div className="px-4 pb-1">
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                          Viewers can see this bar in real time — tips push it forward.
                        </p>
                      </div>
                    )}

                    {/* End Goal button — prominent, unmistakable */}
                    <div className="px-4 pb-4 pt-2">
                      <button
                        onClick={() => {
                          setGoal(null);
                          showToast({ title: "Goal ended", description: "The tip goal has been cleared for your viewers." });
                        }}
                        className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
                        style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#f87171" }}>
                        <X className="w-4 h-4" /> End Goal &amp; Remove from Stream
                      </button>
                    </div>
                  </div>
                ) : (
                  /* No goal — empty state */
                  <div className="rounded-2xl p-6 text-center" style={{ border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                    <Target className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
                    <p className="text-sm font-semibold text-white mb-1">No active tip goal</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Start one below — viewers will see the live progress bar.</p>
                  </div>
                )}

                {/* ── CREATE / REPLACE GOAL form ─────────────────────────── */}
                <div className="vl-card p-4">
                  <h4 className="text-xs font-bold text-white mb-0.5">
                    {goal ? "Replace Goal" : "Start a Tip Goal"}
                  </h4>
                  <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {goal ? "Starting a new goal will immediately replace the current one." : "Pick a preset or type your own — the bar goes live instantly."}
                  </p>

                  {/* Quick-pick presets */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { emoji: "🔥", label: "Special Show", amount: 1000 },
                      { emoji: "💃", label: "Dance for Me", amount: 500 },
                      { emoji: "📸", label: "Selfie Set", amount: 750 },
                      { emoji: "🎭", label: "Costume Change", amount: 300 },
                      { emoji: "🎁", label: "Surprise Show", amount: 2000 },
                      { emoji: "👑", label: "VIP Unlock", amount: 5000 },
                    ].map(p => (
                      <button key={p.label}
                        onClick={() => { setGoalTitle(`${p.emoji} ${p.label}`); setGoalTarget(String(p.amount)); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all hover:opacity-90 active:scale-95"
                        style={{
                          background: goalTitle === `${p.emoji} ${p.label}` ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.04)",
                          border: goalTitle === `${p.emoji} ${p.label}` ? "1px solid rgba(20,184,166,0.35)" : "1px solid rgba(255,255,255,0.07)",
                        }}>
                        <span className="text-lg">{p.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{p.label}</p>
                          <p className="text-xs font-mono" style={{ color: "#14b8a6" }}>{p.amount.toLocaleString()} cr</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Custom title + amount */}
                  <div className="space-y-2">
                    <input value={goalTitle} onChange={e => setGoalTitle(e.target.value)}
                      placeholder="Custom goal name…"
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }}
                    />
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#14b8a6" }} />
                        <input value={goalTarget} onChange={e => setGoalTarget(e.target.value)}
                          placeholder="Credit target"
                          type="number" min="10"
                          className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm text-white"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }}
                        />
                      </div>
                      <button onClick={setNewGoal}
                        disabled={!goalTitle.trim() || !goalTarget}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white" }}>
                        {goal ? "Replace" : "Go Live"}
                      </button>
                    </div>
                    {/* Quick amount chips */}
                    <div className="flex gap-1.5 flex-wrap">
                      {[250, 500, 1000, 2000, 5000, 10000].map(n => (
                        <button key={n} onClick={() => setGoalTarget(String(n))}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                          style={{
                            background: goalTarget === String(n) ? "rgba(20,184,166,0.2)" : "rgba(20,184,166,0.07)",
                            border: goalTarget === String(n) ? "1px solid rgba(20,184,166,0.5)" : "1px solid rgba(20,184,166,0.18)",
                            color: "#14b8a6",
                          }}>
                          {n >= 1000 ? `${n / 1000}k` : n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tip Menu tab ──────────────────────────────────────────── */}
            {activeTab === "tipmenu" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Tip Menu</h3>
                  <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Show viewers exactly what they can unlock with their credits. Pin to chat so everyone can see.
                  </p>

                  {/* Current items */}
                  <div className="space-y-2 mb-4">
                    {tipMenu.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <span className="text-lg">{item.emoji}</span>
                        <span className="flex-1 text-sm text-white font-medium">{item.name}</span>
                        <span className="text-sm font-bold font-mono" style={{ color: "#14b8a6" }}>
                          {item.credits.toLocaleString()} cr
                        </span>
                        <button onClick={() => setTipMenu(m => m.filter((_, i) => i !== idx))}
                          className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                          style={{ color: "rgba(255,255,255,0.3)" }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add new item */}
                  <div className="vl-card p-4">
                    <h4 className="text-xs font-bold text-white mb-3">Add Item</h4>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        {/* Emoji picker */}
                        <div className="relative">
                          <button onClick={() => setShowEmojiPicker(s => !s)}
                            className="w-11 h-10 rounded-lg text-xl flex items-center justify-center transition-all hover:bg-white/10"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            {newItemEmoji}
                          </button>
                          {showEmojiPicker && (
                            <div className="absolute top-full left-0 mt-1 z-50 p-2 rounded-xl grid grid-cols-4 gap-1"
                              style={{ background: "rgba(13,13,30,0.98)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                              {EMOJI_OPTIONS.map(e => (
                                <button key={e} onClick={() => { setNewItemEmoji(e); setShowEmojiPicker(false); }}
                                  className="w-9 h-9 text-lg rounded-lg hover:bg-white/10 transition-colors">
                                  {e}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <input value={newItemName} onChange={e => setNewItemName(e.target.value)}
                          placeholder="Item name"
                          className="flex-1 px-3 py-2 rounded-lg text-sm text-white"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }}
                        />
                        <div className="relative w-28">
                          <Zap className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: "#14b8a6" }} />
                          <input value={newItemCredits} onChange={e => setNewItemCredits(e.target.value)}
                            placeholder="Credits"
                            type="number" min="1"
                            className="w-full pl-7 pr-2 py-2 rounded-lg text-sm text-white"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }}
                          />
                        </div>
                      </div>
                      <button onClick={addTipItem}
                        className="w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                        style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6" }}>
                        <Plus className="w-4 h-4" /> Add to Menu
                      </button>
                    </div>
                  </div>

                  {/* Pin menu to chat */}
                  <button
                    onClick={() => {
                      const menuText = tipMenu.map(i => `${i.emoji} ${i.name} — ${i.credits} credits`).join(" · ");
                      setChatMsgs(prev => [...prev, {
                        id: String(Date.now()),
                        username: "📋 Tip Menu",
                        text: menuText,
                        creditTip: 0,
                        isNotice: true,
                        timestamp: Date.now(),
                      }]);
                      showToast({ title: "Tip menu posted to chat" });
                    }}
                    className="mt-3 w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:bg-white/5"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }}>
                    <Megaphone className="w-4 h-4" /> Post Menu to Chat
                  </button>
                </div>
              </div>
            )}

            {/* ── Chat Mod tab ──────────────────────────────────────────── */}
            {activeTab === "chatmod" && (
              <div className="space-y-5">
                {/* Chat mode */}
                <div>
                  <h3 className="text-sm font-bold text-white mb-3">Chat Mode</h3>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {([
                      { id: "normal", label: "Normal", desc: "Everyone can chat", icon: MessageSquare },
                      { id: "slow", label: "Slow Mode", desc: `1 msg per ${slowInterval}s`, icon: Clock },
                      { id: "sub-only", label: "Subs Only", desc: "Subscribers only", icon: Star },
                      { id: "followers-only", label: "Followers", desc: "Followers only", icon: Users },
                    ] as const).map(mode => (
                      <button key={mode.id} onClick={() => { setChatMode(mode.id); showToast({ title: `Chat: ${mode.label}` }); }}
                        className="flex items-start gap-2 p-3 rounded-xl text-left transition-all"
                        style={chatMode === mode.id
                          ? { background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.4)" }
                          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }
                        }>
                        <mode.icon className="w-4 h-4 mt-0.5 flex-shrink-0"
                          style={{ color: chatMode === mode.id ? "#14b8a6" : "rgba(255,255,255,0.4)" }} />
                        <div>
                          <p className="text-xs font-bold" style={{ color: chatMode === mode.id ? "#14b8a6" : "rgba(255,255,255,0.8)" }}>{mode.label}</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{mode.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {chatMode === "slow" && (
                    <div className="flex gap-2">
                      {[5, 10, 15, 30, 60].map(s => (
                        <button key={s} onClick={() => setSlowInterval(s)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                          style={slowInterval === s
                            ? { background: "#14b8a6", color: "white" }
                            : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }
                          }>{s}s</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Room notice */}
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">Room Notice</h3>
                  <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Broadcast a highlighted message to all viewers.
                  </p>
                  <div className="flex gap-2">
                    <input value={noticeText} onChange={e => setNoticeText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") broadcastNotice(); }}
                      placeholder="Type your announcement…"
                      className="flex-1 px-3 py-2.5 rounded-lg text-sm text-white"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }}
                    />
                    <button onClick={broadcastNotice}
                      className="px-4 py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-90"
                      style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6" }}>
                      <Megaphone className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Polls */}
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">Create Poll</h3>
                  <div className="space-y-2">
                    <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)}
                      placeholder="Poll question…"
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-white"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }}
                    />
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <input value={opt} onChange={e => setPollOptions(opts => opts.map((o, j) => j === i ? e.target.value : o))}
                          placeholder={`Option ${i + 1}`}
                          className="flex-1 px-3 py-2 rounded-lg text-sm text-white"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }}
                        />
                        {pollOptions.length > 2 && (
                          <button onClick={() => setPollOptions(opts => opts.filter((_, j) => j !== i))}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            style={{ color: "rgba(255,255,255,0.3)" }}>
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 4 && (
                      <button onClick={() => setPollOptions(o => [...o, ""])}
                        className="flex items-center gap-1 text-xs transition-colors hover:text-white"
                        style={{ color: "rgba(255,255,255,0.4)" }}>
                        <Plus className="w-3.5 h-3.5" /> Add option
                      </button>
                    )}
                    <div className="flex gap-2 items-center">
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Duration:</span>
                      {[30, 60, 120, 300].map(s => (
                        <button key={s} onClick={() => setPollDuration(s)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                          style={pollDuration === s
                            ? { background: "#a78bfa", color: "white" }
                            : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }
                          }>{s < 60 ? `${s}s` : `${s / 60}m`}</button>
                      ))}
                    </div>
                    <button onClick={createPoll}
                      disabled={!!poll && pollSecsLeft > 0}
                      className="w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
                      style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}>
                      <BarChart className="w-4 h-4" />
                      {poll && pollSecsLeft > 0 ? `Poll active (${pollSecsLeft}s)` : "Start Poll"}
                    </button>
                  </div>
                </div>

                {/* Kick user */}
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">Kick / Remove Viewer</h3>
                  <div className="flex gap-2">
                    <input value={kickInput} onChange={e => setKickInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") kickUser(); }}
                      placeholder="@username to kick"
                      className="flex-1 px-3 py-2.5 rounded-lg text-sm text-white"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }}
                    />
                    <button onClick={kickUser}
                      className="px-4 py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-90"
                      style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                      Kick
                    </button>
                  </div>
                  {mutedUsers.size > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {[...mutedUsers].map(u => (
                        <span key={u} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                          style={{ background: "rgba(239,68,68,0.08)", color: "#fca5a5" }}>
                          {u}
                          <button onClick={() => setMutedUsers(s => { const n = new Set(s); n.delete(u); return n; })}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Settings tab ─────────────────────────────────────────── */}
            {activeTab === "settings" && (
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-white mb-3">Stream Settings</h3>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>Title</label>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>Category</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {CATEGORIES.map(cat => (
                      <button key={cat} onClick={() => setEditCategory(cat)}
                        className="px-2 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={editCategory === cat
                          ? { background: "rgba(20,184,166,0.18)", border: "1px solid rgba(20,184,166,0.5)", color: "#14b8a6" }
                          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }
                        }>{cat}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>Tags</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {editTags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                        style={{ background: "rgba(20,184,166,0.1)", color: "#14b8a6" }}>
                        #{tag}
                        <button onClick={() => setEditTags(t => t.filter(x => x !== tag))}><X className="w-2.5 h-2.5" /></button>
                      </span>
                    ))}
                  </div>
                  <input value={editTagInput}
                    onChange={e => setEditTagInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    onKeyDown={e => {
                      if ((e.key === "Enter" || e.key === " ") && editTagInput.trim()) {
                        e.preventDefault();
                        if (!editTags.includes(editTagInput.trim())) setEditTags(t => [...t, editTagInput.trim()]);
                        setEditTagInput("");
                      }
                    }}
                    placeholder="Add tag + Enter"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.15)" }}>
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4" style={{ color: "#a78bfa" }} />
                    <span className="text-sm text-white">VIP Only</span>
                  </div>
                  <button onClick={() => setEditVip(v => !v)}
                    className="w-11 h-6 rounded-full transition-all relative"
                    style={{ background: editVip ? "#a78bfa" : "rgba(255,255,255,0.1)" }}>
                    <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                      style={{ left: editVip ? "calc(100% - 22px)" : "2px" }} />
                  </button>
                </div>

                {/* Private show teaser */}
                <div className="p-4 rounded-xl" style={{ background: "rgba(232,168,124,0.06)", border: "1px solid rgba(232,168,124,0.15)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-4 h-4" style={{ color: "#e8a87c" }} />
                    <span className="text-sm font-bold" style={{ color: "#e8a87c" }}>Private Show</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(232,168,124,0.15)", color: "#e8a87c" }}>Coming Soon</span>
                  </div>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Lock your stream to one paying viewer at a premium rate — like Chaturbate's private shows.
                  </p>
                </div>
              </div>
            )}

            {/* ── Stats tab ─────────────────────────────────────────────── */}
            {activeTab === "stats" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white mb-1">Session Statistics</h3>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Duration", value: formatDuration(duration), icon: Clock, color: "#14b8a6" },
                    { label: "Viewers", value: currentViewers.toLocaleString(), icon: Eye, color: "#a78bfa" },
                    { label: "Peak", value: peakViewers.toLocaleString(), icon: Users, color: "#f97316" },
                    { label: "Earned", value: `${sessionEarnings.toLocaleString()} cr`, icon: Zap, color: "#e8a87c" },
                  ].map(s => (
                    <div key={s.label} className="vl-card p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{s.label}</span>
                      </div>
                      <p className="text-xl font-black text-white">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Top tippers */}
                <div className="vl-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-4 h-4" style={{ color: "#e8a87c" }} />
                    <h4 className="text-sm font-bold text-white">Top Tippers</h4>
                  </div>
                  {topTippers.length === 0 ? (
                    <p className="text-xs text-center py-4" style={{ color: "rgba(255,255,255,0.35)" }}>
                      No tips yet — tips will appear here
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {topTippers.slice(0, 8).map((t, i) => (
                        <div key={t.username} className="flex items-center gap-2">
                          <span className="text-xs font-bold w-4 text-center"
                            style={{ color: i === 0 ? "#fbbf24" : i === 1 ? "#e2e8f0" : i === 2 ? "#cd7f32" : "rgba(255,255,255,0.35)" }}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                          </span>
                          <span className="flex-1 text-xs text-white">{t.username}</span>
                          <span className="text-xs font-bold font-mono" style={{ color: "#14b8a6" }}>
                            {t.total.toLocaleString()} cr
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Earnings breakdown */}
                <div className="vl-card p-4">
                  <h4 className="text-sm font-bold text-white mb-3">Earnings Breakdown</h4>
                  <div className="space-y-2">
                    {[
                      { label: "Tips", amount: Math.round(sessionEarnings * 0.7), color: "#e8a87c" },
                      { label: "Gifts", amount: Math.round(sessionEarnings * 0.2), color: "#a78bfa" },
                      { label: "Subs", amount: Math.round(sessionEarnings * 0.1), color: "#14b8a6" },
                    ].map(row => (
                      <div key={row.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: "rgba(255,255,255,0.5)" }}>{row.label}</span>
                          <span style={{ color: row.color }}>{row.amount.toLocaleString()} cr</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <div className="h-full rounded-full"
                            style={{
                              width: sessionEarnings > 0 ? `${(row.amount / sessionEarnings) * 100}%` : "0%",
                              background: row.color,
                              transition: "width 0.5s",
                            }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Drop tab ──────────────────────────────────────────────── */}
            {activeTab === "drop" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Creator Drop</h3>
                  <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Send a free gift to your viewers. Choose what to give, set slots and a claim window — chatters see a CLAIM button in real time.
                  </p>
                </div>

                {dropIsActive ? (
                  <>
                    {/* Active drop banner */}
                    <div className="p-4 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.1), rgba(236,72,153,0.06))", border: "1px solid rgba(20,184,166,0.35)" }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{selectedDropType.emoji}</span>
                          <span className="text-sm font-bold text-white">DROP LIVE</span>
                          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#14b8a6" }} />
                        </div>
                        <button onClick={stopDrop}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                          style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                          <Square className="w-3 h-3" /> Close Drop
                        </button>
                      </div>

                      {/* What's being dropped */}
                      <div className="px-3 py-2 rounded-lg mb-3"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{selectedDropType.name}</p>
                        <p className="text-sm font-semibold text-white">{dropDescription}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Time Left</p>
                          <p className="text-lg font-black font-mono text-white">
                            {Math.floor(dropSecsLeft / 60)}:{String(dropSecsLeft % 60).padStart(2, "0")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Claimed</p>
                          <p className="text-lg font-black" style={{ color: "#14b8a6" }}>{dropClaims.length}</p>
                        </div>
                        <div>
                          <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Slots</p>
                          <p className="text-lg font-black text-white">
                            {dropQuantity === -1 ? "∞" : `${dropQuantity - dropClaims.length} left`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Claimers feed */}
                    <div className="vl-card p-4">
                      <h4 className="text-xs font-bold text-white mb-3">Claimers ({dropClaims.length})</h4>
                      {dropClaims.length === 0 ? (
                        <p className="text-xs text-center py-4" style={{ color: "rgba(255,255,255,0.3)" }}>
                          Waiting for first claim…
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-64 overflow-y-auto">
                          {[...dropClaims].reverse().map((claim, i) => (
                            <div key={`${claim.username}-${claim.claimedAt}`}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                              style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.1)" }}>
                              <span className="text-xs font-bold w-5 text-center"
                                style={{ color: "rgba(255,255,255,0.3)" }}>
                                {dropClaims.length - i}
                              </span>
                              <span className="flex-1 text-xs font-semibold text-white truncate">{claim.username}</span>
                              <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                                {new Date(claim.claimedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Drop type picker */}
                    <div className="vl-card p-4">
                      <h4 className="text-xs font-bold text-white mb-3">What are you dropping?</h4>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {CREATOR_DROP_TYPES.map(t => (
                          <button key={t.id} onClick={() => setDropType(t.id)}
                            className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all"
                            style={dropType === t.id
                              ? { background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.5)" }
                              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }
                            }>
                            <span className="text-xl">{t.emoji}</span>
                            <span className="text-xs font-semibold text-center leading-tight"
                              style={{ color: dropType === t.id ? "#14b8a6" : "rgba(255,255,255,0.6)" }}>
                              {t.name}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Description */}
                      <div className="mb-4">
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                          Describe the prize
                        </label>
                        <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                          {selectedDropType.hint}
                        </p>
                        <textarea
                          value={dropDescription}
                          onChange={e => setDropDescription(e.target.value)}
                          placeholder={`e.g. "${selectedDropType.emoji} First ${dropQuantity === -1 ? "10" : dropQuantity} viewers get a personal shoutout right now!"`}
                          rows={2}
                          className="w-full px-3 py-2.5 rounded-xl text-sm text-white resize-none"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", outline: "none" }}
                        />
                      </div>

                      {/* Quantity */}
                      <div className="mb-4">
                        <label className="block text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                          How many slots?
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {[1, 5, 10, 25, 50, -1].map(q => (
                            <button key={q} onClick={() => setDropQuantity(q)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                              style={dropQuantity === q
                                ? { background: "#14b8a6", color: "white" }
                                : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }
                              }>
                              {q === -1 ? "∞ Unlimited" : q}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Claim window */}
                      <div className="mb-5">
                        <label className="block text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                          Claim window
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {DROP_CLAIM_WINDOWS.map(w => (
                            <button key={w.secs} onClick={() => setDropWindow(w.secs)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                              style={dropWindow === w.secs
                                ? { background: "#a78bfa", color: "white" }
                                : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }
                              }>
                              {w.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Launch button */}
                      <button onClick={startDrop}
                        className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                        style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white" }}>
                        <Gift className="w-4 h-4" /> Launch Drop to Viewers
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            {/* ── Subs tab ──────────────────────────────────────────────── */}
            {activeTab === "subs" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Subscribers This Session</h3>
                  <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                    New subscribers appear here in real time. Action items flag what you owe them based on their tier.
                  </p>
                </div>

                {sessionSubs.length === 0 ? (
                  <div className="vl-card p-8 text-center" style={{ border: "1px dashed rgba(255,255,255,0.1)" }}>
                    <Bell className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
                    <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>No subscribers yet</p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>New subs appear here instantly</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...sessionSubs].reverse().map(notif => {
                      const actions = TIER_ACTION_ITEMS[notif.tierId] ?? [];
                      return (
                        <div key={notif.id} className="vl-card p-4"
                          style={{ border: actions.length > 0 ? "1px solid rgba(245,158,11,0.25)" : "1px solid rgba(255,255,255,0.07)" }}>
                          {/* Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                              style={{ background: "rgba(255,255,255,0.06)" }}>
                              {notif.tierEmoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white truncate">{notif.subscriberUsername}</span>
                                <span className="text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0"
                                  style={{ background: "rgba(236,72,153,0.15)", color: "#ec4899" }}>
                                  {notif.tierEmoji} {notif.tierName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold" style={{ color: "#14b8a6" }}>{notif.priceStr}/mo</span>
                                <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                                  {new Date(notif.subscribedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action items for this tier */}
                          {actions.length > 0 && (
                            <div className="mt-2 p-3 rounded-xl"
                              style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
                              <p className="text-xs font-bold mb-2" style={{ color: "#f59e0b" }}>
                                ⚡ Action Required — {notif.tierName} perks
                              </p>
                              <ul className="space-y-1">
                                {actions.map((action, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                                    <span className="flex-shrink-0 mt-0.5">{action.split(" ")[0]}</span>
                                    <span>{action.slice(action.indexOf(" ") + 1)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Perks reminder (collapsible — show for action tiers) */}
                          {actions.length === 0 && notif.perks.length > 0 && (
                            <div className="space-y-1 mt-1">
                              {notif.perks.map((perk, i) => (
                                <p key={i} className="text-xs flex items-start gap-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                                  <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "#14b8a6" }} />
                                  {perk}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Session sub revenue summary */}
                {sessionSubs.length > 0 && (
                  <div className="vl-card p-4">
                    <h4 className="text-xs font-bold text-white mb-3">Session Subscription Revenue</h4>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Total subscriptions</span>
                      <span className="text-sm font-bold text-white">{sessionSubs.length}</span>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Gross revenue</span>
                      <span className="text-sm font-bold" style={{ color: "#ec4899" }}>
                        ${sessionSubs.reduce((s, n) => s + n.price, 0).toFixed(2)}/mo
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Your share (70%)</span>
                      <span className="text-sm font-bold" style={{ color: "#14b8a6" }}>
                        ${(sessionSubs.reduce((s, n) => s + n.price, 0) * 0.7).toFixed(2)}/mo
                      </span>
                    </div>
                    <div className="mt-3 space-y-1">
                      {sessionSubs.map(n => (
                        <div key={n.id} className="flex items-center justify-between text-xs">
                          <span style={{ color: "rgba(255,255,255,0.45)" }}>{n.tierEmoji} {n.subscriberUsername}</span>
                          <span style={{ color: "#14b8a6" }}>{n.priceStr}/mo</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ── Col 3: Right sidebar ─────────────────────────────────────────── */}
        <div className="w-60 flex-shrink-0 overflow-y-auto p-4 space-y-4">

          {/* Session earnings */}
          <div className="vl-card p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5" style={{ color: "#14b8a6" }} />
              <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>Session Earnings</span>
            </div>
            <p className="text-2xl font-black" style={{ color: "#14b8a6" }}>
              {sessionEarnings.toLocaleString()}
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>credits earned</p>
          </div>

          {/* Viewer stats */}
          <div className="vl-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Watching</span>
              </div>
              <span className="text-base font-bold text-white">{currentViewers.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" style={{ color: "#f97316" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Peak</span>
              </div>
              <span className="text-base font-bold text-white">{peakViewers.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" style={{ color: "#14b8a6" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Duration</span>
              </div>
              <span className="text-sm font-mono font-bold text-white">{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Top tippers quick view */}
          <div className="vl-card p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Trophy className="w-3.5 h-3.5" style={{ color: "#e8a87c" }} />
              <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>Top Tippers</span>
            </div>
            {topTippers.length === 0 ? (
              <p className="text-xs text-center py-2" style={{ color: "rgba(255,255,255,0.25)" }}>Waiting for first tip…</p>
            ) : (
              <div className="space-y-2">
                {topTippers.slice(0, 5).map((t, i) => (
                  <div key={t.username} className="flex items-center gap-2">
                    <span className="text-xs w-4">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                    <span className="flex-1 text-xs text-white truncate">{t.username}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: "#14b8a6" }}>{t.total}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat mode indicator */}
          <div className="vl-card p-3">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" style={{ color: chatMode === "normal" ? "rgba(255,255,255,0.3)" : "#14b8a6" }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>Chat Mode</p>
                <p className="text-xs font-bold capitalize" style={{ color: chatMode === "normal" ? "rgba(255,255,255,0.4)" : "#14b8a6" }}>
                  {chatMode === "slow" ? `Slow (${slowInterval}s)` : chatMode.replace("-", " ")}
                </p>
              </div>
            </div>
          </div>

          {/* Active goal quick view */}
          {goal && (
            <div className="vl-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3.5 h-3.5" style={{ color: "#14b8a6" }} />
                <span className="text-xs font-semibold text-white truncate">{goal.title}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden mb-1" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full"
                  style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%`, background: "#14b8a6", transition: "width 0.5s" }} />
              </div>
              <p className="text-xs font-mono" style={{ color: "#14b8a6" }}>
                {goal.current.toLocaleString()} / {goal.target.toLocaleString()}
              </p>
            </div>
          )}

          {/* Active drop quick view */}
          {dropIsActive && (
            <div className="vl-card p-3" style={{ border: "1px solid rgba(20,184,166,0.3)" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base leading-none">{selectedDropType.emoji}</span>
                <span className="text-xs font-bold" style={{ color: "#14b8a6" }}>DROP LIVE</span>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse ml-auto" style={{ background: "#14b8a6" }} />
              </div>
              <p className="text-sm font-black font-mono text-white">
                {Math.floor(dropSecsLeft / 60)}:{String(dropSecsLeft % 60).padStart(2, "0")}
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                {dropClaims.length} claimed{dropQuantity !== -1 ? ` / ${dropQuantity}` : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
