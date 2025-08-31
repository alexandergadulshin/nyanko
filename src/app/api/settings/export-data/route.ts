import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { user, animeList, favorites } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data
    const userData = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        id: true,
        name: true,
        email: true,
        username: true,
        bio: true,
        createdAt: true,
      }
    });

    // Get anime list
    const userAnimeList = await db.query.animeList.findMany({
      where: eq(animeList.userId, userId),
    });

    // Get favorites
    const userFavorites = await db.query.favorites.findMany({
      where: eq(favorites.userId, userId),
    });

    const exportData = {
      user: userData,
      animeList: userAnimeList,
      favorites: userFavorites,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };

    // Create JSON file
    const fileName = `anime-web-data-${userId}-${new Date().toISOString().split('T')[0]}.json`;
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting user data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}