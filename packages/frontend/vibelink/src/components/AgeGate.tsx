import { useApp } from "@/context/AppContext";
import { useState } from "react";

export default function AgeGate({ children }: { children: React.ReactNode }) {
  const { ageVerified, setAgeVerified } = useApp();
  const [showGate, setShowGate] = useState(!ageVerified);

  if (!showGate) return <>{children}</>;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="bg-[#111214] p-8 rounded-2xl max-w-md text-center border border-[#333]">
        <h2 className="text-3xl font-bold mb-4">Age Verification</h2>
        <p className="text-muted-foreground mb-6">You must be 18+ to access this platform.</p>
        <button onClick={() => { setAgeVerified(true); setShowGate(false); }} className="bg-[#14B8A6] text-black px-8 py-3 rounded-full font-medium">I am 18 or older</button>
      </div>
    </div>
  );
}
