import { useState } from "react";
import { Link } from "wouter";
import { mockProfiles } from "../lib/mockProfiles";

export default function Profiles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "offline">("all");

  const filteredProfiles = mockProfiles.filter((profile) => {
    const matchesSearch =
      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "live" && profile.live) ||
      (statusFilter === "offline" && !profile.live);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Browse Profiles</h1>
        
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-[#111214] border border-[#333] rounded-xl px-5 py-3 text-white"
          />
          <div className="flex gap-2">
            <button onClick={() => setStatusFilter("all")} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${statusFilter === "all" ? "bg-[#14B8A6] text-white" : "bg-[#1a1c20] text-white hover:bg-[#333]"}`}>All</button>
            <button onClick={() => setStatusFilter("live")} className={`px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${statusFilter === "live" ? "bg-[#14B8A6] text-white" : "bg-[#1a1c20] text-white hover:bg-[#333]"}`}><span className="w-2 h-2 rounded-full bg-red-500"></span> Live Now</button>
            <button onClick={() => setStatusFilter("offline")} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${statusFilter === "offline" ? "bg-[#14B8A6] text-white" : "bg-[#1a1c20] text-white hover:bg-[#333]"}`}>Offline</button>
          </div>
        </div>

        <p className="text-muted-foreground mb-6">{filteredProfiles.length} profiles found</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filteredProfiles.map((profile) => (
            <Link key={profile.id} href={`/profile/${profile.id}`}>
              <div className="bg-[#111214] rounded-2xl overflow-hidden border border-[#222] hover:border-[#14B8A6]/50 transition-all group cursor-pointer">
                <div className="relative h-48 bg-zinc-800">
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
                  <div className="absolute bottom-4 left-4 text-6xl">{profile.avatar}</div>
                  {profile.live && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-lg group-hover:text-[#14B8A6] transition-colors">{profile.name}</h3>
                    <span className="text-sm text-muted-foreground">{profile.age}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{profile.location}</p>
                  <p className="text-sm line-clamp-2 text-[#a0aec0]">{profile.bio}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
