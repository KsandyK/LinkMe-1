import { useState } from "react";
import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { User, Shield, Zap, Bell, Lock, ChevronRight, CheckCircle } from "lucide-react";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;
type Tab = typeof TABS[number]["id"];

export default function Account() {
  const { credits, ageVerificationStatus } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [displayName, setDisplayName] = useState("Member");
  const [username, setUsername] = useState("member_user");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);
  const [notifs, setNotifs] = useState({ messages: true, liveAlerts: true, promotions: false, security: true });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
        <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.4)" }}>Manage your profile, security, and preferences</p>

        {/* Credits + Verification bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="vl-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(20,184,166,0.12)" }}>
                <Zap className="w-5 h-5" style={{ color: "#14b8a6" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Credits Balance</p>
                <p className="text-xl font-black" style={{ color: "#14b8a6" }}>{credits.toLocaleString()}</p>
              </div>
            </div>
            <Link href="/credits">
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }}>
                Buy More
              </button>
            </Link>
          </div>

          <div className="vl-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: ageVerificationStatus === "verified" ? "rgba(20,184,166,0.12)" : "rgba(234,179,8,0.1)" }}>
                {ageVerificationStatus === "verified"
                  ? <CheckCircle className="w-5 h-5" style={{ color: "#14b8a6" }} />
                  : <Shield className="w-5 h-5" style={{ color: "#fbbf24" }} />
                }
              </div>
              <div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Age Verification</p>
                <p className="text-sm font-semibold" style={{ color: ageVerificationStatus === "verified" ? "#14b8a6" : "#fbbf24" }}>
                  {ageVerificationStatus === "verified" ? "Verified ✓" : "Not Verified"}
                </p>
              </div>
            </div>
            {ageVerificationStatus !== "verified" && (
              <Link href="/verify-age">
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)", color: "#fbbf24" }}>
                  Verify Now
                </button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar tabs */}
          <div className="vl-card p-2 h-fit">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
                style={activeTab === tab.id
                  ? { background: "rgba(20,184,166,0.1)", color: "#14b8a6" }
                  : { color: "rgba(255,255,255,0.5)" }
                }>
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="lg:col-span-3 vl-card p-6">
            {activeTab === "profile" && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-white">Profile Information</h2>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Display Name</label>
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                    className="vl-input" placeholder="Your display name" />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>@</span>
                    <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                      className="vl-input pl-7" placeholder="your_username" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Email</label>
                  <input value="user@example.com" disabled
                    className="vl-input opacity-50 cursor-not-allowed" />
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>Contact support to change your email</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)}
                    rows={3} placeholder="Tell creators a little about yourself..."
                    className="vl-input resize-none" />
                </div>

                <button onClick={handleSave} className="vl-btn-primary px-6 py-2.5 text-sm">
                  {saved ? "✓ Saved!" : "Save Changes"}
                </button>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-white">Security Settings</h2>

                <div className="vl-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Password</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Last changed: Never</p>
                    </div>
                    <button className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-white/5"
                      style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                      Change Password
                    </button>
                  </div>
                </div>

                <div className="vl-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Two-Factor Authentication</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Add an extra layer of security</p>
                    </div>
                    <button className="vl-btn-primary px-3 py-1.5 text-xs">Enable 2FA</button>
                  </div>
                </div>

                <div className="vl-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Active Sessions</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>1 active session — this device</p>
                    </div>
                    <button className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                      style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", background: "rgba(239,68,68,0.05)" }}>
                      Sign Out All
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-white">Notification Preferences</h2>
                {[
                  { key: "messages" as const, label: "New Messages", desc: "When a creator messages you" },
                  { key: "liveAlerts" as const, label: "Live Alerts", desc: "When creators you follow go live" },
                  { key: "promotions" as const, label: "Promotions & Offers", desc: "Credit deals and special offers" },
                  { key: "security" as const, label: "Security Alerts", desc: "Login and account activity" },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <div>
                      <p className="text-sm font-medium text-white">{n.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{n.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifs(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                      className="w-11 h-6 rounded-full transition-all duration-200 relative flex-shrink-0"
                      style={{ background: notifs[n.key] ? "#14b8a6" : "rgba(255,255,255,0.1)" }}>
                      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                        style={{ left: notifs[n.key] ? "calc(100% - 1.375rem)" : "0.125rem" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Danger zone */}
        <div className="mt-6 vl-card p-5" style={{ borderColor: "rgba(239,68,68,0.15)" }}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: "#f87171" }}>Danger Zone</h3>
          <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>These actions are permanent and cannot be undone.</p>
          <div className="flex flex-wrap gap-3">
            <button className="text-xs px-3 py-1.5 rounded-lg" style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              Deactivate Account
            </button>
            <button className="text-xs px-3 py-1.5 rounded-lg" style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
