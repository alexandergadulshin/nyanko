import { type NextRequest, NextResponse } from "next/server";
import { friendships } from "~/server/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, or } from "drizzle-orm";
import { requireDatabase } from "~/lib/api-utils";

// Remove a friendship
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ friendshipId: string }> }
) {
  try {
    const { userId } = await auth();
    const database = requireDatabase();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { friendshipId } = await params;

    if (!friendshipId) {
      return NextResponse.json({ error: "Friendship ID is required" }, { status: 400 });
    }

    // Find and delete the friendship (only if user is part of the friendship)
    const deletedFriendship = await database.delete(friendships)
      .where(
        and(
          eq(friendships.id, friendshipId),
          or(
            eq(friendships.userId1, userId),
            eq(friendships.userId2, userId)
          )
        )
      )
      .returning();

    if (deletedFriendship.length === 0) {
      return NextResponse.json({ error: "Friendship not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Friendship removed" 
    });
  } catch (error) {
    console.error("Error removing friendship:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}