import { NextResponse } from "next/server";
import { env } from "~/env";

export async function GET() {
  return NextResponse.json({ 
    DATABASE_URL_exists: !!process.env.DATABASE_URL,
    DATABASE_URL_prefix: process.env.DATABASE_URL?.substring(0, 50) + "...",
    env_DATABASE_URL_exists: !!env.DATABASE_URL,
    env_DATABASE_URL_prefix: env.DATABASE_URL?.substring(0, 50) + "...",
    NODE_ENV: process.env.NODE_ENV
  });
}