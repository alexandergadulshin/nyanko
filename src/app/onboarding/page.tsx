"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/auth");
      return;
    }

    if (isLoaded && user) {
      fetch(`/api/profile/${user.id}`)
        .then(response => response.json())
        .then(data => {
          if (data.profile?.username && data.profile?.name) {
            router.push("/profile");
          }
        })
        .catch(() => {
        });
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    const checkUsername = async () => {
      if (username.length < 3) {
        setUsernameAvailable(null);
        return;
      }

      setCheckingUsername(true);
      try {
        const response = await fetch(`/api/settings/username-check?username=${encodeURIComponent(username)}`);
        const data = await response.json();
        setUsernameAvailable(data.available);
      } catch (error) {
        console.error("Error checking username:", error);
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }
    
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (usernameAvailable === false) {
      setError("Username is not available");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: displayName.trim(),
          username: username.trim(),
          image: profileImage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create profile");
      }

      router.push("/profile");
    } catch (error) {
      console.error("Error creating profile:", error);
      setError(error instanceof Error ? error.message : "Failed to create profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be less than 5MB");
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a JPEG, PNG, or WebP image");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Failed to process image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <div className="text-white light:text-gray-900">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181622] light:bg-transparent py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white light:text-gray-900">
            Welcome to AnimeWeb! 🎉
          </h1>
          <p className="mt-2 text-gray-300 light:text-gray-600">
            Let's set up your profile to get started
          </p>
        </div>

        <div className="bg-white/10 light:bg-white backdrop-blur-md border border-white/20 light:border-gray-200 p-8 shadow-xl light:shadow-lg rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-purple-100 light:text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How should others see your name?"
                className="w-full px-3 py-2 border border-white/30 light:border-gray-200 bg-white/10 light:bg-white text-white light:text-gray-900 rounded-lg focus:border-purple-400 light:focus:border-purple-500 focus:outline-none focus:ring-0 transition-all duration-200 backdrop-blur-sm placeholder:text-purple-200 light:placeholder:text-gray-500"
                required
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-purple-100 light:text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="Choose a unique username"
                className="w-full px-3 py-2 border border-white/30 light:border-gray-200 bg-white/10 light:bg-white text-white light:text-gray-900 rounded-lg focus:border-purple-400 light:focus:border-purple-500 focus:outline-none focus:ring-0 transition-all duration-200 backdrop-blur-sm placeholder:text-purple-200 light:placeholder:text-gray-500"
                required
              />
              
              {username.length > 0 && (
                <div className="mt-2 text-sm">
                  {username.length < 3 ? (
                    <span className="text-yellow-400 light:text-yellow-600">
                      Username must be at least 3 characters
                    </span>
                  ) : checkingUsername ? (
                    <span className="text-purple-300 light:text-purple-600">
                      Checking availability...
                    </span>
                  ) : usernameAvailable === true ? (
                    <span className="text-green-400 light:text-green-600">
                      ✓ Username is available
                    </span>
                  ) : usernameAvailable === false ? (
                    <span className="text-red-400 light:text-red-600">
                      ✗ Username is not available
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-100 light:text-gray-700 mb-2">
                Profile Picture (Optional)
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative w-20 h-20 rounded-full border-2 border-white/30 light:border-gray-200 bg-white/10 light:bg-gray-100 overflow-hidden group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-purple-300 light:text-gray-500">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-2 text-sm bg-white/20 light:bg-gray-100 text-purple-100 light:text-gray-700 rounded-lg hover:bg-white/30 light:hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
                    >
                      {uploading ? "Uploading..." : "Choose Photo"}
                    </button>
                    {profileImage && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="block px-4 py-2 text-sm bg-red-500/20 text-red-300 light:text-red-600 rounded-lg hover:bg-red-500/30 transition-colors duration-200"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-purple-200 light:text-gray-500 mt-1">
                    JPEG, PNG, or WebP • Max 5MB • You can skip this step
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-400 light:text-red-600 text-sm bg-red-500/10 light:bg-red-50 border border-red-500/20 light:border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || usernameAvailable === false || checkingUsername}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {isLoading ? "Creating Profile..." : "Complete Setup"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-gray-400 light:text-gray-600">
          <p>You can change these settings later in your profile</p>
        </div>
      </div>
    </div>
  );
}