import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { user } from "~/server/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { auth } from "~/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.id) {
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
        ne(user.id, session.user.id)
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