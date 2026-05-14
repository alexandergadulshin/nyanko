"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FaPlay, FaArrowRight, FaHeart, FaListAlt, FaCheck, FaTimes, FaQuestion } from "react-icons/fa";

const ANIME_GENRES = [
  { name: "Action", icon: "⚔️", description: "Fast-paced with fighting and adventure" },
  { name: "Adventure", icon: "🗺️", description: "Journey and exploration themes" },
  { name: "Comedy", icon: "😄", description: "Funny and lighthearted" },
  { name: "Drama", icon: "🎭", description: "Emotional and serious storytelling" },
  { name: "Fantasy", icon: "🧙", description: "Magic and supernatural worlds" },
  { name: "Romance", icon: "💕", description: "Love stories and relationships" },
  { name: "Sci-Fi", icon: "🚀", description: "Futuristic and technology themes" },
  { name: "Horror", icon: "👻", description: "Scary and suspenseful" },
  { name: "Mystery", icon: "🔍", description: "Puzzles and detective work" },
  { name: "Slice of Life", icon: "🏠", description: "Everyday life and realistic stories" },
  { name: "Sports", icon: "⚽", description: "Athletic competitions and teamwork" },
  { name: "Supernatural", icon: "✨", description: "Ghosts, spirits, and otherworldly" },
  { name: "Thriller", icon: "🔪", description: "Intense and suspenseful" },
  { name: "School", icon: "🏫", description: "Student life and education" },
  { name: "Military", icon: "🪖", description: "War and combat themes" },
  { name: "Historical", icon: "🏛️", description: "Set in past time periods" }
];

const NON_ANIME_SHOWS = [
  { name: "Game of Thrones", genres: ["Drama", "Fantasy", "Action"], description: "Epic fantasy with political intrigue" },
  { name: "Breaking Bad", genres: ["Drama", "Thriller"], description: "Crime drama with moral complexity" },
  { name: "Stranger Things", genres: ["Horror", "Sci-Fi", "Mystery"], description: "80s supernatural mystery" },
  { name: "The Office", genres: ["Comedy", "Slice of Life"], description: "Workplace mockumentary comedy" },
  { name: "Friends", genres: ["Comedy", "Romance", "Slice of Life"], description: "Friend group sitcom" },
  { name: "Lost", genres: ["Mystery", "Drama", "Sci-Fi"], description: "Mysterious island survival" },
  { name: "Sherlock", genres: ["Mystery", "Drama"], description: "Modern detective stories" },
  { name: "Marvel Movies", genres: ["Action", "Adventure", "Sci-Fi"], description: "Superhero action films" },
  { name: "The Walking Dead", genres: ["Horror", "Drama", "Action"], description: "Zombie apocalypse survival" },
  { name: "House of Cards", genres: ["Drama", "Thriller"], description: "Political drama and manipulation" },
  { name: "Black Mirror", genres: ["Sci-Fi", "Horror", "Drama"], description: "Dark technology anthology" },
  { name: "The Witcher", genres: ["Fantasy", "Action", "Adventure"], description: "Monster hunter in fantasy world" }
];

const VIEWING_PREFERENCES = [
  { 
    key: "length", 
    question: "How long do you prefer your anime series?", 
    options: [
      { value: "short", label: "Short (12-24 episodes)", weight: { "short": 1 } },
      { value: "medium", label: "Medium (25-50 episodes)", weight: { "medium": 1 } },
      { value: "long", label: "Long (50+ episodes)", weight: { "long": 1 } },
      { value: "any", label: "Any length is fine", weight: {} }
    ]
  },
  {
    key: "era",
    question: "What time period do you prefer?",
    options: [
      { value: "recent", label: "Recent (2020+)", weight: { "recent": 1 } },
      { value: "modern", label: "Modern (2010-2019)", weight: { "modern": 1 } },
      { value: "classic", label: "Classic (2000-2009)", weight: { "classic": 1 } },
      { value: "any", label: "Any era is fine", weight: {} }
    ]
  },
  {
    key: "popularity",
    question: "Do you prefer mainstream or hidden gems?",
    options: [
      { value: "popular", label: "Popular mainstream anime", weight: { "popular": 1 } },
      { value: "hidden", label: "Hidden gems and underrated", weight: { "hidden": 1 } },
      { value: "mixed", label: "Both are fine", weight: {} }
    ]
  }
];

interface QuestionnaireData {
  likedGenres: string[];
  dislikedGenres: string[];
  likedShows: string[];
  viewingPreferences: Record<string, string>;
  isNewToAnime: boolean;
}

interface EnhancedQuestionnaireProps {
  onComplete: (data: QuestionnaireData) => void;
  onSkip: () => void;
  isNewUser: boolean;
}

export function EnhancedQuestionnaire({ onComplete, onSkip, isNewUser }: EnhancedQuestionnaireProps) {
  const [step, setStep] = useState<'intro' | 'genres' | 'shows' | 'preferences'>('intro');
  const [likedGenres, setLikedGenres] = useState<string[]>([]);
  const [dislikedGenres, setDislikedGenres] = useState<string[]>([]);
  const [likedShows, setLikedShows] = useState<string[]>([]);
  const [viewingPreferences, setViewingPreferences] = useState<Record<string, string>>({});
  const [isNewToAnime, setIsNewToAnime] = useState(isNewUser);
  const router = useRouter();

  const toggleGenre = (genre: string, type: 'liked' | 'disliked') => {
    if (type === 'liked') {
      setLikedGenres(prev => {
        // Remove from disliked if adding to liked
        setDislikedGenres(disliked => disliked.filter(g => g !== genre));
        return prev.includes(genre) 
          ? prev.filter(g => g !== genre)
          : [...prev, genre];
      });
    } else {
      setDislikedGenres(prev => {
        // Remove from liked if adding to disliked
        setLikedGenres(liked => liked.filter(g => g !== genre));
        return prev.includes(genre) 
          ? prev.filter(g => g !== genre)
          : [...prev, genre];
      });
    }
  };

  const toggleShow = (show: string) => {
    setLikedShows(prev => 
      prev.includes(show) 
        ? prev.filter(s => s !== show)
        : [...prev, show]
    );
  };

  const handlePreferenceChange = (key: string, value: string) => {
    setViewingPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (step === 'intro') {
      setStep('genres');
    } else if (step === 'genres') {
      // Skip shows step if user is not new to anime
      setStep(isNewToAnime ? 'shows' : 'preferences');
    } else if (step === 'shows') {
      setStep('preferences');
    } else {
      // Complete questionnaire
      onComplete({
        likedGenres,
        dislikedGenres,
        likedShows,
        viewingPreferences,
        isNewToAnime
      });
    }
  };

  const handleBack = () => {
    if (step === 'preferences') {
      setStep(isNewToAnime ? 'shows' : 'genres');
    } else if (step === 'shows') {
      setStep('genres');
    } else if (step === 'genres') {
      setStep('intro');
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'intro': return true;
      case 'genres': return likedGenres.length > 0;
      case 'shows': return !isNewToAnime || likedShows.length > 0;
      case 'preferences': return true;
      default: return false;
    }
  };

  // Intro Step
  if (step === 'intro') {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-300/30 rounded-xl p-6 sm:p-8">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full mb-6">
              <FaQuestion className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-3xl font-bold text-white light:text-gray-900 mb-2">
              Let's Find Your Perfect Anime! 🎯
            </h2>
            <p className="text-purple-200 light:text-gray-600 text-lg">
              Answer a few questions so we can recommend anime that match your exact taste
            </p>
          </div>

          {/* New vs Experienced User Choice */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white light:text-gray-900 mb-4 text-center">
              What's your anime experience?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setIsNewToAnime(true)}
                className={`p-6 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                  isNewToAnime
                    ? 'border-purple-400 bg-purple-500/30 text-white light:text-gray-900'
                    : 'border-purple-300/30 bg-black/20 light:bg-white/20 text-gray-300 light:text-gray-700 hover:border-purple-400/50'
                }`}
              >
                <div className="text-3xl mb-3">🌟</div>
                <h4 className="font-semibold mb-2">New to Anime</h4>
                <p className="text-sm opacity-80">I haven't watched much anime before</p>
              </button>
              
              <button
                onClick={() => setIsNewToAnime(false)}
                className={`p-6 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                  !isNewToAnime
                    ? 'border-purple-400 bg-purple-500/30 text-white light:text-gray-900'
                    : 'border-purple-300/30 bg-black/20 light:bg-white/20 text-gray-300 light:text-gray-700 hover:border-purple-400/50'
                }`}
              >
                <div className="text-3xl mb-3">🎌</div>
                <h4 className="font-semibold mb-2">Anime Fan</h4>
                <p className="text-sm opacity-80">I've watched anime before but want more</p>
              </button>
            </div>
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
              className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <span>Start Questions</span>
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
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-300/30 rounded-xl p-6 sm:p-8">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white light:text-gray-900 mb-2">
              What genres do you enjoy? 🎬
            </h2>
            <p className="text-purple-200 light:text-gray-600 text-lg">
              Select genres you like 💚 and dislike ❌ to help us understand your taste
            </p>
            <p className="text-purple-200/80 light:text-gray-500 text-sm mt-2">
              Selected: {likedGenres.length} liked, {dislikedGenres.length} disliked
            </p>
          </div>

          {/* Genre Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {ANIME_GENRES.map((genre) => {
              const isLiked = likedGenres.includes(genre.name);
              const isDisliked = dislikedGenres.includes(genre.name);
              
              return (
                <div key={genre.name} className="relative">
                  <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    isLiked ? 'border-green-400 bg-green-500/20' :
                    isDisliked ? 'border-red-400 bg-red-500/20' :
                    'border-purple-300/30 bg-black/20 light:bg-white/20'
                  }`}>
                    <div className="text-center">
                      <div className="text-2xl mb-2">{genre.icon}</div>
                      <h3 className="font-semibold text-white light:text-gray-900 mb-1">{genre.name}</h3>
                      <p className="text-xs text-gray-400 light:text-gray-600 mb-3">{genre.description}</p>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleGenre(genre.name, 'liked')}
                          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-all ${
                            isLiked 
                              ? 'bg-green-500 text-white shadow-lg'
                              : 'bg-gray-600/20 text-gray-400 hover:bg-green-500/20 hover:text-green-400'
                          }`}
                        >
                          <FaCheck className="w-3 h-3 mx-auto" />
                        </button>
                        <button
                          onClick={() => toggleGenre(genre.name, 'disliked')}
                          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-all ${
                            isDisliked 
                              ? 'bg-red-500 text-white shadow-lg'
                              : 'bg-gray-600/20 text-gray-400 hover:bg-red-500/20 hover:text-red-400'
                          }`}
                        >
                          <FaTimes className="w-3 h-3 mx-auto" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="inline-flex items-center space-x-2 px-6 py-3 text-gray-400 light:text-gray-600 hover:text-white light:hover:text-gray-800 transition-colors"
            >
              <span>← Back</span>
            </button>

            <div className="text-center">
              <p className="text-sm text-purple-200 light:text-gray-600 mb-2">
                {canProceed() ? `Great! ${likedGenres.length} genres selected` : 'Please select at least one genre you like'}
              </p>
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span>Continue</span>
                <FaArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Non-Anime Shows Step (only for new users)
  if (step === 'shows' && isNewToAnime) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-300/30 rounded-xl p-6 sm:p-8">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white light:text-gray-900 mb-2">
              What shows/movies do you enjoy? 📺
            </h2>
            <p className="text-purple-200 light:text-gray-600 text-lg">
              Select any non-anime shows you like - this helps us understand your preferences
            </p>
            <p className="text-purple-200/80 light:text-gray-500 text-sm mt-2">
              Selected: {likedShows.length} shows
            </p>
          </div>

          {/* Shows Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {NON_ANIME_SHOWS.map((show) => {
              const isSelected = likedShows.includes(show.name);
              
              return (
                <button
                  key={show.name}
                  onClick={() => toggleShow(show.name)}
                  className={`p-4 rounded-lg border-2 text-left transition-all duration-300 hover:scale-102 ${
                    isSelected
                      ? 'border-purple-400 bg-purple-500/30 text-white light:text-gray-900'
                      : 'border-purple-300/30 bg-black/20 light:bg-white/20 text-gray-300 light:text-gray-700 hover:border-purple-400/50'
                  }`}
                >
                  <h3 className="font-semibold mb-2">{show.name}</h3>
                  <p className="text-sm opacity-80 mb-3">{show.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {show.genres.slice(0, 3).map((genre) => (
                      <span
                        key={genre}
                        className="px-2 py-1 bg-gray-600/30 light:bg-gray-300/50 text-xs rounded text-gray-300 light:text-gray-600"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="inline-flex items-center space-x-2 px-6 py-3 text-gray-400 light:text-gray-600 hover:text-white light:hover:text-gray-800 transition-colors"
            >
              <span>← Back</span>
            </button>

            <div className="text-center">
              <p className="text-sm text-purple-200 light:text-gray-600 mb-2">
                {canProceed() ? `Perfect! ${likedShows.length} shows selected` : 'Please select at least one show you like'}
              </p>
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span>Continue</span>
                <FaArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Viewing Preferences Step
  if (step === 'preferences') {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-300/30 rounded-xl p-6 sm:p-8">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white light:text-gray-900 mb-2">
              Final Preferences ⚙️
            </h2>
            <p className="text-purple-200 light:text-gray-600 text-lg">
              A few more questions to fine-tune your recommendations
            </p>
          </div>

          <div className="space-y-8 mb-8">
            {VIEWING_PREFERENCES.map((pref) => (
              <div key={pref.key}>
                <h3 className="text-lg font-semibold text-white light:text-gray-900 mb-4">
                  {pref.question}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pref.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePreferenceChange(pref.key, option.value)}
                      className={`p-4 rounded-lg border-2 text-left transition-all duration-300 hover:scale-102 ${
                        viewingPreferences[pref.key] === option.value
                          ? 'border-purple-400 bg-purple-500/30 text-white light:text-gray-900'
                          : 'border-purple-300/30 bg-black/20 light:bg-white/20 text-gray-300 light:text-gray-700 hover:border-purple-400/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="inline-flex items-center space-x-2 px-6 py-3 text-gray-400 light:text-gray-600 hover:text-white light:hover:text-gray-800 transition-colors"
            >
              <span>← Back</span>
            </button>

            <button
              onClick={handleNext}
              className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <FaHeart className="w-4 h-4" />
              <span>Get My Recommendations!</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}