import { useState } from "react";
import { MOCK_PROFILES } from "@/lib/mock-data";
import { Send, Radio } from "lucide-react";

const MOCK_MESSAGES: Record<string, { from: "me" | "them"; text: string; time: string }[]> = {
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

export default function Messages() {
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const activeProfile = selected ? MOCK_PROFILES.find(p => p.id === selected) : null;
  const conversation = selected ? (MOCK_MESSAGES[selected] ?? []) : [];

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <h1 className="text-3xl font-bold text-white mb-6">Messages</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "calc(100vh - 160px)", minHeight: "500px" }}>
          {/* Sidebar — contact list */}
          <div className="lg:col-span-1 vl-card overflow-hidden flex flex-col">
            <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-xs font-semibold text-white">Conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {MOCK_PROFILES.slice(0, 8).map(profile => (
                <button
                  key={profile.id}
                  onClick={() => setSelected(profile.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/5"
                  style={selected === profile.id
                    ? { background: "rgba(20,184,166,0.08)", borderLeft: "2px solid #14b8a6" }
                    : { borderLeft: "2px solid transparent" }
                  }
                >
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
                        <span className="flex items-center gap-1 text-xs font-bold" style={{ color: "#ef4444" }}>
                          <Radio className="w-2.5 h-2.5" />LIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {profile.tagline}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat panel */}
          <div className="lg:col-span-2 vl-card overflow-hidden flex flex-col">
            {activeProfile ? (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <img src={activeProfile.avatarUrl} alt={activeProfile.displayName}
                    className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-white">{activeProfile.displayName}</p>
                    <p className="text-xs" style={{ color: activeProfile.isLive ? "#ef4444" : "rgba(255,255,255,0.4)" }}>
                      {activeProfile.isLive ? "● Live now" : `@${activeProfile.username}`}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {conversation.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full" style={{ color: "rgba(255,255,255,0.3)" }}>
                      <p className="text-sm">Send a message to start chatting</p>
                    </div>
                  ) : (
                    conversation.map((msg, i) => (
                      <div key={i} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[75%] px-3 py-2 rounded-xl text-sm"
                          style={msg.from === "me"
                            ? { background: "#14b8a6", color: "white" }
                            : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)" }
                          }>
                          <p>{msg.text}</p>
                          <p className="text-xs mt-1 opacity-60">{msg.time} ago</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && setDraft("")}
                      placeholder={`Message ${activeProfile.displayName}...`}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                    <button
                      onClick={() => setDraft("")}
                      className="p-2.5 rounded-xl transition-all hover:opacity-90"
                      style={{ background: "#14b8a6" }}
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <p className="text-xs mt-2 text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
                    Credits are charged per message with premium creators
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3"
                style={{ color: "rgba(255,255,255,0.3)" }}>
                <Send className="w-10 h-10 opacity-30" />
                <p className="text-sm font-medium">Select a conversation</p>
                <p className="text-xs">Choose a creator from the list to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
