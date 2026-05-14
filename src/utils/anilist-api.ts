/**
 * AniList GraphQL client.
 *
 * Second data source alongside Jikan/MyAnimeList. Same rate-limit + cache
 * conventions are applied: `rateLimit("anilist")` token bucket and
 * `cache.withCache(...)` keyed by the AniList query.
 *
 * AniList's free GraphQL endpoint: https://graphql.anilist.co
 * Rate limit: 90 req/min (~1.5/s) — see https://docs.anilist.co/guide/rate-limiting
 *
 * Schema normalization: AniList returns a richer shape than Jikan. We
 * map it down to our internal AnimeItem / DetailedAnimeItem types so
 * downstream code can treat both sources uniformly.
 */

import type { AnimeItem, DetailedAnimeItem } from "./api";
import { cache, TTL } from "~/lib/cache";
import { cacheKey } from "~/lib/cache-keys";
import { rateLimit } from "~/lib/rate-limiter";

const ANILIST_GRAPHQL = "https://graphql.anilist.co";

/* ------------------------------- GraphQL shapes ------------------------------ */

interface AniListMedia {
  id: number;
  idMal: number | null;
  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
  };
  type: "ANIME" | "MANGA" | null;
  format: string | null;
  status: string | null;
  description: string | null;
  startDate: { year: number | null; month: number | null; day: number | null } | null;
  endDate: { year: number | null; month: number | null; day: number | null } | null;
  season: string | null;
  seasonYear: number | null;
  episodes: number | null;
  duration: number | null;
  averageScore: number | null;
  meanScore: number | null;
  popularity: number | null;
  favourites: number | null;
  trending: number | null;
  genres: string[];
  studios: { nodes: Array<{ id: number; name: string }> };
  coverImage: {
    extraLarge: string | null;
    large: string | null;
    medium: string | null;
  };
  bannerImage: string | null;
}

interface AniListResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

/* ------------------------------- Transformers ------------------------------ */

function pickTitle(t: AniListMedia["title"]): string {
  return t.english ?? t.romaji ?? t.native ?? "Untitled";
}

function statusFromAniList(status: string | null, format: string | null): AnimeItem["status"] {
  if (format === "MOVIE") return "Movie";
  if (status === "RELEASING") return "Airing Now";
  if (status === "NOT_YET_RELEASED") return "Scheduled";
  return "Finished";
}

function toAnimeItem(m: AniListMedia): AnimeItem {
  return {
    id: m.idMal ?? m.id,
    malId: m.idMal ?? m.id,
    title: pickTitle(m.title),
    description: m.description ?? "",
    image: m.coverImage.large ?? m.coverImage.extraLarge ?? m.coverImage.medium ?? "",
    status: statusFromAniList(m.status, m.format),
    favorites: m.favourites ?? 0,
    rating: m.averageScore != null ? m.averageScore / 10 : 0,
    episodes: m.episodes,
  };
}

function toDetailedAnimeItem(m: AniListMedia): DetailedAnimeItem {
  const base = toAnimeItem(m);
  return {
    ...base,
    titleJapanese: m.title.native,
    episodes: m.episodes,
    type: m.format ?? "TV",
    score: m.averageScore != null ? m.averageScore / 10 : null,
    scoredBy: null,
    rank: null,
    popularity: m.popularity,
    year: m.seasonYear ?? m.startDate?.year ?? null,
    season: m.season ?? null,
    broadcast: null,
    producers: [],
    studios: m.studios.nodes.map((s) => s.name),
    genres: m.genres,
    themes: [],
    demographics: [],
    duration: m.duration != null ? `${m.duration} min per ep` : null,
    ageRating: null,
    aired: {
      from: formatDate(m.startDate),
      to: formatDate(m.endDate),
    },
  };
}

function formatDate(d: AniListMedia["startDate"]): string | null {
  if (!d || !d.year) return null;
  const yyyy = String(d.year).padStart(4, "0");
  const mm = String(d.month ?? 1).padStart(2, "0");
  const dd = String(d.day ?? 1).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* ------------------------------ GraphQL plumbing ----------------------------- */

const MEDIA_FIELDS = `
  id
  idMal
  title { romaji english native }
  type
  format
  status
  description(asHtml: false)
  startDate { year month day }
  endDate { year month day }
  season
  seasonYear
  episodes
  duration
  averageScore
  meanScore
  popularity
  favourites
  trending
  genres
  studios(isMain: true) { nodes { id name } }
  coverImage { extraLarge large medium }
  bannerImage
`;

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  await rateLimit("anilist");
  const res = await fetch(ANILIST_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`AniList HTTP ${res.status}`);
  const json = (await res.json()) as AniListResponse<T>;
  if (json.errors?.length) {
    throw new Error(`AniList GraphQL: ${json.errors.map((e) => e.message).join("; ")}`);
  }
  return json.data;
}

/* --------------------------------- Public API -------------------------------- */

class AniListAPIService {
  async getAnimeById(idMal: number): Promise<DetailedAnimeItem | null> {
    return cache.withCache(
      cacheKey.anilist.animeById(idMal),
      TTL.ITEM_DETAILS,
      async () => {
        try {
          const data = await gql<{ Media: AniListMedia | null }>(
            `query ($idMal: Int) { Media(idMal: $idMal, type: ANIME) { ${MEDIA_FIELDS} } }`,
            { idMal },
          );
          return data.Media ? toDetailedAnimeItem(data.Media) : null;
        } catch (err) {
          console.warn(`[anilist] getAnimeById(${idMal}) failed:`, err);
          return null;
        }
      },
    );
  }

  async searchAnime(query: string, limit = 20): Promise<AnimeItem[]> {
    if (query.trim().length < 2) return [];
    return cache.withCache(
      cacheKey.anilist.searchAnime(query, limit),
      TTL.SEARCH,
      async () => {
        try {
          const data = await gql<{ Page: { media: AniListMedia[] } }>(
            `query ($q: String, $limit: Int) {
               Page(perPage: $limit) {
                 media(search: $q, type: ANIME, sort: POPULARITY_DESC) { ${MEDIA_FIELDS} }
               }
             }`,
            { q: query, limit },
          );
          return data.Page.media.map(toAnimeItem);
        } catch (err) {
          console.warn(`[anilist] searchAnime("${query}") failed:`, err);
          return [];
        }
      },
    );
  }
}

export const anilistAPI = new AniListAPIService();
