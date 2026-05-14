/**
 * GET /api/recommendations
 *
 * Personalised anime recommendations for the signed-in user.
 * Powered by the engine in `src/lib/recommendation/`.
 *
 * Query parameters:
 *   limit  number  default 12, max 30
 *   seed   number  MAL ID; switches to "more like this" mode (ignores profile)
 *
 * Pipeline:
 *   1. Auth via Clerk
 *   2. Load anime_list + favorites for this user from Postgres
 *   3. Hydrate every entry with merged Jikan+AniList details (cached
 *      via the aggregator)
 *   4. Hand to the engine, which does profile → candidates → score →
 *      MMR diversity → explain → confidence
 *
 * Response:
 *   { recommendations: Recommendation[], meta: RecommendationMeta }
 */

import { type NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

import { animeList, favorites } from "~/server/db/schema";
import { requireAuth, requireDatabase, withErrorHandling } from "~/lib/api-utils";
import { aggregator } from "~/lib/aggregator";
import { recommend, type UserAnimeEntry } from "~/lib/recommendation";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireAuth();
  const database = requireDatabase();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 12, 30);
  const rawSeed = searchParams.get("seed");
  const seedMalId = rawSeed ? Number(rawSeed) : undefined;

  /* ----------------------- 1. user list + favorites ---------------------- */
  const [listRows, favRows] = await Promise.all([
    database.select().from(animeList).where(eq(animeList.userId, userId)),
    database
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.type, "anime"))),
  ]);

  const favoriteIds = new Set(favRows.map((f) => f.itemId));

  /* ---------------------- 2. hydrate every entry ------------------------- */
  // All calls go through the aggregator's per-item cache. Warm cache hits
  // resolve in microseconds; cold cache fans out to Jikan + AniList in
  // parallel under the per-source token-bucket rate limiter.
  const entries: UserAnimeEntry[] = (
    await Promise.all(
      listRows.map(async (row) => {
        const details = await aggregator.anime.byId(row.animeId).catch(() => null);
        if (!details) return null;
        return {
          malId: row.animeId,
          score: row.score,
          status: row.status,
          isFavorite: favoriteIds.has(row.animeId),
          details,
        } as UserAnimeEntry;
      }),
    )
  ).filter((e): e is UserAnimeEntry => e !== null);

  // Favorites the user added but never logged in their list — extra
  // positive signal we don't want to drop.
  const unlistedFavoriteIds = [...favoriteIds].filter(
    (id) => !entries.some((e) => e.malId === id),
  );
  const unlisted = (
    await Promise.all(
      unlistedFavoriteIds.map(async (id) => {
        const details = await aggregator.anime.byId(id).catch(() => null);
        if (!details) return null;
        return {
          malId: id,
          score: null,
          status: "completed", // favoriting implies engagement
          isFavorite: true,
          details,
        } as UserAnimeEntry;
      }),
    )
  ).filter((e): e is UserAnimeEntry => e !== null);

  entries.push(...unlisted);

  /* ------------------------------ 3. engine ------------------------------ */
  const result = await recommend({
    entries,
    limit,
    seedMalId:
      typeof seedMalId === "number" && !Number.isNaN(seedMalId)
        ? seedMalId
        : undefined,
  });

  return NextResponse.json(result);
});
