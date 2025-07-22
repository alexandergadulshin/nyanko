"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { FaHeart, FaStar } from "react-icons/fa";
import { type AnimeItem } from "~/lib/jikan-api";

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

interface BaseAnimeCarouselProps {
  animeData: AnimeItem[];
  loading?: boolean;
  error?: string | null;
  title?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
}

export function BaseAnimeCarousel({ 
  animeData, 
  loading = false, 
  error = null, 
  title,
  autoplay = true,
  autoplayDelay = 5000 
}: BaseAnimeCarouselProps) {
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

  const swiperConfig = {
    modules: [Navigation, Pagination, ...(autoplay ? [Autoplay] : [])],
    spaceBetween: 20,
    slidesPerView: 1.4 as const,
    centeredSlides: true,
    breakpoints: {
      320: {
        slidesPerView: 1.2,
        spaceBetween: 15,
        centeredSlides: true,
      },
      768: {
        slidesPerView: 1.4,
        spaceBetween: 20,
        centeredSlides: true,
      },
      1024: {
        slidesPerView: 1.6,
        spaceBetween: 20,
        centeredSlides: true,
      },
      1440: {
        slidesPerView: 2.0,
        spaceBetween: 20,
        centeredSlides: true,
      },
    },
    navigation: {
      nextEl: ".swiper-button-next-custom",
      prevEl: ".swiper-button-prev-custom",
    },
    pagination: {
      clickable: true,
      el: ".swiper-pagination-custom",
    },
    ...(autoplay && {
      autoplay: {
        delay: autoplayDelay,
        disableOnInteraction: false,
      },
    }),
    loop: true,
    className: "anime-swiper",
  };

  return (
    <div className="carousel-container relative w-full">
      {title && (
        <div className="text-left mb-4 px-4">
          <h2 className="text-3xl font-bold text-white">{title}</h2>
        </div>
      )}
      
      <Swiper {...swiperConfig}>
        {animeData.map((anime) => (
          <SwiperSlide key={anime.malId}>
            <div className="anime-card">
              <div className="anime-content">
                <div className="anime-info">
                  <h2 className="anime-title">{anime.title}</h2>
                  
                  <p className="anime-description line-clamp-4">
                    {anime.description}
                  </p>
                  
                  <div className="anime-meta">
                    {anime.episodes && (
                      <div className="meta-item">
                        <span className="meta-label">Episodes:</span>
                        <span className="meta-value">{anime.episodes}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="anime-stats">
                    <div className="stat-item">
                      <FaHeart className="stat-icon heart" />
                      <span className="stat-value">
                        {anime.favorites > 1000 
                          ? `${(anime.favorites / 1000).toFixed(0)}K` 
                          : anime.favorites}
                      </span>
                    </div>
                    <div className="stat-item">
                      <FaStar className="stat-icon star" />
                      <span className="stat-value">{anime.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="anime-image relative">
                  <img 
                    src={anime.image} 
                    alt={anime.title}
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
      
      <div className="swiper-pagination-custom"></div>
    </div>
  );
}