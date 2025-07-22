"use client";

import React, { useEffect, useState } from "react";
import { jikanAPI, type AnimeItem } from "~/lib/jikan-api";
import { BaseAnimeCarousel } from "./base-anime-carousel";

export function AnimeCarousel() {
  const [animeData, setAnimeData] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAiringAnime = async () => {
      try {
        setLoading(true);
        setError(null);
        const airingAnime = await jikanAPI.getCurrentlyAiring(20);
        setAnimeData(airingAnime);
      } catch (err) {
        setError('Failed to fetch anime data. Please try again later.');
        console.error('Error fetching anime:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAiringAnime();
  }, []);

  return (
    <BaseAnimeCarousel
      animeData={animeData}
      loading={loading}
      error={error}
      title="Popular: New Releases"
      autoplay={true}
      autoplayDelay={3200}
    />
  );
}