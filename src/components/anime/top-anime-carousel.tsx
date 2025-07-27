"use client";

import React from "react";
import { useCarousel } from "~/hooks/use-carousel";
import { UnifiedCarousel } from "~/components/shared/unified-carousel";

export const TopAnimeCarousel = React.memo(() => {
  const { data, loading, error } = useCarousel({
    fetchType: 'topAnime',
    limit: 16
  });

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between mb-6 px-4">
        <h2 className="text-2xl font-bold">
          <span style={{ color: '#fff', WebkitTextStroke: '0.35px #000000' }} className="light:[color:#fff] light:[-webkit-text-stroke:0.35px_#000000]">Top</span>
          <span className="text-white light:text-gray-800"> </span>
          <span style={{ color: '#fff', WebkitTextStroke: '0.35px #000000' }} className="light:[color:#fff] light:[-webkit-text-stroke:0.35px_#000000]">Rated</span>
          <span className="text-white light:text-gray-800">:</span>
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
            speed: 800,
            centeredSlides: false
          }}
        />
      </div>
    </div>
  );
});

TopAnimeCarousel.displayName = 'TopAnimeCarousel';