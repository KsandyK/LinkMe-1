/**
 * LINKME â€” Account Settings Page
 * Velvet Dark Design System
 * PII-safe account management.
 */
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Link } from "wouter";
import { User, Lock, Shield, Bell, Trash2, Eye, EyeOff, CheckCircle } from "lucide-react";

type Tab = "profile" | "security" | "privacy" | "notifications";

export default function Account() {
  const { ageVerificationStatus } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [dataDownloadRequested, setDataDownloadRequested] = useState(false);

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "profile", label: "Profile", icon: User },
    { key: "security", label: "Security", icon: Lock },
    { key: "privacy", label: "Privacy & Data", icon: Shield },
    { key: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-3xl mx-auto">
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 700, color: "white", marginBottom: "1.5rem" }}>Account Settings</h1>

        {/* Age verification status */}
        <div className="vl-card p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5" style={{ color: ageVerificationStatus === "verified" ? "#14b8a6" : "#fbbf24" }} />
            <div>
              <p className="text-sm font-bold text-white">Age Verification</p>
              <p className="text-xs" style={{ color: ageVerificationStatus === "verified" ? "#14b8a6" : "#fbbf24" }}>
                {ageVerificationStatus === "verified" ? "âœ“ Verified â€” Full access enabled" : "Not verified â€” Limited access"}
              </p>
            </div>
          </div>
          {ageVerificationStatus !== "verified" && (
            <Link href="/verify-age">
              <button className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)", color: "#fbbf24" }}>Verify Now</button>
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200"
              style={{
                background: activeTab === t.key ? "rgba(20,184,166,0.15)" : "transparent",
                color: activeTab === t.key ? "#14b8a6" : "rgba(255,255,255,0.4)",
                border: activeTab === t.key ? "1px solid rgba(20,184,166,0.25)" : "1px solid transparent",
              }}>
              <t.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="vl-card p-6 animate-fade-up space-y-4">
            <h2 className="font-bold text-white">Profile Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Display Name</label>
                <input type="text" defaultValue="User123" className="vl-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Username</label>
                <input type="text" defaultValue="@user123" className="vl-input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Email Address</label>
              <input type="email" defaultValue="user@example.com" className="vl-input" />
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                <Lock className="w-3 h-3 inline mr-1" style={{ color: "#14b8a6" }} />
                Email is encrypted and never shared with third parties.
              </p>
            </div>
            <button className="vl-btn-primary px-5 py-2.5 text-sm">Save Changes</button>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="vl-card p-6 animate-fade-up space-y-5">
            <h2 className="font-bold text-white">Security Settings</h2>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>Change Password</h3>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Current Password</label>
                <div className="relative">
                  <input type={showCurrentPassword ? "text" : "password"} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className="vl-input pr-10" />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} /> : <Eye className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>New Password</label>
                <div className="relative">
                  <input type={showNewPassword ? "text" : "password"} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className="vl-input pr-10" />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showNewPassword ? <EyeOff className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} /> : <Eye className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />}
                  </button>
                </div>
              </div>
              <button className="vl-btn-primary px-5 py-2.5 text-sm">Update Password</button>
            </div>
            <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-white text-sm">Two-Factor Authentication</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Add an extra layer of security to your account</p>
              </div>
              <button onClick={() => setTwoFaEnabled(!twoFaEnabled)}
                className="w-12 h-6 rounded-full transition-all duration-300 relative"
                style={{ background: twoFaEnabled ? "#14b8a6" : "rgba(255,255,255,0.1)" }}>
                <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all duration-300" style={{ left: twoFaEnabled ? "calc(100% - 22px)" : "2px" }} />
              </button>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === "privacy" && (
          <div className="vl-card p-6 animate-fade-up space-y-5">
            <h2 className="font-bold text-white">Privacy & Data Rights</h2>
            <div className="vl-pii-shield">
              <p className="text-xs font-bold mb-2" style={{ color: "#5eead4" }}>Your Data Rights (GDPR / CCPA)</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                You have the right to access, correct, export, or delete your personal data at any time. LINKME processes your data in accordance with GDPR, CCPA, and applicable privacy laws.
              </p>
            </div>
            <div className="space-y-3">
              <button onClick={() => { setDataDownloadRequested(true); }}
                className="w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2.5">
                  {dataDownloadRequested ? <CheckCircle className="w-4 h-4" style={{ color: "#14b8a6" }} /> : <Shield className="w-4 h-4" style={{ color: "#14b8a6" }} />}
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">Download My Data</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{dataDownloadRequested ? "Request submitted â€” you'll receive an email within 48 hours" : "Export all your personal data (GDPR Article 20)"}</p>
                  </div>
                </div>
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2.5">
                  <Trash2 className="w-4 h-4" style={{ color: "#fca5a5" }} />
                  <div className="text-left">
                    <p className="text-sm font-semibold" style={{ color: "#fca5a5" }}>Delete My Account</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Permanently delete your account and all associated data</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="vl-card p-6 animate-fade-up space-y-4">
            <h2 className="font-bold text-white">Notification Preferences</h2>
            {[
              { label: "New messages", desc: "Get notified when a creator messages you" },
              { label: "Creator goes live", desc: "Alerts when followed creators start streaming" },
              { label: "Content unlocked", desc: "Confirmation when content is unlocked" },
              { label: "Promotional emails", desc: "Special offers and platform updates" },
            ].map((item, i) => (
              <div key={item.label} className="flex items-center justify-between py-2" style={{ borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{item.desc}</p>
                </div>
                <button className="w-10 h-5 rounded-full transition-all duration-300 relative" style={{ background: i < 2 ? "#14b8a6" : "rgba(255,255,255,0.1)" }}>
                  <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-300" style={{ left: i < 2 ? "calc(100% - 18px)" : "2px" }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
