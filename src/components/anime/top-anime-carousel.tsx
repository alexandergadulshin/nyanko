"use client";

import React from "react";
import { useCarousel } from "~/hooks/use-carousel";
import { UnifiedCarousel } from "~/components/shared/unified-carousel";
import type { AnimeItem } from "~/utils/api";

interface Props {
  initialData?: readonly AnimeItem[];
}

export const TopAnimeCarousel = React.memo(function TopAnimeCarousel({ initialData }: Props) {
  const { data, loading, error } = useCarousel<AnimeItem>({
    fetchType: 'topAnime',
    limit: 16,
    initialData,
  });

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between mb-2 px-4">
        <h2 className="text-2xl font-bold">
          <span className="text-white light:text-black light:[-webkit-text-stroke:none]" style={{ WebkitTextStroke: '0.35px #000000' }}>Top</span>
          <span className="text-white light:text-black"> </span>
          <span className="text-white light:text-black light:[-webkit-text-stroke:none]" style={{ WebkitTextStroke: '0.35px #000000' }}>Rated</span>
          <span className="text-white light:text-black">:</span>
          <span className="text-[#fbbf24] light:text-orange-600"> Anime</span>
        </h2>
      </div>

      <div className="relative px-4">
        <UnifiedCarousel
          data={data}
          loading={loading}
          error={error}
          cardType="compact"
          navigationClass="top-anime-button"
          swiperOptions={{
            centeredSlides: false
          }}
        />
      </div>
    </div>
  );
});