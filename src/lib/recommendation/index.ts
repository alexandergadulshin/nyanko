/**
 * Public recommendation engine entry point.
 *
 *   recommend({ entries, limit, seedMalId })
 *     → { recommendations, meta }
 *
 * High-level flow:
 *   1. Build taste profile from user's hydrated anime list.
 *   2. Fan out to 4 candidate strategies in parallel
 *      (similar-to-anchor, top-genre, currently-airing, discovery).
 *   3. Score each candidate against the profile across 8 features.
 *   4. MMR-rerank to enforce diversity.
 *   5. Generate human explanations + confidence scores.
 *
 * Seed mode (`seedMalId` provided) bypasses the profile entirely and
 * returns "more like this" results anchored on the seed.
 */

import { buildTasteProfile } from "./profile";
import {
  generateCandidates,
  generateSeedCandidates,
} from "./candidates";
import { scoreAll, mmrRerank, confidenceOf } from "./score";
import { explain } from "./explain";
import type {
  RecommendInput,
  RecommendOutput,
  Recommendation,
  CandidateSource,
} from "./types";

const DEFAULT_LIMIT = 12;
const RANK_POOL_MULTIPLIER = 3; // score this many, MMR picks final from here

export async function recommend(input: RecommendInput): Promise<RecommendOutput> {
  const t0 = Date.now();
  const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), 30);
  const isSeedMode = typeof input.seedMalId === "number";

  /* -------------------------- profile + candidates -------------------------- */
  const profile = buildTasteProfile(input.entries);
  const excludeMalIds = new Set(input.entries.map((e) => e.malId));

  let candidates;
  let strategies: CandidateSource[];
  if (isSeedMode && input.seedMalId) {
    const seedResult = await generateSeedCandidates(input.seedMalId, excludeMalIds);
    candidates = seedResult.candidates;
    strategies = seedResult.strategies;
  } else {
    const result = await generateCandidates(profile, excludeMalIds);
    candidates = result.candidates;
    strategies = result.strategies;
  }

  if (candidates.size === 0) {
    return {
      recommendations: [],
      meta: {
        profileSize: profile.size,
        candidatesEvaluated: 0,
        strategies,
        elapsedMs: Date.now() - t0,
        empty: profile.size === 0 ? "no-profile" : "no-candidates",
      },
    };
  }

  /* ---------------------------- score + diversify --------------------------- */
  const scored = scoreAll(candidates, profile);
  // For empty profiles, fall back to quality + popularity only (the features
  // for genre/theme/etc. will be zero anyway). Sort and skip MMR to keep the
  // top-quality flavor.
  const ranked =
    profile.size === 0
      ? scored.sort((a, b) => b.score - a.score).slice(0, limit)
      : mmrRerank(scored, Math.min(limit * RANK_POOL_MULTIPLIER, scored.length))
          .slice(0, limit);

  /* ------------------------------ shape output ------------------------------ */
  const recommendations: Recommendation[] = ranked.map((c) => {
    const { reason, primary } = explain(c, profile, isSeedMode);
    return {
      malId: c.details.malId,
      title: c.details.title,
      image: c.details.image,
      score: Math.round(c.score * 1000) / 1000,
      confidence: confidenceOf(c, profile),
      reason,
      matchedTags: c.matchedTags.slice(0, 3).map((m) => m.label),
      fromSource: primary,
      seedMalId: c.anchor?.malId,
      candidateScore: c.details.score,
      type: c.details.type,
      episodes: c.details.episodes,
    };
  });

  return {
    recommendations,
    meta: {
      profileSize: profile.size,
      candidatesEvaluated: candidates.size,
      strategies,
      elapsedMs: Date.now() - t0,
    },
  };
}

export type {
  Recommendation,
  RecommendationMeta,
  RecommendInput,
  RecommendOutput,
  UserAnimeEntry,
} from "./types";
