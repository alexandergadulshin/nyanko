"use client";

import { SignIn, SignUp, UserProfile } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "sign-in";

  if (user) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white light:text-gray-900">User Profile</h1>
            <p className="mt-2 text-gray-300 light:text-gray-600">Manage your account settings</p>
          </div>
          <div className="bg-white/10 light:bg-white backdrop-blur-md border border-white/20 light:border-gray-200 p-6 shadow-xl light:shadow-lg rounded-lg">
            <UserProfile />
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
            {mode === "sign-up" ? "Create Account" : "Sign In"}
          </h1>
          <p className="mt-2 text-gray-300 light:text-gray-600">
            {mode === "sign-up" 
              ? "Create a new account to get started" 
              : "Sign in to your account"
            }
          </p>
        </div>
        
        <div className="bg-white/10 light:bg-white backdrop-blur-md border border-white/20 light:border-gray-200 p-6 shadow-xl light:shadow-lg rounded-lg">
          {mode === "sign-up" ? (
            <SignUp 
              appearance={{
                elements: {
                  formButtonPrimary: 'bg-purple-600 hover:bg-purple-700',
                  card: 'bg-transparent border-0 shadow-none'
                }
              }}
              signInUrl="/auth?mode=sign-in"
            />
          ) : (
            <SignIn 
              appearance={{
                elements: {
                  formButtonPrimary: 'bg-purple-600 hover:bg-purple-700',
                  card: 'bg-transparent border-0 shadow-none'
                }
              }}
              signUpUrl="/auth?mode=sign-up"
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