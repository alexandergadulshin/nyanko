"use client";

/**
 * CarouselWrapper — composition layer for the three home-page carousels.
 *
 * Accepts server-prefetched data via props. When data is provided, the
 * inner carousel components skip their client fetch and the first paint
 * shows real content. When props are absent (the wrapper used elsewhere),
 * the carousels fall back to client-side fetching.
 *
 * We dropped the previous `lazy(() => import(...))` layering. With the
 * page now a Server Component, the carousels render server-side too;
 * pretending they're heavy enough to deserve their own JS-chunk boundary
 * was costing TypeScript ergonomics without a real runtime win.
 */

import React from "react";
import type { AnimeItem, MangaItem } from "~/utils/api";
import { AnimeCarousel } from "./anime-carousel";
import { TopAnimeCarousel } from "./top-anime-carousel";
import { TopMangaCarousel } from "./top-manga-carousel";

interface Props {
  airingData?: readonly AnimeItem[];
  topAnimeData?: readonly AnimeItem[];
  topMangaData?: readonly MangaItem[];
}

export const CarouselWrapper = React.memo(function CarouselWrapper({
  airingData,
  topAnimeData,
  topMangaData,
}: Props) {
  return (
    <>
      <AnimeCarousel initialData={airingData} />
      <div className="mt-6">
        <TopAnimeCarousel initialData={topAnimeData} />
      </div>
      <TopMangaCarousel initialData={topMangaData} />
    </>
  );
});
