import { RecommendationsGrid } from "~/components/recommendations/recommendations-grid";
import { aggregator } from "~/lib/aggregator";

// Cached trending pulls are warm after the first call, so this adds
// near-zero time to the initial page render while giving us real posters
// to show while the personalised recs are being computed.
export const revalidate = 300;

export default async function RecommendationsPage() {
  // Pre-fetch teasers on the server — already cached at the aggregator
  // level, so this is a single fast pass that fills the page with real
  // content before the client-side recommendation fetch even starts.
  const [trending, airing] = await Promise.all([
    aggregator.anime.top(12).catch(() => []),
    aggregator.anime.currentlyAiring(8).catch(() => []),
  ]);

  const teasers = [...trending, ...airing]
    .filter((a) => a.image && a.title)
    .slice(0, 12)
    .map((a) => ({ malId: a.malId, title: a.title, image: a.image }));

  return (
    <main className="min-h-screen bg-[#0A0917]">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-24 sm:px-6">
        <header className="mb-10 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-purple-300/80">
            Personal picks
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Recommended for you
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Pulled live from MyAnimeList + AniList, scored against your watch
            history and favorites, and diversified so you don&apos;t see the same
            show twice in a different wrapper.
          </p>
        </header>

        <RecommendationsGrid limit={18} loadingTeasers={teasers} />
      </div>
    </main>
  );
}
