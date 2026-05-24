import { useState } from "react";

export default function Rewards() {
  const [tab, setTab] = useState<"credits" | "gifts" | "boosts">("credits");

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-5xl font-semibold tracking-tight mb-3">Rewards</h1>
      <p className="text-white/60 mb-10">Earn credits, send gifts, and boost your favorite creators.</p>

      <div className="flex gap-2 mb-8 border-b border-white/10">
        {(["credits", "gifts", "boosts"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-8 py-3 text-sm capitalize transition-all ${tab === t ? "border-b-2 border-[#14B8A6] text-white" : "text-white/60 hover:text-white"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "credits" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[50, 100, 250].map((amt) => (
            <div key={amt} className="bg-[#111214] rounded-3xl p-8 text-center border border-white/10">
              <div className="text-6xl font-semibold text-[#14B8A6] mb-1">${amt}</div>
              <div className="text-white/60 mb-8">Credits</div>
              <button className="w-full bg-[#14B8A6] text-black py-3 rounded-full font-medium">Purchase</button>
            </div>
          ))}
        </div>
      )}

      {tab !== "credits" && (
        <div className="bg-[#111214] rounded-3xl p-12 text-center text-white/60 border border-white/10">
          {tab === "gifts" ? "Gift store coming soon" : "Boosts coming soon"}
        </div>
      )}
    </div>
  );
}
