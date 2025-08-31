import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/server/db";
import * as schema from "~/server/db/schema";
import { env } from "~/env";

if (!db) {
  throw new Error("Database connection not available");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  secret: env.BETTER_AUTH_SECRET || "dev-secret-key",
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.BETTER_AUTH_URL],
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
    useSecureCookies: false,
  },
});

export type Session = typeof auth.$Infer.Session;