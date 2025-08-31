"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaStar, FaHeart, FaFilter, FaSort, FaTimes, FaPlay, FaUsers, FaTheaterMasks, FaBook } from "react-icons/fa";
import { jikanAPI, type GenreItem, type SearchCategory, type SearchItem } from "~/utils/api";

interface TypeOption {
  value: string;
  label: string;
}

interface StatusOption {
  value: string;
  label: string;
}


const CATEGORY_CONFIGS = {
  anime: {
    label: 'Anime',
    icon: <FaPlay className="w-4 h-4" />,
    types: [
      { value: "", label: "All Types" },
      { value: "tv", label: "TV" },
      { value: "movie", label: "Movie" },
      { value: "ova", label: "OVA" },
      { value: "special", label: "Special" },
      { value: "ona", label: "ONA" },
      { value: "music", label: "Music" },
    ],
    statuses: [
      { value: "", label: "All Status" },
      { value: "airing", label: "Currently Airing" },
      { value: "complete", label: "Finished Airing" },
      { value: "upcoming", label: "Not Yet Aired" },
    ],
    orderByOptions: [
      { value: "score", label: "Score" },
      { value: "rank", label: "Rank" },
      { value: "title", label: "Title" },
      { value: "mal_id", label: "MAL ID" },
      { value: "start_date", label: "Start Date" },
      { value: "end_date", label: "End Date" },
      { value: "scored_by", label: "Scored By" },
      { value: "popularity", label: "Popularity" },
    ]
  },
  manga: {
    label: 'Manga',
    icon: <FaBook className="w-4 h-4" />,
    types: [
      { value: "", label: "All Types" },
      { value: "manga", label: "Manga" },
      { value: "novel", label: "Light Novel" },
      { value: "lightnovel", label: "Light Novel" },
      { value: "oneshot", label: "One-shot" },
      { value: "doujin", label: "Doujinshi" },
      { value: "manhwa", label: "Manhwa" },
      { value: "manhua", label: "Manhua" },
    ],
    statuses: [
      { value: "", label: "All Status" },
      { value: "publishing", label: "Publishing" },
      { value: "complete", label: "Finished" },
      { value: "upcoming", label: "Not Yet Published" },
      { value: "discontinued", label: "Discontinued" },
    ],
    orderByOptions: [
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
    ]
  },
  characters: {
    label: 'Characters',
    icon: <FaUsers className="w-4 h-4" />,
    orderByOptions: [
      { value: "name", label: "Name" },
      { value: "mal_id", label: "MAL ID" },
      { value: "favorites", label: "Favorites" },
    ]
  },
  people: {
    label: 'People',
    icon: <FaTheaterMasks className="w-4 h-4" />,
    orderByOptions: [
      { value: "name", label: "Name" },
      { value: "mal_id", label: "MAL ID" },
      { value: "favorites", label: "Favorites" },
    ]
  }
} as const;

const RATINGS = [
  { value: "", label: "All Ratings" },
  { value: "g", label: "G - All Ages" },
  { value: "pg", label: "PG - Children" },
  { value: "pg13", label: "PG-13 - Teens 13 or older" },
  { value: "r17", label: "R - 17+ (violence & profanity)" },
  { value: "r", label: "R+ - Mild Nudity" },
  { value: "rx", label: "Rx - Hentai" },
];

const SCORE_OPTIONS = [
  { value: 0, label: "Any Score" },
  { value: 1, label: "1.0+" },
  { value: 2, label: "2.0+" },
  { value: 3, label: "3.0+" },
  { value: 4, label: "4.0+" },
  { value: 5, label: "5.0+" },
  { value: 6, label: "6.0+" },
  { value: 7, label: "7.0+" },
  { value: 8, label: "8.0+" },
  { value: 9, label: "9.0+" },
];

const FAVORITES_OPTIONS = [
  { value: 0, label: "Any Amount" },
  { value: 100, label: "100+" },
  { value: 500, label: "500+" },
  { value: 1000, label: "1,000+" },
  { value: 5000, label: "5,000+" },
  { value: 10000, label: "10,000+" },
];

const STATUS_COLORS = {
  "Airing Now": "bg-green-500",
  "Scheduled": "bg-blue-500",
  "Movie": "bg-purple-500",
  "Publishing": "bg-green-500",
  "Finished": "bg-blue-500",
} as const;

const SELECT_STYLES = {
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgb(196 181 253)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  backgroundSize: '16px',
  appearance: 'none'
} as const;

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

const initialFilters: SearchFilters = {
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
};

function AdvancedSearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [results, setResults] = useState<SearchItem[]>([]);
  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  
  const [filters, setFilters] = useState<SearchFilters>({
    ...initialFilters,
    query: searchParams.get("q") ?? "",
    category: (searchParams.get("category") as SearchCategory) ?? "anime",
  });

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const genreList = await jikanAPI.getGenres();
        setGenres(genreList);
        
        if (genreList.length > 0 && genreList.every(genre => genre.count === 0)) {
          console.log("Using fallback genres due to API issues");
        }
      } catch (err) {
        console.error("Failed to load genres:", err);
        if (err instanceof Error) {
          const errorMsg = err.message.includes('rate limited') || err.message.includes('429')
            ? "API rate limited. Please wait a moment and refresh the page."
            : err.message.includes('Server error')
            ? "API temporarily unavailable. Please try again later."
            : "Failed to load genres. Some filters may not be available.";
          setError(errorMsg);
        }
      }
    };

    void loadGenres();
  }, []);

  const performSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const searchResults = filters.category === 'anime' 
        ? await jikanAPI.advancedSearch({
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
          })
        : await jikanAPI.searchMultiCategory(filters.query, filters.category, 48);
      
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
  }, [filters]);

  useEffect(() => {
    const hasValidQuery = filters.query.trim().length >= 2;
    const hasOtherFilters = filters.type || filters.status || filters.rating || 
                           filters.genres.length > 0 || filters.excludeGenres.length > 0 ||
                           filters.minScore > 0;
    
    if (hasValidQuery || hasOtherFilters) {
      void performSearch();
    }
  }, [filters, performSearch]);

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
      [otherKey]: prev[otherKey].filter(id => id !== genreId),
    }));
  };

  const clearFilters = () => setFilters(initialFilters);

  const handleItemClick = (item: SearchItem) => {
    const pathMap = {
      anime: `/anime/${item.malId}`,
      manga: `/manga/${item.malId}`,
      characters: `/character/${item.malId}`,
      people: `/person/${item.malId}`,
    } as const;
    router.push(pathMap[filters.category]);
  };

  const categoryConfig = CATEGORY_CONFIGS[filters.category];
  const getItemTitle = (item: SearchItem) => 'title' in item ? item.title : item.name;

  return (
    <div className="min-h-screen bg-[#181622] light:bg-transparent">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
              Advanced Search
            </span>
          </h1>
          <div className="mt-4 w-[calc(100%-2rem)] max-w-6xl h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
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
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Search Category
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(CATEGORY_CONFIGS) as SearchCategory[]).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => handleFilterChange('category', cat)}
                          className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex flex-col items-center justify-center space-y-1 min-h-[60px] ${
                            filters.category === cat
                              ? 'bg-purple-600 light:bg-purple-300 text-white shadow-lg'
                              : 'bg-[#6d28d9]/30 text-gray-300 hover:text-white hover:bg-purple-500/30 border border-purple-300/40'
                          }`}
                        >
                          {CATEGORY_CONFIGS[cat].icon}
                          <span className="text-center leading-tight">{CATEGORY_CONFIGS[cat].label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Search Query
                    </label>
                    <input
                      type="text"
                      value={filters.query}
                      onChange={(e) => handleFilterChange('query', e.target.value)}
                      placeholder={`Enter ${categoryConfig.label.toLowerCase()} name...`}
                      className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200"
                    />
                  </div>

                  {(filters.category === 'anime' || filters.category === 'manga') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-purple-200 mb-2">Type</label>
                        <select
                          value={filters.type}
                          onChange={(e) => handleFilterChange('type', e.target.value)}
                          className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200"
                          style={SELECT_STYLES}
                        >
                          {'types' in categoryConfig && categoryConfig.types?.map((type: TypeOption) => (
                            <option key={type.value} value={type.value} className="bg-[#6d28d9] text-white">
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-purple-200 mb-2">Status</label>
                        <select
                          value={filters.status}
                          onChange={(e) => handleFilterChange('status', e.target.value)}
                          className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200"
                          style={SELECT_STYLES}
                        >
                          {'statuses' in categoryConfig && categoryConfig.statuses?.map((status: StatusOption) => (
                            <option key={status.value} value={status.value} className="bg-[#6d28d9] text-white">
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {filters.category === 'anime' && (
                        <div>
                          <label className="block text-sm font-medium text-purple-200 mb-2">Rating</label>
                          <select
                            value={filters.rating}
                            onChange={(e) => handleFilterChange('rating', e.target.value)}
                            className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200"
                            style={SELECT_STYLES}
                          >
                            {RATINGS.map(rating => (
                              <option key={rating.value} value={rating.value} className="bg-[#6d28d9] text-white">
                                {rating.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-purple-200 mb-2">Minimum Score</label>
                        <select
                          value={filters.minScore}
                          onChange={(e) => handleFilterChange('minScore', parseFloat(e.target.value))}
                          className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200"
                          style={SELECT_STYLES}
                        >
                          {SCORE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value} className="bg-[#6d28d9] text-white">
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <>
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
                    </>
                  )}

                  {(filters.category === 'characters' || filters.category === 'people') && (
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">Minimum Favorites</label>
                      <select
                        value={filters.minScore}
                        onChange={(e) => handleFilterChange('minScore', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200"
                        style={SELECT_STYLES}
                      >
                        {FAVORITES_OPTIONS.map(option => (
                          <option key={option.value} value={option.value} className="bg-[#6d28d9] text-white">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

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
                        style={SELECT_STYLES}
                      >
                        {categoryConfig.orderByOptions.map(option => (
                          <option key={option.value} value={option.value} className="bg-[#6d28d9] text-white">
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={filters.sort}
                        onChange={(e) => handleFilterChange('sort', e.target.value as 'asc' | 'desc')}
                        className="flex-1 px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200 min-h-[48px]"
                        style={{...SELECT_STYLES, lineHeight: '1.2'}}
                      >
                        <option value="desc" className="bg-[#6d28d9] text-white py-2">Descending</option>
                        <option value="asc" className="bg-[#6d28d9] text-white py-2">Ascending</option>
                      </select>
                    </div>
                  </div>

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

          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-purple-200">Searching {categoryConfig.label.toLowerCase()}...</p>
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
                              STATUS_COLORS[anime.status as keyof typeof STATUS_COLORS] || "bg-gray-500"
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