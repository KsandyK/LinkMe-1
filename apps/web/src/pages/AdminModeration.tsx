/**
 * CRAVR — Admin Moderation Reports
 *
 * Lists user-submitted reports with filter tabs (PENDING / UNDER_REVIEW /
 * RESOLVED / DISMISSED), priority indicators, and inline actions
 * (resolve with action, dismiss, deactivate reported user).
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { moderation as modApi, type ModerationReport } from "@/lib/api";
import { useApp } from "@/contexts/AppContext";
import {
  Flag, AlertTriangle, ShieldCheck, Ban, ArrowLeft, Loader2,
  CheckCircle, XCircle, MessageSquareWarning,
} from "lucide-react";

type TabKey = "PENDING" | "UNDER_REVIEW" | "RESOLVED_ACTION" | "RESOLVED_NO_ACTION" | "DISMISSED";
const TABS: { key: TabKey; label: string }[] = [
  { key: "PENDING",             label: "Open" },
  { key: "UNDER_REVIEW",        label: "Under Review" },
  { key: "RESOLVED_ACTION",     label: "Resolved (Action)" },
  { key: "RESOLVED_NO_ACTION",  label: "Resolved (No Action)" },
  { key: "DISMISSED",           label: "Dismissed" },
];

const REASON_LABEL: Record<string, string> = {
  harassment:           "Harassment",
  illegal_content:      "Illegal content",
  underage_suspicion:   "Suspected underage",
  spam:                 "Spam",
  other:                "Other",
};
const PRIORITY_LABEL: Record<number, { label: string; color: string }> = {
  0: { label: "Normal",   color: "#94a3b8" },
  1: { label: "High",     color: "#f59e0b" },
  2: { label: "Critical", color: "#ef4444" },
};

export default function AdminModeration() {
  const { showToast } = useApp();
  const [tab, setTab] = useState<TabKey>("PENDING");
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [resolveModal, setResolveModal] = useState<ModerationReport | null>(null);

  const load = (s: TabKey = tab) => {
    setLoading(true);
    modApi.reports(s, 1, 50)
      .then(d => { setReports(d.reports); setTotal(d.total); })
      .catch(() => { setReports([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(tab); /* eslint-disable-next-line */ }, [tab]);

  const doResolve = async (
    id: string,
    action: "RESOLVED_ACTION" | "RESOLVED_NO_ACTION" | "DISMISSED",
    resolution?: string,
    enforce?: { banUser?: boolean; warnUser?: boolean },
  ) => {
    setActing(id);
    try {
      await modApi.resolve(id, { action, resolution, enforce });
      showToast({ title: "Report updated" });
      setResolveModal(null);
      load();
    } catch {
      showToast({ title: "Couldn't update report", description: "Please retry.", variant: "destructive" });
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
          <Flag className="w-6 h-6" style={{ color: "#f97316" }} />
          <h1 className="text-3xl font-bold text-white">Moderation Reports</h1>
        </div>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
          Review user-submitted reports. Critical (priority 2) cases appear first within each list.
        </p>

        {/* Tabs */}
        <div className="overflow-x-auto pb-1 -mx-4 px-4 mb-5">
          <div className="flex gap-1 vl-card p-1.5 w-fit min-w-full sm:min-w-0">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
                style={tab === t.key
                  ? { background: "rgba(249,115,22,0.15)", color: "#f97316" }
                  : { color: "rgba(255,255,255,0.45)" }
                }>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#f97316" }} /></div>
        ) : reports.length === 0 ? (
          <div className="vl-card p-10 text-center">
            <Flag className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              No reports in <strong>{TABS.find(t => t.key === tab)?.label}</strong>.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
              {total} {total === 1 ? "report" : "reports"}
            </p>
            <div className="space-y-3">
              {reports.map(r => {
                const prio = PRIORITY_LABEL[r.priority] ?? PRIORITY_LABEL[0];
                const open = tab === "PENDING" || tab === "UNDER_REVIEW";
                return (
                  <div key={r.id} className="vl-card p-4"
                    style={{ borderColor: r.priority === 2 ? "rgba(239,68,68,0.35)" : undefined }}>
                    <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                          style={{ background: `${prio.color}22`, color: prio.color, border: `1px solid ${prio.color}55` }}>
                          {prio.label}
                        </span>
                        <span className="text-sm font-bold text-white">{REASON_LABEL[r.reason] ?? r.reason}</span>
                      </div>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {new Date(r.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                      <div>
                        <p style={{ color: "rgba(255,255,255,0.4)" }}>Reported by</p>
                        <p className="text-white font-mono">@{r.reporter.username}</p>
                      </div>
                      <div>
                        <p style={{ color: "rgba(255,255,255,0.4)" }}>Reported</p>
                        <p className="text-white font-mono">
                          {r.reportedUser ? `@${r.reportedUser.username}` : "Content only"}
                          {r.reportedUser && r.reportedUser.role !== "MEMBER" && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-bold"
                              style={{ background: "rgba(20,184,166,0.15)", color: "#5eead4" }}>
                              {r.reportedUser.role}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {(r.contentType || r.contentId) && (
                      <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
                        Content: <code style={{ color: "#5eead4" }}>{r.contentType ?? "—"} / {r.contentId ?? "—"}</code>
                      </p>
                    )}

                    {r.details && (
                      <div className="rounded-lg p-3 mb-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="text-xs whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{r.details}</p>
                      </div>
                    )}

                    {!open && r.resolvedAt && (
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        Resolved {new Date(r.resolvedAt).toLocaleString()}
                      </p>
                    )}

                    {open && (
                      <div className="flex gap-2 flex-wrap pt-2">
                        <button onClick={() => setResolveModal(r)} disabled={acting === r.id}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                          style={{ background: "rgba(20,184,166,0.12)", color: "#14b8a6", border: "1px solid rgba(20,184,166,0.35)" }}>
                          <ShieldCheck className="w-3.5 h-3.5" /> Resolve
                        </button>
                        <button onClick={() => doResolve(r.id, "DISMISSED", "Dismissed by moderator")} disabled={acting === r.id}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                          style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                          <XCircle className="w-3.5 h-3.5" /> Dismiss
                        </button>
                        {acting === r.id && <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#f97316" }} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Resolve modal */}
      {resolveModal && (
        <ResolveModal
          report={resolveModal}
          acting={acting === resolveModal.id}
          onClose={() => setResolveModal(null)}
          onSubmit={(action, resolution, enforce) => doResolve(resolveModal.id, action, resolution, enforce)}
        />
      )}
    </div>
  );
}

function ResolveModal({ report, acting, onClose, onSubmit }: {
  report: ModerationReport;
  acting: boolean;
  onClose: () => void;
  onSubmit: (
    action: "RESOLVED_ACTION" | "RESOLVED_NO_ACTION",
    resolution: string,
    enforce: { banUser?: boolean; warnUser?: boolean },
  ) => void;
}) {
  const [resolution, setResolution] = useState("");
  const [warn, setWarn] = useState(false);
  const [ban,  setBan]  = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md vl-card p-5">
        <h3 className="text-base font-bold text-white mb-1">Resolve report</h3>
        <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
          Against {report.reportedUser ? <strong>@{report.reportedUser.username}</strong> : "content"} — {REASON_LABEL[report.reason] ?? report.reason}
        </p>

        <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
          Notes (visible only to staff)
        </label>
        <textarea
          value={resolution}
          onChange={e => setResolution(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="What did you find? What action did you take?"
          className="vl-input w-full mb-4 text-sm"
        />

        {report.reportedUser && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Enforcement</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={warn} onChange={e => setWarn(e.target.checked)} className="accent-yellow-500" />
              <MessageSquareWarning className="w-3.5 h-3.5" style={{ color: "#fbbf24" }} />
              <span className="text-xs text-white">Send warning notification</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={ban} onChange={e => setBan(e.target.checked)} className="accent-red-500" />
              <Ban className="w-3.5 h-3.5" style={{ color: "#f87171" }} />
              <span className="text-xs text-white">Deactivate account &amp; revoke sessions</span>
            </label>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} disabled={acting}
            className="flex-1 py-2 rounded-lg text-xs font-semibold"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
            Cancel
          </button>
          <button
            onClick={() => onSubmit("RESOLVED_NO_ACTION", resolution || "No action taken", { warnUser: warn, banUser: ban })}
            disabled={acting || ban || warn}
            className="flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <CheckCircle className="w-3.5 h-3.5" /> No Action
          </button>
          <button
            onClick={() => onSubmit("RESOLVED_ACTION", resolution || "Action taken", { warnUser: warn, banUser: ban })}
            disabled={acting}
            className="flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
            style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", color: "#0a0a14" }}>
            {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><ShieldCheck className="w-3.5 h-3.5" /> Resolve</>}
          </button>
        </div>
      </div>
    </div>
  );
}
