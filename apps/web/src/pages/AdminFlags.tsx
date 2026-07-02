/**
 * CRAVR — Admin Content Flags
 *
 * Lists unreviewed entries from the ContentFlag table — automated detections
 * (hash match / keyword / ML score) plus mirror-flags created when a critical
 * priority-2 report is filed. Action: mark reviewed.
 *
 * NOTE: no automated detection pipeline is wired yet. Flags today come only
 * from priority-2 report mirrors. A clear notice tells admins this.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { admin as adminApi } from "@/lib/api";
import { useApp } from "@/contexts/AppContext";
import { FileWarning, ArrowLeft, CheckCircle, Loader2, AlertTriangle } from "lucide-react";

type Flag = {
  id: string; contentType: string; contentId: string;
  flagType: string; confidence: number;
  metadata: Record<string, unknown> | null;
  reviewed: boolean; createdAt: string;
};

const FLAG_TYPE_LABEL: Record<string, string> = {
  hash_match: "Hash match",
  keyword:    "Keyword filter",
  ml_score:   "ML score",
  report:     "Report mirror",
};

function ago(iso: string) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60)     return `${s}s ago`;
  if (s < 3600)   return `${Math.floor(s / 60)}m ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function AdminFlags() {
  const { showToast } = useApp();
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    adminApi.flags()
      .then(setFlags)
      .catch(() => setFlags([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const markReviewed = async (id: string) => {
    setActing(id);
    try {
      await adminApi.reviewFlag(id);
      showToast({ title: "Flag dismissed" });
      setFlags(prev => prev.filter(f => f.id !== id));
    } catch {
      showToast({ title: "Couldn't update flag", variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-5xl">
        <Link href="/admin">
          <button className="text-xs flex items-center gap-1.5 mb-3 hover:opacity-80" style={{ color: "rgba(255,255,255,0.45)" }}>
            <ArrowLeft className="w-3 h-3" /> Back to Admin
          </button>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <FileWarning className="w-6 h-6" style={{ color: "#8b5cf6" }} />
          <h1 className="text-3xl font-bold text-white">Content Flags</h1>
        </div>
        <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>
          Automated and high-priority report mirrors. Review and dismiss after action.
        </p>

        {/* Pipeline status — honest note about what's actually feeding this queue */}
        <div className="vl-card p-3 mb-5 flex items-start gap-2"
          style={{ background: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.25)" }}>
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#fbbf24" }} />
          <p className="text-[11px]" style={{ color: "rgba(252,211,77,0.85)", lineHeight: 1.5 }}>
            <strong>Pipeline status:</strong> automated detection (hash match, keyword, ML) is not yet wired.
            Flags here currently come only from <strong>priority-2 reports</strong> (suspected underage,
            illegal, non-consensual). Connecting a detection service is a separate build.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#8b5cf6" }} /></div>
        ) : flags.length === 0 ? (
          <div className="vl-card p-10 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(20,184,166,0.6)" }} />
            <p className="text-sm font-bold text-white mb-1">All caught up</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>No unreviewed content flags.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {flags.map(f => (
              <div key={f.id} className="vl-card p-4"
                style={{ borderColor: f.confidence >= 0.9 ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)" }}>
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                      style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.4)" }}>
                      {FLAG_TYPE_LABEL[f.flagType] ?? f.flagType}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: f.confidence >= 0.9 ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)", color: f.confidence >= 0.9 ? "#f87171" : "rgba(255,255,255,0.6)" }}>
                      {(f.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{ago(f.createdAt)}</span>
                </div>
                <p className="text-sm text-white">
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>Content:</span>{" "}
                  <code className="text-xs" style={{ color: "#5eead4" }}>{f.contentType} / {f.contentId}</code>
                </p>
                {f.metadata && Object.keys(f.metadata).length > 0 && (
                  <pre className="text-[11px] font-mono mt-2 p-2 rounded overflow-x-auto"
                    style={{ background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.6)", maxHeight: "120px" }}>
                    {JSON.stringify(f.metadata, null, 2)}
                  </pre>
                )}
                <div className="flex gap-2 mt-3">
                  {f.flagType === "report" && f.metadata && typeof (f.metadata as Record<string, unknown>).reportId === "string" && (
                    <Link href="/admin/moderation">
                      <button className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ background: "rgba(249,115,22,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }}>
                        Open related report →
                      </button>
                    </Link>
                  )}
                  <button onClick={() => markReviewed(f.id)} disabled={acting === f.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                    style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {acting === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle className="w-3.5 h-3.5" /> Mark reviewed</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
