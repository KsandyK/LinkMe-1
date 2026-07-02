/**
 * CRAVR — Dev Reset Page  (/dev/reset)
 * Only renders in development mode (import.meta.env.DEV).
 * Wipes all localStorage and logs in as the test user in one click.
 */

import { useLocation } from "wouter";

// All localStorage keys used by the app
const ALL_KEYS = [
  "cravr_token",
  "cravr_user",
  "cravr_refresh",
  "vl_age_gate_v1",
  "vl_age_verify_v1",
  "vl_credits_v1",
  "vl_unlocked_v1",
  "vl_membership_v1",
  "vl_active_boost_v1",
  "vl_transactions_v1",
  "vl_favorites_v1",
  "vl_active_drop_v1",
];

// Test user — matches credentials in apps/api/prisma/reset-local.ts
const TEST_USER = {
  id:       "demo-testuser",
  username: "testuser",
  role:     "MEMBER",
};
const TEST_CREDITS  = 1000;
const TEST_TOKEN    = `demo-token-testuser`;

function resetAndLogin() {
  // 1. Wipe everything
  ALL_KEYS.forEach(k => localStorage.removeItem(k));

  // 2. Set up clean test session
  localStorage.setItem("cravr_token",      TEST_TOKEN);
  localStorage.setItem("cravr_user",       JSON.stringify(TEST_USER));
  localStorage.setItem("vl_age_gate_v1",   "true");
  localStorage.setItem("vl_age_verify_v1", JSON.stringify("verified"));
  localStorage.setItem("vl_credits_v1",    JSON.stringify(TEST_CREDITS));
  localStorage.setItem("vl_membership_v1", JSON.stringify("free"));

  // 3. Hard reload so React picks up the new state
  window.location.href = "/";
}

function clearAndLogout() {
  ALL_KEYS.forEach(k => localStorage.removeItem(k));
  window.location.href = "/";
}

export default function DevReset() {
  const [, navigate] = useLocation();

  // Block in production
  if (!import.meta.env.DEV) {
    navigate("/");
    return null;
  }

  // Read current state
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("cravr_user") ?? "null"); } catch { return null; }
  })();
  const currentCredits = (() => {
    try { return JSON.parse(localStorage.getItem("vl_credits_v1") ?? "250"); } catch { return 250; }
  })();
  const ageStatus = (() => {
    try { return JSON.parse(localStorage.getItem("vl_age_verify_v1") ?? '"unverified"'); } catch { return "unverified"; }
  })();

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#09091a" }}>
      <div className="w-full max-w-md space-y-4">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3"
            style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)", color: "#eab308" }}>
            ⚠ DEV ONLY — not visible in production
          </div>
          <h1 className="text-2xl font-bold text-white">Local Dev Reset</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Manage localStorage state for http://localhost:5175
          </p>
        </div>

        {/* Current state */}
        <div className="rounded-xl p-4 space-y-2"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs font-semibold mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            CURRENT LOCALSTORAGE STATE
          </p>
          <Row label="Logged in as"  value={currentUser ? `@${currentUser.username} (${currentUser.role})` : "— not logged in"} />
          <Row label="Credits"        value={`${currentCredits.toLocaleString()} cr`} />
          <Row label="Age status"     value={ageStatus} />
          <Row label="Token"          value={localStorage.getItem("cravr_token") ? "set" : "—"} />
        </div>

        {/* Primary action */}
        <button
          onClick={resetAndLogin}
          className="w-full py-4 rounded-xl font-bold text-sm transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white" }}>
          🔄 Reset & Log In as Test User
          <span className="block text-xs font-normal mt-0.5 opacity-70">
            Clears all accounts · testuser · 1,000 credits · age verified
          </span>
        </button>

        {/* Secondary: just log out / clear */}
        <button
          onClick={clearAndLogout}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
          🗑 Clear All & Go to Home (logged out)
        </button>

        {/* Info */}
        <div className="rounded-xl p-4"
          style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.15)" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "#5eead4" }}>Test account details</p>
          <div className="space-y-1">
            <Row label="Username" value="testuser" />
            <Row label="Password" value="Test123!" note="(for real DB login)" />
            <Row label="Credits"  value="1,000" />
            <Row label="Role"     value="MEMBER" />
            <Row label="Age gate" value="verified" />
          </div>
        </div>

        <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          Bookmark <strong style={{ color: "rgba(255,255,255,0.35)" }}>localhost:5175/dev/reset</strong> for quick access
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</span>
      <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
        {value} {note && <span style={{ color: "rgba(255,255,255,0.3)" }}>{note}</span>}
      </span>
    </div>
  );
}
