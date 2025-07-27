import { APP_CONFIG } from "~/lib/constants";

export function Footer() {
  return (
    <footer className="bg-gray-900/50 border-t border-gray-800/50 py-8 mt-16 light:bg-gray-100/50 light:border-gray-300/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-6">
            <span className="text-white font-semibold light:text-gray-800">{APP_CONFIG.name}</span>
            <span className="text-gray-400 text-sm light:text-gray-600">Your anime discovery companion</span>
          </div>
          
          <div className="text-gray-400 text-sm light:text-gray-600">
            © 2025 {APP_CONFIG.name}. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}