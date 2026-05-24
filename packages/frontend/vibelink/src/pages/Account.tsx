import { useState } from "react";

export default function Account() {
  const [showPlan, setShowPlan] = useState(false);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-5xl font-semibold tracking-tight mb-10">Account</h1>

      <div className="bg-[#111214] rounded-3xl p-10 border border-white/10 space-y-8">
        <div>
          <div className="text-sm text-white/60">Email</div>
          <div className="text-lg">user@example.com</div>
        </div>
        <div>
          <div className="text-sm text-white/60">Current Plan</div>
          <div className="text-lg flex items-center gap-3">Free <button onClick={() => setShowPlan(!showPlan)} className="text-[#14B8A6] text-sm">Change</button></div>
        </div>
        <div>
          <div className="text-sm text-white/60">Credits Balance</div>
          <div className="text-3xl font-semibold">142</div>
        </div>
      </div>

      {showPlan && (
        <div className="mt-6 bg-[#111214] rounded-3xl p-8 border border-white/10">
          <h3 className="font-semibold mb-4">Choose a plan</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-4 rounded-2xl border border-white/10">Free — $0/month</div>
            <div className="flex justify-between items-center p-4 rounded-2xl border border-[#14B8A6]">VIP — $29/month <span className="text-[#14B8A6]">Current</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
