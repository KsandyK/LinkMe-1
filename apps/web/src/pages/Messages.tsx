import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Send, Radio, Smile, MessageCircle, RefreshCw, Plus, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { messages as msgApi, ConversationItem, MessageItem } from "@/lib/api";
import { MOCK_PROFILES } from "@/lib/mock-data";
import { createMsgSocket, CravrSocket } from "@/lib/socket";
import { ReportButton } from "@/components/ReportButton";

const QUICK_REPLIES = ["Hey! 👋", "You're amazing!", "When are you live next?", "❤️"];

// ── Local (offline) conversation store ───────────────────────────────────────
const LOCAL_CONVS_KEY = "vl_local_convs_v1";

interface LocalConvRecord {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isLive: boolean;
  lastMsg: string | null;
  lastMsgAt: string;
}

function localConvId(userId: string) { return `local-${userId}`; }
function isLocalId(id: string) { return id.startsWith("local-"); }

function loadLocalConvs(): LocalConvRecord[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_CONVS_KEY) ?? "[]"); } catch { return []; }
}

function saveLocalConv(r: LocalConvRecord) {
  const existing = loadLocalConvs().filter(c => c.userId !== r.userId);
  existing.unshift(r);
  try { localStorage.setItem(LOCAL_CONVS_KEY, JSON.stringify(existing)); } catch {}
}

function localMsgsKey(convId: string) { return `vl_msgs_${convId}_v1`; }

function loadLocalMsgs(convId: string): MessageItem[] {
  try { return JSON.parse(localStorage.getItem(localMsgsKey(convId)) ?? "[]"); } catch { return []; }
}

function saveLocalMsg(convId: string, msg: MessageItem) {
  const msgs = loadLocalMsgs(convId);
  msgs.push(msg);
  try { localStorage.setItem(localMsgsKey(convId), JSON.stringify(msgs)); } catch {}
}

function localConvsToItems(records: LocalConvRecord[]): ConversationItem[] {
  return records.map(r => ({
    id: localConvId(r.userId),
    updatedAt: r.lastMsgAt,
    lastReadAt: null,
    lastMessage: r.lastMsg ? {
      id: "lm-last",
      conversationId: localConvId(r.userId),
      senderId: r.userId,
      text: r.lastMsg,
      createdAt: r.lastMsgAt,
      creditCost: 0,
      sender: { id: r.userId, username: r.username },
    } : null,
    otherParticipant: {
      id: r.userId,
      username: r.username,
      profile: { displayName: r.displayName ?? undefined, avatarUrl: r.avatarUrl ?? undefined },
      creatorProfile: { isLive: r.isLive },
    },
  }));
}

// Look up avatar for a userId/username from mock data
function resolveAvatar(userId: string, username: string): string | null {
  const match = MOCK_PROFILES.find(p => p.id === userId || p.username === username);
  return match?.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function displayName(p: ConversationItem["otherParticipant"]): string {
  if (!p) return "Unknown";
  return p.profile?.displayName ?? p.username ?? "Unknown";
}

function avatarInitial(p: ConversationItem["otherParticipant"]): string {
  return (displayName(p)[0] ?? "?").toUpperCase();
}

function avatarUrl(p: ConversationItem["otherParticipant"]): string | null {
  return p?.profile?.avatarUrl ?? null;
}

// ── Suggested creators for empty state (first 6 MOCK_PROFILES) ───────────────
const SUGGESTIONS = MOCK_PROFILES.slice(0, 6);

export default function Messages() {
  const { isLoggedIn, token, showToast, user, spendCredits } = useApp();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<CravrSocket | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const urlProcessedRef = useRef(false);

  const selectedConv = conversations.find(c => c.id === selectedId) ?? null;

  // ── Load conversations (API → fallback to local) ─────────────────────────
  const loadConversations = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoadingConvs(true);
    let apiConvs: ConversationItem[] = [];
    try {
      const data = await msgApi.conversations();
      apiConvs = Array.isArray(data) ? data : [];
    } catch {
      // API unavailable — use local only
    }
    // Merge: API convs first, then local convs not already present in API results
    const apiUserIds = new Set(apiConvs.map(c => c.otherParticipant?.id ?? ""));
    const localItems = localConvsToItems(loadLocalConvs()).filter(
      c => !apiUserIds.has(c.otherParticipant?.id ?? "")
    );
    setConversations([...apiConvs, ...localItems]);
    setLoadingConvs(false);
  }, [isLoggedIn]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ── Handle ?with=userId URL param ────────────────────────────────────────
  useEffect(() => {
    if (urlProcessedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const withId = params.get("with");
    const withUsername = params.get("username") ?? "";
    const withName = params.get("name") ?? withUsername;
    if (!withId) return;
    urlProcessedRef.current = true;
    // Clean URL without reload
    window.history.replaceState(null, "", window.location.pathname);
    // Find or create a local conv for this user
    const existing = loadLocalConvs().find(c => c.userId === withId);
    if (!existing) {
      const av = resolveAvatar(withId, withUsername);
      const mockProfile = MOCK_PROFILES.find(p => p.id === withId || p.username === withUsername);
      saveLocalConv({
        userId: withId,
        username: withUsername || withId,
        displayName: withName || null,
        avatarUrl: av,
        isLive: mockProfile?.isLive ?? false,
        lastMsg: null,
        lastMsgAt: new Date().toISOString(),
      });
    }
    const targetId = localConvId(withId);
    // Reload convs then auto-select
    setConversations(prev => {
      const alreadyThere = prev.some(c => c.id === targetId);
      if (alreadyThere) return prev;
      return [
        ...localConvsToItems(loadLocalConvs()).filter(c => c.id === targetId),
        ...prev,
      ];
    });
    // Slight delay so list is populated before selecting
    setTimeout(() => {
      setSelectedId(targetId);
      selectedIdRef.current = targetId;
      setMessages(loadLocalMsgs(targetId));
      setTimeout(() => inputRef.current?.focus(), 80);
    }, 50);
  }, []);

  // ── WebSocket setup ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn || !token) return;
    const ws = createMsgSocket(token);
    wsRef.current = ws;
    const unsub = ws.on("new_message", (data) => {
      const msg = data.message as MessageItem;
      if (!msg) return;
      if (msg.conversationId === selectedIdRef.current) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === msg.id);
          if (exists) return prev;
          return [...prev.filter(m => !m.id.startsWith("opt-")), msg];
        });
      }
      loadConversations();
    });
    const unsubTyping = ws.on("typing_indicator", (data) => {
      if (data.conversationId === selectedIdRef.current && data.userId !== user?.id) {
        setIsTyping(Boolean(data.isTyping));
      }
    });
    return () => { unsub(); unsubTyping(); ws.close(); wsRef.current = null; };
  }, [isLoggedIn, token, loadConversations, user?.id]);

  // ── Load messages for a conversation ────────────────────────────────────
  const loadMessages = useCallback(async (convId: string) => {
    if (isLocalId(convId)) {
      setMessages(loadLocalMsgs(convId));
      return;
    }
    setLoadingMsgs(true);
    try {
      const data = await msgApi.history(convId, { limit: 50 });
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  const selectConversation = (id: string) => {
    if (selectedIdRef.current && wsRef.current) {
      wsRef.current.send({ type: "leave_conversation" });
    }
    setSelectedId(id);
    selectedIdRef.current = id;
    setDraft("");
    setIsTyping(false);
    setShowNewChat(false);
    loadMessages(id);
    if (wsRef.current && !isLocalId(id)) {
      wsRef.current.send({ type: "join_conversation", conversationId: id });
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // ── Start a new local chat from the suggestions panel ───────────────────
  const startLocalChat = (profile: typeof MOCK_PROFILES[0]) => {
    const existing = loadLocalConvs().find(c => c.userId === profile.id);
    if (!existing) {
      saveLocalConv({
        userId: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl ?? null,
        isLive: profile.isLive ?? false,
        lastMsg: null,
        lastMsgAt: new Date().toISOString(),
      });
    }
    const convId = localConvId(profile.id);
    setConversations(prev => {
      if (prev.some(c => c.id === convId)) return prev;
      return [
        ...localConvsToItems([{
          userId: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl ?? null,
          isLive: profile.isLive ?? false,
          lastMsg: null,
          lastMsgAt: new Date().toISOString(),
        }]),
        ...prev,
      ];
    });
    setTimeout(() => selectConversation(convId), 30);
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const MSG_CREDIT_COST = 5;

  // ── Send a message ───────────────────────────────────────────────────────
  const sendMessage = async (text: string = draft.trim()) => {
    if (!text || !selectedId || sending) return;
    const ok = spendCredits(MSG_CREDIT_COST, "Message sent");
    if (!ok) return;
    setSending(true);
    setDraft("");

    const myId = user?.id ?? "me";
    const optimistic: MessageItem = {
      id: `opt-${Date.now()}`,
      conversationId: selectedId,
      senderId: myId,
      text,
      createdAt: new Date().toISOString(),
      creditCost: 0,
      sender: { id: myId, username: user?.username ?? "me" },
    };
    setMessages(prev => [...prev, optimistic]);

    if (isLocalId(selectedId)) {
      // Local-only conversation — persist to localStorage
      const finalMsg: MessageItem = { ...optimistic, id: `local-${Date.now()}` };
      saveLocalMsg(selectedId, finalMsg);
      setMessages(prev => prev.map(m => m.id === optimistic.id ? finalMsg : m));
      // Update conv's last message
      const convs = loadLocalConvs();
      const rec = convs.find(c => localConvId(c.userId) === selectedId);
      if (rec) {
        saveLocalConv({ ...rec, lastMsg: text, lastMsgAt: finalMsg.createdAt });
        setConversations(prev => prev.map(c =>
          c.id === selectedId
            ? { ...c, lastMessage: finalMsg, updatedAt: finalMsg.createdAt }
            : c
        ));
      }
      setSending(false);

      // Simulate creator reply after 2-4s
      const delay = 2000 + Math.random() * 2000;
      const otherPart = conversations.find(c => c.id === selectedId)?.otherParticipant;
      const otherName = displayName(otherPart ?? null);
      const replies = [
        "Hey! Thanks for reaching out 💕",
        "Aww that's so sweet, thank you! 🥰",
        "Thanks for the message! Check out my live stream tonight 🔥",
        "Hey there! Lovely to hear from you ✨",
        "Hi! I appreciate you 💖",
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      setTimeout(() => {
        const replyMsg: MessageItem = {
          id: `local-reply-${Date.now()}`,
          conversationId: selectedId,
          senderId: otherPart?.id ?? "creator",
          text: reply,
          createdAt: new Date().toISOString(),
          creditCost: 0,
          sender: { id: otherPart?.id ?? "creator", username: otherPart?.username ?? "creator" },
        };
        if (selectedIdRef.current === selectedId) {
          saveLocalMsg(selectedId, replyMsg);
          setMessages(prev => [...prev, replyMsg]);
          const rec2 = loadLocalConvs().find(c => localConvId(c.userId) === selectedId);
          if (rec2) saveLocalConv({ ...rec2, lastMsg: reply, lastMsgAt: replyMsg.createdAt });
        }
      }, delay);
      return;
    }

    // Real API conversation
    try {
      const sent = await msgApi.send(selectedId, text);
      setMessages(prev => prev.map(m => m.id === optimistic.id ? sent : m));
      loadConversations();
    } catch {
      // Keep the message in the chat but mark it as failed (local only)
      setMessages(prev => prev.map(m => m.id === optimistic.id
        ? { ...optimistic, id: `local-${Date.now()}` } : m));
      showToast({ title: "Message queued locally", description: "The API is offline — your message was saved locally.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Guest view
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen py-8">
        <div className="container">
          <h1 className="text-3xl font-bold text-white mb-6">Messages</h1>
          <div className="vl-card p-12 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4" style={{ color: "rgba(20,184,166,0.4)" }} />
            <h2 className="text-lg font-bold text-white mb-2">Sign in to access messages</h2>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
              Create an account or sign in to start chatting with creators.
            </p>
            <Link href="/register" className="inline-block px-6 py-3 rounded-xl text-white font-semibold text-sm"
              style={{ background: "#14b8a6" }}>
              Get Started
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Messages</h1>
          <button onClick={loadConversations} disabled={loadingConvs}
            className="p-2 rounded-lg hover:bg-white/5 transition-all disabled:opacity-50"
            style={{ color: "rgba(255,255,255,0.4)" }}>
            <RefreshCw className={`w-4 h-4 ${loadingConvs ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "calc(100vh - 200px)", minHeight: "520px" }}>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-1 vl-card overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div>
                <p className="text-xs font-semibold text-white">Conversations</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {loadingConvs ? "Loading…" : `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <button
                onClick={() => setShowNewChat(v => !v)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
                style={{
                  background: showNewChat ? "rgba(20,184,166,0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${showNewChat ? "rgba(20,184,166,0.3)" : "rgba(255,255,255,0.08)"}`,
                  color: showNewChat ? "#14b8a6" : "rgba(255,255,255,0.5)",
                }}
                title="New conversation">
                {showNewChat ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* New chat panel */}
            {showNewChat && (
              <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(20,184,166,0.04)" }}>
                <p className="text-xs font-semibold px-4 pt-3 pb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  SUGGESTED CREATORS
                </p>
                {SUGGESTIONS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => startLocalChat(p)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-white/5">
                    <div className="relative flex-shrink-0">
                      <img src={p.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`}
                        alt={p.displayName} className="w-8 h-8 rounded-full object-cover" />
                      {p.isLive && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 bg-red-500"
                          style={{ borderColor: "#09091a" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{p.displayName}</p>
                      <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>@{p.username}</p>
                    </div>
                    <span className="text-xs font-semibold flex-shrink-0" style={{ color: "#14b8a6" }}>Chat</span>
                  </button>
                ))}
                <Link href="/profiles">
                  <div className="flex items-center justify-center gap-1 py-2.5 text-xs font-medium cursor-pointer hover:text-white transition-colors"
                    style={{ color: "rgba(255,255,255,0.35)" }}>
                    Browse all creators →
                  </div>
                </Link>
              </div>
            )}

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 && !loadingConvs && !showNewChat && (
                <div className="p-4">
                  <p className="text-xs font-semibold mb-3 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
                    No conversations yet — start one below
                  </p>
                  {SUGGESTIONS.slice(0, 4).map(p => (
                    <button
                      key={p.id}
                      onClick={() => startLocalChat(p)}
                      className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-left transition-all hover:bg-white/5 mb-1">
                      <div className="relative flex-shrink-0">
                        <img src={p.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`}
                          alt={p.displayName} className="w-10 h-10 rounded-full object-cover" />
                        {p.isLive && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 bg-red-500"
                            style={{ borderColor: "#09091a" }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{p.displayName}</p>
                        <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                          @{p.username}{p.isLive ? " · 🔴 Live" : ""}
                        </p>
                      </div>
                      <span className="text-xs font-semibold flex-shrink-0 px-2.5 py-1 rounded-lg"
                        style={{ background: "rgba(20,184,166,0.1)", color: "#14b8a6", border: "1px solid rgba(20,184,166,0.2)" }}>
                        Message
                      </span>
                    </button>
                  ))}
                  <Link href="/profiles">
                    <div className="text-xs text-center py-2 cursor-pointer hover:text-white transition-colors mt-1"
                      style={{ color: "rgba(255,255,255,0.3)" }}>
                      Browse all creators →
                    </div>
                  </Link>
                </div>
              )}
              {conversations.map(conv => {
                const other = conv.otherParticipant;
                const isLive = other?.creatorProfile?.isLive ?? false;
                const last = conv.lastMessage;
                const av = avatarUrl(other);
                const dn = displayName(other);
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/5"
                    style={selectedId === conv.id
                      ? { background: "rgba(20,184,166,0.08)", borderLeft: "2px solid #14b8a6" }
                      : { borderLeft: "2px solid transparent" }
                    }>
                    <div className="relative flex-shrink-0">
                      {av
                        ? <img src={av} alt={dn} className="w-10 h-10 rounded-full object-cover" />
                        : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{ background: "linear-gradient(135deg,#14b8a6,#0d9488)", color: "white" }}>
                            {avatarInitial(other)}
                          </div>
                        )}
                      {isLive && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 bg-red-500"
                          style={{ borderColor: "#09091a" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-white truncate">{dn}</span>
                        {isLive && (
                          <span className="flex items-center gap-1 text-xs font-bold flex-shrink-0" style={{ color: "#ef4444" }}>
                            <Radio className="w-2.5 h-2.5" /> LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {last ? last.text : `Say hi to @${other?.username ?? "creator"}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Chat panel ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2 vl-card overflow-hidden flex flex-col">
            {selectedConv ? (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  {(() => {
                    const other = selectedConv.otherParticipant;
                    const av = avatarUrl(other);
                    const dn = displayName(other);
                    const isLive = other?.creatorProfile?.isLive ?? false;
                    return (
                      <>
                        <div className="relative">
                          {av
                            ? <img src={av} alt={dn} className="w-9 h-9 rounded-full object-cover" />
                            : (
                              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                                style={{ background: "linear-gradient(135deg,#14b8a6,#0d9488)", color: "white" }}>
                                {avatarInitial(other)}
                              </div>
                            )}
                          {isLive && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 bg-red-500"
                              style={{ borderColor: "#0f1622" }} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{dn}</p>
                          <p className="text-xs" style={{ color: isLive ? "#ef4444" : "rgba(255,255,255,0.4)" }}>
                            {isLive ? "● Live now" : `@${other?.username ?? ""}`}
                          </p>
                        </div>
                        {other?.id && (
                          <ReportButton
                            reportedUserId={other.id}
                            contentType="message"
                            variant="icon"
                            className="p-2 rounded-lg transition-all hover:bg-white/5"
                          />
                        )}
                        {isLocalId(selectedConv.id) && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
                            Demo mode
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMsgs ? (
                    <div className="flex items-center justify-center h-full gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Loading messages…</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                      <Send className="w-8 h-8 opacity-20" />
                      <p className="text-sm">Say something to {displayName(selectedConv.otherParticipant)}!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === user?.id || msg.senderId === "me" || msg.sender?.id === user?.id;
                      const senderAv = isMe ? null : avatarUrl(selectedConv.otherParticipant);
                      const myBadgeEmoji = localStorage.getItem("vl_equipped_badge_emoji_v1") || null;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          {!isMe && (
                            <div className="relative mr-2 flex-shrink-0 self-end mb-1">
                              {senderAv
                                ? <img src={senderAv} alt="" className="w-6 h-6 rounded-full object-cover" />
                                : <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{ background: "linear-gradient(135deg,#14b8a6,#0d9488)", color: "white" }}>
                                    {avatarInitial(selectedConv.otherParticipant)}
                                  </div>
                              }
                            </div>
                          )}
                          <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[72%]`}>
                            {isMe && myBadgeEmoji && (
                              <span className="text-xs mb-0.5 px-1" title="Your profile badge">{myBadgeEmoji}</span>
                            )}
                            <div className="px-3.5 py-2.5 rounded-2xl text-sm w-full"
                              style={isMe
                                ? { background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white", borderBottomRightRadius: "4px" }
                                : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.88)", borderBottomLeftRadius: "4px" }
                              }>
                              <p style={{ lineHeight: 1.45 }}>{msg.text}</p>
                              <p className="text-xs mt-1 opacity-50 text-right">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="px-4 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)", borderBottomLeftRadius: "4px" }}>
                        <div className="flex gap-1 items-center h-4">
                          {[0, 1, 2].map(i => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full"
                              style={{ background: "rgba(255,255,255,0.5)", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Quick replies */}
                <div className="px-4 pt-2 flex gap-2 overflow-x-auto pb-1">
                  {QUICK_REPLIES.map(qr => (
                    <button key={qr} onClick={() => sendMessage(qr)} disabled={sending}
                      className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all hover:bg-white/10 disabled:opacity-50"
                      style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }}>
                      {qr}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="flex gap-2 items-center">
                    <button className="p-2 rounded-xl transition-all hover:bg-white/5 flex-shrink-0"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                      onClick={() => showToast({ title: "Emoji picker coming soon", description: "Use Win + . (Windows) or Cmd+Ctrl+Space (Mac) to open your system emoji picker 😊" })}>
                      <Smile className="w-5 h-5" />
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={sending}
                      placeholder={`Message ${displayName(selectedConv.otherParticipant)}…`}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={!draft.trim() || sending}
                      className="p-2.5 rounded-xl transition-all flex-shrink-0 disabled:opacity-30"
                      style={{ background: draft.trim() && !sending ? "linear-gradient(135deg, #14b8a6, #0d9488)" : "rgba(20,184,166,0.2)" }}>
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <p className="text-xs mt-2 text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
                    ⚡ {MSG_CREDIT_COST} credits per message · Press Enter to send
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-8"
                style={{ color: "rgba(255,255,255,0.3)" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.1)" }}>
                  <Send className="w-7 h-7" style={{ color: "rgba(20,184,166,0.4)" }} />
                </div>
                <p className="text-sm font-medium text-white">No conversation selected</p>
                <p className="text-xs text-center">Choose from the list or click <strong className="text-white">+</strong> to start a new chat</p>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }}>
                  <Plus className="w-4 h-4" /> New Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
