/**
 * Cache layer for external API responses.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * are set (production / staging). Falls back to an in-process Map-based
 * cache with TTL when those env vars are missing (local dev without an
 * Upstash account, or when Upstash is unreachable).
 *
 * Public API is a single `cache` object:
 *   - cache.get<T>(key)        : T | null
 *   - cache.set<T>(key, val, ttlSec)
 *   - cache.del(key)
 *   - cache.withCache(key, ttlSec, () => Promise<T>) : Promise<T>
 *
 * Keys are namespaced by source via `cacheKey` helpers in cache-keys.ts.
 */

import { Redis } from "@upstash/redis";

/** Generic key/value cache contract. */
interface CacheBackend {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
}

/* ----------------------------- Upstash backend ---------------------------- */

class UpstashBackend implements CacheBackend {
  private client: Redis;

  constructor(url: string, token: string) {
    this.client = new Redis({ url, token });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Upstash returns parsed JSON for objects automatically.
      const v = await this.client.get<T>(key);
      return (v as T) ?? null;
    } catch (err) {
      console.warn(`[cache] upstash get failed for ${key}:`, err);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.client.set(key, value, { ex: ttlSeconds });
    } catch (err) {
      console.warn(`[cache] upstash set failed for ${key}:`, err);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      console.warn(`[cache] upstash del failed for ${key}:`, err);
    }
  }
}

/* --------------------------- In-memory fallback --------------------------- */

interface MemoryEntry {
  value: unknown;
  expiresAt: number;
}

class MemoryBackend implements CacheBackend {
  private store = new Map<string, MemoryEntry>();
  private maxEntries: number;

  constructor(maxEntries = 5_000) {
    this.maxEntries = maxEntries;
  }

  private sweepIfNeeded() {
    if (this.store.size <= this.maxEntries) return;
    // Drop the oldest 10% (insertion order). Map iteration is insertion-ordered.
    const dropCount = Math.floor(this.maxEntries * 0.1);
    let dropped = 0;
    for (const key of this.store.keys()) {
      if (dropped >= dropCount) break;
      this.store.delete(key);
      dropped++;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1_000,
    });
    this.sweepIfNeeded();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

/* -------------------------------- Selector -------------------------------- */

function pickBackend(): CacheBackend {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return new UpstashBackend(url, token);
  }
  if (process.env.NODE_ENV !== "test") {
    console.info(
      "[cache] UPSTASH_REDIS_REST_URL/TOKEN not set — using in-memory cache fallback",
    );
  }
  return new MemoryBackend();
}

// Singleton — survives across function invocations on warm Lambdas.
const globalForCache = globalThis as unknown as { __cache?: CacheBackend };
const backend: CacheBackend = globalForCache.__cache ?? pickBackend();
if (process.env.NODE_ENV !== "production") globalForCache.__cache = backend;

/* --------------------------------- Public --------------------------------- */

export const cache = {
  /** Get a cached value or null. */
  get: <T>(key: string) => backend.get<T>(key),
  /** Set with TTL (seconds). */
  set: <T>(key: string, value: T, ttlSeconds: number) =>
    backend.set(key, value, ttlSeconds),
  /** Invalidate. */
  del: (key: string) => backend.del(key),

  /**
   * Memoize an async producer for a TTL window. If the key is cached,
   * return the cached value. Otherwise call `producer`, cache the result,
   * and return it.
   *
   * Failures inside `producer` are NOT cached (negative results would
   * pin a bad response for the whole TTL window).
   */
  async withCache<T>(
    key: string,
    ttlSeconds: number,
    producer: () => Promise<T>,
  ): Promise<T> {
    const cached = await backend.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await producer();
    // Only cache truthy results — null/undefined typically signal "not found"
    // and shouldn't be remembered for the full TTL.
    if (fresh !== null && fresh !== undefined) {
      await backend.set(key, fresh, ttlSeconds);
    }
    return fresh;
  },
};

/** TTL constants used across the codebase. Centralised so we tune in one place. */
export const TTL = {
  /** Search results: relatively short — results change as new shows air. */
  SEARCH: 5 * 60,          //  5 minutes
  /** Individual item details: stable but seasonal data still mutates. */
  ITEM_DETAILS: 60 * 60,   //  1 hour
  /** "Top" / aggregate lists: rarely change in a single session. */
  TOP_LISTS: 30 * 60,      // 30 minutes
  /** Genres / taxonomies: effectively static. */
  TAXONOMY: 24 * 60 * 60,  // 24 hours
} as const;
