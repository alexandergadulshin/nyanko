import Link from "next/link";
import { notFound } from "next/navigation";
import { FaHeart, FaCalendarAlt, FaUser } from "react-icons/fa";
import { aggregator } from "~/lib/aggregator";
import { FavoriteButton } from "~/components/FavoriteButton";
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

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const personId = parseInt(id, 10);
  if (Number.isNaN(personId)) notFound();

  const raw = await aggregator.person.byId(personId).catch(() => null);
  if (!raw) notFound();

  const person = {
    id: raw.mal_id,
    malId: raw.mal_id,
    name: raw.name,
    nameKanji: raw.family_name ?? raw.given_name ?? null,
    nicknames: raw.alternate_names ?? [],
    birthday: raw.birthday ?? null,
    description: raw.about ?? "No description available.",
    about: raw.about ?? null,
    image: raw.images?.jpg?.image_url ?? "",
    favorites: raw.favorites ?? 0,
    website_url: raw.website_url ?? null,
    anime: (raw.anime ?? []).slice(0, 12),
    manga: (raw.manga ?? []).slice(0, 12),
    voices: (raw.voices ?? []).slice(0, 12),
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
                src={person.image}
                alt={person.name}
                className="w-full max-w-sm mx-auto rounded-lg shadow-2xl"
              />

              <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  {person.favorites > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Favorites</span>
                      <div className="flex items-center space-x-1">
                        <FaHeart className="text-red-400" />
                        <span className="text-white">{person.favorites.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {person.birthday && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Birthday</span>
                      <div className="flex items-center space-x-1">
                        <FaCalendarAlt className="text-blue-400" />
                        <span className="text-white text-right">{formatDate(person.birthday)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-white mb-2">{person.name}</h1>
              {person.nameKanji && (
                <h2 className="text-xl text-gray-400 mb-2">{person.nameKanji}</h2>
              )}
              {person.nicknames.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {person.nicknames.map((nickname, index) => (
                    <span key={index} className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-sm">
                      {nickname}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="flex items-center text-gray-400">
                  <FaUser className="mr-2" />
                  Person
                </span>
                <FavoriteButton
                  type="people"
                  itemId={person.malId}
                  itemTitle={person.name}
                  itemImage={person.image}
                  itemData={{
                    nameKanji: person.nameKanji,
                    birthday: person.birthday,
                    favorites: person.favorites,
                    website_url: person.website_url,
                  }}
                  className="ml-4"
                />
              </div>
            </div>

            {person.about && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-white mb-4">About</h3>
                <Synopsis text={person.about} className="whitespace-pre-line" />
              </div>
            )}

            {person.website_url && (
              <div className="mb-6">
                <a
                  href={person.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Visit Website
                </a>
              </div>
            )}

            {person.voices.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-white mb-4">Voice Acting Roles</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {person.voices.map((voice, index) => (
                    <div key={index} className="bg-gray-800/30 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <Link
                          href={`/character/${voice.character.mal_id}`}
                          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={voice.character.images.jpg.image_url}
                            alt={voice.character.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <div className="text-white font-medium">{voice.character.name}</div>
                            <div className="text-gray-400 text-sm">{voice.role}</div>
                          </div>
                        </Link>
                      </div>
                      <Link
                        href={`/anime/${voice.anime.mal_id}`}
                        className="text-purple-300 text-sm hover:text-purple-200 inline-block"
                      >
                        from {voice.anime.title}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {person.anime.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-white mb-4">Anime Works</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {person.anime.map((credit, index) => (
                    <Link
                      key={index}
                      href={`/anime/${credit.anime.mal_id}`}
                      className="bg-gray-800/30 rounded-lg overflow-hidden hover:bg-gray-700/30 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={credit.anime.images.jpg.image_url}
                        alt={credit.anime.title}
                        className="w-full aspect-[3/4] object-cover"
                      />
                      <div className="p-3">
                        <div className="text-white text-sm font-medium line-clamp-2 mb-1">
                          {credit.anime.title}
                        </div>
                        <div className="text-gray-400 text-xs">{credit.position}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {person.manga.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-white mb-4">Manga Works</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {person.manga.map((credit, index) => (
                    <Link
                      key={index}
                      href={`/manga/${credit.manga.mal_id}`}
                      className="bg-gray-800/30 rounded-lg overflow-hidden hover:bg-gray-700/30 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={credit.manga.images.jpg.image_url}
                        alt={credit.manga.title}
                        className="w-full aspect-[3/4] object-cover"
                      />
                      <div className="p-3">
                        <div className="text-white text-sm font-medium line-clamp-2 mb-1">
                          {credit.manga.title}
                        </div>
                        <div className="text-gray-400 text-xs">{credit.position}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
