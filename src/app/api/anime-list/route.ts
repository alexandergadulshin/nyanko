import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { animeList } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      animeId,
      animeTitle,
      animeImage,
      status,
      score,
      episodesWatched,
      totalEpisodes,
      notes,
    } = body;

    if (!animeId || !animeTitle || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const listId = `${userId}_${animeId}`;

    const existing = await db
      .select()
      .from(animeList)
      .where(and(
        eq(animeList.userId, userId),
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
          ...(status === "completed" && !existing[0]?.finishDate ? { finishDate: new Date() } : {}),
          ...(status === "watching" && !existing[0]?.startDate ? { startDate: new Date() } : {}),
        })
        .where(eq(animeList.id, existing[0]!.id))
        .returning();
    } else {
      result = await db
        .insert(animeList)
        .values({
          id: listId,
          userId: userId,
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

    return NextResponse.json({ success: true, entry: result[0] });
  } catch (error) {
    console.error("Error managing anime list:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const animeId = parseInt(url.searchParams.get("animeId") || "0");

    if (!animeId) {
      return NextResponse.json({ error: "Missing animeId parameter" }, { status: 400 });
    }

    const result = await db
      .delete(animeList)
      .where(and(
        eq(animeList.userId, userId),
        eq(animeList.animeId, animeId)
      ))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Anime not found in list" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting anime from list:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}