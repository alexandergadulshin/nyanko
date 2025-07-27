"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FaStar, FaHeart, FaUser, FaBook } from "react-icons/fa";
import { jikanAPI, type SearchCategory, type SearchItem } from "~/utils/api";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<SearchCategory>("anime");

  const query = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") as SearchCategory;

  // Update category from URL params
  useEffect(() => {
    if (categoryParam && ['anime', 'characters', 'people', 'manga'].includes(categoryParam)) {
      setCategory(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) return;

      setLoading(true);
      setError(null);
      
      try {
        const searchResults = await jikanAPI.searchMultiCategory(query, category, 24);
        setResults(searchResults);
      } catch (err) {
        console.error("Search error:", err);
        const errorMessage = err instanceof Error && err.message.includes('rate limited')
          ? "Too many requests. Please wait a moment before searching again."
          : `Failed to search ${category}. Please try again.`;
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, category]);

  const handleItemClick = (item: SearchItem) => {
    const path = category === 'anime' ? `/anime/${item.malId}` :
                 category === 'manga' ? `/manga/${item.malId}` :
                 category === 'characters' ? `/character/${item.malId}` :
                 `/person/${item.malId}`;
    router.push(path);
  };

  const getCategoryLabel = (cat: SearchCategory) => {
    switch (cat) {
      case 'anime': return 'Anime';
      case 'characters': return 'Characters';
      case 'people': return 'People';
      case 'manga': return 'Manga';
      default: return 'Anime';
    }
  };

  const getItemTitle = (item: SearchItem) => {
    return 'title' in item ? item.title : item.name;
  };

  const getCategoryIcon = (cat: SearchCategory) => {
    switch (cat) {
      case 'anime': return '🎬';
      case 'characters': return '👤';
      case 'people': return '👨‍💼';
      case 'manga': return '📚';
      default: return '🎬';
    }
  };
  
  const handleCategoryChange = (newCategory: SearchCategory) => {
    setCategory(newCategory);
    // Update URL to reflect category change
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('category', newCategory);
    if (query) {
      router.push(`/search?${newSearchParams.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#181622] light:bg-transparent">
      <div className="container mx-auto px-4 py-8">
        {/* Category Selector */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-2 border border-gray-700/30">
              <div className="flex space-x-1">
                {(['anime', 'characters', 'people', 'manga'] as SearchCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      category === cat
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <span className="text-base">{getCategoryIcon(cat)}</span>
                    <span>{getCategoryLabel(cat)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <button
              onClick={() => router.push(`/advanced-search${query ? `?q=${encodeURIComponent(query)}&category=${category}` : `?category=${category}`}`)}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors inline-flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <span>Advanced Search with Filters</span>
            </button>
          </div>
        </div>

        {query && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
                <span className="text-2xl">{getCategoryIcon(category)}</span>
                <span>{getCategoryLabel(category)} Results for "{query}"</span>
              </h1>
              {!loading && results.length > 0 && (
                <p className="text-gray-400 mt-1">
                  Found {results.length} {category === 'anime' ? 'anime' : category === 'manga' ? 'manga' : category} results
                </p>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
                  <p className="text-gray-400">Searching...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400 text-lg">{error}</p>
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {results.map((item) => (
                  <div
                    key={item.malId}
                    onClick={() => handleItemClick(item)}
                    className="bg-gray-800/30 rounded-lg overflow-hidden hover:bg-gray-800/50 transition-colors cursor-pointer group"
                  >
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <img
                        src={item.image}
                        alt={getItemTitle(item)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-anime.jpg';
                        }}
                      />
                      {'status' in item && (
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-1 text-xs font-semibold text-white rounded-md shadow-lg ${
                            (category === 'anime' && item.status === "Airing Now") ? "bg-green-500" :
                            (category === 'anime' && item.status === "Scheduled") ? "bg-blue-500" :
                            (category === 'anime' && item.status === "Movie") ? "bg-purple-500" :
                            (category === 'manga' && item.status === "Publishing") ? "bg-green-500" :
                            (category === 'manga' && item.status === "Finished") ? "bg-blue-500" :
                            "bg-gray-500"
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-white font-medium text-sm mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {getItemTitle(item)}
                      </h3>
                      
                      <div className="flex items-center justify-between text-xs">
                        {('rating' in item && item.rating > 0) && (
                          <div className="flex items-center space-x-1">
                            <FaStar className="text-yellow-400" />
                            <span className="text-gray-300">{item.rating.toFixed(1)}</span>
                          </div>
                        )}
                        
                        {item.favorites > 0 && (
                          <div className="flex items-center space-x-1">
                            <FaHeart className="text-red-400" />
                            <span className="text-gray-300">
                              {item.favorites > 1000 
                                ? `${(item.favorites / 1000).toFixed(0)}K` 
                                : item.favorites}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-400">
                        {category === 'anime' && 'episodes' in item && item.episodes && `${item.episodes} episodes`}
                        {category === 'manga' && 'chapters' in item && item.chapters && `${item.chapters} chapters`}
                        {category === 'characters' && 'Character'}
                        {category === 'people' && 'Person'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No {getCategoryLabel(category).toLowerCase()} found for &quot;{query}&quot;</p>
                <p className="text-gray-500 text-sm mt-2">Try searching with different keywords or switch to a different category</p>
              </div>
            )}
          </>
        )}

        {!query && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">{getCategoryIcon(category)}</div>
            <h2 className="text-xl text-white mb-2">Search for {getCategoryLabel(category)}</h2>
            <p className="text-gray-400">Enter a search term above to find {getCategoryLabel(category).toLowerCase()}</p>
          </div>
        )}
      </div>
    </div>
  );
}