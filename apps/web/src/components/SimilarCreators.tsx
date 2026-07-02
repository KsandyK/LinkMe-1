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
import { CompactCreatorCard } from "@/components/CompactCreatorCard";

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
        {picks.map(p => (
          <CompactCreatorCard key={p.id} c={p} />
        ))}
      </div>
    </div>
  );
}
