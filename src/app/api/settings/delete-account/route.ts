import { type NextRequest, NextResponse } from "next/server";
import { user, animeList, favorites, friendRequests, friendships, session, account, verification } from "~/server/db/schema";
import { eq, or } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { requireDatabase } from "~/lib/api-utils";

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    const database = requireDatabase();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { confirmDelete } = await request.json();

    if (!confirmDelete) {
      return NextResponse.json({ error: "Account deletion not confirmed" }, { status: 400 });
    }

    await database.delete(favorites).where(eq(favorites.userId, userId));
    await database.delete(animeList).where(eq(animeList.userId, userId));
    
    await database.delete(friendRequests).where(
      or(
        eq(friendRequests.fromUserId, userId),
        eq(friendRequests.toUserId, userId)
      )
    );
    
    await database.delete(friendships).where(
      or(
        eq(friendships.userId1, userId),
        eq(friendships.userId2, userId)
      )
    );
    
    await database.delete(session).where(eq(session.userId, userId));
    await database.delete(account).where(eq(account.userId, userId));
    
    await database.delete(user).where(eq(user.id, userId));

    try {
      await clerkClient().users.deleteUser(userId);
    } catch (clerkError) {
      console.error("Error deleting Clerk user:", clerkError);
    }

    return NextResponse.json({ message: "Account deleted successfully", shouldSignOut: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}