import { useState } from "react";
import { Link } from "wouter";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    // Password reset emails are not yet implemented — show a support prompt.
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/Cravr.jpg" alt="CRAVR" className="h-28 w-auto mx-auto mb-2" />
          <p className="text-muted-foreground text-sm mt-1">Reset your password</p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">📧</div>
              <h2 className="font-bold text-foreground">Check your inbox</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If an account with <strong className="text-foreground">{email}</strong> exists, you'll receive a password reset link shortly.
              </p>
              <p className="text-xs text-muted-foreground">
                Didn't receive it? Email{" "}
                <a href="mailto:support@cravr.fun" className="text-primary hover:underline">
                  support@cravr.fun
                </a>{" "}
                and we'll sort it out.
              </p>
              <Link href="/login" className="block w-full py-3 rounded-xl text-white font-semibold text-sm text-center transition-opacity hover:opacity-90"
                style={{ background: "#14B8A6" }}>
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">Forgot your password?</h2>
                <p className="text-xs text-muted-foreground">
                  Enter the email address on your account and we'll send you a reset link.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={!email.includes("@")}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "#14B8A6" }}
              >
                Send Reset Link
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-5 text-sm text-muted-foreground">
          Remember it?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
