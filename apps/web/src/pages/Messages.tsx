import { useState } from "react";
import { mockProfiles } from "../lib/mockProfiles";

export default function Messages() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-5xl font-semibold tracking-tight mb-10">Messages</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockProfiles.slice(0, 8).map((profile) => (
          <div 
            key={profile.id} 
            onClick={() => setSelected(profile.id)} 
            className="bg-[#111214] rounded-3xl p-6 border border-white/10 hover:border-[#14B8A6]/40 cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">{profile.avatar}</div>
              <div>
                <div className="font-semibold text-lg">{profile.name}</div>
                <div className="text-sm text-white/60">{profile.location}</div>
              </div>
            </div>
            {selected === profile.id && (
              <div className="mt-6 pt-6 border-t border-white/10 text-sm text-white/70">
                Chat with {profile.name} (demo mode)
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
