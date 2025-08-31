"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Check if user needs onboarding
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/auth");
      return;
    }

    if (isLoaded && user) {
      // Check if user already has a complete profile
      fetch(`/api/profile/${user.id}`)
        .then(response => response.json())
        .then(data => {
          if (data.profile?.username && data.profile?.name) {
            // User already has complete profile, redirect to profile
            router.push("/profile");
          }
        })
        .catch(() => {
          // Profile doesn't exist, stay on onboarding
        });
    }
  }, [isLoaded, user, router]);

  // Check username availability
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create profile");
      }

      // Redirect to profile after successful setup
      router.push("/profile");
    } catch (error) {
      console.error("Error creating profile:", error);
      setError(error instanceof Error ? error.message : "Failed to create profile");
    } finally {
      setIsLoading(false);
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
            {/* Display Name */}
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

            {/* Username */}
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
              
              {/* Username validation feedback */}
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

            {/* Error message */}
            {error && (
              <div className="text-red-400 light:text-red-600 text-sm bg-red-500/10 light:bg-red-50 border border-red-500/20 light:border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            {/* Submit button */}
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