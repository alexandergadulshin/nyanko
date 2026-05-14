import { type NextRequest, NextResponse } from "next/server";
import { user, animeList } from "~/server/db/schema";
import { eq, or } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { requireDatabase, HTTP_STATUS, ERROR_MESSAGES, withErrorHandling } from "~/lib/api-utils";

const PROFILE_COLUMNS = {
  id: user.id,
  name: user.name,
  email: user.email,
  image: user.image,
  username: user.username,
  bio: user.bio,
  createdAt: user.createdAt,
} as const;

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) => {
  // The dynamic segment is named `userId` for historical reasons but now
  // accepts either a Clerk user ID or a username — whichever the visitor
  // typed (or got redirected from).
  const { userId: handle } = await params;
  const database = requireDatabase();

  let [userProfile] = await database
    .select(PROFILE_COLUMNS)
    .from(user)
    .where(or(eq(user.id, handle), eq(user.username, handle)))
    .limit(1);

  if (!userProfile) {
    const clerkUser = await currentUser();

    // Allow self-create only when the handle matches the visitor's own
    // Clerk ID or Clerk username.
    if (
      !clerkUser ||
      (clerkUser.id !== handle && clerkUser.username !== handle)
    ) {
      return NextResponse.json({ error: ERROR_MESSAGES.USER_NOT_FOUND }, { status: HTTP_STATUS.NOT_FOUND });
    }

    [userProfile] = await database
      .insert(user)
      .values({
        id: clerkUser.id,
        name: clerkUser.fullName || clerkUser.firstName || "User",
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        image: clerkUser.imageUrl || null,
        username: clerkUser.username || null,
        bio: null,
      })
      .returning(PROFILE_COLUMNS);
  }

  if (!userProfile) {
    return NextResponse.json({ error: ERROR_MESSAGES.USER_NOT_FOUND }, { status: HTTP_STATUS.NOT_FOUND });
  }

  const userAnimeList = await database
    .select()
    .from(animeList)
    .where(eq(animeList.userId, userProfile.id));

  return NextResponse.json({ profile: userProfile, animeList: userAnimeList });
});

interface UpdateProfileBody {
  name?: string;
  username?: string;
  bio?: string;
  image?: string;
}

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) => {
  const { userId } = await params;
  const database = requireDatabase();
  const body = await request.json() as UpdateProfileBody;
  const { name, username, bio, image } = body;

  const [updatedUser] = await database
    .update(user)
    .set({
      name,
      username: username || null,
      bio: bio || null,
      image: image || null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning();

  if (!updatedUser) {
    return NextResponse.json({ error: ERROR_MESSAGES.USER_NOT_FOUND }, { status: HTTP_STATUS.NOT_FOUND });
  }

  return NextResponse.json({ profile: updatedUser });
});