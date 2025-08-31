"use client";

import React, { useCallback, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { useRouter } from "next/navigation";
import { type AnimeItem, type MangaItem } from "~/utils/api";
import { createSwiperConfig, type SwiperConfigOptions } from "~/hooks/use-carousel";
import { AnimeSearchBar } from "~/components/search/anime-search-bar";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface UnifiedCarouselProps {
  data: (AnimeItem | MangaItem)[];
  loading?: boolean;
  error?: string | null;
  title?: string;
  swiperOptions?: SwiperConfigOptions;
  cardType?: 'full' | 'compact';
  showSearchBar?: boolean;
  className?: string;
  navigationClass?: string;
}

export const UnifiedCarousel = React.memo(({ 
  data, 
  loading = false, 
  error = null, 
  title,
  swiperOptions = {},
  cardType = 'full',
  showSearchBar = false,
  className = "",
  navigationClass = ""
}: UnifiedCarouselProps) => {
  const router = useRouter();

  const handleItemClick = useCallback((item: AnimeItem | MangaItem) => {
    const path = 'episodes' in item ? `/anime/${item.malId}` : `/manga/${item.malId}`;
    router.push(path);
  }, [router]);

  const swiperConfig = createSwiperConfig({
    autoplay: false,
    autoplayDelay: 5000,
    slidesPerView: cardType === 'compact' ? 5.8 : 2.4,
    spaceBetween: cardType === 'compact' ? 16 : 20,
    centeredSlides: cardType === 'full',
    loop: true,
    navigation: {
      nextEl: `.${navigationClass}-next`,
      prevEl: `.${navigationClass}-prev`
    },
    breakpoints: cardType === 'compact' ? {
      320: { slidesPerView: 2.0, spaceBetween: 12 },
      480: { slidesPerView: 2.8, spaceBetween: 12 },
      640: { slidesPerView: 3.6, spaceBetween: 14 },
      768: { slidesPerView: 4.2, spaceBetween: 14 },
      1024: { slidesPerView: 4.8, spaceBetween: 16 },
      1280: { slidesPerView: 5.4, spaceBetween: 16 },
      1440: { slidesPerView: 5.8, spaceBetween: 16 },
      1536: { slidesPerView: 6.2, spaceBetween: 16 },
    } : {
      320: { slidesPerView: 1.4, spaceBetween: 15, centeredSlides: true },
      768: { slidesPerView: 1.8, spaceBetween: 20, centeredSlides: true },
      1024: { slidesPerView: 2.0, spaceBetween: 20, centeredSlides: true },
      1200: { slidesPerView: 2.2, spaceBetween: 20, centeredSlides: true },
      1440: { slidesPerView: 2.4, spaceBetween: 20, centeredSlides: true },
    },
    ...swiperOptions
  });

  if (loading) {
    return (
      <div className={`carousel-container relative w-full ${className}`}>
        {title && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">{title}</h2>
          </div>
        )}
        <div className="flex items-center justify-center h-96">
          <div className="text-white light:text-black text-lg">Loading amazing content...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`carousel-container relative w-full ${className}`}>
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

  if (data.length === 0) {
    return (
      <div className={`carousel-container relative w-full ${className}`}>
        {title && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">{title}</h2>
          </div>
        )}
        <div className="flex items-center justify-center h-96">
          <div className="text-white light:text-black text-lg">No content available.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`carousel-container relative w-full ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-3 px-4">
          <div className="text-left">
            {title === "Popular: New Releases" ? (
              <h2 className="text-3xl font-bold">
                <span className="text-white light:text-black light:[-webkit-text-stroke:none]" style={{ WebkitTextStroke: '0.35px #000000' }}>Popular</span>
                <span className="text-white light:text-black">:</span>
                <span className="text-[#e879f9]"> New Releases</span>
              </h2>
            ) : (
              <h2 className="text-3xl font-bold text-white light:text-black">{title}</h2>
            )}
          </div>
          {showSearchBar && (
            <div className="flex-shrink-0 ml-4">
              <div className="w-80">
                <AnimeSearchBar className="w-full" defaultCategory="anime" />
              </div>
            </div>
          )}
        </div>
      )}
      
      <Swiper {...swiperConfig} className={cardType === 'compact' ? 'top-anime-swiper' : 'anime-swiper'}>
        {data.map((item, index) => (
          <SwiperSlide key={`${item.malId}-${index}`}>
            {cardType === 'compact' ? (
              <CompactCard item={item} onClick={() => handleItemClick(item)} />
            ) : (
              <FullCard item={item} onClick={() => handleItemClick(item)} />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
      
      {navigationClass && (
        <>
          <div className={`${navigationClass}-prev absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white light:bg-white/70 light:hover:bg-white/90 light:text-gray-800 rounded-full w-10 h-10 flex items-center justify-center transition-colors cursor-pointer`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <div className={`${navigationClass}-next absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white light:bg-white/70 light:hover:bg-white/90 light:text-gray-800 rounded-full w-10 h-10 flex items-center justify-center transition-colors cursor-pointer`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
});

UnifiedCarousel.displayName = 'UnifiedCarousel';

// Card Components
const CompactCard = React.memo(({ item, onClick }: { item: AnimeItem | MangaItem; onClick: () => void }) => (
  <div 
    className="group cursor-pointer transition-all duration-300 hover:scale-105"
    onClick={onClick}
  >
    <div className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl hover:shadow-purple-500/25">
      <div className="aspect-[3/4] relative">
        <img 
          src={item.image} 
          alt={'title' in item ? item.title : 'Item'}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const type = 'episodes' in item ? 'anime' : 'manga';
            e.currentTarget.src = `/placeholder-${type}.jpg`;
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {item.rating > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md flex items-center space-x-1">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-white text-xs font-semibold">{item.rating.toFixed(1)}</span>
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
          <h3 className="text-white font-semibold text-sm line-clamp-2 leading-tight">
            {'title' in item ? item.title : 'Item'}
          </h3>
        </div>
      </div>
    </div>
  </div>
));

CompactCard.displayName = 'CompactCard';

const FullCard = React.memo(({ item, onClick }: { item: AnimeItem | MangaItem; onClick: () => void }) => {
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
      case "Publishing":
        return "bg-green-500";
      case "Not yet published":
        return "bg-blue-500";
      case "Discontinued":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div 
      className="anime-card cursor-pointer hover:scale-102 transition-transform duration-300"
      onClick={onClick}
    >
      <div className="anime-content">
        <div className="anime-info">
          <h2 className="anime-title hover:text-purple-300 light:hover:text-white transition-colors">
            {'title' in item ? item.title : 'Item'}
          </h2>
          
          <p className="anime-description line-clamp-4">
            {item.description}
          </p>
          
          <div className="anime-meta"></div>
          
          <div className="anime-stats">
            {item.favorites > 0 && (
              <div className="stat-item">
                <span className="stat-icon heart">♥</span>
                <span className="stat-value">
                  {item.favorites > 1000 
                    ? `${(item.favorites / 1000).toFixed(0)}K` 
                    : item.favorites}
                </span>
              </div>
            )}
            {item.rating > 0 && (
              <div className="stat-item">
                <span className="stat-icon star">★</span>
                <span className="stat-value">{item.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="anime-image relative">
          <img 
            src={item.image} 
            alt={'title' in item ? item.title : 'Item'}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const type = 'episodes' in item ? 'anime' : 'manga';
              e.currentTarget.src = `/placeholder-${type}.jpg`;
            }}
          />
          <div className="absolute top-2 right-2">
            <span className={`status-badge ${getStatusColor(item.status)} px-2 py-1 text-xs font-semibold text-white rounded-md shadow-lg`}>
              {item.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

FullCard.displayName = 'FullCard';