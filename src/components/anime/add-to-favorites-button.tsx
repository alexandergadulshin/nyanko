"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "~/lib/auth-client";
import { FaHeart, FaRegHeart, FaSpinner } from "react-icons/fa";

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

interface AddToFavoritesButtonProps {
  anime: AnimeDetails;
}

export function AddToFavoritesButton({ anime }: AddToFavoritesButtonProps) {
  const { data: session } = useSession();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(`/api/favorites?type=anime`);
        if (response.ok) {
          const { favorites } = await response.json();
          const isInFavorites = favorites.some((fav: any) => fav.itemId === anime.mal_id);
          setIsFavorited(isInFavorites);
        }
      } catch (err) {
        console.error("Error checking favorite status:", err);
      }
    };

    checkFavoriteStatus();
  }, [anime.mal_id, session]);

  const handleToggleFavorite = async () => {
    if (!session?.user?.id) {
      setError("Please log in to add favorites");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isFavorited) {
        const response = await fetch(`/api/favorites?type=anime&itemId=${anime.mal_id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setIsFavorited(false);
        } else {
          const data = await response.json();
          setError(data.error || "Failed to remove from favorites");
        }
      } else {
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "anime",
            itemId: anime.mal_id,
            itemTitle: anime.title,
            itemImage: anime.images.jpg.image_url,
            itemData: {
              episodes: anime.episodes,
            },
          }),
        });

        if (response.ok) {
          setIsFavorited(true);
        } else {
          const data = await response.json();
          if (response.status === 409) {
            setIsFavorited(true);
          } else {
            setError(data.error || "Failed to add to favorites");
          }
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null; // Don't show button if not logged in
  }

  return (
    <div className="flex-1">
      <button
        onClick={handleToggleFavorite}
        disabled={loading}
        className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium ${
          isFavorited
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-purple-600 hover:bg-purple-700 text-white"
        } ${loading ? "opacity-75 cursor-not-allowed" : ""}`}
      >
        {loading ? (
          <>
            <FaSpinner className="w-4 h-4 animate-spin" />
            {isFavorited ? "Removing..." : "Adding..."}
          </>
        ) : (
          <>
            {isFavorited ? <FaHeart className="w-4 h-4" /> : <FaRegHeart className="w-4 h-4" />}
            {isFavorited ? "Favorited" : "Favorites"}
          </>
        )}
      </button>
      
      {error && (
        <p className="text-red-400 text-xs mt-1 text-center">{error}</p>
      )}
    </div>
  );
}