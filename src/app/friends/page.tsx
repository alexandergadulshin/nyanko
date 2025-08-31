"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { 
  FaUserFriends, 
  FaSearch, 
  FaUserPlus, 
  FaCheck, 
  FaTimes, 
  FaSpinner,
  FaTrash,
  FaHeart,
  FaEye
} from "react-icons/fa";

interface Friend {
  id: string;
  name: string;
  username?: string;
  image?: string;
  bio?: string;
  friendshipId: string;
  friendSince: string;
}

interface FriendRequest {
  id: string;
  fromUser?: {
    id: string;
    name: string;
    username?: string;
    image?: string;
  };
  toUser?: {
    id: string;
    name: string;
    username?: string;
    image?: string;
  };
  message?: string;
  createdAt: string;
}

interface SearchUser {
  id: string;
  name: string;
  username?: string;
  image?: string;
  bio?: string;
}

export default function FriendsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      router.push('/auth');
      return;
    }

    fetchFriendsData();
  }, [user, isLoaded, router]);

  const fetchFriendsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/friends');
      
      if (!response.ok) {
        throw new Error('Failed to fetch friends data');
      }
      
      const data = await response.json();
      setFriends(data.friends || []);
      setIncomingRequests(data.incomingRequests || []);
      setOutgoingRequests(data.outgoingRequests || []);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError('Failed to load friends data');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery.trim())}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      
      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users');
    } finally {
      setSearchLoading(false);
    }
  };

  const sendFriendRequest = async (toUserId: string, message?: string) => {
    setSendingRequest(toUserId);
    try {
      const response = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toUserId,
          message: message?.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send friend request');
      }

      setError(null);
      await fetchFriendsData(); // Refresh data
      
      // Remove user from search results since request was sent
      setSearchResults(prev => prev.filter(u => u.id !== toUserId));
    } catch (err) {
      console.error('Error sending friend request:', err);
      setError(err instanceof Error ? err.message : 'Failed to send friend request');
    } finally {
      setSendingRequest(null);
    }
  };

  const respondToFriendRequest = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      const response = await fetch('/api/friends/requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} friend request`);
      }

      setError(null);
      await fetchFriendsData(); // Refresh data
    } catch (err) {
      console.error(`Error ${action}ing friend request:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${action} friend request`);
    }
  };

  const cancelFriendRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/requests?requestId=${requestId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel friend request');
      }

      setError(null);
      await fetchFriendsData(); // Refresh data
    } catch (err) {
      console.error('Error cancelling friend request:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel friend request');
    }
  };

  const removeFriend = async (friendshipId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;

    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove friend');
      }

      setError(null);
      await fetchFriendsData(); // Refresh data
    } catch (err) {
      console.error('Error removing friend:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove friend');
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Please sign in to view friends</p>
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
              Friends
            </span>
          </h1>
          <div className="mt-4 w-[calc(100%-2rem)] max-w-6xl h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-gradient-to-br from-[#6d28d9]/40 to-[#3d2954]/60 backdrop-blur-md border border-purple-300/20 rounded-xl p-4 sticky top-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('friends')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                    activeTab === 'friends'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-purple-500/30'
                  }`}
                >
                  <FaUserFriends className="w-5 h-5" />
                  <span className="font-medium">My Friends</span>
                  <span className="ml-auto text-xs bg-purple-500/30 px-2 py-1 rounded-full">
                    {friends.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('requests')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                    activeTab === 'requests'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-purple-500/30'
                  }`}
                >
                  <FaHeart className="w-5 h-5" />
                  <span className="font-medium">Requests</span>
                  {incomingRequests.length > 0 && (
                    <span className="ml-auto text-xs bg-red-500 px-2 py-1 rounded-full">
                      {incomingRequests.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('search')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                    activeTab === 'search'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-purple-500/30'
                  }`}
                >
                  <FaSearch className="w-5 h-5" />
                  <span className="font-medium">Find Friends</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-gradient-to-br from-[#6d28d9]/40 to-[#3d2954]/60 backdrop-blur-md border border-purple-300/20 rounded-xl p-6">
              
              {/* Friends Tab */}
              {activeTab === 'friends' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">My Friends ({friends.length})</h2>
                  </div>

                  {friends.length === 0 ? (
                    <div className="text-center py-12">
                      <FaUserFriends className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg mb-2">No friends yet</p>
                      <p className="text-gray-500 text-sm mb-4">Start by searching for users to add as friends</p>
                      <button
                        onClick={() => setActiveTab('search')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        Find Friends
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {friends.map((friend) => (
                        <div 
                          key={friend.id} 
                          className="bg-gray-800/40 hover:bg-gray-800/60 rounded-lg p-4 border border-gray-700/30 hover:border-purple-400/30 transition-all cursor-pointer relative group"
                          onClick={() => router.push(`/profile/${friend.id}`)}
                          title={`View ${friend.name}'s profile`}
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="flex-shrink-0">
                              {friend.image ? (
                                <img
                                  src={friend.image}
                                  alt={friend.name}
                                  className="w-12 h-12 rounded-full object-cover group-hover:ring-2 group-hover:ring-purple-400 transition-all"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-600 group-hover:bg-gray-500 flex items-center justify-center group-hover:ring-2 group-hover:ring-purple-400 transition-all">
                                  <FaUserFriends className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-medium truncate">{friend.name}</h3>
                              {friend.username && (
                                <p className="text-gray-400 text-sm">@{friend.username}</p>
                              )}
                            </div>
                          </div>

                          {friend.bio && (
                            <p className="text-gray-300 text-sm mb-3 line-clamp-2">{friend.bio}</p>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-xs">
                              Friends since {new Date(friend.friendSince).toLocaleDateString()}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFriend(friend.friendshipId);
                              }}
                              className="text-gray-400 hover:text-red-400 p-1 transition-colors z-10 relative"
                              title="Remove Friend"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Requests Tab */}
              {activeTab === 'requests' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Friend Requests</h2>

                  {/* Incoming Requests */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Incoming Requests ({incomingRequests.length})
                    </h3>
                    
                    {incomingRequests.length === 0 ? (
                      <div className="text-center py-8 bg-gray-800/20 rounded-lg">
                        <p className="text-gray-400">No incoming friend requests</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {incomingRequests.map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-4 bg-gray-800/40 rounded-lg border border-gray-700/30">
                            <div className="flex items-center space-x-3">
                              {request.fromUser?.image ? (
                                <img
                                  src={request.fromUser.image}
                                  alt={request.fromUser.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                                  <FaUserFriends className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="text-white font-medium">{request.fromUser?.name}</p>
                                {request.fromUser?.username && (
                                  <p className="text-gray-400 text-sm">@{request.fromUser.username}</p>
                                )}
                                {request.message && (
                                  <p className="text-gray-300 text-sm mt-1">"{request.message}"</p>
                                )}
                                <p className="text-gray-500 text-xs mt-1">
                                  {new Date(request.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => respondToFriendRequest(request.id, 'accept')}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1"
                              >
                                <FaCheck className="w-3 h-3" />
                                <span>Accept</span>
                              </button>
                              <button
                                onClick={() => respondToFriendRequest(request.id, 'decline')}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1"
                              >
                                <FaTimes className="w-3 h-3" />
                                <span>Decline</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Outgoing Requests */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Sent Requests ({outgoingRequests.length})
                    </h3>
                    
                    {outgoingRequests.length === 0 ? (
                      <div className="text-center py-8 bg-gray-800/20 rounded-lg">
                        <p className="text-gray-400">No outgoing friend requests</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {outgoingRequests.map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-4 bg-gray-800/40 rounded-lg border border-gray-700/30">
                            <div className="flex items-center space-x-3">
                              {request.toUser?.image ? (
                                <img
                                  src={request.toUser.image}
                                  alt={request.toUser.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                                  <FaUserFriends className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="text-white font-medium">{request.toUser?.name}</p>
                                {request.toUser?.username && (
                                  <p className="text-gray-400 text-sm">@{request.toUser.username}</p>
                                )}
                                {request.message && (
                                  <p className="text-gray-300 text-sm mt-1">"{request.message}"</p>
                                )}
                                <p className="text-gray-500 text-xs mt-1">
                                  Sent {new Date(request.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => cancelFriendRequest(request.id)}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1"
                            >
                              <FaTimes className="w-3 h-3" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Search Tab */}
              {activeTab === 'search' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Find Friends</h2>

                  {/* Search Bar */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or username..."
                      className="flex-1 px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                      onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                    />
                    <button
                      onClick={searchUsers}
                      disabled={searchLoading || !searchQuery.trim() || searchQuery.trim().length < 2}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      {searchLoading ? (
                        <FaSpinner className="w-4 h-4 animate-spin" />
                      ) : (
                        <FaSearch className="w-4 h-4" />
                      )}
                      <span>Search</span>
                    </button>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-white">Search Results</h3>
                      {searchResults.map((searchUser) => (
                        <div 
                          key={searchUser.id} 
                          className="flex items-center justify-between p-4 bg-gray-800/40 hover:bg-gray-800/60 rounded-lg border border-gray-700/30 hover:border-purple-400/30 transition-all cursor-pointer relative group"
                          onClick={() => router.push(`/profile/${searchUser.id}`)}
                          title={`View ${searchUser.name}'s profile`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {searchUser.image ? (
                                <img
                                  src={searchUser.image}
                                  alt={searchUser.name}
                                  className="w-10 h-10 rounded-full object-cover group-hover:ring-2 group-hover:ring-purple-400 transition-all"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-600 group-hover:bg-gray-500 flex items-center justify-center group-hover:ring-2 group-hover:ring-purple-400 transition-all">
                                  <FaUserFriends className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium">{searchUser.name}</p>
                              {searchUser.username && (
                                <p className="text-gray-400 text-sm">@{searchUser.username}</p>
                              )}
                              {searchUser.bio && (
                                <p className="text-gray-300 text-sm mt-1 line-clamp-1">{searchUser.bio}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sendFriendRequest(searchUser.id);
                            }}
                            disabled={sendingRequest === searchUser.id}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1 z-10 relative"
                          >
                            {sendingRequest === searchUser.id ? (
                              <FaSpinner className="w-3 h-3 animate-spin" />
                            ) : (
                              <FaUserPlus className="w-3 h-3" />
                            )}
                            <span>Add Friend</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.length === 0 && searchQuery.trim() && !searchLoading && (
                    <div className="text-center py-8 bg-gray-800/20 rounded-lg">
                      <p className="text-gray-400">No users found matching your search</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg z-50 max-w-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-200 hover:text-white float-right"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}