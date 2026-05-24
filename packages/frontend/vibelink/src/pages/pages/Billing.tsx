/**
 * LINKME â€” Billing Page
 * Velvet Dark Design System
 * PII-safe billing management. No CCBill references.
 * Payment processing via secure PCI DSS Level 1 certified processor.
 */
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { MOCK_TRANSACTIONS } from "@/lib/mock-data";
import { Lock, Shield, CreditCard, History, RefreshCw, AlertTriangle, CheckCircle, Eye, EyeOff } from "lucide-react";

type Tab = "payment" | "history" | "subscriptions";

export default function Billing() {
  const { credits } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("payment");
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [showCvv, setShowCvv] = useState(false);
  const [savedCards] = useState<any[]>([]);

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "payment", label: "Payment Methods", icon: CreditCard },
    { key: "history", label: "Transaction History", icon: History },
    { key: "subscriptions", label: "Subscriptions", icon: RefreshCw },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 700, color: "white" }}>Billing & Payments</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>Manage your payment methods, view transaction history, and control subscriptions.</p>
        </div>

        {/* Credit balance */}
        <div className="vl-card p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.25)" }}>
              <span className="text-lg">âš¡</span>
            </div>
            <div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Current Balance</p>
              <p className="text-xl font-bold" style={{ color: "#14b8a6", fontFamily: "'DM Mono', monospace" }}>{credits.toLocaleString()} credits</p>
            </div>
          </div>
          <a href="/credits" className="vl-btn-primary px-4 py-2 text-sm no-underline">Buy Credits</a>
        </div>

        {/* PII Security Notice */}
        <div className="vl-pii-shield mb-6 flex items-start gap-3">
          <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#14b8a6" }} />
          <div>
            <p className="font-bold text-sm mb-1" style={{ color: "#5eead4" }}>Your Financial Data is Fully Protected</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {[
                "PCI DSS Level 1 certified payment processing",
                "Full card numbers are never stored on our servers",
                "All transactions use TLS 1.3 encryption",
                "Tokenized card storage â€” only last 4 digits retained",
                "Real-time fraud detection and monitoring",
                "3D Secure authentication on all transactions",
              ].map(item => (
                <p key={item} className="text-xs flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  <CheckCircle className="w-3 h-3 flex-shrink-0" style={{ color: "#14b8a6" }} /> {item}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: activeTab === t.key ? "rgba(20,184,166,0.15)" : "transparent",
                color: activeTab === t.key ? "#14b8a6" : "rgba(255,255,255,0.4)",
                border: activeTab === t.key ? "1px solid rgba(20,184,166,0.25)" : "1px solid transparent",
              }}
            >
              <t.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Payment Methods Tab */}
        {activeTab === "payment" && (
          <div className="animate-fade-up">
            {savedCards.length === 0 && !showCardForm ? (
              <div className="vl-card p-8 text-center mb-4">
                <CreditCard className="w-12 h-12 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
                <p className="font-semibold text-white mb-1">No Payment Methods Saved</p>
                <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>Add a card to purchase credits and subscriptions.</p>
                <button onClick={() => setShowCardForm(true)} className="vl-btn-primary px-5 py-2.5 text-sm">
                  + Add Payment Method
                </button>
              </div>
            ) : null}

            {showCardForm && (
              <div className="vl-card p-6 mb-4 animate-fade-up">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white">Add New Card</h3>
                  <button onClick={() => setShowCardForm(false)} className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Cancel</button>
                </div>

                {/* Security reminder */}
                <div className="vl-pii-shield mb-4">
                  <p className="text-xs flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                    <Lock className="w-3.5 h-3.5" style={{ color: "#14b8a6" }} />
                    Your card details are encrypted and transmitted directly to our PCI DSS Level 1 certified payment processor. LINKME never stores your full card number.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Cardholder Name</label>
                    <input type="text" placeholder="Full name as on card" value={cardName}
                      onChange={e => setCardName(e.target.value)}
                      className="vl-input" autoComplete="cc-name" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Card Number</label>
                    <div className="relative">
                      <input type="text" placeholder="1234 5678 9012 3456" value={cardNumber}
                        onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                        className="vl-input pr-10" autoComplete="cc-number" maxLength={19} />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#14b8a6" }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Expiry Date</label>
                      <input type="text" placeholder="MM/YY" value={cardExpiry}
                        onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                        className="vl-input" autoComplete="cc-exp" maxLength={5} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>CVV</label>
                      <div className="relative">
                        <input type={showCvv ? "text" : "password"} placeholder="â€¢â€¢â€¢" value={cardCvv}
                          onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          className="vl-input pr-10" autoComplete="cc-csc" maxLength={4} />
                        <button type="button" onClick={() => setShowCvv(!showCvv)} className="absolute right-3 top-1/2 -translate-y-1/2">
                          {showCvv ? <EyeOff className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} /> : <Eye className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowCardForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>Cancel</button>
                  <button className="vl-btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                    <Lock className="w-3.5 h-3.5" /> Save Card Securely
                  </button>
                </div>
              </div>
            )}

            {!showCardForm && savedCards.length === 0 && null}

            {/* Accepted payment methods */}
            <div className="vl-card p-4">
              <p className="text-xs font-semibold mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>Accepted Payment Methods</p>
              <div className="flex flex-wrap gap-2">
                {["Visa", "Mastercard", "American Express", "Discover"].map(m => (
                  <span key={m} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>{m}</span>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.25)" }}>
                All transactions are processed securely. Charges will appear on your statement as <strong style={{ color: "rgba(255,255,255,0.4)" }}>LINKME</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Transaction History Tab */}
        {activeTab === "history" && (
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Transaction History</h2>
              <button className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                ðŸ“¥ Export CSV
              </button>
            </div>
            <div className="vl-card overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-4 py-2.5 text-xs font-bold uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                <span>Description</span>
                <span>Date</span>
                <span>Credits</span>
                <span>Amount</span>
              </div>
              {MOCK_TRANSACTIONS.map((tx, i) => (
                <div key={tx.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-4 py-3 items-center text-sm"
                  style={{ borderBottom: i < MOCK_TRANSACTIONS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div>
                    <p className="text-white text-sm">{tx.description}</p>
                    <p className="text-xs capitalize" style={{ color: "rgba(255,255,255,0.35)" }}>{tx.type}</p>
                  </div>
                  <span className="text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.4)" }}>{tx.date.toLocaleDateString()}</span>
                  <span className={`font-bold text-xs whitespace-nowrap ${tx.type === "credit_purchase" ? "text-green-400" : "text-gray-500"}`}>
                    {tx.type === "credit_purchase" ? `+Credits` : `â€”`}
                  </span>
                  <span className="font-bold text-xs whitespace-nowrap text-white">
                    {tx.amount > 0 ? `$${tx.amount.toFixed(2)}` : "â€”"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === "subscriptions" && (
          <div className="animate-fade-up space-y-4">
            <h2 className="font-semibold text-white mb-2">Active Subscriptions</h2>
            <div className="vl-card p-5" style={{ borderColor: "rgba(20,184,166,0.2)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">ðŸ”¥</span>
                  <div>
                    <p className="font-bold text-white">Flame Boost</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>12 profile boosts/month â€¢ Active</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">$14.99/mo</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Renews Apr 15, 2026</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>Change Plan</button>
                <button className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>Cancel</button>
              </div>
            </div>

            <div className="vl-card p-4">
              <p className="font-semibold text-white mb-2 text-sm">Subscription Terms</p>
              <ul className="text-xs space-y-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                <li>â€¢ Subscriptions auto-renew monthly unless cancelled at least 24 hours before the renewal date</li>
                <li>â€¢ Cancel anytime â€” you retain access for the remainder of the paid period</li>
                <li>â€¢ Refunds for subscription fees are not issued for partial months</li>
                <li>â€¢ Subscription charges appear as <strong style={{ color: "rgba(255,255,255,0.6)" }}>LINKME</strong> on your statement</li>
              </ul>
            </div>

            <div className="vl-warning-box flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#fca5a5" }} />
              <p className="text-xs" style={{ color: "rgba(252,165,165,0.7)", lineHeight: 1.5 }}>
                To cancel a subscription, click "Cancel" above. Cancellation takes effect at the end of the current billing period. For billing disputes, contact support within 30 days of the charge.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
