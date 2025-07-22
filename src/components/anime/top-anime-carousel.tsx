"use client";

import React, { useEffect, useState } from "react";
import { jikanAPI, type AnimeItem } from "~/lib/jikan-api";
import { BaseAnimeCarousel } from "./base-anime-carousel";

export function TopAnimeCarousel() {
  const [animeData, setAnimeData] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopAnime = async () => {
      try {
        setLoading(true);
        setError(null);
        const topAnime = await jikanAPI.getTopAnime(20);
        setAnimeData(topAnime);
      } catch (err) {
        setError('Failed to fetch top anime data. Please try again later.');
        console.error('Error fetching top anime:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopAnime();
  }, []);

  return (
    <BaseAnimeCarousel
      animeData={animeData}
      loading={loading}
      error={error}
      title="Top Rated Anime"
      autoplay={true}
      autoplayDelay={6000}
    />
  );
}