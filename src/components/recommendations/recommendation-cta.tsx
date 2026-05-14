"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FaMagic, FaBrain, FaRocket } from "react-icons/fa";

export function RecommendationCTA() {
  const router = useRouter();

  const handleGetRecommendations = () => {
    router.push('/recommendations');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-300/30 rounded-xl p-8 sm:p-12">
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/5 rounded-full blur-xl"></div>
        
        <div className="relative text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full mb-6">
            <FaMagic className="w-10 h-10 text-purple-400" />
          </div>
          
          {/* Title */}
          <h2 className="text-3xl sm:text-4xl font-bold text-white light:text-gray-900 mb-4">
            Discover Your Next Anime
          </h2>
          
          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-purple-200 light:text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Get personalized recommendations powered by AI and tailored to your unique taste. 
            Whether you're new to anime or a seasoned otaku, we'll find your perfect match.
          </p>
          
          {/* Features */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
            <div className="flex items-center space-x-3 text-purple-200 light:text-gray-600">
              <FaBrain className="w-5 h-5 text-purple-400" />
              <span className="font-medium">AI-Powered Analysis</span>
            </div>
            <div className="flex items-center space-x-3 text-purple-200 light:text-gray-600">
              <FaRocket className="w-5 h-5 text-pink-400" />
              <span className="font-medium">Personalized Results</span>
            </div>
            <div className="flex items-center space-x-3 text-purple-200 light:text-gray-600">
              <FaMagic className="w-5 h-5 text-blue-400" />
              <span className="font-medium">Hidden Gems</span>
            </div>
          </div>
          
          {/* CTA Button */}
          <button
            onClick={handleGetRecommendations}
            className="group inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-purple-500/25"
          >
            <FaMagic className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-lg">Get My Recommendations</span>
          </button>
          
          {/* Helper text */}
          <p className="mt-4 text-sm text-purple-200/80 light:text-gray-500">
            ✨ Works best when you have anime in your watchlist • Free forever
          </p>
        </div>
      </div>
    </div>
  );
}