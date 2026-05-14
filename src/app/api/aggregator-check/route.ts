// TEMPORARY: probes every layer of the aggregator + recommendation engine.
// Delete this file once verified.

import { NextResponse } from "next/server";
import { aggregator } from "~/lib/aggregator";
import { recommend } from "~/lib/recommendation";

async function time<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<{ label: string; ms: number; ok: boolean; size: number; err?: string }> {
  const t0 = Date.now();
  try {
    const v = await fn();
    const size = Array.isArray(v) ? v.length : v ? 1 : 0;
    return { label, ms: Date.now() - t0, ok: true, size };
  } catch (err) {
    return {
      label,
      ms: Date.now() - t0,
      ok: false,
      size: 0,
      err: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function GET() {
  const health = aggregator.health();

  // Pass 1: cold network paths (or memory-cached after first warmup).
  const cold = await Promise.all([
    time("taxonomy.genres", () => aggregator.taxonomy.genres()),
    time("anime.top(3)", () => aggregator.anime.top(3)),
    time("anime.currentlyAiring(3)", () => aggregator.anime.currentlyAiring(3)),
    time("character.search(\"luffy\", 3)", () => aggregator.character.search("luffy", 3)),
    time("manga.top(3)", () => aggregator.manga.top(3)),
    time("anime.byId(16498)", () => aggregator.anime.byId(16498)), // multi-source merged
    time("anime.search(\"naruto\", 5)", () => aggregator.anime.search("naruto", 5)),
  ]);

  // Pass 2: same calls — should be served entirely from cache and be nearly instant.
  const warm = await Promise.all([
    time("taxonomy.genres", () => aggregator.taxonomy.genres()),
    time("anime.top(3)", () => aggregator.anime.top(3)),
    time("anime.currentlyAiring(3)", () => aggregator.anime.currentlyAiring(3)),
    time("character.search(\"luffy\", 3)", () => aggregator.character.search("luffy", 3)),
    time("manga.top(3)", () => aggregator.manga.top(3)),
    time("anime.byId(16498)", () => aggregator.anime.byId(16498)),
    time("anime.search(\"naruto\", 5)", () => aggregator.anime.search("naruto", 5)),
  ]);

  /* ---------------- engine probe (no auth, synthetic profile) -------------- */
  // Build a small synthetic profile by anchoring on two known shows so the
  // engine has actual entries to score against. Uses cached details.
  const [aot, deathnote] = await Promise.all([
    aggregator.anime.byId(16498).catch(() => null),
    aggregator.anime.byId(1535).catch(() => null),
  ]);

  const entries = [
    aot && {
      malId: 16498,
      score: 10 as number | null,
      status: "completed",
      isFavorite: true,
      details: aot,
    },
    deathnote && {
      malId: 1535,
      score: 9 as number | null,
      status: "completed",
      isFavorite: false,
      details: deathnote,
    },
  ].filter((x): x is NonNullable<typeof x> => x !== null);

  const t0 = Date.now();
  const profileRecs = await recommend({ entries, limit: 6 });
  const profileMs = Date.now() - t0;

  const t1 = Date.now();
  const seedRecs = await recommend({ entries: [], limit: 6, seedMalId: 16498 });
  const seedMs = Date.now() - t1;

  return NextResponse.json({
    health,
    cold,
    warm,
    engine: {
      profileMode: {
        elapsedMs: profileMs,
        meta: profileRecs.meta,
        results: profileRecs.recommendations.map((r) => ({
          title: r.title,
          score: r.score,
          confidence: r.confidence,
          reason: r.reason,
          fromSource: r.fromSource,
          matchedTags: r.matchedTags,
        })),
      },
      seedMode: {
        elapsedMs: seedMs,
        meta: seedRecs.meta,
        results: seedRecs.recommendations.map((r) => ({
          title: r.title,
          score: r.score,
          confidence: r.confidence,
          reason: r.reason,
          fromSource: r.fromSource,
        })),
      },
    },
  });
}
