import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Radio, Smile, MessageCircle, RefreshCw } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { messages as msgApi, ConversationItem, MessageItem } from "@/lib/api";
import { createMsgSocket, LinkMeSocket } from "@/lib/socket";

const QUICK_REPLIES = ["Hey! 👋", "You're amazing!", "When are you live next?", "❤️"];

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

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

export default function Messages() {
  const { isLoggedIn, token, showToast, user } = useApp();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<LinkMeSocket | null>(null);
  const selectedIdRef = useRef<string | null>(null);

  const selectedConv = conversations.find(c => c.id === selectedId) ?? null;

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoadingConvs(true);
    try {
      const data = await msgApi.conversations();
      // API returns array directly
      setConversations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("Failed to load conversations:", e);
    } finally {
      setLoadingConvs(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ── WebSocket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn || !token) return;

    const ws = createMsgSocket(token);
    wsRef.current = ws;

    // Receive new messages in real-time
    const unsub = ws.on("new_message", (data) => {
      const msg = data.message as MessageItem;
      if (!msg) return;
      // Only append if viewing this conversation and it's not already there
      if (msg.conversationId === selectedIdRef.current) {
        setMessages(prev => {
          // Deduplicate (remove optimistic if id matches or same text+sender+~time)
          const exists = prev.some(m => m.id === msg.id);
          if (exists) return prev;
          return [...prev.filter(m => !m.id.startsWith("opt-")), msg];
        });
      }
      // Refresh conversation list to update last message
      loadConversations();
    });

    // Typing indicator
    const unsubTyping = ws.on("typing_indicator", (data) => {
      if (data.conversationId === selectedIdRef.current && data.userId !== user?.id) {
        setIsTyping(Boolean(data.isTyping));
      }
    });

    return () => {
      unsub();
      unsubTyping();
      ws.close();
      wsRef.current = null;
    };
  }, [isLoggedIn, token, loadConversations, user?.id]);

  // Load messages when conversation selected
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const data = await msgApi.history(convId, { limit: 50 });
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("Failed to load messages:", e);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  const selectConversation = (id: string) => {
    // Leave old conversation WS room
    if (selectedIdRef.current && wsRef.current) {
      wsRef.current.send({ type: "leave_conversation" });
    }
    setSelectedId(id);
    selectedIdRef.current = id;
    setDraft("");
    setIsTyping(false);
    loadMessages(id);
    // Join new conversation WS room
    if (wsRef.current) {
      wsRef.current.send({ type: "join_conversation", conversationId: id });
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string = draft.trim()) => {
    if (!text || !selectedId || sending) return;
    setSending(true);
    setDraft("");

    // Optimistic insert
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

    try {
      const sent = await msgApi.send(selectedId, text);
      // Replace optimistic with real message
      setMessages(prev => prev.map(m => m.id === optimistic.id ? sent : m));
      // Refresh conversation list to update last message
      loadConversations();
    } catch (err: unknown) {
      // Remove optimistic on error
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      const msg = err instanceof Error ? err.message : "Failed to send";
      showToast({ title: "Message failed", description: msg, variant: "destructive" });
      setDraft(text); // restore draft
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Guest / not logged in
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
            <a href="/register"
              className="inline-block px-6 py-3 rounded-xl text-white font-semibold text-sm"
              style={{ background: "#14b8a6" }}>
              Get Started
            </a>
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

          {/* Sidebar — conversation list */}
          <div className="lg:col-span-1 vl-card overflow-hidden flex flex-col">
            <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-xs font-semibold text-white">Conversations</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                {loadingConvs ? "Loading…" : `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 && !loadingConvs && (
                <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center"
                  style={{ color: "rgba(255,255,255,0.3)" }}>
                  <MessageCircle className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs">Visit a creator profile to start a chat</p>
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
                        {last ? last.text : `Start a conversation with @${other?.username ?? "creator"}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat panel */}
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
                      </>
                    );
                  })()}
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMsgs ? (
                    <div className="flex items-center justify-center h-full gap-2"
                      style={{ color: "rgba(255,255,255,0.3)" }}>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Loading messages…</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2"
                      style={{ color: "rgba(255,255,255,0.3)" }}>
                      <Send className="w-8 h-8 opacity-20" />
                      <p className="text-sm">Say something to {displayName(selectedConv.otherParticipant)}!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === user?.id || msg.senderId === "me" || msg.sender?.id === user?.id;
                      const senderAv = isMe ? null : avatarUrl(selectedConv.otherParticipant);
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          {!isMe && (
                            senderAv
                              ? <img src={senderAv} alt="" className="w-6 h-6 rounded-full object-cover mr-2 flex-shrink-0 self-end mb-1" />
                              : <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0 self-end mb-1"
                                  style={{ background: "linear-gradient(135deg,#14b8a6,#0d9488)", color: "white" }}>
                                  {avatarInitial(selectedConv.otherParticipant)}
                                </div>
                          )}
                          <div className="max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm"
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
                      );
                    })
                  )}
                  {/* Typing indicator */}
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
                    <button key={qr} onClick={() => sendMessage(qr)}
                      disabled={sending}
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
                      style={{ color: "rgba(255,255,255,0.35)" }}>
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
                      style={{
                        background: draft.trim() && !sending
                          ? "linear-gradient(135deg, #14b8a6, #0d9488)"
                          : "rgba(20,184,166,0.2)",
                      }}>
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <p className="text-xs mt-2 text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
                    Credits are charged per message with premium creators · Press Enter to send
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3"
                style={{ color: "rgba(255,255,255,0.3)" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.1)" }}>
                  <Send className="w-7 h-7" style={{ color: "rgba(20,184,166,0.4)" }} />
                </div>
                <p className="text-sm font-medium text-white">No conversation selected</p>
                <p className="text-xs">Choose a conversation from the list or visit a creator profile to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bounce animation for typing dots */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
