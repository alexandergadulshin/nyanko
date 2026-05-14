import Link from "next/link";
import { notFound } from "next/navigation";
import { FaHeart, FaUser } from "react-icons/fa";
import { aggregator } from "~/lib/aggregator";
import { FavoriteButton } from "~/components/FavoriteButton";
import { BackButton } from "~/components/ui/back-button";
import { Synopsis } from "~/components/shared/synopsis";

export const revalidate = 3600;

const LIMITS = {
  animeography: 12,
  mangaography: 12,
  voiceActors: 8,
} as const;

export default async function CharacterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const characterId = parseInt(id, 10);
  if (Number.isNaN(characterId)) notFound();

  const raw = await aggregator.character.byId(characterId).catch(() => null);
  if (!raw) notFound();

  const character = {
    id: raw.mal_id,
    malId: raw.mal_id,
    name: raw.name,
    nameKanji: raw.name_kanji ?? null,
    nicknames: raw.nicknames ?? [],
    description: raw.about ?? "No description available.",
    about: raw.about ?? null,
    image:
      raw.images?.jpg?.image_url ??
      raw.images?.webp?.image_url ??
      "",
    favorites: raw.favorites ?? 0,
    animeography: (raw.anime ?? []).slice(0, LIMITS.animeography),
    mangaography: (raw.manga ?? []).slice(0, LIMITS.mangaography),
    voiceActors: (raw.voices ?? []).slice(0, LIMITS.voiceActors),
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
                src={character.image}
                alt={character.name}
                className="w-full max-w-sm mx-auto rounded-lg shadow-2xl"
              />

              <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  {character.favorites > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Favorites</span>
                      <div className="flex items-center space-x-1">
                        <FaHeart className="text-red-400" />
                        <span className="text-white">{character.favorites.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-white mb-2">{character.name}</h1>
              {character.nameKanji && (
                <h2 className="text-xl text-gray-400 mb-2">{character.nameKanji}</h2>
              )}
              {character.nicknames.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {character.nicknames.map((nickname, index) => (
                    <span
                      key={index}
                      className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-sm"
                    >
                      {nickname}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="flex items-center text-gray-400">
                  <FaUser className="mr-2" />
                  Character
                </span>
                <FavoriteButton
                  type="characters"
                  itemId={character.malId}
                  itemTitle={character.name}
                  itemImage={character.image}
                  itemData={{
                    nameKanji: character.nameKanji,
                    favorites: character.favorites,
                  }}
                  className="ml-4"
                />
              </div>
            </div>

            {character.about && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-white mb-4">About</h3>
                <Synopsis text={character.about} className="whitespace-pre-line" />
              </div>
            )}

            {character.voiceActors.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-white mb-4">Voice Actors</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {character.voiceActors.map((va, index) => (
                    <Link
                      key={index}
                      href={`/person/${va.person.mal_id}`}
                      className="bg-gray-800/30 rounded-lg p-4 flex items-center space-x-3 hover:bg-gray-700/30 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={va.person.images.jpg.image_url}
                        alt={va.person.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-white font-medium">{va.person.name}</div>
                        <div className="text-gray-400 text-sm">{va.language}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {character.animeography.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-white mb-4">Animeography</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {character.animeography.map((entry, index) => (
                    <Link
                      key={index}
                      href={`/anime/${entry.anime.mal_id}`}
                      className="bg-gray-800/30 rounded-lg overflow-hidden hover:bg-gray-700/30 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={entry.anime.images.jpg.image_url}
                        alt={entry.anime.title}
                        className="w-full aspect-[3/4] object-cover"
                      />
                      <div className="p-3">
                        <div className="text-white text-sm font-medium line-clamp-2 mb-1">
                          {entry.anime.title}
                        </div>
                        <div className="text-gray-400 text-xs">{entry.role}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {character.mangaography.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-white mb-4">Mangaography</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {character.mangaography.map((entry, index) => (
                    <Link
                      key={index}
                      href={`/manga/${entry.manga.mal_id}`}
                      className="bg-gray-800/30 rounded-lg overflow-hidden hover:bg-gray-700/30 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={entry.manga.images.jpg.image_url}
                        alt={entry.manga.title}
                        className="w-full aspect-[3/4] object-cover"
                      />
                      <div className="p-3">
                        <div className="text-white text-sm font-medium line-clamp-2 mb-1">
                          {entry.manga.title}
                        </div>
                        <div className="text-gray-400 text-xs">{entry.role}</div>
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
