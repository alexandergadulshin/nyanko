import { UserProfile } from "~/components/auth/user-profile";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Profile</span>
            </h1>
            <p className="text-lg text-gray-300">
              Manage your anime preferences and account settings
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <UserProfile />
          </div>
        </div>
      </div>
    </div>
  );
}