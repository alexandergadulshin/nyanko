/**
 * Candidate generation.
 *
 * Each strategy returns a hydrated DetailedAnimeItem[] from a specific
 * angle (similar-to-anchor, top-in-genre, currently-airing, discovery).
 * Lists are list-level cached for 30 min so subsequent users with
 * overlapping taste share the warm pool.
 *
 * Caller dedupes by malId across strategies, keeping the union of sources.
 */

import { aggregator, type DetailedAnimeItem } from "~/lib/aggregator";
import { cache, TTL } from "~/lib/cache";
import type {
  CandidateData,
  CandidateSource,
  TasteProfile,
  UserAnimeEntry,
} from "./types";
import { topGenreNames } from "./profile";

const PER_ANCHOR = 8;     // candidates per anchor for similar-to
const PER_GENRE = 10;     // candidates per top genre
const AIRING_POOL = 16;   // currently-airing pool size
const DISCOVERY_POOL = 12;

/* --------------------------- list-cache helper ---------------------------- */

/**
 * Cache the FULL hydrated list under one key so the per-item cache misses
 * only happen on the first warmup. Subsequent calls are O(1).
 */
async function cachedPool(
  key: string,
  ttlSeconds: number,
  produce: () => Promise<DetailedAnimeItem[]>,
): Promise<DetailedAnimeItem[]> {
  return cache.withCache(key, ttlSeconds, produce);
}

async function hydrate(ids: number[]): Promise<DetailedAnimeItem[]> {
  const results = await Promise.all(ids.map((id) => aggregator.anime.byId(id).catch(() => null)));
  return results.filter((r): r is DetailedAnimeItem => r !== null);
}

/* ----------------------------- 1. Similar-to ----------------------------- */

async function similarToAnchor(
  anchor: UserAnimeEntry,
): Promise<DetailedAnimeItem[]> {
  return cachedPool(
    `v1:rec:pool:similar:${anchor.malId}`,
    TTL.TOP_LISTS,
    async () => {
      const ids = await aggregator.anime.similarTo(anchor.malId, PER_ANCHOR);
      return hydrate(ids);
    },
  );
}

/* ----------------------------- 2. Top genre ----------------------------- */

let genreIdCache: Map<string, number> | null = null;
async function genreNameToId(): Promise<Map<string, number>> {
  if (genreIdCache) return genreIdCache;
  const genres = await aggregator.taxonomy.genres();
  const map = new Map<string, number>();
  for (const g of genres) map.set(g.name.toLowerCase(), g.mal_id);
  genreIdCache = map;
  return map;
}

async function topInGenre(genreId: number): Promise<DetailedAnimeItem[]> {
  return cachedPool(
    `v1:rec:pool:genre:${genreId}`,
    TTL.TOP_LISTS,
    async () => {
      const basics = await aggregator.anime.byGenre(genreId, PER_GENRE);
      return hydrate(basics.map((b) => b.malId));
    },
  );
}

/* ----------------------------- 3. Airing ----------------------------- */

async function currentlyAiringPool(): Promise<DetailedAnimeItem[]> {
  return cachedPool(
    `v1:rec:pool:airing:${AIRING_POOL}`,
    TTL.TOP_LISTS,
    async () => {
      const basics = await aggregator.anime.currentlyAiring(AIRING_POOL);
      return hydrate(basics.map((b) => b.malId));
    },
  );
}

/* ----------------------------- 4. Discovery ----------------------------- */

async function discoveryPool(): Promise<DetailedAnimeItem[]> {
  return cachedPool(
    `v1:rec:pool:discovery:${DISCOVERY_POOL}`,
    TTL.TOP_LISTS,
    async () => {
      // Highest-rated, broad. Scoring downstream picks the ones that
      // don't overlap heavily with the user's existing taste.
      const basics = await aggregator.anime.top(DISCOVERY_POOL);
      return hydrate(basics.map((b) => b.malId));
    },
  );
}

/* ============================== public surface ============================ */

/**
 * Generate candidates from all five strategies in parallel.
 * Returns a map (malId → CandidateData) where each value records which
 * strategies surfaced it. Excludes anime already in the user's list.
 */
export async function generateCandidates(
  profile: TasteProfile,
  excludeMalIds: Set<number>,
): Promise<{ candidates: Map<number, CandidateData>; strategies: CandidateSource[] }> {
  const topGenreList = topGenreNames(profile, 3);
  const genreMap = topGenreList.length > 0 ? await genreNameToId() : new Map<string, number>();
  const topGenreIds = topGenreList
    .map((name) => genreMap.get(name.toLowerCase()))
    .filter((id): id is number => typeof id === "number");

  // Fire every strategy in parallel.
  const anchorTasks = profile.anchors.slice(0, 3).map(async (a) => ({
    source: "similar" as const,
    anchor: { malId: a.malId, title: a.details.title },
    items: await similarToAnchor(a),
  }));

  const genreTasks = topGenreIds.map(async (id) => ({
    source: "genre" as const,
    anchor: undefined,
    items: await topInGenre(id),
  }));

  const airingTask = (async () => ({
    source: "airing" as const,
    anchor: undefined,
    items: await currentlyAiringPool(),
  }))();

  const discoveryTask = (async () => ({
    source: "discovery" as const,
    anchor: undefined,
    items: await discoveryPool(),
  }))();

  const all = await Promise.allSettled([
    ...anchorTasks,
    ...genreTasks,
    airingTask,
    discoveryTask,
  ]);

  const candidates = new Map<number, CandidateData>();
  const strategies = new Set<CandidateSource>();

  for (const r of all) {
    if (r.status !== "fulfilled") continue;
    const { source, anchor, items } = r.value;
    for (const item of items) {
      if (excludeMalIds.has(item.malId)) continue;
      strategies.add(source);
      const existing = candidates.get(item.malId);
      if (existing) {
        existing.sources.add(source);
        // Prefer the first anchor encountered (smaller seeds get earlier slots).
        if (!existing.anchor && anchor) existing.anchor = anchor;
      } else {
        candidates.set(item.malId, {
          details: item,
          sources: new Set([source]),
          anchor,
        });
      }
    }
  }

  return { candidates, strategies: Array.from(strategies) };
}

/**
 * Seed-only candidate generation, for `?seed=<malId>` mode.
 * Bypasses the user profile entirely.
 */
export async function generateSeedCandidates(
  seedMalId: number,
  excludeMalIds: Set<number>,
): Promise<{ candidates: Map<number, CandidateData>; strategies: CandidateSource[] }> {
  const ids = await aggregator.anime.similarTo(seedMalId, 30);
  const items = await hydrate(ids);
  // Resolve the seed's title for the anchor label.
  const seed = await aggregator.anime.byId(seedMalId).catch(() => null);
  const anchor = seed ? { malId: seedMalId, title: seed.title } : undefined;

  const candidates = new Map<number, CandidateData>();
  for (const item of items) {
    if (excludeMalIds.has(item.malId)) continue;
    if (item.malId === seedMalId) continue;
    candidates.set(item.malId, {
      details: item,
      sources: new Set<CandidateSource>(["similar"]),
      anchor,
    });
  }
  return { candidates, strategies: ["similar"] };
}
