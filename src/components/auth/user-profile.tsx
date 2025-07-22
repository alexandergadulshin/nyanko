"use client";

import { useSession, signOut } from "~/lib/auth-client";

export function UserProfile() {
  const { data: session, isPending, error } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-4 text-center text-gray-600">
        Not signed in
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.reload();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-4">
        {session.user.image && (
          <img
            src={session.user.image}
            alt="Profile"
            className="w-10 h-10 rounded-full"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            Welcome, {session.user.name}!
          </h3>
          <p className="text-sm text-gray-600">{session.user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}