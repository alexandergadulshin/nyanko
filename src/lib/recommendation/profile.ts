/**
 * Taste profile builder.
 *
 * Turns a user's anime list into a sparse tag-weight vector that we score
 * candidates against. Two independent signals — engagement (from status)
 * and preference (from score) — are kept additive instead of multiplicative
 * so e.g. "dropped at 9" still registers as a positive signal (the user
 * loved it even though they didn't finish).
 *
 * Tag namespaces:
 *   genre:<name>  weight 1.0
 *   theme:<name>  weight 0.7
 *   studio:<name> weight 0.6
 *   demo:<name>   weight 0.4
 *
 * Anchors are the top positive entries; the candidate generator uses them
 * for "similar-to" lookups.
 */

import type { UserAnimeEntry, TasteProfile } from "./types";

const TAG_TYPE_WEIGHT = {
  genre: 1.0,
  theme: 0.7,
  studio: 0.6,
  demo: 0.4,
} as const;

/** How engaged the user was with this entry, regardless of rating. */
function engagement(status: string): number {
  switch (status.toLowerCase()) {
    case "completed":  return 1.0;
    case "watching":   return 0.85;
    case "paused":     return 0.45;
    case "planning":   return 0.2;
    case "dropped":    return 0.4; // they tried it; score still matters
    default:           return 0.5;
  }
}

/**
 * Map a user's 1-10 score (centered around their mean) into a contribution
 * direction in roughly [-1, +1]. A user who rates everything 8-10 will have
 * 9 be neutral; a user who rates everything 4-6 will have 5 be neutral.
 * For unrated entries, contribute 0.3 (mild positive — they engaged with it).
 */
function preference(score: number | null, mean: number): number {
  if (score === null) return 0.3;
  const centered = (score - mean) / 4; // 4 = spread normalizer
  return Math.max(-1, Math.min(1, centered));
}

/** Per-entry signed contribution before being distributed across tags. */
function entrySignal(entry: UserAnimeEntry, mean: number): number {
  const eng = engagement(entry.status);
  const pref = preference(entry.score, mean);
  // Favorites are an explicit positive curation step — boost.
  const favoriteBoost = entry.isFavorite ? 1.3 : 1.0;
  return eng * pref * favoriteBoost;
}

function computeMean(entries: UserAnimeEntry[]): number {
  const scored = entries.filter((e) => e.score !== null) as Array<
    UserAnimeEntry & { score: number }
  >;
  if (scored.length === 0) return 7; // sensible default for anime lists
  const sum = scored.reduce((s, e) => s + e.score, 0);
  return sum / scored.length;
}

/**
 * Walk every (tag, weight) pair the profile expresses, in
 * deterministic descending-magnitude order. Used by callers that want
 * to peek at top genres / studios without depending on Map iteration.
 */
function sortedTags(weights: Map<string, number>): Array<[string, number]> {
  return Array.from(weights.entries()).sort(
    (a, b) => Math.abs(b[1]) - Math.abs(a[1]),
  );
}

export function buildTasteProfile(entries: UserAnimeEntry[]): TasteProfile {
  const weights = new Map<string, number>();
  const mean = computeMean(entries);

  const bump = (tag: string, delta: number) => {
    if (!tag || tag.trim() === "" || delta === 0) return;
    weights.set(tag, (weights.get(tag) ?? 0) + delta);
  };

  for (const e of entries) {
    const signal = entrySignal(e, mean);
    if (signal === 0) continue;
    for (const g of e.details.genres)        bump(`genre:${g}`, signal * TAG_TYPE_WEIGHT.genre);
    for (const t of e.details.themes)        bump(`theme:${t}`, signal * TAG_TYPE_WEIGHT.theme);
    for (const s of e.details.studios)       bump(`studio:${s}`, signal * TAG_TYPE_WEIGHT.studio);
    for (const d of e.details.demographics)  bump(`demo:${d}`, signal * TAG_TYPE_WEIGHT.demo);
  }

  /* --------------------------- derived selections ------------------------- */

  // Anchors: completed/watching with score >= 8 (or favorited). These are
  // the entries strong enough to do "similar to X" lookups against.
  const anchors: UserAnimeEntry[] = entries
    .filter((e) => {
      if (e.isFavorite) return true;
      const status = e.status.toLowerCase();
      const goodStatus = status === "completed" || status === "watching";
      const goodScore = (e.score ?? 0) >= 8;
      return goodStatus && goodScore;
    })
    .sort((a, b) => {
      // Favorites first, then by score descending.
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      return (b.score ?? 0) - (a.score ?? 0);
    })
    .slice(0, 5);

  // Top genres / studios for downstream pool generation.
  const ordered = sortedTags(weights);
  const topGenres = ordered
    .filter(([k, v]) => k.startsWith("genre:") && v > 0)
    .slice(0, 4)
    .map(([k]) => k.slice("genre:".length));
  const topStudios = ordered
    .filter(([k, v]) => k.startsWith("studio:") && v > 0)
    .slice(0, 3)
    .map(([k]) => k.slice("studio:".length));

  return {
    weights,
    size: entries.length,
    anchors,
    topGenreIds: [], // populated by caller after resolving genre name → ID
    topStudios,
    meanScore: mean,
    // attach top genre names too so the caller can resolve to IDs:
    // we encode them via topGenreIds (filled later) and a separate property.
    // Adding extra prop is fine because TasteProfile is opaque to callers.
    ...({ topGenreNames: topGenres } as Record<string, unknown>),
  };
}

/** Convenience: top N genres by name from the profile, positive weights only. */
export function topGenreNames(profile: TasteProfile, n: number): string[] {
  return Array.from(profile.weights.entries())
    .filter(([k, v]) => k.startsWith("genre:") && v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k.slice("genre:".length));
}
