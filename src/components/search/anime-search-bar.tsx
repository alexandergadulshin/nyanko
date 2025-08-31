"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { FaSearch, FaTimes, FaChevronDown } from "react-icons/fa";
import { jikanAPI, type SearchCategory, type SearchItem } from "~/utils/api";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "~/hooks/use-debounced-callback";

interface AnimeSearchBarProps {
  onItemSelect?: (item: SearchItem) => void;
  placeholder?: string;
  className?: string;
  defaultCategory?: SearchCategory;
}

const HighlightMatchInText = React.memo(({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;
  
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const index = textLower.indexOf(queryLower);
  
  if (index === -1) return <>{text}</>;
  
  return (
    <>
      {text.substring(0, index)}
      <span className="bg-purple-500/30 text-purple-200 light:bg-purple-200/50 light:text-purple-800 font-semibold">
        {text.substring(index, index + query.length)}
      </span>
      {text.substring(index + query.length)}
    </>
  );
});

HighlightMatchInText.displayName = 'HighlightMatchInText';

export function AnimeSearchBar({ 
  onItemSelect, 
  placeholder = "Search...",
  className = "",
  defaultCategory = "anime"
}: AnimeSearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<SearchCategory>(defaultCategory);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    setCategory(defaultCategory);
  }, [defaultCategory]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = useCallback(async () => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const searchResults = await jikanAPI.searchMultiCategory(query, category, 8);
      setResults(searchResults);
      setIsOpen(true);
    } catch (err) {
      console.error("Search error:", err);
      const errorMessage = err instanceof Error && err.message.includes('rate limited') 
        ? "Too many requests. Please wait a moment before searching again."
        : `Failed to search ${category}. Please try again.`;
      setError(errorMessage);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, category]);

  const debouncedSearch = useDebouncedCallback(performSearch, 600);

  useEffect(() => {
    debouncedSearch();
  }, [debouncedSearch]);

  const handleItemClick = useCallback((item: SearchItem) => {
    if (onItemSelect) {
      onItemSelect(item);
    } else {
      const path = category === 'anime' ? `/anime/${item.malId}` :
                   category === 'manga' ? `/manga/${item.malId}` :
                   category === 'characters' ? `/character/${item.malId}` :
                   `/person/${item.malId}`;
      router.push(path);
    }
    setIsOpen(false);
    setQuery("");
  }, [onItemSelect, category, router]);

  const getCategoryLabel = useCallback((cat: SearchCategory) => {
    switch (cat) {
      case 'anime': return 'Anime';
      case 'characters': return 'Characters';
      case 'people': return 'People';
      case 'manga': return 'Manga';
      default: return 'Anime';
    }
  }, []);

  const getItemTitle = useCallback((item: SearchItem) => {
    return 'title' in item ? item.title : item.name;
  }, []);

  const getItemSubtitle = useCallback((item: SearchItem) => {
    if (category === 'anime') {
      return `Episodes: ${(item as any).episodes || "Unknown"}`;
    } else if (category === 'manga') {
      return `Chapters: ${(item as any).chapters || "Unknown"}`;
    }
    return 'about' in item ? 'Character/Person' : 'Item';
  }, [category]);

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false); // Close dropdown
      router.push(`/advanced-search?q=${encodeURIComponent(query)}&category=${category}`);
    }
  };

  return (
    <form onSubmit={handleFormSubmit}>
    <div ref={searchRef} className={`relative w-full max-w-2xl ${className}`}>
      <div className="relative flex">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="h-full px-3 py-2 bg-[#6d28d9]/60 light:bg-white/80 border border-purple-300/40 light:border-gray-300 border-r-0 rounded-l-lg text-white light:text-gray-700 text-sm font-medium hover:bg-[#6d28d9]/80 light:hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-purple-300 light:focus:ring-purple-500 transition-all duration-200 flex items-center space-x-1"
          >
            <span>{getCategoryLabel(category)}</span>
            <FaChevronDown className={`h-3 w-3 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showCategoryDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-[#6d28d9]/95 light:bg-white/95 backdrop-blur-md border border-purple-300/40 light:border-gray-300 rounded-lg shadow-2xl z-60 min-w-[120px]">
              {(['anime', 'characters', 'people', 'manga'] as SearchCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    setShowCategoryDropdown(false);
                    setResults([]);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-purple-500/20 light:hover:bg-gray-100 transition-colors ${
                    category === cat ? 'bg-purple-500/30 light:bg-purple-100 text-white light:text-purple-800 font-medium' : 'text-gray-300 light:text-gray-700'
                  } ${cat === 'anime' ? 'rounded-t-lg' : ''} ${cat === 'manga' ? 'rounded-b-lg' : ''}`}
                >
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-4 w-4 text-purple-200/70" />
          </div>
          
          <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            console.log("Key pressed:", e.key);
            if (e.key === 'Enter') {
              console.log("Enter key pressed, preventing default and submitting form");
              e.preventDefault();
              handleFormSubmit(e);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-[#6d28d9]/40 light:bg-white/60 border border-purple-300/40 light:border-gray-300 border-l-0 rounded-r-lg text-white light:text-gray-700 placeholder-purple-200/60 light:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-300 light:focus:ring-purple-500 focus:border-purple-300 light:focus:border-purple-500 focus:bg-[#6d28d9]/60 light:focus:bg-white/80 hover:border-purple-300/60 light:hover:border-gray-400 transition-all duration-200"
        />
        
          {query && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-200/70 hover:text-purple-100 transition-colors"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isOpen && (query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#6d28d9]/95 light:bg-white/95 backdrop-blur-md border border-purple-300/40 light:border-gray-300 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400 light:text-gray-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-2"></div>
              Searching...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-400 light:text-red-600">{error}</div>
          ) : results.length > 0 ? (
            <>
              <div className="px-3 py-2 border-b border-purple-300/30 light:border-gray-300 text-xs text-purple-200/80 light:text-gray-500">
                Sorted by popularity and relevance
              </div>
              {results.map((item) => (
                <button
                  key={item.malId}
                  onClick={() => handleItemClick(item)}
                  className="w-full p-3 flex items-center space-x-3 hover:bg-purple-500/20 light:hover:bg-gray-100 transition-colors text-left"
                >
                  <img
                    src={item.image}
                    alt={getItemTitle(item)}
                    className="w-12 h-16 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-anime.jpg';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white light:text-gray-800 font-medium truncate">
                      <HighlightMatchInText text={getItemTitle(item)} query={query} />
                    </h3>
                    <p className="text-gray-400 light:text-gray-600 text-sm truncate">
                      <HighlightMatchInText text={item.description} query={query} />
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-3">
                        {('rating' in item && item.rating > 0) && (
                          <span className="text-yellow-400 text-sm font-medium">★ {item.rating.toFixed(1)}</span>
                        )}
                        {item.favorites > 0 && (
                          <span className="text-red-400 text-sm">
                            ♥ {item.favorites > 1000 
                              ? `${(item.favorites / 1000).toFixed(0)}K` 
                              : item.favorites}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-400 light:text-gray-600 text-xs">{getItemSubtitle(item)}</span>
                        {'status' in item && (
                          <span className="text-gray-500 light:text-gray-500 text-xs">{item.status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              <div className="p-3 text-center border-t border-purple-300/30 light:border-gray-300 bg-[#6d28d9]/40 light:bg-gray-50">
                <div className="space-y-2">
                  <button
                    onClick={() => router.push(`/advanced-search?q=${encodeURIComponent(query)}&category=${category}`)}
                    className="text-purple-200 light:text-purple-600 hover:text-purple-100 light:hover:text-purple-700 text-sm font-medium transition-colors block mx-auto"
                  >
                    View all {getCategoryLabel(category).toLowerCase()} results for &quot;{query}&quot;
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-gray-400 light:text-gray-600">
              No anime found for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
    </form>
  );
}