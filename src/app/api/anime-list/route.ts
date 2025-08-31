import { type NextRequest, NextResponse } from "next/server";
import { animeList } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireDatabase, createSuccessResponse, HTTP_STATUS, ERROR_MESSAGES, withErrorHandling } from "~/lib/api-utils";

interface AnimeListBody {
  animeId: number;
  animeTitle: string;
  animeImage?: string;
  status: string;
  score?: number | null;
  episodesWatched?: number;
  totalEpisodes?: number | null;
  notes?: string | null;
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireAuth();
  const database = requireDatabase();
  const body = await request.json() as AnimeListBody;
  const { animeId, animeTitle, animeImage, status, score, episodesWatched, totalEpisodes, notes } = body;

  if (!animeId || !animeTitle || !status) {
    return NextResponse.json({ error: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  const listId = `${userId}_${animeId}`;
  const [existing] = await database
    .select()
    .from(animeList)
    .where(and(eq(animeList.userId, userId), eq(animeList.animeId, animeId)))
    .limit(1);

  const updateData = {
    status,
    score: score ?? null,
    episodesWatched: episodesWatched ?? 0,
    totalEpisodes: totalEpisodes ?? null,
    notes: notes ?? null,
    updatedAt: new Date(),
  };

  let result;
  if (existing) {
    result = await database
      .update(animeList)
      .set({
        ...updateData,
        ...(status === "completed" && !existing.finishDate && { finishDate: new Date() }),
        ...(status === "watching" && !existing.startDate && { startDate: new Date() }),
      })
      .where(eq(animeList.id, existing.id))
      .returning();
  } else {
    result = await database
      .insert(animeList)
      .values({
        id: listId,
        userId,
        animeId,
        animeTitle,
        animeImage: animeImage ?? null,
        ...updateData,
        startDate: status === "watching" ? new Date() : null,
        finishDate: status === "completed" ? new Date() : null,
      })
      .returning();
  }

  return NextResponse.json({ success: true, entry: result[0] });
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireAuth();
  const database = requireDatabase();
  const url = new URL(request.url);
  const animeId = parseInt(url.searchParams.get("animeId") ?? "0");

  if (!animeId) {
    return NextResponse.json({ error: ERROR_MESSAGES.BAD_REQUEST }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  const result = await database
    .delete(animeList)
    .where(and(eq(animeList.userId, userId), eq(animeList.animeId, animeId)))
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: ERROR_MESSAGES.ANIME_NOT_FOUND }, { status: HTTP_STATUS.NOT_FOUND });
  }

  return createSuccessResponse();
});