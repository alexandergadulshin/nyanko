"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaPlus, FaSearch, FaFilter, FaEdit, FaTrash, FaMinus } from "react-icons/fa";
import { jikanAPI } from "~/utils/api";

interface AnimeListItem {
  id: string;
  animeId: number;
  animeTitle: string;
  animeImage?: string;
  status: "planning" | "watching" | "completed" | "dropped" | "paused";
  score?: number;
  episodesWatched: number;
  totalEpisodes?: number;
  startDate?: string;
  finishDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SearchAnime {
  id: number;
  malId: number;
  title: string;
  image: string;
  episodes?: number | null;
  description: string;
}

type StatusFilter = "all" | "planning" | "watching" | "completed" | "dropped" | "paused";

const statusPriorityMap = {
  planning: 1,
  watching: 2,
  completed: 3,
  paused: 4,
  dropped: 5
} as const;

const statusColorMap = {
  watching: "bg-blue-500",
  completed: "bg-green-500",
  planning: "bg-gray-500",
  paused: "bg-yellow-500",
  dropped: "bg-red-500"
} as const;

const statusTextMap = {
  watching: "Watching",
  completed: "Completed",
  planning: "Plan to Watch",
  paused: "On Hold",
  dropped: "Dropped"
} as const;

const AnimeListItemComponent = React.memo(({ 
  anime, 
  onIncrement, 
  onDecrement, 
  onEdit, 
  onRemove, 
  isUpdating 
}: {
  anime: AnimeListItem;
  onIncrement: (anime: AnimeListItem) => void;
  onDecrement: (anime: AnimeListItem) => void;
  onEdit: (anime: AnimeListItem) => void;
  onRemove: (animeId: number) => void;
  isUpdating: boolean;
}) => (
  <div className="group px-4 py-3 hover:bg-gray-700/20 transition-all duration-200">
    <div className="flex items-center space-x-3">
      <div className="relative flex-shrink-0">
        <img
          src={anime.animeImage}
          alt={anime.animeTitle}
          className="w-12 h-16 object-cover rounded border border-gray-600/40 group-hover:border-purple-500/40 transition-all duration-200"
          onError={(e) => {
            e.currentTarget.src = `https://via.placeholder.com/48x64/4f356b/ffffff?text=?`;
          }}
        />
        <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-gray-800 ${statusColorMap[anime.status] || "bg-gray-500"}`}></div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-3">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-medium text-white group-hover:text-purple-200 transition-colors truncate">
                {anime.animeTitle}
              </h3>
              <span className={`px-1.5 py-0.5 rounded text-white text-xs font-medium ${statusColorMap[anime.status] || "bg-gray-500"}`}>
                {statusTextMap[anime.status] || "Unknown"}
              </span>
            </div>
            
            <div className="flex items-center space-x-3 text-sm">
              <div className="flex items-center space-x-1.5">
                <span className="text-gray-400 text-xs">Ep:</span>
                <div className={`flex items-center space-x-1 bg-gray-700/40 rounded px-2 py-0.5 transition-all duration-200 ${isUpdating ? 'bg-purple-500/20' : ''}`}>
                  <button
                    onClick={() => onDecrement(anime)}
                    disabled={anime.episodesWatched <= 0 || isUpdating}
                    className="p-0.5 hover:bg-red-500/30 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                    title="Decrease episode"
                  >
                    <FaMinus className="w-2 h-2 text-gray-400 hover:text-white transition-colors" />
                  </button>
                  <span className={`text-white font-medium min-w-[40px] text-center text-xs transition-colors ${isUpdating ? 'text-purple-300' : ''}`}>
                    {isUpdating ? '...' : `${anime.episodesWatched}/${anime.totalEpisodes ?? "?"}`}
                  </span>
                  <button
                    onClick={() => onIncrement(anime)}
                    disabled={(anime.totalEpisodes ? anime.episodesWatched >= anime.totalEpisodes : false) || isUpdating}
                    className="p-0.5 hover:bg-green-500/30 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                    title="Add episode"
                  >
                    <FaPlus className="w-2 h-2 text-gray-400 hover:text-white transition-colors" />
                  </button>
                </div>
              </div>

              {anime.score && (
                <div className="flex items-center space-x-0.5 bg-yellow-500/15 px-1.5 py-0.5 rounded">
                  <span className="text-yellow-400 text-xs">★</span>
                  <span className="text-yellow-300 font-medium text-xs">{anime.score}</span>
                </div>
              )}

              {anime.notes && (
                <span className="text-gray-400 text-xs truncate max-w-xs">
                  &ldquo;{anime.notes}&rdquo;
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-0.5">
            <button
              onClick={() => onEdit(anime)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-purple-600/30 rounded transition-all duration-200"
              title="Edit"
            >
              <FaEdit className="w-3 h-3" />
            </button>
            <button
              onClick={() => onRemove(anime.animeId)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-red-600/30 rounded transition-all duration-200"
              title="Remove"
            >
              <FaTrash className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
));

AnimeListItemComponent.displayName = 'AnimeListItemComponent';

export default function AnimeListPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [animeList, setAnimeList] = useState<AnimeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchAnime[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editingItem, setEditingItem] = useState<AnimeListItem | null>(null);
  const [editForm, setEditForm] = useState({
    status: "planning" as AnimeListItem["status"],
    score: 0,
    episodesWatched: 0,
    notes: ""
  });
  const [updatingEpisodes, setUpdatingEpisodes] = useState<Set<string>>(new Set());

  const fetchAnimeList = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/profile/${user.id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch anime list");
      }
      
      const data = await response.json() as { animeList?: AnimeListItem[] };
      setAnimeList(data.animeList ?? []);
    } catch (err) {
      console.error("Error fetching anime list:", err);
      setError("Failed to load anime list");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoaded && user?.id) {
      fetchAnimeList().catch(console.error);
    }
  }, [user?.id, isLoaded, fetchAnimeList]);

  const searchForAnime = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const results = await jikanAPI.searchAnime(searchQuery);
      setSearchResults(results.slice(0, 10));
    } catch (err) {
      console.error("Error searching anime:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchForAnime().catch(console.error);
      } else {
        setSearchResults([]);
        setSearchLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchForAnime]);

  const addAnimeToList = async (anime: SearchAnime, status: AnimeListItem["status"]) => {
    try {
      const episodesWatched = status === "completed" ? (anime.episodes ?? 1) : 0;

      const response = await fetch("/api/anime-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animeId: anime.malId,
          animeTitle: anime.title,
          animeImage: anime.image,
          status,
          episodesWatched,
          totalEpisodes: anime.episodes,
          score: null,
          notes: null
        })
      });

      if (!response.ok) {
        throw new Error("Failed to add anime to list");
      }

      await fetchAnimeList();
      setShowAddModal(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error("Error adding anime:", err);
      setError("Failed to add anime to list");
    }
  };

  const updateAnimeEntry = async () => {
    if (!editingItem) return;

    try {
      const response = await fetch("/api/anime-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animeId: editingItem.animeId,
          animeTitle: editingItem.animeTitle,
          animeImage: editingItem.animeImage,
          status: editForm.status,
          score: editForm.score || null,
          episodesWatched: editForm.episodesWatched,
          totalEpisodes: editingItem.totalEpisodes,
          notes: editForm.notes || null
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update anime entry");
      }

      await fetchAnimeList();
      setEditingItem(null);
    } catch (err) {
      console.error("Error updating anime:", err);
      setError("Failed to update anime entry");
    }
  };

  const removeAnimeFromList = async (animeId: number) => {
    try {
      const response = await fetch(`/api/anime-list?animeId=${animeId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to remove anime from list");
      }

      await fetchAnimeList();
    } catch (err) {
      console.error("Error removing anime:", err);
      setError("Failed to remove anime from list");
    }
  };

  const updateEpisodeCount = useCallback(async (anime: AnimeListItem, increment: boolean) => {
    const currentCount = anime.episodesWatched;
    const newEpisodeCount = increment ? currentCount + 1 : currentCount - 1;
    
    if (newEpisodeCount < 0 || (anime.totalEpisodes && increment && currentCount >= anime.totalEpisodes)) {
      return;
    }

    let newStatus = anime.status;
    
    if (increment) {
      if (anime.totalEpisodes && newEpisodeCount >= anime.totalEpisodes) {
        newStatus = "completed";
      } else if (anime.status === "planning" && newEpisodeCount === 1) {
        newStatus = "watching";
      }
    } else {
      if (anime.status === "watching" && newEpisodeCount === 0) {
        newStatus = "planning";
      } else if (anime.status === "completed" && anime.totalEpisodes && newEpisodeCount < anime.totalEpisodes) {
        newStatus = "watching";
      }
    }

    setUpdatingEpisodes(prev => new Set(prev).add(anime.id));

    setAnimeList(prevList => 
      prevList.map(item => 
        item.id === anime.id 
          ? { ...item, episodesWatched: newEpisodeCount, status: newStatus }
          : item
      )
    );

    try {
      const response = await fetch("/api/anime-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animeId: anime.animeId,
          animeTitle: anime.animeTitle,
          animeImage: anime.animeImage,
          status: newStatus,
          score: anime.score,
          episodesWatched: newEpisodeCount,
          totalEpisodes: anime.totalEpisodes,
          notes: anime.notes
        })
      });

      if (!response.ok) {
        setAnimeList(prevList => 
          prevList.map(item => 
            item.id === anime.id 
              ? { ...item, episodesWatched: anime.episodesWatched, status: anime.status }
              : item
          )
        );
        throw new Error("Failed to update episode count");
      }
    } catch (err) {
      console.error("Error updating episode count:", err);
      setError("Failed to update episode count");
    } finally {
      setUpdatingEpisodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(anime.id);
        return newSet;
      });
    }
  }, []);

  const incrementEpisode = useCallback((anime: AnimeListItem) => updateEpisodeCount(anime, true), [updateEpisodeCount]);
  const decrementEpisode = useCallback((anime: AnimeListItem) => updateEpisodeCount(anime, false), [updateEpisodeCount]);

  const startEdit = useCallback((item: AnimeListItem) => {
    setEditingItem(item);
    setEditForm({
      status: item.status,
      score: item.score ?? 0,
      episodesWatched: item.episodesWatched,
      notes: item.notes ?? ""
    });
  }, []);

  const filteredAnimeList = useMemo(() => {
    return animeList
      .filter(anime => statusFilter === "all" || anime.status === statusFilter)
      .sort((a, b) => {
        const priorityA = statusPriorityMap[a.status] || 6;
        const priorityB = statusPriorityMap[b.status] || 6;
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        return a.animeTitle.localeCompare(b.animeTitle);
      });
  }, [animeList, statusFilter]);

  const animeListStats = useMemo(() => {
    const statusCounts = animeList.reduce((acc, anime) => {
      acc[anime.status] = (acc[anime.status] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalWatchDays = Math.round(animeList.reduce((sum, anime) => 
      sum + (anime.episodesWatched * 24), 0) / 60 / 24 * 10) / 10;

    return { statusCounts, totalWatchDays };
  }, [animeList]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading anime list...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Please sign in to view your anime list</p>
          <button
            onClick={() => router.push("/auth")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181622] light:bg-transparent">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-transparent to-pink-900/5"></div>
      
      <header className="backdrop-blur-md bg-gradient-to-r from-[#6d28d9]/80 to-[#6b4f75]/80 border-b border-purple-300/20 sticky top-0 z-50 shadow-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.back()}
                className="group flex items-center space-x-2 text-white/70 hover:text-white transition-all duration-200 hover:bg-white/10 px-3 py-2 rounded-lg"
              >
                <FaArrowLeft className="w-4 h-4 group-hover:transform group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="font-medium">Back</span>
              </button>
              <div className="h-6 w-px bg-white/20"></div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">My Anime List</h1>
                <p className="text-purple-200/80 text-sm">Manage your anime collection</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="group flex items-center space-x-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-purple-900/20"
            >
              <FaPlus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
              <span>Add Anime</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 mb-8 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <FaFilter className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-gray-200 font-medium">Filter by Status:</span>
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="appearance-none bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gray-600/50 rounded-xl px-4 py-3 pr-10 text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400/50 transition-all duration-200 shadow-lg hover:shadow-xl hover:border-purple-400/70 cursor-pointer min-w-[200px]"
                >
                  <option value="all" className="bg-gray-800 text-white">All Anime ({animeList.length})</option>
                  <option value="planning" className="bg-gray-800 text-white">Plan to Watch ({animeListStats.statusCounts.planning ?? 0})</option>
                  <option value="watching" className="bg-gray-800 text-white">Watching ({animeListStats.statusCounts.watching ?? 0})</option>
                  <option value="completed" className="bg-gray-800 text-white">Completed ({animeListStats.statusCounts.completed ?? 0})</option>
                  <option value="paused" className="bg-gray-800 text-white">On Hold ({animeListStats.statusCounts.paused ?? 0})</option>
                  <option value="dropped" className="bg-gray-800 text-white">Dropped ({animeListStats.statusCounts.dropped ?? 0})</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-400">
                Showing <span className="text-purple-300 font-semibold">{filteredAnimeList.length}</span> of <span className="text-white font-semibold">{animeList.length}</span> anime
              </div>
              <div className="h-6 w-px bg-gray-600"></div>
              <div className="text-sm text-gray-400">
                <span className="text-green-300 font-semibold">{animeListStats.totalWatchDays}</span> days watched
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/30 overflow-hidden shadow-lg">
          {filteredAnimeList.length > 0 ? (
            <div className="divide-y divide-gray-700/20">
              {filteredAnimeList.map((anime) => (
                <AnimeListItemComponent
                  key={anime.id}
                  anime={anime}
                  onIncrement={incrementEpisode}
                  onDecrement={decrementEpisode}
                  onEdit={startEdit}
                  onRemove={removeAnimeFromList}
                  isUpdating={updatingEpisodes.has(anime.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-700/30">
              {statusFilter === "all" ? (
                <div className="space-y-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                    <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-3">Your anime list is empty!</h3>
                    <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">Start building your collection by adding your first anime and tracking your watching progress.</p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-10 py-4 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-purple-900/25"
                  >
                    <div className="flex items-center space-x-3">
                      <FaPlus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                      <span>Add Your First Anime</span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold text-white mb-2">No anime found</h3>
                  <p className="text-gray-400">No anime with status: <span className="text-purple-300 font-medium">{statusFilter in statusTextMap ? statusTextMap[statusFilter] : statusFilter}</span></p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-visible">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Add Anime to List</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="relative">
                <div className="flex space-x-2 mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for anime..."
                    className="flex-1 px-4 py-2 bg-gray-900/40 border border-gray-600/40 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    onClick={searchForAnime}
                    disabled={searchLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center space-x-2 disabled:opacity-50"
                  >
                    <FaSearch className="w-4 h-4" />
                    <span>{searchLoading ? "Searching..." : "Search"}</span>
                  </button>
                </div>

                {(searchLoading || searchResults.length > 0) && searchQuery.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800/95 backdrop-blur-md border border-gray-600/50 rounded-lg shadow-2xl z-[60] max-h-80 overflow-y-auto">
                    {searchLoading && (
                      <div className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2 text-gray-400">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                          <span className="text-sm">Searching anime...</span>
                        </div>
                      </div>
                    )}
                    
                    {!searchLoading && searchResults.length > 0 && (
                      <div className="divide-y divide-gray-700/30">
                        {searchResults.map((anime) => (
                          <div key={anime.malId} className="flex items-center space-x-3 p-3 hover:bg-gray-700/30 transition-colors">
                            <img
                              src={anime.image}
                              alt={anime.title}
                              className="w-10 h-14 object-cover rounded border border-gray-600/40"
                              onError={(e) => {
                                e.currentTarget.src = `https://via.placeholder.com/40x56/4f356b/ffffff?text=?`;
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium text-sm truncate">{anime.title}</h4>
                              <p className="text-gray-400 text-xs">
                                Episodes: {anime.episodes ?? "Unknown"}
                              </p>
                            </div>
                            <div className="flex space-x-1">
                              {[
                                { status: "planning", label: "Plan", color: "bg-gray-500" },
                                { status: "watching", label: "Watch", color: "bg-blue-500" },
                                { status: "completed", label: "Done", color: "bg-green-500" }
                              ].map(({ status, label, color }) => (
                                <button
                                  key={status}
                                  onClick={() => {
                                    addAnimeToList(anime, status as AnimeListItem["status"]).catch(console.error);
                                    setSearchQuery("");
                                    setSearchResults([]);
                                  }}
                                  className={`px-2 py-1 ${color} hover:opacity-80 text-white text-xs rounded transition-colors`}
                                  title={`Add to ${label}`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {!searchLoading && searchResults.length === 0 && searchQuery.trim() && (
                      <div className="p-4 text-center text-gray-400 text-sm">
                        No anime found for &ldquo;{searchQuery}&rdquo;
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Edit Anime</h2>
                <button
                  onClick={() => setEditingItem(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as AnimeListItem["status"] }))}
                  className="w-full px-3 py-2 bg-gray-900/40 border border-gray-600/40 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="planning">Plan to Watch</option>
                  <option value="watching">Watching</option>
                  <option value="completed">Completed</option>
                  <option value="paused">On Hold</option>
                  <option value="dropped">Dropped</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-1">Episodes Watched</label>
                <input
                  type="number"
                  min="0"
                  max={editingItem.totalEpisodes ?? 9999}
                  value={editForm.episodesWatched === 0 ? "" : editForm.episodesWatched}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditForm(prev => ({ ...prev, episodesWatched: value === "" ? 0 : parseInt(value) ?? 0 }));
                  }}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-gray-900/40 border border-gray-600/40 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-1">Score (1-10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={editForm.score === 0 ? "" : editForm.score}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditForm(prev => ({ ...prev, score: value === "" ? 0 : parseInt(value) ?? 0 }));
                  }}
                  placeholder="No score"
                  className="w-full px-3 py-2 bg-gray-900/40 border border-gray-600/40 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-1">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-900/40 border border-gray-600/40 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                  placeholder="Your thoughts about this anime..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={updateAnimeEntry}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg z-50">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-200 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}