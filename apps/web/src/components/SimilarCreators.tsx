/**
 * CRAVR — "Similar creators" rail
 *
 * Shown at the bottom of a creator profile to keep browse sessions going.
 * Picks other creators from the catalogue, preferring the same gender/category
 * as the one being viewed, and falls back to filling with the rest so it's
 * never empty. Pure client-side — no recommendation backend required.
 */
import { Link } from "wouter";
import { MOCK_PROFILES } from "@/lib/mock-data";
import { ActivityDot } from "@/components/ActivityStatus";

export function SimilarCreators({
  currentId,
  gender,
  limit = 4,
}: {
  currentId: string;
  gender?: string;
  limit?: number;
}) {
  const pool = MOCK_PROFILES.filter(p => p.id !== currentId && p.username !== currentId);
  const sameVibe = gender ? pool.filter(p => p.gender === gender) : [];
  const rest = pool.filter(p => !sameVibe.includes(p));
  const picks = [...sameVibe, ...rest].slice(0, limit);

  if (picks.length === 0) return null;

  return (
    <div className="container mt-10 mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="vl-section-title">Similar creators</h2>
        <Link href="/profiles">
          <span className="text-sm font-semibold cursor-pointer" style={{ color: "#14b8a6" }}>Browse all →</span>
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {picks.map(p => {
          const avatar = p.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`;
          const cover = p.coverUrl ?? `https://picsum.photos/seed/${p.username}-cover/600/200`;
          return (
            <Link key={p.id} href={`/profile/${p.id}`}>
              <div className="vl-card vl-tier-card overflow-hidden cursor-pointer group">
                <div className="relative h-24 overflow-hidden">
                  <img src={cover} alt={p.displayName ?? p.username}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(9,9,26,0.9) 0%, transparent 70%)" }} />
                  {p.isLive && (
                    <div className="absolute top-2 left-2 vl-badge-live flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />LIVE
                    </div>
                  )}
                  <img src={avatar} alt={p.displayName ?? p.username}
                    className="absolute bottom-0 translate-y-1/2 left-3 w-10 h-10 rounded-full border-2 object-cover z-10"
                    style={{ borderColor: "#14b8a6" }} />
                </div>
                <div className="p-3 pt-7">
                  <p className="text-sm font-bold text-white truncate">{p.displayName ?? p.username}</p>
                  <div className="mt-1">
                    <ActivityDot seed={p.username} isLive={p.isLive} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
