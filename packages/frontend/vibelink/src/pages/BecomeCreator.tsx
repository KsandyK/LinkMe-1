import { useLocation } from "wouter";

export default function BecomeCreator() {
  const [, setLocation] = useLocation();

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-center">
      <h1 className="text-6xl font-semibold tracking-tight mb-6">Become a Creator</h1>
      <p className="text-xl text-white/70 mb-10">Start earning from your audience today. Set your own prices and keep more of what you earn.</p>

      <button 
        onClick={() => setLocation("/account")} 
        className="bg-[#14B8A6] text-black px-10 py-4 rounded-full text-lg font-medium"
      >
        Get Started — It's Free
      </button>

      <div className="mt-16 text-sm text-white/60 max-w-md mx-auto">
        No monthly fees. You only pay when you earn. Withdraw earnings anytime.
      </div>
    </div>
  );
}
