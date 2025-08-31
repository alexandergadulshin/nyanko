import { type NextRequest, NextResponse } from "next/server";
import { user } from "~/server/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { requireAuth, requireDatabase, HTTP_STATUS, ERROR_MESSAGES, withErrorHandling, createApiError } from "~/lib/api-utils";

const USER_COLUMNS = {
  id: true,
  name: true,
  email: true,
  image: true,
  username: true,
  bio: true,
  profileVisibility: true,
  showWatchList: true,
  showFavorites: true,
  showStats: true,
  allowFriendRequests: true,
  lastNameChange: true,
  lastUsernameChange: true,
  createdAt: true,
} as const;

export const GET = withErrorHandling(async () => {
  const userId = await requireAuth();
  const database = requireDatabase();
  const userData = await database.query.user.findFirst({
    where: eq(user.id, userId),
    columns: USER_COLUMNS,
  });

  if (!userData) {
    return NextResponse.json({ error: ERROR_MESSAGES.USER_NOT_FOUND }, { status: HTTP_STATUS.NOT_FOUND });
  }

  return NextResponse.json({ user: userData });
});

interface UpdateUserBody {
  displayName: string;
  username?: string;
  bio?: string;
  image?: string;
  profileVisibility?: string;
  showWatchList?: boolean;
  showFavorites?: boolean;
  showStats?: boolean;
  allowFriendRequests?: boolean;
}

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireAuth();
  const database = requireDatabase();
  const body = await request.json() as UpdateUserBody;
  const { displayName, username, bio, image, profileVisibility, showWatchList, showFavorites, showStats, allowFriendRequests } = body;

  if (!displayName?.trim()) {
    return NextResponse.json({ error: "Display name is required" }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  const currentUserData = await database.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { name: true, username: true, lastNameChange: true, lastUsernameChange: true },
  });

  if (!currentUserData) {
    return NextResponse.json({ error: ERROR_MESSAGES.USER_NOT_FOUND }, { status: HTTP_STATUS.NOT_FOUND });
  }

  const now = new Date();
  const RATE_LIMITS = {
    NAME_CHANGE: 24 * 60 * 60 * 1000,
    USERNAME_CHANGE: 7 * 24 * 60 * 60 * 1000,
  };

  if (displayName.trim() !== currentUserData.name && currentUserData.lastNameChange) {
    const timeSinceLastChange = now.getTime() - currentUserData.lastNameChange.getTime();
    if (timeSinceLastChange < RATE_LIMITS.NAME_CHANGE) {
      const nextAllowed = new Date(currentUserData.lastNameChange.getTime() + RATE_LIMITS.NAME_CHANGE);
      throw createApiError(`You can only change your display name once per day. Try again on ${nextAllowed.toLocaleDateString()}.`, HTTP_STATUS.TOO_MANY_REQUESTS);
    }
  }

  if (username && username.trim() !== currentUserData.username && currentUserData.lastUsernameChange) {
    const timeSinceLastChange = now.getTime() - currentUserData.lastUsernameChange.getTime();
    if (timeSinceLastChange < RATE_LIMITS.USERNAME_CHANGE) {
      const nextAllowed = new Date(currentUserData.lastUsernameChange.getTime() + RATE_LIMITS.USERNAME_CHANGE);
      throw createApiError(`You can only change your username once every 7 days. Try again on ${nextAllowed.toLocaleDateString()}.`, HTTP_STATUS.TOO_MANY_REQUESTS);
    }
  }

  if (username?.trim()) {
    const usernameExists = await database.query.user.findFirst({
      where: and(eq(user.username, username.trim()), ne(user.id, userId)),
      columns: { id: true },
    });

    if (usernameExists) {
      return NextResponse.json({ error: ERROR_MESSAGES.USERNAME_TAKEN }, { status: HTTP_STATUS.CONFLICT });
    }
  }

  const updateData = {
    name: displayName.trim(),
    username: username?.trim() || null,
    bio: bio?.trim() || null,
    image: image?.trim() || null,
    profileVisibility,
    showWatchList,
    showFavorites,
    showStats,
    allowFriendRequests,
    updatedAt: now,
    ...(displayName.trim() !== currentUserData.name && { lastNameChange: now }),
    ...(username && username.trim() !== currentUserData.username && { lastUsernameChange: now }),
  };

  const [updatedUser] = await database
    .update(user)
    .set(updateData)
    .where(eq(user.id, userId))
    .returning({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      username: user.username,
      bio: user.bio,
      profileVisibility: user.profileVisibility,
      showWatchList: user.showWatchList,
      showFavorites: user.showFavorites,
      showStats: user.showStats,
      allowFriendRequests: user.allowFriendRequests,
    });

  if (!updatedUser) {
    return NextResponse.json({ error: ERROR_MESSAGES.FAILED_TO_UPDATE }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }

  return NextResponse.json({ user: updatedUser });
});

interface CreateUserBody {
  name: string;
  username: string;
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  const database = requireDatabase();

  if (!userId || !clerkUser) {
    return NextResponse.json({ error: ERROR_MESSAGES.UNAUTHORIZED }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const body = await request.json() as CreateUserBody;
  const { name, username } = body;

  if (!name?.trim() || !username?.trim()) {
    return NextResponse.json({ error: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  if (username.trim().length < 3) {
    return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  const usernameExists = await database.query.user.findFirst({
    where: eq(user.username, username.trim()),
    columns: { id: true },
  });

  if (usernameExists) {
    return NextResponse.json({ error: ERROR_MESSAGES.USERNAME_TAKEN }, { status: HTTP_STATUS.CONFLICT });
  }

  const existingUser = await database.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { id: true, name: true, username: true },
  });

  const RETURN_COLUMNS = {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    bio: user.bio,
    image: user.image,
    profileVisibility: user.profileVisibility,
    showWatchList: user.showWatchList,
    showFavorites: user.showFavorites,
    showStats: user.showStats,
    allowFriendRequests: user.allowFriendRequests,
  };

  if (existingUser) {
    const [updatedUser] = await database
      .update(user)
      .set({ name: name.trim(), username: username.trim(), updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning(RETURN_COLUMNS);

    if (!updatedUser) {
      return NextResponse.json({ error: ERROR_MESSAGES.FAILED_TO_UPDATE }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }

    return NextResponse.json({ user: updatedUser });
  }

  const [newUser] = await database
    .insert(user)
    .values({
      id: userId,
      name: name.trim(),
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      username: username.trim(),
      emailVerified: clerkUser.emailAddresses[0]?.verification?.status === "verified",
      image: clerkUser.imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning(RETURN_COLUMNS);

  if (!newUser) {
    return NextResponse.json({ error: ERROR_MESSAGES.FAILED_TO_CREATE }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }

  return NextResponse.json({ user: newUser });
});