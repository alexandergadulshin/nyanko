import { type NextRequest } from "next/server";
import { db } from "~/server/db";
import { animeList } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { 
  withErrorHandling, 
  requireAuth, 
  createSuccessResponse, 
  createValidator,
  validators,
  handleDatabaseError,
  getNumericParam,
  ApiErrors
} from "~/lib/api-utils";

interface AnimeListRequest {
  animeId: number;
  animeTitle: string;
  animeImage?: string;
  status: "planning" | "watching" | "completed" | "dropped" | "paused";
  score?: number;
  episodesWatched?: number;
  totalEpisodes?: number;
  notes?: string;
}

const validateAnimeListRequest = createValidator<AnimeListRequest>({
  animeId: validators.positiveInteger,
  animeTitle: validators.required,
  animeImage: (value: unknown) => value === undefined || typeof value === 'string',
  status: (value: unknown) => ['planning', 'watching', 'completed', 'dropped', 'paused'].includes(value as string),
  score: (value: unknown) => value === undefined || (typeof value === 'number' && value >= 0 && value <= 10),
  episodesWatched: (value) => value === undefined || validators.nonNegativeInteger(value),
  totalEpisodes: (value) => value === undefined || validators.positiveInteger(value),
  notes: (value: unknown) => value === undefined || typeof value === 'string'
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(request);
  const body = await request.json() as unknown;
  const validatedData = validateAnimeListRequest(body);

  const {
    animeId,
    animeTitle,
    animeImage,
    status,
    score,
    episodesWatched,
    totalEpisodes,
    notes,
  } = validatedData;

  const listId = `${session.user.id}_${animeId}`;

  try {
    const existing = await db
      .select()
      .from(animeList)
      .where(and(
        eq(animeList.userId, session.user.id),
        eq(animeList.animeId, animeId)
      ))
      .limit(1);

    let result;

    if (existing.length > 0) {
      result = await db
        .update(animeList)
        .set({
          status,
          score: score ?? null,
          episodesWatched: episodesWatched ?? 0,
          totalEpisodes: totalEpisodes ?? null,
          notes: notes ?? null,
          updatedAt: new Date(),
          ...(status === "completed" && !existing[0].finishDate ? { finishDate: new Date() } : {}),
          ...(status === "watching" && !existing[0].startDate ? { startDate: new Date() } : {}),
        })
        .where(eq(animeList.id, existing[0].id))
        .returning();
    } else {
      result = await db
        .insert(animeList)
        .values({
          id: listId,
          userId: session.user.id,
          animeId,
          animeTitle,
          animeImage: animeImage ?? null,
          status,
          score: score ?? null,
          episodesWatched: episodesWatched ?? 0,
          totalEpisodes: totalEpisodes ?? null,
          notes: notes ?? null,
          startDate: status === "watching" ? new Date() : null,
          finishDate: status === "completed" ? new Date() : null,
        })
        .returning();
    }

    return createSuccessResponse({ entry: result[0] });
  } catch (error) {
    handleDatabaseError(error, "anime list management");
  }
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(request);
  const url = new URL(request.url);
  const animeId = getNumericParam(url, "animeId");

  try {
    const result = await db
      .delete(animeList)
      .where(and(
        eq(animeList.userId, session.user.id),
        eq(animeList.animeId, animeId)
      ))
      .returning();

    if (result.length === 0) {
      throw ApiErrors.NOT_FOUND;
    }

    return createSuccessResponse();
  } catch (error) {
    handleDatabaseError(error, "anime list deletion");
  }
});