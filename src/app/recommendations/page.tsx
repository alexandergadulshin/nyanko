"use client";

import { AnimeRecommendation } from "~/components/recommendations/anime-recommendation";

export default function RecommendationsPage() {
  return (
    <main className="min-h-screen bg-[#181622] light:bg-transparent">
      <div className="pt-28 pb-16">
        <div className="text-center mb-8 px-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-white light:text-gray-900 mb-4">
            AI Anime Recommendations
          </h1>
          <p className="text-xl text-purple-200 light:text-gray-600 max-w-3xl mx-auto">
            Discover your next favorite anime with our intelligent recommendation system powered by advanced algorithms and your personal watch history.
          </p>
        </div>
        
        <AnimeRecommendation autoStart={true} />
      </div>
    </main>
  );
}