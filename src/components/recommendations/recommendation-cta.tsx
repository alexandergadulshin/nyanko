"use client";

import Link from "next/link";

/**
 * Home-page entry point to the recommendation engine. Renders a glassy
 * hero card with a "see your picks" link. Deliberately doesn't pre-fetch
 * recommendations — the engine is fast but it does authenticated DB
 * queries, so we let the user click in.
 */
export function RecommendationCTA() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-[32px] bg-white/[0.03] p-8 ring-1 ring-white/[0.06] backdrop-blur-md shadow-[0_24px_60px_-15px_rgba(168,85,247,0.35)] sm:p-12">
        {/* gradient blooms */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-transparent blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-gradient-to-tr from-indigo-500/20 to-transparent blur-3xl"
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-purple-300/80">
              Personal picks
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Recommendations tuned to your taste
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              We score every candidate against your watch history across MyAnimeList
              and AniList, then diversify the result so you don&apos;t see four
              versions of the same show.
            </p>
          </div>

          <Link
            href="/recommendations"
            className="inline-flex items-center justify-center self-start rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-lg transition-colors hover:bg-zinc-100 sm:self-center"
          >
            See your picks
            <svg viewBox="0 0 24 24" className="ml-1 h-4 w-4" aria-hidden="true">
              <path
                d="M5 12h14M13 5l7 7-7 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
