/**
 * LINKME â€” Messages Page
 * Velvet Dark Design System
 */
import { useState } from "react";
import { MOCK_MESSAGES, MOCK_PROFILES } from "@/lib/mock-data";
import { MessageCircle, Send, Lock } from "lucide-react";

export default function Messages() {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(MOCK_MESSAGES[0]?.id || null);
  const [message, setMessage] = useState("");

  const activeMsg = MOCK_MESSAGES.find(m => m.id === activeThreadId);
  const activeProfile = activeMsg ? MOCK_PROFILES.find(p => p.id === activeMsg.recipientId) : null;

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-4xl mx-auto">
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 700, color: "white", marginBottom: "1.5rem" }}>Messages</h1>
        <div className="vl-card overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: "400px", display: "flex" }}>
          {/* Thread list */}
          <div className="w-64 flex-shrink-0 border-r" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="p-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>Conversations</p>
            </div>
            {MOCK_MESSAGES.map(thread => {
              const profile = MOCK_PROFILES.find(p => p.id === thread.recipientId);
              const isUnread = !thread.isRead;
              return (
                <button key={thread.id} onClick={() => setActiveThreadId(thread.id)}
                  className="w-full flex items-center gap-2.5 p-3 text-left transition-all duration-150"
                  style={{ background: activeThreadId === thread.id ? "rgba(20,184,166,0.08)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="relative flex-shrink-0">
                    <img src={profile?.avatarUrl} alt={profile?.displayName} className="w-9 h-9 rounded-full" />
                    {isUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: "#14b8a6", color: "white", fontSize: "0.6rem" }}>â€¢</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{profile?.displayName}</p>
                    <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{thread.content}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            {activeProfile ? (
              <>
                <div className="flex items-center gap-2.5 p-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <img src={activeProfile.avatarUrl} alt={activeProfile.displayName} className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="text-sm font-bold text-white">{activeProfile.displayName}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>@{activeProfile.username}</p>
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="flex justify-end mb-3">
                    <div className="max-w-xs px-3 py-2 rounded-xl text-sm" style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.2)", color: "white" }}>
                      Hey! I loved your last stream ðŸ”¥
                    </div>
                  </div>
                  <div className="flex justify-start mb-3">
                    <div className="max-w-xs px-3 py-2 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)" }}>
                      {activeMsg?.content}
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Type a message..." value={message} onChange={e => setMessage(e.target.value)}
                      className="vl-input flex-1 py-2 text-sm" />
                    <button className="vl-btn-primary px-4 py-2 flex items-center gap-1.5 text-sm">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                    <Lock className="w-3 h-3" style={{ color: "#14b8a6" }} /> Messages are end-to-end encrypted
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
                  <p style={{ color: "rgba(255,255,255,0.3)" }}>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
