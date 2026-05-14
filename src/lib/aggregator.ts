/**
 * API aggregator — single public entry point for all anime/manga data.
 *
 * Internally fans out to MyAnimeList (via the Jikan REST API) and AniList
 * (GraphQL), then folds their responses into a normalized schema so the
 * rest of the app never has to know which source any field came from.
 *
 *   Request flow (anime.byId / anime.search):
 *     aggregator.anime.byId(id)
 *       → multiSourceAPI.getAnimeDetails(id)
 *         → Promise.allSettled([ jikanAPI.getAnimeById, anilistAPI.getAnimeById ])
 *             ↳ rateLimit("jikan")    → cache.withCache(...) → fetch jikan REST
 *             ↳ rateLimit("anilist")  → cache.withCache(...) → POST graphql
 *           → field-merge with pickPresent()
 *
 *   Request flow (single-source endpoints — top lists, taxonomy, etc.):
 *     aggregator.anime.top(20)
 *       → jikanAPI.getTopAnime(20)
 *         → rateLimit("jikan") → cache.withCache(TTL.TOP_LISTS, ...) → fetch
 *
 * Every read is gated by:
 *   1. Per-source token-bucket rate limiter (src/lib/rate-limiter.ts)
 *      Jikan: 2 req/s sustained, burst 5
 *      AniList: 1.4 req/s sustained, burst 5
 *   2. TTL'd cache (src/lib/cache.ts) — Upstash when configured,
 *      in-memory LRU fallback otherwise. Key namespacing in cache-keys.ts.
 *
 * All exported types are normalized — downstream code never imports raw
 * Jikan/AniList shapes.
 */

import { jikanAPI } from "~/utils/api";
import { multiSourceAPI } from "./multi-source";
import { cache } from "./cache";
import { cacheKey } from "./cache-keys";

/* --------------------------- Normalized schema ---------------------------- */

export type {
  AnimeItem,
  DetailedAnimeItem,
  MangaItem,
  CharacterItem,
  PersonItem,
  GenreItem,
  SearchCategory,
  SearchItem,
} from "~/utils/api";

export { TTL } from "./cache";

export type Source = "myanimelist" | "anilist";

/* ------------------------------- Facade ----------------------------------- */

export const aggregator = {
  /**
   * Anime data. `byId` and `search` go through both sources and merge;
   * the rest hit Jikan only (no AniList equivalent in our coverage).
   */
  anime: {
    /** Cross-source: Jikan + AniList merged on a field-by-field basis. */
    byId: (malId: number) => multiSourceAPI.getAnimeDetails(malId),
    /** Cross-source: results from both sources, deduped by MAL ID, sorted. */
    search: (query: string, limit = 20) => multiSourceAPI.searchAnime(query, limit),
    /** Jikan: top-ranked. */
    top: (limit = 20) => jikanAPI.getTopAnime(limit),
    /** Jikan: currently airing this season. */
    currentlyAiring: (limit = 20) => jikanAPI.getCurrentlyAiring(limit),
    /** Jikan: announced for the upcoming season. */
    upcoming: (limit = 20) => jikanAPI.getUpcomingAnime(limit),
    /** Jikan: filtered by genre ID (see taxonomy.genres). */
    byGenre: (genreId: number, limit = 20) => jikanAPI.getAnimeByGenre(genreId, limit),
    /** Jikan: filtered by airing status. */
    byStatus: (status: "airing" | "complete" | "upcoming", limit = 20) =>
      jikanAPI.getAnimeByStatus(status, limit),
    /**
     * Jikan-curated "if you liked X, try Y" list for a given anime.
     * Returns only MAL IDs — hydrate with `aggregator.anime.byId` to get
     * the merged record. Used by the recommendation engine as the
     * primary signal for similar-to-anchor strategies.
     */
    similarTo: (malId: number, limit = 25) =>
      jikanAPI.getAnimeRecommendations(malId, limit),
  },

  manga: {
    top: (limit = 20) => jikanAPI.getTopManga(limit),
    search: (query: string, limit = 20) => jikanAPI.searchManga(query, limit),
    /** Cached single-manga detail (TTL.ITEM_DETAILS = 1h). */
    byId: (malId: number) => jikanAPI.getMangaById(malId),
  },

  character: {
    top: (limit = 20) => jikanAPI.getTopCharacters(limit),
    search: (query: string, limit = 20) => jikanAPI.searchCharacters(query, limit),
    /** Cached "full" character record (animeography, mangaography, voice actors). */
    byId: (malId: number) => jikanAPI.getCharacterFullById(malId),
  },

  person: {
    top: (limit = 20) => jikanAPI.getTopPeople(limit),
    search: (query: string, limit = 20) => jikanAPI.searchPeople(query, limit),
    /** Cached "full" person record (anime credits, manga credits, voice roles). */
    byId: (malId: number) => jikanAPI.getPersonFullById(malId),
  },

  taxonomy: {
    /** Jikan: full genre list. Aggressive TTL (24h) — taxonomy is static. */
    genres: () => jikanAPI.getGenres(),
  },

  /** Convenience: one-shot search across anime/characters/people/manga. */
  search: (
    query: string,
    category: "anime" | "characters" | "people" | "manga",
    limit = 20,
  ) => jikanAPI.searchMultiCategory(query, category, limit),

  /* ------------------------------ Cache ops ------------------------------- */
  cache: {
    /**
     * Invalidate cached records for a specific anime across all sources.
     * Useful when external metadata is known to have changed (e.g. after
     * an admin import or a stale-result complaint from a user).
     */
    invalidate: {
      anime: async (malId: number) => {
        await Promise.all([
          cache.del(cacheKey.jikan.animeById(malId)),
          cache.del(cacheKey.anilist.animeById(malId)),
        ]);
      },
      genres: () => cache.del(cacheKey.jikan.genres()),
      /** Drop a specific cache key. Escape hatch — prefer typed methods above. */
      raw: (key: string) => cache.del(key),
    },
    /** Read-through; null on miss. Mostly for diagnostics. */
    get: <T>(key: string) => cache.get<T>(key),
  },

  /** Sources this aggregator can reach. */
  sources: ["myanimelist", "anilist"] as readonly Source[],

  /**
   * Configuration introspection. No external network calls — just reports
   * which backends are wired up and how the rate limiter is configured.
   */
  health(): AggregatorHealth {
    const upstashConfigured = !!(
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    );
    return {
      sources: { myanimelist: "configured", anilist: "configured" },
      cache: { backend: upstashConfigured ? "upstash" : "memory" },
      rateLimits: {
        jikan: { rate: 2, capacity: 5 },
        anilist: { rate: 1.4, capacity: 5 },
      },
    };
  },
} as const;

export interface AggregatorHealth {
  sources: Record<Source, "configured" | "missing">;
  cache: { backend: "upstash" | "memory" };
  rateLimits: Record<"jikan" | "anilist", { rate: number; capacity: number }>;
}
