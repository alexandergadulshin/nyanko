"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

interface FavoriteItem {
  id: string;
  type: string;
  itemId: number;
  itemTitle: string;
  itemImage: string | null;
  itemData: string | null;
  createdAt: string;
}

export function useFavorites(type?: string) {
  const { user } = useUser();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const url = new URL("/api/favorites", window.location.origin);
      if (type) {
        url.searchParams.set("type", type);
      }
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch favorites");
      }
      
      const data = await response.json();
      setFavorites(data.favorites || []);
    } catch (err) {
      console.error("Error fetching favorites:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch favorites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      void fetchFavorites();
    } else {
      setLoading(false);
      setFavorites([]);
    }
  }, [user, type]);

  const addToFavorites = async (
    itemType: string,
    itemId: number,
    itemTitle: string,
    itemImage?: string,
    itemData?: unknown
  ) => {
    if (!user) {
      throw new Error("User must be signed in");
    }

    const response = await fetch("/api/favorites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: itemType,
        itemId,
        itemTitle,
        itemImage,
        itemData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to add to favorites");
    }

    const result = await response.json();
    
    await fetchFavorites();
    
    return result;
  };

  const removeFromFavorites = async (itemType: string, itemId: number) => {
    if (!user) {
      throw new Error("User must be signed in");
    }

    const url = new URL("/api/favorites", window.location.origin);
    url.searchParams.set("type", itemType);
    url.searchParams.set("itemId", itemId.toString());

    const response = await fetch(url.toString(), {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to remove from favorites");
    }

    await fetchFavorites();
  };

  const isFavorite = (itemType: string, itemId: number) => {
    return favorites.some(
      (fav) => fav.type === itemType && fav.itemId === itemId
    );
  };

  const getFavoritesByType = (itemType: string) => {
    return favorites.filter((fav) => fav.type === itemType);
  };

  const getFavoriteCount = (itemType: string) => {
    return getFavoritesByType(itemType).length;
  };

  const canAddFavorite = (itemType: string) => {
    return getFavoriteCount(itemType) < 5;
  };

  return {
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    getFavoritesByType,
    getFavoriteCount,
    canAddFavorite,
    refetch: fetchFavorites,
  };
}