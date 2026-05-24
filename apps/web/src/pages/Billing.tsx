import { useState } from "react";
import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { Zap, Lock, CreditCard, Receipt, Star, ChevronRight } from "lucide-react";

const MOCK_TRANSACTIONS = [
  { id: "1", desc: "Purchased 500 Credits", date: "May 15, 2026", credits: "+500", amount: "$34.99", type: "credit" },
  { id: "2", desc: "Platinum VIP Monthly", date: "May 17, 2026", credits: "—", amount: "$39.99", type: "sub" },
  { id: "3", desc: "Gift — Rose Bouquet to Luna Rose", date: "May 20, 2026", credits: "-75", amount: "—", type: "spend" },
  { id: "4", desc: "Purchased 250 Credits", date: "May 22, 2026", credits: "+250", amount: "$19.99", type: "credit" },
];

export default function Billing() {
  const { credits } = useApp();
  const [activeTab, setActiveTab] = useState<"methods" | "history" | "subscriptions">("methods");

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-5xl">
        <h1 className="text-3xl font-bold text-white mb-2">Billing & Payments</h1>
        <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.4)" }}>Manage your payment methods, view transactions, and control subscriptions.</p>

        {/* Balance + Security row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
          <div className="vl-card p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(20,184,166,0.12)" }}>
                <Zap className="w-5 h-5" style={{ color: "#14b8a6" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Credits Balance</p>
                <p className="text-2xl font-black" style={{ color: "#14b8a6" }}>{credits.toLocaleString()}</p>
              </div>
            </div>
            <Link href="/credits">
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }}>
                Buy More
              </button>
            </Link>
          </div>

          <div className="vl-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4" style={{ color: "#14b8a6" }} />
              <p className="text-xs font-bold" style={{ color: "#14b8a6" }}>Your Data is Fully Protected</p>
            </div>
            <div className="space-y-1">
              {["PCI DSS Level 1 certified processing", "TLS 1.3 encryption on all transactions", "Tokenized storage — full card numbers never stored"].map(item => (
                <p key={item} className="text-xs flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  <span style={{ color: "#14b8a6" }}>✓</span> {item}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 vl-card p-1.5 w-fit mb-6">
          {([
            { id: "methods" as const, label: "Payment Methods", icon: CreditCard },
            { id: "history" as const, label: "Transactions", icon: Receipt },
            { id: "subscriptions" as const, label: "Subscriptions", icon: Star },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={activeTab === tab.id
                ? { background: "rgba(20,184,166,0.15)", color: "#14b8a6" }
                : { color: "rgba(255,255,255,0.45)" }
              }>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "methods" && (
          <div className="vl-card p-10 text-center">
            <div className="text-5xl mb-4">💳</div>
            <p className="font-bold text-lg text-white mb-1">No Payment Methods Saved</p>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>Add a card to purchase credits and subscriptions.</p>
            <button className="vl-btn-primary px-6 py-2.5 text-sm">+ Add Payment Method</button>
            <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.3)" }}>Processed securely via CCBill · Statement shows "CCBILL*LinkMe"</p>
          </div>
        )}

        {activeTab === "history" && (
          <div className="vl-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-white">Transaction History</h3>
              <button className="text-xs font-semibold" style={{ color: "#14b8a6" }}>Export CSV <ChevronRight className="w-3 h-3 inline" /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Description", "Date", "Credits", "Amount"].map(h => (
                      <th key={h} className={`py-2.5 text-xs font-semibold ${h !== "Description" ? "text-right" : "text-left"}`}
                        style={{ color: "rgba(255,255,255,0.35)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TRANSACTIONS.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="py-3 text-sm text-white">{tx.desc}</td>
                      <td className="py-3 text-right text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{tx.date}</td>
                      <td className="py-3 text-right text-xs font-mono"
                        style={{ color: tx.credits.startsWith("+") ? "#14b8a6" : tx.credits === "—" ? "rgba(255,255,255,0.3)" : "#f87171" }}>
                        {tx.credits}
                      </td>
                      <td className="py-3 text-right text-xs font-mono text-white">{tx.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div className="vl-card p-10 text-center">
            <Star className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
            <p className="font-bold text-white mb-1">No Active Subscriptions</p>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>Upgrade your plan to unlock bonus credits, boosts, and exclusive content.</p>
            <Link href="/boosts">
              <button className="vl-btn-primary px-6 py-2.5 text-sm">Browse Membership Plans</button>
            </Link>
          </div>
        )}

        <p className="text-xs mt-6" style={{ color: "rgba(255,255,255,0.25)" }}>
          All transactions are processed securely. Charges will appear on your statement as CCBILL*LINKME.
        </p>
      </div>
    </div>
  );
}
