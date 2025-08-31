"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaEdit, FaPlus, FaSearch, FaTimes, FaHeart, FaCamera, FaUserPlus, FaUserCheck, FaSpinner, FaTrash, FaCheck, FaBan } from "react-icons/fa";
import { jikanAPI } from "~/utils/api";
import { statusColors, statusText, type UserAnimeStatus } from "~/lib/status-utils";

const STATUS_COLORS = {
  planning: statusColors.userAnime.planning.bg,
  watching: statusColors.userAnime.watching.bg,
  completed: statusColors.userAnime.completed.bg,
  paused: statusColors.userAnime.paused.bg,
  dropped: statusColors.userAnime.dropped.bg
} as const;

const STATUS_LABELS = {
  planning: statusText.userAnime.planning,
  watching: statusText.userAnime.watching,
  completed: statusText.userAnime.completed,
  paused: statusText.userAnime.paused,
  dropped: statusText.userAnime.dropped
} as const;

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

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  username?: string;
  bio?: string;
  createdAt: string;
}

interface FavoriteItem {
  id: string;
  type: "anime" | "character" | "person";
  itemId: number;
  itemTitle: string;
  itemImage?: string;
  itemData?: string;
  createdAt: string;
}

interface SearchAnime {
  id: number;
  malId: number;
  title: string;
  image: string;
  episodes?: number | null;
  description: string;
}

interface FriendshipStatus {
  status: "self" | "friends" | "request_sent" | "request_received" | "not_accepting" | "none";
  friendshipId?: string;
  requestId?: string;
  canSendRequest?: boolean;
  message: string;
}

export default function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  // Hide the main navbar for profile pages
  React.useEffect(() => {
    const navbar = document.querySelector('nav');
    if (navbar) {
      navbar.style.display = 'none';
    }
    
    return () => {
      const navbar = document.querySelector('nav');
      if (navbar) {
        navbar.style.display = '';
      }
    };
  }, []);
  const resolvedParams = React.use(params);
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [animeList, setAnimeList] = useState<AnimeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    bio: "",
    image: ""
  });
  const [saving, setSaving] = useState(false);
  
  // Favorites state
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [showAddFavoriteModal, setShowAddFavoriteModal] = useState(false);
  const [favoriteType, setFavoriteType] = useState<"anime" | "character" | "person">("anime");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchAnime[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Friend management state
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus | null>(null);
  const [friendActionLoading, setFriendActionLoading] = useState(false);

  const isOwnProfile = user?.id === resolvedParams.userId;

  const fetchFavorites = async () => {
    try {
      const response = await fetch("/api/favorites");
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      }
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  };

  const fetchFriendshipStatus = async () => {
    if (isOwnProfile || !user) return;
    
    try {
      const response = await fetch(`/api/friends/status/${resolvedParams.userId}`);
      if (response.ok) {
        const data = await response.json();
        setFriendshipStatus(data);
      }
    } catch (err) {
      console.error("Error fetching friendship status:", err);
    }
  };

  const sendFriendRequest = async () => {
    if (!friendshipStatus?.canSendRequest) return;
    
    setFriendActionLoading(true);
    try {
      const response = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toUserId: resolvedParams.userId,
        }),
      });

      if (response.ok) {
        await fetchFriendshipStatus(); // Refresh status
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send friend request');
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
      setError('Failed to send friend request');
    } finally {
      setFriendActionLoading(false);
    }
  };

  const respondToFriendRequest = async (action: 'accept' | 'decline') => {
    if (!friendshipStatus?.requestId) return;
    
    setFriendActionLoading(true);
    try {
      const response = await fetch('/api/friends/requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: friendshipStatus.requestId,
          action,
        }),
      });

      if (response.ok) {
        await fetchFriendshipStatus(); // Refresh status
      } else {
        const data = await response.json();
        setError(data.error || `Failed to ${action} friend request`);
      }
    } catch (err) {
      console.error(`Error ${action}ing friend request:`, err);
      setError(`Failed to ${action} friend request`);
    } finally {
      setFriendActionLoading(false);
    }
  };

  const cancelFriendRequest = async () => {
    if (!friendshipStatus?.requestId) return;
    
    setFriendActionLoading(true);
    try {
      const response = await fetch(`/api/friends/requests?requestId=${friendshipStatus.requestId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchFriendshipStatus(); // Refresh status
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to cancel friend request');
      }
    } catch (err) {
      console.error('Error cancelling friend request:', err);
      setError('Failed to cancel friend request');
    } finally {
      setFriendActionLoading(false);
    }
  };

  const removeFriend = async () => {
    if (!friendshipStatus?.friendshipId || !confirm('Are you sure you want to remove this friend?')) return;
    
    setFriendActionLoading(true);
    try {
      const response = await fetch(`/api/friends/${friendshipStatus.friendshipId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchFriendshipStatus(); // Refresh status
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to remove friend');
      }
    } catch (err) {
      console.error('Error removing friend:', err);
      setError('Failed to remove friend');
    } finally {
      setFriendActionLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/profile/${resolvedParams.userId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (isOwnProfile && (!data.profile.username || !data.profile.name)) {
          router.push("/onboarding");
          return;
        }
        
        setProfile(data.profile);
        setAnimeList(data.animeList || []);
        
        const profileData = data.profile;
        setEditForm({
          name: profileData.name || "",
          username: profileData.username || "",
          bio: profileData.bio || "",
          image: profileData.image || ""
        });
        
        if (isOwnProfile) {
          await fetchFavorites();
        } else {
          await fetchFriendshipStatus();
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [resolvedParams.userId, isOwnProfile]);

  const stats = useMemo(() => {
    const statusCounts = animeList.reduce((acc, anime) => {
      acc[anime.status] = (acc[anime.status] ?? 0) + 1;
      return acc;
    }, {} as Record<UserAnimeStatus, number>);
    
    const totalEpisodes = animeList.reduce((sum, anime) => sum + anime.episodesWatched, 0);
    const totalMinutes = totalEpisodes * 24;
    const withScores = animeList.filter(anime => anime.score);
    
    return {
      totalAnime: animeList.length,
      watching: statusCounts.watching ?? 0,
      completed: statusCounts.completed ?? 0,
      planning: statusCounts.planning ?? 0,
      paused: statusCounts.paused ?? 0,
      dropped: statusCounts.dropped ?? 0,
      totalEpisodes,
      totalHours: Math.round(totalMinutes / 60),
      averageScore: withScores.length > 0 
        ? withScores.reduce((sum, anime) => sum + (anime.score ?? 0), 0) / withScores.length
        : null,
      totalDays: Math.round(totalMinutes / (60 * 24) * 10) / 10,
    };
  }, [animeList]);

  const favoriteCounts = useMemo(() => ({
    anime: favorites.filter(f => f.type === "anime").length,
    character: favorites.filter(f => f.type === "character").length,
    person: favorites.filter(f => f.type === "person").length
  }), [favorites]);

  const FavoriteItem = React.memo(({ fav }: { fav: FavoriteItem }) => (
    <div className="group flex items-center space-x-2 bg-gray-900/30 hover:bg-gray-900/50 rounded-lg p-2 border border-gray-700/20 transition-colors cursor-pointer">
      <img
        src={fav.itemImage}
        alt={fav.itemTitle}
        className="w-8 h-10 object-cover rounded"
        onError={(e) => {
          e.currentTarget.src = `https://via.placeholder.com/32x40/4f356b/ffffff?text=?`;
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-medium truncate">{fav.itemTitle}</p>
      </div>
      {isOwnProfile && (
        <button
          onClick={() => removeFromFavorites(fav.type, fav.itemId)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 p-1 transition-all duration-200 hover:bg-red-500/20 rounded"
          title="Remove from favorites"
        >
          <FaTimes className="w-3 h-3" />
        </button>
      )}
    </div>
  ));

  const handleStartEdit = () => {
    if (!profile) return;
    setEditForm({
      name: profile.name,
      username: profile.username || "",
      bio: profile.bio || "",
      image: profile.image || ""
    });
    setIsEditing(true);
  };

  const handleImageChange = (imageUrl: string) => {
    setEditForm(prev => ({ ...prev, image: imageUrl }));
  };

  const handleSaveProfile = async () => {
    if (!isOwnProfile || !profile) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/profile/${resolvedParams.userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      setProfile(prev => prev ? {
        ...prev,
        ...data.profile
      } : null);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
      setError("Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!profile) return;
    setEditForm({
      name: profile.name,
      username: profile.username || "",
      bio: profile.bio || "",
      image: profile.image || ""
    });
    setIsEditing(false);
  };

  // Favorites functions
  const searchForAnime = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const results = await jikanAPI.searchAnime(searchQuery);
      setSearchResults(results.slice(0, 8));
    } catch (err) {
      console.error("Error searching anime:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const addToFavorites = async (anime: SearchAnime, type: "anime" | "character" | "person") => {
    try {
      const currentCount = favoriteCounts[type];
      if (currentCount >= 5) {
        setError(`You can only have up to 5 favorite ${type === "anime" ? "anime" : type + "s"}. Remove one first.`);
        return;
      }

      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          itemId: anime.malId,
          itemTitle: anime.title,
          itemImage: anime.image,
          itemData: JSON.stringify({
            description: anime.description,
            episodes: anime.episodes
          })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add to favorites");
      }

      await fetchFavorites();
      setShowAddFavoriteModal(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error("Error adding to favorites:", err);
      setError(err instanceof Error ? err.message : "Failed to add to favorites");
    }
  };

  const removeFromFavorites = async (type: string, itemId: number) => {
    try {
      const response = await fetch(`/api/favorites?type=${type}&itemId=${itemId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to remove from favorites");
      }

      // Refresh favorites list
      await fetchFavorites();
    } catch (err) {
      console.error("Error removing from favorites:", err);
      setError("Failed to remove from favorites");
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Please sign in to view profiles</p>
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

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || "Profile not found"}</p>
          <button
            onClick={() => router.back()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181622] light:bg-transparent pt-0">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-transparent to-pink-900/5"></div>
      
      <header className="backdrop-blur-sm bg-[#6d28d9]/60 border-b border-purple-300/20 sticky top-0 z-50 light:bg-white/85 light:border-gray-300/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors duration-200 light:text-gray-600 light:hover:text-gray-800"
            >
              <FaArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="text-sm text-purple-200/80 light:text-gray-600">
              {profile.name}'s Profile
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-12 border border-gray-700/30">
              <div className="text-center">
                <div className="relative group">
                  <div
                    className={`relative ${isOwnProfile ? "cursor-pointer" : ""}`}
                    onClick={isOwnProfile ? () => router.push('/settings') : undefined}
                  >
{profile.image && profile.image.trim() !== '' ? (
                      <>
                        <img
                          src={profile.image}
                          alt={profile.name}
                          className="w-36 h-36 mx-auto rounded-full border-2 border-gray-600/40 object-cover shadow-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement | null;
                            if (nextElement) {
                              nextElement.style.display = 'block';
                            }
                          }}
                        />
                        <div className="w-36 h-36 mx-auto rounded-full border-2 border-gray-600/40 bg-gray-600 shadow-lg hidden"></div>
                      </>
                    ) : (
                      <div className="w-36 h-36 mx-auto rounded-full border-2 border-gray-600/40 bg-gray-600 shadow-lg"></div>
                    )}
                    
                    {isOwnProfile && (
                      <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <div className="text-center">
                          <FaCamera className="w-6 h-6 text-white mx-auto mb-1" />
                          <span className="text-white text-xs">Edit Profile</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30">
              <h3 className="font-semibold text-gray-100 mb-3 text-sm">Navigation</h3>
              <div className="space-y-2">
                <a href="#statistics" className="block text-gray-300 hover:text-white text-sm py-1 px-2 rounded hover:bg-gray-700/30 transition-colors duration-200">Statistics</a>
                <a href="#favorites" className="block text-gray-300 hover:text-white text-sm py-1 px-2 rounded hover:bg-gray-700/30 transition-colors duration-200">Favorites</a>
                <a href="#recent-activity" className="block text-gray-300 hover:text-white text-sm py-1 px-2 rounded hover:bg-gray-700/30 transition-colors duration-200">Recent Activity</a>
                <button
                  onClick={() => router.push("/anime-list")}
                  className="block w-full text-left text-purple-300 hover:text-purple-200 text-sm py-1 px-2 rounded hover:bg-purple-700/30 transition-colors duration-200"
                >
                  View Anime List →
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30">
              <h3 className="font-semibold text-gray-100 mb-3 text-sm">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Anime</span>
                  <span className="text-white font-medium">{stats.totalAnime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Episodes</span>
                  <span className="text-white font-medium">{stats.totalEpisodes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Days Watched</span>
                  <span className="text-white font-medium">{stats.totalDays}</span>
                </div>
                {stats.averageScore && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-700/30">
                    <span className="text-gray-400">Mean Score</span>
                    <span className="text-yellow-400 font-medium">{stats.averageScore.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="text-2xl font-bold text-white border-b border-gray-600/50 focus:outline-none focus:border-purple-500 bg-transparent pb-1"
                      />
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Username"
                        className="text-gray-300 border-b border-gray-600/40 focus:outline-none focus:border-purple-500 bg-transparent pb-1"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
                        {isOwnProfile ? (
                          <button
                            onClick={() => router.push('/settings')}
                            className="text-gray-400 hover:text-white p-1 hover:bg-gray-700/40 rounded transition-colors duration-200"
                            title="Edit Profile Settings"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                        ) : friendshipStatus && (
                          <div className="flex items-center gap-2">
                            {friendshipStatus.status === 'friends' && (
                              <>
                                <span className="flex items-center gap-1 text-green-400 text-sm">
                                  <FaUserCheck className="w-4 h-4" />
                                  Friends
                                </span>
                                <button
                                  onClick={removeFriend}
                                  disabled={friendActionLoading}
                                  className="text-gray-400 hover:text-red-400 p-1 hover:bg-red-500/20 rounded transition-colors duration-200"
                                  title="Remove Friend"
                                >
                                  {friendActionLoading ? (
                                    <FaSpinner className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <FaTrash className="w-4 h-4" />
                                  )}
                                </button>
                              </>
                            )}
                            
                            {friendshipStatus.status === 'request_sent' && (
                              <div className="flex items-center gap-2">
                                <span className="text-yellow-400 text-sm">Request Sent</span>
                                <button
                                  onClick={cancelFriendRequest}
                                  disabled={friendActionLoading}
                                  className="text-gray-400 hover:text-red-400 p-1 hover:bg-red-500/20 rounded transition-colors duration-200"
                                  title="Cancel Request"
                                >
                                  {friendActionLoading ? (
                                    <FaSpinner className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <FaTimes className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            )}
                            
                            {friendshipStatus.status === 'request_received' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => respondToFriendRequest('accept')}
                                  disabled={friendActionLoading}
                                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                  title="Accept Friend Request"
                                >
                                  {friendActionLoading ? (
                                    <FaSpinner className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <FaCheck className="w-3 h-3" />
                                  )}
                                  Accept
                                </button>
                                <button
                                  onClick={() => respondToFriendRequest('decline')}
                                  disabled={friendActionLoading}
                                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                  title="Decline Friend Request"
                                >
                                  <FaTimes className="w-3 h-3" />
                                  Decline
                                </button>
                              </div>
                            )}
                            
                            {friendshipStatus.status === 'none' && friendshipStatus.canSendRequest && (
                              <button
                                onClick={sendFriendRequest}
                                disabled={friendActionLoading}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1"
                                title="Send Friend Request"
                              >
                                {friendActionLoading ? (
                                  <FaSpinner className="w-3 h-3 animate-spin" />
                                ) : (
                                  <FaUserPlus className="w-3 h-3" />
                                )}
                                Add Friend
                              </button>
                            )}
                            
                            {friendshipStatus.status === 'not_accepting' && (
                              <span className="flex items-center gap-1 text-gray-500 text-sm">
                                <FaBan className="w-4 h-4" />
                                Not accepting requests
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {profile.username && (
                        <p className="text-gray-400 mb-3">@{profile.username}</p>
                      )}
                    </>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      Online
                    </span>
                    <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {isOwnProfile && isEditing && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm disabled:opacity-50 transition-colors duration-200"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4">
                {isEditing ? (
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell others about yourself..."
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-900/40 border border-gray-600/40 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                  />
                ) : (
                  <p className="text-gray-200 leading-relaxed">
                    {profile.bio || (isOwnProfile ? "Add a bio to tell others about yourself!" : "This user hasn't added a bio yet.")}
                  </p>
                )}
              </div>
            </div>

            <div id="statistics" className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
              <div className="flex items-center justify-between mb-4 border-b border-gray-700/40 pb-2">
                <h2 className="text-xl font-bold text-white">Statistics</h2>
                {isOwnProfile && (
                  <button
                    onClick={() => router.push("/anime-list")}
                    className="text-purple-400 hover:text-purple-300 text-sm transition-colors duration-200"
                  >
                    View Anime List →
                  </button>
                )}
              </div>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-200 font-medium">Days Watched by Status</span>
                  <span className="text-white font-bold">{stats.totalDays} days</span>
                </div>
                
                {(() => {
                  const statusDays = animeList.reduce((acc, anime) => {
                    const days = anime.episodesWatched * 24 / 60 / 24;
                    acc[anime.status] = (acc[anime.status] ?? 0) + days;
                    return acc;
                  }, {} as Record<UserAnimeStatus, number>);
                  
                  const totalDays = Math.max(stats.totalDays, 0.1);
                  const percentages = Object.entries(statusDays).reduce((acc, [status, days]) => {
                    acc[status as UserAnimeStatus] = (days / totalDays) * 100;
                    return acc;
                  }, {} as Record<UserAnimeStatus, number>);

                  return (
                    <>
                      <div className="w-full bg-gray-700/40 rounded-full h-4 overflow-hidden flex">
                        {Object.entries(percentages).map(([status, percentage]) => {
                          if (percentage <= 0) return null;
                          const statusKey = status as UserAnimeStatus;
                          const days = Math.round(statusDays[statusKey] * 10) / 10;
                          const statusLabel = status === 'paused' ? 'On Hold' : status.charAt(0).toUpperCase() + status.slice(1);
                          
                          return (
                            <div 
                              key={status}
                              className={`${STATUS_COLORS[statusKey]} h-full transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                              title={`${statusLabel}: ${days} days`}
                            />
                          );
                        })}
                      </div>
                      
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-2">
                        {Object.entries(statusDays).map(([status, days]) => {
                          if (days <= 0) return null;
                          const statusKey = status as UserAnimeStatus;
                          const statusLabel = status === 'paused' ? 'On Hold' : status.charAt(0).toUpperCase() + status.slice(1);
                          
                          return (
                            <div key={status} className="flex items-center space-x-1">
                              <div className={`w-3 h-3 ${STATUS_COLORS[statusKey]} rounded-sm`} />
                              <span>{statusLabel} ({Math.round(days * 10) / 10}d)</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-700/20 rounded-lg">
                  <div className="text-lg font-bold text-white mb-1">{stats.totalEpisodes.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Episodes Watched</div>
                </div>
                <div className="text-center p-3 bg-gray-700/20 rounded-lg">
                  <div className="text-lg font-bold text-white mb-1">{Math.round(stats.totalDays * 24)} hrs</div>
                  <div className="text-xs text-gray-400">Total Watch Time</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                <div className="text-center p-2 bg-blue-500/10 rounded border border-blue-400/20">
                  <div className="font-medium text-blue-300">{stats.watching}</div>
                  <div className="text-xs text-blue-200">Watching</div>
                </div>
                <div className="text-center p-2 bg-green-500/10 rounded border border-green-400/20">
                  <div className="font-medium text-green-300">{stats.completed}</div>
                  <div className="text-xs text-green-200">Completed</div>
                </div>
                <div className="text-center p-2 bg-yellow-500/10 rounded border border-yellow-400/20">
                  <div className="font-medium text-yellow-300">{stats.paused}</div>
                  <div className="text-xs text-yellow-200">On-Hold</div>
                </div>
                <div className="text-center p-2 bg-red-500/10 rounded border border-red-400/20">
                  <div className="font-medium text-red-300">{stats.dropped}</div>
                  <div className="text-xs text-red-200">Dropped</div>
                </div>
                <div className="text-center p-2 bg-gray-500/10 rounded border border-gray-400/20">
                  <div className="font-medium text-gray-300">{stats.planning}</div>
                  <div className="text-xs text-gray-200">Planning</div>
                </div>
              </div>
            </div>


            <div id="favorites" className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
              <div className="flex items-center justify-between mb-4 border-b border-gray-700/40 pb-2">
                <h2 className="text-xl font-bold text-white">Favorites</h2>
                {isOwnProfile && (
                  <button
                    onClick={() => setShowAddFavoriteModal(true)}
                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                  >
                    <FaPlus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-medium text-gray-200 mb-3 flex items-center justify-between">
                    <span>Favorite Anime</span>
                    <span className="text-xs text-gray-500">({favoriteCounts.anime}/5)</span>
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {favorites.filter(f => f.type === "anime").length > 0 ? (
                      favorites.filter(f => f.type === "anime").map((fav) => (
                        <FavoriteItem key={fav.id} fav={fav} />
                      ))
                    ) : (
                      <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/20 text-center">
                        <div className="text-gray-400 text-sm">No favorites added yet</div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-200 mb-3 flex items-center justify-between">
                    <span>Favorite Characters</span>
                    <span className="text-xs text-gray-500">({favoriteCounts.character}/5)</span>
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {favorites.filter(f => f.type === "character").length > 0 ? (
                      favorites.filter(f => f.type === "character").map((fav) => (
                        <FavoriteItem key={fav.id} fav={fav} />
                      ))
                    ) : (
                      <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/20 text-center">
                        <div className="text-gray-400 text-sm">No favorites added yet</div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-200 mb-3 flex items-center justify-between">
                    <span>Favorite People</span>
                    <span className="text-xs text-gray-500">({favoriteCounts.person}/5)</span>
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {favorites.filter(f => f.type === "person").length > 0 ? (
                      favorites.filter(f => f.type === "person").map((fav) => (
                        <FavoriteItem key={fav.id} fav={fav} />
                      ))
                    ) : (
                      <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/20 text-center">
                        <div className="text-gray-400 text-sm">No favorites added yet</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div id="recent-activity" className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
              <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700/40 pb-2">Recent Activity</h2>
              <div className="space-y-3">
                {animeList.slice(0, 3).map((anime) => (
                  <div key={anime.id} className="flex items-center space-x-3 p-3 bg-gray-900/30 rounded-lg">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-300 flex-1 text-sm">
                      <span className="text-white font-medium">
                        {STATUS_LABELS[anime.status] || 'Updated'}
                      </span>
                      <a href="#" className="text-blue-400 hover:text-blue-300 mx-1 transition-colors duration-200">{anime.animeTitle}</a>
                      <span className="text-gray-500">• {new Date(anime.updatedAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                ))}
                {animeList.length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddFavoriteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Add to Favorites</h2>
                <button
                  onClick={() => setShowAddFavoriteModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">Category</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFavoriteType("anime")}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      favoriteType === "anime" 
                        ? "bg-purple-600 text-white" 
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                    disabled={favoriteCounts.anime >= 5}
                  >
                    <span>Anime</span>
                    <span className="ml-1 text-xs opacity-70">({favoriteCounts.anime}/5)</span>
                  </button>
                  <button
                    onClick={() => setFavoriteType("character")}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      favoriteType === "character" 
                        ? "bg-purple-600 text-white" 
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                    disabled={favoriteCounts.character >= 5}
                  >
                    <span>Characters</span>
                    <span className="ml-1 text-xs opacity-70">({favoriteCounts.character}/5)</span>
                  </button>
                  <button
                    onClick={() => setFavoriteType("person")}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      favoriteType === "person" 
                        ? "bg-purple-600 text-white" 
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                    disabled={favoriteCounts.person >= 5}
                  >
                    <span>People</span>
                    <span className="ml-1 text-xs opacity-70">({favoriteCounts.person}/5)</span>
                  </button>
                </div>
              </div>

              {favoriteType === "anime" && (
                <>
                  <div className="flex space-x-2 mb-4">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for anime..."
                      className="flex-1 px-4 py-2 bg-gray-900/40 border border-gray-600/40 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      onKeyPress={(e) => e.key === "Enter" && searchForAnime()}
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

                  {searchResults.length > 0 && (
                    <div className="space-y-3">
                      {searchResults.map((anime) => (
                        <div key={anime.malId} className="flex items-center space-x-3 p-3 bg-gray-900/30 rounded-lg">
                          <img
                            src={anime.image}
                            alt={anime.title}
                            className="w-12 h-16 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = `https://via.placeholder.com/48x64/4f356b/ffffff?text=?`;
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="text-white font-medium text-sm">{anime.title}</h4>
                            <p className="text-gray-400 text-xs">
                              Episodes: {anime.episodes || "Unknown"}
                            </p>
                          </div>
                          <button
                            onClick={() => addToFavorites(anime, favoriteType)}
                            className="flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                          >
                            <FaHeart className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {(favoriteType === "character" || favoriteType === "person") && (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-sm">
                    {favoriteType === "character" ? "Character" : "People"} search functionality coming soon!
                  </div>
                </div>
              )}
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
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}