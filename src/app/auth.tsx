"use client";

import { SignIn, SignUp, UserProfile } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthTabs } from "~/components/auth/auth-tabs";
import { UserProfile as BetterAuthProfile } from "~/components/auth/user-profile";
import { useSession } from "~/lib/auth-client";

function AuthContent() {
  const { user } = useUser();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "sign-in";
  const authType = searchParams.get("type") || "clerk"; // "clerk" or "betterauth"
  const [activeAuth, setActiveAuth] = useState<"clerk" | "betterauth">(authType as "clerk" | "betterauth");

  // Show profile if user is logged in with either system
  if (user || session) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white light:text-gray-900">User Profile</h1>
            <p className="mt-2 text-gray-300 light:text-gray-600">
              {user ? "Clerk Account" : "BetterAuth Account"}
            </p>
          </div>
          <div className="bg-white/10 light:bg-white backdrop-blur-md border border-white/20 light:border-gray-200 p-6 shadow-xl light:shadow-lg rounded-lg">
            {user ? <UserProfile /> : <BetterAuthProfile />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181622] light:bg-transparent py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white light:text-gray-900">Authentication</h1>
          <p className="mt-2 text-gray-300 light:text-gray-600">Choose your preferred authentication method</p>
        </div>

        {/* Authentication Type Selector */}
        <div className="mb-6">
          <div className="flex bg-white/20 light:bg-gray-100 rounded-lg p-1 backdrop-blur-sm">
            <button
              onClick={() => setActiveAuth("clerk")}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeAuth === "clerk"
                  ? "bg-white/90 light:bg-white text-purple-600 light:text-blue-600 shadow-sm backdrop-blur-sm"
                  : "text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-800"
              }`}
            >
              Clerk (Recommended)
            </button>
            <button
              onClick={() => setActiveAuth("betterauth")}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeAuth === "betterauth"
                  ? "bg-white/90 light:bg-white text-purple-600 light:text-blue-600 shadow-sm backdrop-blur-sm"
                  : "text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-800"
              }`}
            >
              Email/Password
            </button>
          </div>
        </div>
        
        <div className="bg-white/10 light:bg-white backdrop-blur-md border border-white/20 light:border-gray-200 p-6 shadow-xl light:shadow-lg rounded-lg">
          {activeAuth === "clerk" ? (
            mode === "sign-up" ? (
              <SignUp 
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-purple-600 hover:bg-purple-700',
                    card: 'bg-transparent border-0 shadow-none'
                  }
                }}
                signInUrl="/auth?mode=sign-in&type=clerk"
              />
            ) : (
              <SignIn 
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-purple-600 hover:bg-purple-700',
                    card: 'bg-transparent border-0 shadow-none'
                  }
                }}
                signUpUrl="/auth?mode=sign-up&type=clerk"
              />
            )
          ) : (
            <Suspense fallback={<div>Loading...</div>}>
              <AuthTabs />
            </Suspense>
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