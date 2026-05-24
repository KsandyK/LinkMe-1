import { useState, useRef, useEffect } from "react";
import { MOCK_PROFILES } from "@/lib/mock-data";
import { Send, Radio, Smile } from "lucide-react";

type Message = { from: "me" | "them"; text: string; time: string };

const INITIAL_MESSAGES: Record<string, Message[]> = {
  "profile-1": [
    { from: "them", text: "Hey! Thanks for following my streams 💕", time: "2h" },
    { from: "me", text: "You were amazing last night!", time: "2h" },
    { from: "them", text: "Aw thank you 🥰 I'll be live again tonight at 9PM EST", time: "1h" },
  ],
  "profile-2": [
    { from: "them", text: "What's up! Ready for the gaming stream?", time: "4h" },
    { from: "me", text: "Can't wait, been looking forward to it!", time: "3h" },
  ],
  "profile-3": [
    { from: "them", text: "Thank you for the tip on my last stream 🙏✨", time: "1d" },
  ],
};

const QUICK_REPLIES = ["Hey! 👋", "You're amazing!", "When are you live next?", "❤️"];

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Messages() {
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [conversations, setConversations] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeProfile = selected ? MOCK_PROFILES.find(p => p.id === selected) : null;
  const conversation = selected ? (conversations[selected] ?? []) : [];

  // Scroll to bottom whenever messages change or conversation switches
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, selected]);

  const sendMessage = (text: string = draft.trim()) => {
    if (!text || !selected) return;

    const userMsg: Message = { from: "me", text, time: now() };
    setConversations(prev => ({
      ...prev,
      [selected]: [...(prev[selected] ?? []), userMsg],
    }));
    setDraft("");

    // Simulate a reply after a short delay
    setTyping(true);
    const replies = [
      "That's so sweet, thank you! 💕",
      "Haha love that energy! 😄",
      "Aww you're the best! 🥰",
      "Can't wait to chat more — join me live later!",
      "❤️❤️❤️",
    ];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    setTimeout(() => {
      setTyping(false);
      setConversations(prev => ({
        ...prev,
        [selected]: [...(prev[selected] ?? []), { from: "them", text: reply, time: now() }],
      }));
    }, 1200 + Math.random() * 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectConversation = (id: string) => {
    setSelected(id);
    setDraft("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <h1 className="text-3xl font-bold text-white mb-6">Messages</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "calc(100vh - 200px)", minHeight: "520px" }}>

          {/* Sidebar — contact list */}
          <div className="lg:col-span-1 vl-card overflow-hidden flex flex-col">
            <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-xs font-semibold text-white">Conversations</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                {MOCK_PROFILES.slice(0, 8).length} creators
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {MOCK_PROFILES.slice(0, 8).map(profile => {
                const msgs = conversations[profile.id];
                const lastMsg = msgs?.[msgs.length - 1];
                return (
                  <button
                    key={profile.id}
                    onClick={() => selectConversation(profile.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/5"
                    style={selected === profile.id
                      ? { background: "rgba(20,184,166,0.08)", borderLeft: "2px solid #14b8a6" }
                      : { borderLeft: "2px solid transparent" }
                    }>
                    <div className="relative flex-shrink-0">
                      <img src={profile.avatarUrl} alt={profile.displayName}
                        className="w-10 h-10 rounded-full object-cover" />
                      {profile.isLive && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 bg-red-500"
                          style={{ borderColor: "#09091a" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-white truncate">{profile.displayName}</span>
                        {profile.isLive && (
                          <span className="flex items-center gap-1 text-xs font-bold flex-shrink-0" style={{ color: "#ef4444" }}>
                            <Radio className="w-2.5 h-2.5" /> LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {lastMsg
                          ? `${lastMsg.from === "me" ? "You: " : ""}${lastMsg.text}`
                          : profile.tagline}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat panel */}
          <div className="lg:col-span-2 vl-card overflow-hidden flex flex-col">
            {activeProfile ? (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="relative">
                    <img src={activeProfile.avatarUrl} alt={activeProfile.displayName}
                      className="w-9 h-9 rounded-full object-cover" />
                    {activeProfile.isLive && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 bg-red-500"
                        style={{ borderColor: "#0f1622" }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{activeProfile.displayName}</p>
                    <p className="text-xs" style={{ color: activeProfile.isLive ? "#ef4444" : "rgba(255,255,255,0.4)" }}>
                      {activeProfile.isLive ? "● Live now" : `@${activeProfile.username}`}
                    </p>
                  </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {conversation.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2"
                      style={{ color: "rgba(255,255,255,0.3)" }}>
                      <Send className="w-8 h-8 opacity-20" />
                      <p className="text-sm">Say something to {activeProfile.displayName}!</p>
                    </div>
                  ) : (
                    conversation.map((msg, i) => (
                      <div key={i} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                        {msg.from === "them" && (
                          <img src={activeProfile.avatarUrl} alt=""
                            className="w-6 h-6 rounded-full object-cover mr-2 flex-shrink-0 self-end mb-1" />
                        )}
                        <div className="max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm"
                          style={msg.from === "me"
                            ? { background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white", borderBottomRightRadius: "4px" }
                            : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.88)", borderBottomLeftRadius: "4px" }
                          }>
                          <p style={{ lineHeight: 1.45 }}>{msg.text}</p>
                          <p className="text-xs mt-1 opacity-50 text-right">{msg.time}</p>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Typing indicator */}
                  {typing && (
                    <div className="flex justify-start">
                      <img src={activeProfile.avatarUrl} alt=""
                        className="w-6 h-6 rounded-full object-cover mr-2 flex-shrink-0 self-end" />
                      <div className="px-4 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)", borderBottomLeftRadius: "4px" }}>
                        <div className="flex gap-1 items-center h-4">
                          {[0, 1, 2].map(i => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full"
                              style={{
                                background: "rgba(255,255,255,0.5)",
                                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                              }} />
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
                      className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all hover:bg-white/10"
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
                      placeholder={`Message ${activeProfile.displayName}…`}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={!draft.trim()}
                      className="p-2.5 rounded-xl transition-all flex-shrink-0 disabled:opacity-30"
                      style={{
                        background: draft.trim() ? "linear-gradient(135deg, #14b8a6, #0d9488)" : "rgba(20,184,166,0.2)",
                        transform: draft.trim() ? "scale(1)" : "scale(0.95)",
                        transition: "all 0.15s ease",
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
                <p className="text-xs">Choose a creator from the list to start chatting</p>
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
