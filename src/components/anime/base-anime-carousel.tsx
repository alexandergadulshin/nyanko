"use client";

import React, { useCallback, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { FaHeart, FaStar } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { type AnimeItem } from "~/utils/api";
import { AnimeSearchBar } from "~/components/search/anime-search-bar";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Airing Now":
      return "bg-green-500";
    case "Scheduled":
      return "bg-blue-500";
    case "Movie":
      return "bg-purple-500";
    case "Finished":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
};

const AnimeCard = React.memo(({ anime, onClick }: { anime: AnimeItem; onClick: () => void }) => (
  <div 
    className="anime-card cursor-pointer hover:scale-102 transition-transform duration-300"
    onClick={onClick}
  >
    <div className="anime-content">
      <div className="anime-info">
        <h2 className="anime-title hover:text-purple-300 light:hover:text-white transition-colors">{anime.title}</h2>
        
        <p className="anime-description line-clamp-4">
          {anime.description}
        </p>
        
        <div className="anime-meta">
        </div>
        
        <div className="anime-stats">
          {anime.favorites > 0 && (
            <div className="stat-item">
              <FaHeart className="stat-icon heart" />
              <span className="stat-value">
                {anime.favorites > 1000 
                  ? `${(anime.favorites / 1000).toFixed(0)}K` 
                  : anime.favorites}
              </span>
            </div>
          )}
          {anime.rating > 0 && (
            <div className="stat-item">
              <FaStar className="stat-icon star" />
              <span className="stat-value">{anime.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="anime-image relative">
        <img 
          src={anime.image} 
          alt={anime.title}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-anime.jpg';
          }}
        />
        <div className="absolute top-2 right-2">
          <span className={`status-badge ${getStatusColor(anime.status)} px-2 py-1 text-xs font-semibold text-white rounded-md shadow-lg`}>
            {anime.status}
          </span>
        </div>
      </div>
    </div>
  </div>
));

AnimeCard.displayName = 'AnimeCard';

interface BaseAnimeCarouselProps {
  animeData: AnimeItem[];
  loading?: boolean;
  error?: string | null;
  title?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
}

export const BaseAnimeCarousel = React.memo(({ 
  animeData, 
  loading = false, 
  error = null, 
  title,
  autoplay = true,
  autoplayDelay = 5000 
}: BaseAnimeCarouselProps) => {
  const router = useRouter();

  const handleAnimeClick = useCallback((anime: AnimeItem) => {
    router.push(`/anime/${anime.malId}`);
  }, [router]);

  const swiperConfig = useMemo(() => ({
    modules: [Navigation, ...(autoplay ? [Autoplay] : [])],
    spaceBetween: 20,
    slidesPerView: 2.4 as const,
    centeredSlides: true,
    breakpoints: {
      320: { slidesPerView: 1.4, spaceBetween: 15, centeredSlides: true },
      768: { slidesPerView: 1.8, spaceBetween: 20, centeredSlides: true },
      1024: { slidesPerView: 2.0, spaceBetween: 20, centeredSlides: true },
      1200: { slidesPerView: 2.2, spaceBetween: 20, centeredSlides: true },
      1440: { slidesPerView: 2.4, spaceBetween: 20, centeredSlides: true },
    },
    navigation: { nextEl: ".swiper-button-next-custom", prevEl: ".swiper-button-prev-custom" },
    ...(autoplay && { autoplay: { delay: autoplayDelay, disableOnInteraction: false } }),
    loop: true,
    className: "anime-swiper",
    watchSlidesProgress: true,
    speed: 600,
  }), [autoplay, autoplayDelay]);
  if (loading) {
    return (
      <div className="carousel-container relative w-full">
        {title && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">{title}</h2>
          </div>
        )}
        <div className="flex items-center justify-center h-96">
          <div className="text-white text-lg">Loading amazing anime...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="carousel-container relative w-full">
        {title && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">{title}</h2>
          </div>
        )}
        <div className="flex items-center justify-center h-96">
          <div className="text-red-400 text-lg">{error}</div>
        </div>
      </div>
    );
  }

  if (animeData.length === 0) {
    return (
      <div className="carousel-container relative w-full">
        {title && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">{title}</h2>
          </div>
        )}
        <div className="flex items-center justify-center h-96">
          <div className="text-white text-lg">No anime data available.</div>
        </div>
      </div>
    );
  }


  return (
    <div className="carousel-container relative w-full">
      {title && (
        <div className="flex items-center justify-between mb-3 px-4">
          <div className="text-left">
            {title === "Popular: New Releases" ? (
              <h2 className="text-3xl font-bold">
                <span style={{ color: '#fff', WebkitTextStroke: '0.35px #000000' }} className="light:[color:#fff] light:[-webkit-text-stroke:0.35px_#000000]">Popular</span>
                <span className="text-white">:</span>
                <span className="text-[#e879f9]"> New Releases</span>
              </h2>
            ) : (
              <h2 className="text-3xl font-bold text-white">{title}</h2>
            )}
          </div>
          {title === "Popular: New Releases" && (
            <div className="flex-shrink-0 ml-4">
              <div className="w-80">
                <AnimeSearchBar className="w-full" defaultCategory="anime" />
              </div>
            </div>
          )}
        </div>
      )}
      
      <Swiper {...swiperConfig}>
        {animeData.map((anime, index) => (
          <SwiperSlide key={`base-anime-${anime.malId}-${index}`}>
            <AnimeCard 
              anime={anime} 
              onClick={() => handleAnimeClick(anime)} 
            />
          </SwiperSlide>
        ))}
      </Swiper>
      
      <div className="swiper-button-prev-custom">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="swiper-button-next-custom">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
});

BaseAnimeCarousel.displayName = 'BaseAnimeCarousel';