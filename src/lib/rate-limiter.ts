/**
 * Token-bucket rate limiter, per source.
 *
 * Each source (e.g. "jikan", "anilist") gets its own bucket sized to that
 * service's documented limit. `await rateLimit('jikan')` resolves when a
 * token is available — i.e. it transparently throttles bursts.
 *
 * Bucket state is per-process. For multi-instance deploys this would need
 * to move to Upstash; for v1 (single Vercel function instance per request
 * at low traffic) in-process is sufficient.
 *
 * The Jikan public API publishes a limit of 3 requests/second (with a
 * burst of 60/minute). AniList is 90 requests/minute (1.5/sec sustained).
 * See https://docs.api.jikan.moe/#section/Information/Rate-Limiting
 *      https://docs.anilist.co/guide/rate-limiting
 */

interface BucketConfig {
  /** Steady-state tokens per second. */
  rate: number;
  /** Max burst capacity. */
  capacity: number;
}

interface BucketState extends BucketConfig {
  tokens: number;
  lastRefillMs: number;
}

const buckets: Record<string, BucketState> = {};

const SOURCE_CONFIGS: Record<string, BucketConfig> = {
  // Jikan: ~3 req/s sustained, burst of 60/min ~= 1/s long-term. Stay
  // conservative to avoid 429s during searches.
  jikan: { rate: 2, capacity: 5 },
  // AniList: 90 req/min sustained.
  anilist: { rate: 1.4, capacity: 5 },
};

function getBucket(source: string): BucketState {
  let b = buckets[source];
  if (b) return b;
  const cfg = SOURCE_CONFIGS[source] ?? { rate: 2, capacity: 5 };
  b = { ...cfg, tokens: cfg.capacity, lastRefillMs: Date.now() };
  buckets[source] = b;
  return b;
}

function refill(b: BucketState) {
  const now = Date.now();
  const elapsedSec = (now - b.lastRefillMs) / 1_000;
  if (elapsedSec <= 0) return;
  b.tokens = Math.min(b.capacity, b.tokens + elapsedSec * b.rate);
  b.lastRefillMs = now;
}

/**
 * Wait until a token is available for `source`, then consume it.
 * Returns immediately if a token is currently available.
 */
export async function rateLimit(source: string): Promise<void> {
  const b = getBucket(source);
  refill(b);
  if (b.tokens >= 1) {
    b.tokens -= 1;
    return;
  }
  // Compute how long we need to wait for one token at the bucket's rate.
  const neededTokens = 1 - b.tokens;
  const waitMs = Math.ceil((neededTokens / b.rate) * 1_000);
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  refill(b);
  b.tokens = Math.max(0, b.tokens - 1);
}

/**
 * Convenience wrapper: rate-limit then run a producer. Useful when a
 * call site wants a one-liner.
 */
export async function withRateLimit<T>(
  source: string,
  producer: () => Promise<T>,
): Promise<T> {
  await rateLimit(source);
  return producer();
}
