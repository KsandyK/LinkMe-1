import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login, isLoggedIn } = useApp();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Already logged in — redirect home
  if (isLoggedIn) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) return;
    setLoading(true);
    try {
      await login(form.username.trim(), form.password);
    } catch {
      // login() handles all errors internally — falls through to demo mode and never re-throws
    } finally {
      setLoading(false);
    }
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/cravr-icon.png" alt="CRAVR" className="w-14 h-14 mx-auto mb-3" />
          <h1 className="text-3xl font-black" style={{ color: "#14B8A6" }}>CRAVR</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-border bg-card space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Username or Email
            </label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="your_username"
              autoComplete="username"
              required
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Your password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-2.5 pr-10 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !form.username.trim() || !form.password}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "#14B8A6" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-5 text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
