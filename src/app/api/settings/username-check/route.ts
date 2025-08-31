import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { user } from "~/server/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username || username.trim() === '') {
      return NextResponse.json({ available: true });
    }

    // Check if username is already taken by another user
    const existingUser = await db.query.user.findFirst({
      where: and(
        eq(user.username, username.trim()),
        ne(user.id, userId)
      ),
      columns: { id: true }
    });

    const available = !existingUser;

    return NextResponse.json({ 
      available,
      message: available ? "Username is available" : "Username is already taken"
    });
  } catch (error) {
    console.error("Error checking username availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await request.json();

    if (!username || username.trim() === '') {
      return NextResponse.json({ available: true });
    }

    // Check if username is already taken by another user
    const existingUser = await db.query.user.findFirst({
      where: and(
        eq(user.username, username.trim()),
        ne(user.id, userId)
      ),
      columns: { id: true }
    });

    const available = !existingUser;

    return NextResponse.json({ 
      available,
      message: available ? "Username is available" : "Username is already taken"
    });
  } catch (error) {
    console.error("Error checking username availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}