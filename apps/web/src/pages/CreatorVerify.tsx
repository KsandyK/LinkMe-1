/**
 * CRAVR — Creator Identity Verification
 *
 * Distinct from the member CCBill age-gate. Creators must submit a government
 * ID + selfie (legal requirement for 2257 record-keeping and payouts).
 *
 * Flow: DOB + ID type → upload ID front → upload selfie → submit for review.
 * Documents upload to private Bunny storage; an admin reviews and approves.
 */
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { ageVerify as ageVerifyApi } from "@/lib/api";
import { Shield, Lock, CheckCircle, Upload, Loader2, AlertTriangle, X, ShieldCheck } from "lucide-react";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

type Step = "dob" | "upload";
interface UploadState { file: File | null; preview: string | null; uploading: boolean; done: boolean; error: string | null; }
const emptyUpload = (): UploadState => ({ file: null, preview: null, uploading: false, done: false, error: null });

export default function CreatorVerify() {
  const { ageVerificationStatus, setAgeVerificationStatus, showToast } = useApp();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("dob");
  const [dob, setDob] = useState({ month: "", day: "", year: "" });
  const [idType, setIdType] = useState<"passport" | "drivers_license" | "national_id">("passport");
  const [dobError, setDobError] = useState("");
  const [consent, setConsent] = useState(false);
  const [submittingDob, setSubmittingDob] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [idUp, setIdUp] = useState<UploadState>(emptyUpload());
  const [selfieUp, setSelfieUp] = useState<UploadState>(emptyUpload());
  const idRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  // ── Already verified / under review ────────────────────────────────────────
  if (ageVerificationStatus === "verified") {
    return (
      <CenteredCard icon={<CheckCircle className="w-10 h-10" style={{ color: "#14b8a6" }} />}
        title="Identity Verified" body="Your identity has been confirmed. You can complete your creator application.">
        <button onClick={() => navigate("/become-creator")} className="vl-btn-primary px-6 py-3 text-sm">
          Continue Application
        </button>
      </CenteredCard>
    );
  }
  if (ageVerificationStatus === "pending") {
    return (
      <CenteredCard icon={<ShieldCheck className="w-10 h-10" style={{ color: "#eab308" }} />}
        title="Under Review" body="Your documents were submitted and are being reviewed. This typically takes 1–2 business days — we'll notify you.">
        <button onClick={() => navigate("/")} className="vl-btn-primary px-6 py-3 text-sm">Return Home</button>
      </CenteredCard>
    );
  }

  // ── DOB validation + submit ──────────────────────────────────────────────
  const validateDob = () => {
    const m = +dob.month, d = +dob.day, y = +dob.year;
    if (!m || !d || !y) { setDobError("Enter your complete date of birth."); return false; }
    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > new Date().getFullYear()) { setDobError("Enter a valid date."); return false; }
    const birth = new Date(y, m - 1, d);
    let age = new Date().getFullYear() - birth.getFullYear();
    const md = new Date().getMonth() - birth.getMonth();
    if (md < 0 || (md === 0 && new Date().getDate() < birth.getDate())) age--;
    if (age < 18) { setDobError("You must be at least 18 years old."); return false; }
    setDobError("");
    return true;
  };

  const handleDobNext = async () => {
    if (!validateDob()) return;
    setSubmittingDob(true);
    try {
      const dateOfBirth = `${dob.year.padStart(4, "0")}-${dob.month.padStart(2, "0")}-${dob.day.padStart(2, "0")}`;
      await ageVerifyApi.submit({ documentType: idType, dateOfBirth });
      setStep("upload");
    } catch {
      showToast({ title: "Couldn't start verification", description: "Please try again in a moment.", variant: "destructive" });
    } finally {
      setSubmittingDob(false);
    }
  };

  // ── File upload ────────────────────────────────────────────────────────────
  const doUpload = async (type: "id" | "selfie", file: File, set: React.Dispatch<React.SetStateAction<UploadState>>) => {
    if (!ACCEPTED.includes(file.type)) { set(p => ({ ...p, error: "Only JPEG, PNG, or WebP." })); return; }
    if (file.size > MAX_BYTES) { set(p => ({ ...p, error: "File too large (max 10MB)." })); return; }
    set({ file, preview: URL.createObjectURL(file), uploading: true, done: false, error: null });
    try {
      await ageVerifyApi.uploadDoc(type, file);
      set(p => ({ ...p, uploading: false, done: true }));
    } catch {
      set(p => ({ ...p, uploading: false, done: false, error: "Upload failed — please retry." }));
    }
  };

  const handleSubmit = async () => {
    if (!consent) { showToast({ title: "Consent required", description: "Please consent to identity verification.", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      await ageVerifyApi.confirm();
      setAgeVerificationStatus("pending");
      showToast({ title: "Submitted for review", description: "We'll review your documents within 1–2 business days." });
    } catch {
      showToast({ title: "Submission failed", description: "Both documents must finish uploading first.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = idUp.done && selfieUp.done && consent && !submitting;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #09091a 0%, #0d1a1a 100%)" }}>
      <div className="container py-10 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6", letterSpacing: "0.1em" }}>
            <Shield className="w-3.5 h-3.5" /> CREATOR IDENTITY VERIFICATION
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 700, color: "white" }}>Verify Your Identity</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Required by law before you can publish content or earn. Your documents are encrypted and reviewed privately.
          </p>
        </div>

        {step === "dob" && (
          <div className="vl-card p-6">
            <h2 className="font-bold text-white mb-1">Date of Birth & ID Type</h2>
            <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>You must be 18 or older.</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {([["month", "MM"], ["day", "DD"], ["year", "YYYY"]] as const).map(([k, ph]) => (
                <input key={k} type="number" placeholder={ph} value={dob[k]}
                  onChange={e => setDob(p => ({ ...p, [k]: e.target.value }))} className="vl-input text-center" />
              ))}
            </div>
            {dobError && <div className="vl-warning-box mb-4"><p className="text-xs flex items-center gap-2" style={{ color: "#fca5a5" }}><AlertTriangle className="w-3.5 h-3.5" /> {dobError}</p></div>}
            <label className="block text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>ID type you'll upload</label>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {([["passport", "Passport", "🛂"], ["drivers_license", "License", "🪪"], ["national_id", "National ID", "🆔"]] as const).map(([v, label, icon]) => (
                <button key={v} type="button" onClick={() => setIdType(v)} className="p-3 rounded-xl text-center"
                  style={{ background: idType === v ? "rgba(20,184,166,0.15)" : "rgba(255,255,255,0.03)", border: idType === v ? "1px solid rgba(20,184,166,0.4)" : "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="text-lg mb-0.5">{icon}</div>
                  <div className="text-xs font-semibold" style={{ color: idType === v ? "#14b8a6" : "rgba(255,255,255,0.5)" }}>{label}</div>
                </button>
              ))}
            </div>
            <button onClick={handleDobNext} disabled={submittingDob} className="vl-btn-primary w-full py-3 text-sm disabled:opacity-70">
              {submittingDob ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Continue"}
            </button>
          </div>
        )}

        {step === "upload" && (
          <div className="vl-card p-6">
            <div className="vl-pii-shield mb-5 flex items-start gap-2">
              <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#14b8a6" }} />
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                Documents upload to encrypted private storage. Only a CRAVR compliance reviewer can view them, via a temporary signed link.
              </p>
            </div>

            <UploadArea label="Front of your ID" type="id" upload={idUp} setUpload={setIdUp} inputRef={idRef} onSelect={doUpload} />
            <div className="h-4" />
            <UploadArea label="Selfie holding your ID" type="selfie" upload={selfieUp} setUpload={setSelfieUp} inputRef={selfieRef} onSelect={doUpload} />

            <label className="flex items-start gap-3 my-5 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="sr-only" />
              <div className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center mt-0.5"
                style={{ background: consent ? "linear-gradient(135deg,#14b8a6,#0d9488)" : "rgba(255,255,255,0.05)", border: consent ? "none" : "1px solid rgba(255,255,255,0.2)" }}>
                {consent && <span style={{ color: "white", fontSize: "0.7rem", fontWeight: 900 }}>✓</span>}
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                I consent to identity verification and confirm these documents are mine and authentic. I understand CRAVR retains verification records as required by law (18 U.S.C. § 2257).
              </p>
            </label>

            <button onClick={handleSubmit} disabled={!canSubmit} className="vl-btn-primary w-full py-3 text-sm disabled:opacity-40 flex items-center justify-center gap-2">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                : !idUp.done || !selfieUp.done ? "Upload both documents first"
                : !consent ? "Consent required" : "Submit for Review"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function UploadArea({ label, type, upload, setUpload, inputRef, onSelect }: {
  label: string; type: "id" | "selfie"; upload: UploadState;
  setUpload: React.Dispatch<React.SetStateAction<UploadState>>;
  inputRef: React.RefObject<HTMLInputElement>;
  onSelect: (t: "id" | "selfie", f: File, s: React.Dispatch<React.SetStateAction<UploadState>>) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</label>
        {upload.done && (
          <button onClick={() => { if (upload.preview) URL.revokeObjectURL(upload.preview); setUpload(emptyUpload()); }}
            className="text-xs flex items-center gap-1" style={{ color: "rgba(255,255,255,0.35)" }}><X className="w-3 h-3" /> Replace</button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onSelect(type, f, setUpload); }} />
      <button type="button" onClick={() => !upload.uploading && !upload.done && inputRef.current?.click()}
        disabled={upload.uploading || upload.done}
        className="w-full rounded-xl overflow-hidden"
        style={{ background: upload.done ? "rgba(20,184,166,0.08)" : "rgba(255,255,255,0.03)",
          border: upload.done ? "2px solid rgba(20,184,166,0.4)" : upload.error ? "2px dashed rgba(239,68,68,0.4)" : "2px dashed rgba(255,255,255,0.1)" }}>
        {upload.done && upload.preview ? (
          <div className="relative">
            <img src={upload.preview} alt={label} className="w-full object-cover" style={{ maxHeight: "150px", filter: "blur(4px) brightness(0.6)" }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <CheckCircle className="w-7 h-7" style={{ color: "#14b8a6" }} />
              <span className="text-xs font-semibold mt-1" style={{ color: "#14b8a6" }}>Uploaded</span>
            </div>
          </div>
        ) : upload.uploading ? (
          <div className="p-6 flex flex-col items-center gap-2"><Loader2 className="w-7 h-7 animate-spin" style={{ color: "#14b8a6" }} /><span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Uploading securely…</span></div>
        ) : (
          <div className="p-6 flex flex-col items-center gap-2"><Upload className="w-7 h-7" style={{ color: "rgba(255,255,255,0.25)" }} /><span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Click to upload</span><span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>JPG, PNG, WebP — max 10MB</span></div>
        )}
      </button>
      {upload.error && <p className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: "#f87171" }}><AlertTriangle className="w-3 h-3" /> {upload.error}</p>}
    </div>
  );
}

function CenteredCard({ icon, title, body, children }: { icon: React.ReactNode; title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(20,184,166,0.12)", border: "2px solid rgba(20,184,166,0.4)" }}>{icon}</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", fontWeight: 700, color: "white", marginBottom: "0.5rem" }}>{title}</h2>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{body}</p>
        {children}
      </div>
    </div>
  );
}
