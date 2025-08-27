"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaStar, FaHeart, FaFilter, FaSort, FaTimes, FaPlay, FaUsers, FaTheaterMasks, FaBook } from "react-icons/fa";
import { jikanAPI, type GenreItem, type SearchCategory, type SearchItem } from "~/utils/api";

const ANIME_TYPES = [
  { value: "", label: "All Types" },
  { value: "tv", label: "TV" },
  { value: "movie", label: "Movie" },
  { value: "ova", label: "OVA" },
  { value: "special", label: "Special" },
  { value: "ona", label: "ONA" },
  { value: "music", label: "Music" },
];

const ANIME_STATUS = [
  { value: "", label: "All Status" },
  { value: "airing", label: "Currently Airing" },
  { value: "complete", label: "Finished Airing" },
  { value: "upcoming", label: "Not Yet Aired" },
];

const MANGA_TYPES = [
  { value: "", label: "All Types" },
  { value: "manga", label: "Manga" },
  { value: "novel", label: "Light Novel" },
  { value: "lightnovel", label: "Light Novel" },
  { value: "oneshot", label: "One-shot" },
  { value: "doujin", label: "Doujinshi" },
  { value: "manhwa", label: "Manhwa" },
  { value: "manhua", label: "Manhua" },
];

const MANGA_STATUS = [
  { value: "", label: "All Status" },
  { value: "publishing", label: "Publishing" },
  { value: "complete", label: "Finished" },
  { value: "upcoming", label: "Not Yet Published" },
  { value: "discontinued", label: "Discontinued" },
];

const RATINGS = [
  { value: "", label: "All Ratings" },
  { value: "g", label: "G - All Ages" },
  { value: "pg", label: "PG - Children" },
  { value: "pg13", label: "PG-13 - Teens 13 or older" },
  { value: "r17", label: "R - 17+ (violence & profanity)" },
  { value: "r", label: "R+ - Mild Nudity" },
  { value: "rx", label: "Rx - Hentai" },
];

const ANIME_ORDER_BY_OPTIONS = [
  { value: "score", label: "Score" },
  { value: "rank", label: "Rank" },
  { value: "title", label: "Title" },
  { value: "mal_id", label: "MAL ID" },
  { value: "start_date", label: "Start Date" },
  { value: "end_date", label: "End Date" },
  { value: "scored_by", label: "Scored By" },
  { value: "popularity", label: "Popularity" },
];

const MANGA_ORDER_BY_OPTIONS = [
  { value: "score", label: "Score" },
  { value: "rank", label: "Rank" },
  { value: "title", label: "Title" },
  { value: "mal_id", label: "MAL ID" },
  { value: "start_date", label: "Start Date" },
  { value: "end_date", label: "End Date" },
  { value: "scored_by", label: "Scored By" },
  { value: "popularity", label: "Popularity" },
  { value: "chapters", label: "Chapters" },
  { value: "volumes", label: "Volumes" },
];

const PEOPLE_ORDER_BY_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "mal_id", label: "MAL ID" },
  { value: "favorites", label: "Favorites" },
];

const CHARACTER_ORDER_BY_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "mal_id", label: "MAL ID" },
  { value: "favorites", label: "Favorites" },
];

interface SearchFilters {
  query: string;
  category: SearchCategory;
  type: string;
  status: string;
  rating: string;
  genres: number[];
  excludeGenres: number[];
  minScore: number;
  orderBy: string;
  sort: 'asc' | 'desc';
}

function AdvancedSearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [results, setResults] = useState<SearchItem[]>([]);
  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get("q") ?? "",
    category: (searchParams.get("category") as SearchCategory) ?? "anime",
    type: "",
    status: "",
    rating: "",
    genres: [],
    excludeGenres: [],
    minScore: 0,
    orderBy: "score",
    sort: "desc",
  });

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const genreList = await jikanAPI.getGenres();
        setGenres(genreList);
      } catch (err) {
        console.error("Failed to load genres:", err);
      }
    };

    void loadGenres();
  }, []);

  const performSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let searchResults: SearchItem[];
      
      if (filters.category === 'anime') {
        searchResults = await jikanAPI.advancedSearch({
          query: filters.query,
          type: filters.type,
          status: filters.status,
          rating: filters.rating,
          genres: filters.genres,
          excludeGenres: filters.excludeGenres,
          minScore: filters.minScore > 0 ? filters.minScore : undefined,
          orderBy: filters.orderBy,
          sort: filters.sort,
          limit: 48,
        });
      } else {
        // For non-anime categories, use simple search
        searchResults = await jikanAPI.searchMultiCategory(filters.query, filters.category, 48);
      }
      
      setResults(searchResults);
    } catch (err) {
      console.error("Search error:", err);
      const errorMessage = err instanceof Error && err.message.includes('rate limited')
        ? "Too many requests. Please wait a moment before searching again."
        : `Failed to search ${filters.category}. Please try again.`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters.category, filters.query, filters.type, filters.status, filters.rating, filters.genres, filters.excludeGenres, filters.minScore, filters.orderBy, filters.sort]);

  useEffect(() => {
    // Only search if we have a meaningful query (2+ characters) or other filters
    const hasValidQuery = filters.query.trim().length >= 2;
    const hasOtherFilters = filters.type || filters.status || filters.rating || 
                           filters.genres.length > 0 || filters.excludeGenres.length > 0 ||
                           filters.minScore > 0;
    
    if (hasValidQuery || hasOtherFilters) {
      void performSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (key: keyof SearchFilters, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value as SearchFilters[typeof key] }));
  };

  const handleGenreToggle = (genreId: number, isExclude = false) => {
    const key = isExclude ? 'excludeGenres' : 'genres';
    const otherKey = isExclude ? 'genres' : 'excludeGenres';
    
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(genreId) 
        ? prev[key].filter(id => id !== genreId)
        : [...prev[key], genreId],
      [otherKey]: prev[otherKey].filter(id => id !== genreId), // Remove from other list
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: "",
      category: "anime",
      type: "",
      status: "",
      rating: "",
      genres: [],
      excludeGenres: [],
      minScore: 0,
      orderBy: "score",
      sort: "desc",
    });
  };

  const handleItemClick = (item: SearchItem) => {
    const path = filters.category === 'anime' ? `/anime/${item.malId}` :
                 filters.category === 'manga' ? `/manga/${item.malId}` :
                 filters.category === 'characters' ? `/character/${item.malId}` :
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

  const getCategoryIcon = (cat: SearchCategory) => {
    switch (cat) {
      case 'anime': return <FaPlay className="w-4 h-4" />;
      case 'characters': return <FaUsers className="w-4 h-4" />;
      case 'people': return <FaTheaterMasks className="w-4 h-4" />;
      case 'manga': return <FaBook className="w-4 h-4" />;
      default: return <FaPlay className="w-4 h-4" />;
    }
  };

  const getItemTitle = (item: SearchItem) => {
    return 'title' in item ? item.title : item.name;
  };

  return (
    <div className="min-h-screen bg-[#181622] light:bg-transparent">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
              Advanced Search
            </span>
          </h1>
          <div className="mt-4 w-[calc(100%-2rem)] max-w-6xl h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
        </div>


        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-gradient-to-br from-[#6d28d9]/40 to-[#3d2954]/60 backdrop-blur-md border border-purple-300/20 rounded-xl p-6 sticky top-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                    <FaFilter className="text-white text-sm" />
                  </div>
                  Filters
                </h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden text-gray-400 hover:text-white"
                >
                  {showFilters ? <FaTimes /> : <FaFilter />}
                </button>
              </div>

              {showFilters && (
                <div className="space-y-6">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Search Category
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['anime', 'characters', 'people', 'manga'] as SearchCategory[]).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => handleFilterChange('category', cat)}
                          className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex flex-col items-center justify-center space-y-1 min-h-[60px] ${
                            filters.category === cat
                              ? 'bg-purple-600 text-white shadow-lg'
                              : 'bg-[#6d28d9]/30 text-gray-300 hover:text-white hover:bg-purple-500/30 border border-purple-300/40'
                          }`}
                        >
{getCategoryIcon(cat)}
                          <span className="text-center leading-tight">{getCategoryLabel(cat)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Query */}
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Search Query
                    </label>
                    <input
                      type="text"
                      value={filters.query}
                      onChange={(e) => handleFilterChange('query', e.target.value)}
                      placeholder={`Enter ${getCategoryLabel(filters.category).toLowerCase()} name...`}
                      className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200"
                    />
                  </div>

                  {/* Category-specific filters */}
                  {(filters.category === 'anime' || filters.category === 'manga') && (
                    <>
                      {/* Type Filter */}
                      <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Type
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200"
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgb(196 181 253)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        backgroundSize: '16px',
                        appearance: 'none'
                      }}
                    >
                      {(filters.category === 'anime' ? ANIME_TYPES : MANGA_TYPES).map(type => (
                        <option key={type.value} value={type.value} className="bg-[#6d28d9] text-white">
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200"
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgb(196 181 253)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        backgroundSize: '16px',
                        appearance: 'none'
                      }}
                    >
                      {(filters.category === 'anime' ? ANIME_STATUS : MANGA_STATUS).map(status => (
                        <option key={status.value} value={status.value} className="bg-[#6d28d9] text-white">
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rating Filter - Anime only */}
                  {filters.category === 'anime' && (
                    <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Rating
                    </label>
                    <select
                      value={filters.rating}
                      onChange={(e) => handleFilterChange('rating', e.target.value)}
                      className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200"
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgb(196 181 253)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        backgroundSize: '16px',
                        appearance: 'none'
                      }}
                    >
                      {RATINGS.map(rating => (
                        <option key={rating.value} value={rating.value} className="bg-[#6d28d9] text-white">
                          {rating.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  )}

                  {/* Score Range - For anime and manga */}
                  {(filters.category === 'anime' || filters.category === 'manga') && (
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Minimum Score
                    </label>
                    <select
                      value={filters.minScore}
                      onChange={(e) => handleFilterChange('minScore', parseFloat(e.target.value))}
                      className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200"
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgb(196 181 253)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        backgroundSize: '16px',
                        appearance: 'none'
                      }}
                    >
                      <option value={0} className="bg-[#6d28d9] text-white">Any Score</option>
                      <option value={1} className="bg-[#6d28d9] text-white">1.0+</option>
                      <option value={2} className="bg-[#6d28d9] text-white">2.0+</option>
                      <option value={3} className="bg-[#6d28d9] text-white">3.0+</option>
                      <option value={4} className="bg-[#6d28d9] text-white">4.0+</option>
                      <option value={5} className="bg-[#6d28d9] text-white">5.0+</option>
                      <option value={6} className="bg-[#6d28d9] text-white">6.0+</option>
                      <option value={7} className="bg-[#6d28d9] text-white">7.0+</option>
                      <option value={8} className="bg-[#6d28d9] text-white">8.0+</option>
                      <option value={9} className="bg-[#6d28d9] text-white">9.0+</option>
                    </select>
                  </div>
                  )}

                  {/* Genres - For anime and manga only */}
                  {(filters.category === 'anime' || filters.category === 'manga') && (
                    <>
                      {/* Genres */}
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Include Genres (<span className="text-green-400 font-semibold">{filters.genres.length}</span> selected)
                    </label>
                    <div className="max-h-40 overflow-y-auto bg-[#6d28d9]/20 border border-purple-300/30 rounded-lg p-3">
                      <div className="flex flex-wrap gap-1">
                        {genres.map(genre => (
                          <button
                            key={genre.mal_id}
                            onClick={() => handleGenreToggle(genre.mal_id)}
                            className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 font-medium ${
                              filters.genres.includes(genre.mal_id)
                                ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105"
                                : "bg-[#6d28d9]/40 text-purple-200 hover:bg-[#6d28d9]/60 hover:text-white border border-purple-300/30"
                            }`}
                          >
                            {genre.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Exclude Genres */}
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Exclude Genres (<span className="text-red-400 font-semibold">{filters.excludeGenres.length}</span> selected)
                    </label>
                    <div className="max-h-40 overflow-y-auto bg-[#6d28d9]/20 border border-purple-300/30 rounded-lg p-3">
                      <div className="flex flex-wrap gap-1">
                        {genres.map(genre => (
                          <button
                            key={genre.mal_id}
                            onClick={() => handleGenreToggle(genre.mal_id, true)}
                            className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 font-medium ${
                              filters.excludeGenres.includes(genre.mal_id)
                                ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg scale-105"
                                : "bg-[#6d28d9]/40 text-purple-200 hover:bg-[#6d28d9]/60 hover:text-white border border-purple-300/30"
                            }`}
                          >
                            {genre.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                    </>
                  )}

                  {/* Character/People specific filters */}
                  {(filters.category === 'characters' || filters.category === 'people') && (
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Minimum Favorites
                      </label>
                      <select
                        value={filters.minScore}
                        onChange={(e) => handleFilterChange('minScore', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200"
                        style={{
                          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgb(196 181 253)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 12px center',
                          backgroundSize: '16px',
                          appearance: 'none'
                        }}
                      >
                        <option value={0} className="bg-[#6d28d9] text-white">Any Amount</option>
                        <option value={100} className="bg-[#6d28d9] text-white">100+</option>
                        <option value={500} className="bg-[#6d28d9] text-white">500+</option>
                        <option value={1000} className="bg-[#6d28d9] text-white">1,000+</option>
                        <option value={5000} className="bg-[#6d28d9] text-white">5,000+</option>
                        <option value={10000} className="bg-[#6d28d9] text-white">10,000+</option>
                      </select>
                    </div>
                  )}

                  {/* Sort Options */}
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      <div className="inline-flex items-center">
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md flex items-center justify-center mr-2">
                          <FaSort className="text-white text-xs" />
                        </div>
                        Sort By
                      </div>
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={filters.orderBy}
                        onChange={(e) => handleFilterChange('orderBy', e.target.value)}
                        className="w-32 px-3 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200"
                        style={{
                          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgb(196 181 253)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 12px center',
                          backgroundSize: '16px',
                          appearance: 'none'
                        }}
                      >
                        {(() => {
                          const options = filters.category === 'anime' ? ANIME_ORDER_BY_OPTIONS :
                                         filters.category === 'manga' ? MANGA_ORDER_BY_OPTIONS :
                                         filters.category === 'people' ? PEOPLE_ORDER_BY_OPTIONS :
                                         CHARACTER_ORDER_BY_OPTIONS;
                          return options.map(option => (
                            <option key={option.value} value={option.value} className="bg-[#6d28d9] text-white">
                              {option.label}
                            </option>
                          ));
                        })()}
                      </select>
                      <select
                        value={filters.sort}
                        onChange={(e) => handleFilterChange('sort', e.target.value as 'asc' | 'desc')}
                        className="flex-1 px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200 min-h-[48px]"
                        style={{
                          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgb(196 181 253)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 12px center',
                          backgroundSize: '16px',
                          appearance: 'none',
                          lineHeight: '1.2'
                        }}
                      >
                        <option value="desc" className="bg-[#6d28d9] text-white py-2">Descending</option>
                        <option value="asc" className="bg-[#6d28d9] text-white py-2">Ascending</option>
                      </select>
                    </div>
                  </div>
                    </>
                  )}

                  {/* Clear Filters */}
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-3 bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-500 hover:to-red-600 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-purple-200">Searching {getCategoryLabel(filters.category).toLowerCase()}...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400 text-lg">{error}</p>
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="mb-6">
                  <div className="flex items-center justify-center">
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-300/30 rounded-lg px-4 py-2">
                      <p className="text-purple-200 font-medium">
                        Found <span className="text-purple-300 font-bold">{results.length}</span> results
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {results.map((anime, index) => (
                    <div
                      key={`${filters.category}-${anime.malId}-${index}`}
                      onClick={() => handleItemClick(anime)}
                      className="bg-gradient-to-br from-[#6d28d9]/20 to-[#3d2954]/40 backdrop-blur-sm border border-purple-300/20 rounded-xl overflow-hidden hover:border-purple-300/40 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105"
                    >
                      <div className="aspect-[3/4] relative overflow-hidden">
                        <img
                          src={anime.image}
                          alt={getItemTitle(anime)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-anime.jpg';
                          }}
                        />
                        {'status' in anime && (
                          <div className="absolute top-2 right-2">
                            <span className={`px-2 py-1 text-xs font-semibold text-white rounded-md shadow-lg ${
                              (filters.category === 'anime' && anime.status === "Airing Now") ? "bg-green-500" :
                              (filters.category === 'anime' && anime.status === "Scheduled") ? "bg-blue-500" :
                              (filters.category === 'anime' && anime.status === "Movie") ? "bg-purple-500" :
                              (filters.category === 'manga' && anime.status === "Publishing") ? "bg-green-500" :
                              (filters.category === 'manga' && anime.status === "Finished") ? "bg-blue-500" :
                              "bg-gray-500"
                            }`}>
                              {anime.status}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3">
                        <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                          {getItemTitle(anime)}
                        </h3>
                        
                        <div className="flex items-center justify-between text-xs">
                          {('rating' in anime && anime.rating > 0) && (
                            <div className="flex items-center space-x-1">
                              <FaStar className="text-yellow-400" />
                              <span className="text-purple-200 font-medium">{anime.rating.toFixed(1)}</span>
                            </div>
                          )}
                          
                          {anime.favorites > 0 && (
                            <div className="flex items-center space-x-1">
                              <FaHeart className="text-red-400" />
                              <span className="text-purple-200 font-medium">
                                {anime.favorites > 1000 
                                  ? `${(anime.favorites / 1000).toFixed(0)}K` 
                                  : anime.favorites}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-1 text-xs text-purple-300/80">
                          {filters.category === 'anime' && 'episodes' in anime && anime.episodes && `${anime.episodes} episodes`}
                          {filters.category === 'manga' && 'chapters' in anime && anime.chapters && `${anime.chapters} chapters`}
                          {filters.category === 'characters' && 'Character'}
                          {filters.category === 'people' && 'Person'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl text-purple-200 mb-2 font-semibold">No Results Found</h3>
                <p className="text-purple-300/80">Try adjusting your search filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdvancedSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
          <p className="text-gray-400">Loading advanced search...</p>
        </div>
      </div>
    }>
      <AdvancedSearchPageContent />
    </Suspense>
  );
}