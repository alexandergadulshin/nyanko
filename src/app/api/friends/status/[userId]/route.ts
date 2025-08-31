import { type NextRequest, NextResponse } from "next/server";
import { user, friendships, friendRequests } from "~/server/db/schema";
import { auth } from "@clerk/nextjs/server";
import { or, eq, and } from "drizzle-orm";
import { requireDatabase } from "~/lib/api-utils";

// Get friendship status with another user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: currentUserId } = await auth();
    const database = requireDatabase();
    
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: targetUserId } = await params;

    if (!targetUserId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (currentUserId === targetUserId) {
      return NextResponse.json({ 
        status: "self",
        message: "This is your own profile"
      });
    }

    // Check if target user exists and allows friend requests
    const targetUser = await database.query.user.findFirst({
      where: eq(user.id, targetUserId),
      columns: {
        id: true,
        allowFriendRequests: true,
        profileVisibility: true,
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if they're already friends
    const existingFriendship = await database.query.friendships.findFirst({
      where: or(
        and(eq(friendships.userId1, currentUserId), eq(friendships.userId2, targetUserId)),
        and(eq(friendships.userId1, targetUserId), eq(friendships.userId2, currentUserId))
      )
    });

    if (existingFriendship) {
      return NextResponse.json({
        status: "friends",
        friendshipId: existingFriendship.id,
        message: "You are friends with this user"
      });
    }

    // Check for pending friend requests
    const pendingRequest = await database.query.friendRequests.findFirst({
      where: and(
        or(
          and(eq(friendRequests.fromUserId, currentUserId), eq(friendRequests.toUserId, targetUserId)),
          and(eq(friendRequests.fromUserId, targetUserId), eq(friendRequests.toUserId, currentUserId))
        ),
        eq(friendRequests.status, "pending")
      )
    });

    if (pendingRequest) {
      if (pendingRequest.fromUserId === currentUserId) {
        return NextResponse.json({
          status: "request_sent",
          requestId: pendingRequest.id,
          message: "Friend request sent"
        });
      } else {
        return NextResponse.json({
          status: "request_received",
          requestId: pendingRequest.id,
          message: "Friend request received"
        });
      }
    }

    // Check if user allows friend requests
    if (!targetUser.allowFriendRequests) {
      return NextResponse.json({
        status: "not_accepting",
        message: "This user is not accepting friend requests"
      });
    }

    // No relationship exists
    return NextResponse.json({
      status: "none",
      canSendRequest: true,
      message: "You can send a friend request to this user"
    });

  } catch (error) {
    console.error("Error checking friendship status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}