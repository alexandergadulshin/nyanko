import type { DetailedAnimeItem } from "~/utils/api";

/* ----------------------------- User-side input ----------------------------- */

export type AnimeStatus =
  | "completed"
  | "watching"
  | "paused"
  | "planning"
  | "dropped";

/** A single entry in the user's anime list, joined with detail metadata. */
export interface UserAnimeEntry {
  malId: number;
  /** 1-10; null if not rated. */
  score: number | null;
  /** Lowercase status string from the DB. */
  status: string;
  /** Merged Jikan + AniList detail record. */
  details: DetailedAnimeItem;
  /** Optional: is this entry from the favorites table? Boosts engagement. */
  isFavorite?: boolean;
}

/* ----------------------------- Profile internals --------------------------- */

/** Map from tag (e.g. "genre:Action") to signed contribution weight. */
export type TasteWeights = Map<string, number>;

export interface TasteProfile {
  weights: TasteWeights;
  /** Number of entries used to build the profile. */
  size: number;
  /** Top anchors — high-confidence positive entries we use for similar-to lookups. */
  anchors: UserAnimeEntry[];
  /** Genre IDs sorted by affinity (positive first). Used for genre-pool generation. */
  topGenreIds: number[];
  /** Studio names with high positive weight. */
  topStudios: string[];
  /** Mean user score on rated entries (for centering). */
  meanScore: number;
}

/* ----------------------------- Candidate side ------------------------------ */

export type CandidateSource =
  | "similar"     // Jikan/MAL "recommendations" from an anchor
  | "genre"       // Top-anime within a user's favored genre
  | "studio"      // Other shows from a beloved studio
  | "airing"      // Currently airing, taste-matched
  | "discovery";  // Quality wildcard outside user's usual taste

/** A candidate considered by the engine, before final ranking. */
export interface CandidateData {
  details: DetailedAnimeItem;
  /** All strategies that produced this candidate. */
  sources: Set<CandidateSource>;
  /** Anchor (from the user's list) that introduced this candidate, if any. */
  anchor?: { malId: number; title: string };
}

/** A candidate after scoring. */
export interface ScoredCandidate extends CandidateData {
  score: number;
  features: FeatureVector;
  /** Tags from this candidate that contributed positively, sorted by impact. */
  matchedTags: Array<{ tag: string; label: string; contribution: number }>;
}

export interface FeatureVector {
  genre: number;
  theme: number;
  studio: number;
  demographic: number;
  quality: number;
  popularity: number;
  antiAffinity: number;
  sourceBoost: number;
}

/* ------------------------------- Final output ------------------------------ */

export interface Recommendation {
  malId: number;
  title: string;
  image: string;
  score: number;
  /** 0–100 confidence score. */
  confidence: number;
  /** Primary human-readable explanation, e.g. "Because you loved Cowboy Bebop". */
  reason: string;
  /** Optional secondary line, e.g. "Action · Adventure · Sci-Fi". */
  matchedTags: string[];
  /** Strategy that contributed most to ranking. */
  fromSource: CandidateSource;
  /** MAL ID of the anchor that introduced this rec (if from 'similar'). */
  seedMalId?: number;
  /** Candidate's own MAL score for display. */
  candidateScore: number | null;
  /** "TV", "Movie", "OVA", etc. */
  type: string;
  /** Total episodes (or null if unknown). */
  episodes: number | null;
}

export interface RecommendationMeta {
  profileSize: number;
  candidatesEvaluated: number;
  strategies: CandidateSource[];
  elapsedMs: number;
  empty?: "no-profile" | "no-candidates";
}

export interface RecommendInput {
  entries: UserAnimeEntry[];
  limit?: number;
  /** When set, ignore profile and recommend by similar-to-seed only. */
  seedMalId?: number;
}

export interface RecommendOutput {
  recommendations: Recommendation[];
  meta: RecommendationMeta;
}
