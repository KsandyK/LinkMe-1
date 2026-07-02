/**
 * CRAVR — Recently-viewed creators
 *
 * A tiny localStorage MRU list of creator ids the user has opened. Powers the
 * "For You" rail on the homepage and "Similar creators" recommendations
 * without needing any backend personalization service.
 */
const KEY = "vl_viewed_v1";
const MAX = 30;

export function recordView(id: string): void {
  if (!id) return;
  try {
    const arr: string[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    const next = [id, ...arr.filter(x => x !== id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* ignore */ }
}

export function getViewed(): string[] {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
