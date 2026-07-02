/**
 * CRAVR — Admin Payouts Dashboard
 *
 * Full financial operations dashboard:
 *   • Payout queue (risk-scored, batch-routing)
 *   • Settlement reconciliation (CCBill → Paxum)
 *   • Export engine (CSV, Wave, 1099)
 *   • Job monitor (cron, retry, manual queue, run history)
 *
 * Data is demo/mock — the live pipeline requires CCBill + Paxum to be wired up.
 */
import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, CreditCard, History, Download, PauseCircle, RefreshCw,
  Building2, Wallet, Check, Activity, FileText, List, Send,
  BarChart2, Inbox, HelpCircle, ChevronRight,
} from "lucide-react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:  "#0d0e14", bg2: "#13141c", bg3: "#1a1b26", bg4: "#21222e",
  border: "#2a2b3a", border2: "#333447",
  text: "#e2e3ef", text2: "#8b8ca8", text3: "#555670",
  green: "#2ecc8a", greenBg: "#0d2e1e", greenBorder: "#1a4a30",
  red:   "#e24b4a", redBg:   "#2e0d0d", redBorder:   "#4a1a1a",
  blue:  "#4a9eff", blueBg:  "#0d1a2e", blueBorder:  "#1a304a",
  purple:"#a78bfa", purpleBg:"#1a0d2e", purpleBorder:"#2e1a4a",
  amber: "#f5a623", amberBg: "#2e1e0d", amberBorder: "#4a3010",
};

// ── Static data (mirrors the HTML mockup) ─────────────────────────────────────
const CREATORS = [
  { id:"@lunaris",   tier:"Gold",     balance:12400, score:8,  routing:"auto", method:"p2p", flag:"" },
  { id:"@veldtfire", tier:"Elite",    balance:34200, score:12, routing:"auto", method:"p2p", flag:"" },
  { id:"@cascadev",  tier:"Silver",   balance:3100,  score:15, routing:"auto", method:"ach", flag:"" },
  { id:"@prismara",  tier:"Standard", balance:1200,  score:18, routing:"auto", method:"p2p", flag:"" },
  { id:"@solavex",   tier:"Gold",     balance:9800,  score:20, routing:"auto", method:"ach", flag:"" },
  { id:"@mirova",    tier:"Silver",   balance:2600,  score:31, routing:"soft", method:"p2p", flag:"First payout" },
  { id:"@dawnrift",  tier:"Gold",     balance:7400,  score:44, routing:"soft", method:"ach", flag:"Method changed 10d" },
  { id:"@novanova",  tier:"Elite",    balance:8200,  score:58, routing:"hard", method:"p2p", flag:"5.2× avg · method 6d" },
];

const LEDGER = [
  { creator:"@lunaris",   gross:16200, fee:2430, rate:"15%", net:12420, state:"PAID",      cleared:"Jun 02" },
  { creator:"@veldtfire", gross:44800, fee:4480, rate:"10%", net:34200, state:"AVAILABLE", cleared:"Jun 03" },
  { creator:"@cascadev",  gross:4100,  fee:820,  rate:"20%", net:3100,  state:"QUEUED",    cleared:"Jun 01" },
  { creator:"@prismara",  gross:1650,  fee:413,  rate:"25%", net:1200,  state:"CLEARING",  cleared:"Jun 07" },
  { creator:"@solavex",   gross:12900, fee:1935, rate:"15%", net:9800,  state:"AVAILABLE", cleared:"Jun 02" },
  { creator:"@mirova",    gross:3480,  fee:696,  rate:"20%", net:2600,  state:"QUEUED",    cleared:"Jun 01" },
];

const EXPORT_DEFS = [
  {
    title:"CCBill settlement report", Icon:Building2, color:C.amber,
    desc:"All CCBill settlement batches with gross, processor fee, net settlement, and reconciliation status.",
    cols:["date","batch_id","gross","ccbill_fee","ccbill_net","status","paxum_match"], type:"ccbill",
  },
  {
    title:"Payout batch report", Icon:Send, color:C.green,
    desc:"All creator payouts in a run — method, amount, Paxum reference, and final status.",
    cols:["payout_date","creator_id","display_name","method","amount","paxum_ref","status"], type:"payout",
  },
  {
    title:"Creator earnings ledger", Icon:List, color:C.blue,
    desc:"Full transaction ledger per creator — gross, fee rate, net, state, and clearing date.",
    cols:["date","creator_id","gross_ccbill","ccbill_fee","ccbill_net","fee_rate","platform_fee","amount_net","status"], type:"ledger",
  },
  {
    title:"Platform P&L summary", Icon:BarChart2, color:C.purple,
    desc:"Weekly or monthly platform revenue — gross collected, processor fees, creator payouts, platform net.",
    cols:["period","gross_revenue","processor_fees","creator_payouts","platform_net","margin_pct"], type:"pnl",
  },
];

// ── CSV download ──────────────────────────────────────────────────────────────
const CSV_HEADERS: Record<string,string> = {
  ccbill:  "date,batch_id,gross,ccbill_fee,ccbill_net,status,paxum_match",
  payout:  "payout_date,creator_id,display_name,method,amount,paxum_ref,status",
  ledger:  "date,creator_id,gross_ccbill,ccbill_fee,ccbill_net,fee_rate,platform_fee,amount_net,status",
  pnl:     "period,gross_revenue,processor_fees,creator_payouts,platform_net,margin_pct",
  wave:    "Date,Description,Amount",
  tax1099: "creator_id,legal_name,tin_last4,entity_type,tax_year,total_paid,form_type,w9_on_file",
};
const CSV_ROWS: Record<string,string> = {
  wave:    '2026-06-03,"CCBill settlement #1048",46898.22\n2026-06-02,"Paxum payout batch · 8 creators",-35244.00',
  tax1099: "CR001,Jane Smith,6789,individual,2026,12400.00,1099-NEC,true\nCR002,Marcus Lee,4521,individual,2026,34200.00,1099-NEC,true",
  ccbill:  "2026-06-03,#1048,52400.00,5502.00,46898.00,reconciled,true",
  payout:  "2026-06-02,CR001,@lunaris,paxum_p2p,12400.00,PAX-88821,paid",
  ledger:  "2026-06-01,CR001,16200.00,1701.00,14499.00,0.15,2175.00,12420.00,PAID",
  pnl:     "2026-W23,52400.00,5502.00,35244.00,11654.00,24.8%",
};
function dlCSV(type: string) {
  const csv = (CSV_HEADERS[type] ?? "") + "\n" + (CSV_ROWS[type] ?? "");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `cravr_${type}_export_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

// ── Reusable micro-components ──────────────────────────────────────────────────
function IBadge({ color, bg, border, children }: {
  color:string; bg:string; border:string; children:React.ReactNode;
}) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding:"2px 8px", borderRadius:99, fontSize:10, fontWeight:600,
      border:`1px solid ${border}`, background:bg, color, whiteSpace:"nowrap",
    }}>
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10, margin:"20px 0 10px",
      fontSize:10, fontWeight:700, textTransform:"uppercase",
      letterSpacing:"0.1em", color:C.text3,
    }}>
      {children}
      <div style={{ flex:1, height:1, background:C.border }} />
    </div>
  );
}

function Btn({
  variant="ghost", size="md", onClick, children,
}: {
  variant?: "primary"|"ghost"|"danger"|"green";
  size?: "md"|"sm";
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const base: React.CSSProperties = {
    display:"inline-flex", alignItems:"center", gap:4, cursor:"pointer",
    borderRadius:7, fontFamily:"inherit", fontWeight:500, transition:"all .15s",
    border:"1px solid",
    padding: size === "sm" ? "4px 10px" : "7px 14px",
    fontSize: size === "sm" ? 11 : 12,
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background:C.amber, color:"#000", borderColor:"#e8862a" },
    ghost:   { background:"transparent", color:C.text2, borderColor:C.border2 },
    danger:  { background:"transparent", color:C.red,  borderColor:C.redBorder },
    green:   { background:"transparent", color:C.green, borderColor:C.greenBorder },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} onClick={onClick}>
      {children}
    </button>
  );
}

// ── Tier/state colour helpers ──────────────────────────────────────────────────
function tierColor(t: string) {
  if (t === "Elite")    return C.amber;
  if (t === "Gold")     return C.purple;
  if (t === "Silver")   return C.blue;
  return C.text2;
}
function stateStyle(s: string): { color:string; bg:string; border:string } {
  const m: Record<string,{ color:string; bg:string; border:string }> = {
    PAID:      { color:C.green,  bg:C.greenBg,  border:C.greenBorder },
    AVAILABLE: { color:C.blue,   bg:C.blueBg,   border:C.blueBorder  },
    QUEUED:    { color:C.amber,  bg:C.amberBg,  border:C.amberBorder },
    CLEARING:  { color:C.text2,  bg:C.bg4,      border:C.border      },
    PROCESSING:{ color:C.purple, bg:C.purpleBg, border:C.purpleBorder},
  };
  return m[s] ?? { color:C.text2, bg:C.bg4, border:C.border };
}

// ── Tab: Payout Queue ─────────────────────────────────────────────────────────
function TabQueue() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() =>
    CREATORS.filter(c => {
      const mf = filter === "all" || c.routing === filter || (filter === "failed" && false);
      const ms = !search || c.id.includes(search.toLowerCase());
      return mf && ms;
    }),
  [filter, search]);

  const fpill = (label: string, value: string) => (
    <button
      key={value}
      onClick={() => setFilter(value)}
      style={{
        padding:"4px 12px", borderRadius:99, fontSize:11, fontWeight:500,
        cursor:"pointer", border:`1px solid ${filter === value ? C.border2 : C.border}`,
        color: filter === value ? C.text : C.text2,
        background: filter === value ? C.bg4 : "transparent",
        transition:"all .15s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* Stat row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        {[
          { label:"This week's batch", value:"$41,250", sub:"8 creators eligible",          vc:C.amber },
          { label:"Auto-approve",      value:"5",       sub:"Score 0–20 — no review",       vc:C.green },
          { label:"Soft review",       value:"2",       sub:"4hr window · Mon 3am auto-release", vc:C.amber },
          { label:"Hard review",       value:"1",       sub:"Manual approval required",      vc:C.red   },
        ].map(s => (
          <div key={s.label} style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px" }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:C.text3, marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:700, fontFamily:"monospace", letterSpacing:"-0.5px", color:s.vc }}>{s.value}</div>
            <div style={{ fontSize:11, color:C.text2, marginTop:3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Run summary */}
      <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
          {[
            ["Next run",             "Mon Jun 09 · 3:00am"],
            ["Hold clock basis",     "CCBill settlement date"],
            ["Minimum balance",      "$1,000 AVAILABLE"],
            ["Paxum ledger snapshot","Sun 11:00pm"],
          ].map(([lbl,val]) => (
            <div key={lbl}>
              <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.text3, fontWeight:700, marginBottom:2 }}>{lbl}</div>
              <div style={{ fontSize:13, fontWeight:500, fontFamily:"monospace" }}>{val}</div>
            </div>
          ))}
          <div>
            <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.text3, fontWeight:700, marginBottom:2 }}>Last run</div>
            <div style={{ fontSize:13, fontWeight:500, fontFamily:"monospace", color:C.green }}>Jun 02 · 8 paid · $38,100</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="danger"><PauseCircle size={13} /> Freeze run</Btn>
          <Btn variant="ghost"><RefreshCw size={13} /> Force run</Btn>
        </div>
      </div>

      {/* Batch pills */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        {[
          { label:"Auto-approve\nScore 0–20",    count:5, style:{ background:C.greenBg,  border:`1px solid ${C.greenBorder}`,  color:C.green  }, v:"auto"   },
          { label:"Soft review\n4hr admin window",count:2, style:{ background:C.amberBg,  border:`1px solid ${C.amberBorder}`,  color:C.amber  }, v:"soft"   },
          { label:"Hard review\nManual approve", count:1, style:{ background:C.redBg,    border:`1px solid ${C.redBorder}`,    color:C.red    }, v:"hard"   },
          { label:"Manual queue\nFailed retries",count:0, style:{ background:C.purpleBg, border:`1px solid ${C.purpleBorder}`, color:C.purple }, v:"manual" },
        ].map(p => (
          <div key={p.v}
            onClick={() => setFilter(p.v)}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:8, cursor:"pointer", transition:"all .15s", ...p.style }}>
            <div>
              <div style={{ fontSize:18, fontWeight:700, fontFamily:"monospace" }}>{p.count}</div>
              <div style={{ fontSize:11, fontWeight:500, lineHeight:1.3, whiteSpace:"pre-line" }}>{p.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", gap:6 }}>
          {fpill("All (8)",    "all")}
          {fpill("Auto",       "auto")}
          {fpill("Soft review","soft")}
          {fpill("Hard review","hard")}
          {fpill("Failed",     "failed")}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search creator..."
          style={{
            background:C.bg2, border:`1px solid ${C.border}`, borderRadius:7,
            padding:"6px 12px", fontSize:12, color:C.text, width:200, outline:"none",
          }}
        />
      </div>

      {/* Table */}
      <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["Creator","Tier","Available balance","Risk score","Routing","Method","Actions"].map(h => (
                <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:C.text3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding:32, textAlign:"center", color:C.text3 }}>
                  <Inbox size={28} style={{ margin:"0 auto 8px", display:"block" }} />
                  No payouts match this filter
                </td>
              </tr>
            ) : rows.map(c => {
              const scoreColor = c.score <= 20 ? C.green : c.score <= 50 ? C.amber : C.red;
              const scoreW = Math.min(100, Math.round(c.score / 70 * 100));
              const routingBadge = c.routing === "auto"
                ? { color:C.green, bg:C.greenBg, border:C.greenBorder, label:"Auto" }
                : c.routing === "soft"
                ? { color:C.amber, bg:C.amberBg, border:C.amberBorder, label:"Soft review" }
                : { color:C.red,   bg:C.redBg,   border:C.redBorder,   label:"Hard review" };

              return (
                <tr key={c.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ fontWeight:600, color:C.text }}>{c.id}</div>
                    {c.flag && <div style={{ fontSize:10, color:C.amber }}>{c.flag}</div>}
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <span style={{ fontSize:12, fontWeight:600, color:tierColor(c.tier) }}>{c.tier}</span>
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <span style={{ fontFamily:"monospace", fontSize:13, fontWeight:600, color:C.text }}>${c.balance.toLocaleString()}</span>
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ height:4, borderRadius:2, background:C.bg4, width:60, overflow:"hidden" }}>
                        <div style={{ height:"100%", borderRadius:2, width:`${scoreW}%`, background:scoreColor }} />
                      </div>
                      <span style={{ fontSize:11, fontFamily:"monospace", fontWeight:600, color:scoreColor, minWidth:20 }}>{c.score}</span>
                    </div>
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <IBadge color={routingBadge.color} bg={routingBadge.bg} border={routingBadge.border}>
                      {routingBadge.label}
                    </IBadge>
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.text2 }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background: c.method === "p2p" ? C.green : C.blue, flexShrink:0 }} />
                      {c.method === "p2p" ? "Paxum P2P" : "EFT/ACH"}
                    </div>
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ display:"flex", gap:4 }}>
                      {c.routing === "hard" ? (
                        <>
                          <Btn variant="green" size="sm">Approve</Btn>
                          <Btn variant="danger" size="sm">Hold</Btn>
                        </>
                      ) : c.routing === "soft" ? (
                        <>
                          <Btn variant="ghost" size="sm">Details</Btn>
                          <Btn variant="danger" size="sm">Hold</Btn>
                        </>
                      ) : (
                        <Btn variant="ghost" size="sm">Ledger</Btn>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Reconciliation ───────────────────────────────────────────────────────
function TabRecon() {
  const [period, setPeriod] = useState("This week");

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <SectionLabel>Settlement reconciliation</SectionLabel>
        <div style={{ display:"flex", gap:4 }}>
          {["This week","Last 30d","Custom"].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{
                padding:"5px 12px", borderRadius:6, fontSize:11, fontWeight:500, cursor:"pointer",
                border:`1px solid ${period === p ? C.border2 : C.border}`,
                color: period === p ? C.text : C.text2,
                background: period === p ? C.bg4 : "transparent",
                transition:"all .15s",
              }}>{p}</button>
          ))}
        </div>
      </div>

      {/* P&L card */}
      <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, marginBottom:20 }}>
        <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:13, fontWeight:600, color:C.text }}>Platform P&amp;L — week of Jun 02</span>
          <IBadge color={C.green} bg={C.greenBg} border={C.greenBorder}><Check size={10} /> Reconciled</IBadge>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)" }}>
          {[
            { label:"CCBill gross",    value:"$52,400",  sub:"Consumer transactions",   vc:C.text },
            { label:"CCBill fees",     value:"−$5,502",  sub:"~10.5% blended rate",     vc:C.red  },
            { label:"Creator payouts", value:"−$35,244", sub:"8 creators · net share",  vc:C.amber},
            { label:"Platform net",    value:"$11,654",  sub:"24.8% of CCBill net",     vc:C.green},
          ].map((cell, i) => (
            <div key={cell.label} style={{ padding:16, borderRight: i < 3 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.text3, marginBottom:6, fontWeight:700 }}>{cell.label}</div>
              <div style={{ fontSize:20, fontWeight:700, fontFamily:"monospace", color:cell.vc }}>{cell.value}</div>
              <div style={{ fontSize:11, color:C.text2, marginTop:3 }}>{cell.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CCBill + Paxum recon cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
        {/* CCBill */}
        <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:12, fontWeight:600, color:C.text, display:"flex", alignItems:"center", gap:8 }}>
              <Building2 size={14} style={{ color:C.amber }} /> CCBill settlement batches
            </span>
            <span style={{ fontSize:11, color:C.text2 }}>Jun 02 – Jun 08</span>
          </div>
          {[
            { dot:C.green,  label:"Batch #1048", sub:"Jun 02 · 14-day period",   amt:"$46,898.22", note:"Matched to Paxum",         nc:C.green },
            { dot:C.amber,  label:"Batch #1049", sub:"Jun 06 · partial period",  amt:"$5,501.78",  note:"Awaiting Paxum deposit",    nc:C.amber },
          ].map(r => (
            <div key={r.label} style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:r.dot, flexShrink:0 }} />
                <div>
                  <div style={{ fontWeight:500, color:C.text }}>{r.label}</div>
                  <div style={{ fontSize:11, color:C.text2 }}>{r.sub}</div>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"monospace", fontWeight:600, color:C.text }}>{r.amt}</div>
                <div style={{ fontSize:10, color:r.nc }}>{r.note}</div>
              </div>
            </div>
          ))}
          <div style={{ padding:"10px 16px", background:C.bg3, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ color:C.text2, fontSize:12 }}>Total settled this period</span>
            <span style={{ fontFamily:"monospace", fontWeight:600, color:C.green }}>$52,400.00</span>
          </div>
        </div>

        {/* Paxum */}
        <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:12, fontWeight:600, color:C.text, display:"flex", alignItems:"center", gap:8 }}>
              <Wallet size={14} style={{ color:C.purple }} /> Paxum deposits received
            </span>
            <span style={{ fontSize:11, color:C.text2 }}>Jun 02 – Jun 08</span>
          </div>
          {[
            { dot:C.green, label:"Deposit · Jun 03", sub:"CCBill batch #1048", amt:"$46,898.22", note:"Matched ✓",       nc:C.green, dim:false },
            { dot:C.amber, label:"Deposit · pending", sub:"CCBill batch #1049", amt:"$5,501.78",  note:"Expected Jun 10", nc:C.amber, dim:true  },
          ].map(r => (
            <div key={r.label} style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:r.dot, flexShrink:0 }} />
                <div>
                  <div style={{ fontWeight:500, color:C.text }}>{r.label}</div>
                  <div style={{ fontSize:11, color:C.text2 }}>{r.sub}</div>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"monospace", fontWeight:600, color: r.dim ? C.text2 : C.text }}>{r.amt}</div>
                <div style={{ fontSize:10, color:r.nc }}>{r.note}</div>
              </div>
            </div>
          ))}
          <div style={{ padding:"10px 16px", background:C.bg3, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ color:C.text2, fontSize:12 }}>Payout disbursed (Jun 02)</span>
            <span style={{ fontFamily:"monospace", fontWeight:600, color:C.red }}>−$35,244.00</span>
          </div>
        </div>
      </div>

      {/* Creator ledger */}
      <SectionLabel>Creator ledger — this period</SectionLabel>
      <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["Creator","Gross earned","Platform fee","Fee rate","Amount net","State","Cleared date"].map(h => (
                <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:C.text3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LEDGER.map(r => {
              const ss = stateStyle(r.state);
              return (
                <tr key={r.creator} style={{ borderBottom:`1px solid ${C.border}` }}>
                  <td style={{ padding:"10px 14px", fontWeight:600, color:C.text }}>{r.creator}</td>
                  <td style={{ padding:"10px 14px", fontFamily:"monospace", fontWeight:600, color:C.text }}>${r.gross.toLocaleString()}</td>
                  <td style={{ padding:"10px 14px", fontFamily:"monospace", fontWeight:600, color:C.red }}>−${r.fee.toLocaleString()}</td>
                  <td style={{ padding:"10px 14px", fontFamily:"monospace", fontSize:12, color:C.text2 }}>{r.rate}</td>
                  <td style={{ padding:"10px 14px", fontFamily:"monospace", fontWeight:600, color:C.green }}>${r.net.toLocaleString()}</td>
                  <td style={{ padding:"10px 14px" }}><IBadge color={ss.color} bg={ss.bg} border={ss.border}>{r.state}</IBadge></td>
                  <td style={{ padding:"10px 14px", fontSize:11, color:C.text2 }}>{r.cleared}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Exports ───────────────────────────────────────────────────────────────
function TabExports() {
  return (
    <div>
      <SectionLabel>On-demand exports</SectionLabel>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:12, marginBottom:20 }}>
        {EXPORT_DEFS.map(e => (
          <div key={e.type} style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:4, display:"flex", alignItems:"center", gap:8, color:C.text }}>
              <e.Icon size={15} style={{ color:e.color }} />{e.title}
            </div>
            <div style={{ fontSize:11, color:C.text2, marginBottom:12, lineHeight:1.5 }}>{e.desc}</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:12 }}>
              {e.cols.map(c => (
                <span key={c} style={{ fontSize:10, padding:"2px 7px", borderRadius:4, background:C.bg4, color:C.text3, fontFamily:"monospace" }}>{c}</span>
              ))}
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <select style={{ background:C.bg3, border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 8px", fontSize:11, color:C.text }}>
                <option>This week</option>
                <option>Last 30d</option>
                <option>Last 90d</option>
                <option>YTD</option>
              </select>
              <Btn variant="ghost" size="sm" onClick={() => dlCSV(e.type)}>
                <Download size={11} />CSV
              </Btn>
            </div>
          </div>
        ))}
      </div>

      <SectionLabel>Wave-compatible bank import</SectionLabel>
      <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:240 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:4, display:"flex", alignItems:"center", gap:8, color:C.text }}>
              <Activity size={14} style={{ color:C.blue }} /> Wave bank import CSV
            </div>
            <div style={{ fontSize:11, color:C.text2, marginBottom:10, lineHeight:1.6, maxWidth:480 }}>
              Generates a 3-column CSV (Date, Description, Amount) pre-formatted to Wave's bank import specification.
              Positive = money in (CCBill settlements). Negative = money out (Paxum creator payouts, expenses).
              Import directly into Wave → Accounting → Transactions.
            </div>
            <div style={{ fontSize:11, color:C.text3, fontFamily:"monospace", background:C.bg4, padding:"8px 12px", borderRadius:6, border:`1px solid ${C.border}`, lineHeight:1.8 }}>
              Date,Description,Amount<br />
              2026-06-03,"CCBill settlement #1048 · 14-day",46898.22<br />
              2026-06-02,"Paxum payout batch · 8 creators",-35244.00<br />
              2026-06-01,"Creator activations x3 · Stripe",29.97
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, minWidth:160 }}>
            <select style={{ background:C.bg3, border:`1px solid ${C.border}`, borderRadius:6, padding:"7px 10px", fontSize:12, color:C.text, width:"100%" }}>
              <option>This week</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>Year to date</option>
              <option>Custom range</option>
            </select>
            <Btn variant="primary" onClick={() => dlCSV("wave")}><Download size={12} /> Download for Wave</Btn>
            <Btn variant="ghost"><HelpCircle size={12} /> Import guide</Btn>
          </div>
        </div>
      </div>

      <SectionLabel>Tax 1099 prep export</SectionLabel>
      <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, padding:16 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:240 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:4, display:"flex", alignItems:"center", gap:8, color:C.text }}>
              <FileText size={14} style={{ color:C.green }} /> 1099-NEC prep CSV
            </div>
            <div style={{ fontSize:11, color:C.text2, marginBottom:10, lineHeight:1.6, maxWidth:480 }}>
              Year-end export of all creators who received ≥ $2,000 in the tax year. Upload directly to Tax1099 web UI
              for bulk e-file. Includes legal name, TIN last 4, total paid, and tax form type. Raw TIN never exported.
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {["creator_id","legal_name","tin_last4","entity_type","tax_year","total_paid","form_type","w9_on_file"].map(c => (
                <span key={c} style={{ fontSize:10, padding:"2px 7px", borderRadius:4, background:C.bg4, color:C.text3, fontFamily:"monospace" }}>{c}</span>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, minWidth:160 }}>
            <select style={{ background:C.bg3, border:`1px solid ${C.border}`, borderRadius:6, padding:"7px 10px", fontSize:12, color:C.text, width:"100%" }}>
              <option>Tax year 2026</option>
              <option>Tax year 2025</option>
            </select>
            <Btn variant="green" onClick={() => dlCSV("tax1099")}><Download size={12} /> Download 1099 prep</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Job Monitor ───────────────────────────────────────────────────────────
function TabJobs() {
  return (
    <div>
      {/* Cron job card */}
      <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, marginBottom:16, overflow:"hidden" }}>
        <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, fontWeight:600, color:C.text }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:C.text3 }} />
            Weekly payout cron
            <IBadge color={C.text2} bg={C.bg4} border={C.border}>IDLE</IBadge>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, color:C.text2 }}>Next: Mon Jun 09 · 3:00am UTC</span>
            <Btn variant="ghost" size="sm">Simulate run</Btn>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))" }}>
          {[
            { label:"Last run",      value:"Jun 02 · 3:04am", vc:C.green  },
            { label:"Duration",      value:"4m 12s",          vc:C.text   },
            { label:"Creators paid", value:"8",               vc:C.text   },
            { label:"Total disbursed",value:"$38,100",        vc:C.green  },
            { label:"Failures",      value:"1",               vc:C.red    },
            { label:"Manual queue",  value:"1",               vc:C.amber  },
          ].map((m, i, arr) => (
            <div key={m.label} style={{ padding:"12px 16px", borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:C.text3, marginBottom:4, fontWeight:700 }}>{m.label}</div>
              <div style={{ fontSize:13, fontWeight:600, fontFamily:"monospace", color:m.vc }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      <SectionLabel>Retry queue</SectionLabel>
      <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", marginBottom:16 }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["Creator","Amount","Failure reason","Attempts","Next retry","Action"].map(h => (
                <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:C.text3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding:"10px 14px" }}>
                <div style={{ fontWeight:600, color:C.text }}>@stellarx</div>
                <div style={{ fontSize:11, color:C.text2 }}>EFT/ACH</div>
              </td>
              <td style={{ padding:"10px 14px", fontFamily:"monospace", fontWeight:600, color:C.text }}>$2,840</td>
              <td style={{ padding:"10px 14px" }}><IBadge color={C.red} bg={C.redBg} border={C.redBorder}>Invalid routing number</IBadge></td>
              <td style={{ padding:"10px 14px", fontFamily:"monospace", fontSize:12, color:C.text }}>2 / 3</td>
              <td style={{ padding:"10px 14px", fontSize:11, color:C.text2 }}>Jun 09 · 3:00am</td>
              <td style={{ padding:"10px 14px" }}>
                <div style={{ display:"flex", gap:4 }}>
                  <Btn variant="ghost" size="sm">Resolve</Btn>
                  <Btn variant="danger" size="sm">Hold</Btn>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <SectionLabel>Manual intervention queue</SectionLabel>
      <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", marginBottom:16 }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["Creator","Amount","Risk flags","Hold reason","Action"].map(h => (
                <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:C.text3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding:"10px 14px" }}>
                <div style={{ fontWeight:600, color:C.text }}>@novanova</div>
                <div style={{ fontSize:11, color:C.text2 }}>Score: 58</div>
              </td>
              <td style={{ padding:"10px 14px", fontFamily:"monospace", fontWeight:600, color:C.text }}>$8,200</td>
              <td style={{ padding:"10px 14px" }}>
                <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                  <IBadge color={C.amber} bg={C.amberBg} border={C.amberBorder}>5.2× 90-day avg</IBadge>
                  <IBadge color={C.amber} bg={C.amberBg} border={C.amberBorder}>Method changed 6d ago</IBadge>
                </div>
              </td>
              <td style={{ padding:"10px 14px", fontSize:11, color:C.text2 }}>Hard review · Score 51+</td>
              <td style={{ padding:"10px 14px" }}>
                <div style={{ display:"flex", gap:4 }}>
                  <Btn variant="green" size="sm">Approve</Btn>
                  <Btn variant="danger" size="sm">Reject</Btn>
                  <Btn variant="ghost" size="sm">Details</Btn>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <SectionLabel>Run history</SectionLabel>
      <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["Run date","Creators paid","Total disbursed","Failures","Duration","Status",""].map(h => (
                <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:C.text3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { date:"Jun 02 · 3:04am", paid:8, amt:"$38,100", fail:1, dur:"4m 12s", status:"Partial",  sc:{ color:C.amber, bg:C.amberBg, border:C.amberBorder } },
              { date:"May 26 · 3:01am", paid:7, amt:"$29,450", fail:0, dur:"2m 58s", status:"Complete", sc:{ color:C.green, bg:C.greenBg, border:C.greenBorder } },
              { date:"May 19 · 3:00am", paid:6, amt:"$22,180", fail:0, dur:"2m 11s", status:"Complete", sc:{ color:C.green, bg:C.greenBg, border:C.greenBorder } },
            ].map(r => (
              <tr key={r.date} style={{ borderBottom:`1px solid ${C.border}` }}>
                <td style={{ padding:"10px 14px", fontFamily:"monospace", fontSize:12, color:C.text }}>{r.date}</td>
                <td style={{ padding:"10px 14px", color:C.text }}>{r.paid}</td>
                <td style={{ padding:"10px 14px", fontFamily:"monospace", fontWeight:600, color:C.text }}>{r.amt}</td>
                <td style={{ padding:"10px 14px" }}>
                  {r.fail > 0
                    ? <IBadge color={C.red}   bg={C.redBg}  border={C.redBorder}>{r.fail}</IBadge>
                    : <IBadge color={C.text2} bg={C.bg4}    border={C.border}>{r.fail}</IBadge>}
                </td>
                <td style={{ padding:"10px 14px", fontFamily:"monospace", fontSize:12, color:C.text }}>{r.dur}</td>
                <td style={{ padding:"10px 14px" }}><IBadge color={r.sc.color} bg={r.sc.bg} border={r.sc.border}>{r.status}</IBadge></td>
                <td style={{ padding:"10px 14px" }}><Btn variant="ghost" size="sm">Report</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
type TabKey = "queue" | "recon" | "export" | "jobs";

export default function AdminPayouts() {
  const [activeTab, setActiveTab] = useState<TabKey>("queue");

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key:"queue",  label:"Payout queue",    count:8 },
    { key:"recon",  label:"Reconciliation",  count:2 },
    { key:"export", label:"Exports"                  },
    { key:"jobs",   label:"Job monitor"              },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontSize:13, lineHeight:1.5 }}>
      {/* Sticky topbar */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"10px 20px", borderBottom:`1px solid ${C.border}`,
        background:C.bg2, position:"sticky", top:0, zIndex:50,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <Link href="/admin">
            <span style={{ display:"flex", alignItems:"center", gap:6, color:C.text2, fontSize:12, cursor:"pointer" }}>
              <ArrowLeft size={14} /> Back to Admin
            </span>
          </Link>
          <div style={{ width:1, height:16, background:C.border }} />
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <CreditCard size={18} style={{ color:C.amber }} />
            <h1 style={{ fontSize:18, fontWeight:700, letterSpacing:"-0.3px" }}>Payouts</h1>
            <span style={{
              fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:99,
              letterSpacing:"0.05em", textTransform:"uppercase",
              background:C.bg4, color:C.text2, border:`1px solid ${C.border}`,
            }}>
              IDLE — next run Mon 3am
            </span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Btn variant="ghost"><History size={13} /> Run history</Btn>
          <Btn variant="primary" onClick={() => setActiveTab("export")}><Download size={13} /> Export</Btn>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display:"flex", gap:2, padding:"12px 20px 0",
        borderBottom:`1px solid ${C.border}`, background:C.bg2,
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding:"8px 16px", fontSize:12, fontWeight:500, cursor:"pointer",
              borderRadius:"6px 6px 0 0", border:`1px solid transparent`,
              borderBottom:"none", position:"relative", bottom:-1,
              transition:"all .15s",
              color: activeTab === t.key ? C.text : C.text2,
              background: activeTab === t.key ? C.bg : "transparent",
              borderColor: activeTab === t.key ? C.border : "transparent",
              borderBottomColor: activeTab === t.key ? C.bg : "transparent",
            }}
          >
            {t.label}
            {t.count !== undefined && (
              <span style={{
                display:"inline-flex", alignItems:"center", justifyContent:"center",
                width:18, height:18, borderRadius:"50%", fontSize:10, fontWeight:700,
                marginLeft:6,
                background: activeTab === t.key ? C.amber : C.bg4,
                color:      activeTab === t.key ? "#000"  : C.text2,
              }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div style={{ padding:20 }}>
        {activeTab === "queue"  && <TabQueue />}
        {activeTab === "recon"  && <TabRecon />}
        {activeTab === "export" && <TabExports />}
        {activeTab === "jobs"   && <TabJobs />}
      </div>
    </div>
  );
}
