import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const CONNECTION_CONFIG = {
  prepare: false,
  max: env.NODE_ENV === "production" ? 10 : 1,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
};

const connectionString = env.DATABASE_URL;

const conn = connectionString 
  ? globalForDb.conn ?? postgres(connectionString, CONNECTION_CONFIG)
  : null;

if (env.NODE_ENV !== "production" && conn) globalForDb.conn = conn;

export const db = conn ? drizzle(conn, { schema }) : null;