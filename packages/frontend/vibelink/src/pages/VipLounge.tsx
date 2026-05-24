import { Link } from "wouter";

export default function VipLounge() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-center">
      <div className="text-7xl mb-6">👑</div>
      <h1 className="text-6xl font-semibold tracking-tight mb-4">VIP Lounge</h1>
      <p className="text-2xl text-white/70 mb-12">Exclusive access for our most dedicated fans.</p>

      <div className="max-w-md mx-auto bg-[#111214] rounded-3xl p-10 border border-white/10">
        <div className="space-y-4 text-left mb-10">
          <div>✓ Priority chat access</div>
          <div>✓ Exclusive monthly content drops</div>
          <div>✓ 20% off all tips and gifts</div>
          <div>✓ Early access to new creators</div>
        </div>
        <Link href="/become-creator" className="block bg-[#14B8A6] text-black py-3.5 rounded-full font-semibold">Join VIP — $29/month</Link>
      </div>
    </div>
  );
}
