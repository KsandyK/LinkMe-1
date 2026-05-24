import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top Navigation */}
      <div className="flex justify-between items-center px-8 py-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#14B8A6] rounded-full" />
          <span className="text-2xl font-semibold tracking-tight">LinkMe</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <button onClick={() => setLocation("/profiles")} className="px-4 py-2 hover:text-[#14B8A6]">Explore</button>
          <button onClick={() => setLocation("/become-creator")} className="px-5 py-2 rounded-full border border-white/70 hover:bg-white hover:text-black transition-all">Become a Creator</button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 -mt-12">
        <div className="max-w-3xl">
          <h1 className="text-7xl font-semibold tracking-tighter mb-4">
            Connect.<br />Create.<br />Earn.
          </h1>
          <p className="text-xl text-white/70 mb-10 max-w-md mx-auto">
            The premium platform where creators and fans connect directly.
          </p>

          <div className="flex justify-center gap-4">
            <button 
              onClick={() => setLocation("/profiles")}
              className="bg-white text-black px-8 py-3.5 rounded-full font-medium text-lg hover:bg-[#14B8A6] hover:text-white transition-all"
            >
              Browse Creators
            </button>
            <button 
              onClick={() => setLocation("/become-creator")}
              className="border border-white/70 px-8 py-3.5 rounded-full font-medium text-lg hover:bg-white hover:text-black transition-all"
            >
              Start Creating
            </button>
          </div>
        </div>
      </div>

      {/* Bottom subtle bar */}
      <div className="text-center py-8 text-sm text-white/50">
        Trusted by thousands of creators worldwide
      </div>
    </div>
  );
}
