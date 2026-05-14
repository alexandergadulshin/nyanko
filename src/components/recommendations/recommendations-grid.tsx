"use client";

/**
 * RecommendationsGrid — single-purpose UI that consumes /api/recommendations
 * and renders results as cards. Self-contained: handles loading, empty, error,
 * and "more like this" seed mode.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { Avatar } from "~/components/ui/avatar";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";

type Source = "similar" | "genre" | "studio" | "airing" | "discovery";

interface Recommendation {
  malId: number;
  title: string;
  image: string;
  score: number;
  confidence: number;
  reason: string;
  matchedTags: string[];
  fromSource: Source;
  seedMalId?: number;
  candidateScore: number | null;
  type: string;
  episodes: number | null;
}

interface RecMeta {
  profileSize: number;
  candidatesEvaluated: number;
  strategies: Source[];
  elapsedMs: number;
  empty?: "no-profile" | "no-candidates";
}

interface ApiResponse {
  recommendations: Recommendation[];
  meta: RecMeta;
}

interface TeaserShow {
  malId: number;
  title: string;
  image: string;
}

interface RecommendationsGridProps {
  /** Initial limit; user can refresh with a different value if desired. */
  limit?: number;
  /** Seed mode: anchor on this MAL ID instead of profile-driven. */
  seedMalId?: number;
  /** Real poster art to render during the loading wait. Server-prefetched. */
  loadingTeasers?: TeaserShow[];
}

const SOURCE_BADGE: Record<
  Source,
  { label: string; cls: string }
> = {
  similar:   { label: "Similar pick", cls: "bg-purple-500/15 text-purple-200 ring-purple-400/30" },
  genre:     { label: "Genre match",  cls: "bg-sky-500/15 text-sky-200 ring-sky-400/30" },
  studio:    { label: "Studio match", cls: "bg-fuchsia-500/15 text-fuchsia-200 ring-fuchsia-400/30" },
  airing:    { label: "Airing now",   cls: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30" },
  discovery: { label: "Discover",     cls: "bg-amber-500/15 text-amber-200 ring-amber-400/30" },
};

export function RecommendationsGrid({
  limit = 18,
  seedMalId,
  loadingTeasers = [],
}: RecommendationsGridProps) {
  const [meta, setMeta] = useState<RecMeta | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rerolling, setRerolling] = useState(false);
  const [noMore, setNoMore] = useState(false);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [disliked, setDisliked] = useState<Set<number>>(new Set());
  // Every malId shown this session, so "show different picks" never repeats one.
  const seenRef = useRef<Set<number>>(new Set());

  const fetchRecs = useCallback(
    async (exclude: number[]): Promise<ApiResponse> => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (typeof seedMalId === "number") params.set("seed", String(seedMalId));
      if (exclude.length) params.set("exclude", exclude.join(","));
      const res = await fetch(`/api/recommendations?${params.toString()}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Recommendations failed (${res.status})`);
      }
      return (await res.json()) as ApiResponse;
    },
    [limit, seedMalId],
  );

  // Initial load — also the "start over" action: a clean slate.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoMore(false);
    try {
      const body = await fetchRecs([]);
      setMeta(body.meta);
      setRecs(body.recommendations);
      seenRef.current = new Set(body.recommendations.map((r) => r.malId));
      setLiked(new Set());
      setDisliked(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load recommendations");
    } finally {
      setLoading(false);
    }
  }, [fetchRecs]);

  useEffect(() => {
    void load();
  }, [load]);

  // "Show me different picks" — keep the liked ones, exclude everything seen
  // so far, and pull a fresh batch for the rest.
  const reroll = useCallback(async () => {
    setRerolling(true);
    setError(null);
    setNoMore(false);
    try {
      // Pair the fetch with a short floor so the loading animation actually
      // gets a moment on screen instead of flashing past on a warm cache.
      const [body] = await Promise.all([
        fetchRecs([...seenRef.current]),
        new Promise((resolve) => setTimeout(resolve, 900)),
      ]);
      const fresh = body.recommendations;
      if (fresh.length === 0) {
        setNoMore(true);
        return;
      }
      const kept = recs.filter((r) => liked.has(r.malId));
      for (const r of fresh) seenRef.current.add(r.malId);
      setRecs([...kept, ...fresh]);
      setMeta(body.meta);
      setLiked(new Set(kept.map((r) => r.malId)));
      setDisliked(new Set());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't refresh recommendations",
      );
    } finally {
      setRerolling(false);
    }
  }, [fetchRecs, recs, liked]);

  const toggleLike = useCallback((malId: number) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(malId)) next.delete(malId);
      else next.add(malId);
      return next;
    });
    setDisliked((prev) => {
      if (!prev.has(malId)) return prev;
      const next = new Set(prev);
      next.delete(malId);
      return next;
    });
  }, []);

  const toggleDislike = useCallback((malId: number) => {
    setDisliked((prev) => {
      const next = new Set(prev);
      if (next.has(malId)) next.delete(malId);
      else next.add(malId);
      return next;
    });
    setLiked((prev) => {
      if (!prev.has(malId)) return prev;
      const next = new Set(prev);
      next.delete(malId);
      return next;
    });
  }, []);

  // Show the engine animation on the first load *and* every re-roll.
  if ((loading && recs.length === 0) || rerolling) {
    return (
      <EngineLoadingState
        teasers={loadingTeasers}
        seedMode={typeof seedMalId === "number"}
      />
    );
  }
  if (error && recs.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-rose-500/5 p-8 text-center ring-1 ring-rose-500/20">
        <p className="text-sm text-rose-200">{error}</p>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => void load()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }
  if (!meta) return null;
  if (recs.length === 0) {
    return (
      <EmptyState
        reason={meta.empty ?? "no-candidates"}
        onRetry={() => void load()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <MetaStrip meta={meta} noMore={noMore} onReroll={() => void reroll()} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {recs.map((r) => (
          <RecommendationCard
            key={r.malId}
            rec={r}
            liked={liked.has(r.malId)}
            disliked={disliked.has(r.malId)}
            onLike={() => toggleLike(r.malId)}
            onDislike={() => toggleDislike(r.malId)}
          />
        ))}
      </div>
      <RerollBar
        likedCount={liked.size}
        dislikedCount={disliked.size}
        rerolling={rerolling}
        noMore={noMore}
        error={error}
        onReroll={() => void reroll()}
      />
    </div>
  );
}

/* ------------------------------- card ------------------------------------ */

function RecommendationCard({
  rec,
  liked,
  disliked,
  onLike,
  onDislike,
}: {
  rec: Recommendation;
  liked: boolean;
  disliked: boolean;
  onLike: () => void;
  onDislike: () => void;
}) {
  const badge = SOURCE_BADGE[rec.fromSource];
  const confidence = Math.max(0, Math.min(100, rec.confidence));

  return (
    <div
      className={
        "group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white/[0.03] ring-1 backdrop-blur-md transition-all duration-200 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)] " +
        (disliked
          ? "opacity-45 ring-white/[0.06]"
          : liked
            ? "ring-emerald-400/40"
            : "ring-white/[0.06] hover:-translate-y-0.5 hover:bg-white/[0.05] hover:ring-purple-400/30")
      }
    >
      <Link
        href={`/anime/${rec.malId}`}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-400/60"
      >
        {/* poster */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-800">
          {rec.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={rec.image}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">
              <Avatar name={rec.title} size="xl" />
            </div>
          )}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent"
          />
          <div className="absolute left-3 top-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ring-1 ring-inset ${badge.cls}`}
            >
              {badge.label}
            </span>
          </div>
          {rec.candidateScore != null && rec.candidateScore > 0 ? (
            <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-medium text-amber-300 backdrop-blur-sm ring-1 ring-amber-400/30">
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden="true">
                <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
              </svg>
              {rec.candidateScore.toFixed(1)}
            </div>
          ) : null}
        </div>

        {/* body */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white">
              {rec.title}
            </h3>
            <p className="mt-1 text-[11px] text-zinc-500">
              {rec.type}
              {rec.episodes ? <> · {rec.episodes} ep</> : null}
            </p>
          </div>

          <p className="line-clamp-2 text-xs leading-snug text-purple-200/90">
            {rec.reason}
          </p>

          {rec.matchedTags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {rec.matchedTags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-zinc-300 ring-1 ring-inset ring-white/[0.06]"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          {/* confidence bar */}
          <div className="mt-auto">
            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span className="font-medium uppercase tracking-wider">Match</span>
              <span className="font-mono text-zinc-200">{confidence}%</span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className={
                  "h-full rounded-full transition-all duration-700 " +
                  (confidence >= 70
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-300"
                    : confidence >= 50
                    ? "bg-gradient-to-r from-sky-400 to-purple-400"
                    : "bg-gradient-to-r from-zinc-400 to-zinc-300")
                }
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </div>
      </Link>

      {/* like / dislike — your feedback shapes the next "different picks" pull */}
      <div className="flex items-center gap-2 border-t border-white/[0.06] px-4 py-2.5">
        <FeedbackButton kind="like" active={liked} onClick={onLike} />
        <FeedbackButton kind="dislike" active={disliked} onClick={onDislike} />
      </div>
    </div>
  );
}

function FeedbackButton({
  kind,
  active,
  onClick,
}: {
  kind: "like" | "dislike";
  active: boolean;
  onClick: () => void;
}) {
  const isLike = kind === "like";
  const Icon = isLike ? FaThumbsUp : FaThumbsDown;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={isLike ? "Like this pick" : "Not for me"}
      className={
        "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium ring-1 ring-inset transition-colors " +
        (active
          ? isLike
            ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
            : "bg-rose-500/15 text-rose-300 ring-rose-400/30"
          : "bg-white/[0.03] text-zinc-400 ring-white/[0.06] hover:bg-white/[0.06] hover:text-zinc-200")
      }
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {isLike ? "Like" : "Not for me"}
    </button>
  );
}

/* ------------------------------ reroll bar ------------------------------- */

function RerollBar({
  likedCount,
  dislikedCount,
  rerolling,
  noMore,
  error,
  onReroll,
}: {
  likedCount: number;
  dislikedCount: number;
  rerolling: boolean;
  noMore: boolean;
  error: string | null;
  onReroll: () => void;
}) {
  const hasFeedback = likedCount > 0 || dislikedCount > 0;
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-white/[0.025] px-6 py-6 text-center ring-1 ring-inset ring-white/[0.05] sm:flex-row sm:justify-between sm:text-left">
      <div>
        <p className="text-sm font-medium text-white">
          {noMore ? "That's every pick we could find" : "Not quite right?"}
        </p>
        <p className="mt-0.5 text-xs text-zinc-400">
          {error
            ? error
            : noMore
              ? "You've been through the whole candidate pool — your likes are still saved above. Reload the page whenever you want a clean slate."
              : hasFeedback
                ? `${likedCount} liked · ${dislikedCount} not for you — we'll keep your likes and swap the rest.`
                : "Pull a different set — anything you like stays, the rest gets replaced."}
        </p>
      </div>
      {!noMore && (
        <button
          type="button"
          onClick={onReroll}
          disabled={rerolling}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {rerolling ? "Finding picks…" : "Show me different picks"}
        </button>
      )}
    </div>
  );
}

/* ------------------------------- meta strip ------------------------------ */

function MetaStrip({
  meta,
  noMore,
  onReroll,
}: {
  meta: RecMeta;
  noMore: boolean;
  onReroll: () => void;
}) {
  const fastLabel = useMemo(() => {
    if (meta.elapsedMs < 200) return "instant";
    if (meta.elapsedMs < 1000) return `${meta.elapsedMs} ms`;
    return `${(meta.elapsedMs / 1000).toFixed(1)} s`;
  }, [meta.elapsedMs]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white/[0.025] px-5 py-3 ring-1 ring-inset ring-white/[0.05]">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-zinc-400">
        <span>
          Profile <span className="font-mono text-zinc-200">{meta.profileSize}</span>
        </span>
        <span>
          Candidates{" "}
          <span className="font-mono text-zinc-200">{meta.candidatesEvaluated}</span>
        </span>
        <span>
          Generated in <span className="font-mono text-zinc-200">{fastLabel}</span>
        </span>
        {meta.strategies.length > 0 && (
          <span className="flex items-center gap-1">
            <span>Strategies</span>
            {meta.strategies.map((s) => (
              <span
                key={s}
                className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-300 ring-1 ring-inset ring-white/[0.06]"
              >
                {s}
              </span>
            ))}
          </span>
        )}
      </div>
      {!noMore && (
        <button
          type="button"
          onClick={onReroll}
          className="shrink-0 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-zinc-200 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] hover:text-white"
        >
          Different picks
        </button>
      )}
    </div>
  );
}

/* ------------------------------- states ---------------------------------- */

/* --------------------------- engine loading state ------------------------ */

interface Stage {
  label: string;
  detail: string;
}

const PROFILE_STAGES: Stage[] = [
  { label: "Reading your watchlist", detail: "Pulling list + favorites from your library" },
  { label: "Asking MyAnimeList & AniList", detail: "Fan-out across both sources, rate-limited" },
  { label: "Scoring against your taste", detail: "Genre / theme / studio affinity + quality prior" },
  { label: "Diversifying picks", detail: "MMR rerank · no five copies of the same show" },
];

const SEED_STAGES: Stage[] = [
  { label: "Asking MyAnimeList for similar shows", detail: "Curated similar-to list for your seed" },
  { label: "Pulling details from AniList", detail: "Cross-reference for richer metadata" },
  { label: "Ranking candidates", detail: "Best matches first" },
  { label: "Almost there", detail: "Putting it together" },
];

/**
 * EngineLoadingState — replaces a dead skeleton with something to watch:
 *   - top: live multi-stage indicator that ticks forward on a timer
 *   - bottom: a marquee strip of real trending posters (server-prefetched)
 *
 * Stage timing is client-side; the server has no streaming hook here. We
 * estimate based on observed cold-cache timings (~4-5 s per stage) and
 * just park on the final stage if the request takes longer. When data
 * arrives the parent unmounts this and the real grid takes over.
 */
function EngineLoadingState({
  teasers,
  seedMode,
}: {
  teasers: TeaserShow[];
  seedMode: boolean;
}) {
  const stages = seedMode ? SEED_STAGES : PROFILE_STAGES;
  const [stage, setStage] = useState(0);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    // Each stage shows for ~4.5 s; bail out before tripping the next stage past the end.
    const interval = setInterval(() => {
      setStage((s) => {
        if (s >= stages.length - 1) {
          setStuck(true);
          return s;
        }
        return s + 1;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [stages.length]);

  return (
    <div className="space-y-8">
      {/* Stage indicator */}
      <div className="relative overflow-hidden rounded-3xl bg-white/[0.03] p-6 ring-1 ring-white/[0.06] backdrop-blur-md sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent blur-3xl"
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <PulseDot />
            <h3 className="text-base font-semibold tracking-tight text-white">
              Crafting your recommendations
            </h3>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            First load on a cold cache can take 15-25 seconds while we fan out to
            both sources. Subsequent loads are instant.
          </p>

          <ol className="mt-6 space-y-3">
            {stages.map((s, i) => {
              const state: "done" | "active" | "queued" =
                i < stage ? "done" : i === stage ? "active" : "queued";
              return <StageRow key={s.label} stage={s} state={state} />;
            })}
          </ol>

          {stuck ? (
            <p className="mt-5 text-xs italic text-zinc-500">
              Still going — the cache is warming. Hang tight.
            </p>
          ) : null}
        </div>
      </div>

      {/* Teaser marquee — real posters from server prefetch */}
      {teasers.length > 0 ? <TeaserMarquee teasers={teasers} /> : null}

      {/* Subtle skeleton tail so the page below feels populated */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-3xl bg-white/[0.02] ring-1 ring-white/[0.04]"
          >
            <Skeleton className="aspect-[3/4] w-full" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PulseDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-purple-500" />
    </span>
  );
}

function StageRow({
  stage,
  state,
}: {
  stage: Stage;
  state: "done" | "active" | "queued";
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">
        {state === "done" ? <CheckIcon /> : state === "active" ? <SpinnerIcon /> : <DotIcon />}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={
            "text-sm font-medium transition-colors " +
            (state === "queued"
              ? "text-zinc-500"
              : state === "active"
              ? "text-white"
              : "text-zinc-300")
          }
        >
          {stage.label}
        </p>
        <p className="text-xs text-zinc-500">{stage.detail}</p>
      </div>
    </li>
  );
}

function CheckIcon() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
      <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
        <path
          d="M5 12l5 5L20 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function SpinnerIcon() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/15 text-purple-200 ring-1 ring-inset ring-purple-400/40">
      <svg viewBox="0 0 24 24" className="h-3 w-3 animate-spin" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="42"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function DotIcon() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.04] text-zinc-500 ring-1 ring-inset ring-white/[0.06]">
      <svg viewBox="0 0 24 24" className="h-1.5 w-1.5 fill-current" aria-hidden="true">
        <circle cx="12" cy="12" r="5" />
      </svg>
    </span>
  );
}

/* ---------------------------- teaser marquee ----------------------------- */

function TeaserMarquee({ teasers }: { teasers: TeaserShow[] }) {
  const router = useRouter();
  // Duplicate the list so the marquee loops seamlessly.
  const loop = useMemo(() => [...teasers, ...teasers], [teasers]);

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
          Meanwhile · trending now
        </span>
      </div>
      <div className="group relative overflow-hidden rounded-3xl bg-white/[0.02] py-4 ring-1 ring-white/[0.04]">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#0A0917] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#0A0917] to-transparent" />
        <div
          className="flex gap-4 animate-[recs-marquee_45s_linear_infinite] group-hover:[animation-play-state:paused]"
          style={{ width: "max-content" }}
        >
          {loop.map((show, i) => (
            <button
              key={`${show.malId}-${i}`}
              onClick={() => router.push(`/anime/${show.malId}`)}
              className="block w-28 shrink-0 overflow-hidden rounded-2xl bg-zinc-800 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.6)] transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60"
              aria-label={show.title}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={show.image}
                alt=""
                className="aspect-[2/3] w-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes recs-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

function EmptyState({
  reason,
  onRetry,
}: {
  reason: "no-profile" | "no-candidates";
  onRetry: () => void;
}) {
  const isProfile = reason === "no-profile";
  return (
    <div className="mx-auto max-w-lg rounded-3xl bg-white/[0.03] p-10 text-center ring-1 ring-white/[0.06]">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/80 to-pink-500/70 text-white shadow-[0_8px_24px_-8px_rgba(168,85,247,0.55)]">
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
          <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold tracking-tight text-white">
        {isProfile ? "Tell us what you like" : "Nothing to recommend yet"}
      </h2>
      <p className="mt-2 text-sm text-zinc-400">
        {isProfile
          ? "Add a few anime to your list — even just three — and we'll start surfacing personal recommendations."
          : "We couldn't find anything new for you right now. Try again in a moment."}
      </p>
      <div className="mt-6">
        <Button variant="secondary" onClick={onRetry}>
          {isProfile ? "Retry" : "Try again"}
        </Button>
      </div>
    </div>
  );
}
