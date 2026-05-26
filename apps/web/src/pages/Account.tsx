import { useState } from "react";
import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { User, Shield, Zap, Bell, Lock, ChevronRight, CheckCircle, X, AlertTriangle, Smartphone, Award } from "lucide-react";

// ── Badge definitions ─────────────────────────────────────────────────────────
type BadgeDef = {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  type: "membership" | "credits" | "gacha";
  /** membership IDs that unlock this */
  levels?: string[];
  /** credit balance threshold to unlock */
  threshold?: number;
  /** gacha collection size to unlock */
  gachaMin?: number;
};

const ACCOUNT_BADGES: BadgeDef[] = [
  // Membership badges (unlock at given level or above)
  { id: "fan",         emoji: "⭐", name: "Fan",          desc: "Fan membership",         type: "membership", levels: ["fan","supporter","superfan","allaccess","creatorpass"] },
  { id: "supporter",   emoji: "🌟", name: "Supporter",    desc: "Supporter membership",   type: "membership", levels: ["supporter","superfan","allaccess","creatorpass"] },
  { id: "superfan",    emoji: "💫", name: "Super Fan",    desc: "Super Fan membership",   type: "membership", levels: ["superfan","allaccess","creatorpass"] },
  { id: "allaccess",   emoji: "👑", name: "VIP Member",   desc: "All-Access membership",  type: "membership", levels: ["allaccess","creatorpass"] },
  { id: "creatorpass", emoji: "💎", name: "Creator Elite","desc": "Creator Pass holder",  type: "membership", levels: ["creatorpass"] },
  // Credit balance badges
  { id: "credits_100",  emoji: "💰", name: "Tipped",       desc: "100+ credits",   type: "credits", threshold: 100 },
  { id: "credits_500",  emoji: "💸", name: "Big Spender",  desc: "500+ credits",   type: "credits", threshold: 500 },
  { id: "credits_2000", emoji: "🐋", name: "Whale",        desc: "2,000+ credits", type: "credits", threshold: 2000 },
  // Gacha badges
  { id: "gacha_1",  emoji: "🎴", name: "Puller",    desc: "First gacha pull",      type: "gacha", gachaMin: 1 },
  { id: "gacha_5",  emoji: "🃏", name: "Collector", desc: "5+ gacha items",        type: "gacha", gachaMin: 5 },
  { id: "gacha_10", emoji: "🎰", name: "Devoted",   desc: "10+ gacha items",       type: "gacha", gachaMin: 10 },
] as const;

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;
type Tab = typeof TABS[number]["id"];

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-md rounded-2xl p-6"
        style={{ background: "#0f1622", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 60px rgba(0,0,0,0.7)" }}>
        <button onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg transition-all hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.4)" }}>
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export default function Account() {
  const { credits, ageVerificationStatus, showToast, user, logout, activeMembership, gachaCollection } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [displayName, setDisplayName] = useState(user?.username ?? "Member");
  const [username, setUsername] = useState(user?.username ?? "member_user");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);
  const [notifs, setNotifs] = useState({ messages: true, liveAlerts: true, promotions: false, security: true });

  // Security sub-states
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [pwChanged, setPwChanged] = useState(false);

  // 2FA setup modal
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<"phone" | "verify" | "done">("phone");
  const [twoFAPhone, setTwoFAPhone] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFASending, setTwoFASending] = useState(false);
  const [twoFAVerifying, setTwoFAVerifying] = useState(false);
  const [twoFACodeError, setTwoFACodeError] = useState(false);
  // Simulated OTP (always "123456" in demo)
  const DEMO_OTP = "123456";

  // Badge selection
  const [equippedBadge, setEquippedBadge] = useState<string | null>(() => localStorage.getItem("vl_equipped_badge_v1"));

  const isBadgeUnlocked = (b: BadgeDef): boolean => {
    if (b.type === "membership") return (b.levels ?? []).includes(activeMembership);
    if (b.type === "credits")    return credits >= (b.threshold ?? 0);
    if (b.type === "gacha")      return gachaCollection.length >= (b.gachaMin ?? 0);
    return false;
  };

  const handleEquipBadge = (id: string) => {
    const next = equippedBadge === id ? null : id;
    setEquippedBadge(next);
    if (next) localStorage.setItem("vl_equipped_badge_v1", next);
    else localStorage.removeItem("vl_equipped_badge_v1");
  };

  // Danger zone modals
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deactivated, setDeactivated] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleSave = () => {
    setSaved(true);
    showToast({ title: "Profile saved", description: "Your changes have been updated." });
    setTimeout(() => setSaved(false), 2000);
  };

  const open2FAModal = () => {
    setTwoFAStep("phone");
    setTwoFAPhone("");
    setTwoFACode("");
    setTwoFACodeError(false);
    setShow2FAModal(true);
  };

  const handleSendOTP = () => {
    if (twoFAPhone.replace(/\D/g, "").length < 7) return;
    setTwoFASending(true);
    setTimeout(() => {
      setTwoFASending(false);
      setTwoFAStep("verify");
      showToast({ title: "Code sent!", description: `Verification code sent to ${twoFAPhone}` });
    }, 1000);
  };

  const handleVerifyOTP = () => {
    setTwoFAVerifying(true);
    setTimeout(() => {
      setTwoFAVerifying(false);
      if (twoFACode === DEMO_OTP) {
        setTwoFAStep("done");
        setTimeout(() => {
          setTwoFAEnabled(true);
          setShow2FAModal(false);
          showToast({ title: "2FA Enabled ✓", description: "Your account is now protected with two-factor authentication." });
        }, 1200);
      } else {
        setTwoFACodeError(true);
      }
    }, 900);
  };

  const handleDisable2FA = () => {
    setTwoFAEnabled(false);
    showToast({ title: "2FA Disabled", description: "Two-factor authentication has been removed from your account." });
  };

  const handleChangePassword = () => {
    setPwChanged(true);
    showToast({ title: "Password email sent", description: "Check your inbox for a reset link." });
    setTimeout(() => setPwChanged(false), 3000);
  };

  const handleSignOutAll = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api/auth/logout-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("linkme_token") ?? ""}` },
      });
    } catch {/* ignore */}
    logout();
    showToast({ title: "Signed out everywhere", description: "All sessions have been terminated." });
  };

  const handleDeactivate = () => {
    setDeactivated(true);
    setShowDeactivate(false);
    showToast({ title: "Account deactivated", description: "Your account has been deactivated. You can reactivate by logging in again." });
    setTimeout(() => logout(), 1500);
  };

  const handleDelete = () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleted(true);
    setShowDelete(false);
    showToast({ title: "Account deleted", description: "Your account and all data have been permanently removed.", variant: "destructive" });
  };

  if (deleted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8">
        <div className="vl-card p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertTriangle className="w-8 h-8" style={{ color: "#f87171" }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Account Deleted</h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            Your account and all associated data have been permanently removed from LinkMe.
          </p>
          <Link href="/">
            <button className="vl-btn-primary px-6 py-2.5 text-sm">Return to Home</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
        <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.4)" }}>
          Manage your profile, security, and preferences
          {deactivated && <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(234,179,8,0.1)", color: "#fbbf24", border: "1px solid rgba(234,179,8,0.2)" }}>Deactivated</span>}
        </p>

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
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }}>
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
                  : <Shield className="w-5 h-5" style={{ color: "#fbbf24" }} />}
              </div>
              <div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Age Verification</p>
                <p className="text-sm font-semibold"
                  style={{ color: ageVerificationStatus === "verified" ? "#14b8a6" : "#fbbf24" }}>
                  {ageVerificationStatus === "verified" ? "Verified ✓" : "Not Verified"}
                </p>
              </div>
            </div>
            {ageVerificationStatus !== "verified" && (
              <Link href="/verify-age">
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)", color: "#fbbf24" }}>
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
                  : { color: "rgba(255,255,255,0.5)" }}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="lg:col-span-3 vl-card p-6">

            {/* Profile tab */}
            {activeTab === "profile" && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Profile Information */}
                <div className="lg:col-span-3 space-y-5">
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
                    <input value={(user as any)?.email ?? "—"} disabled className="vl-input opacity-50 cursor-not-allowed" />
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

                {/* Right: Badge selection */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4" style={{ color: "#a78bfa" }} />
                    <h2 className="text-base font-bold text-white">Profile Badges</h2>
                  </div>

                  {/* Equipped badge preview */}
                  <div className="rounded-xl p-3 mb-4 text-center"
                    style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)" }}>
                    {equippedBadge ? (() => {
                      const b = ACCOUNT_BADGES.find(x => x.id === equippedBadge);
                      return b ? (
                        <>
                          <div className="text-3xl mb-1">{b.emoji}</div>
                          <p className="text-xs font-bold text-white">{b.name}</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Equipped</p>
                        </>
                      ) : null;
                    })() : (
                      <p className="text-xs py-2" style={{ color: "rgba(255,255,255,0.3)" }}>No badge equipped</p>
                    )}
                  </div>

                  {/* Badge grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {ACCOUNT_BADGES.map(b => {
                      const unlocked = isBadgeUnlocked(b);
                      const equipped = equippedBadge === b.id;
                      return (
                        <button
                          key={b.id}
                          onClick={() => unlocked && handleEquipBadge(b.id)}
                          title={unlocked ? b.desc : `Locked — ${b.desc}`}
                          className="relative flex flex-col items-center p-2 rounded-xl transition-all text-center"
                          style={{
                            background: equipped
                              ? "rgba(167,139,250,0.15)"
                              : unlocked
                                ? "rgba(255,255,255,0.04)"
                                : "rgba(0,0,0,0.2)",
                            border: equipped
                              ? "1px solid rgba(167,139,250,0.45)"
                              : "1px solid rgba(255,255,255,0.07)",
                            opacity: unlocked ? 1 : 0.4,
                            cursor: unlocked ? "pointer" : "default",
                          }}>
                          <span className="text-xl mb-0.5">{b.emoji}</span>
                          <span className="text-xs font-semibold leading-tight"
                            style={{ color: equipped ? "#a78bfa" : unlocked ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.35)" }}>
                            {b.name}
                          </span>
                          {equipped && (
                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#a78bfa" }} />
                          )}
                          {!unlocked && (
                            <span className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>🔒</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.25)" }}>
                    Earn badges through memberships, credits & gacha pulls. Tap to equip.
                  </p>
                  <Link href="/gacha">
                    <button className="mt-3 w-full py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                      style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa" }}>
                      🎴 Open The Pull (Gacha)
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* Security tab */}
            {activeTab === "security" && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-white">Security Settings</h2>

                <div className="vl-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Password</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {pwChanged ? "Reset email sent ✓" : "Last changed: Never"}
                      </p>
                    </div>
                    <button onClick={handleChangePassword}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-white/5"
                      style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                      {pwChanged ? "Email Sent ✓" : "Change Password"}
                    </button>
                  </div>
                </div>

                <div className="vl-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Two-Factor Authentication</p>
                      <p className="text-xs mt-0.5" style={{ color: twoFAEnabled ? "#14b8a6" : "rgba(255,255,255,0.4)" }}>
                        {twoFAEnabled ? "Enabled — your account is protected" : "Add an extra layer of security via SMS"}
                      </p>
                    </div>
                    {twoFAEnabled ? (
                      <button
                        onClick={handleDisable2FA}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                        style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", background: "rgba(239,68,68,0.05)" }}>
                        Disable 2FA
                      </button>
                    ) : (
                      <button
                        onClick={open2FAModal}
                        className="vl-btn-primary px-3 py-1.5 text-xs">
                        Enable 2FA
                      </button>
                    )}
                  </div>
                </div>

                <div className="vl-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Active Sessions</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>1 active session — this device</p>
                    </div>
                    <button onClick={handleSignOutAll}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                      style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", background: "rgba(239,68,68,0.05)" }}>
                      Sign Out All
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications tab */}
            {activeTab === "notifications" && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-white">Notification Preferences</h2>
                {[
                  { key: "messages" as const, label: "New Messages", desc: "When a creator messages you" },
                  { key: "liveAlerts" as const, label: "Live Alerts", desc: "When creators you follow go live" },
                  { key: "promotions" as const, label: "Promotions & Offers", desc: "Credit deals and special offers" },
                  { key: "security" as const, label: "Security Alerts", desc: "Login and account activity" },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between py-3 border-b"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}>
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
            <button
              onClick={() => setShowDeactivate(true)}
              disabled={deactivated}
              className="text-xs px-3 py-1.5 rounded-lg transition-all hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-default"
              style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              {deactivated ? "✓ Deactivated" : "Deactivate Account"}
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all hover:bg-red-500/10"
              style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <Modal onClose={() => setShow2FAModal(false)}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.25)" }}>
              <Smartphone className="w-5 h-5" style={{ color: "#14b8a6" }} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Set Up Two-Factor Auth</h3>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Secure your account with SMS verification</p>
            </div>
          </div>

          {twoFAStep === "phone" && (
            <>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={twoFAPhone}
                onChange={e => setTwoFAPhone(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendOTP()}
                placeholder="+1 (555) 000-0000"
                className="vl-input w-full mb-4"
                autoFocus
              />
              <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>
                We'll send a 6-digit verification code to this number.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShow2FAModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                  Cancel
                </button>
                <button
                  onClick={handleSendOTP}
                  disabled={twoFASending || twoFAPhone.replace(/\D/g, "").length < 7}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white vl-btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                  {twoFASending ? "Sending…" : "Send Code"}
                </button>
              </div>
            </>
          )}

          {twoFAStep === "verify" && (
            <>
              <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
                Enter the 6-digit code sent to <span className="font-semibold text-white">{twoFAPhone}</span>
              </p>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={twoFACode}
                onChange={e => { setTwoFACode(e.target.value.replace(/\D/g, "")); setTwoFACodeError(false); }}
                onKeyDown={e => e.key === "Enter" && twoFACode.length === 6 && handleVerifyOTP()}
                placeholder="123456"
                className="vl-input w-full mb-1 text-center font-mono text-lg tracking-widest"
                style={{ borderColor: twoFACodeError ? "rgba(239,68,68,0.5)" : undefined }}
                autoFocus
              />
              {twoFACodeError && (
                <p className="text-xs mb-3" style={{ color: "#f87171" }}>Incorrect code. Try again (hint: 123456)</p>
              )}
              <p className="text-xs mb-5 mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                Didn't receive it?{" "}
                <button onClick={() => setTwoFAStep("phone")} className="underline" style={{ color: "#14b8a6" }}>
                  Change number
                </button>
              </p>
              <div className="flex gap-3">
                <button onClick={() => setTwoFAStep("phone")}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                  Back
                </button>
                <button
                  onClick={handleVerifyOTP}
                  disabled={twoFAVerifying || twoFACode.length !== 6}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white vl-btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                  {twoFAVerifying ? "Verifying…" : "Verify"}
                </button>
              </div>
            </>
          )}

          {twoFAStep === "done" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(20,184,166,0.15)", border: "2px solid #14b8a6" }}>
                <CheckCircle className="w-8 h-8" style={{ color: "#14b8a6" }} />
              </div>
              <p className="text-lg font-bold text-white mb-1">2FA Enabled!</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Your account is now protected.</p>
            </div>
          )}
        </Modal>
      )}

      {/* Deactivate modal */}
      {showDeactivate && (
        <Modal onClose={() => setShowDeactivate(false)}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)" }}>
              <AlertTriangle className="w-5 h-5" style={{ color: "#fbbf24" }} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Deactivate Account?</h3>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Your account will be hidden until you log back in</p>
            </div>
          </div>
          <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
            Deactivating will hide your profile and pause all subscriptions. You can reactivate at any time by signing in again.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeactivate(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              Cancel
            </button>
            <button onClick={handleDeactivate}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)", color: "#fbbf24" }}>
              Deactivate
            </button>
          </div>
        </Modal>
      )}

      {/* Delete modal */}
      {showDelete && (
        <Modal onClose={() => { setShowDelete(false); setDeleteConfirm(""); }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <AlertTriangle className="w-5 h-5" style={{ color: "#f87171" }} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Delete Account Permanently?</h3>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>This cannot be undone</p>
            </div>
          </div>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
            All your data, messages, credits, and subscriptions will be permanently deleted. This action is irreversible.
          </p>
          <div className="rounded-xl p-3 mb-5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <p className="text-xs mb-2 font-semibold" style={{ color: "#fca5a5" }}>Type DELETE to confirm</p>
            <input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="vl-input text-sm font-mono"
              style={{ borderColor: deleteConfirm === "DELETE" ? "rgba(239,68,68,0.5)" : undefined }}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteConfirm !== "DELETE"}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171" }}>
              Delete Forever
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
