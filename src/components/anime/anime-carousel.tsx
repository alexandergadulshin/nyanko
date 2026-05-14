"use client";

import React from "react";
import { useCarousel } from "~/hooks/use-carousel";
import { UnifiedCarousel } from "~/components/shared/unified-carousel";
import type { AnimeItem } from "~/utils/api";

interface Props {
  /** Server-prefetched data. When provided, no client fetch happens. */
  initialData?: readonly AnimeItem[];
}

export const AnimeCarousel = React.memo(function AnimeCarousel({ initialData }: Props) {
  const { data, loading, error } = useCarousel<AnimeItem>({
    fetchType: "currentlyAiring",
    limit: 16,
    initialData,
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
        autoplayDelay: 3200,
      }}
    />
  );
});
