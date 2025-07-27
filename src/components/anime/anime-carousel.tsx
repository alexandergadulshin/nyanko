"use client";

import React from "react";
import { useCarousel } from "~/hooks/use-carousel";
import { UnifiedCarousel } from "~/components/shared/unified-carousel";

export const AnimeCarousel = React.memo(() => {
  const { data, loading, error } = useCarousel({
    fetchType: 'currentlyAiring',
    limit: 16
  });

  return (
    <UnifiedCarousel
      data={data}
      loading={loading}
      error={error}
      title="Popular: New Releases"
      cardType="full"
      showSearchBar={true}
      swiperOptions={{
        autoplay: true,
        autoplayDelay: 3200
      }}
    />
  );
});

AnimeCarousel.displayName = 'AnimeCarousel';