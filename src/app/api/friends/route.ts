import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { user, friendships, friendRequests } from "~/server/db/schema";
import { auth } from "@clerk/nextjs/server";
import { or, eq, and } from "drizzle-orm";

// Get friends and friend requests for the current user
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get friends (accepted friendships)
    const friendsQuery = await db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
        bio: user.bio,
        friendshipId: friendships.id,
        createdAt: friendships.createdAt,
      })
      .from(friendships)
      .leftJoin(user, 
        or(
          eq(friendships.userId1, user.id),
          eq(friendships.userId2, user.id)
        )
      )
      .where(
        or(
          eq(friendships.userId1, userId),
          eq(friendships.userId2, userId)
        )
      );

    // Filter to get the friend's data (not the current user's)
    const friends = friendsQuery
      .filter(f => f.id !== userId)
      .map(f => ({
        id: f.id,
        name: f.name,
        username: f.username,
        image: f.image,
        bio: f.bio,
        friendshipId: f.friendshipId,
        friendSince: f.createdAt,
      }));

    // Get incoming friend requests
    const incomingRequests = await db
      .select({
        id: friendRequests.id,
        fromUser: {
          id: user.id,
          name: user.name,
          username: user.username,
          image: user.image,
        },
        message: friendRequests.message,
        createdAt: friendRequests.createdAt,
      })
      .from(friendRequests)
      .leftJoin(user, eq(friendRequests.fromUserId, user.id))
      .where(
        and(
          eq(friendRequests.toUserId, userId),
          eq(friendRequests.status, "pending")
        )
      );

    // Get outgoing friend requests
    const outgoingRequests = await db
      .select({
        id: friendRequests.id,
        toUser: {
          id: user.id,
          name: user.name,
          username: user.username,
          image: user.image,
        },
        message: friendRequests.message,
        createdAt: friendRequests.createdAt,
      })
      .from(friendRequests)
      .leftJoin(user, eq(friendRequests.toUserId, user.id))
      .where(
        and(
          eq(friendRequests.fromUserId, userId),
          eq(friendRequests.status, "pending")
        )
      );

    return NextResponse.json({
      friends,
      incomingRequests,
      outgoingRequests,
    });
  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}