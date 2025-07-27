import { useState, useEffect, useCallback, useMemo } from "react";
import { Navigation, Autoplay } from "swiper/modules";
import { jikanAPI, type AnimeItem, type MangaItem } from "~/utils/api";

export type CarouselDataType = 'anime' | 'manga';
export type CarouselFetchType = 
  | 'currentlyAiring' 
  | 'topAnime' 
  | 'upcomingAnime' 
  | 'topManga';

interface UseCarouselOptions {
  fetchType: CarouselFetchType;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseCarouselReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCarousel<T extends AnimeItem | MangaItem>(
  options: UseCarouselOptions
): UseCarouselReturn<T> {
  const { fetchType, limit = 16, autoRefresh = false, refreshInterval = 300000 } = options;
  
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let result: T[];
      
      switch (fetchType) {
        case 'currentlyAiring':
          result = await jikanAPI.getCurrentlyAiring(limit) as T[];
          break;
        case 'topAnime':
          result = await jikanAPI.getTopAnime(limit) as T[];
          break;
        case 'upcomingAnime':
          result = await jikanAPI.getUpcomingAnime(limit) as T[];
          break;
        case 'topManga':
          result = await jikanAPI.getTopManga(limit) as T[];
          break;
        default:
          throw new Error(`Unknown fetch type: ${String(fetchType)}`);
      }
      
      setData(result);
    } catch (err) {
      setError(`Failed to fetch ${fetchType} data. Please try again later.`);
      console.error(`Error fetching ${fetchType}:`, err);
    } finally {
      setLoading(false);
    }
  }, [fetchType, limit]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

// Swiper configuration factory
export interface SwiperConfigOptions {
  autoplay?: boolean;
  autoplayDelay?: number;
  slidesPerView?: number;
  spaceBetween?: number;
  centeredSlides?: boolean;
  loop?: boolean;
  navigation?: {
    nextEl: string;
    prevEl: string;
  };
  breakpoints?: Record<number, {
    slidesPerView: number;
    spaceBetween: number;
    centeredSlides?: boolean;
  }>;
}

export function createSwiperConfig(options: SwiperConfigOptions) {
  const {
    autoplay = false,
    autoplayDelay = 5000,
    slidesPerView = 2.4,
    spaceBetween = 20,
    centeredSlides = true,
    loop = true,
    navigation,
    breakpoints
  } = options;

  return useMemo(() => ({
    modules: [Navigation, ...(autoplay ? [Autoplay] : [])],
    spaceBetween,
    slidesPerView: slidesPerView as const,
    centeredSlides,
    breakpoints,
    navigation,
    ...(autoplay && { autoplay: { delay: autoplayDelay, disableOnInteraction: false } }),
    loop,
    watchSlidesProgress: true,
    speed: 600,
  }), [autoplay, autoplayDelay, slidesPerView, spaceBetween, centeredSlides, loop, navigation, breakpoints]);
}