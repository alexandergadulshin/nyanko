import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { user, friendships, friendRequests } from "~/server/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, or } from "drizzle-orm";
import { randomUUID } from "crypto";

// Send a friend request
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { toUserId, message } = body;

    if (!toUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    if (toUserId === userId) {
      return NextResponse.json({ error: "Cannot send friend request to yourself" }, { status: 400 });
    }

    // Check if target user exists and allows friend requests
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, toUserId),
      columns: {
        id: true,
        allowFriendRequests: true,
        profileVisibility: true,
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!targetUser.allowFriendRequests) {
      return NextResponse.json({ error: "User is not accepting friend requests" }, { status: 403 });
    }

    // Check if they're already friends
    const existingFriendship = await db.query.friendships.findFirst({
      where: or(
        and(eq(friendships.userId1, userId), eq(friendships.userId2, toUserId)),
        and(eq(friendships.userId1, toUserId), eq(friendships.userId2, userId))
      )
    });

    if (existingFriendship) {
      return NextResponse.json({ error: "Already friends with this user" }, { status: 400 });
    }

    // Check if there's already a pending request from either direction
    const existingRequest = await db.query.friendRequests.findFirst({
      where: and(
        or(
          and(eq(friendRequests.fromUserId, userId), eq(friendRequests.toUserId, toUserId)),
          and(eq(friendRequests.fromUserId, toUserId), eq(friendRequests.toUserId, userId))
        ),
        eq(friendRequests.status, "pending")
      )
    });

    if (existingRequest) {
      return NextResponse.json({ error: "Friend request already exists" }, { status: 400 });
    }

    // Create friend request
    const newRequest = await db.insert(friendRequests).values({
      id: randomUUID(),
      fromUserId: userId,
      toUserId: toUserId,
      message: message?.trim() || null,
      status: "pending",
    }).returning();

    return NextResponse.json({ 
      success: true, 
      request: newRequest[0] 
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Respond to a friend request (accept/decline)
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, action } = body;
    
    console.log('PUT request received:', { userId, requestId, action });

    if (!requestId || !["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Request ID and valid action required" }, { status: 400 });
    }

    // Find the friend request
    console.log('Searching for friend request with:', { requestId, userId });
    const friendRequest = await db.query.friendRequests.findFirst({
      where: and(
        eq(friendRequests.id, requestId),
        eq(friendRequests.toUserId, userId),
        eq(friendRequests.status, "pending")
      )
    });
    
    console.log('Found friend request:', friendRequest);

    if (!friendRequest) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
    }

    if (action === "accept") {
      // Create friendship
      await db.insert(friendships).values({
        id: randomUUID(),
        userId1: friendRequest.fromUserId,
        userId2: userId,
      });

      // Update request status
      await db.update(friendRequests)
        .set({ 
          status: "accepted",
          updatedAt: new Date()
        })
        .where(eq(friendRequests.id, requestId));

      return NextResponse.json({ 
        success: true, 
        message: "Friend request accepted" 
      });
    } else {
      // Decline request
      await db.update(friendRequests)
        .set({ 
          status: "declined",
          updatedAt: new Date()
        })
        .where(eq(friendRequests.id, requestId));

      return NextResponse.json({ 
        success: true, 
        message: "Friend request declined" 
      });
    }
  } catch (error) {
    console.error("Error responding to friend request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Cancel a friend request (for the sender)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    // Find and delete the friend request (only if user is the sender)
    const deletedRequest = await db.delete(friendRequests)
      .where(
        and(
          eq(friendRequests.id, requestId),
          eq(friendRequests.fromUserId, userId),
          eq(friendRequests.status, "pending")
        )
      )
      .returning();

    if (deletedRequest.length === 0) {
      return NextResponse.json({ error: "Friend request not found or cannot be cancelled" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Friend request cancelled" 
    });
  } catch (error) {
    console.error("Error cancelling friend request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}