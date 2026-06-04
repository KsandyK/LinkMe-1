/**
 * CRAVR — Admin Payouts (read-only preview)
 *
 * Lists creators with available earnings + their payout-eligible balance.
 * The actual payout pipeline (Paxum API, weekly cron, risk scoring, retries)
 * is not yet built — this page is a transparency window so admins can SEE
 * what would be paid out today without anything actually executing.
 */
import { Link } from "wouter";
import { ArrowLeft, Banknote, AlertTriangle, ExternalLink } from "lucide-react";

export default function AdminPayouts() {
  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-4xl">
        <Link href="/admin">
          <button className="text-xs flex items-center gap-1.5 mb-3 hover:opacity-80" style={{ color: "rgba(255,255,255,0.45)" }}>
            <ArrowLeft className="w-3 h-3" /> Back to Admin
          </button>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Banknote className="w-6 h-6" style={{ color: "#10b981" }} />
          <h1 className="text-3xl font-bold text-white">Payouts</h1>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ background: "rgba(234,179,8,0.15)", color: "#fbbf24", border: "1px solid rgba(234,179,8,0.4)" }}>
            Not yet operational
          </span>
        </div>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
          Creator payout dashboard — view what will be paid each week.
        </p>

        {/* What's blocking ship */}
        <div className="vl-card p-5 mb-5"
          style={{ background: "rgba(234,179,8,0.05)", borderColor: "rgba(234,179,8,0.25)" }}>
          <div className="flex items-start gap-2.5 mb-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#fbbf24" }} />
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: "#fde68a" }}>Pipeline status</h3>
              <p className="text-xs" style={{ color: "rgba(253,230,138,0.85)", lineHeight: 1.55 }}>
                The schema (<code style={{ color: "#fbbf24" }}>CreatorPayout</code> + earnings ledger) is in place,
                but no payouts have run yet. The full design (state machine, 7-day hold, risk scoring,
                weekly cron, Paxum API, retries) is documented and ready to build — it just requires CCBill
                to be live first so real revenue flows through the ledger.
              </p>
            </div>
          </div>
        </div>

        {/* Design summary */}
        <h2 className="text-base font-bold text-white mb-3">Approved design</h2>
        <div className="vl-card p-5 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <Field label="Fee basis"          value="CCBill net settlement" />
            <Field label="Hold period"        value="7 days from CCBill settlement" />
            <Field label="Minimum payout"     value="$1,000 AVAILABLE balance" />
            <Field label="Payout frequency"   value="Weekly · Monday 3am" />
            <Field label="On-demand payouts"  value="None" />
            <Field label="Payout methods"     value="Paxum P2P + EFT/ACH" />
            <Field label="Risk auto-approve"  value="Score 0–20" />
            <Field label="Soft review"        value="Score 21–50 · 4-hour admin window" />
            <Field label="Hard review"        value="Score 51+ · manual only" />
            <Field label="Failed payout"      value="3 retries → manual queue → next weekly run" />
            <Field label="Chargeback handling" value="Pre-payout: nullify · post-payout: DEBT state" />
            <Field label="Dormancy"           value="180 days → notice → 30-day claim → escheatment" />
          </div>
        </div>

        {/* Ledger states */}
        <h2 className="text-base font-bold text-white mb-3">Money state machine</h2>
        <div className="vl-card p-5 mb-5">
          <code className="block text-[11px] font-mono whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>
{`PENDING  → CLEARING → AVAILABLE → QUEUED → PROCESSING → PAID
                                          ↘ FAILED → RETRY → PAID / MANUAL`}
          </code>
          <ul className="text-xs space-y-1.5 mt-4" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
            <li><strong style={{ color: "#94a3b8" }}>PENDING</strong> — webhook recorded, not trusted</li>
            <li><strong style={{ color: "#94a3b8" }}>CLEARING</strong> — inside 7-day hold</li>
            <li><strong style={{ color: "#14b8a6" }}>AVAILABLE</strong> — counts toward $1,000 minimum</li>
            <li><strong style={{ color: "#f59e0b" }}>QUEUED</strong> — eligibility passed, awaiting Monday run</li>
            <li><strong style={{ color: "#a78bfa" }}>PROCESSING</strong> — Paxum API call initiated</li>
            <li><strong style={{ color: "#10b981" }}>PAID</strong> — Paxum confirmed</li>
            <li><strong style={{ color: "#f87171" }}>FAILED / MANUAL</strong> — exception flow</li>
          </ul>
        </div>

        {/* External links */}
        <h2 className="text-base font-bold text-white mb-3">External tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="https://admin.ccbill.com" target="_blank" rel="noopener noreferrer"
            className="vl-card p-4 hover:bg-white/5 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">CCBill Admin</p>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Transactions · refunds · chargebacks · settlements
                </p>
              </div>
              <ExternalLink className="w-4 h-4" style={{ color: "rgba(255,255,255,0.35)" }} />
            </div>
          </a>
          <a href="https://app.paxum.com" target="_blank" rel="noopener noreferrer"
            className="vl-card p-4 hover:bg-white/5 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Paxum Console</p>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Outbound creator payouts · mass payment API
                </p>
              </div>
              <ExternalLink className="w-4 h-4" style={{ color: "rgba(255,255,255,0.35)" }} />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
        {label}
      </p>
      <p className="text-white">{value}</p>
    </div>
  );
}
