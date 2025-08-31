import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { user } from "~/server/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
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
      }
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      displayName, 
      username, 
      bio, 
      image,
      profileVisibility,
      showWatchList,
      showFavorites,
      showStats,
      allowFriendRequests
    } = body;

    if (!displayName?.trim()) {
      return NextResponse.json({ error: "Display name is required" }, { status: 400 });
    }

    // Get current user data to check rate limits
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: { 
        name: true, 
        username: true, 
        lastNameChange: true, 
        lastUsernameChange: true 
      }
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Check display name rate limit (1 day)
    if (displayName.trim() !== currentUser.name && 
        currentUser.lastNameChange && 
        currentUser.lastNameChange > oneDayAgo) {
      const timeUntilAllowed = new Date(currentUser.lastNameChange.getTime() + 24 * 60 * 60 * 1000);
      return NextResponse.json({ 
        error: `You can only change your display name once per day. You can change it again on ${timeUntilAllowed.toLocaleDateString()}.` 
      }, { status: 400 });
    }

    // Check username rate limit (7 days)
    if (username && username.trim() !== currentUser.username && 
        currentUser.lastUsernameChange && 
        currentUser.lastUsernameChange > sevenDaysAgo) {
      const timeUntilAllowed = new Date(currentUser.lastUsernameChange.getTime() + 7 * 24 * 60 * 60 * 1000);
      return NextResponse.json({ 
        error: `You can only change your username once every 7 days. You can change it again on ${timeUntilAllowed.toLocaleDateString()}.` 
      }, { status: 400 });
    }

    if (username && username.trim() !== '') {
      const usernameCheck = await db.query.user.findFirst({
        where: and(
          eq(user.username, username.trim()),
          ne(user.id, userId)
        ),
        columns: { id: true }
      });

      if (usernameCheck) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
      }
    }

    const updateData: any = {
      name: displayName.trim(),
      username: username?.trim() || null,
      bio: bio?.trim() || null,
      image: image?.trim() || null,
      profileVisibility: profileVisibility || undefined,
      showWatchList: showWatchList !== undefined ? showWatchList : undefined,
      showFavorites: showFavorites !== undefined ? showFavorites : undefined,
      showStats: showStats !== undefined ? showStats : undefined,
      allowFriendRequests: allowFriendRequests !== undefined ? allowFriendRequests : undefined,
      updatedAt: new Date(),
    };

    // Update rate limiting timestamps if values changed
    if (displayName.trim() !== currentUser.name) {
      updateData.lastNameChange = now;
    }
    if (username && username.trim() !== currentUser.username) {
      updateData.lastUsernameChange = now;
    }

    const updatedUser = await db.update(user)
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

    if (!updatedUser[0]) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }

    return NextResponse.json({ user: updatedUser[0] });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const clerkUser = await currentUser();

    if (!userId || !clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, username } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Display name is required" }, { status: 400 });
    }

    if (!username?.trim()) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    if (username.trim().length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
    }

    // Check if username is already taken
    const usernameCheck = await db.query.user.findFirst({
      where: eq(user.username, username.trim()),
      columns: { id: true }
    });

    if (usernameCheck) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
    }

    // Check if user already exists - if so, update instead of create
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: { id: true, name: true, username: true }
    });

    if (existingUser) {
      // User exists, update their profile instead
      const updatedUser = await db.update(user)
        .set({
          name: name.trim(),
          username: username.trim(),
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId))
        .returning({
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
        });

      if (!updatedUser[0]) {
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
      }

      return NextResponse.json({ user: updatedUser[0] });
    }

    // Create new user
    const newUser = await db.insert(user)
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
      .returning({
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
      });

    if (!newUser[0]) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    return NextResponse.json({ user: newUser[0] });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}