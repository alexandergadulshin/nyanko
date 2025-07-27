"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaStar, FaHeart, FaCalendarAlt, FaBook, FaArrowLeft } from "react-icons/fa";
import { jikanAPI, type MangaItem } from "~/utils/api";

interface DetailedMangaItem extends MangaItem {
  titleJapanese: string | null;
  chapters: number | null;
  volumes: number | null;
  type: string;
  score: number | null;
  scoredBy: number | null;
  rank: number | null;
  popularity: number | null;
  year: number | null;
  published: { from: string | null; to: string | null };
  genres: string[];
  themes: string[];
  demographics: string[];
  authors: string[];
  serializations: string[];
}

export default function MangaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [manga, setManga] = useState<DetailedMangaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mangaId = Array.isArray(params.id) ? params.id[0] : params.id ?? "";

  useEffect(() => {
    const fetchMangaDetails = async () => {
      if (!mangaId) return;
      
      try {
        setLoading(true);
        // Add a small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // For now, we'll use the basic manga data since the API doesn't have detailed manga endpoint
        let response = await fetch(`https://api.jikan.moe/v4/manga/${mangaId}`);
        
        if (!response.ok) {
          if (response.status === 429) {
            console.warn('Rate limited, waiting before retry...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            response = await fetch(`https://api.jikan.moe/v4/manga/${mangaId}`);
            if (!response.ok) {
              throw new Error(`API rate limited: ${response.status}`);
            }
          } else {
            throw new Error(`API error: ${response.status}`);
          }
        }
        
        const data = await response.json();
        const mangaData = data.data;
        
        const detailedManga: DetailedMangaItem = {
          id: mangaData.mal_id,
          malId: mangaData.mal_id,
          title: mangaData.title_english || mangaData.title,
          titleJapanese: mangaData.title_japanese,
          description: mangaData.synopsis || 'No description available.',
          image: mangaData.images?.jpg?.large_image_url || mangaData.images?.jpg?.image_url,
          status: mangaData.publishing ? 'Publishing' : 
                  mangaData.status === 'Not yet published' ? 'Not yet published' :
                  mangaData.status === 'Discontinued' ? 'Discontinued' : 'Finished',
          favorites: mangaData.favorites || 0,
          rating: mangaData.score || 0,
          chapters: mangaData.chapters,
          volumes: mangaData.volumes,
          type: mangaData.type,
          score: mangaData.score,
          scoredBy: mangaData.scored_by,
          rank: mangaData.rank,
          popularity: mangaData.popularity,
          year: mangaData.published?.from ? new Date(mangaData.published.from).getFullYear() : null,
          published: mangaData.published || { from: null, to: null },
          genres: mangaData.genres?.map((g: any) => g.name) || [],
          themes: mangaData.themes?.map((t: any) => t.name) || [],
          demographics: mangaData.demographics?.map((d: any) => d.name) || [],
          authors: mangaData.authors?.map((a: any) => a.name) || [],
          serializations: mangaData.serializations?.map((s: any) => s.name) || [],
        };
        
        setManga(detailedManga);
      } catch (err) {
        setError("Failed to load manga details");
        console.error("Error fetching manga details:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchMangaDetails();
  }, [mangaId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatPublishedPeriod = (published: { from: string | null; to: string | null }) => {
    const from = published.from ? formatDate(published.from) : "Unknown";
    const to = published.to ? formatDate(published.to) : "Ongoing";
    return `${from} - ${to}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading manga details...</p>
        </div>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || "Manga not found"}</p>
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
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
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
                src={manga.image}
                alt={manga.title}
                className="w-full max-w-sm mx-auto rounded-lg shadow-2xl"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-manga.jpg';
                }}
              />
              
              {/* Quick Stats */}
              <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  {manga.score && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Score</span>
                      <div className="flex items-center space-x-1">
                        <FaStar className="text-yellow-400" />
                        <span className="text-white">{manga.score.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                  {manga.favorites > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Favorites</span>
                      <div className="flex items-center space-x-1">
                        <FaHeart className="text-red-400" />
                        <span className="text-white">{manga.favorites.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {manga.rank && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Rank</span>
                      <span className="text-white">#{manga.rank}</span>
                    </div>
                  )}
                  {manga.popularity && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Popularity</span>
                      <span className="text-white">#{manga.popularity}</span>
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
              <h1 className="text-4xl font-bold text-white mb-2">{manga.title}</h1>
              {manga.titleJapanese && (
                <h2 className="text-xl text-gray-400 mb-2">{manga.titleJapanese}</h2>
              )}
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  manga.status === "Publishing" ? "bg-green-500/20 text-green-400" :
                  manga.status === "Not yet published" ? "bg-blue-500/20 text-blue-400" :
                  manga.status === "Discontinued" ? "bg-red-500/20 text-red-400" :
                  "bg-gray-500/20 text-gray-400"
                }`}>
                  {manga.status}
                </span>
                <span className="text-gray-400">{manga.type}</span>
                {manga.year && <span className="text-gray-400">{manga.year}</span>}
              </div>
            </div>

            {/* Synopsis */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-white mb-4">Synopsis</h3>
              <p className="text-gray-300 leading-relaxed">{manga.description}</p>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Chapter/Volume Info */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2 flex items-center">
                  <FaBook className="mr-2" />
                  Chapters & Volumes
                </h4>
                <div className="space-y-1 text-sm">
                  {manga.chapters && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Chapters:</span>
                      <span className="text-white">{manga.chapters}</span>
                    </div>
                  )}
                  {manga.volumes && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Volumes:</span>
                      <span className="text-white">{manga.volumes}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white">{manga.type}</span>
                  </div>
                </div>
              </div>

              {/* Publication Dates */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2 flex items-center">
                  <FaCalendarAlt className="mr-2" />
                  Publication
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Published:</span>
                    <span className="text-white text-right">{formatPublishedPeriod(manga.published)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Genres and Tags */}
            {manga.genres.length > 0 && (
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">Genres</h4>
                <div className="flex flex-wrap gap-2">
                  {manga.genres.map((genre) => (
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
            {manga.themes.length > 0 && (
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">Themes</h4>
                <div className="flex flex-wrap gap-2">
                  {manga.themes.map((theme) => (
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

            {/* Authors and Serializations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {manga.authors.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-3">Authors</h4>
                  <div className="space-y-1">
                    {manga.authors.map((author) => (
                      <span key={author} className="block text-gray-300 text-sm">
                        {author}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {manga.serializations.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-3">Serializations</h4>
                  <div className="space-y-1">
                    {manga.serializations.map((serialization) => (
                      <span key={serialization} className="block text-gray-300 text-sm">
                        {serialization}
                      </span>
                    ))}
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