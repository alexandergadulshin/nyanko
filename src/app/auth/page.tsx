import { AuthTabs } from "~/components/auth/auth-tabs";
import { UserProfile } from "~/components/auth/user-profile";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Authentication</h1>
          <p className="mt-2 text-gray-600">Sign in to your account or create a new one</p>
        </div>
        
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <UserProfile />
          <div className="mt-6">
            <AuthTabs />
          </div>
        </div>
      </div>
    </div>
  );
}