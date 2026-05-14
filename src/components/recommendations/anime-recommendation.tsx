"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";
import { FaStar, FaPlay, FaRedo, FaMagic, FaBrain, FaHeart } from "react-icons/fa";
import { NewUserSetup } from "./new-user-setup";
import { SimpleQuestionnaire } from "./simple-questionnaire";
import { ProgressBar } from "./progress-bar";

interface RecommendationReason {
  anime: {
    malId: number;
    title: string;
    image: string;
    description: string;
    rating: number;
    status: string;
    year?: number;
    type?: string;
    episodes?: number;
  };
  recommendationScore: number;
  reasons: string[];
  isNewUser: boolean;
}

interface RecommendationResponse {
  recommendations: RecommendationReason[];
  userProfile: {
    totalWatched: number;
    isNewUser: boolean;
  };
}

interface AnimeRecommendationProps {
  autoStart?: boolean;
}

export function AnimeRecommendation({ autoStart = false }: AnimeRecommendationProps) {
  const { user } = useUser();
  const { data: session } = useSession();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showNewUserSetup, setShowNewUserSetup] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaireData, setQuestionnaireData] = useState<any>(null);
  const [apiCallComplete, setApiCallComplete] = useState(false);

  const isAuthenticated = user || session;

  const getRecommendations = useCallback(async () => {
    if (!isAuthenticated) {
      router.push('/auth?mode=sign-in');
      return;
    }

    console.log('Starting recommendations API call...');
    setLoading(true);
    setError(null);
    setApiCallComplete(false);

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionnaireData
        })
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', errorText);
        throw new Error('Failed to get recommendations');
      }

      const data: RecommendationResponse = await response.json();
      console.log('Recommendations received:', data);
      setRecommendations(data);
      setCurrentIndex(0);
      setApiCallComplete(true);
      
      // Don't auto-show questionnaire here - it's handled in checkUserStatusAndStart
    } catch (err) {
      console.error('Recommendation API error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      console.log('API call finished, loading set to false');
      setLoading(false);
    }
  }, [isAuthenticated, router, questionnaireData]);

  // Auto-start questionnaire or recommendations when component mounts
  useEffect(() => {
    if (autoStart && isAuthenticated && !loading && !recommendations && !showQuestionnaire) {
      // Check if user has anime in their list to determine if they're new
      void checkUserStatusAndStart();
    }
  }, [autoStart, isAuthenticated]);

  const checkUserStatusAndStart = useCallback(async () => {
    if (!isAuthenticated) return;
    
    // For auto-start, always show questionnaire first for better personalization
    // The API will determine if user is new and handle accordingly
    setShowQuestionnaire(true);
  }, [isAuthenticated]);

  // Show loading immediately if auto-starting
  const isAutoStarting = autoStart && isAuthenticated && !recommendations && !showQuestionnaire && !showNewUserSetup;

  const nextRecommendation = () => {
    if (recommendations && currentIndex < recommendations.recommendations.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const previousRecommendation = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const getNewSet = () => {
    setApiCallComplete(false); // Reset API call state
    getRecommendations();
  };

  const viewAnime = (malId: number) => {
    router.push(`/anime/${malId}`);
  };

  const handleNewUserComplete = (preferences: { genres: string[], quickPicks: number[] }) => {
    setShowNewUserSetup(false);
    // For new users, we still show the recommendations based on popular picks
    // The preferences could be stored for future enhancements
    console.log('User preferences:', preferences);
  };

  const handleNewUserSkip = () => {
    setShowNewUserSetup(false);
    // Continue with default recommendations
  };

  const handleQuestionnaireComplete = (data: any) => {
    console.log('Questionnaire completed:', data);
    
    // Transform simple questionnaire data to match API expectations
    const transformedData = {
      likedGenres: data.likedGenres,
      dislikedGenres: [],
      likedShows: data.favoriteShows || [],
      viewingPreferences: {
        length: data.experience === 'new' ? 'short' : 'any',
        era: data.experience === 'fan' ? 'recent' : 'any',
        popularity: data.experience === 'new' ? 'popular' : 'mixed'
      },
      isNewToAnime: data.experience === 'new',
      favoriteShows: data.favoriteShows || []
    };
    
    setQuestionnaireData(transformedData);
    setShowQuestionnaire(false);
    setApiCallComplete(false); // Reset API call state
    // Automatically get recommendations with questionnaire data
    void getRecommendations();
  };

  const handleQuestionnaireSkip = () => {
    setShowQuestionnaire(false);
    setApiCallComplete(false); // Reset API call state
    // Continue with default recommendations
    void getRecommendations();
  };

  const currentRecommendation = recommendations?.recommendations[currentIndex];

  // Show simple questionnaire
  if (showQuestionnaire) {
    return (
      <SimpleQuestionnaire 
        onComplete={handleQuestionnaireComplete}
        onSkip={handleQuestionnaireSkip}
      />
    );
  }

  // Show new user setup flow (legacy - kept for fallback)
  if (showNewUserSetup && recommendations?.userProfile.isNewUser) {
    return (
      <NewUserSetup 
        onComplete={handleNewUserComplete}
        onSkip={handleNewUserSkip}
      />
    );
  }

  if (!recommendations) {
    // Show loading state if auto-starting or manual loading
    if (loading || isAutoStarting) {
      return (
        <div className="w-full max-w-4xl mx-auto px-4 py-8">
          <div className="text-center bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-300/30 rounded-xl p-8">
            <div className="py-12">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white light:text-gray-900 mb-2">
                  Analyzing Your Taste 🧠
                </h2>
                <p className="text-purple-200 light:text-gray-600">
                  Using AI to find your perfect anime match
                </p>
              </div>
              
              <ProgressBar 
                onComplete={() => {
                  console.log('Progress bar animation completed');
                }}
              />
              
              <div className="mt-8 text-center">
                <p className="text-purple-200/70 light:text-gray-500 text-sm">
                  This may take a few moments...
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="text-center bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-300/30 rounded-xl p-8">
          <div className="mb-6">
            <FaMagic className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white light:text-gray-900 mb-2">
              Discover Your Next Anime
            </h2>
            <p className="text-purple-200 light:text-gray-600 text-lg">
              Get personalized recommendations powered by AI and your watch history
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-200 light:text-red-800">
              {error}
            </div>
          )}

          <button
            onClick={getRecommendations}
            disabled={loading}
            className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Analyzing Your Taste...</span>
              </>
            ) : (
              <>
                <FaBrain className="w-5 h-5" />
                <span>Get My Recommendation</span>
              </>
            )}
          </button>

          {!isAuthenticated && (
            <p className="mt-4 text-sm text-purple-200/80 light:text-gray-500">
              Sign in to get personalized recommendations based on your watchlist
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!currentRecommendation) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="text-center bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-300/30 rounded-xl p-8">
          <p className="text-purple-200 light:text-gray-600 text-lg">
            No recommendations available at the moment. Try again later!
          </p>
          <button
            onClick={getNewSet}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-300/30 rounded-xl p-6 sm:p-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <FaMagic className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white light:text-gray-900">
              Recommended For You
            </h2>
            <FaMagic className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-purple-200 light:text-gray-600">
            {recommendations.userProfile.isNewUser 
              ? "Perfect starter anime picked just for you!"
              : `Based on your ${recommendations.userProfile.totalWatched} watched anime`
            }
          </p>
        </div>

        {/* Recommendation Card */}
        <div className="bg-black/20 light:bg-white/20 rounded-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            
            {/* Anime Image */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <div className="relative group">
                <img
                  src={currentRecommendation.anime.image}
                  alt={currentRecommendation.anime.title}
                  className="w-48 h-64 object-cover rounded-lg shadow-lg group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-anime.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              </div>
            </div>

            {/* Anime Details */}
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl sm:text-3xl font-bold text-white light:text-gray-900 mb-3">
                {currentRecommendation.anime.title}
              </h3>

              {/* Anime Stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
                {currentRecommendation.anime.rating > 0 && (
                  <div className="flex items-center space-x-1 text-yellow-400">
                    <FaStar className="w-4 h-4" />
                    <span className="font-semibold">{currentRecommendation.anime.rating.toFixed(1)}</span>
                  </div>
                )}
                {currentRecommendation.anime.year && (
                  <span className="text-purple-200 light:text-gray-600 font-medium">
                    {currentRecommendation.anime.year}
                  </span>
                )}
                {currentRecommendation.anime.type && (
                  <span className="text-purple-200 light:text-gray-600 font-medium">
                    {currentRecommendation.anime.type}
                  </span>
                )}
                {currentRecommendation.anime.episodes && (
                  <span className="text-purple-200 light:text-gray-600 font-medium">
                    {currentRecommendation.anime.episodes} episodes
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-300 light:text-gray-700 mb-4 line-clamp-3 leading-relaxed">
                {currentRecommendation.anime.description}
              </p>

              {/* Recommendation Reasons */}
              <div className="mb-6">
                <h4 className="text-purple-300 light:text-purple-700 font-semibold mb-2 flex items-center">
                  <FaHeart className="w-4 h-4 mr-2" />
                  Why we recommend this:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {currentRecommendation.reasons.slice(0, 3).map((reason, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-500/20 light:bg-purple-200/50 text-purple-200 light:text-purple-800 text-sm rounded-full border border-purple-300/30"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => viewAnime(currentRecommendation.anime.malId)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <FaPlay className="w-4 h-4" />
                <span>View Details</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={previousRecommendation}
              disabled={currentIndex === 0}
              className="px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 text-white light:text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-purple-200 light:text-gray-600 font-medium">
              {currentIndex + 1} of {recommendations.recommendations.length}
            </span>
            <button
              onClick={nextRecommendation}
              disabled={currentIndex === recommendations.recommendations.length - 1}
              className="px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 text-white light:text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

          <button
            onClick={getNewSet}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-300 hover:scale-105"
          >
            <FaRedo className="w-4 h-4" />
            <span>New Set</span>
          </button>
        </div>
      </div>
    </div>
  );
}