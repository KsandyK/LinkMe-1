/**
 * CRAVR — Report Button + Modal
 *
 * Used wherever a user can report another user/content (profile, stream,
 * messages). Feeds the existing moderation pipeline so reports land in the
 * admin queue at /admin/moderation.
 *
 * Hidden for signed-out visitors (no anonymous reporting). The auth check
 * + 'cannot report yourself' rule are enforced server-side too.
 */
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { moderation as modApi } from "@/lib/api";
import { Flag, X, Loader2, AlertTriangle } from "lucide-react";

type Reason =
  | "harassment" | "illegal_content" | "underage_suspicion" | "spam"
  | "impersonation" | "non_consensual" | "other";

const REASONS: { value: Reason; label: string; desc: string; severe?: boolean }[] = [
  { value: "harassment",         label: "Harassment or bullying",       desc: "Targeted abuse, threats, hate" },
  { value: "non_consensual",     label: "Non-consensual content",        desc: "Content shared without consent",   severe: true },
  { value: "underage_suspicion", label: "Suspected underage",            desc: "User appears under 18",            severe: true },
  { value: "illegal_content",    label: "Illegal content",               desc: "Anything that violates the law",   severe: true },
  { value: "impersonation",      label: "Impersonation",                 desc: "Pretending to be someone else" },
  { value: "spam",               label: "Spam or scam",                  desc: "Promotional, phishing, off-platform solicitation" },
  { value: "other",              label: "Other",                         desc: "Add details below" },
];

interface ReportButtonProps {
  /** The user being reported (omit for content-only reports) */
  reportedUserId?: string;
  /** Optional content classification */
  contentType?: "user" | "profile" | "stream" | "message" | "content";
  /** Optional specific content id */
  contentId?: string;
  /** Display label override (defaults to a small "Report" pill) */
  label?: string;
  /** Variant: small icon-only pill (default) or full button */
  variant?: "pill" | "menu" | "icon";
  className?: string;
}

export function ReportButton({
  reportedUserId, contentType, contentId, label = "Report", variant = "pill", className,
}: ReportButtonProps) {
  const { isLoggedIn, user } = useApp();
  const [open, setOpen] = useState(false);

  // Don't show for signed-out users or self-reports
  if (!isLoggedIn) return null;
  if (reportedUserId && user?.id === reportedUserId) return null;

  const trigger =
    variant === "icon" ? (
      <button
        onClick={() => setOpen(true)}
        className={className ?? "p-2 rounded-lg transition-all hover:bg-white/5"}
        title="Report"
        aria-label="Report"
      >
        <Flag className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
      </button>
    ) : variant === "menu" ? (
      <button
        onClick={() => setOpen(true)}
        className={className ?? "w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium cursor-pointer transition-all hover:bg-white/5"}
        style={{ color: "rgba(255,255,255,0.55)" }}
      >
        <Flag className="w-4 h-4" /> {label}
      </button>
    ) : (
      <button
        onClick={() => setOpen(true)}
        className={className ?? "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-white/5"}
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
      >
        <Flag className="w-3 h-3" /> {label}
      </button>
    );

  return (
    <>
      {trigger}
      {open && (
        <ReportModal
          reportedUserId={reportedUserId}
          contentType={contentType}
          contentId={contentId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

interface ReportModalProps {
  reportedUserId?: string;
  contentType?: "user" | "profile" | "stream" | "message" | "content";
  contentId?: string;
  onClose: () => void;
}

function ReportModal({ reportedUserId, contentType, contentId, onClose }: ReportModalProps) {
  const { showToast } = useApp();
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await modApi.report({
        reportedUserId,
        contentType,
        contentId,
        reason,
        details: details.trim() || undefined,
      });
      setSubmitted(true);
      // Auto-close after a beat so the user sees the confirmation
      setTimeout(() => onClose(), 1800);
    } catch {
      showToast({
        title: "Couldn't submit report",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md vl-card p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4" style={{ color: "#f97316" }} />
            <h3 className="text-base font-bold text-white">Report</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5">
            <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
          </button>
        </div>
        <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
          Our team reviews every report. Critical reports (suspected underage, illegal, non-consensual)
          are escalated immediately.
        </p>

        {submitted ? (
          <div className="py-4 text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.4)" }}>
              <Flag className="w-5 h-5" style={{ color: "#14b8a6" }} />
            </div>
            <p className="text-sm font-bold text-white mb-1">Report submitted</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              Thank you. Our moderation team will review it.
            </p>
          </div>
        ) : (
          <>
            {/* Reason list */}
            <div className="space-y-1.5 mb-4">
              {REASONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className="w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-2.5"
                  style={
                    reason === r.value
                      ? { background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.4)" }
                      : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }
                  }
                >
                  <div className="w-3.5 h-3.5 rounded-full mt-0.5 flex-shrink-0"
                    style={{
                      background: reason === r.value ? "#f97316" : "transparent",
                      border: reason === r.value ? "none" : "1px solid rgba(255,255,255,0.25)",
                    }}>
                    {reason === r.value && <div className="w-1.5 h-1.5 rounded-full bg-white m-auto mt-[3px]" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-white">{r.label}</p>
                      {r.severe && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider"
                          style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                          critical
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Details */}
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Optional — add any details that will help us understand…"
              rows={3}
              maxLength={1000}
              className="vl-input w-full text-sm mb-1"
            />
            <p className="text-[10px] mb-4 text-right" style={{ color: "rgba(255,255,255,0.3)" }}>
              {details.length} / 1000
            </p>

            <div className="rounded-lg p-2.5 mb-4 flex items-start gap-2"
              style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#fbbf24" }} />
              <p className="text-[11px]" style={{ color: "rgba(252,211,77,0.8)", lineHeight: 1.5 }}>
                False or malicious reports are themselves a violation of our Terms.
                Please only report content you genuinely believe breaks our rules.
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={onClose} disabled={submitting}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                Cancel
              </button>
              <button onClick={submit} disabled={!reason || submitting}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                style={{ background: "linear-gradient(135deg, #f97316, #ef4444)", color: "#0a0a14" }}>
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Flag className="w-3.5 h-3.5" /> Submit Report</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ReportButton;
