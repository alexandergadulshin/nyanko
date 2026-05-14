import { notFound } from "next/navigation";
import { FaStar, FaHeart, FaCalendarAlt, FaTv } from "react-icons/fa";
import { aggregator } from "~/lib/aggregator";
import type { DetailedAnimeItem } from "~/utils/api";
import { AddToListButton } from "~/components/anime/add-to-list-button";
import { AddToFavoritesButton } from "~/components/anime/add-to-favorites-button";
import { BackButton } from "~/components/ui/back-button";
import { Synopsis } from "~/components/shared/synopsis";

// ISR — the detail HTML is cached at the edge for an hour. Combined with
// the in-process aggregator cache, warm cache page renders are sub-ms.
export const revalidate = 3600;

const STATUS_COLORS = {
  "Airing Now": "bg-green-500/20 text-green-400",
  Scheduled: "bg-blue-500/20 text-blue-400",
  Movie: "bg-purple-500/20 text-purple-400",
  default: "bg-gray-500/20 text-gray-400",
} as const;

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

function formatDate(dateString: string | null) {
  if (!dateString) return "Unknown";
  return new Date(dateString).toLocaleDateString("en-US", DATE_FORMAT_OPTIONS);
}

function formatAiredPeriod(aired: { from: string | null; to: string | null }) {
  const from = aired.from ? formatDate(aired.from) : "Unknown";
  const to = aired.to ? formatDate(aired.to) : "Ongoing";
  return `${from} - ${to}`;
}

export default async function AnimeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const animeId = parseInt(id, 10);
  if (Number.isNaN(animeId)) notFound();

  const anime: DetailedAnimeItem | null = await aggregator.anime
    .byId(animeId)
    .catch(() => null);
  if (!anime) notFound();

  const animeData = {
    mal_id: animeId,
    title: anime.title,
    images: { jpg: { image_url: anime.image } },
    episodes: anime.episodes ?? undefined,
  };

  return (
    <div className="min-h-screen bg-[#181622] light:bg-transparent">
      <div className="sticky top-[72px] z-10 bg-[#181622]/80 light:bg-gray-100/80 backdrop-blur-sm border-b border-gray-800 light:border-gray-300">
        <div className="container mx-auto px-4 py-4">
          <BackButton />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="sticky top-32">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={anime.image}
                alt={anime.title}
                className="w-full max-w-sm mx-auto rounded-lg shadow-2xl"
              />

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <AddToListButton anime={animeData} />
                <AddToFavoritesButton anime={animeData} />
              </div>

              <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  {anime.score && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Score</span>
                      <div className="flex items-center space-x-1">
                        <FaStar className="text-yellow-400" />
                        <span className="text-white">{anime.score.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                  {anime.favorites > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Favorites</span>
                      <div className="flex items-center space-x-1">
                        <FaHeart className="text-red-400" />
                        <span className="text-white">{anime.favorites.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {anime.rank && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Rank</span>
                      <span className="text-white">#{anime.rank}</span>
                    </div>
                  )}
                  {anime.popularity && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Popularity</span>
                      <span className="text-white">#{anime.popularity}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-white mb-2">{anime.title}</h1>
              {anime.titleJapanese && (
                <h2 className="text-xl text-gray-400 mb-2">{anime.titleJapanese}</h2>
              )}
              <div className="flex items-center space-x-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    STATUS_COLORS[anime.status as keyof typeof STATUS_COLORS] ??
                    STATUS_COLORS.default
                  }`}
                >
                  {anime.status}
                </span>
                <span className="text-gray-400">{anime.type}</span>
                {anime.year && <span className="text-gray-400">{anime.year}</span>}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-white mb-4">Synopsis</h3>
              <Synopsis text={anime.description} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2 flex items-center">
                  <FaTv className="mr-2" />
                  Episodes & Duration
                </h4>
                <div className="space-y-1 text-sm">
                  {anime.episodes && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Episodes:</span>
                      <span className="text-white">{anime.episodes}</span>
                    </div>
                  )}
                  {anime.duration && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white">{anime.duration}</span>
                    </div>
                  )}
                  {anime.ageRating && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rating:</span>
                      <span className="text-white">{anime.ageRating}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2 flex items-center">
                  <FaCalendarAlt className="mr-2" />
                  Air Dates
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Aired:</span>
                    <span className="text-white text-right">{formatAiredPeriod(anime.aired)}</span>
                  </div>
                  {anime.season && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Season:</span>
                      <span className="text-white">{anime.season} {anime.year}</span>
                    </div>
                  )}
                  {anime.broadcast && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Broadcast:</span>
                      <span className="text-white">{anime.broadcast}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {anime.genres.length > 0 && (
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">Genres</h4>
                <div className="flex flex-wrap gap-2">
                  {anime.genres.map((genre) => (
                    <span key={genre} className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-sm">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {anime.themes.length > 0 && (
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">Themes</h4>
                <div className="flex flex-wrap gap-2">
                  {anime.themes.map((theme) => (
                    <span key={theme} className="bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full text-sm">
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {anime.studios.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-3">Studios</h4>
                  <div className="space-y-1">
                    {anime.studios.map((studio) => (
                      <span key={studio} className="block text-gray-300 text-sm">
                        {studio}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {anime.producers.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-3">Producers</h4>
                  <div className="space-y-1">
                    {anime.producers.slice(0, 5).map((producer) => (
                      <span key={producer} className="block text-gray-300 text-sm">
                        {producer}
                      </span>
                    ))}
                    {anime.producers.length > 5 && (
                      <span className="text-gray-500 text-sm">
                        +{anime.producers.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
