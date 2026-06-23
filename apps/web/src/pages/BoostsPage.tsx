import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * CRAVR — /boosts (legacy redirect)
 *
 * The old combined "Plans & Boosts" page was split:
 *   • Memberships  → the unified Store at /credits
 *   • Profile Boosts → the Creator Dashboard (/creator?tab=boosts)
 *
 * This keeps any old links/bookmarks working by sending them to the Store
 * (memberships were the default tab here). Boost-specific links now point
 * straight at the dashboard.
 */
export default function BoostsPage() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/credits", { replace: true });
  }, [navigate]);
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "#14b8a6", borderTopColor: "transparent" }} />
    </div>
  );
}
