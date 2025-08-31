import { sql } from "drizzle-orm";
import { requireDatabase } from "~/lib/api-utils";

export async function GET() {
  try {
    const database = requireDatabase();
    await database.execute(sql`SELECT 1`);
    
    return Response.json({ 
      status: "ok", 
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    
    return Response.json({ 
      status: "error", 
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}