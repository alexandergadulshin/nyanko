import { type NextRequest, NextResponse } from "next/server";
import { user, friendships, friendRequests } from "~/server/db/schema";
import { eq, and, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import { requireAuth, requireDatabase, HTTP_STATUS, ERROR_MESSAGES, withErrorHandling, createApiError } from "~/lib/api-utils";

interface SendFriendRequestBody {
  toUserId: string;
  message?: string;
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireAuth();
  const database = requireDatabase();
  const body = await request.json() as SendFriendRequestBody;
  const { toUserId, message } = body;

  if (!toUserId) {
    throw createApiError("Target user ID is required", HTTP_STATUS.BAD_REQUEST);
  }

  if (toUserId === userId) {
    throw createApiError("Cannot send friend request to yourself", HTTP_STATUS.BAD_REQUEST);
  }

  const targetUser = await database.query.user.findFirst({
    where: eq(user.id, toUserId),
    columns: { id: true, allowFriendRequests: true, profileVisibility: true },
  });

  if (!targetUser) {
    throw createApiError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (!targetUser.allowFriendRequests) {
    throw createApiError("User is not accepting friend requests", HTTP_STATUS.FORBIDDEN);
  }

  const [existingFriendship, existingRequest] = await Promise.all([
    database.query.friendships.findFirst({
      where: or(
        and(eq(friendships.userId1, userId), eq(friendships.userId2, toUserId)),
        and(eq(friendships.userId1, toUserId), eq(friendships.userId2, userId))
      ),
    }),
    database.query.friendRequests.findFirst({
      where: and(
        or(
          and(eq(friendRequests.fromUserId, userId), eq(friendRequests.toUserId, toUserId)),
          and(eq(friendRequests.fromUserId, toUserId), eq(friendRequests.toUserId, userId))
        ),
        eq(friendRequests.status, "pending")
      ),
    }),
  ]);

  if (existingFriendship) {
    throw createApiError("Already friends with this user", HTTP_STATUS.CONFLICT);
  }

  if (existingRequest) {
    throw createApiError("Friend request already exists", HTTP_STATUS.CONFLICT);
  }

  const [newRequest] = await database
    .insert(friendRequests)
    .values({
      id: randomUUID(),
      fromUserId: userId,
      toUserId,
      message: message?.trim() || null,
      status: "pending",
    })
    .returning();

  return NextResponse.json({ success: true, request: newRequest });
});

interface RespondToRequestBody {
  requestId: string;
  action: 'accept' | 'decline';
}

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireAuth();
  const database = requireDatabase();
  const body = await request.json() as RespondToRequestBody;
  const { requestId, action } = body;

  if (!requestId || !["accept", "decline"].includes(action)) {
    throw createApiError("Request ID and valid action required", HTTP_STATUS.BAD_REQUEST);
  }

  const friendRequest = await database.query.friendRequests.findFirst({
    where: and(
      eq(friendRequests.id, requestId),
      eq(friendRequests.toUserId, userId),
      eq(friendRequests.status, "pending")
    ),
  });

  if (!friendRequest) {
    throw createApiError("Friend request not found", HTTP_STATUS.NOT_FOUND);
  }

  const updateData = { 
    status: action === "accept" ? "accepted" : "declined" as const,
    updatedAt: new Date() 
  };

  if (action === "accept") {
    await Promise.all([
      database.insert(friendships).values({
        id: randomUUID(),
        userId1: friendRequest.fromUserId,
        userId2: userId,
      }),
      database.update(friendRequests).set(updateData).where(eq(friendRequests.id, requestId)),
    ]);
  } else {
    await database.update(friendRequests).set(updateData).where(eq(friendRequests.id, requestId));
  }

  const message = action === "accept" ? "Friend request accepted" : "Friend request declined";
  return NextResponse.json({ success: true, message });
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireAuth();
  const database = requireDatabase();
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get("requestId");

  if (!requestId) {
    throw createApiError("Request ID is required", HTTP_STATUS.BAD_REQUEST);
  }

  const deletedRequest = await database
    .delete(friendRequests)
    .where(
      and(
        eq(friendRequests.id, requestId),
        eq(friendRequests.fromUserId, userId),
        eq(friendRequests.status, "pending")
      )
    )
    .returning();

  if (deletedRequest.length === 0) {
    throw createApiError("Friend request not found or cannot be cancelled", HTTP_STATUS.NOT_FOUND);
  }

  return NextResponse.json({ success: true, message: "Friend request cancelled" });
});