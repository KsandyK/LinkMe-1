/**
 * CRAVR — Compact creator card
 *
 * The small cover + avatar + name + activity-status card used by the homepage
 * "For You" rail and the profile "Similar creators" rail. Extracted so both
 * stay visually identical.
 */
import { Link } from "wouter";
import { ActivityDot } from "@/components/ActivityStatus";

export interface CompactCreator {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  isLive?: boolean;
}

export function CompactCreatorCard({ c }: { c: CompactCreator }) {
  const name = c.displayName ?? c.username;
  const avatar = c.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}`;
  const cover = c.coverUrl ?? `https://picsum.photos/seed/${c.username}-cover/600/200`;
  return (
    <Link href={`/profile/${c.id}`}>
      <div className="vl-card vl-tier-card overflow-hidden cursor-pointer group">
        <div className="relative h-24 overflow-hidden">
          <img src={cover} alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(9,9,26,0.9) 0%, transparent 70%)" }} />
          {/* Hover reveal */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: "rgba(9,9,26,0.4)" }}>
            <span className="px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: c.isLive ? "rgba(239,68,68,0.95)" : "rgba(20,184,166,0.95)", color: c.isLive ? "#fff" : "#04121a" }}>
              {c.isLive ? "● Join Live" : "View →"}
            </span>
          </div>
          {c.isLive && (
            <div className="absolute top-2 left-2 vl-badge-live flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />LIVE
            </div>
          )}
          <img src={avatar} alt={name}
            className="absolute bottom-0 translate-y-1/2 left-3 w-10 h-10 rounded-full border-2 object-cover z-10"
            style={{ borderColor: "#14b8a6" }} />
        </div>
        <div className="p-3 pt-7">
          <p className="text-sm font-bold text-white truncate">{name}</p>
          <div className="mt-1"><ActivityDot seed={c.username} isLive={c.isLive} /></div>
        </div>
      </div>
    </Link>
  );
}
