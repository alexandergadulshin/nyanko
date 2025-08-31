"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaHeart, FaUser, FaArrowLeft } from "react-icons/fa";
import { jikanAPI, type CharacterItem } from "~/utils/api";
import { FavoriteButton } from "~/components/FavoriteButton";

interface DetailedCharacterItem extends Omit<CharacterItem, 'about'> {
  nameKanji: string | null;
  nicknames: string[];
  about: string | null;
  animeography: Array<{
    role: string;
    anime: {
      mal_id: number;
      title: string;
      images: { jpg: { image_url: string } };
    };
  }>;
  mangaography: Array<{
    role: string;
    manga: {
      mal_id: number;
      title: string;
      images: { jpg: { image_url: string } };
    };
  }>;
  voiceActors: Array<{
    language: string;
    person: {
      mal_id: number;
      name: string;
      images: { jpg: { image_url: string } };
    };
  }>;
}

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [character, setCharacter] = useState<DetailedCharacterItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const characterId = Array.isArray(params.id) ? params.id[0] : params.id ?? "";

  useEffect(() => {
    const fetchCharacterDetails = async () => {
      if (!characterId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`https://api.jikan.moe/v4/characters/${characterId}/full`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        const characterData = data.data;
        
        const detailedCharacter: DetailedCharacterItem = {
          id: characterData.mal_id,
          malId: characterData.mal_id,
          name: characterData.name,
          nameKanji: characterData.name_kanji,
          nicknames: characterData.nicknames || [],
          description: characterData.about || 'No description available.',
          about: characterData.about,
          image: characterData.images?.jpg?.image_url || characterData.images?.webp?.image_url || '',
          favorites: characterData.favorites || 0,
          animeography: characterData.anime?.slice(0, 12) || [],
          mangaography: characterData.manga?.slice(0, 12) || [],
          voiceActors: characterData.voices?.slice(0, 8) || [],
        };
        
        setCharacter(detailedCharacter);
      } catch (err) {
        setError("Failed to load character details");
        console.error("Error fetching character details:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchCharacterDetails();
  }, [characterId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading character details...</p>
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || "Character not found"}</p>
          <button
            onClick={() => router.back()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181622] light:bg-transparent">
      {/* Back Button */}
      <div className="sticky top-0 z-10 bg-[#181622]/80 light:bg-gray-100/80 backdrop-blur-sm border-b border-gray-800 light:border-gray-300">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <FaArrowLeft />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Image and Basic Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-32">
              <img
                src={character.image}
                alt={character.name}
                className="w-full max-w-sm mx-auto rounded-lg shadow-2xl"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-character.jpg';
                }}
              />
              
              {/* Quick Stats */}
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

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2">
            {/* Title and Names */}
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

            {/* About */}
            {character.about && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-white mb-4">About</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">{character.about}</p>
              </div>
            )}

            {/* Voice Actors */}
            {character.voiceActors.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-white mb-4">Voice Actors</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {character.voiceActors.map((va, index) => (
                    <div key={index} className="bg-gray-800/30 rounded-lg p-4 flex items-center space-x-3">
                      <img
                        src={va.person.images.jpg.image_url}
                        alt={va.person.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-person.jpg';
                        }}
                      />
                      <div>
                        <div className="text-white font-medium">{va.person.name}</div>
                        <div className="text-gray-400 text-sm">{va.language}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Animeography */}
            {character.animeography.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-white mb-4">Animeography</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {character.animeography.map((anime, index) => (
                    <div
                      key={index}
                      className="bg-gray-800/30 rounded-lg overflow-hidden hover:bg-gray-700/30 transition-colors cursor-pointer"
                      onClick={() => router.push(`/anime/${anime.anime.mal_id}`)}
                    >
                      <img
                        src={anime.anime.images.jpg.image_url}
                        alt={anime.anime.title}
                        className="w-full aspect-[3/4] object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-anime.jpg';
                        }}
                      />
                      <div className="p-3">
                        <div className="text-white text-sm font-medium line-clamp-2 mb-1">
                          {anime.anime.title}
                        </div>
                        <div className="text-gray-400 text-xs">{anime.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mangaography */}
            {character.mangaography.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-white mb-4">Mangaography</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {character.mangaography.map((manga, index) => (
                    <div
                      key={index}
                      className="bg-gray-800/30 rounded-lg overflow-hidden hover:bg-gray-700/30 transition-colors cursor-pointer"
                      onClick={() => router.push(`/manga/${manga.manga.mal_id}`)}
                    >
                      <img
                        src={manga.manga.images.jpg.image_url}
                        alt={manga.manga.title}
                        className="w-full aspect-[3/4] object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-manga.jpg';
                        }}
                      />
                      <div className="p-3">
                        <div className="text-white text-sm font-medium line-clamp-2 mb-1">
                          {manga.manga.title}
                        </div>
                        <div className="text-gray-400 text-xs">{manga.role}</div>
                      </div>
                    </div>
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