/**
 * Candidate scoring + diversity rerank.
 *
 * Scoring builds a small explainable feature vector per candidate and
 * combines it via a weighted sum. Then we rerank with MMR (Maximal
 * Marginal Relevance) so the final list isn't 20 clones of the top
 * match — picks each next item that maximises score − redundancy.
 */

import type {
  CandidateData,
  FeatureVector,
  ScoredCandidate,
  TasteProfile,
} from "./types";
import type { DetailedAnimeItem } from "~/utils/api";

/* --------------------------- combination weights -------------------------- */
const W = {
  genre: 1.0,
  theme: 0.7,
  studio: 0.5,
  demo: 0.3,
  quality: 0.45,
  popularity: 0.15,
  antiAffinity: -1.0,
  sourceBoost: 0.55,
} as const;

/** Source-level boost added before scaling — rewards curated signals. */
const SOURCE_BOOST = {
  similar: 1.0,      // human-curated similar lists
  studio: 0.6,
  genre: 0.4,
  airing: 0.5,
  discovery: 0.15,
} as const;

/* -------------------------------- helpers --------------------------------- */

function tagsOf(item: DetailedAnimeItem): string[] {
  return [
    ...item.genres.map((g) => `genre:${g}`),
    ...item.themes.map((t) => `theme:${t}`),
    ...item.studios.map((s) => `studio:${s}`),
    ...item.demographics.map((d) => `demo:${d}`),
  ];
}

function tagSetFromDetails(item: DetailedAnimeItem): Set<string> {
  return new Set(tagsOf(item));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/* --------------------------- per-feature scoring -------------------------- */

interface TagScoreResult {
  positive: number;
  negative: number;
  matched: Array<{ tag: string; label: string; contribution: number }>;
}

/**
 * Score a candidate against profile weights for one tag namespace, e.g.
 * "genre:". Returns positive sum (affinity) and negative sum (anti).
 * Normalizes by sqrt(count) so high-tag-count shows don't dominate.
 */
function scoreTagNamespace(
  candidate: DetailedAnimeItem,
  profile: TasteProfile,
  prefix: "genre:" | "theme:" | "studio:" | "demo:",
): TagScoreResult {
  const all = tagsOf(candidate).filter((t) => t.startsWith(prefix));
  if (all.length === 0) return { positive: 0, negative: 0, matched: [] };

  let positive = 0;
  let negative = 0;
  const matched: TagScoreResult["matched"] = [];
  for (const tag of all) {
    const w = profile.weights.get(tag);
    if (w === undefined || w === 0) continue;
    if (w > 0) positive += w;
    else negative += w; // negative number
    matched.push({
      tag,
      label: tag.slice(prefix.length),
      contribution: w,
    });
  }

  const norm = Math.sqrt(all.length);
  return {
    positive: positive / norm,
    negative: negative / norm,
    matched: matched.sort(
      (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution),
    ),
  };
}

/** MAL score (0-10) → roughly [-1, 1.5] with 7 as neutral. */
function qualityPrior(item: DetailedAnimeItem): number {
  if (item.score == null) return 0;
  return (item.score - 7) / 2;
}

/** log10(scoredBy) — popularity sanity check; caps the wild-card effect. */
function popularityPrior(item: DetailedAnimeItem): number {
  const s = item.scoredBy ?? 0;
  if (s <= 0) return 0;
  return Math.min(Math.log10(s) / 6, 1); // 1M scorers → ~1.0
}

function bestSource(c: CandidateData): keyof typeof SOURCE_BOOST {
  if (c.sources.has("similar")) return "similar";
  if (c.sources.has("studio")) return "studio";
  if (c.sources.has("airing")) return "airing";
  if (c.sources.has("genre")) return "genre";
  return "discovery";
}

function combine(features: FeatureVector): number {
  return (
    W.genre * features.genre +
    W.theme * features.theme +
    W.studio * features.studio +
    W.demo * features.demographic +
    W.quality * features.quality +
    W.popularity * features.popularity +
    W.antiAffinity * features.antiAffinity +
    W.sourceBoost * features.sourceBoost
  );
}

/* -------------------------------- scoring -------------------------------- */

export function scoreCandidate(
  candidate: CandidateData,
  profile: TasteProfile,
): ScoredCandidate {
  const item = candidate.details;
  const g = scoreTagNamespace(item, profile, "genre:");
  const t = scoreTagNamespace(item, profile, "theme:");
  const s = scoreTagNamespace(item, profile, "studio:");
  const d = scoreTagNamespace(item, profile, "demo:");

  // Anti-affinity = magnitude of summed negative weights from tags.
  const antiSum = -(g.negative + t.negative + s.negative + d.negative);
  // Normalize anti to [0, 1] using a soft saturation.
  const antiAffinity = antiSum > 0 ? Math.tanh(antiSum) : 0;

  const features: FeatureVector = {
    genre: g.positive,
    theme: t.positive,
    studio: s.positive,
    demographic: d.positive,
    quality: qualityPrior(item),
    popularity: popularityPrior(item),
    antiAffinity,
    sourceBoost: SOURCE_BOOST[bestSource(candidate)],
  };

  const score = combine(features);

  // Take top contributors from any namespace for display.
  const matched = [...g.matched, ...t.matched, ...s.matched, ...d.matched]
    .filter((m) => m.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 4);

  return {
    ...candidate,
    score,
    features,
    matchedTags: matched,
  };
}

export function scoreAll(
  candidates: Map<number, CandidateData>,
  profile: TasteProfile,
): ScoredCandidate[] {
  const out: ScoredCandidate[] = [];
  for (const c of candidates.values()) out.push(scoreCandidate(c, profile));
  return out;
}

/* ---------------------------- MMR diversity rerank ------------------------ */

/**
 * Greedy MMR: pick n items balancing relevance vs novelty.
 * lambda = 1 → pure relevance ranking
 * lambda = 0 → pure diversity
 */
export function mmrRerank(
  scored: ScoredCandidate[],
  n: number,
  lambda = 0.72,
): ScoredCandidate[] {
  if (scored.length <= n) {
    return [...scored].sort((a, b) => b.score - a.score);
  }
  // Pre-sort once so we don't repeatedly look up the same candidate.
  const pool = [...scored].sort((a, b) => b.score - a.score);
  const selected: ScoredCandidate[] = [];
  const selectedTagSets: Set<string>[] = [];

  // Always seed with the top scorer.
  const first = pool.shift();
  if (!first) return [];
  selected.push(first);
  selectedTagSets.push(tagSetFromDetails(first.details));

  while (selected.length < n && pool.length > 0) {
    let bestIdx = -1;
    let bestMmr = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const c = pool[i]!;
      const cTags = tagSetFromDetails(c.details);
      let maxSim = 0;
      for (const s of selectedTagSets) {
        const sim = jaccard(cTags, s);
        if (sim > maxSim) maxSim = sim;
      }
      const mmr = lambda * c.score - (1 - lambda) * maxSim;
      if (mmr > bestMmr) {
        bestMmr = mmr;
        bestIdx = i;
      }
    }
    if (bestIdx === -1) break;
    const pick = pool.splice(bestIdx, 1)[0]!;
    selected.push(pick);
    selectedTagSets.push(tagSetFromDetails(pick.details));
  }

  return selected;
}

/* ---------------------------- confidence ---------------------------- */

/**
 * 0–100 confidence the user will like this. Combines normalized score,
 * profile size (more history = stronger inference), and how many positive
 * tags matched.
 */
export function confidenceOf(
  c: ScoredCandidate,
  profile: TasteProfile,
): number {
  // Soft-cap the raw score to [0, 1] via sigmoid-like mapping.
  // Most scores land in [0, 3] in practice; saturate around 2.
  const normalizedScore = Math.max(0, Math.min(1, c.score / 2));
  const historyConfidence = Math.min(profile.size / 10, 1);
  const matchCount = c.matchedTags.length;
  const matchConfidence = Math.min(matchCount / 4, 1);

  // Weighted blend, biased toward score quality.
  const blended =
    0.55 * normalizedScore + 0.25 * historyConfidence + 0.2 * matchConfidence;
  return Math.round(Math.max(0, Math.min(1, blended)) * 100);
}
