"use client";

import { Suspense } from "react";

export const dynamic = 'force-dynamic';
import { AuthTabs } from "~/components/auth/auth-tabs";
import { UserProfile } from "~/components/auth/user-profile";
import { useSession } from "~/lib/auth-client";

export default function AuthPage() {
  const { data: session, isPending } = useSession();

  return (
    <div className="min-h-screen bg-[#181622] light:bg-transparent py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white light:text-gray-900">Authentication</h1>
          <p className="mt-2 text-gray-300 light:text-gray-600">Sign in to your account or create a new one</p>
        </div>
        
        <div className="bg-white/10 light:bg-white backdrop-blur-md border border-white/20 light:border-gray-200 py-8 px-6 shadow-xl light:shadow-lg rounded-lg">
          {session && <UserProfile />}
          
          {(!session || isPending) && (
            <div className={session ? "mt-6" : ""}>
              <Suspense fallback={<div>Loading...</div>}>
                <AuthTabs />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}