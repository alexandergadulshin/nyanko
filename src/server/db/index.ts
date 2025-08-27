import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

// Configure connection for production (Supabase) or development
const connectionString = env.DATABASE_URL;

// Only initialize database connection if DATABASE_URL is provided
const conn = connectionString 
  ? globalForDb.conn ?? postgres(connectionString, {
      prepare: false, // Required for Supabase
      max: env.NODE_ENV === "production" ? 10 : 1, // Connection pooling for production
      idle_timeout: 20,
      max_lifetime: 60 * 30, // 30 minutes
    })
  : null;

if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = conn ? drizzle(conn, { schema }) : null;
