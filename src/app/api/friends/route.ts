import { NextResponse } from "next/server";
import { user, friendships, friendRequests } from "~/server/db/schema";
import { or, eq, and } from "drizzle-orm";
import { requireAuth, requireDatabase, withErrorHandling } from "~/lib/api-utils";

const FRIEND_USER_COLUMNS = {
  id: user.id,
  name: user.name,
  username: user.username,
  image: user.image,
  bio: user.bio,
} as const;

export const GET = withErrorHandling(async () => {
  const userId = await requireAuth();
  const database = requireDatabase();

  const friendsQuery = await database
    .select({
      ...FRIEND_USER_COLUMNS,
      friendshipId: friendships.id,
      createdAt: friendships.createdAt,
    })
    .from(friendships)
    .leftJoin(user, or(eq(friendships.userId1, user.id), eq(friendships.userId2, user.id)))
    .where(or(eq(friendships.userId1, userId), eq(friendships.userId2, userId)));

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

  const incomingRequests = await database
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
    .where(and(eq(friendRequests.toUserId, userId), eq(friendRequests.status, "pending")));

  const outgoingRequests = await database
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
    .where(and(eq(friendRequests.fromUserId, userId), eq(friendRequests.status, "pending")));

  return NextResponse.json({ friends, incomingRequests, outgoingRequests });
});