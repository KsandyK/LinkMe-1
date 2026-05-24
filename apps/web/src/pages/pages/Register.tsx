/**
 * LINKME â€” Register / Login Page
 * Velvet Dark Design System
 * PII-safe registration with clear data usage disclosure.
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { Lock, Eye, EyeOff, Shield, CheckCircle } from "lucide-react";

export default function Register() {
  const [, navigate] = useLocation();
  const { showToast } = useApp();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ageConfirm, setAgeConfirm] = useState(false);
  const [termsAccept, setTermsAccept] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register" && (!ageConfirm || !termsAccept)) {
      showToast({ title: "Required fields missing", description: "Please confirm your age and accept the terms.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast({ title: mode === "register" ? "Account created!" : "Welcome back!", description: "Redirecting to your dashboard..." });
      navigate("/");
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)" }}>ðŸ’Ž</div>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.75rem", fontWeight: 700, color: "white" }}>LINKME</span>
            </div>
          </Link>
        </div>

        <div className="vl-card p-6">
          {/* Mode toggle */}
          <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {(["register", "login"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200"
                style={{
                  background: mode === m ? "rgba(20,184,166,0.15)" : "transparent",
                  color: mode === m ? "#14b8a6" : "rgba(255,255,255,0.4)",
                  border: mode === m ? "1px solid rgba(20,184,166,0.25)" : "1px solid transparent",
                }}
              >{m === "register" ? "Create Account" : "Sign In"}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Username</label>
                <input type="text" placeholder="Choose a username" value={username} onChange={e => setUsername(e.target.value)}
                  className="vl-input" required autoComplete="username" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Email Address</label>
              <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
                className="vl-input" required autoComplete="email" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder={mode === "register" ? "Create a strong password" : "Your password"}
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="vl-input pr-10" required autoComplete={mode === "register" ? "new-password" : "current-password"} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} /> : <Eye className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <>
                {/* PII Notice */}
                <div className="vl-pii-shield">
                  <p className="text-xs flex items-start gap-1.5" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                    <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#14b8a6" }} />
                    Your email is encrypted and used only for account security. We do not sell personal data. See our <a href="/legal/privacy" style={{ color: "#14b8a6" }}>Privacy Policy</a>.
                  </p>
                </div>

                {/* Age confirmation */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input type="checkbox" checked={ageConfirm} onChange={e => setAgeConfirm(e.target.checked)} className="sr-only" />
                    <div className="w-5 h-5 rounded flex items-center justify-center transition-all duration-200"
                      style={{ background: ageConfirm ? "linear-gradient(135deg, #14b8a6, #0d9488)" : "rgba(255,255,255,0.05)", border: ageConfirm ? "none" : "1px solid rgba(255,255,255,0.2)" }}>
                      {ageConfirm && <span style={{ color: "white", fontSize: "0.7rem", fontWeight: 900 }}>âœ“</span>}
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                    I confirm I am <strong style={{ color: "white" }}>18 years of age or older</strong> and legally permitted to access adult content in my jurisdiction.
                  </p>
                </label>

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input type="checkbox" checked={termsAccept} onChange={e => setTermsAccept(e.target.checked)} className="sr-only" />
                    <div className="w-5 h-5 rounded flex items-center justify-center transition-all duration-200"
                      style={{ background: termsAccept ? "linear-gradient(135deg, #14b8a6, #0d9488)" : "rgba(255,255,255,0.05)", border: termsAccept ? "none" : "1px solid rgba(255,255,255,0.2)" }}>
                      {termsAccept && <span style={{ color: "white", fontSize: "0.7rem", fontWeight: 900 }}>âœ“</span>}
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                    I agree to the <a href="/legal/terms" style={{ color: "#14b8a6" }}>Terms of Service</a>, <a href="/legal/privacy" style={{ color: "#14b8a6" }}>Privacy Policy</a>, and <a href="/legal/conduct" style={{ color: "#14b8a6" }}>Code of Conduct</a>.
                  </p>
                </label>
              </>
            )}

            <button type="submit" disabled={loading}
              className="vl-btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "white", borderTopColor: "transparent" }} />
              ) : (
                <><Lock className="w-4 h-4" /> {mode === "register" ? "Create Account" : "Sign In"}</>
              )}
            </button>
          </form>

          {mode === "login" && (
            <p className="text-center text-xs mt-4" style={{ color: "rgba(255,255,255,0.4)" }}>
              Don't have an account?{" "}
              <button onClick={() => setMode("register")} style={{ color: "#14b8a6" }}>Create one</button>
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 mt-4">
          <span className="text-xs flex items-center gap-1" style={{ color: "rgba(255,255,255,0.25)" }}>
            <Shield className="w-3 h-3" style={{ color: "#14b8a6" }} /> SSL Secured
          </span>
          <span className="text-xs font-bold" style={{ color: "rgba(239,68,68,0.4)" }}>18+ ONLY</span>
        </div>
      </div>
    </div>
  );
}
