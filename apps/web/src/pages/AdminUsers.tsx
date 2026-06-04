/**
 * CRAVR — Admin User Management
 *
 * Search by username or email. Shows status (active, role, age verified,
 * creator approved), with deactivate / reactivate actions. ADMINs are
 * protected from accidental self-modification at the backend.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { admin as adminApi, type AdminUserRow } from "@/lib/api";
import { useApp } from "@/contexts/AppContext";
import {
  Users, Search, Loader2, ArrowLeft, Ban, RotateCcw, Shield,
  CheckCircle, XCircle, AlertTriangle,
} from "lucide-react";

const ROLE_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  MEMBER:    { bg: "rgba(148,163,184,0.15)", fg: "#cbd5e1", label: "Member" },
  CREATOR:   { bg: "rgba(20,184,166,0.15)",  fg: "#5eead4", label: "Creator" },
  MODERATOR: { bg: "rgba(245,158,11,0.15)",  fg: "#fbbf24", label: "Moderator" },
  ADMIN:     { bg: "rgba(212,175,55,0.15)",  fg: "#d4af37", label: "Admin" },
};

export default function AdminUsers() {
  const { showToast } = useApp();
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const search = (query: string) => {
    setLoading(true);
    adminApi.users({ q: query, limit: 50 })
      .then(d => { setUsers(d.users); setTotal(d.total); })
      .catch(() => { setUsers([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  // Initial load + debounced search as user types
  useEffect(() => {
    const t = setTimeout(() => search(q), q ? 350 : 0);
    return () => clearTimeout(t);
  }, [q]);

  const toggleActive = async (u: AdminUserRow) => {
    setActing(u.id);
    try {
      const action = u.isActive ? "deactivate" : "reactivate";
      await adminApi.setUserActive(u.id, action);
      showToast({ title: u.isActive ? "User deactivated" : "User reactivated" });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isActive: !u.isActive } : x));
    } catch {
      showToast({ title: "Action failed", description: "You can't modify admin accounts via this tool.", variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-5xl">
        {/* Header */}
        <Link href="/admin">
          <button className="text-xs flex items-center gap-1.5 mb-3 hover:opacity-80" style={{ color: "rgba(255,255,255,0.45)" }}>
            <ArrowLeft className="w-3 h-3" /> Back to Admin
          </button>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-6 h-6" style={{ color: "#06b6d4" }} />
          <h1 className="text-3xl font-bold text-white">User Management</h1>
        </div>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
          Search any user by username or email. Deactivating revokes all sessions immediately.
        </p>

        {/* Search */}
        <div className="vl-card p-3 mb-5">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 ml-1" style={{ color: "rgba(255,255,255,0.4)" }} />
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search username or email…"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
            {loading && <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#06b6d4" }} />}
          </div>
        </div>

        {/* Results */}
        {users.length === 0 && !loading ? (
          <div className="vl-card p-10 text-center">
            <Users className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              {q ? `No users match "${q}"` : "Loading users…"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
              {total} {total === 1 ? "user" : "users"}{q && ` matching "${q}"`}
            </p>
            <div className="space-y-2">
              {users.map(u => {
                const roleStyle = ROLE_STYLE[u.role] ?? ROLE_STYLE.MEMBER;
                const verified  = u.ageVerification?.status === "VERIFIED";
                const isCreator = !!u.creatorProfile;
                return (
                  <div key={u.id} className="vl-card p-4 flex items-center justify-between gap-3 flex-wrap"
                    style={{ opacity: u.isActive ? 1 : 0.55 }}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: "rgba(20,184,166,0.15)", color: "#14b8a6" }}>
                        {u.username[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-white truncate">@{u.username}</p>
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0"
                            style={{ background: roleStyle.bg, color: roleStyle.fg }}>
                            {roleStyle.label}
                          </span>
                          {!u.isActive && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider"
                              style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                              Suspended
                            </span>
                          )}
                          {isCreator && u.creatorProfile?.isLive && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1"
                              style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {u.email ?? "no email"} · Joined {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-[11px]">
                          <span className="flex items-center gap-1" style={{ color: verified ? "#5eead4" : "rgba(255,255,255,0.35)" }}>
                            {verified ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {verified ? "Age verified" : "Not verified"}
                          </span>
                          {isCreator && (
                            <span className="flex items-center gap-1" style={{ color: u.creatorProfile!.isApproved ? "#5eead4" : "#fbbf24" }}>
                              {u.creatorProfile!.isApproved ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              {u.creatorProfile!.isApproved ? "Creator approved" : "Pending approval"}
                            </span>
                          )}
                          <span style={{ color: "rgba(255,255,255,0.35)" }}>
                            {u.credits.toLocaleString()} credits
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {u.role === "ADMIN" ? (
                        <span className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                          style={{ background: "rgba(212,175,55,0.1)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.25)" }}>
                          <Shield className="w-3.5 h-3.5" /> Protected
                        </span>
                      ) : u.isActive ? (
                        <button onClick={() => toggleActive(u)} disabled={acting === u.id}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
                          {acting === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Ban className="w-3.5 h-3.5" /> Deactivate</>}
                        </button>
                      ) : (
                        <button onClick={() => toggleActive(u)} disabled={acting === u.id}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                          style={{ background: "rgba(20,184,166,0.1)", color: "#14b8a6", border: "1px solid rgba(20,184,166,0.3)" }}>
                          {acting === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><RotateCcw className="w-3.5 h-3.5" /> Reactivate</>}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
