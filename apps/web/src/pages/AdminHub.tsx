/**
 * CRAVR — Admin Hub (mission control)
 *
 * Real-time platform health + every staff queue in one view.
 * - Top: 4 key metric cards (users, creators, live, revenue)
 * - Middle: queue tiles with live pending counts
 * - Bottom: recent activity feed (registrations, creator applications, reports)
 *
 * Auto-refreshes every 30s. Gated by RequireAuth admin at the route level.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { admin as adminApi, type AdminOverview } from "@/lib/api";
import {
  Shield, ShieldCheck, Flag, Users, Radio, DollarSign, ChevronRight,
  AlertTriangle, Loader2, UserPlus, Sparkles, Banknote, FileWarning, RefreshCw, Search, ScrollText,
} from "lucide-react";

function pct(n: number, of: number) { return of === 0 ? 0 : Math.round((n / of) * 100); }
const ago = (iso: string) => {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60)        return `${s}s ago`;
  if (s < 3600)      return `${Math.floor(s / 60)}m ago`;
  if (s < 86_400)    return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86_400)}d ago`;
};

export default function AdminHub() {
  const { user } = useApp();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    adminApi.overview()
      .then(d => { setData(d); setError(null); setRefreshedAt(new Date()); })
      .catch(() => setError("Couldn't load admin overview"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), 30_000); // refresh every 30s
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Shield className="w-6 h-6" style={{ color: "#d4af37" }} />
              <h1 className="text-3xl font-bold text-white">Admin</h1>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.4)" }}>
                Live
              </span>
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Signed in as <strong style={{ color: "rgba(255,255,255,0.7)" }}>@{user?.username}</strong>
              {refreshedAt && <> · last refresh {ago(refreshedAt.toISOString())}</>}
            </p>
          </div>
          <button onClick={() => load()} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {error && (
          <div className="vl-card p-4 mb-5" style={{ borderColor: "rgba(239,68,68,0.3)" }}>
            <p className="text-sm flex items-center gap-2" style={{ color: "#f87171" }}>
              <AlertTriangle className="w-4 h-4" /> {error}
            </p>
          </div>
        )}

        {loading && !data ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#d4af37" }} />
          </div>
        ) : data ? (
          <>
            {/* ── Top metric row ────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard
                icon={Users} color="#14b8a6"
                label="Members"
                value={data.users.total.toLocaleString()}
                sub={`${data.users.active.toLocaleString()} active · +${data.users.newToday} today`}
              />
              <MetricCard
                icon={Sparkles} color="#a78bfa"
                label="Creators"
                value={data.creators.total.toLocaleString()}
                sub={`${data.creators.pending} pending approval`}
              />
              <MetricCard
                icon={Radio} color="#ef4444"
                label="Live Now"
                value={data.creators.liveNow.toString()}
                sub={data.creators.liveNow > 0 ? "broadcasting" : "no active streams"}
                pulse={data.creators.liveNow > 0}
              />
              <MetricCard
                icon={DollarSign} color="#f59e0b"
                label="Revenue Today"
                value={`$${data.revenue.today.toFixed(2)}`}
                sub={`$${data.revenue.last30d.toLocaleString(undefined, { maximumFractionDigits: 0 })}/30d · ${data.revenue.transactionsToday} tx today`}
              />
            </div>

            {/* ── Queues row ─────────────────────────────────────────────────── */}
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              Action Queues
              <span className="text-xs font-normal" style={{ color: "rgba(255,255,255,0.35)" }}>
                · {data.queues.verificationPending + data.queues.moderationOpen + data.queues.contentFlagsPending} items need attention
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-7">
              <QueueTile
                href="/admin/verify-queue"
                icon={ShieldCheck}
                title="Identity Verification"
                desc="Review government ID + selfie submissions"
                count={data.queues.verificationPending}
                color="#14b8a6"
              />
              <QueueTile
                href="/admin/moderation"
                icon={Flag}
                title="Moderation Reports"
                desc="User reports — harassment, illegal content, spam"
                count={data.queues.moderationOpen}
                color="#f97316"
                criticalCount={data.queues.moderationCritical}
                footer={`${data.queues.moderationResolvedToday} resolved today`}
              />
              <QueueTile
                href="/admin/flags"
                icon={FileWarning}
                title="Content Flags"
                desc="Priority-2 report mirrors + auto-detections (when wired)"
                count={data.queues.contentFlagsPending}
                color="#8b5cf6"
              />
              <QueueTile
                href="/admin/users"
                icon={Search}
                title="User Management"
                desc="Search any user, view status, suspend / reactivate"
                color="#06b6d4"
                isNavigation
              />
              <QueueTile
                href="/admin/payouts"
                icon={Banknote}
                title="Pending Payouts"
                desc="Weekly creator payout dashboard · design + state machine"
                count={data.queues.pendingPayouts}
                color="#10b981"
                footer="Operational once CCBill is live"
              />
              <QueueTile
                href="/admin/audit-log"
                icon={ScrollText}
                title="Audit Log"
                desc="Every admin action recorded — tamper-evident · 2257-grade"
                color="#a78bfa"
                isNavigation
              />
              <QueueTile
                href="https://support.ccbill.com"
                icon={DollarSign}
                title="CCBill Console"
                desc="Merchant transactions, refunds, chargebacks"
                color="#94a3b8"
                external
              />
            </div>

            {/* ── Two-column bottom: activity + quick stats ─────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Recent activity feed (2/3) — scales for high-volume sites */}
              <div className="lg:col-span-2">
                <ActivityPanel activity={data.activity} />
              </div>

              {/* Quick stats (1/3) */}
              <div className="space-y-4">
                <div className="vl-card p-5">
                  <h3 className="text-sm font-bold text-white mb-3">Platform Health</h3>
                  <div className="space-y-2.5 text-xs">
                    <StatRow label="Active rate" value={`${pct(data.users.active, data.users.total)}%`} />
                    <StatRow label="Creator conversion" value={`${pct(data.creators.total, data.users.total)}%`} />
                    <StatRow label="Pending approvals" value={data.creators.pending.toLocaleString()} highlight={data.creators.pending > 0} />
                    <StatRow label="New users / 30d" value={data.users.new30d.toLocaleString()} />
                    <StatRow label="Lifetime revenue" value={`$${data.revenue.lifetime.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                  </div>
                </div>

                <div className="vl-card p-5">
                  <h3 className="text-sm font-bold text-white mb-2">Quick reference</h3>
                  <ul className="space-y-1.5 text-xs" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.55 }}>
                    <li>• Approve creators only after ID + age verification</li>
                    <li>• Reject docs are deleted; approved are retained (2257)</li>
                    <li>• Critical reports (priority 2) jump the queue</li>
                    <li>• Deactivating a user revokes all sessions</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, color, label, value, sub, pulse }: {
  icon: React.ElementType; color: string; label: string; value: string; sub?: string; pulse?: boolean;
}) {
  return (
    <div className="vl-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center relative"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon className="w-4 h-4" style={{ color }} />
          {pulse && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
              style={{ background: color }} />
          )}
        </div>
        <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{sub}</p>}
    </div>
  );
}

function QueueTile({ href, icon: Icon, title, desc, count, color, criticalCount, footer, disabled, external, isNavigation }: {
  href: string; icon: React.ElementType; title: string; desc: string;
  count?: number; color: string; criticalCount?: number; footer?: string;
  disabled?: boolean; external?: boolean; isNavigation?: boolean;
}) {
  const showCount = !disabled && !isNavigation && typeof count === "number";
  const hasItems  = showCount && count! > 0;

  const card = (
    <div className="vl-card p-4 h-full transition-all"
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        borderColor: hasItems ? `${color}55` : "rgba(255,255,255,0.08)",
      }}>
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="flex items-center gap-1.5">
          {showCount && (
            <span className="text-xs font-black px-2 py-0.5 rounded-full"
              style={{ background: hasItems ? `${color}1f` : "rgba(255,255,255,0.04)", color: hasItems ? color : "rgba(255,255,255,0.4)", border: hasItems ? `1px solid ${color}55` : "1px solid rgba(255,255,255,0.08)" }}>
              {count}
            </span>
          )}
          {!disabled && !isNavigation && criticalCount && criticalCount > 0 && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
              style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.4)" }}>
              <AlertTriangle className="w-2.5 h-2.5" /> {criticalCount}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        {!disabled && <ChevronRight className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />}
      </div>
      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{desc}</p>
      {(footer || disabled) && (
        <p className="text-[10px] font-bold mt-2 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
          {disabled && !footer ? "Coming soon" : footer}
        </p>
      )}
    </div>
  );

  if (disabled)     return <div>{card}</div>;
  if (external)     return <a href={href} target="_blank" rel="noopener noreferrer">{card}</a>;
  return <Link href={href}>{card}</Link>;
}

function ActivityIcon({ kind, priority }: { kind: string; priority?: number }) {
  const cfg =
    kind === "registration"   ? { icon: UserPlus, color: "#14b8a6" }
  : kind === "creator_apply"  ? { icon: Sparkles, color: "#a78bfa" }
  : kind === "report"         ? { icon: Flag, color: priority === 2 ? "#ef4444" : "#f97316" }
  :                             { icon: Shield, color: "#94a3b8" };
  const I = cfg.icon;
  return (
    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}>
      <I className="w-3.5 h-3.5" style={{ color: cfg.color }} />
    </div>
  );
}

// Activity panel — grouped by category with counts so a flood of one kind
// (e.g. signups) doesn't drown out the others. Each tab caps at 8 items.
type ActivityItem = AdminOverview["activity"][number];

function ActivityPanel({ activity }: { activity: ActivityItem[] }) {
  const reports     = activity.filter((a): a is Extract<ActivityItem, { kind: "report" }> => a.kind === "report");
  const apps        = activity.filter((a): a is Extract<ActivityItem, { kind: "creator_apply" }> => a.kind === "creator_apply");
  const regs        = activity.filter((a): a is Extract<ActivityItem, { kind: "registration" }> => a.kind === "registration");
  // Actionable = reports + apps (the things that need admin action)
  const actionable  = [...reports, ...apps].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  type Tab = "actionable" | "reports" | "apps" | "regs";
  const [tab, setTab] = useState<Tab>(actionable.length > 0 ? "actionable" : "regs");

  const tabs: { key: Tab; label: string; count: number; color: string }[] = [
    { key: "actionable", label: "Needs attention", count: actionable.length, color: "#f97316" },
    { key: "reports",    label: "Reports",         count: reports.length,    color: "#ef4444" },
    { key: "apps",       label: "Applications",    count: apps.length,       color: "#a78bfa" },
    { key: "regs",       label: "Signups",         count: regs.length,       color: "#14b8a6" },
  ];

  const visible: ActivityItem[] =
    tab === "actionable" ? actionable.slice(0, 8)
  : tab === "reports"    ? reports.slice(0, 8)
  : tab === "apps"       ? apps.slice(0, 8)
  :                        regs.slice(0, 8);

  return (
    <div className="vl-card p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-base font-bold text-white">Recent Activity</h3>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          {activity.length} total in window
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
            style={tab === t.key
              ? { background: `${t.color}1f`, color: t.color, border: `1px solid ${t.color}55` }
              : { background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }
            }>
            {t.label}
            <span className="text-[10px] font-black px-1.5 rounded-full"
              style={{ background: tab === t.key ? `${t.color}33` : "rgba(255,255,255,0.06)", color: tab === t.key ? t.color : "rgba(255,255,255,0.5)" }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.35)" }}>
          {tab === "actionable" ? "🎉  All caught up — nothing needs attention right now." : "Nothing in this category yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((a, i) => (
            <div key={i} className="flex items-start gap-3 py-2"
              style={{ borderBottom: i < visible.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <ActivityIcon kind={a.kind} priority={"priority" in a ? a.priority : undefined} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">
                  {a.kind === "registration" && (
                    <>New <span style={{ color: "#14b8a6" }}>{a.role.toLowerCase()}</span>: <strong>@{a.username}</strong></>
                  )}
                  {a.kind === "creator_apply" && (
                    <><strong>@{a.username}</strong> applied to become a creator</>
                  )}
                  {a.kind === "report" && (
                    <>
                      <strong>@{a.reporter}</strong> reported{" "}
                      {a.reportedUser ? <><strong>@{a.reportedUser}</strong></> : "content"}
                      {" — "}<span style={{ color: "rgba(255,255,255,0.6)" }}>{a.reason}</span>
                    </>
                  )}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {ago(a.at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer link for deeper investigation */}
      {(tab === "reports" || tab === "actionable") && reports.length > 0 && (
        <Link href="/admin/moderation">
          <button className="w-full mt-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/5"
            style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", color: "#f97316" }}>
            Open Moderation Queue →
          </button>
        </Link>
      )}
      {tab === "regs" && (
        <Link href="/admin/users">
          <button className="w-full mt-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/5"
            style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", color: "#06b6d4" }}>
            Open User Management →
          </button>
        </Link>
      )}
    </div>
  );
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
      <span className="font-semibold" style={{ color: highlight ? "#f59e0b" : "white" }}>{value}</span>
    </div>
  );
}
