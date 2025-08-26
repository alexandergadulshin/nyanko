"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfileRedirectPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (user?.id) {
        router.push(`/profile/${user.id}`);
      } else {
        router.push("/auth");
      }
    }
  }, [user, isLoaded, router]);

  return (
    <div className="min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-purple-200 light:text-purple-600">Redirecting...</p>
      </div>
    </div>
  );
}