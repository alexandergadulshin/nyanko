import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/server/db";
import * as schema from "~/server/db/schema";
import { env } from "~/env";

/**
 * BetterAuth is the legacy auth path (Clerk is now primary). The
 * /api/auth/[...all] route still mounts this for backward compatibility,
 * but we must not throw at module import time — Next.js's build-time
 * page-data collection imports route modules without DATABASE_URL set,
 * which would crash the build.
 *
 * Initialize lazily: build the auth instance on first real use. Any
 * property access on the exported `auth` resolves to the real instance
 * (and throws if DB is still unavailable at that point); module load
 * itself is a no-op.
 */

type BetterAuth = ReturnType<typeof betterAuth>;

let _auth: BetterAuth | null = null;

function buildAuth(): BetterAuth {
  if (!db) {
    throw new Error("Database connection not available");
  }
  return betterAuth({
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
    secret: env.BETTER_AUTH_SECRET ?? "dev-secret-key",
    baseURL: env.BETTER_AUTH_URL ?? "http://localhost:3000",
    trustedOrigins: [env.BETTER_AUTH_URL ?? "http://localhost:3000"],
    advanced: {
      crossSubDomainCookies: {
        enabled: true,
      },
      useSecureCookies: false,
    },
  });
}

function getAuth(): BetterAuth {
  _auth ??= buildAuth();
  return _auth;
}

export const auth = new Proxy({} as BetterAuth, {
  get(_target, prop, receiver) {
    return Reflect.get(getAuth(), prop, receiver) as unknown;
  },
  has(_target, prop) {
    return Reflect.has(getAuth(), prop);
  },
});

export type Session = BetterAuth["$Infer"]["Session"];
