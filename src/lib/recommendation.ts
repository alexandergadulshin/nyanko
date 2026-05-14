/**
 * Content-based recommendation engine.
 *
 * Input: a user's watched/rated anime list, with per-item metadata
 * (genres, studios, themes) and their score.
 * Output: a ranked list of candidate anime they haven't seen yet,
 * scored by similarity to their existing taste.
 *
 * Approach (well-trodden content-based collaborative filtering basics):
 *   1. Build a *taste profile* from the user's history: each genre /
 *      studio / theme gets a weight proportional to how the user has
 *      rated anime carrying that tag (high rating → high weight,
 *      low rating → negative weight).
 *   2. Score each candidate by summing the user's weights for the
 *      candidate's tags, normalized by tag count to avoid bias toward
 *      anime with many tags.
 *   3. Drop candidates already in the user's list.
 *   4. Return the top-N.
 *
 * Pure, deterministic, no DB or HTTP — easy to unit-test.
 */

import type { DetailedAnimeItem } from "~/utils/api";

/** User's rating of a single anime, with the data we use to build their profile. */
export interface UserAnimeEntry {
  malId: number;
  /** 1-10; null if unrated. */
  score: number | null;
  /** "completed" | "watching" | "dropped" | "paused" | "planning" */
  status: string;
  /** From the cached anime detail — used to score against. */
  details: DetailedAnimeItem;
}

export interface RecommendationResult {
  malId: number;
  title: string;
  image: string;
  score: number;
  matchedTags: string[];
}

/* ----------------------------- Profile building ----------------------------- */

/**
 * Convert a 1–10 score into a weight in roughly [-1, +1].
 * 10 → +1, 7.5 → 0 (neutral), 5 → -0.5, etc. Unrated items get a
 * small positive weight (the user picked it up — that's a weak signal).
 */
function scoreToWeight(score: number | null): number {
  if (score === null) return 0.1;
  return (score - 7) / 3; // 10→1, 7→0, 4→-1
}

function statusMultiplier(status: string): number {
  switch (status.toLowerCase()) {
    case "completed":
      return 1.0;
    case "watching":
      return 0.7;
    case "paused":
      return 0.4;
    case "planning":
      return 0.2;
    case "dropped":
      return -0.5;
    default:
      return 0.3;
  }
}

interface TasteProfile {
  /** tag → total weight; positive = liked, negative = disliked */
  weights: Map<string, number>;
  /** Number of entries the profile is built from; used for normalization. */
  size: number;
}

export function buildTasteProfile(entries: UserAnimeEntry[]): TasteProfile {
  const weights = new Map<string, number>();
  const bump = (tag: string, delta: number) => {
    if (!tag || tag.trim() === "") return;
    weights.set(tag, (weights.get(tag) ?? 0) + delta);
  };

  for (const e of entries) {
    const w = scoreToWeight(e.score) * statusMultiplier(e.status);
    if (w === 0) continue;
    for (const g of e.details.genres) bump(`genre:${g}`, w);
    for (const t of e.details.themes) bump(`theme:${t}`, w * 0.7);
    for (const s of e.details.studios) bump(`studio:${s}`, w * 0.4);
    for (const d of e.details.demographics) bump(`demo:${d}`, w * 0.3);
  }

  return { weights, size: entries.length };
}

/* ----------------------------- Candidate scoring ---------------------------- */

function tagsOf(item: DetailedAnimeItem): string[] {
  return [
    ...item.genres.map((g) => `genre:${g}`),
    ...item.themes.map((t) => `theme:${t}`),
    ...item.studios.map((s) => `studio:${s}`),
    ...item.demographics.map((d) => `demo:${d}`),
  ];
}

function scoreCandidate(
  candidate: DetailedAnimeItem,
  profile: TasteProfile,
): { score: number; matchedTags: string[] } {
  const tags = tagsOf(candidate);
  if (tags.length === 0) return { score: 0, matchedTags: [] };

  let raw = 0;
  const matched: Array<{ tag: string; contribution: number }> = [];
  for (const tag of tags) {
    const w = profile.weights.get(tag);
    if (w === undefined || w === 0) continue;
    raw += w;
    matched.push({ tag, contribution: w });
  }

  // Boost: well-rated anime are more likely to be good recommendations.
  // Treat the candidate's average rating as a quality prior.
  const qualityPrior = candidate.score != null ? (candidate.score - 6) / 4 : 0;

  // Normalize by tag count so 12-tag shows don't dominate.
  const normalized = raw / Math.sqrt(tags.length);

  return {
    score: normalized + qualityPrior * 0.3,
    matchedTags: matched
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 4)
      .map((m) => m.tag.split(":")[1] ?? m.tag),
  };
}

/* -------------------------------- Public API -------------------------------- */

/**
 * Rank candidates against the user's taste profile, excluding anything
 * already in their list (by malId).
 */
export function recommend(
  userEntries: UserAnimeEntry[],
  candidates: DetailedAnimeItem[],
  options: { limit?: number; excludeSeenMalIds?: Set<number> } = {},
): RecommendationResult[] {
  const limit = options.limit ?? 10;
  const seen = options.excludeSeenMalIds ?? new Set(userEntries.map((e) => e.malId));

  // No history → fall back to candidate quality alone.
  const profile = buildTasteProfile(userEntries);

  const scored: RecommendationResult[] = [];
  for (const c of candidates) {
    if (seen.has(c.malId)) continue;
    const { score, matchedTags } = scoreCandidate(c, profile);
    if (score === 0 && profile.size > 0) continue;  // user has taste, no signal
    scored.push({
      malId: c.malId,
      title: c.title,
      image: c.image,
      score,
      matchedTags,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
