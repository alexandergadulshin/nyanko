/**
 * GET /api/recommendations
 *
 * Personalised anime recommendations for the signed-in user.
 *
 * Algorithm: content-based scoring against the user's watched list.
 * See `src/lib/recommendation.ts` for the engine.
 *
 * Pipeline:
 *   1. Auth via Clerk.
 *   2. Read the user's anime_list from Postgres.
 *   3. Hydrate each entry with full anime details via the cached
 *      multi-source API (Jikan + AniList).
 *   4. Pull a pool of candidates from the top-anime list.
 *   5. Score candidates against the user's taste profile and return
 *      the top N (default 10).
 *
 * Response shape:
 *   { recommendations: RecommendationResult[], sources: string[] }
 */

import { type NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { animeList } from "~/server/db/schema";
import { requireAuth, requireDatabase, withErrorHandling } from "~/lib/api-utils";
import { jikanAPI, type DetailedAnimeItem } from "~/utils/api";
import { multiSourceAPI } from "~/lib/multi-source";
import {
  recommend,
  type UserAnimeEntry,
  type RecommendationResult,
} from "~/lib/recommendation";

const DEFAULT_LIMIT = 10;
const CANDIDATE_POOL_SIZE = 25;

export const GET = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireAuth();
  const database = requireDatabase();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Number(searchParams.get("limit")) || DEFAULT_LIMIT,
    25,
  );

  /* ---------------- 1. User's history ---------------- */

  const listRows = await database
    .select()
    .from(animeList)
    .where(eq(animeList.userId, userId));

  // Hydrate each list entry with full anime details. Done in parallel —
  // each call is cached so most resolve in microseconds on warm cache.
  // We use `multiSourceAPI` so the user benefits from the combined
  // Jikan + AniList metadata.
  const hydratedEntries: UserAnimeEntry[] = [];
  await Promise.all(
    listRows.map(async (row) => {
      try {
        const details = await multiSourceAPI.getAnimeDetails(row.animeId);
        if (!details) return;
        hydratedEntries.push({
          malId: row.animeId,
          score: row.score,
          status: row.status,
          details,
        });
      } catch {
        // Skip entries that can't be hydrated.
      }
    }),
  );

  /* ---------------- 2. Candidate pool ---------------- */

  const topList = await jikanAPI.getTopAnime(CANDIDATE_POOL_SIZE).catch(() => []);
  const seenIds = new Set(hydratedEntries.map((e) => e.malId));

  const candidates: DetailedAnimeItem[] = [];
  await Promise.all(
    topList.map(async (a) => {
      if (seenIds.has(a.malId)) return;
      try {
        const detail = await multiSourceAPI.getAnimeDetails(a.malId);
        if (detail) candidates.push(detail);
      } catch {
        // Skip
      }
    }),
  );

  /* ---------------- 3. Score & rank ---------------- */

  const recommendations: RecommendationResult[] = recommend(
    hydratedEntries,
    candidates,
    { limit, excludeSeenMalIds: seenIds },
  );

  return NextResponse.json({
    recommendations,
    sources: multiSourceAPI.sources,
    profileSize: hydratedEntries.length,
    candidatesEvaluated: candidates.length,
  });
});
