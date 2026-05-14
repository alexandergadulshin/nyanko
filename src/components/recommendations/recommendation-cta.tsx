import Link from "next/link";

/**
 * Home-page entry point to the recommendation engine. Presented as a plain
 * page section — a carousel-style heading with the CTA inline, no card or
 * frame — so it blends into the home page instead of reading as a pasted-on
 * widget.
 *
 * No client features (a Link + CSS hover), so it renders on the server.
 */
export function RecommendationCTA() {
  return (
    <div className="w-full px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">
            <span
              className="text-white light:text-black light:[-webkit-text-stroke:none]"
              style={{ WebkitTextStroke: "0.35px #000000" }}
            >
              Recommended
            </span>
            <span className="text-[#e879f9] light:text-fuchsia-600">
              {" "}
              for you
            </span>
          </h2>
          <p className="mt-1.5 text-sm text-zinc-400">
            Tuned to your watch history across MyAnimeList and AniList.
          </p>
        </div>

        <Link
          href="/recommendations"
          className="group inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
        >
          See your picks
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          >
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
  );
}
