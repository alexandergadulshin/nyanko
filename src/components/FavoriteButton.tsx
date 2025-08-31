"use client";

import React, { useState } from "react";
import { FaHeart, FaSpinner } from "react-icons/fa";
import { useUser } from "@clerk/nextjs";
import { useFavorites } from "~/hooks/useFavorites";

interface FavoriteButtonProps {
  type: string;
  itemId: number;
  itemTitle: string;
  itemImage?: string;
  itemData?: unknown;
  className?: string;
}

export function FavoriteButton({
  type,
  itemId,
  itemTitle,
  itemImage,
  itemData,
  className = "",
}: FavoriteButtonProps) {
  const { user } = useUser();
  const {
    loading,
    isFavorite,
    canAddFavorite,
    getFavoriteCount,
    addToFavorites,
    removeFromFavorites,
  } = useFavorites();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const isCurrentlyFavorited = isFavorite(type, itemId);
  const favoriteCount = getFavoriteCount(type);
  const canAdd = canAddFavorite(type);

  const handleToggleFavorite = async () => {
    if (!user) return;
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      if (isCurrentlyFavorited) {
        await removeFromFavorites(type, itemId);
      } else {
        if (!canAdd) {
          setShowTooltip(true);
          setTimeout(() => setShowTooltip(false), 3000);
          return;
        }
        await addToFavorites(type, itemId, itemTitle, itemImage, itemData);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Show tooltip with error message
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const getTooltipText = () => {
    if (!canAdd && !isCurrentlyFavorited) {
      return `Maximum 5 ${type}s allowed in favorites`;
    }
    if (isCurrentlyFavorited) {
      return `Remove from favorites`;
    }
    return `Add to favorites (${favoriteCount}/5)`;
  };

  if (!user || loading) {
    return null; // Don't show favorite button if not signed in or still loading
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggleFavorite}
        disabled={isProcessing || (!canAdd && !isCurrentlyFavorited)}
        className={`
          flex items-center justify-center space-x-2 px-4 py-2 rounded-lg
          transition-all duration-200 font-medium text-sm
          ${
            isCurrentlyFavorited
              ? "bg-red-500 hover:bg-red-600 text-white"
              : canAdd
              ? "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600"
              : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
          }
          ${className}
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {isProcessing ? (
          <FaSpinner className="animate-spin" />
        ) : (
          <FaHeart
            className={`${
              isCurrentlyFavorited ? "text-white" : "text-gray-400"
            }`}
          />
        )}
        <span>
          {isProcessing
            ? "..."
            : isCurrentlyFavorited
            ? "Favorited"
            : `Favorite (${favoriteCount}/5)`}
        </span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-10">
          {getTooltipText()}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}