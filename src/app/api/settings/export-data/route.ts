import { NextResponse } from "next/server";
import { user, animeList, favorites } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { requireDatabase } from "~/lib/api-utils";

export async function GET() {
  try {
    const { userId } = await auth();
    const database = requireDatabase();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await database.query.user.findFirst({
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

    const userAnimeList = await database.query.animeList.findMany({
      where: eq(animeList.userId, userId),
    });

    const userFavorites = await database.query.favorites.findMany({
      where: eq(favorites.userId, userId),
    });

    const exportData = {
      user: userData,
      animeList: userAnimeList,
      favorites: userFavorites,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };

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