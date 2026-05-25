import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { credits as creditsApi, CreditTransaction } from "@/lib/api";
import { Zap, Lock, CreditCard, Receipt, Star, ChevronRight, RefreshCw } from "lucide-react";

export default function Billing() {
  const { credits, isLoggedIn } = useApp();
  const [activeTab, setActiveTab] = useState<"methods" | "history" | "subscriptions">("methods");
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  useEffect(() => {
    if (activeTab === "history" && isLoggedIn) {
      setLoadingTx(true);
      creditsApi.transactions({ limit: 25 })
        .then(data => setTransactions(Array.isArray(data) ? data : []))
        .catch(() => setTransactions([]))
        .finally(() => setLoadingTx(false));
    }
  }, [activeTab, isLoggedIn]);

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
            <Link href="/credits">
              <button className="vl-btn-primary px-6 py-2.5 text-sm">+ Add Payment Method</button>
            </Link>
            <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.3)" }}>Processed securely via CCBill · Statement shows "CCBILL*LinkMe"</p>
          </div>
        )}

        {activeTab === "history" && (
          <div className="vl-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-white">Transaction History</h3>
              {loadingTx && <RefreshCw className="w-4 h-4 animate-spin" style={{ color: "rgba(255,255,255,0.3)" }} />}
            </div>
            {!isLoggedIn ? (
              <p className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.4)" }}>
                Sign in to view your transaction history.
              </p>
            ) : loadingTx ? (
              <p className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.4)" }}>Loading transactions…</p>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.4)" }}>No transactions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {["Description", "Date", "Credits", "Status"].map(h => (
                        <th key={h} className={`py-2.5 text-xs font-semibold ${h !== "Description" ? "text-right" : "text-left"}`}
                          style={{ color: "rgba(255,255,255,0.35)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => {
                      const isCredit = tx.amount > 0;
                      const typeLabel = tx.type.replace(/_/g, " ").toLowerCase();
                      return (
                        <tr key={tx.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td className="py-3 text-sm text-white capitalize">{typeLabel}</td>
                          <td className="py-3 text-right text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-right text-xs font-mono"
                            style={{ color: isCredit ? "#14b8a6" : "#f87171" }}>
                            {isCredit ? "+" : ""}{tx.amount.toLocaleString()}
                          </td>
                          <td className="py-3 text-right">
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: tx.status === "COMPLETED" ? "rgba(20,184,166,0.1)" : "rgba(234,179,8,0.1)",
                                color: tx.status === "COMPLETED" ? "#14b8a6" : "#fbbf24",
                              }}>
                              {tx.status.toLowerCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
