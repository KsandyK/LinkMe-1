/**
 * VIBELINK — Become a Creator Page
 * Velvet Dark Design System
 * Creator onboarding with age verification requirement and PII safety.
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { Shield, Lock, CheckCircle, Upload, AlertTriangle, Mic, Video } from "lucide-react";
import { useMediaDevices } from "@/hooks/useMediaDevices";

const CREATOR_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663496736475/iocsuczeEqfyUdtEzAFeTS/vibelink-creator-bg-TidpZ9vPtwVzH6Bn4KTMHy.webp";

type Step = "info" | "identity" | "banking" | "review" | "complete";

export default function BecomeCreator() {
  const { ageVerificationStatus, showToast } = useApp();
  const [, navigate] = useLocation();
  const mediaDevices = useMediaDevices();
  const [step, setStep] = useState<Step>("info");
  const [idUploaded, setIdUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);
  const [piiConsent, setPiiConsent] = useState(false);
  const [bankingConsent, setBankingConsent] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [accountName, setAccountName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const handleSubmit = () => {
    if (!piiConsent || !bankingConsent) {
      showToast({ title: "Consent required", description: "Please accept all required consents.", variant: "destructive" });
      return;
    }
    setStep("review");
    setTimeout(() => setStep("complete"), 2000);
  };

  if (step === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(20,184,166,0.15)", border: "2px solid #14b8a6", boxShadow: "0 0 30px rgba(20,184,166,0.3)" }}>
            <CheckCircle className="w-10 h-10" style={{ color: "#14b8a6" }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 700, color: "white", marginBottom: "0.5rem" }}>Application Submitted!</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "1.5rem" }}>Your creator application is under review. We'll notify you within 24–48 hours.</p>
          <button onClick={() => navigate("/")} className="vl-btn-primary px-6 py-3 text-sm">Return to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative" style={{ minHeight: "200px" }}>
        <img src={CREATOR_BG} alt="Become a Creator" className="w-full h-full object-cover absolute inset-0" />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 container py-12 text-center">
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", fontWeight: 700, color: "white" }}>Become a Creator</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "0.5rem" }}>Join thousands of creators earning on VibeLink</p>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto py-8">
        {/* Age verification requirement */}
        {ageVerificationStatus !== "verified" && (
          <div className="vl-warning-box mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#fca5a5" }} />
            <div>
              <p className="font-bold text-sm" style={{ color: "#fca5a5" }}>Age Verification Required</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(252,165,165,0.7)" }}>You must verify your age before applying to become a creator.</p>
              <Link href="/verify-age">
                <button className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                  Verify Age Now →
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {(["info", "identity", "banking"] as Step[]).map((s, i) => (
            <button key={s} onClick={() => setStep(s)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200"
              style={{
                background: step === s ? "rgba(20,184,166,0.15)" : "transparent",
                color: step === s ? "#14b8a6" : "rgba(255,255,255,0.4)",
                border: step === s ? "1px solid rgba(20,184,166,0.25)" : "1px solid transparent",
              }}>
              {i + 1}. {s === "info" ? "Profile Info" : s === "identity" ? "Identity" : "Banking"}
            </button>
          ))}
        </div>

        {/* Media Device Status */}
        <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)" }}>
          <p className="text-xs font-semibold mb-3" style={{ color: "#14b8a6" }}>📹 Streaming Equipment Status</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${mediaDevices.hasWebcam ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Webcam: {mediaDevices.hasWebcam ? "✓ Ready" : "✗ Not Found"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${mediaDevices.hasMicrophone ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Microphone: {mediaDevices.hasMicrophone ? "✓ Ready" : "✗ Not Found"}</span>
            </div>
          </div>
          {mediaDevices.error && (
            <p className="text-xs mt-2" style={{ color: "#fca5a5" }}>⚠️ {mediaDevices.error}</p>
          )}
        </div>

        {/* Step: Profile Info */}
        {step === "info" && (
          <div className="vl-card p-6 animate-fade-up space-y-4">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", fontWeight: 700, color: "white" }}>Creator Profile</h2>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Display Name</label>
              <input type="text" placeholder="Your creator name" value={displayName} onChange={e => setDisplayName(e.target.value)} className="vl-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Bio</label>
              <textarea placeholder="Tell viewers about yourself..." value={bio} onChange={e => setBio(e.target.value)}
                className="vl-input resize-none" rows={4} />
            </div>
            <button onClick={() => setStep("identity")} className="vl-btn-primary w-full py-3 text-sm">Continue to Identity Verification</button>
          </div>
        )}

        {/* Step: Identity */}
        {step === "identity" && (
          <div className="vl-card p-6 animate-fade-up space-y-4">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", fontWeight: 700, color: "white" }}>Identity Verification</h2>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Required by law for all content creators. All creators must be verified adults (18+).</p>

            <div className="vl-pii-shield flex items-start gap-3">
              <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#14b8a6" }} />
              <div>
                <p className="font-bold text-xs mb-1" style={{ color: "#5eead4" }}>Creator PII Protection</p>
                <ul className="text-xs space-y-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                  <li>• Government ID is encrypted and deleted after verification</li>
                  <li>• Only age confirmation is stored — not your ID details</li>
                  <li>• Compliant with 18 U.S.C. § 2257 record-keeping requirements</li>
                  <li>• Your legal name is never displayed publicly</li>
                </ul>
              </div>
            </div>

            {[
              { label: "Government-Issued Photo ID", key: "id" as const, state: idUploaded, setter: setIdUploaded },
              { label: "Selfie Holding Your ID", key: "selfie" as const, state: selfieUploaded, setter: setSelfieUploaded },
            ].map(item => (
              <div key={item.key}>
                <label className="block text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>{item.label}</label>
                <button onClick={() => item.setter(true)}
                  className="w-full rounded-xl p-5 text-center transition-all duration-200 flex flex-col items-center gap-2"
                  style={{
                    background: item.state ? "rgba(20,184,166,0.08)" : "rgba(255,255,255,0.03)",
                    border: item.state ? "2px solid rgba(20,184,166,0.4)" : "2px dashed rgba(255,255,255,0.1)",
                  }}>
                  {item.state ? (
                    <><CheckCircle className="w-7 h-7" style={{ color: "#14b8a6" }} /><span className="text-sm font-semibold" style={{ color: "#14b8a6" }}>Uploaded</span></>
                  ) : (
                    <><Upload className="w-7 h-7" style={{ color: "rgba(255,255,255,0.25)" }} /><span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Click to upload</span></>
                  )}
                </button>
              </div>
            ))}

            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5 flex-shrink-0">
                <input type="checkbox" checked={piiConsent} onChange={e => setPiiConsent(e.target.checked)} className="sr-only" />
                <div className="w-5 h-5 rounded flex items-center justify-center transition-all duration-200"
                  style={{ background: piiConsent ? "linear-gradient(135deg, #14b8a6, #0d9488)" : "rgba(255,255,255,0.05)", border: piiConsent ? "none" : "1px solid rgba(255,255,255,0.2)" }}>
                  {piiConsent && <span style={{ color: "white", fontSize: "0.7rem", fontWeight: 900 }}>✓</span>}
                </div>
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                I consent to the processing of my identity documents for creator verification in compliance with 18 U.S.C. § 2257 and applicable privacy laws.
              </p>
            </label>

            <div className="flex gap-3">
              <button onClick={() => setStep("info")} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>Back</button>
              <button onClick={() => setStep("banking")} disabled={!idUploaded || !selfieUploaded}
                className="vl-btn-primary flex-1 py-3 text-sm disabled:opacity-40">Continue to Banking</button>
            </div>
          </div>
        )}

        {/* Step: Banking */}
        {step === "banking" && (
          <div className="vl-card p-6 animate-fade-up space-y-4">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", fontWeight: 700, color: "white" }}>Payout Information</h2>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Required to receive your earnings. Payouts are processed weekly.</p>

            <div className="vl-pii-shield flex items-start gap-3">
              <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#14b8a6" }} />
              <div>
                <p className="font-bold text-xs mb-1" style={{ color: "#5eead4" }}>Banking Data Security</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                  Banking details are encrypted with AES-256 and stored by our PCI DSS Level 1 certified payout partner. VibeLink never stores full account numbers. Your banking data is used solely for payout processing.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Account Holder Name</label>
              <input type="text" placeholder="Legal name on account" value={accountName} onChange={e => setAccountName(e.target.value)} className="vl-input" autoComplete="name" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Routing Number</label>
              <div className="relative">
                <input type="text" placeholder="9-digit routing number" value={routingNumber}
                  onChange={e => setRoutingNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
                  className="vl-input pr-10" autoComplete="off" />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#14b8a6" }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Account Number</label>
              <div className="relative">
                <input type="password" placeholder="Bank account number" value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                  className="vl-input pr-10" autoComplete="off" />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#14b8a6" }} />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5 flex-shrink-0">
                <input type="checkbox" checked={bankingConsent} onChange={e => setBankingConsent(e.target.checked)} className="sr-only" />
                <div className="w-5 h-5 rounded flex items-center justify-center transition-all duration-200"
                  style={{ background: bankingConsent ? "linear-gradient(135deg, #14b8a6, #0d9488)" : "rgba(255,255,255,0.05)", border: bankingConsent ? "none" : "1px solid rgba(255,255,255,0.2)" }}>
                  {bankingConsent && <span style={{ color: "white", fontSize: "0.7rem", fontWeight: 900 }}>✓</span>}
                </div>
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                I authorize VibeLink to store my banking information for payout processing purposes, in accordance with the <a href="/legal/privacy" style={{ color: "#14b8a6" }}>Privacy Policy</a>.
              </p>
            </label>

            <div className="flex gap-3">
              <button onClick={() => setStep("identity")} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>Back</button>
              <button onClick={handleSubmit} className="vl-btn-primary flex-1 py-3 text-sm">Submit Application</button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="vl-card p-8 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(20,184,166,0.1)", border: "2px solid rgba(20,184,166,0.3)" }}>
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#14b8a6", borderTopColor: "transparent" }} />
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", fontWeight: 700, color: "white" }}>Submitting Application...</h2>
          </div>
        )}
      </div>
    </div>
  );
}
