/**
 * CRAVR — AgeGate Component
 * Velvet Dark Design System
 * Full-screen +18 acknowledgement landing page with legal compliance.
 * Must be accepted before any site content is shown.
 */
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";

const AGE_GATE_BG = "https://images.unsplash.com/photo-1557683311-eac922347aa1?auto=format&w=1920&q=80";

export function AgeGate() {
  const { ageGateAccepted, setAgeGateAccepted } = useApp();
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");

  if (ageGateAccepted) return null;

  const handleEnter = () => {
    if (!checked) {
      setError("You must confirm you are 18 years of age or older to enter.");
      return;
    }
    setAgeGateAccepted(true);
  };

  const handleLeave = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        backgroundImage: `url(${AGE_GATE_BG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg mx-4 animate-scale-in">
        {/* Card */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(10, 10, 20, 0.92)", border: "1px solid rgba(20,184,166,0.25)", boxShadow: "0 0 60px rgba(20,184,166,0.15), 0 25px 50px rgba(0,0,0,0.6)" }}>
          {/* Header bar */}
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #14b8a6, #e8a87c, #14b8a6)" }} />

          <div className="p-8">
            {/* Logo */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-3 mb-3">
                <img src="/vibelink-icon.png" alt="CRAVR" className="w-10 h-10" />
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>CRAVR</h1>
              </div>
              <p style={{ color: "#14b8a6", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>Premium Live Interaction Platform</p>
            </div>

            {/* Divider */}
            <div className="w-full h-px mb-6" style={{ background: "rgba(255,255,255,0.08)" }} />

            {/* Warning */}
            <div className="rounded-xl p-4 mb-6" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">⚠️</span>
                <div>
                  <p style={{ color: "#fca5a5", fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.25rem" }}>ADULT CONTENT — 18+ ONLY</p>
                  <p style={{ color: "rgba(252,165,165,0.75)", fontSize: "0.8rem", lineHeight: 1.5 }}>
                    This website contains sexually explicit material, adult content, and mature themes intended exclusively for adults aged 18 years or older. Access by minors is strictly prohibited.
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.5rem", textAlign: "center" }}>
              CRAVR is a premium adult live interaction platform. All creators are verified adults who have consented to share content on this platform. All content is legal and compliant with applicable laws.
            </p>

            {/* Compliance badges */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { icon: "🔒", label: "SSL Secured" },
                { icon: "✓", label: "2257 Compliant" },
                { icon: "🛡️", label: "COPPA Compliant" },
              ].map(b => (
                <div key={b.label} className="rounded-lg p-2 text-center" style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.15)" }}>
                  <div style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>{b.icon}</div>
                  <div style={{ color: "#5eead4", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.05em" }}>{b.label}</div>
                </div>
              ))}
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-3 mb-4 cursor-pointer group">
              <div className="relative mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={e => { setChecked(e.target.checked); setError(""); }}
                  className="sr-only"
                />
                <div
                  className="w-5 h-5 rounded flex items-center justify-center transition-all duration-200"
                  style={{
                    background: checked ? "linear-gradient(135deg, #14b8a6, #0d9488)" : "rgba(255,255,255,0.05)",
                    border: checked ? "none" : "1px solid rgba(255,255,255,0.2)",
                    boxShadow: checked ? "0 0 10px rgba(20,184,166,0.4)" : "none",
                  }}
                >
                  {checked && <span style={{ color: "white", fontSize: "0.7rem", fontWeight: 900 }}>✓</span>}
                </div>
              </div>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.8rem", lineHeight: 1.5 }}>
                I confirm that I am <strong style={{ color: "white" }}>18 years of age or older</strong>, I am not prohibited by any laws from viewing adult content, and I agree to the{" "}
                <a href="/legal/terms" style={{ color: "#14b8a6" }} onClick={e => e.stopPropagation()}>Terms of Service</a>,{" "}
                <a href="/legal/privacy" style={{ color: "#14b8a6" }} onClick={e => e.stopPropagation()}>Privacy Policy</a>, and{" "}
                <a href="/legal/conduct" style={{ color: "#14b8a6" }} onClick={e => e.stopPropagation()}>Code of Conduct</a>.
              </p>
            </label>

            {error && (
              <p style={{ color: "#fca5a5", fontSize: "0.8rem", marginBottom: "1rem", paddingLeft: "2rem" }}>{error}</p>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleLeave}
                className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
              >
                I am under 18 — Leave
              </button>
              <button
                onClick={handleEnter}
                className="flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200"
                style={{
                  background: checked ? "linear-gradient(135deg, #14b8a6, #0d9488)" : "rgba(20,184,166,0.2)",
                  color: checked ? "white" : "rgba(20,184,166,0.5)",
                  border: checked ? "none" : "1px solid rgba(20,184,166,0.2)",
                  boxShadow: checked ? "0 4px 20px rgba(20,184,166,0.35)" : "none",
                }}
              >
                I am 18+ — Enter Site
              </button>
            </div>

            {/* Footer note */}
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", textAlign: "center", marginTop: "1rem", lineHeight: 1.5 }}>
              By entering, you acknowledge that you have read and agree to our terms. Your session data is protected under our Privacy Policy. This site uses cookies for age verification purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
