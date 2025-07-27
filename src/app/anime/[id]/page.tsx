"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaStar, FaHeart, FaCalendarAlt, FaTv, FaArrowLeft } from "react-icons/fa";
import { jikanAPI, type DetailedAnimeItem } from "~/utils/api";
import { AddToListButton } from "~/components/anime/add-to-list-button";
import { AddToFavoritesButton } from "~/components/anime/add-to-favorites-button";

export default function AnimeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [anime, setAnime] = useState<DetailedAnimeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const animeId = Array.isArray(params.id) ? params.id[0] : params.id ?? "";

  useEffect(() => {
    const fetchAnimeDetails = async () => {
      if (!animeId) return;
      
      try {
        setLoading(true);
        const animeDetails = await jikanAPI.getAnimeById(parseInt(animeId));
        setAnime(animeDetails);
      } catch (err) {
        setError("Failed to load anime details");
        console.error("Error fetching anime details:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchAnimeDetails();
  }, [animeId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatAiredPeriod = (aired: { from: string | null; to: string | null }) => {
    const from = aired.from ? formatDate(aired.from) : "Unknown";
    const to = aired.to ? formatDate(aired.to) : "Ongoing";
    return `${from} - ${to}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white light:text-gray-800 text-lg">Loading anime details...</p>
        </div>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 light:text-red-600 text-lg mb-4">{error ?? "Anime not found"}</p>
          <button
            onClick={() => router.back()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181622] light:bg-transparent">
      {/* Back Button */}
      <div className="sticky top-0 z-10 bg-[#181622]/80 light:bg-gray-100/80 backdrop-blur-sm border-b border-gray-800 light:border-gray-300">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-400 light:text-gray-600 hover:text-white light:hover:text-gray-800 transition-colors"
          >
            <FaArrowLeft />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Image and Basic Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-32">
              <img
                src={anime.image}
                alt={anime.title}
                className="w-full max-w-sm mx-auto rounded-lg shadow-2xl"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-anime.jpg';
                }}
              />
              
              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <AddToListButton 
                  anime={{
                    mal_id: parseInt(animeId ?? "0"),
                    title: anime.title,
                    images: {
                      jpg: {
                        image_url: anime.image
                      }
                    },
                    episodes: anime.episodes ?? undefined
                  }}
                />
                <AddToFavoritesButton 
                  anime={{
                    mal_id: parseInt(animeId ?? "0"),
                    title: anime.title,
                    images: {
                      jpg: {
                        image_url: anime.image
                      }
                    },
                    episodes: anime.episodes ?? undefined
                  }}
                />
              </div>
              
              {/* Quick Stats */}
              <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  {anime.score && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Score</span>
                      <div className="flex items-center space-x-1">
                        <FaStar className="text-yellow-400" />
                        <span className="text-white">{anime.score.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                  {anime.favorites > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Favorites</span>
                      <div className="flex items-center space-x-1">
                        <FaHeart className="text-red-400" />
                        <span className="text-white">{anime.favorites.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {anime.rank && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Rank</span>
                      <span className="text-white">#{anime.rank}</span>
                    </div>
                  )}
                  {anime.popularity && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Popularity</span>
                      <span className="text-white">#{anime.popularity}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2">
            {/* Title and Status */}
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-white mb-2">{anime.title}</h1>
              {anime.titleJapanese && (
                <h2 className="text-xl text-gray-400 mb-2">{anime.titleJapanese}</h2>
              )}
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  anime.status === "Airing Now" ? "bg-green-500/20 text-green-400" :
                  anime.status === "Scheduled" ? "bg-blue-500/20 text-blue-400" :
                  anime.status === "Movie" ? "bg-purple-500/20 text-purple-400" :
                  "bg-gray-500/20 text-gray-400"
                }`}>
                  {anime.status}
                </span>
                <span className="text-gray-400">{anime.type}</span>
                {anime.year && <span className="text-gray-400">{anime.year}</span>}
              </div>
            </div>

            {/* Synopsis */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-white mb-4">Synopsis</h3>
              <p className="text-gray-300 leading-relaxed">{anime.description}</p>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Episode Info */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2 flex items-center">
                  <FaTv className="mr-2" />
                  Episodes & Duration
                </h4>
                <div className="space-y-1 text-sm">
                  {anime.episodes && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Episodes:</span>
                      <span className="text-white">{anime.episodes}</span>
                    </div>
                  )}
                  {anime.duration && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white">{anime.duration}</span>
                    </div>
                  )}
                  {anime.ageRating && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rating:</span>
                      <span className="text-white">{anime.ageRating}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Air Dates */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2 flex items-center">
                  <FaCalendarAlt className="mr-2" />
                  Air Dates
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Aired:</span>
                    <span className="text-white text-right">{formatAiredPeriod(anime.aired)}</span>
                  </div>
                  {anime.season && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Season:</span>
                      <span className="text-white">{anime.season} {anime.year}</span>
                    </div>
                  )}
                  {anime.broadcast && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Broadcast:</span>
                      <span className="text-white">{anime.broadcast}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Genres and Tags */}
            {anime.genres.length > 0 && (
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">Genres</h4>
                <div className="flex flex-wrap gap-2">
                  {anime.genres.map((genre) => (
                    <span
                      key={genre}
                      className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Themes */}
            {anime.themes.length > 0 && (
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">Themes</h4>
                <div className="flex flex-wrap gap-2">
                  {anime.themes.map((theme) => (
                    <span
                      key={theme}
                      className="bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full text-sm"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Studios and Producers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {anime.studios.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-3">Studios</h4>
                  <div className="space-y-1">
                    {anime.studios.map((studio) => (
                      <span key={studio} className="block text-gray-300 text-sm">
                        {studio}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {anime.producers.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-3">Producers</h4>
                  <div className="space-y-1">
                    {anime.producers.slice(0, 5).map((producer) => (
                      <span key={producer} className="block text-gray-300 text-sm">
                        {producer}
                      </span>
                    ))}
                    {anime.producers.length > 5 && (
                      <span className="text-gray-500 text-sm">
                        +{anime.producers.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}