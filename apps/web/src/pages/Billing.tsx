import { useState } from "react";

export default function Billing() {
  const [activeTab, setActiveTab] = useState<"methods" | "history" | "subscriptions">("methods");

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Billing & Payments</h1>
        <p className="text-muted-foreground mb-8">Manage your payment methods, view transaction history, and control subscriptions.</p>

        {/* Current Balance */}
        <div className="bg-[#111214] border border-[#222] rounded-2xl p-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#14B8A6]/20 rounded-full flex items-center justify-center">
              âš¡
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-3xl font-bold text-[#14B8A6]">250 credits</p>
            </div>
          </div>
          <button className="px-6 py-3 rounded-xl bg-[#14B8A6] text-white font-medium">Buy Credits</button>
        </div>

        {/* Security Assurance */}
        <div className="bg-[#111214] border border-[#222] rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span>ðŸ”’</span>
            <h3 className="font-semibold text-[#14B8A6]">Your Financial Data is Fully Protected</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div>âœ“ PCI DSS Level 1 certified payment processing</div>
              <div>âœ“ All transactions use TLS 1.3 encryption</div>
              <div>âœ“ Real-time fraud detection and monitoring</div>
            </div>
            <div className="space-y-2">
              <div>âœ“ Full card numbers are never stored on our servers</div>
              <div>âœ“ Tokenized card storage â€” only last 4 digits retained</div>
              <div>âœ“ 3D Secure authentication on all transactions</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab("methods")} className={`px-5 py-2 rounded-full flex items-center gap-2 text-sm ${activeTab === "methods" ? "bg-[#14B8A6] text-white" : "bg-[#1a1c20]"}`}>Payment Methods</button>
          <button onClick={() => setActiveTab("history")} className={`px-5 py-2 rounded-full flex items-center gap-2 text-sm ${activeTab === "history" ? "bg-[#14B8A6] text-white" : "bg-[#1a1c20]"}`}>Transaction History</button>
          <button onClick={() => setActiveTab("subscriptions")} className={`px-5 py-2 rounded-full flex items-center gap-2 text-sm ${activeTab === "subscriptions" ? "bg-[#14B8A6] text-white" : "bg-[#1a1c20]"}`}>Subscriptions</button>
        </div>

        {/* Tab Content */}
        {activeTab === "methods" && (
          <div className="bg-[#111214] border border-[#222] rounded-2xl p-10 text-center">
            <div className="text-5xl mb-4">ðŸ’³</div>
            <p className="font-semibold text-xl mb-2">No Payment Methods Saved</p>
            <p className="text-muted-foreground mb-6">Add a card to purchase credits and subscriptions.</p>
            <button className="px-6 py-3 rounded-xl bg-[#14B8A6] text-white font-medium">+ Add Payment Method</button>
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-[#111214] border border-[#222] rounded-2xl p-6">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold">Transaction History</h3>
              <button className="text-sm text-[#14B8A6]">Export CSV</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#333]">
                  <th className="text-left py-3">Description</th>
                  <th className="text-left py-3">Date</th>
                  <th className="text-right py-3">Credits</th>
                  <th className="text-right py-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#222]">
                  <td className="py-3">Purchased 500 Credits</td>
                  <td className="py-3 text-muted-foreground">May 15, 2026</td>
                  <td className="py-3 text-right text-green-400">+500</td>
                  <td className="py-3 text-right">$34.99</td>
                </tr>
                <tr className="border-b border-[#222]">
                  <td className="py-3">Platinum VIP Monthly</td>
                  <td className="py-3 text-muted-foreground">May 17, 2026</td>
                  <td className="py-3 text-right">â€”</td>
                  <td className="py-3 text-right">$39.99</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div className="bg-[#111214] border border-[#222] rounded-2xl p-6">
            <p className="text-muted-foreground">You have no active subscriptions.</p>
          </div>
        )}

        <div className="mt-8 text-xs text-muted-foreground">
          All transactions are processed securely. Charges will appear on your statement as LINKME.
        </div>
      </div>
    </div>
  );
}
