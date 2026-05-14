import { notFound } from "next/navigation";
import { FaStar, FaHeart, FaCalendarAlt, FaBook } from "react-icons/fa";
import { aggregator } from "~/lib/aggregator";
import { BackButton } from "~/components/ui/back-button";
import { Synopsis } from "~/components/shared/synopsis";

export const revalidate = 3600;

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "Unknown";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatPublishedPeriod(published: { from?: string | null; to?: string | null } | undefined) {
  const from = published?.from ? formatDate(published.from) : "Unknown";
  const to = published?.to ? formatDate(published.to) : "Ongoing";
  return `${from} - ${to}`;
}

export default async function MangaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mangaId = parseInt(id, 10);
  if (Number.isNaN(mangaId)) notFound();

  const raw = await aggregator.manga.byId(mangaId).catch(() => null);
  if (!raw) notFound();

  // Same normalization the page used to do client-side, now on the server.
  const manga = {
    id: raw.mal_id,
    malId: raw.mal_id,
    title: raw.title_english ?? raw.title,
    titleJapanese: raw.title_japanese ?? null,
    description: raw.synopsis ?? "No description available.",
    image:
      raw.images?.jpg?.large_image_url ??
      raw.images?.jpg?.image_url ??
      "",
    status: raw.publishing
      ? "Publishing"
      : raw.status === "Not yet published"
      ? "Not yet published"
      : raw.status === "Discontinued"
      ? "Discontinued"
      : "Finished",
    favorites: raw.favorites ?? 0,
    rating: raw.score ?? 0,
    chapters: raw.chapters ?? null,
    volumes: raw.volumes ?? null,
    type: raw.type ?? "",
    score: raw.score ?? null,
    scoredBy: raw.scored_by ?? null,
    rank: raw.rank ?? null,
    popularity: raw.popularity ?? null,
    year: raw.published?.from ? new Date(raw.published.from).getFullYear() : null,
    published: raw.published ?? { from: null, to: null },
    genres: raw.genres?.map((g) => g.name) ?? [],
    themes: raw.themes?.map((t) => t.name) ?? [],
    demographics: raw.demographics?.map((d) => d.name) ?? [],
    authors: raw.authors?.map((a) => a.name) ?? [],
    serializations: raw.serializations?.map((s) => s.name) ?? [],
  };

  return (
    <div className="min-h-screen bg-[#181622] light:bg-transparent">
      <div className="sticky top-0 z-10 bg-[#181622]/80 light:bg-gray-100/80 backdrop-blur-sm border-b border-gray-800 light:border-gray-300">
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
                src={manga.image}
                alt={manga.title}
                className="w-full max-w-sm mx-auto rounded-lg shadow-2xl"
              />

              <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  {manga.score && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Score</span>
                      <div className="flex items-center space-x-1">
                        <FaStar className="text-yellow-400" />
                        <span className="text-white">{manga.score.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                  {manga.favorites > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Favorites</span>
                      <div className="flex items-center space-x-1">
                        <FaHeart className="text-red-400" />
                        <span className="text-white">{manga.favorites.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {manga.rank && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Rank</span>
                      <span className="text-white">#{manga.rank}</span>
                    </div>
                  )}
                  {manga.popularity && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Popularity</span>
                      <span className="text-white">#{manga.popularity}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-white mb-2">{manga.title}</h1>
              {manga.titleJapanese && (
                <h2 className="text-xl text-gray-400 mb-2">{manga.titleJapanese}</h2>
              )}
              <div className="flex items-center space-x-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    manga.status === "Publishing"
                      ? "bg-green-500/20 text-green-400"
                      : manga.status === "Not yet published"
                      ? "bg-blue-500/20 text-blue-400"
                      : manga.status === "Discontinued"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {manga.status}
                </span>
                <span className="text-gray-400">{manga.type}</span>
                {manga.year && <span className="text-gray-400">{manga.year}</span>}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-white mb-4">Synopsis</h3>
              <Synopsis text={manga.description} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2 flex items-center">
                  <FaBook className="mr-2" />
                  Chapters & Volumes
                </h4>
                <div className="space-y-1 text-sm">
                  {manga.chapters && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Chapters:</span>
                      <span className="text-white">{manga.chapters}</span>
                    </div>
                  )}
                  {manga.volumes && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Volumes:</span>
                      <span className="text-white">{manga.volumes}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white">{manga.type}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2 flex items-center">
                  <FaCalendarAlt className="mr-2" />
                  Publication
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Published:</span>
                    <span className="text-white text-right">{formatPublishedPeriod(manga.published)}</span>
                  </div>
                </div>
              </div>
            </div>

            {manga.genres.length > 0 && (
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">Genres</h4>
                <div className="flex flex-wrap gap-2">
                  {manga.genres.map((genre) => (
                    <span key={genre} className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-sm">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {manga.themes.length > 0 && (
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">Themes</h4>
                <div className="flex flex-wrap gap-2">
                  {manga.themes.map((theme) => (
                    <span key={theme} className="bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full text-sm">
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {manga.authors.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-3">Authors</h4>
                  <div className="space-y-1">
                    {manga.authors.map((author) => (
                      <span key={author} className="block text-gray-300 text-sm">
                        {author}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {manga.serializations.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-3">Serializations</h4>
                  <div className="space-y-1">
                    {manga.serializations.map((serialization) => (
                      <span key={serialization} className="block text-gray-300 text-sm">
                        {serialization}
                      </span>
                    ))}
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
