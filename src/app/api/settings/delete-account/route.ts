import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { user, animeList, favorites } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "~/lib/auth";
import { headers } from "next/headers";

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { confirmDelete } = await request.json();

    if (!confirmDelete) {
      return NextResponse.json({ error: "Account deletion not confirmed" }, { status: 400 });
    }

    // Delete user data in correct order (foreign key constraints)
    await db.delete(favorites).where(eq(favorites.userId, session.user.id));
    await db.delete(animeList).where(eq(animeList.userId, session.user.id));
    await db.delete(user).where(eq(user.id, session.user.id));

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}