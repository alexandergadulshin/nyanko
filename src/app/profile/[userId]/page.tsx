"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaEdit, FaPlus, FaSearch, FaTimes, FaHeart, FaCamera } from "react-icons/fa";
import ProfilePictureUpload from "~/components/profile/profile-picture-upload";
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
  const { data: session, isPending } = useSession();
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

  const isOwnProfile = session?.user?.id === resolvedParams.userId;

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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/profile/${resolvedParams.userId}`);
        
        if (!response.ok) {
          console.error("Profile fetch failed:", response.status, response.statusText);
          const errorText = await response.text();
          console.error("Error details:", errorText);
          throw new Error(`Failed to fetch profile: ${response.status}`);
        }
        
        const data = await response.json();
        setProfile(data.profile);
        setAnimeList(data.animeList || []);
        
        // Initialize edit form with profile data
        setEditForm({
          name: data.profile.name || "",
          username: data.profile.username || "",
          bio: data.profile.bio || "",
          image: data.profile.image || ""
        });
        
        // Fetch favorites if it's the user's own profile
        if (isOwnProfile) {
          await fetchFavorites();
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

  // Calculate anime statistics
  const stats = {
    totalAnime: animeList.length,
    watching: animeList.filter(anime => anime.status === "watching").length,
    completed: animeList.filter(anime => anime.status === "completed").length,
    planning: animeList.filter(anime => anime.status === "planning").length,
    paused: animeList.filter(anime => anime.status === "paused").length,
    dropped: animeList.filter(anime => anime.status === "dropped").length,
    totalEpisodes: animeList.reduce((sum, anime) => sum + anime.episodesWatched, 0),
    totalHours: Math.round(animeList.reduce((sum, anime) => sum + (anime.episodesWatched * 24), 0) / 60), // 24 min per episode
    averageScore: animeList.filter(anime => anime.score).length > 0 
      ? (animeList.reduce((sum, anime) => sum + (anime.score || 0), 0) / animeList.filter(anime => anime.score).length)
      : null,
    totalDays: Math.round(animeList.reduce((sum, anime) => sum + (anime.episodesWatched * 24), 0) / 60 / 24 * 10) / 10,
  };

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
      setSearchResults(results.slice(0, 8)); // Limit to 8 results
    } catch (err) {
      console.error("Error searching anime:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const addToFavorites = async (anime: SearchAnime, type: "anime" | "character" | "person") => {
    try {
      // Check if we already have 5 favorites of this type
      const currentFavorites = favorites.filter(f => f.type === type);
      if (currentFavorites.length >= 5) {
        setError(`You can only have up to 5 favorite ${type === "anime" ? "anime" : type + "s"}. Remove one first.`);
        return;
      }

      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
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

      // Refresh favorites list
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

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session) {
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
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-transparent to-pink-900/5"></div>
      
      {/* Header */}
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
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Profile Picture */}
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
                            e.currentTarget.nextElementSibling.style.display = 'block';
                          }}
                        />
                        <div className="w-36 h-36 mx-auto rounded-full border-2 border-gray-600/40 bg-gray-600 shadow-lg hidden"></div>
                      </>
                    ) : (
                      <div className="w-36 h-36 mx-auto rounded-full border-2 border-gray-600/40 bg-gray-600 shadow-lg"></div>
                    )}
                    
                    {/* Camera overlay for own profile */}
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

            {/* Quick Navigation */}
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

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Header */}
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
                        {isOwnProfile && (
                          <button
                            onClick={() => router.push('/settings')}
                            className="text-gray-400 hover:text-white p-1 hover:bg-gray-700/40 rounded transition-colors duration-200"
                            title="Edit Profile Settings"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
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
                
                {/* Edit Buttons */}
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

              {/* Bio */}
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

            {/* Statistics Section */}
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
              
              {/* Days Watched Progress Bar by Status */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-200 font-medium">Days Watched by Status</span>
                  <span className="text-white font-bold">{stats.totalDays} days</span>
                </div>
                
                {(() => {
                  // Calculate days for each status
                  const statusDays = {
                    completed: animeList.filter(a => a.status === "completed").reduce((sum, anime) => sum + (anime.episodesWatched * 24), 0) / 60 / 24,
                    watching: animeList.filter(a => a.status === "watching").reduce((sum, anime) => sum + (anime.episodesWatched * 24), 0) / 60 / 24,
                    paused: animeList.filter(a => a.status === "paused").reduce((sum, anime) => sum + (anime.episodesWatched * 24), 0) / 60 / 24,
                    dropped: animeList.filter(a => a.status === "dropped").reduce((sum, anime) => sum + (anime.episodesWatched * 24), 0) / 60 / 24,
                    planning: animeList.filter(a => a.status === "planning").reduce((sum, anime) => sum + (anime.episodesWatched * 24), 0) / 60 / 24
                  };
                  
                  const totalDays = Math.max(stats.totalDays, 0.1); // Avoid division by zero
                  
                  const percentages = {
                    completed: (statusDays.completed / totalDays) * 100,
                    watching: (statusDays.watching / totalDays) * 100,
                    paused: (statusDays.paused / totalDays) * 100,
                    dropped: (statusDays.dropped / totalDays) * 100,
                    planning: (statusDays.planning / totalDays) * 100
                  };

                  return (
                    <>
                      <div className="w-full bg-gray-700/40 rounded-full h-4 overflow-hidden flex">
                        {percentages.completed > 0 && (
                          <div 
                            className="bg-green-500 h-full transition-all duration-500"
                            style={{ width: `${percentages.completed}%` }}
                            title={`Completed: ${Math.round(statusDays.completed * 10) / 10} days`}
                          ></div>
                        )}
                        {percentages.watching > 0 && (
                          <div 
                            className="bg-blue-500 h-full transition-all duration-500"
                            style={{ width: `${percentages.watching}%` }}
                            title={`Watching: ${Math.round(statusDays.watching * 10) / 10} days`}
                          ></div>
                        )}
                        {percentages.paused > 0 && (
                          <div 
                            className="bg-yellow-500 h-full transition-all duration-500"
                            style={{ width: `${percentages.paused}%` }}
                            title={`On Hold: ${Math.round(statusDays.paused * 10) / 10} days`}
                          ></div>
                        )}
                        {percentages.dropped > 0 && (
                          <div 
                            className="bg-red-500 h-full transition-all duration-500"
                            style={{ width: `${percentages.dropped}%` }}
                            title={`Dropped: ${Math.round(statusDays.dropped * 10) / 10} days`}
                          ></div>
                        )}
                        {percentages.planning > 0 && (
                          <div 
                            className="bg-gray-500 h-full transition-all duration-500"
                            style={{ width: `${percentages.planning}%` }}
                            title={`Planning: ${Math.round(statusDays.planning * 10) / 10} days`}
                          ></div>
                        )}
                      </div>
                      
                      {/* Legend */}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-2">
                        {statusDays.completed > 0 && (
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                            <span>Completed ({Math.round(statusDays.completed * 10) / 10}d)</span>
                          </div>
                        )}
                        {statusDays.watching > 0 && (
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                            <span>Watching ({Math.round(statusDays.watching * 10) / 10}d)</span>
                          </div>
                        )}
                        {statusDays.paused > 0 && (
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                            <span>On Hold ({Math.round(statusDays.paused * 10) / 10}d)</span>
                          </div>
                        )}
                        {statusDays.dropped > 0 && (
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                            <span>Dropped ({Math.round(statusDays.dropped * 10) / 10}d)</span>
                          </div>
                        )}
                        {statusDays.planning > 0 && (
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-gray-500 rounded-sm"></div>
                            <span>Planning ({Math.round(statusDays.planning * 10) / 10}d)</span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Quick Stats */}
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

              {/* Status Breakdown - Simplified */}
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


            {/* Favorites Section */}
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
                {/* Favorite Anime */}
                <div>
                  <h3 className="font-medium text-gray-200 mb-3 flex items-center justify-between">
                    <span>Favorite Anime</span>
                    <span className="text-xs text-gray-500">({favorites.filter(f => f.type === "anime").length}/5)</span>
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {favorites.filter(f => f.type === "anime").length > 0 ? (
                      favorites.filter(f => f.type === "anime").map((fav) => (
                        <div key={fav.id} className="group flex items-center space-x-2 bg-gray-900/30 hover:bg-gray-900/50 rounded-lg p-2 border border-gray-700/20 transition-colors cursor-pointer">
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
                      ))
                    ) : (
                      <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/20 text-center">
                        <div className="text-gray-400 text-sm">No favorites added yet</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Favorite Characters */}
                <div>
                  <h3 className="font-medium text-gray-200 mb-3 flex items-center justify-between">
                    <span>Favorite Characters</span>
                    <span className="text-xs text-gray-500">({favorites.filter(f => f.type === "character").length}/5)</span>
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {favorites.filter(f => f.type === "character").length > 0 ? (
                      favorites.filter(f => f.type === "character").map((fav) => (
                        <div key={fav.id} className="group flex items-center space-x-2 bg-gray-900/30 hover:bg-gray-900/50 rounded-lg p-2 border border-gray-700/20 transition-colors cursor-pointer">
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
                      ))
                    ) : (
                      <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/20 text-center">
                        <div className="text-gray-400 text-sm">No favorites added yet</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Favorite People */}
                <div>
                  <h3 className="font-medium text-gray-200 mb-3 flex items-center justify-between">
                    <span>Favorite People</span>
                    <span className="text-xs text-gray-500">({favorites.filter(f => f.type === "person").length}/5)</span>
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {favorites.filter(f => f.type === "person").length > 0 ? (
                      favorites.filter(f => f.type === "person").map((fav) => (
                        <div key={fav.id} className="group flex items-center space-x-2 bg-gray-900/30 hover:bg-gray-900/50 rounded-lg p-2 border border-gray-700/20 transition-colors cursor-pointer">
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

            {/* Recent Activity */}
            <div id="recent-activity" className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
              <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700/40 pb-2">Recent Activity</h2>
              <div className="space-y-3">
                {animeList.slice(0, 3).map((anime) => (
                  <div key={anime.id} className="flex items-center space-x-3 p-3 bg-gray-900/30 rounded-lg">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-300 flex-1 text-sm">
                      <span className="text-white font-medium">
                        {anime.status === 'completed' ? 'Completed' : 
                         anime.status === 'watching' ? 'Currently watching' :
                         anime.status === 'planning' ? 'Added to Plan to Watch' :
                         'Updated'} 
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

      {/* Add Favorites Modal */}
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
              {/* Type Selection */}
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
                    disabled={favorites.filter(f => f.type === "anime").length >= 5}
                  >
                    <span>Anime</span>
                    <span className="ml-1 text-xs opacity-70">({favorites.filter(f => f.type === "anime").length}/5)</span>
                  </button>
                  <button
                    onClick={() => setFavoriteType("character")}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      favoriteType === "character" 
                        ? "bg-purple-600 text-white" 
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                    disabled={favorites.filter(f => f.type === "character").length >= 5}
                  >
                    <span>Characters</span>
                    <span className="ml-1 text-xs opacity-70">({favorites.filter(f => f.type === "character").length}/5)</span>
                  </button>
                  <button
                    onClick={() => setFavoriteType("person")}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      favoriteType === "person" 
                        ? "bg-purple-600 text-white" 
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                    disabled={favorites.filter(f => f.type === "person").length >= 5}
                  >
                    <span>People</span>
                    <span className="ml-1 text-xs opacity-70">({favorites.filter(f => f.type === "person").length}/5)</span>
                  </button>
                </div>
              </div>

              {/* Search - Only show for anime for now */}
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

                  {/* Search Results */}
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

              {/* Note for characters and people */}
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

      {/* Error Display */}
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