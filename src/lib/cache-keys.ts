/**
 * Centralised cache-key generation.
 *
 * Keep all key formats here so we never collide between sources and so
 * invalidation patterns are easy to find. Each key is namespaced by
 * source (e.g. `jikan:`, `anilist:`) so we can purge one source at
 * a time during outages or schema migrations.
 */

const V = "v1"; // bump to invalidate the whole cache after schema change

const join = (...parts: (string | number)[]) =>
  [V, ...parts.map((p) => String(p))].join(":");

export const cacheKey = {
  jikan: {
    animeById: (id: number | string) => join("jikan", "anime", id),
    searchAnime: (q: string, limit: number) => join("jikan", "search-anime", q.toLowerCase(), limit),
    searchCharacters: (q: string, limit: number) => join("jikan", "search-chars", q.toLowerCase(), limit),
    searchPeople: (q: string, limit: number) => join("jikan", "search-people", q.toLowerCase(), limit),
    searchManga: (q: string, limit: number) => join("jikan", "search-manga", q.toLowerCase(), limit),
    topAnime: (limit: number) => join("jikan", "top-anime", limit),
    topManga: (limit: number) => join("jikan", "top-manga", limit),
    genres: () => join("jikan", "genres"),
    seasonal: (year: number, season: string) => join("jikan", "seasonal", year, season),
  },
  anilist: {
    animeById: (id: number | string) => join("anilist", "anime", id),
    searchAnime: (q: string, limit: number) => join("anilist", "search-anime", q.toLowerCase(), limit),
  },
} as const;
