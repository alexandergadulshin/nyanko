import { type NextRequest, NextResponse } from "next/server";
import { user } from "~/server/db/schema";
import { auth } from "@clerk/nextjs/server";
import { like, or, ne, and } from "drizzle-orm";
import { requireDatabase } from "~/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const database = requireDatabase();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
    }

    const searchTerm = `%${query.trim()}%`;

    const users = await database
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
        bio: user.bio,
        profileVisibility: user.profileVisibility,
        allowFriendRequests: user.allowFriendRequests,
      })
      .from(user)
      .where(
        and(
          ne(user.id, userId),
          or(
            like(user.name, searchTerm),
            like(user.username, searchTerm)
          )
        )
      )
      .limit(Math.min(limit, 50));

    const filteredUsers = users.filter(u => 
      u.profileVisibility !== "private" && u.allowFriendRequests
    );

    return NextResponse.json({ users: filteredUsers });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}