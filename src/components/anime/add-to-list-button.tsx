"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "~/lib/auth-client";
import { FaPlus, FaCheck, FaPlay, FaPause, FaTimes, FaEye, FaStar, FaTrash } from "react-icons/fa";

interface AnimeDetails {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
  episodes?: number;
}

interface AddToListButtonProps {
  anime: AnimeDetails;
}

interface ListEntry {
  id: string;
  status: "planning" | "watching" | "completed" | "dropped" | "paused";
  score?: number;
  episodesWatched: number;
  totalEpisodes?: number;
  notes?: string;
}

export function AddToListButton({ anime }: AddToListButtonProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<ListEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: "planning" as const,
    score: 0,
    episodesWatched: 0,
    notes: "",
  });

  useEffect(() => {
    setCurrentEntry(null);
  }, [anime.mal_id, session]);

  const statusOptions = [
    { value: "planning", label: "Plan to Watch", icon: <FaEye />, color: "text-yellow-400" },
    { value: "watching", label: "Watching", icon: <FaPlay />, color: "text-green-400" },
    { value: "completed", label: "Completed", icon: <FaCheck />, color: "text-blue-400" },
    { value: "paused", label: "Paused", icon: <FaPause />, color: "text-orange-400" },
    { value: "dropped", label: "Dropped", icon: <FaTimes />, color: "text-red-400" },
  ] as const;

  const getCurrentStatusInfo = () => {
    if (!currentEntry) return null;
    return statusOptions.find(opt => opt.value === currentEntry.status);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setLoading(true);
    try {
      const response = await fetch("/api/anime-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          animeId: anime.mal_id,
          animeTitle: anime.title,
          animeImage: anime.images.jpg.image_url,
          status: formData.status,
          score: formData.score || null,
          episodesWatched: formData.episodesWatched,
          totalEpisodes: anime.episodes || null,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentEntry(result.entry);
        setIsOpen(false);
      } else {
        console.error("Failed to add to list");
      }
    } catch (error) {
      console.error("Error adding to list:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!session || !currentEntry) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/anime-list?animeId=${anime.mal_id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCurrentEntry(null);
        setIsOpen(false);
      } else {
        console.error("Failed to remove from list");
      }
    } catch (error) {
      console.error("Error removing from list:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    if (currentEntry) {
      setFormData({
        status: currentEntry.status,
        score: currentEntry.score || 0,
        episodesWatched: currentEntry.episodesWatched,
        notes: currentEntry.notes || "",
      });
    }
    setIsOpen(true);
  };

  if (!session) {
    return (
      <a
        href="/auth"
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
      >
        <FaPlus className="w-4 h-4" />
        Sign in to Add
      </a>
    );
  }

  const statusInfo = getCurrentStatusInfo();

  return (
    <div className="flex-1">
      <button
        onClick={openModal}
        className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium ${
          currentEntry
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-purple-600 hover:bg-purple-700 text-white"
        }`}
      >
        {statusInfo ? (
          <>
            {statusInfo.icon}
            {statusInfo.label}
          </>
        ) : (
          <>
            <FaPlus className="w-4 h-4" />
            Add to List
          </>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a1f3d] border border-purple-300/20 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
              <img
                src={anime.images.jpg.image_url}
                alt={anime.title}
                className="w-16 h-20 object-cover rounded-lg"
              />
              <div>
                <h3 className="text-lg font-semibold text-white line-clamp-2">
                  {anime.title}
                </h3>
                {anime.episodes && (
                  <p className="text-sm text-purple-300">{anime.episodes} episodes</p>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Status
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {statusOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.status === option.value
                          ? "border-purple-400 bg-purple-400/10"
                          : "border-purple-300/20 hover:border-purple-400/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={formData.status === option.value}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, status: e.target.value as any }))
                        }
                        className="sr-only"
                      />
                      <span className={option.color}>{option.icon}</span>
                      <span className="text-white">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {(formData.status === "watching" || formData.status === "completed") && (
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Episodes Watched
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={anime.episodes || 9999}
                    value={formData.episodesWatched}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, episodesWatched: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  {anime.episodes && (
                    <p className="text-xs text-purple-300 mt-1">
                      Total: {anime.episodes} episodes
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Score (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={formData.score}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))
                    }
                    className="flex-1 px-3 py-2 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="0">No Score</option>
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  {formData.score > 0 && (
                    <div className="flex items-center gap-1 text-yellow-400">
                      <FaStar className="w-4 h-4" />
                      <span>{formData.score}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Personal Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Your thoughts about this anime..."
                  rows={3}
                  className="w-full px-3 py-2 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {loading ? "Saving..." : currentEntry ? "Update" : "Add to List"}
                </button>
                
                {currentEntry && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    title="Remove from list"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}