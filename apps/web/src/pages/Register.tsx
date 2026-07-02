import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { auth as authApi } from "@/lib/api";

type Step = "account" | "profile" | "preferences" | "done";

const INTERESTS = [
  "Dating", "Friendship", "Live Streams", "Deep Conversations",
  "Music", "Fitness", "Travel", "Art", "Gaming", "Food & Dining",
  "Fashion", "Movies", "Books", "Outdoor Activities", "Nightlife",
  "Cooking", "Photography", "Wellness", "Tech", "Sports",
];

const LOOKING_FOR = [
  "Casual Dating", "Serious Relationship", "Friendship", "Live Interaction",
  "Creator Fandom", "Open Exploration",
];

export default function Register() {
  const { login } = useApp();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("account");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    age: "",
    location: "",
    bio: "",
    interests: [] as string[],
    lookingFor: [] as string[],
    agreeTerms: false,
    agreeAge: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPass, setShowPass] = useState(false);

  const toggleInterest = (item: string, field: "interests" | "lookingFor") => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(item)
        ? f[field].filter(i => i !== item)
        : [...f[field], item],
    }));
  };

  // Obvious fake / disposable domains blocked instantly client-side (offline-safe);
  // the backend MX check is the authoritative backstop.
  const BLOCKED_EMAIL_DOMAINS = new Set([
    "test.com", "test.test", "example.com", "example.org", "example.net",
    "domain.com", "email.com", "fake.com", "fakemail.com", "mailinator.com",
    "guerrillamail.com", "10minutemail.com", "tempmail.com", "temp-mail.org",
    "yopmail.com", "trashmail.com", "throwaway.email", "getnada.com",
    "sharklasers.com", "maildrop.cc", "dispostable.com", "fakeinbox.com",
  ]);
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const validateAccount = () => {
    const errs: Record<string, string> = {};
    if (!EMAIL_RE.test(form.email.trim())) {
      errs.email = "Enter a valid email address";
    } else if (BLOCKED_EMAIL_DOMAINS.has(form.email.trim().split("@")[1].toLowerCase())) {
      errs.email = "Please use a real, non-disposable email address";
    }
    if (form.username.length < 3) errs.username = "Username must be at least 3 characters";
    if (/\s/.test(form.username)) errs.username = "Username cannot contain spaces";
    if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (!form.agreeTerms) errs.agreeTerms = "You must agree to the Terms of Service";
    if (!form.agreeAge) errs.agreeAge = "You must confirm you are 18 or older";
    return errs;
  };

  const validateProfile = () => {
    const errs: Record<string, string> = {};
    if (!form.displayName.trim()) errs.displayName = "Display name is required";
    if (!form.age || parseInt(form.age) < 18) errs.age = "You must be 18 or older";
    if (parseInt(form.age) > 99) errs.age = "Please enter a valid age";
    return errs;
  };

  const handleNext = async () => {
    if (step === "account") {
      const errs = validateAccount();
      if (Object.keys(errs).length) { setErrors(errs); return; }
      // Server-side domain check (MX records). Skipped silently if API offline.
      setSubmitting(true);
      let emailReason = "";
      try {
        const r = await authApi.checkEmail(form.email.trim());
        if (!r.ok) emailReason = r.reason ?? "Please use a valid email address";
      } catch {
        // API unreachable — allow through; backend register still enforces on submit
      }
      setSubmitting(false);
      if (emailReason) { setErrors({ email: emailReason }); return; }
      setErrors({});
      setStep("profile");
    } else if (step === "profile") {
      const errs = validateProfile();
      if (Object.keys(errs).length) { setErrors(errs); return; }
      setErrors({});
      setStep("preferences");
    } else if (step === "preferences") {
      setSubmitting(true);
      // Try API registration; swallow any error — demo mode kicks in via login() below
      try {
        await authApi.register({
          username: form.username,
          email: form.email || undefined,
          password: form.password,
          displayName: form.displayName.trim() || undefined,
          location: form.location.trim() || undefined,
          bio: form.bio.trim() || undefined,
        });
      } catch {
        // API offline or registration error — login() below will try to authenticate
        // or fall through to demo mode on network failures
      }
      // Authenticate — login() re-throws if the API rejected the credentials (e.g.
      // username was taken and registration silently failed). Demo mode on network errors.
      try {
        await login(form.username, form.password);
      } catch {
        // Registration likely failed (username taken) — go back to step 1 with error
        setErrors({ username: "Username or email already taken. Please choose another." });
        setStep("account");
        setSubmitting(false);
        return;
      }
      // Credits are granted server-side (250 on register) — no local addCredits needed
      setStep("done");
      setSubmitting(false);
    }
  };

  const STEPS: { id: Step; label: string; num: number }[] = [
    { id: "account", label: "Account", num: 1 },
    { id: "profile", label: "Profile", num: 2 },
    { id: "preferences", label: "Preferences", num: 3 },
    { id: "done", label: "Welcome", num: 4 },
  ];
  const currentStepIdx = STEPS.findIndex(s => s.id === step);

  if (step === "done") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="text-3xl font-black text-foreground mb-3">Welcome to CRAVR!</h1>
          <p className="text-muted-foreground mb-2">
            Your account <span className="text-primary font-bold">@{form.username}</span> is ready.
          </p>
          <div className="my-6 p-4 rounded-xl border border-primary/30 bg-primary/10">
            <p className="text-primary font-bold text-lg">You're all set! 🎉</p>
            <p className="text-muted-foreground text-sm mt-1">Add credits to unlock content, message creators, and verify your age — all in one step.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { icon: "👤", label: "Browse Profiles", href: "/profiles" },
              { icon: "📺", label: "Watch Live", href: "/live" },
              { icon: "💬", label: "Send Messages", href: "/messages" },
              { icon: "💰", label: "Get Credits", href: "/credits" },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary transition-colors">
                <span className="text-2xl">{l.icon}</span>
                <span className="text-xs text-foreground font-medium">{l.label}</span>
              </Link>
            ))}
          </div>
          <Link href="/" className="block w-full py-3 rounded-xl text-white font-semibold text-sm"
            style={{ background: "#14B8A6" }}>
            Start Exploring →
          </Link>
          <p className="mt-4 text-xs text-muted-foreground">
            Want to earn from content?{" "}
            <Link href="/become-creator" className="text-primary hover:underline">Become a Cravr</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/Cravr.jpg" alt="CRAVR" className="h-28 w-auto mx-auto mb-2" />
          <p className="text-muted-foreground text-sm mt-1">Create your free member account</p>
        </div>

        {/* Step progress */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.filter(s => s.id !== "done").map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  currentStepIdx >= i
                    ? "text-white border-primary"
                    : "text-muted-foreground border-border"
                }`} style={currentStepIdx >= i ? { background: "#14B8A6", borderColor: "#14B8A6" } : {}}>
                  {currentStepIdx > i ? "✓" : s.num}
                </div>
                <span className={`text-xs mt-1 ${currentStepIdx >= i ? "text-primary" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${currentStepIdx > i ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card">
          {/* Step 1: Account */}
          {step === "account" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground mb-4">Create Account</h2>

              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-xs text-destructive">
                🔞 CRAVR is for adults 18+ only. You must confirm your age below.
              </div>

              <Field label="Email Address" error={errors.email}>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  type="email" placeholder="you@email.com"
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
              </Field>

              <Field label="Username" error={errors.username}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "") }))}
                    placeholder="your_username"
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
                </div>
              </Field>

              <Field label="Password" error={errors.password}>
                <div className="relative">
                  <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    type={showPass ? "text" : "password"} placeholder="Min. 8 characters"
                    className="w-full px-4 py-2.5 pr-10 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
              </Field>

              <Field label="Confirm Password" error={errors.confirmPassword}>
                <input value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  type="password" placeholder="Re-enter password"
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
              </Field>

              <div className="space-y-3 pt-2">
                <CheckboxField
                  id="agreeAge"
                  checked={form.agreeAge}
                  onChange={v => setForm(f => ({ ...f, agreeAge: v }))}
                  error={errors.agreeAge}
                  label={<>I confirm I am <strong>18 years of age or older</strong></>}
                />
                <CheckboxField
                  id="agreeTerms"
                  checked={form.agreeTerms}
                  onChange={v => setForm(f => ({ ...f, agreeTerms: v }))}
                  error={errors.agreeTerms}
                  label={
                    <>I agree to the{" "}
                      <Link href="/legal/terms" className="text-primary hover:underline">Terms of Service</Link>
                      {" "}and{" "}
                      <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                    </>
                  }
                />
              </div>
            </div>
          )}

          {/* Step 2: Profile */}
          {step === "profile" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground mb-4">Your Profile</h2>

              <Field label="Display Name" error={errors.displayName}>
                <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="How you'll appear to others"
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
              </Field>

              <Field label="Age" error={errors.age}>
                <input value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value.replace(/\D/g, "") }))}
                  placeholder="Your age" type="number" min="18" max="99"
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
              </Field>

              <Field label="Location (optional)">
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="City, State"
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
              </Field>

              <Field label="Bio (optional)">
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell others a little about yourself..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary resize-none" />
              </Field>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === "preferences" && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-foreground mb-1">Your Preferences</h2>
              <p className="text-muted-foreground text-sm mb-4">Help us personalize your experience.</p>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">I'm looking for</p>
                <div className="flex flex-wrap gap-2">
                  {LOOKING_FOR.map(item => (
                    <button key={item} onClick={() => toggleInterest(item, "lookingFor")}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                        form.lookingFor.includes(item)
                          ? "text-white border-primary"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                      style={form.lookingFor.includes(item) ? { background: "#14B8A6" } : {}}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">My interests</p>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(item => (
                    <button key={item} onClick={() => toggleInterest(item, "interests")}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                        form.interests.includes(item)
                          ? "text-white border-primary"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                      style={form.interests.includes(item) ? { background: "#14B8A6", borderColor: "#14B8A6" } : {}}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                <p className="text-primary font-semibold text-sm">🎁 Welcome Bonus</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Complete registration and receive <strong className="text-foreground">250 free credits</strong> to start exploring!
                </p>
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex gap-3 mt-4">
            {step !== "account" && (
              <button
                onClick={() => setStep(step === "preferences" ? "profile" : "account")}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl border border-border text-muted-foreground text-sm hover:text-foreground transition-colors disabled:opacity-50">
                ← Back
              </button>
            )}
            <button onClick={handleNext}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-70"
              style={{ background: "#14B8A6" }}>
              {submitting ? "Creating account…" : step === "preferences" ? "Create Account 🎉" : "Continue →"}
            </button>
          </div>
        </div>

        <p className="text-center mt-5 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label, error, children,
}: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
}

function CheckboxField({
  id, checked, onChange, label, error,
}: {
  id: string; checked: boolean; onChange: (v: boolean) => void;
  label: React.ReactNode; error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-2 cursor-pointer">
        <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-teal-500" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </label>
      {error && <p className="text-destructive text-xs mt-1 ml-6">{error}</p>}
    </div>
  );
}
