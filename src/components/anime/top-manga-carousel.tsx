"use client";

import React from "react";
import { useCarousel } from "~/hooks/use-carousel";
import { UnifiedCarousel } from "~/components/shared/unified-carousel";

export const TopMangaCarousel = React.memo(() => {
  const { data, loading, error } = useCarousel({
    fetchType: 'topManga',
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
          <span className="text-[#fbbf24] light:text-orange-600"> Manga</span>
        </h2>
      </div>

      <div className="relative px-4">
        <UnifiedCarousel
          data={data}
          loading={loading}
          error={error}
          cardType="compact"
          navigationClass="top-manga-button"
          swiperOptions={{
            slidesPerView: 6.5,
            breakpoints: {
              320: { slidesPerView: 2.2, spaceBetween: 12 },
              480: { slidesPerView: 3.3, spaceBetween: 12 },
              640: { slidesPerView: 4.2, spaceBetween: 14 },
              768: { slidesPerView: 4.8, spaceBetween: 14 },
              1024: { slidesPerView: 5.5, spaceBetween: 16 },
              1280: { slidesPerView: 6.2, spaceBetween: 16 },
              1440: { slidesPerView: 6.8, spaceBetween: 16 },
              1536: { slidesPerView: 7.5, spaceBetween: 16 },
            },
            centeredSlides: false
          }}
        />
      </div>
    </div>
  );
});

TopMangaCarousel.displayName = 'TopMangaCarousel';