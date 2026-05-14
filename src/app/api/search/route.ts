/**
 * GET /api/search
 *
 * Unified, server-side search across anime / manga / characters / people.
 * Every search surface on the site funnels through here, so they all share
 * the Redis cache and the global per-source rate limiter instead of each
 * browser hitting Jikan directly.
 *
 * Query parameters:
 *   q             string  search query (optional — empty browses top picks)
 *   category      string  anime | manga | characters | people  (default anime)
 *   page          number  1-based page (default 1)
 *   limit         number  results per page (default 24, max 25)
 *   type          string  Jikan type filter      (anime / manga)
 *   status        string  Jikan status filter    (anime / manga)
 *   rating        string  Jikan content rating   (anime)
 *   genres        string  comma-separated genre IDs to include (anime / manga)
 *   excludeGenres string  comma-separated genre IDs to exclude (anime / manga)
 *   minScore      number  minimum score          (anime / manga)
 *   orderBy       string  Jikan order_by field
 *   sort          string  asc | desc
 *
 * Response: { items, page, hasNextPage, lastPage, total }
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { aggregator, type SearchCategory } from "~/lib/aggregator";
import { requireDatabase } from "~/lib/api-utils";
import { animeList } from "~/server/db/schema";
import { dedupeSeriesResults } from "~/lib/search-dedupe";

const CATEGORIES: readonly SearchCategory[] = [
  "anime",
  "manga",
  "characters",
  "people",
];

function parseIds(raw: string | null): number[] | undefined {
  if (!raw) return undefined;
  const ids = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  return ids.length ? ids : undefined;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const categoryParam = searchParams.get("category");
  const category: SearchCategory = CATEGORIES.includes(
    categoryParam as SearchCategory,
  )
    ? (categoryParam as SearchCategory)
    : "anime";

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(
    Math.max(1, Number(searchParams.get("limit")) || 24),
    25,
  );

  const sortParam = searchParams.get("sort");
  const sort = sortParam === "asc" || sortParam === "desc" ? sortParam : undefined;

  const minScoreRaw = Number(searchParams.get("minScore"));
  const minScore =
    Number.isFinite(minScoreRaw) && minScoreRaw > 0 ? minScoreRaw : undefined;

  // Optional personalization: when the user is signed in we know which
  // entries they've watched, so the per-series pick can skip ahead to the
  // next unwatched season instead of always surfacing season 1.
  let watchedMalIds: Set<number> = new Set();
  try {
    const { userId } = await auth();
    if (userId) {
      const rows = await requireDatabase()
        .select({ animeId: animeList.animeId })
        .from(animeList)
        .where(eq(animeList.userId, userId));
      watchedMalIds = new Set(rows.map((r) => r.animeId));
    }
  } catch {
    // Not signed in, or the DB is unavailable — fall back to the
    // non-personalized dedup (season 1 first).
  }

  try {
    const result = await aggregator.searchPaged({
      category,
      query: searchParams.get("q") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      rating: searchParams.get("rating") ?? undefined,
      genres: parseIds(searchParams.get("genres")),
      excludeGenres: parseIds(searchParams.get("excludeGenres")),
      minScore,
      orderBy: searchParams.get("orderBy") ?? undefined,
      sort,
      page,
      limit,
    });

    // Collapse seasons / movies of the same series to one entry — season 1
    // first, later seasons next, movies last; signed-in users skip ahead
    // past seasons they've already watched. Characters / people have no
    // such grouping, so they pass through untouched.
    const items =
      category === "anime" || category === "manga"
        ? dedupeSeriesResults(result.items, watchedMalIds)
        : result.items;

    return NextResponse.json(
      { ...result, items },
      {
        headers: {
          // Per-user once personalized; the shared Redis cache underneath
          // still keeps it fast. Short browser cache for repeat queries.
          "Cache-Control": "private, max-age=30",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    const rateLimited = message.toLowerCase().includes("rate limit");
    return NextResponse.json(
      {
        error: rateLimited
          ? "Too many requests — please wait a moment and try again."
          : "Search is temporarily unavailable. Please try again.",
      },
      { status: rateLimited ? 429 : 502 },
    );
  }
}
