/**
 * CRAVR — RequireAuth
 *
 * Route-level auth gate. Wrap any page that requires a signed-in account.
 * Signed-out visitors see a sign-in / register prompt instead of the page,
 * while public browsing (home, profiles, live listings) stays open.
 *
 * Usage in App.tsx:
 *   <Route path="/messages" component={() => <RequireAuth><Messages /></RequireAuth>} />
 */
import { ReactNode } from "react";
import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { Lock, LogIn, UserPlus } from "lucide-react";

interface RequireAuthProps {
  children: ReactNode;
  /** Short label shown in the prompt, e.g. "send messages" or "buy credits". */
  action?: string;
  /** When true, also requires ADMIN role; non-admins get a 404-style screen
   *  so the page stays invisible to regular users (silent admin). */
  admin?: boolean;
}

export function RequireAuth({ children, action, admin }: RequireAuthProps) {
  const { isLoggedIn, user } = useApp();

  // Admin-only pages render as "not found" for anyone who isn't an admin —
  // this keeps the silent admin tooling undiscoverable.
  if (admin && (!isLoggedIn || user?.role !== "ADMIN")) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 700, color: "white" }}>
          404
        </h1>
        <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>Page not found.</p>
        <Link href="/">
          <span className="text-sm mt-4 cursor-pointer underline" style={{ color: "#14b8a6" }}>Return home</span>
        </Link>
      </div>
    );
  }

  if (isLoggedIn) return <>{children}</>;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center vl-card p-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: "rgba(20,184,166,0.1)", border: "2px solid rgba(20,184,166,0.3)" }}>
          <Lock className="w-7 h-7" style={{ color: "#14b8a6" }} />
        </div>

        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", fontWeight: 700, color: "white", marginBottom: "0.5rem" }}>
          Sign in to continue
        </h2>
        <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
          {action
            ? `Create a free account or sign in to ${action}.`
            : "Create a free account or sign in to access this page."}
        </p>

        <div className="space-y-3">
          <Link href="/register">
            <button className="vl-btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-bold">
              <UserPlus className="w-4 h-4" />
              Create Free Account
            </button>
          </Link>
          <Link href="/login">
            <button className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all hover:bg-white/5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RequireAuth;
