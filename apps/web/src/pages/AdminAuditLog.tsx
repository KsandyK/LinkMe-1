/**
 * CRAVR — Admin Audit Log
 *
 * Read-only feed of every administrative action recorded by audit.ts.
 * Filter by action type to focus on (e.g.) all verification approvals or
 * all user deactivations.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { admin as adminApi } from "@/lib/api";
import { ScrollText, ArrowLeft, Loader2, RefreshCw, Shield, ShieldCheck, Flag, Ban, RotateCcw, AlertTriangle } from "lucide-react";

type LogEntry = {
  id: string; adminId: string; adminUsername: string;
  actionType: string; targetType: string; targetId: string;
  targetLabel: string | null; metadata: Record<string, unknown> | null;
  createdAt: string;
};

const ACTION_FILTERS = [
  { key: "",                  label: "All actions" },
  { key: "verify_approve",    label: "Verify · Approve" },
  { key: "verify_reject",     label: "Verify · Reject" },
  { key: "user_deactivate",   label: "User · Deactivate" },
  { key: "user_reactivate",   label: "User · Reactivate" },
  { key: "report_resolve",    label: "Report · Resolve" },
  { key: "report_dismiss",    label: "Report · Dismiss" },
];

function actionStyle(actionType: string) {
  if (actionType.startsWith("verify_approve") || actionType.endsWith("_reactivate"))
    return { icon: ShieldCheck, color: "#14b8a6" };
  if (actionType.startsWith("verify_reject") || actionType.endsWith("_deactivate"))
    return { icon: Ban, color: "#f87171" };
  if (actionType.startsWith("report_resolve")) return { icon: Shield,    color: "#f97316" };
  if (actionType.startsWith("report_dismiss")) return { icon: Flag,      color: "#94a3b8" };
  if (actionType.startsWith("user_reactivate")) return { icon: RotateCcw, color: "#14b8a6" };
  return { icon: ScrollText, color: "rgba(255,255,255,0.5)" };
}

function ago(iso: string) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60)     return `${s}s ago`;
  if (s < 3600)   return `${Math.floor(s / 60)}m ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleString();
}

export default function AdminAuditLog() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionType, setActionType] = useState("");

  const load = () => {
    setLoading(true);
    adminApi.auditLog({ actionType: actionType || undefined, limit: 100 })
      .then(d => { setEntries(d.entries); setTotal(d.total); })
      .catch(() => { setEntries([]); setTotal(0); })
      .finally(() => setLoading(false));
  };
  useEffect(load, [actionType]); // eslint-disable-line react-hooks/exhaustive-deps

  const labelFor = (e: LogEntry): string => {
    const human = e.actionType.replace(/_/g, " ");
    return human.charAt(0).toUpperCase() + human.slice(1);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-5xl">
        <Link href="/admin">
          <button className="text-xs flex items-center gap-1.5 mb-3 hover:opacity-80" style={{ color: "rgba(255,255,255,0.45)" }}>
            <ArrowLeft className="w-3 h-3" /> Back to Admin
          </button>
        </Link>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <ScrollText className="w-6 h-6" style={{ color: "#a78bfa" }} />
            <h1 className="text-3xl font-bold text-white">Audit Log</h1>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-white/5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
        <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>
          Every administrative action is recorded here. Tamper-evident: no edits, no deletes.
          Critical for 2257 / regulator audits.
        </p>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {ACTION_FILTERS.map(f => (
            <button key={f.key} onClick={() => setActionType(f.key)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
              style={actionType === f.key
                ? { background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.4)" }
                : { background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }
              }>
              {f.label}
            </button>
          ))}
        </div>

        {loading && entries.length === 0 ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#a78bfa" }} /></div>
        ) : entries.length === 0 ? (
          <div className="vl-card p-10 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              No actions recorded {actionType ? "for this filter" : "yet"}.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
              Showing {entries.length} of {total}
            </p>
            <div className="vl-card divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {entries.map(e => {
                const s = actionStyle(e.actionType);
                const I = s.icon;
                return (
                  <div key={e.id} className="flex items-start gap-3 p-3.5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                      <I className="w-4 h-4" style={{ color: s.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        <strong>@{e.adminUsername}</strong>{" "}
                        <span style={{ color: s.color }}>{labelFor(e)}</span>
                        {e.targetLabel && <> · <span className="font-mono" style={{ color: "rgba(255,255,255,0.6)" }}>{e.targetLabel}</span></>}
                      </p>
                      {e.metadata && Object.keys(e.metadata).length > 0 && (
                        <p className="text-[11px] mt-1 font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {JSON.stringify(e.metadata)}
                        </p>
                      )}
                      <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {ago(e.createdAt)} · target: {e.targetType} {e.targetId.slice(0, 8)}…
                      </p>
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
