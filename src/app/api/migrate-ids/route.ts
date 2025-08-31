import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { animeList, favorites } from "~/server/db/schema";
import { enhancedAPI } from "~/lib/enhanced-api";
import { eq, count } from "drizzle-orm";

// POST /api/migrate-ids - Migrate existing MAL IDs to internal ID system
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const migrateType = searchParams.get("type"); // "anime-list", "favorites", or "all"

    let migratedCount = 0;
    let errors: string[] = [];

    try {
      // Migrate anime list entries
      if (migrateType === "anime-list" || migrateType === "all") {
        const animeListEntries = await db
          .select()
          .from(animeList)
          .where(eq(animeList.userId, userId));

        for (const entry of animeListEntries) {
          try {
            // Get or create internal ID for this anime
            const enhancedAnime = await enhancedAPI.getAnimeById(entry.animeId);
            if (enhancedAnime?.internalId) {
              console.log(`Migrated anime ${entry.animeId} to internal ID ${enhancedAnime.internalId}`);
              migratedCount++;
            }
          } catch (error) {
            errors.push(`Failed to migrate anime ${entry.animeId}: ${error}`);
          }
        }
      }

      // Migrate favorites entries
      if (migrateType === "favorites" || migrateType === "all") {
        const favoritesEntries = await db
          .select()
          .from(favorites)
          .where(eq(favorites.userId, userId));

        for (const fav of favoritesEntries) {
          try {
            let internalId: string | null = null;
            
            if (fav.type === "anime") {
              const enhanced = await enhancedAPI.getAnimeById(fav.itemId);
              internalId = enhanced?.internalId || null;
            } else if (fav.type === "characters") {
              const enhanced = await enhancedAPI.getCharacterById(fav.itemId);
              internalId = enhanced?.internalId || null;
            } else if (fav.type === "people") {
              const enhanced = await enhancedAPI.getPersonById(fav.itemId);
              internalId = enhanced?.internalId || null;
            }

            if (internalId) {
              console.log(`Migrated ${fav.type} ${fav.itemId} to internal ID ${internalId}`);
              migratedCount++;
            }
          } catch (error) {
            errors.push(`Failed to migrate ${fav.type} ${fav.itemId}: ${error}`);
          }
        }
      }

      return NextResponse.json({
        success: true,
        migratedCount,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully created internal mappings for ${migratedCount} items`,
      });
    } catch (error) {
      console.error("Migration error:", error);
      return NextResponse.json({
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
        migratedCount,
        errors,
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in ID migration:", error);
    return NextResponse.json(
      { error: "Failed to migrate IDs" },
      { status: 500 }
    );
  }
}

// GET /api/migrate-ids - Check migration status
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    // Count items that could be migrated
    const animeListCount = await db
      .select({ count: count() })
      .from(animeList)
      .where(eq(animeList.userId, userId));

    const favoritesCount = await db
      .select({ count: count() })
      .from(favorites)
      .where(eq(favorites.userId, userId));

    return NextResponse.json({
      animeListEntries: animeListCount[0]?.count || 0,
      favoritesEntries: favoritesCount[0]?.count || 0,
      message: "These are the items that would be migrated to internal IDs",
    });
  } catch (error) {
    console.error("Error checking migration status:", error);
    return NextResponse.json(
      { error: "Failed to check migration status" },
      { status: 500 }
    );
  }
}