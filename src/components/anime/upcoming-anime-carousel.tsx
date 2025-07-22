"use client";

import React, { useEffect, useState } from "react";
import { jikanAPI, type AnimeItem } from "~/lib/jikan-api";
import { BaseAnimeCarousel } from "./base-anime-carousel";

export function UpcomingAnimeCarousel() {
  const [animeData, setAnimeData] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpcomingAnime = async () => {
      try {
        setLoading(true);
        setError(null);
        const upcomingAnime = await jikanAPI.getUpcomingAnime(20);
        setAnimeData(upcomingAnime);
      } catch (err) {
        setError('Failed to fetch upcoming anime data. Please try again later.');
        console.error('Error fetching upcoming anime:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingAnime();
  }, []);

  return (
    <BaseAnimeCarousel
      animeData={animeData}
      loading={loading}
      error={error}
      title="Upcoming Anime"
      autoplay={true}
      autoplayDelay={7000}
    />
  );
}