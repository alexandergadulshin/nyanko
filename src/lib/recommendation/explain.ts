/**
 * Recommendation explanations.
 *
 * Picks one short, specific reason per result. Prefers the most concrete
 * signal available: anchor similarity > studio match > matched-tags pair >
 * generic source-fallback. This is what the user actually sees, so the
 * tone matters more than the algorithm here.
 */

import type {
  CandidateSource,
  ScoredCandidate,
  TasteProfile,
} from "./types";

const TOP_STUDIO_THRESHOLD = 0.5;
const TOP_GENRE_THRESHOLD = 0.4;

/** Find the studio on the candidate that's also in the user's high-affinity studios. */
function matchingStudio(c: ScoredCandidate, profile: TasteProfile): string | null {
  for (const s of c.details.studios) {
    const w = profile.weights.get(`studio:${s}`);
    if (w !== undefined && w >= TOP_STUDIO_THRESHOLD) return s;
  }
  return null;
}

export function explain(
  c: ScoredCandidate,
  profile: TasteProfile,
  isSeedMode: boolean,
): { reason: string; primary: CandidateSource } {
  // Seed mode is always anchored — explanation is consistent.
  if (isSeedMode && c.anchor) {
    return {
      reason: `If you liked ${c.anchor.title}`,
      primary: "similar",
    };
  }

  // 1. Anchor-driven: the strongest, most personal reason.
  if (c.sources.has("similar") && c.anchor) {
    return {
      reason: `Because you loved ${c.anchor.title}`,
      primary: "similar",
    };
  }

  // 2. Studio loyalty: only when the user has a clear studio affinity.
  const studio = matchingStudio(c, profile);
  if (studio) {
    return {
      reason: `More from ${studio}`,
      primary: c.sources.has("studio") ? "studio" : "genre",
    };
  }

  // 3. Currently airing: surface freshness when the candidate fits taste.
  if (c.sources.has("airing") && c.matchedTags.length >= 1) {
    const topTag = c.matchedTags[0]!.label;
    return {
      reason: `Airing now in ${topTag}`,
      primary: "airing",
    };
  }

  // 4. Strong tag overlap: lead with what they share.
  const positiveTags = c.matchedTags.filter((m) => m.contribution >= TOP_GENRE_THRESHOLD);
  if (positiveTags.length >= 2) {
    const labels = positiveTags.slice(0, 2).map((t) => t.label);
    return {
      reason: `Strong match · ${labels.join(" + ")}`,
      primary: "genre",
    };
  }
  if (positiveTags.length === 1) {
    return {
      reason: `Top in ${positiveTags[0]!.label}`,
      primary: "genre",
    };
  }

  // 5. Discovery wildcard.
  if (c.sources.has("discovery")) {
    return {
      reason: "Highly rated · branch out",
      primary: "discovery",
    };
  }

  return { reason: "Recommended for you", primary: "discovery" };
}
