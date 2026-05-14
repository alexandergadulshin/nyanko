/**
 * Multi-source anime API aggregator.
 *
 * Combines Jikan/MyAnimeList (primary) and AniList GraphQL (secondary)
 * into a single service surface. Every call fans out to both sources
 * in parallel; we then merge the results, preferring the more complete
 * record on a field-by-field basis. If one source fails, we transparently
 * fall back to the other.
 *
 * The output shape is the existing `DetailedAnimeItem` / `AnimeItem`
 * type so all downstream UI code keeps working unchanged.
 */

import { jikanAPI, type AnimeItem, type DetailedAnimeItem } from "~/utils/api";
import { anilistAPI } from "~/utils/anilist-api";

/** Pick the value that's actually present (non-null, non-empty). */
function pickPresent<T>(...values: (T | null | undefined)[]): T | null {
  for (const v of values) {
    if (v === null || v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (typeof v === "number" && v === 0) continue;
    return v;
  }
  // Fall back to last non-null even if empty/0
  return values.find((v) => v !== null && v !== undefined) ?? null;
}

function mergeAnimeItem(jikan: AnimeItem | null, anilist: AnimeItem | null): AnimeItem | null {
  if (!jikan && !anilist) return null;
  if (!jikan) return anilist;
  if (!anilist) return jikan;
  return {
    id: jikan.id || anilist.id,
    malId: jikan.malId || anilist.malId,
    title: pickPresent(jikan.title, anilist.title) ?? "Untitled",
    description: pickPresent(jikan.description, anilist.description) ?? "",
    image: pickPresent(jikan.image, anilist.image) ?? "",
    status: jikan.status, // Jikan is authoritative on airing status
    favorites: Math.max(jikan.favorites, anilist.favorites),
    rating: jikan.rating || anilist.rating,
    episodes: pickPresent(jikan.episodes, anilist.episodes),
  };
}

function mergeDetailed(
  jikan: DetailedAnimeItem | null,
  anilist: DetailedAnimeItem | null,
): DetailedAnimeItem | null {
  if (!jikan && !anilist) return null;
  if (!jikan) return anilist;
  if (!anilist) return jikan;

  const base = mergeAnimeItem(jikan, anilist)!;
  return {
    ...base,
    titleJapanese: pickPresent(jikan.titleJapanese, anilist.titleJapanese),
    episodes: pickPresent(jikan.episodes, anilist.episodes),
    type: pickPresent(jikan.type, anilist.type) ?? "TV",
    score: pickPresent(jikan.score, anilist.score),
    scoredBy: pickPresent(jikan.scoredBy, anilist.scoredBy),
    rank: pickPresent(jikan.rank, anilist.rank),
    popularity: pickPresent(jikan.popularity, anilist.popularity),
    year: pickPresent(jikan.year, anilist.year),
    season: pickPresent(jikan.season, anilist.season),
    broadcast: pickPresent(jikan.broadcast, anilist.broadcast),
    // Union the lists so we get the richest possible metadata
    producers: dedupe([...jikan.producers, ...anilist.producers]),
    studios: dedupe([...jikan.studios, ...anilist.studios]),
    genres: dedupe([...jikan.genres, ...anilist.genres]),
    themes: dedupe([...jikan.themes, ...anilist.themes]),
    demographics: dedupe([...jikan.demographics, ...anilist.demographics]),
    duration: pickPresent(jikan.duration, anilist.duration),
    ageRating: pickPresent(jikan.ageRating, anilist.ageRating),
    aired: {
      from: pickPresent(jikan.aired.from, anilist.aired.from),
      to: pickPresent(jikan.aired.to, anilist.aired.to),
    },
  };
}

function dedupe(xs: string[]): string[] {
  return Array.from(new Set(xs.filter((x) => x && x.trim() !== "")));
}

/* -------------------------------- Public API -------------------------------- */

export const multiSourceAPI = {
  /**
   * Fetch full anime details by MAL ID, fanning out to Jikan and AniList
   * in parallel. Returns a merged record favouring the more complete
   * data on each field. Returns null only if both sources fail.
   */
  async getAnimeDetails(malId: number): Promise<DetailedAnimeItem | null> {
    const [jResult, aResult] = await Promise.allSettled([
      jikanAPI.getAnimeById(malId),
      anilistAPI.getAnimeById(malId),
    ]);
    const j = jResult.status === "fulfilled" ? jResult.value : null;
    const a = aResult.status === "fulfilled" ? aResult.value : null;
    return mergeDetailed(j, a);
  },

  /**
   * Search both sources in parallel, deduplicate by MAL ID, and return
   * the merged record set sorted by combined favorites/rating signal.
   */
  async searchAnime(query: string, limit = 20): Promise<AnimeItem[]> {
    if (query.trim().length < 2) return [];
    const [jResult, aResult] = await Promise.allSettled([
      jikanAPI.searchAnime?.(query, limit) ?? Promise.resolve<AnimeItem[]>([]),
      anilistAPI.searchAnime(query, limit),
    ]);
    const j: AnimeItem[] = jResult.status === "fulfilled" && Array.isArray(jResult.value) ? jResult.value : [];
    const a: AnimeItem[] = aResult.status === "fulfilled" ? aResult.value : [];

    // Index AniList by MAL ID, merge with Jikan, then append AniList-only
    const byMalId = new Map<number, AnimeItem>();
    for (const item of j) byMalId.set(item.malId, item);
    for (const item of a) {
      const existing = byMalId.get(item.malId);
      byMalId.set(item.malId, existing ? mergeAnimeItem(existing, item)! : item);
    }
    return Array.from(byMalId.values())
      .sort((x, y) => (y.favorites - x.favorites) || (y.rating - x.rating))
      .slice(0, limit);
  },

  /** Which sources are currently usable. Useful for ops / health checks. */
  sources: ["myanimelist", "anilist"] as const,
};
