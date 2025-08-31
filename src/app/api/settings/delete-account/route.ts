import { type NextRequest, NextResponse } from "next/server";
import { user, animeList, favorites } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { requireDatabase } from "~/lib/api-utils";

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    const database = requireDatabase();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { confirmDelete } = await request.json();

    if (!confirmDelete) {
      return NextResponse.json({ error: "Account deletion not confirmed" }, { status: 400 });
    }

    await database.delete(favorites).where(eq(favorites.userId, userId));
    await database.delete(animeList).where(eq(animeList.userId, userId));
    await database.delete(user).where(eq(user.id, userId));

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}