"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaHeart, FaCalendarAlt, FaUser, FaArrowLeft } from "react-icons/fa";
import { jikanAPI, type PersonItem } from "~/utils/api";

interface DetailedPersonItem extends PersonItem {
  nameKanji: string | null;
  nicknames: string[];
  birthday: string | null;
  about: string | null;
  website_url: string | null;
  anime: Array<{
    position: string;
    anime: {
      mal_id: number;
      title: string;
      images: { jpg: { image_url: string } };
    };
  }>;
  manga: Array<{
    position: string;
    manga: {
      mal_id: number;
      title: string;
      images: { jpg: { image_url: string } };
    };
  }>;
  voices: Array<{
    role: string;
    anime: {
      mal_id: number;
      title: string;
      images: { jpg: { image_url: string } };
    };
    character: {
      mal_id: number;
      name: string;
      images: { jpg: { image_url: string } };
    };
  }>;
}

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [person, setPerson] = useState<DetailedPersonItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const personId = Array.isArray(params.id) ? params.id[0] : params.id ?? "";

  useEffect(() => {
    const fetchPersonDetails = async () => {
      if (!personId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`https://api.jikan.moe/v4/people/${personId}/full`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        const personData = data.data;
        
        const detailedPerson: DetailedPersonItem = {
          id: personData.mal_id,
          malId: personData.mal_id,
          name: personData.name,
          nameKanji: personData.family_name || personData.given_name,
          nicknames: personData.alternate_names || [],
          birthday: personData.birthday,
          description: personData.about || 'No description available.',
          about: personData.about,
          image: personData.images?.jpg?.image_url || '',
          favorites: personData.favorites || 0,
          website_url: personData.website_url,
          anime: personData.anime?.slice(0, 12) || [],
          manga: personData.manga?.slice(0, 12) || [],
          voices: personData.voices?.slice(0, 12) || [],
        };
        
        setPerson(detailedPerson);
      } catch (err) {
        setError("Failed to load person details");
        console.error("Error fetching person details:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchPersonDetails();
  }, [personId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading person details...</p>
        </div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || "Person not found"}</p>
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
                src={person.image}
                alt={person.name}
                className="w-full max-w-sm mx-auto rounded-lg shadow-2xl"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-person.jpg';
                }}
              />
              
              {/* Quick Stats */}
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

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2">
            {/* Title and Names */}
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-white mb-2">{person.name}</h1>
              {person.nameKanji && (
                <h2 className="text-xl text-gray-400 mb-2">{person.nameKanji}</h2>
              )}
              {person.nicknames.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {person.nicknames.map((nickname, index) => (
                    <span
                      key={index}
                      className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-sm"
                    >
                      {nickname}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center space-x-4">
                <span className="flex items-center text-gray-400">
                  <FaUser className="mr-2" />
                  Person
                </span>
              </div>
            </div>

            {/* About */}
            {person.about && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-white mb-4">About</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">{person.about}</p>
              </div>
            )}

            {/* Website */}
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

            {/* Voice Acting Roles */}
            {person.voices.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-white mb-4">Voice Acting Roles</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {person.voices.map((voice, index) => (
                    <div key={index} className="bg-gray-800/30 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <img
                          src={voice.character.images.jpg.image_url}
                          alt={voice.character.name}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-character.jpg';
                          }}
                        />
                        <div>
                          <div className="text-white font-medium">{voice.character.name}</div>
                          <div className="text-gray-400 text-sm">{voice.role}</div>
                        </div>
                      </div>
                      <div 
                        className="text-purple-300 text-sm hover:text-purple-200 cursor-pointer"
                        onClick={() => router.push(`/anime/${voice.anime.mal_id}`)}
                      >
                        from {voice.anime.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Anime Works */}
            {person.anime.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-white mb-4">Anime Works</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {person.anime.map((anime, index) => (
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
                        <div className="text-gray-400 text-xs">{anime.position}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manga Works */}
            {person.manga.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-white mb-4">Manga Works</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {person.manga.map((manga, index) => (
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
                        <div className="text-gray-400 text-xs">{manga.position}</div>
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