/**
 * CRAVR — Activity status
 *
 * Gives every creator card a believable "online / last-active" signal so the
 * catalogue feels alive even when the API has no realtime presence data.
 * Status is derived deterministically from a stable seed (the username) so a
 * given creator always shows the same status across renders and pages.
 */

export type ActivityKind = "live" | "online" | "recent" | "today";

export interface Activity {
  kind: ActivityKind;
  label: string;
  dot: string;
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function deriveActivity(seed: string, isLive?: boolean): Activity {
  if (isLive) return { kind: "live", label: "Live now", dot: "#ef4444" };
  const h = hashSeed(seed || "x");
  const bucket = h % 100;
  if (bucket < 45) return { kind: "online", label: "Online now", dot: "#2ecc8a" };
  if (bucket < 80) {
    const hrs = 1 + (h % 6); // 1–6h ago
    return { kind: "recent", label: `Active ${hrs}h ago`, dot: "#f5a623" };
  }
  return { kind: "today", label: "Active today", dot: "rgba(255,255,255,0.4)" };
}

export function ActivityDot({
  seed,
  isLive,
  withLabel = true,
}: {
  seed: string;
  isLive?: boolean;
  withLabel?: boolean;
}) {
  const a = deriveActivity(seed, isLive);
  const pulse = a.kind === "live" || a.kind === "online";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={pulse ? "animate-pulse" : undefined}
        style={{
          width: 7,
          height: 7,
          borderRadius: "9999px",
          background: a.dot,
          boxShadow: pulse ? `0 0 6px ${a.dot}` : undefined,
          flexShrink: 0,
        }}
      />
      {withLabel && (
        <span className="text-xs font-medium" style={{ color: a.kind === "today" ? "rgba(255,255,255,0.4)" : a.dot }}>
          {a.label}
        </span>
      )}
    </span>
  );
}
