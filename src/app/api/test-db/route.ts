import { NextResponse } from "next/server";
import { requireDatabase } from "~/lib/api-utils";

export async function GET() {
  try {
    const database = requireDatabase();
    
    // Test basic database connection
    const result = await database.execute('SELECT 1 as test');
    
    return NextResponse.json({ 
      success: true, 
      message: "Database connection successful",
      test: result
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown database error"
    }, { status: 500 });
  }
}