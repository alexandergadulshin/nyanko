"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

function AuthContent() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") || "sign-in";
  const [isSignUp, setIsSignUp] = useState(mode === "sign-up");

  // Redirect authenticated users to profile or onboarding
  useEffect(() => {
    if (isLoaded && user) {
      // Check if user has completed onboarding by trying to fetch their profile
      fetch(`/api/profile/${user.id}`)
        .then(response => response.json())
        .then(data => {
          if (data.profile?.username && data.profile?.name) {
            router.push("/profile");
          } else {
            router.push("/onboarding");
          }
        })
        .catch(() => {
          // If profile doesn't exist, redirect to onboarding
          router.push("/onboarding");
        });
    }
  }, [isLoaded, user, router]);

  // Show loading state while Clerk is loading or redirecting authenticated users
  if (!isLoaded || user) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <div className="text-white light:text-gray-900">
            {!isLoaded ? "Loading..." : "Redirecting..."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181622] light:bg-transparent py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white light:text-gray-900">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="mt-2 text-gray-300 light:text-gray-600">
            {isSignUp 
              ? "Join the anime community today" 
              : "Sign in to your account to continue"
            }
          </p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="mb-6">
          <div className="flex bg-white/20 light:bg-gray-100 rounded-lg p-1 backdrop-blur-sm">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                !isSignUp
                  ? "bg-white/90 light:bg-white text-purple-600 light:text-blue-600 shadow-sm backdrop-blur-sm"
                  : "text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-800"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                isSignUp
                  ? "bg-white/90 light:bg-white text-purple-600 light:text-blue-600 shadow-sm backdrop-blur-sm"
                  : "text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-800"
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>
        
        <div className="bg-white/10 light:bg-white backdrop-blur-md border border-white/20 light:border-gray-200 p-8 shadow-xl light:shadow-lg rounded-xl">
          {isSignUp ? (
            <SignUp 
              appearance={{
                elements: {
                  formButtonPrimary: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border-0 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
                  card: 'bg-transparent border-0 shadow-none',
                  headerTitle: 'text-white light:text-gray-900 text-2xl font-bold mb-2',
                  headerSubtitle: 'text-purple-200 light:text-gray-600 text-sm',
                  socialButtonsBlockButton: 'border border-white/30 light:border-gray-200 bg-white/5 light:bg-white hover:bg-white/10 light:hover:bg-gray-50 text-white light:text-gray-700 rounded-lg transition-all duration-200 backdrop-blur-sm',
                  formFieldInput: 'border-white/30 light:border-gray-200 bg-white/10 light:bg-white text-white light:text-gray-900 rounded-lg focus:border-purple-400 light:focus:border-purple-500 transition-all duration-200 backdrop-blur-sm placeholder:text-purple-200 light:placeholder:text-gray-500',
                  formFieldLabel: 'text-purple-100 light:text-gray-700 font-medium',
                  footerActionLink: 'text-purple-300 hover:text-purple-100 light:text-purple-600 light:hover:text-purple-700 font-medium transition-colors duration-200',
                  identityPreviewEditButton: 'text-purple-300 hover:text-purple-100 light:text-purple-600',
                  formFieldAction: 'text-purple-300 hover:text-purple-100 light:text-purple-600',
                  dividerLine: 'bg-white/20 light:bg-gray-200',
                  dividerText: 'text-purple-200 light:text-gray-500',
                  socialButtonsBlockButtonText: 'font-medium',
                  formFieldInputShowPasswordButton: 'text-purple-300 hover:text-purple-100 light:text-gray-600'
                },
                layout: {
                  socialButtonsPlacement: 'top'
                }
              }}
              afterSignUpUrl="/onboarding"
              redirectUrl="/onboarding"
            />
          ) : (
            <SignIn 
              appearance={{
                elements: {
                  formButtonPrimary: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border-0 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
                  card: 'bg-transparent border-0 shadow-none',
                  headerTitle: 'text-white light:text-gray-900 text-2xl font-bold mb-2',
                  headerSubtitle: 'text-purple-200 light:text-gray-600 text-sm',
                  socialButtonsBlockButton: 'border border-white/30 light:border-gray-200 bg-white/5 light:bg-white hover:bg-white/10 light:hover:bg-gray-50 text-white light:text-gray-700 rounded-lg transition-all duration-200 backdrop-blur-sm',
                  formFieldInput: 'border-white/30 light:border-gray-200 bg-white/10 light:bg-white text-white light:text-gray-900 rounded-lg focus:border-purple-400 light:focus:border-purple-500 transition-all duration-200 backdrop-blur-sm placeholder:text-purple-200 light:placeholder:text-gray-500',
                  formFieldLabel: 'text-purple-100 light:text-gray-700 font-medium',
                  footerActionLink: 'text-purple-300 hover:text-purple-100 light:text-purple-600 light:hover:text-purple-700 font-medium transition-colors duration-200',
                  identityPreviewEditButton: 'text-purple-300 hover:text-purple-100 light:text-purple-600',
                  formFieldAction: 'text-purple-300 hover:text-purple-100 light:text-purple-600',
                  dividerLine: 'bg-white/20 light:bg-gray-200',
                  dividerText: 'text-purple-200 light:text-gray-500',
                  socialButtonsBlockButtonText: 'font-medium',
                  formFieldInputShowPasswordButton: 'text-purple-300 hover:text-purple-100 light:text-gray-600'
                },
                layout: {
                  socialButtonsPlacement: 'top'
                }
              }}
              afterSignInUrl="/"
              redirectUrl="/"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#181622] light:bg-transparent py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <div className="text-white light:text-gray-900">Loading...</div>
        </div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}