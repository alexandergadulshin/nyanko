/**
 * Home page — Server Component.
 *
 * Why this is fast: this file no longer has "use client", so it renders
 * on the server. We fetch all three carousel datasets in parallel via
 * jikanAPI (which already runs through our cache + token-bucket), and
 * pass the results into the carousels as `initialData`. The first paint
 * arrives with the actual anime + manga already in the HTML — no spinner
 * round-trip, no JS-then-fetch waterfall.
 *
 * With Next.js's revalidate ISR layered on top, the rendered HTML is
 * memoized for 5 minutes. Subsequent visitors in that window get the
 * pre-rendered page from the edge.
 *
 * Nothing visual or behavioral changes: same carousels, same Swiper
 * autoplay, same hooks. Only the *data source* moved from the browser
 * to the server.
 */

import { Suspense } from "react";
import { jikanAPI } from "~/utils/api";
import { CarouselWrapper } from "~/components/anime/carousel-wrapper";
import { RecommendationCTA } from "~/components/recommendations/recommendation-cta";
import { MessageHandler } from "~/components/anime/message-handler";
import "~/components/anime/styles.css";

// Regenerate the prerendered HTML at most every 5 minutes. Lines up with
// TTL.SEARCH in src/lib/cache.ts.
export const revalidate = 300;

export default async function HomePage() {
  // Parallel fan-out. Warm cache → ~ms. Cold cache → serializes through
  // the jikan token-bucket but still completes well under a second for
  // three calls (burst capacity is 5).
  const [airingData, topAnimeData, topMangaData] = await Promise.all([
    jikanAPI.getCurrentlyAiring(16).catch(() => []),
    jikanAPI.getTopAnime(16).catch(() => []),
    jikanAPI.getTopManga(16).catch(() => []),
  ]);

  return (
    <main className="min-h-screen bg-[#181622] light:bg-transparent">
      <Suspense fallback={null}>
        <MessageHandler />
      </Suspense>
      <section className="pt-28 pb-8 overflow-visible">
        <CarouselWrapper
          airingData={airingData}
          topAnimeData={topAnimeData}
          topMangaData={topMangaData}
        />
      </section>

      <section className="pb-16">
        <RecommendationCTA />
      </section>
    </main>
  );
}
