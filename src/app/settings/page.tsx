"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";
import { useTheme } from "~/hooks/use-theme";
import { 
  FaUser, 
  FaBell, 
  FaEye, 
  FaShieldAlt, 
  FaSave, 
  FaEdit, 
  FaTrash,
  FaGlobe,
  FaPalette,
  FaUpload,
  FaCamera,
  FaCheck,
  FaTimes,
  FaSpinner
} from "react-icons/fa";

interface UserSettings {
  displayName: string;
  username: string;
  bio: string;
  profileImage: string;
  email: string;
  notifications: {
    email: boolean;
    newEpisodes: boolean;
    recommendations: boolean;
    listUpdates: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showWatchList: boolean;
    showFavorites: boolean;
    showStats: boolean;
  };
  preferences: {
    language: string;
    theme: 'dark' | 'light' | 'auto';
    defaultListStatus: 'planning' | 'watching' | 'completed' | 'dropped' | 'paused';
    autoMarkCompleted: boolean;
    spoilerWarnings: boolean;
  };
}

export default function SettingsPage() {
  const { data: session, error } = useSession();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'preferences' | 'account'>('profile');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [settings, setSettings] = useState<UserSettings>({
    displayName: '',
    username: '',
    bio: '',
    profileImage: '',
    email: '',
    notifications: {
      email: true,
      newEpisodes: true,
      recommendations: false,
      listUpdates: true,
    },
    privacy: {
      profileVisibility: 'public',
      showWatchList: true,
      showFavorites: true,
      showStats: true,
    },
    preferences: {
      language: 'en',
      theme: theme,
      defaultListStatus: 'planning',
      autoMarkCompleted: false,
      spoilerWarnings: true,
    },
  });

  useEffect(() => {
    if (error || !session) {
      router.push('/auth');
      return;
    }

    // Load user settings from API
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(prev => ({
            ...prev,
            displayName: data.user.name || '',
            username: data.user.username || '',
            bio: data.user.bio || '',
            email: data.user.email || '',
            profileImage: data.user.image || '',
          }));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };

    loadSettings();
  }, [session, error, router]);

  const handleSave = async () => {
    setLoading(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: settings.displayName,
          username: settings.username,
          bio: settings.bio,
          image: settings.profileImage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Failed to save settings. Please try again.');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username.trim()) {
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    try {
      const response = await fetch('/api/settings/username-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await response.json();
      setUsernameAvailable(data.available);
    } catch (err) {
      console.error('Failed to check username:', err);
      setUsernameAvailable(null);
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/profile-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setSettings(prev => ({ ...prev, profileImage: data.imageUrl }));
      setSaveMessage('Profile image uploaded successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Failed to upload image');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };


  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      setSaveMessage('Please type "DELETE MY ACCOUNT" to confirm');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    try {
      const response = await fetch('/api/settings/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmDelete: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      router.push('/auth?message=Account deleted successfully');
    } catch (err) {
      setSaveMessage('Failed to delete account');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleInputChange = (section: keyof UserSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    // Update the settings state
    handleInputChange('preferences', 'theme', newTheme);
    
    // Actually change the theme via context
    if (newTheme !== theme) {
      toggleTheme();
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: <FaUser /> },
    { id: 'notifications' as const, label: 'Notifications', icon: <FaBell /> },
    { id: 'privacy' as const, label: 'Privacy', icon: <FaEye /> },
    { id: 'preferences' as const, label: 'Preferences', icon: <FaPalette /> },
    { id: 'account' as const, label: 'Account', icon: <FaShieldAlt /> },
  ];

  if (!session) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
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
              Settings
            </span>
          </h1>
          <div className="mt-4 w-[calc(100%-2rem)] max-w-6xl h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-gradient-to-br from-[#6d28d9]/40 to-[#3d2954]/60 backdrop-blur-md border border-purple-300/20 rounded-xl p-4 sticky top-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                      activeTab === tab.id
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-purple-500/30'
                    }`}
                  >
                    <span className="w-5 h-5">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-gradient-to-br from-[#6d28d9]/40 to-[#3d2954]/60 backdrop-blur-md border border-purple-300/20 rounded-xl p-6">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>
                  
                  {/* Profile Image */}
                  <div className="flex items-center space-x-6">
                    <div className="relative group">
                      <div 
                        className="relative cursor-pointer"
                        onClick={handleImageClick}
                      >
                        {settings.profileImage ? (
                          <img
                            src={settings.profileImage}
                            alt="Profile"
                            className="w-36 h-36 rounded-full object-cover border-2 border-purple-500/30 shadow-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling.style.display = 'block';
                            }}
                          />
                        ) : (
                          <div className="w-36 h-36 rounded-full border-2 border-purple-500/30 bg-gray-700 shadow-lg"></div>
                        )}
                        {settings.profileImage && (
                          <div className="w-36 h-36 rounded-full border-2 border-purple-500/30 bg-gray-700 shadow-lg hidden"></div>
                        )}
                        
                        {/* Camera overlay */}
                        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <div className="text-center">
                            {imageUploading ? (
                              <FaSpinner className="w-5 h-5 text-white mx-auto mb-1 animate-spin" />
                            ) : (
                              <FaCamera className="w-5 h-5 text-white mx-auto mb-1" />
                            )}
                            <span className="text-white text-xs">
                              {imageUploading ? 'Uploading...' : 'Change'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-2">Profile Picture</h3>
                      <p className="text-gray-400 text-sm mb-3">Upload a new profile picture</p>
                      <button 
                        onClick={handleImageClick}
                        disabled={imageUploading}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        {imageUploading ? (
                          <>
                            <FaSpinner className="inline mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <FaUpload className="inline mr-2" />
                            Upload Image
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={imageUploading}
                    />
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={settings.displayName}
                        onChange={(e) => handleInputChange('displayName' as keyof UserSettings, '', e.target.value)}
                        className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Username
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={settings.username}
                          onChange={(e) => {
                            handleInputChange('username' as keyof UserSettings, '', e.target.value);
                            if (e.target.value !== settings.username) {
                              setTimeout(() => checkUsernameAvailability(e.target.value), 500);
                            }
                          }}
                          className="w-full px-4 py-3 pr-10 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                          placeholder="Choose a unique username"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          {usernameChecking ? (
                            <FaSpinner className="w-4 h-4 text-gray-400 animate-spin" />
                          ) : usernameAvailable === true ? (
                            <FaCheck className="w-4 h-4 text-green-400" />
                          ) : usernameAvailable === false ? (
                            <FaTimes className="w-4 h-4 text-red-400" />
                          ) : null}
                        </div>
                      </div>
                      {usernameAvailable === false && (
                        <p className="text-red-400 text-xs mt-1">Username is already taken</p>
                      )}
                      {usernameAvailable === true && (
                        <p className="text-green-400 text-xs mt-1">Username is available</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={settings.bio}
                      onChange={(e) => handleInputChange('bio' as keyof UserSettings, '', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Notification Settings</h2>
                  
                  <div className="space-y-4">
                    {Object.entries(settings.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-[#6d28d9]/20 rounded-lg">
                        <div>
                          <h3 className="text-white font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {key === 'email' && 'Receive email notifications'}
                            {key === 'newEpisodes' && 'Get notified when new episodes are released'}
                            {key === 'recommendations' && 'Receive personalized anime recommendations'}
                            {key === 'listUpdates' && 'Get notified about your list updates'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => handleInputChange('notifications', key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Privacy Settings</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Profile Visibility
                    </label>
                    <select
                      value={settings.privacy.profileVisibility}
                      onChange={(e) => handleInputChange('privacy', 'profileVisibility', e.target.value)}
                      className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="public">Public - Anyone can see your profile</option>
                      <option value="friends">Friends Only - Only friends can see your profile</option>
                      <option value="private">Private - Only you can see your profile</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(settings.privacy).filter(([key]) => key !== 'profileVisibility').map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-[#6d28d9]/20 rounded-lg">
                        <div>
                          <h3 className="text-white font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {key === 'showWatchList' && 'Allow others to see your anime watch list'}
                            {key === 'showFavorites' && 'Allow others to see your favorite anime'}
                            {key === 'showStats' && 'Allow others to see your viewing statistics'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value as boolean}
                            onChange={(e) => handleInputChange('privacy', key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Preferences</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Language
                      </label>
                      <select
                        value={settings.preferences.language}
                        onChange={(e) => handleInputChange('preferences', 'language', e.target.value)}
                        className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        <option value="en">English</option>
                        <option value="ja">Japanese</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Theme
                      </label>
                      <select
                        value={theme}
                        onChange={(e) => handleThemeChange(e.target.value as 'dark' | 'light')}
                        className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Default List Status
                      </label>
                      <select
                        value={settings.preferences.defaultListStatus}
                        onChange={(e) => handleInputChange('preferences', 'defaultListStatus', e.target.value)}
                        className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        <option value="planning">Planning to Watch</option>
                        <option value="watching">Currently Watching</option>
                        <option value="completed">Completed</option>
                        <option value="dropped">Dropped</option>
                        <option value="paused">Paused</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#6d28d9]/20 rounded-lg">
                      <div>
                        <h3 className="text-white font-medium">Auto-mark as Completed</h3>
                        <p className="text-gray-400 text-sm">Automatically mark anime as completed when you finish watching</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.preferences.autoMarkCompleted}
                          onChange={(e) => handleInputChange('preferences', 'autoMarkCompleted', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#6d28d9]/20 rounded-lg">
                      <div>
                        <h3 className="text-white font-medium">Spoiler Warnings</h3>
                        <p className="text-gray-400 text-sm">Show warnings before displaying potential spoilers</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.preferences.spoilerWarnings}
                          onChange={(e) => handleInputChange('preferences', 'spoilerWarnings', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => handleInputChange('email' as keyof UserSettings, '', e.target.value)}
                        className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                      />
                    </div>


                    <div className="border-t border-purple-300/20 pt-6">
                      <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <h4 className="text-red-400 font-medium mb-2">Delete Account</h4>
                        <p className="text-gray-400 text-sm mb-4">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        {!showDeleteConfirm ? (
                          <button 
                            onClick={() => setShowDeleteConfirm(true)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            <FaTrash className="inline mr-2" />
                            Delete Account
                          </button>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <p className="text-red-400 text-sm mb-2 font-medium">
                                Type "DELETE MY ACCOUNT" to confirm:
                              </p>
                              <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-900/40 border border-red-500/40 rounded text-white placeholder-red-200/60 focus:outline-none focus:ring-1 focus:ring-red-500"
                                placeholder="DELETE MY ACCOUNT"
                              />
                            </div>
                            <div className="flex space-x-3">
                              <button 
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'DELETE MY ACCOUNT'}
                                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                              >
                                <FaTrash className="inline mr-2" />
                                Confirm Delete
                              </button>
                              <button 
                                onClick={() => {
                                  setShowDeleteConfirm(false);
                                  setDeleteConfirmText('');
                                }}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-purple-300/20">
                <div>
                  {saveMessage && (
                    <p className={`text-sm ${saveMessage.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                      {saveMessage}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FaSave />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}