"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FaPlay, FaArrowRight, FaHeart, FaListAlt } from "react-icons/fa";

const STARTER_GENRES = [
  { name: "Action", icon: "⚔️" },
  { name: "Adventure", icon: "🗺️" },
  { name: "Comedy", icon: "😄" },
  { name: "Drama", icon: "🎭" },
  { name: "Fantasy", icon: "🧙" },
  { name: "Romance", icon: "💕" },
  { name: "Sci-Fi", icon: "🚀" },
  { name: "Slice of Life", icon: "🏠" },
  { name: "Supernatural", icon: "👻" },
  { name: "Thriller", icon: "🔪" },
];

const STARTER_ANIME_SUGGESTIONS = [
  { id: 5114, title: "Fullmetal Alchemist: Brotherhood", genres: ["Action", "Adventure", "Drama"] },
  { id: 9253, title: "Steins;Gate", genres: ["Sci-Fi", "Thriller"] },
  { id: 16498, title: "Attack on Titan", genres: ["Action", "Drama"] },
  { id: 32281, title: "Your Name", genres: ["Romance", "Drama"] },
  { id: 38524, title: "Violet Evergarden", genres: ["Drama", "Slice of Life"] },
  { id: 21459, title: "One Punch Man", genres: ["Action", "Comedy"] },
  { id: 1, title: "Cowboy Bebop", genres: ["Action", "Adventure"] },
  { id: 11061, title: "Hunter x Hunter", genres: ["Action", "Adventure"] },
];

interface NewUserSetupProps {
  onSkip: () => void;
  onComplete: (preferences: { genres: string[], quickPicks: number[] }) => void;
}

export function NewUserSetup({ onSkip, onComplete }: NewUserSetupProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<number[]>([]);
  const [step, setStep] = useState<'genres' | 'anime'>('genres');
  const router = useRouter();

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const toggleAnime = (animeId: number) => {
    setSelectedAnime(prev => 
      prev.includes(animeId) 
        ? prev.filter(id => id !== animeId)
        : [...prev, animeId]
    );
  };

  const handleNext = () => {
    if (step === 'genres') {
      setStep('anime');
    } else {
      onComplete({ genres: selectedGenres, quickPicks: selectedAnime });
    }
  };

  const getFilteredAnimeByGenres = () => {
    if (selectedGenres.length === 0) return STARTER_ANIME_SUGGESTIONS;
    
    return STARTER_ANIME_SUGGESTIONS.filter(anime => 
      anime.genres.some(genre => selectedGenres.includes(genre))
    );
  };

  if (step === 'genres') {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-300/30 rounded-xl p-6 sm:p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white light:text-gray-900 mb-2">
              Welcome to Anime Discovery! 🌟
            </h2>
            <p className="text-purple-200 light:text-gray-600 text-lg">
              Let's find your perfect anime match. First, what genres interest you?
            </p>
            <p className="text-purple-200/80 light:text-gray-500 text-sm mt-2">
              Select any that appeal to you (or skip if you're not sure)
            </p>
          </div>

          {/* Genre Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {STARTER_GENRES.map((genre) => (
              <button
                key={genre.name}
                onClick={() => toggleGenre(genre.name)}
                className={`p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                  selectedGenres.includes(genre.name)
                    ? 'border-purple-400 bg-purple-500/30 text-white light:text-gray-900'
                    : 'border-purple-300/30 bg-black/20 light:bg-white/20 text-gray-300 light:text-gray-700 hover:border-purple-400/50'
                }`}
              >
                <div className="text-2xl mb-2">{genre.icon}</div>
                <div className="text-sm font-medium">{genre.name}</div>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={onSkip}
              className="inline-flex items-center space-x-2 px-6 py-3 text-gray-400 light:text-gray-600 hover:text-white light:hover:text-gray-800 transition-colors"
            >
              <FaArrowRight className="w-4 h-4" />
              <span>Skip Setup</span>
            </button>

            <div className="text-center">
              <p className="text-sm text-purple-200 light:text-gray-600 mb-2">
                {selectedGenres.length} genres selected
              </p>
              <button
                onClick={handleNext}
                className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <span>Next Step</span>
                <FaPlay className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredAnime = getFilteredAnimeByGenres();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-300/30 rounded-xl p-6 sm:p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white light:text-gray-900 mb-2">
            Quick Picks 🎯
          </h2>
          <p className="text-purple-200 light:text-gray-600 text-lg">
            Have you seen any of these popular anime? (This helps us understand your taste)
          </p>
          <p className="text-purple-200/80 light:text-gray-500 text-sm mt-2">
            Select any you've watched or are interested in
          </p>
        </div>

        {/* Selected Genres Summary */}
        {selectedGenres.length > 0 && (
          <div className="mb-6">
            <p className="text-purple-300 light:text-purple-700 text-sm mb-2">
              Based on your selected genres:
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedGenres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 bg-purple-500/20 light:bg-purple-200/50 text-purple-200 light:text-purple-800 text-sm rounded-full border border-purple-300/30"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Anime Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {filteredAnime.map((anime) => (
            <button
              key={anime.id}
              onClick={() => toggleAnime(anime.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all duration-300 hover:scale-102 ${
                selectedAnime.includes(anime.id)
                  ? 'border-purple-400 bg-purple-500/30 text-white light:text-gray-900'
                  : 'border-purple-300/30 bg-black/20 light:bg-white/20 text-gray-300 light:text-gray-700 hover:border-purple-400/50'
              }`}
            >
              <h3 className="font-semibold mb-2">{anime.title}</h3>
              <div className="flex flex-wrap gap-1">
                {anime.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-2 py-1 bg-gray-600/30 light:bg-gray-300/50 text-xs rounded text-gray-300 light:text-gray-600"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep('genres')}
            className="inline-flex items-center space-x-2 px-6 py-3 text-gray-400 light:text-gray-600 hover:text-white light:hover:text-gray-800 transition-colors"
          >
            <span>← Back</span>
          </button>

          <div className="flex items-center space-x-4">
            <button
              onClick={onSkip}
              className="inline-flex items-center space-x-2 px-6 py-3 text-gray-400 light:text-gray-600 hover:text-white light:hover:text-gray-800 transition-colors"
            >
              <FaArrowRight className="w-4 h-4" />
              <span>Skip Setup</span>
            </button>

            <button
              onClick={handleNext}
              className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <FaHeart className="w-4 h-4" />
              <span>Get Recommendations</span>
            </button>
          </div>
        </div>

        {/* Add to List CTA */}
        <div className="mt-6 p-4 bg-black/20 light:bg-white/20 rounded-lg border border-purple-300/20">
          <p className="text-purple-200 light:text-gray-600 text-sm text-center">
            💡 <strong>Pro tip:</strong> After getting recommendations, add anime to your list to get even better suggestions next time!
          </p>
          <div className="flex justify-center mt-2">
            <button
              onClick={() => router.push('/anime-list')}
              className="inline-flex items-center space-x-1 px-4 py-2 text-purple-300 light:text-purple-700 hover:text-purple-100 light:hover:text-purple-800 text-sm transition-colors"
            >
              <FaListAlt className="w-3 h-3" />
              <span>Go to My Anime List</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}