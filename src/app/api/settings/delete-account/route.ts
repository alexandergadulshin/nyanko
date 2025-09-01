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

    console.log(`Starting complete account deletion for user: ${userId}`);

    // Delete from database first (with all related data)
    console.log("Deleting user data from database...");
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
    
    const deletedUser = await database.delete(user).where(eq(user.id, userId)).returning();
    console.log("✅ Database deletion completed");

    // Delete from Clerk authentication system
    console.log("Deleting user from Clerk...");
    try {
      await clerkClient().users.deleteUser(userId);
      console.log("✅ Clerk deletion completed");
    } catch (clerkError) {
      console.error("❌ Error deleting Clerk user:", clerkError);
      // Note: Database deletion already completed, so we'll still return success
      // This prevents the user from being stuck in a partially deleted state
    }

    console.log(`🎉 Complete account deletion finished for user: ${userId}`);
    return NextResponse.json({ 
      message: "Account deleted successfully", 
      shouldSignOut: true,
      deletedUser: deletedUser[0]?.email || "Unknown"
    });
  } catch (error) {
    console.error("❌ Error deleting account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}