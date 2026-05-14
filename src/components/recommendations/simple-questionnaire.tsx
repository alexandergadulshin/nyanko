"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FaPlay, FaArrowRight, FaHeart, FaCheck } from "react-icons/fa";

const SIMPLE_GENRES = [
  { name: "Action", icon: "⚔️", popular: ["Attack on Titan", "One Piece"] },
  { name: "Comedy", icon: "😄", popular: ["One Punch Man", "Gintama"] },
  { name: "Romance", icon: "💕", popular: ["Your Name", "Toradora"] },
  { name: "Fantasy", icon: "🧙", popular: ["Fairy Tail", "Overlord"] },
  { name: "Drama", icon: "🎭", popular: ["Your Lie in April", "Clannad"] },
  { name: "Horror", icon: "👻", popular: ["Tokyo Ghoul", "Another"] },
  { name: "Sci-Fi", icon: "🚀", popular: ["Steins;Gate", "Ghost in the Shell"] },
  { name: "Slice of Life", icon: "🏠", popular: ["K-On!", "Barakamon"] }
];

const EXPERIENCE_LEVELS = [
  { 
    value: "new", 
    label: "New to Anime", 
    icon: "🌟", 
    description: "I haven't watched much anime" 
  },
  { 
    value: "some", 
    label: "Watched Some", 
    icon: "📺", 
    description: "I've seen a few popular ones" 
  },
  { 
    value: "fan", 
    label: "Big Fan", 
    icon: "🎌", 
    description: "I love anime and want more!" 
  }
];

const POPULAR_SHOWS = [
  { name: "Game of Thrones", genres: ["Action", "Fantasy", "Drama"], icon: "👑" },
  { name: "Breaking Bad", genres: ["Drama", "Thriller"], icon: "💊" },
  { name: "The Office", genres: ["Comedy", "Slice of Life"], icon: "📋" },
  { name: "Friends", genres: ["Comedy", "Romance"], icon: "👥" },
  { name: "Marvel Movies", genres: ["Action", "Adventure", "Sci-Fi"], icon: "🦸" },
  { name: "Harry Potter", genres: ["Fantasy", "Adventure"], icon: "🧙" },
  { name: "The Walking Dead", genres: ["Horror", "Drama", "Action"], icon: "🧟" },
  { name: "Stranger Things", genres: ["Sci-Fi", "Horror", "Adventure"], icon: "🔮" },
  { name: "Criminal Minds", genres: ["Thriller", "Mystery"], icon: "🕵️" },
  { name: "The Big Bang Theory", genres: ["Comedy", "Sci-Fi"], icon: "🔬" },
  { name: "Grey's Anatomy", genres: ["Drama", "Romance"], icon: "🏥" },
  { name: "Supernatural", genres: ["Horror", "Fantasy", "Action"], icon: "👻" }
];

interface SimpleQuestionnaireData {
  experience: string;
  likedGenres: string[];
  favoriteShows: string[];
  skipDetails: boolean;
}

interface SimpleQuestionnaireProps {
  onComplete: (data: SimpleQuestionnaireData) => void;
  onSkip: () => void;
}

export function SimpleQuestionnaire({ onComplete, onSkip }: SimpleQuestionnaireProps) {
  const [step, setStep] = useState<'experience' | 'shows' | 'genres'>('experience');
  const [experience, setExperience] = useState<string>('');
  const [likedGenres, setLikedGenres] = useState<string[]>([]);
  const [favoriteShows, setFavoriteShows] = useState<string[]>([]);
  const router = useRouter();

  const toggleGenre = (genre: string) => {
    setLikedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const toggleShow = (show: string) => {
    setFavoriteShows(prev => 
      prev.includes(show) 
        ? prev.filter(s => s !== show)
        : [...prev, show]
    );
  };

  const handleNext = () => {
    if (step === 'experience') {
      // If user is new to anime, ask about favorite shows first
      if (experience === 'new') {
        setStep('shows');
      } else {
        setStep('genres');
      }
    } else if (step === 'shows') {
      // Auto-generate genres from favorite shows, then go to genre step for refinement
      const genresFromShows = new Set<string>();
      favoriteShows.forEach(show => {
        const showData = POPULAR_SHOWS.find(s => s.name === show);
        if (showData) {
          showData.genres.forEach(genre => genresFromShows.add(genre));
        }
      });
      setLikedGenres(Array.from(genresFromShows));
      setStep('genres');
    } else {
      // Complete questionnaire
      onComplete({
        experience,
        likedGenres,
        favoriteShows,
        skipDetails: false
      });
    }
  };

  const handleQuickComplete = () => {
    // Skip to recommendations with minimal data
    onComplete({
      experience: experience || 'some',
      likedGenres: ['Action', 'Comedy'], // Default popular choices
      favoriteShows: [],
      skipDetails: true
    });
  };

  const canProceed = () => {
    if (step === 'experience') return experience !== '';
    if (step === 'shows') return favoriteShows.length > 0;
    if (step === 'genres') return likedGenres.length > 0;
    return false;
  };

  // Experience Selection Step
  if (step === 'experience') {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-300/30 rounded-xl p-6 sm:p-8">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white light:text-gray-900 mb-2">
              What's your anime experience? 🎯
            </h2>
            <p className="text-purple-200 light:text-gray-600 text-lg">
              This helps us recommend the right difficulty level
            </p>
          </div>

          {/* Experience Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => setExperience(level.value)}
                className={`p-6 rounded-lg border-2 transition-all duration-300 hover:scale-105 text-center ${
                  experience === level.value
                    ? 'border-purple-400 bg-purple-500/30 text-white light:text-gray-900'
                    : 'border-purple-300/30 bg-black/20 light:bg-white/20 text-gray-300 light:text-gray-700 hover:border-purple-400/50'
                }`}
              >
                <div className="text-4xl mb-3">{level.icon}</div>
                <h3 className="font-semibold mb-2">{level.label}</h3>
                <p className="text-sm opacity-80">{level.description}</p>
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
              <span>Skip Questions</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span>
                {experience === 'new' ? 'Next: Favorite Shows' : 'Next: Pick Genres'}
              </span>
              <FaPlay className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Favorite Shows Selection Step (for new users)
  if (step === 'shows') {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-300/30 rounded-xl p-6 sm:p-8">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white light:text-gray-900 mb-2">
              What shows do you love? 📺
            </h2>
            <p className="text-purple-200 light:text-gray-600 text-lg">
              Pick any TV shows or movies you really enjoyed
            </p>
            <p className="text-purple-200/80 light:text-gray-500 text-sm mt-2">
              Selected: {favoriteShows.length} shows
            </p>
          </div>

          {/* Shows Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {POPULAR_SHOWS.map((show) => {
              const isSelected = favoriteShows.includes(show.name);
              
              return (
                <button
                  key={show.name}
                  onClick={() => toggleShow(show.name)}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105 text-center ${
                    isSelected
                      ? 'border-purple-400 bg-purple-500/30 text-white light:text-gray-900 shadow-lg'
                      : 'border-purple-300/30 bg-black/20 light:bg-white/20 text-gray-300 light:text-gray-700 hover:border-purple-400/50'
                  }`}
                >
                  <div className="text-2xl mb-2">{show.icon}</div>
                  <h3 className="font-semibold text-sm">{show.name}</h3>
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="flex justify-center mt-2">
                      <FaCheck className="w-3 h-3 text-green-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Options */}
          <div className="text-center mb-6">
            <p className="text-purple-200/80 light:text-gray-500 text-sm mb-3">
              Not sure? Try these quick combinations:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setFavoriteShows(['Game of Thrones', 'Marvel Movies', 'Harry Potter'])}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 light:text-blue-800 rounded-full text-sm transition-colors"
              >
                🎬 Action Fantasy
              </button>
              <button
                onClick={() => setFavoriteShows(['The Office', 'Friends', 'The Big Bang Theory'])}
                className="px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 light:text-pink-800 rounded-full text-sm transition-colors"
              >
                😄 Comedy Fun
              </button>
              <button
                onClick={() => setFavoriteShows(['Stranger Things', 'Supernatural', 'The Walking Dead'])}
                className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 light:text-purple-800 rounded-full text-sm transition-colors"
              >
                👻 Dark & Spooky
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setStep('experience')}
                className="inline-flex items-center space-x-2 px-6 py-3 text-gray-400 light:text-gray-600 hover:text-white light:hover:text-gray-800 transition-colors"
              >
                <span>← Back</span>
              </button>
              
              <button
                onClick={() => setStep('genres')}
                className="inline-flex items-center space-x-2 px-6 py-3 text-orange-400 light:text-orange-600 hover:text-orange-200 light:hover:text-orange-800 transition-colors"
              >
                <FaArrowRight className="w-4 h-4" />
                <span>Skip to Genres</span>
              </button>
            </div>

            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span>Next: Refine Genres</span>
              <FaPlay className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Genre Selection Step
  if (step === 'genres') {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-300/30 rounded-xl p-6 sm:p-8">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white light:text-gray-900 mb-2">
              {experience === 'new' && favoriteShows.length > 0 
                ? 'Perfect! We picked these genres for you 🎯' 
                : 'What sounds interesting? 🎬'
              }
            </h2>
            <p className="text-purple-200 light:text-gray-600 text-lg">
              {experience === 'new' && favoriteShows.length > 0 
                ? 'Based on your favorite shows. Feel free to add or remove any!'
                : 'Pick any genres that appeal to you'
              }
            </p>
            <p className="text-purple-200/80 light:text-gray-500 text-sm mt-2">
              Selected: {likedGenres.length} genres
            </p>
          </div>

          {/* Genre Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {SIMPLE_GENRES.map((genre) => {
              const isSelected = likedGenres.includes(genre.name);
              
              return (
                <button
                  key={genre.name}
                  onClick={() => toggleGenre(genre.name)}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105 text-center ${
                    isSelected
                      ? 'border-purple-400 bg-purple-500/30 text-white light:text-gray-900 shadow-lg'
                      : 'border-purple-300/30 bg-black/20 light:bg-white/20 text-gray-300 light:text-gray-700 hover:border-purple-400/50'
                  }`}
                >
                  <div className="text-3xl mb-2">{genre.icon}</div>
                  <h3 className="font-semibold mb-2">{genre.name}</h3>
                  
                  {/* Popular examples */}
                  <div className="text-xs opacity-70 mb-3">
                    {genre.popular.slice(0, 1).map(anime => (
                      <div key={anime}>e.g. {anime}</div>
                    ))}
                  </div>
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="flex justify-center">
                      <FaCheck className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Options */}
          <div className="text-center mb-6">
            <p className="text-purple-200/80 light:text-gray-500 text-sm mb-3">
              Not sure? Try these quick options:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setLikedGenres(['Action', 'Adventure', 'Comedy'])}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 light:text-blue-800 rounded-full text-sm transition-colors"
              >
                🎬 Popular Mix
              </button>
              <button
                onClick={() => setLikedGenres(['Romance', 'Drama', 'Slice of Life'])}
                className="px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 light:text-pink-800 rounded-full text-sm transition-colors"
              >
                💕 Feel-Good
              </button>
              <button
                onClick={() => setLikedGenres(['Action', 'Fantasy', 'Sci-Fi'])}
                className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 light:text-purple-800 rounded-full text-sm transition-colors"
              >
                ⚔️ Epic Adventure
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setStep(experience === 'new' ? 'shows' : 'experience')}
                className="inline-flex items-center space-x-2 px-6 py-3 text-gray-400 light:text-gray-600 hover:text-white light:hover:text-gray-800 transition-colors"
              >
                <span>← Back</span>
              </button>
              
              <button
                onClick={handleQuickComplete}
                className="inline-flex items-center space-x-2 px-6 py-3 text-orange-400 light:text-orange-600 hover:text-orange-200 light:hover:text-orange-800 transition-colors"
              >
                <FaArrowRight className="w-4 h-4" />
                <span>Surprise Me</span>
              </button>
            </div>

            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <FaHeart className="w-4 h-4" />
              <span>Get Recommendations!</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}