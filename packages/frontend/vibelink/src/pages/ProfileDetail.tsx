import { useState } from "react";
import { useParams, Link } from "wouter";
import { mockProfiles } from "../lib/mockProfiles";
import { useApp } from "../context/AppContext";

export default function ProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const { spendCredits, credits } = useApp();
  const [tipAmount, setTipAmount] = useState(10);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipSuccess, setTipSuccess] = useState(false);

  const profile = mockProfiles.find((p) => p.id === id);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-3xl font-semibold mb-2">Profile not found</h1>
          <Link href="/profiles" className="text-[#14B8A6] hover:underline">Browse profiles</Link>
        </div>
      </div>
    );
  }

  const handleTip = () => {
    const success = spendCredits(tipAmount, `Tip to ${profile.name}`);
    
    if (success) {
      setTipSuccess(true);
      
      setTimeout(() => {
        setShowTipModal(false);
        setTipSuccess(false);
        setTipAmount(10);
      }, 1400);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link href="/profiles" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-8">
        ← Back to creators
      </Link>

      <div className="bg-[#111214] rounded-3xl border border-white/10 overflow-hidden">
        <div className="h-72 bg-zinc-800 relative flex items-center justify-center">
          <div className="text-[140px] opacity-90">{profile.avatar}</div>
          {profile.live && (
            <div className="absolute top-6 right-6 bg-red-500 px-4 py-1 rounded-full text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE NOW
            </div>
          )}
        </div>

        <div className="p-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-5xl font-semibold tracking-tight">{profile.name}</h1>
              <p className="text-xl text-white/70 mt-1">{profile.age} • {profile.location}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-semibold text-[#14B8A6]">{profile.followers}</div>
              <div className="text-sm text-white/60">followers</div>
            </div>
          </div>

          <p className="text-lg text-white/80 mt-8 max-w-2xl">{profile.bio}</p>

          <div className="flex flex-wrap gap-4 mt-10">
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-8 py-3 rounded-full font-medium transition-all ${isFollowing ? "bg-white/10" : "bg-[#14B8A6] text-black"}`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
            <button 
              onClick={() => setShowTipModal(true)} 
              className="px-8 py-3 rounded-full border border-white/20 hover:bg-white/5"
            >
              Send Tip
            </button>
            <button className="px-8 py-3 rounded-full border border-white/20 hover:bg-white/5">Message</button>
          </div>

          <div className="mt-8 text-sm text-white/50">Joined {profile.joined}</div>
        </div>
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#111214] rounded-2xl p-8 w-full max-w-sm border border-white/10">
            {!tipSuccess ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-semibold">Send a tip</h3>
                  <div className="text-sm text-white/60">Balance: ${credits}</div>
                </div>

                <div className="flex gap-2 mb-6">
                  {[5, 10, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setTipAmount(amt)}
                      className={`flex-1 py-2.5 rounded-full border text-sm transition-all ${tipAmount === amt ? "border-[#14B8A6] bg-[#14B8A6]/10 text-[#14B8A6]" : "border-white/20"}`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowTipModal(false)} 
                    className="flex-1 py-3 rounded-full border border-white/20 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleTip} 
                    className="flex-1 py-3 rounded-full bg-[#14B8A6] text-black font-medium disabled:opacity-50"
                    disabled={tipAmount > credits}
                  >
                    Send ${tipAmount}
                  </button>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <div className="text-xl font-semibold">Tip sent!</div>
                <div className="text-white/60 mt-1">Thank you for supporting {profile.name}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
