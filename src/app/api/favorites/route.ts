import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { favorites } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "~/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let query = db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, session.user.id));

    if (type) {
      query = query.where(and(
        eq(favorites.userId, session.user.id),
        eq(favorites.type, type)
      )) as typeof query;
    }

    const userFavorites = await query.orderBy(favorites.createdAt);

    return NextResponse.json({ favorites: userFavorites });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      type?: string;
      itemId?: number;
      itemTitle?: string;
      itemImage?: string;
      itemData?: unknown;
    };
    const {
      type,
      itemId,
      itemTitle,
      itemImage,
      itemData,
    } = body;

    if (!type || !itemId || !itemTitle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const favoriteId = `${session.user.id}_${type}_${itemId}`;

    const existing = await db
      .select()
      .from(favorites)
      .where(and(
        eq(favorites.userId, session.user.id),
        eq(favorites.type, type),
        eq(favorites.itemId, itemId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Already in favorites" }, { status: 409 });
    }

    const result = await db
      .insert(favorites)
      .values({
        id: favoriteId,
        userId: session.user.id,
        type,
        itemId,
        itemTitle,
        itemImage: itemImage ?? null,
        itemData: itemData ? JSON.stringify(itemData) : null,
      })
      .returning();

    return NextResponse.json({ success: true, favorite: result[0] });
  } catch (error) {
    console.error("Error adding to favorites:", error);
    return NextResponse.json(
      { error: "Failed to add to favorites" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const itemId = searchParams.get("itemId");

    if (!type || !itemId) {
      return NextResponse.json({ error: "Type and itemId required" }, { status: 400 });
    }

    const result = await db
      .delete(favorites)
      .where(and(
        eq(favorites.userId, session.user.id),
        eq(favorites.type, type),
        eq(favorites.itemId, parseInt(itemId))
      ))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Favorite not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    return NextResponse.json(
      { error: "Failed to remove from favorites" },
      { status: 500 }
    );
  }
}