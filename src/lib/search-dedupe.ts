/**
 * Search-results dedup — collapse seasons / movies of the same series down
 * to a single entry per page of results, the same way the recommendation
 * engine does for its candidates.
 */

import type { SearchItem } from "~/utils/api";
import { seriesKey, hasSeasonMarker } from "~/lib/series";

function itemTitle(item: SearchItem): string {
  return "title" in item ? item.title : item.name;
}

function isMovie(item: SearchItem): boolean {
  return "status" in item && item.status === "Movie";
}

/**
 * Lower rank = better representative for a series group:
 *   season 1 (no marker)  →  later seasons  →  movies (always last)
 * MAL ID breaks ties, so earlier / original entries win.
 */
function rank(item: SearchItem): number {
  if (isMovie(item)) return 2_000_000 + item.malId;
  if (hasSeasonMarker(itemTitle(item))) return 1_000_000 + item.malId;
  return item.malId;
}

/**
 * Collapse seasons / movies of the same series within a page of search
 * results to one entry per series. The representative is the best-ranked
 * entry the user hasn't already watched — so season 1 surfaces first, and
 * once it's watched the next season takes its place; movies rank last.
 * Original result order is otherwise preserved.
 */
export function dedupeSeriesResults(
  items: SearchItem[],
  watchedMalIds: ReadonlySet<number> = new Set(),
): SearchItem[] {
  const groups = new Map<string, SearchItem[]>();
  const order: string[] = [];
  for (const item of items) {
    const key = seriesKey(itemTitle(item));
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
      order.push(key);
    }
  }

  const result: SearchItem[] = [];
  for (const key of order) {
    const group = groups.get(key) ?? [];
    if (group.length <= 1) {
      const only = group[0];
      if (only) result.push(only);
      continue;
    }
    const sorted = [...group].sort((a, b) => rank(a) - rank(b));
    // Prefer the best-ranked entry the user hasn't watched; if they've seen
    // them all, fall back to the best-ranked overall.
    const rep = sorted.find((it) => !watchedMalIds.has(it.malId)) ?? sorted[0];
    if (rep) result.push(rep);
  }
  return result;
}
