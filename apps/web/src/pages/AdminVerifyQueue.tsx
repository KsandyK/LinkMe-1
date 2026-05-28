/**
 * CRAVR — Admin Age Verification Queue
 * Velvet Dark Design System
 *
 * Admin-only page for reviewing pending age verification submissions.
 * Accessible at /admin/verify-queue — redirects to / for non-admin users.
 *
 * Features:
 *   - List of PENDING / UNDER_REVIEW verifications
 *   - View ID document and selfie (presigned S3 GET URLs, open in new tab)
 *   - Approve with one click
 *   - Reject with optional reason
 *   - Real-time queue refresh
 */
import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { ageVerify as ageVerifyApi, AgeVerifyQueueItem } from "@/lib/api";
import {
  Shield, CheckCircle, XCircle, Eye, RefreshCw, Loader2,
  AlertTriangle, User, Calendar, FileText,
} from "lucide-react";

type ReviewAction = { userId: string; action: "approve" | "reject" } | null;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  UNDER_REVIEW: "#14b8a6",
  VERIFIED: "#22c55e",
  REJECTED: "#ef4444",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: "🛂 Passport",
  drivers_license: "🪪 Driver's License",
  national_id: "🆔 National ID",
};

export default function AdminVerifyQueue() {
  const { user, showToast } = useApp();
  const [, navigate] = useLocation();

  const [queue, setQueue] = useState<AgeVerifyQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewing, setReviewing] = useState<ReviewAction>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null); // userId
  const [viewingDoc, setViewingDoc] = useState<string | null>(null); // loading state for doc view

  // ── Admin guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      navigate("/");
    }
  }, [user, navigate]);

  // ── Load queue ─────────────────────────────────────────────────────────────
  const loadQueue = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const items = await ageVerifyApi.queue();
      setQueue(items);
    } catch {
      showToast({ title: "Error", description: "Could not load verification queue.", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // ── View document (open in new tab via presigned URL) ──────────────────────
  const handleViewDoc = async (userId: string, type: "id" | "selfie") => {
    setViewingDoc(`${userId}-${type}`);
    try {
      const { url } = await ageVerifyApi.viewUrl(userId, type);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      showToast({ title: "Cannot view document", description: "Document may not be uploaded yet or the link expired.", variant: "destructive" });
    } finally {
      setViewingDoc(null);
    }
  };

  // ── Approve ────────────────────────────────────────────────────────────────
  const handleApprove = async (userId: string) => {
    setReviewing({ userId, action: "approve" });
    try {
      await ageVerifyApi.review(userId, { action: "approve" });
      showToast({ title: "✓ Approved", description: "User has been notified and granted full access." });
      setQueue(prev => prev.filter(r => r.userId !== userId));
    } catch {
      showToast({ title: "Error", description: "Could not approve verification.", variant: "destructive" });
    } finally {
      setReviewing(null);
    }
  };

  // ── Reject ─────────────────────────────────────────────────────────────────
  const handleRejectConfirm = async () => {
    if (!showRejectModal) return;
    const userId = showRejectModal;
    setReviewing({ userId, action: "reject" });
    setShowRejectModal(null);
    try {
      await ageVerifyApi.review(userId, {
        action: "reject",
        reason: rejectReason.trim() || "Document not accepted. Please re-submit with a clearer photo.",
      });
      showToast({ title: "Rejected", description: "User has been notified with the rejection reason." });
      setQueue(prev => prev.filter(r => r.userId !== userId));
    } catch {
      showToast({ title: "Error", description: "Could not reject verification.", variant: "destructive" });
    } finally {
      setReviewing(null);
      setRejectReason("");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#14b8a6" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container py-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.3)" }}>
              <Shield className="w-5 h-5" style={{ color: "#14b8a6" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Age Verification Queue</h1>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                {queue.length} pending review{queue.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => loadQueue(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Pending", value: queue.filter(r => r.status === "PENDING").length, color: STATUS_COLORS.PENDING },
            { label: "Under Review", value: queue.filter(r => r.status === "UNDER_REVIEW").length, color: STATUS_COLORS.UNDER_REVIEW },
            { label: "Total in Queue", value: queue.length, color: "rgba(255,255,255,0.6)" },
          ].map(s => (
            <div key={s.label} className="vl-card p-4 text-center">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Queue list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#14b8a6" }} />
          </div>
        ) : queue.length === 0 ? (
          <div className="vl-card p-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "rgba(20,184,166,0.4)" }} />
            <p className="font-semibold text-white mb-1">All caught up!</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              No pending age verifications at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map(item => {
              const isProcessing = reviewing?.userId === item.userId;
              return (
                <div key={item.id} className="vl-card p-5" style={{ opacity: isProcessing ? 0.6 : 1, transition: "opacity 0.2s" }}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* User info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <User className="w-5 h-5" style={{ color: "rgba(255,255,255,0.3)" }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">@{item.user.username}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{
                              background: `${STATUS_COLORS[item.status]}15`,
                              border: `1px solid ${STATUS_COLORS[item.status]}30`,
                              color: STATUS_COLORS[item.status],
                            }}>
                            {item.status.replace("_", " ")}
                          </span>
                        </div>
                        {item.user.email && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                            {item.user.email}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2">
                          <span className="text-xs flex items-center gap-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                            <Calendar className="w-3 h-3" />
                            DOB: {item.dateOfBirth ?? "—"}
                          </span>
                          <span className="text-xs flex items-center gap-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                            <FileText className="w-3 h-3" />
                            {item.documentType ? DOC_TYPE_LABELS[item.documentType] ?? item.documentType : "—"}
                          </span>
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                            Submitted: {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Document upload status */}
                        <div className="flex gap-3 mt-2">
                          <span className="text-xs flex items-center gap-1"
                            style={{ color: item.hasDocument ? "#14b8a6" : "rgba(239,68,68,0.7)" }}>
                            {item.hasDocument ? "✓" : "✗"} ID doc
                          </span>
                          <span className="text-xs flex items-center gap-1"
                            style={{ color: item.hasSelfie ? "#14b8a6" : "rgba(239,68,68,0.7)" }}>
                            {item.hasSelfie ? "✓" : "✗"} Selfie
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                      {/* View document */}
                      {item.hasDocument && (
                        <button
                          onClick={() => handleViewDoc(item.userId, "id")}
                          disabled={viewingDoc === `${item.userId}-id`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-white/5 disabled:opacity-50"
                          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
                          title="View ID document"
                        >
                          {viewingDoc === `${item.userId}-id`
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Eye className="w-3 h-3" />}
                          ID
                        </button>
                      )}
                      {item.hasSelfie && (
                        <button
                          onClick={() => handleViewDoc(item.userId, "selfie")}
                          disabled={viewingDoc === `${item.userId}-selfie`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-white/5 disabled:opacity-50"
                          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
                          title="View selfie"
                        >
                          {viewingDoc === `${item.userId}-selfie`
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Eye className="w-3 h-3" />}
                          Selfie
                        </button>
                      )}

                      {/* Reject */}
                      <button
                        onClick={() => { setRejectReason(""); setShowRejectModal(item.userId); }}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                        style={{
                          background: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.25)",
                          color: "#f87171",
                        }}
                      >
                        {isProcessing && reviewing?.action === "reject"
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <XCircle className="w-3 h-3" />}
                        Reject
                      </button>

                      {/* Approve */}
                      <button
                        onClick={() => handleApprove(item.userId)}
                        disabled={isProcessing || !item.hasDocument || !item.hasSelfie}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: "rgba(20,184,166,0.15)",
                          border: "1px solid rgba(20,184,166,0.3)",
                          color: "#14b8a6",
                        }}
                        title={!item.hasDocument || !item.hasSelfie ? "Both documents must be uploaded before approving" : "Approve verification"}
                      >
                        {isProcessing && reviewing?.action === "approve"
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <CheckCircle className="w-3 h-3" />}
                        Approve
                      </button>
                    </div>
                  </div>

                  {/* Missing docs warning */}
                  {(!item.hasDocument || !item.hasSelfie) && (
                    <div className="mt-3 pt-3 flex items-center gap-2 text-xs"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.05)", color: "#fca5a5" }}>
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      {!item.hasDocument && !item.hasSelfie
                        ? "No documents uploaded yet. User may still be completing the form."
                        : !item.hasDocument
                          ? "ID document not uploaded. Request resubmission before approving."
                          : "Selfie not uploaded. Request resubmission before approving."}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject reason modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowRejectModal(null); }}>
          <div className="vl-card p-6 w-full max-w-md">
            <h3 className="font-bold text-lg text-white mb-1">Reject Verification</h3>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
              Provide a reason for rejection. The user will be notified with this message.
            </p>

            <label className="block text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              Rejection reason (optional)
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Document is blurry, please resubmit with a clearer photo..."
              rows={3}
              className="vl-input w-full resize-none mb-4"
              style={{ fontFamily: "inherit" }}
            />

            <div className="p-3 rounded-xl mb-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-xs" style={{ color: "rgba(252,165,165,0.8)" }}>
                Rejecting will notify the user and allow them to resubmit. Uploaded documents will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
              >
                <XCircle className="w-4 h-4" /> Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
