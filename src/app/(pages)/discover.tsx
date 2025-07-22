import { TopAnimeCarousel } from "~/components/anime/top-anime-carousel";
import { UpcomingAnimeCarousel } from "~/components/anime/upcoming-anime-carousel";

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Anime</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Explore top-rated series and upcoming releases
          </p>
        </div>

        <div className="space-y-16">
          <TopAnimeCarousel />
          <UpcomingAnimeCarousel />
        </div>
      </div>
    </div>
  );
}