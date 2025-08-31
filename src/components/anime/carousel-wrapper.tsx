"use client";

import React, { lazy, Suspense } from "react";

// Lazy load heavy carousel components
const AnimeCarousel = lazy(() => import("./anime-carousel").then(module => ({ default: module.AnimeCarousel })));
const TopAnimeCarousel = lazy(() => import("./top-anime-carousel").then(module => ({ default: module.TopAnimeCarousel })));
const TopMangaCarousel = lazy(() => import("./top-manga-carousel").then(module => ({ default: module.TopMangaCarousel })));

const CarouselSkeleton = () => (
  <div className="w-full">
    <div className="flex items-center justify-center h-64">
      <div className="animate-pulse space-y-4 w-full max-w-4xl">
        <div className="h-8 bg-gray-700 rounded w-1/3"></div>
        <div className="flex space-x-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-1 space-y-2">
              <div className="h-48 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const CarouselWrapper = React.memo(() => {
  return (
    <>
      <Suspense fallback={<CarouselSkeleton />}>
        <AnimeCarousel />
      </Suspense>
      <div className="mt-6">
        <Suspense fallback={<CarouselSkeleton />}>
          <TopAnimeCarousel />
        </Suspense>
      </div>
      <Suspense fallback={<CarouselSkeleton />}>
        <TopMangaCarousel />
      </Suspense>
    </>
  );
});

CarouselWrapper.displayName = 'CarouselWrapper';