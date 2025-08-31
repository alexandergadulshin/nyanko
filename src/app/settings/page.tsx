"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTheme } from "~/hooks/use-theme";
import { UploadButton } from "~/lib/uploadthing";
import { 
  FaUser, 
  FaEye, 
  FaShieldAlt, 
  FaSave, 
  FaTrash,
  FaPalette,
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
  allowFriendRequests: boolean;
  lastNameChange?: string;
  lastUsernameChange?: string;
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showWatchList: boolean;
    showFavorites: boolean;
    showStats: boolean;
  };
  preferences: {
    language: string;
    theme: 'dark' | 'light' | 'auto';
    autoMarkCompleted: boolean;
    spoilerWarnings: boolean;
  };
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'preferences' | 'account'>('profile');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [originalSettings, setOriginalSettings] = useState<{name: string, username: string}>({name: '', username: ''});

  // Helper functions for rate limiting
  const canChangeName = () => {
    if (!settings.lastNameChange) return true;
    const lastChange = new Date(settings.lastNameChange);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return lastChange <= oneDayAgo;
  };

  const canChangeUsername = () => {
    if (!settings.lastUsernameChange) return true;
    const lastChange = new Date(settings.lastUsernameChange);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return lastChange <= sevenDaysAgo;
  };

  const getNextNameChangeDate = () => {
    if (!settings.lastNameChange) return null;
    const lastChange = new Date(settings.lastNameChange);
    return new Date(lastChange.getTime() + 24 * 60 * 60 * 1000);
  };

  const getNextUsernameChangeDate = () => {
    if (!settings.lastUsernameChange) return null;
    const lastChange = new Date(settings.lastUsernameChange);
    return new Date(lastChange.getTime() + 7 * 24 * 60 * 60 * 1000);
  };
  const [settings, setSettings] = useState<UserSettings>({
    displayName: '',
    username: '',
    bio: '',
    profileImage: '',
    email: '',
    allowFriendRequests: true,
    privacy: {
      profileVisibility: 'public',
      showWatchList: true,
      showFavorites: true,
      showStats: true,
    },
    preferences: {
      language: 'en',
      theme: theme,
      autoMarkCompleted: false,
      spoilerWarnings: true,
    },
  });

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
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
            email: data.user.email || user.emailAddresses[0]?.emailAddress || '',
            profileImage: data.user.image || user.imageUrl || '',
            allowFriendRequests: data.user.allowFriendRequests !== undefined ? data.user.allowFriendRequests : true,
            lastNameChange: data.user.lastNameChange,
            lastUsernameChange: data.user.lastUsernameChange,
            privacy: {
              ...prev.privacy,
              profileVisibility: data.user.profileVisibility || 'public',
              showWatchList: data.user.showWatchList !== undefined ? data.user.showWatchList : true,
              showFavorites: data.user.showFavorites !== undefined ? data.user.showFavorites : true,
              showStats: data.user.showStats !== undefined ? data.user.showStats : true,
            },
          }));
          
          // Store original values for comparison
          setOriginalSettings({
            name: data.user.name || '',
            username: data.user.username || '',
          });
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        // Fallback to Clerk data
        setSettings(prev => ({
          ...prev,
          displayName: user.fullName || '',
          email: user.emailAddresses[0]?.emailAddress || '',
          profileImage: user.imageUrl || '',
        }));
      }
    };

    loadSettings();
  }, [user, isLoaded, router]);

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
          profileVisibility: settings.privacy.profileVisibility,
          showWatchList: settings.privacy.showWatchList,
          showFavorites: settings.privacy.showFavorites,
          showStats: settings.privacy.showStats,
          allowFriendRequests: settings.allowFriendRequests,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      // Immediately update rate limiting timestamps if changes were made
      const now = new Date().toISOString();
      const nameChanged = settings.displayName !== originalSettings.name;
      const usernameChanged = settings.username !== originalSettings.username;

      if (nameChanged || usernameChanged) {
        setSettings(prev => ({
          ...prev,
          lastNameChange: nameChanged ? now : prev.lastNameChange,
          lastUsernameChange: usernameChanged ? now : prev.lastUsernameChange,
        }));
        
        // Update original settings for future comparisons
        setOriginalSettings({
          name: settings.displayName,
          username: settings.username,
        });
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

  const handleImageUploadComplete = async (res: any) => {
    if (res && res[0] && res[0].url) {
      setSettings(prev => ({ ...prev, profileImage: res[0].url }));
      
      // Automatically save the uploaded image to database
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
            image: res[0].url,
            profileVisibility: settings.privacy.profileVisibility,
            showWatchList: settings.privacy.showWatchList,
            showFavorites: settings.privacy.showFavorites,
            showStats: settings.privacy.showStats,
            allowFriendRequests: settings.allowFriendRequests,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save profile image');
        }

        setSaveMessage('Profile image uploaded and saved successfully!');
        setTimeout(() => setSaveMessage(null), 3000);
      } catch (err) {
        setSaveMessage('Image uploaded but failed to save to profile. Please click Save Changes.');
        setTimeout(() => setSaveMessage(null), 5000);
      }
    }
  };

  const handleImageUploadError = (error: Error) => {
    setSaveMessage(`Upload failed: ${error.message}`);
    setTimeout(() => setSaveMessage(null), 3000);
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
    { id: 'privacy' as const, label: 'Privacy', icon: <FaEye /> },
    { id: 'preferences' as const, label: 'Preferences', icon: <FaPalette /> },
    { id: 'account' as const, label: 'Account', icon: <FaShieldAlt /> },
  ];

  if (!isLoaded || !user) {
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
                    <div className="relative">
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
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-2">Profile Picture</h3>
                      <p className="text-gray-400 text-sm mb-3">Upload a new profile picture (max 4MB)</p>
                      <UploadButton
                        endpoint="profileImage"
                        onClientUploadComplete={handleImageUploadComplete}
                        onUploadError={handleImageUploadError}
                        appearance={{
                          button: "bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors ut-ready:bg-purple-600 ut-uploading:cursor-not-allowed ut-uploading:bg-purple-700",
                          allowedContent: "text-gray-400 text-xs",
                          container: "w-max flex-col items-center"
                        }}
                      />
                    </div>
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
                        onChange={(e) => setSettings(prev => ({ ...prev, displayName: e.target.value }))}
                        disabled={!canChangeName()}
                        className={`w-full px-4 py-3 border rounded-lg text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 ${
                          canChangeName() 
                            ? 'bg-[#6d28d9]/30 border-purple-300/40' 
                            : 'bg-gray-600/30 border-gray-500/40 cursor-not-allowed opacity-60'
                        }`}
                      />
                      {!canChangeName() && (
                        <p className="text-orange-400 text-xs mt-1">
                          You can change your display name again on {getNextNameChangeDate()?.toLocaleDateString()}
                        </p>
                      )}
                      {canChangeName() && (
                        <p className="text-gray-400 text-xs mt-1">
                          You can change your display name once per day
                        </p>
                      )}
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
                            setSettings(prev => ({ ...prev, username: e.target.value }));
                            if (e.target.value !== settings.username) {
                              setTimeout(() => checkUsernameAvailability(e.target.value), 500);
                            }
                          }}
                          disabled={!canChangeUsername()}
                          className={`w-full px-4 py-3 pr-10 border rounded-lg text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 ${
                            canChangeUsername() 
                              ? 'bg-[#6d28d9]/30 border-purple-300/40' 
                              : 'bg-gray-600/30 border-gray-500/40 cursor-not-allowed opacity-60'
                          }`}
                          placeholder="Choose a unique username"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          {canChangeUsername() && usernameChecking ? (
                            <FaSpinner className="w-4 h-4 text-gray-400 animate-spin" />
                          ) : canChangeUsername() && usernameAvailable === true ? (
                            <FaCheck className="w-4 h-4 text-green-400" />
                          ) : canChangeUsername() && usernameAvailable === false ? (
                            <FaTimes className="w-4 h-4 text-red-400" />
                          ) : null}
                        </div>
                      </div>
                      {!canChangeUsername() && (
                        <p className="text-orange-400 text-xs mt-1">
                          You can change your username again on {getNextUsernameChangeDate()?.toLocaleDateString()}
                        </p>
                      )}
                      {canChangeUsername() && usernameAvailable === false && (
                        <p className="text-red-400 text-xs mt-1">Username is already taken</p>
                      )}
                      {canChangeUsername() && usernameAvailable === true && (
                        <p className="text-green-400 text-xs mt-1">Username is available</p>
                      )}
                      {canChangeUsername() && !usernameAvailable && (
                        <p className="text-gray-400 text-xs mt-1">
                          You can change your username once every 7 days
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={settings.bio}
                      onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white mb-6">Privacy Settings</h2>
                    {saveMessage && (
                      <div className={`text-sm px-3 py-1 rounded-full ${saveMessage.includes('success') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {saveMessage}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Profile Visibility
                    </label>
                    <select
                      value={settings.privacy.profileVisibility}
                      onChange={(e) => handleInputChange('privacy', 'profileVisibility', e.target.value)}
                      className="w-full px-4 py-3 bg-[#6d28d9]/30 border border-purple-300/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                      style={{ 
                        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23a855f7' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 12px center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '16px',
                        appearance: 'none'
                      }}
                    >
                      <option value="public" className="bg-gray-800 text-white">Public - Anyone can see your profile</option>
                      <option value="friends" className="bg-gray-800 text-white">Friends Only - Only friends can see your profile</option>
                      <option value="private" className="bg-gray-800 text-white">Private - Only you can see your profile</option>
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
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 peer-checked:bg-purple-600 hover:bg-gray-500"></div>
                        </label>
                      </div>
                    ))}
                    
                    {/* Friend Requests Setting */}
                    <div className="flex items-center justify-between p-4 bg-[#6d28d9]/20 rounded-lg">
                      <div>
                        <h3 className="text-white font-medium">Allow Friend Requests</h3>
                        <p className="text-gray-400 text-sm">Allow other users to send you friend requests</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.allowFriendRequests}
                          onChange={(e) => setSettings(prev => ({ ...prev, allowFriendRequests: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 peer-checked:bg-purple-600 hover:bg-gray-500"></div>
                      </label>
                    </div>
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
                        onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
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