import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { user, animeList } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    let userProfile = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        username: user.username,
        bio: user.bio,
        createdAt: user.createdAt
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    // If user doesn't exist in database, create them from Clerk data
    if (userProfile.length === 0) {
      const clerkUser = await currentUser();
      
      if (!clerkUser || clerkUser.id !== userId) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Create the user in the database
      const newUser = await db
        .insert(user)
        .values({
          id: clerkUser.id,
          name: clerkUser.fullName || clerkUser.firstName || "User",
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          image: clerkUser.imageUrl || null,
          username: clerkUser.username || null,
          bio: null,
        })
        .returning({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          username: user.username,
          bio: user.bio,
          createdAt: user.createdAt
        });

      userProfile = newUser;
    }

    const userAnimeList = await db
      .select()
      .from(animeList)
      .where(eq(animeList.userId, userId));

    return NextResponse.json({
      profile: userProfile[0],
      animeList: userAnimeList
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { name, username, bio, image } = body;

    const updatedUser = await db
      .update(user)
      .set({
        name,
        username: username || null,
        bio: bio || null,
        image: image || null,
        updatedAt: new Date()
      })
      .where(eq(user.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile: updatedUser[0] });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}