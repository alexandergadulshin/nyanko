export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Settings</span>
            </h1>
            <p className="text-lg text-gray-300">
              Customize your AnimeWeb experience
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Appearance</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Dark Mode</span>
                  <div className="text-gray-400">Always On</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Notifications</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">New Episode Alerts</span>
                  <div className="text-gray-400">Coming Soon</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Recommendations</span>
                  <div className="text-gray-400">Coming Soon</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Account</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Export Data</span>
                  <div className="text-gray-400">Coming Soon</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Delete Account</span>
                  <div className="text-gray-400">Coming Soon</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}