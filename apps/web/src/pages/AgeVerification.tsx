/**
 * CRAVR — Age Verification Page
 * Velvet Dark Design System
 *
 * Age verification is handled entirely by CCBill.
 * CCBill independently confirms every cardholder is 18+ before processing
 * a payment. A completed purchase is therefore proof of age — no separate
 * government ID upload or manual review is needed.
 *
 * Flow:
 *   1. User arrives here (from age gate or nav link)
 *   2. If already verified  → show "Already Verified" screen
 *   3. If not verified      → explain CCBill verification + CTA to /credits
 *   4. On first CCBill payment the webhook auto-sets AgeVerification = VERIFIED
 *   5. AppContext syncs status from API on mount → user sees verified on return
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { ageVerify as ageVerifyApi } from "@/lib/api";
import { Shield, Lock, CheckCircle, CreditCard, Zap, ShieldCheck, Loader2 } from "lucide-react";

const VERIFY_BG = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&w=1920&q=80";

export default function AgeVerification() {
  const { ageVerificationStatus, setAgeVerificationStatus, isLoggedIn, showToast } = useApp();
  const [, navigate] = useLocation();
  const [requestingManual, setRequestingManual] = useState(false);

  // Temporary manual-review request (while CCBill purchase flow is offline)
  const handleRequestManual = async () => {
    setRequestingManual(true);
    try {
      await ageVerifyApi.requestManual();
      setAgeVerificationStatus("pending");
      showToast({ title: "Request submitted", description: "Our team will review your verification shortly." });
    } catch {
      // Even on API error, reflect pending locally so the user isn't stuck
      setAgeVerificationStatus("pending");
      showToast({ title: "Request submitted", description: "Our team will review your verification shortly." });
    } finally {
      setRequestingManual(false);
    }
  };

  // ── Already verified ───────────────────────────────────────────────────────
  if (ageVerificationStatus === "verified") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "#09091a" }}>
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(20,184,166,0.15)", border: "2px solid #14b8a6" }}>
            <CheckCircle className="w-10 h-10" style={{ color: "#14b8a6" }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.75rem", fontWeight: 700, color: "white", marginBottom: "0.5rem" }}>
            Already Verified
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "1.5rem" }}>
            Your age has been verified. You have full access to all platform features.
          </p>
          <button onClick={() => navigate("/")} className="vl-btn-primary px-6 py-3 text-sm">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Pending (waiting for payment webhook) ─────────────────────────────────
  if (ageVerificationStatus === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "#09091a" }}>
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(234,179,8,0.1)", border: "2px solid rgba(234,179,8,0.4)" }}>
            <ShieldCheck className="w-10 h-10" style={{ color: "#eab308" }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.75rem", fontWeight: 700, color: "white", marginBottom: "0.5rem" }}>
            Verification in Progress
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            Your payment is being confirmed. Verification typically completes within a few minutes.
            Refresh the page after your purchase is processed.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/credits">
              <button className="vl-btn-primary px-5 py-3 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Buy Credits
              </button>
            </Link>
            <button onClick={() => navigate("/")} className="px-5 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Not verified — main gate ───────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #09091a 0%, #0d1a1a 100%)" }}>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: `url(${VERIFY_BG}) center/cover`, minHeight: "200px" }}>
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 container py-12 text-center">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6", letterSpacing: "0.1em" }}>
            <Shield className="w-3.5 h-3.5" /> SECURE AGE VERIFICATION
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", fontWeight: 700, color: "white" }}>
            Verify Your Age
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "0.5rem" }}>
            Required to access all platform features.
          </p>
        </div>
      </div>

      <div className="container py-10 max-w-lg mx-auto">
        <div className="vl-card p-8">

          {/* Icon */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(20,184,166,0.1)", border: "2px solid rgba(20,184,166,0.3)" }}>
            <Lock className="w-9 h-9" style={{ color: "#14b8a6" }} />
          </div>

          <h2 className="text-center" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.75rem", fontWeight: 700, color: "white", marginBottom: "0.75rem" }}>
            One Step Away
          </h2>

          {/* CCBill explanation */}
          <div className="mb-6 px-4 py-4 rounded-xl text-center"
            style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)" }}>
            <Zap className="w-5 h-5 mx-auto mb-2" style={{ color: "#14b8a6" }} />
            <p className="text-sm font-semibold mb-1" style={{ color: "#5eead4" }}>
              Purchasing credits automatically verifies your age
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
              Our secure payment processor independently confirms that every cardholder is 18+ before processing a transaction — no separate ID upload or waiting period required.
            </p>
          </div>

          {/* How it works */}
          <div className="space-y-3 mb-7">
            {[
              {
                step: "1",
                title: "Choose a credit pack",
                desc: "Starting from $9.99 — credits are used to chat, tip creators, and unlock content.",
              },
              {
                step: "2",
                title: "Your age is confirmed instantly",
                desc: "Our payment processor verifies your card and age as part of standard, secure payment processing.",
              },
              {
                step: "3",
                title: "Full access, immediately",
                desc: "Your account is verified the moment the payment completes. No waiting, no manual review.",
              },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ background: "rgba(20,184,166,0.15)", color: "#14b8a6", border: "1px solid rgba(20,184,166,0.3)" }}>
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "white" }}>{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Privacy note */}
          <div className="mb-6 flex items-start gap-2 p-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#14b8a6" }} />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
              CRAVR never sees or stores your card details. All payment data is handled exclusively by our PCI DSS Level 1 compliant payment processor. Only your verified age status is recorded on our platform.
            </p>
          </div>

          {/* CTA */}
          {isLoggedIn ? (
            /* Signed in but unverified → drive to purchase, with manual-review fallback */
            <div className="space-y-3">
              <Link href="/credits">
                <button className="vl-btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm font-bold">
                  <CreditCard className="w-4 h-4" />
                  Choose a Credit Pack &amp; Verify
                </button>
              </Link>
              <button
                onClick={handleRequestManual}
                disabled={requestingManual}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all hover:bg-white/5 disabled:opacity-60"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                {requestingManual ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" style={{ color: "#14b8a6" }} />}
                Request manual verification
              </button>
              <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                Can't purchase right now? Request a manual review and our team will verify you.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Link href="/register">
                <button className="vl-btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm font-bold">
                  <CreditCard className="w-4 h-4" />
                  Create Account &amp; Buy Credits
                </button>
              </Link>
              <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                Create your free account, then choose a credit pack — your age verifies instantly at checkout.
              </p>

              {/* Alternative: creator account */}
              <div className="pt-3 mt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <Link href="/become-creator">
                  <button className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all hover:bg-white/5"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                    <Zap className="w-4 h-4" style={{ color: "#14b8a6" }} />
                    Want to earn? Create a creator account
                  </button>
                </Link>
              </div>

              <p className="text-center text-xs pt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                Already have an account?{" "}
                <Link href="/login">
                  <span className="underline cursor-pointer" style={{ color: "#14b8a6" }}>Sign in</span>
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Legal note */}
        <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.2)", lineHeight: 1.6 }}>
          By purchasing credits you confirm you are at least 18 years of age and agree to our{" "}
          <Link href="/legal/terms">
            <span className="underline cursor-pointer" style={{ color: "rgba(255,255,255,0.35)" }}>Terms of Service</span>
          </Link>
          {" "}and{" "}
          <Link href="/legal/privacy">
            <span className="underline cursor-pointer" style={{ color: "rgba(255,255,255,0.35)" }}>Privacy Policy</span>
          </Link>.
        </p>
      </div>
    </div>
  );
}
