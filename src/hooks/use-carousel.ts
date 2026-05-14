import { useState, useEffect, useCallback, useMemo } from "react";
import { Navigation, Autoplay, Keyboard } from "swiper/modules";
import { jikanAPI, type AnimeItem, type MangaItem } from "~/utils/api";

export type CarouselDataType = 'anime' | 'manga';
export type CarouselFetchType = 'currentlyAiring' | 'topAnime' | 'upcomingAnime' | 'topManga';

interface UseCarouselOptions {
  fetchType: CarouselFetchType;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  /**
   * Server-prefetched data. When present we seed state with this value
   * and skip the client-side fetch on mount — first paint shows real
   * content. Falls back to client fetching when undefined.
   */
  initialData?: readonly (AnimeItem | MangaItem)[] | null;
}

interface UseCarouselReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const FETCH_METHODS = {
  currentlyAiring: (limit: number) => jikanAPI.getCurrentlyAiring(limit),
  topAnime: (limit: number) => jikanAPI.getTopAnime(limit),
  upcomingAnime: (limit: number) => jikanAPI.getUpcomingAnime(limit),
  topManga: (limit: number) => jikanAPI.getTopManga(limit)
} as const;

const DEFAULT_REFRESH_INTERVAL = 300000;
const DEFAULT_LIMIT = 16;

export function useCarousel<T extends AnimeItem | MangaItem>(
  options: UseCarouselOptions
): UseCarouselReturn<T> {
  const {
    fetchType,
    limit = DEFAULT_LIMIT,
    autoRefresh = false,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    initialData,
  } = options;

  const hasInitial = !!initialData && initialData.length > 0;
  const [data, setData] = useState<T[]>(() =>
    hasInitial ? ([...initialData!] as T[]) : []
  );
  const [loading, setLoading] = useState(!hasInitial);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchMethod = FETCH_METHODS[fetchType];
      if (!fetchMethod) {
        throw new Error(`Unknown fetch type: ${fetchType}`);
      }

      const result = await fetchMethod(limit) as T[];
      setData(result);
    } catch (err) {
      setError(`Failed to fetch ${fetchType} data. Please try again later.`);
    } finally {
      setLoading(false);
    }
  }, [fetchType, limit]);

  useEffect(() => {
    // Skip the initial client fetch when the server already gave us data.
    if (!hasInitial) void fetchData();
  }, [fetchData, hasInitial]);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

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

const DEFAULT_CONFIG = {
  autoplayDelay: 5000,
  slidesPerView: 2.4,
  spaceBetween: 20,
  centeredSlides: true,
  loop: true,
  speed: 600
} as const;

export function createSwiperConfig(options: SwiperConfigOptions) {
  const {
    autoplay = false,
    autoplayDelay = DEFAULT_CONFIG.autoplayDelay,
    slidesPerView = DEFAULT_CONFIG.slidesPerView,
    spaceBetween = DEFAULT_CONFIG.spaceBetween,
    centeredSlides = DEFAULT_CONFIG.centeredSlides,
    loop = DEFAULT_CONFIG.loop,
    navigation,
    breakpoints
  } = options;

  return useMemo(() => ({
    modules: [Navigation, Keyboard, ...(autoplay ? [Autoplay] : [])],
    spaceBetween,
    slidesPerView,
    centeredSlides,
    breakpoints,
    navigation,
    // Left/Right arrow keys advance whichever carousel is in view. Swiper's
    // keyboard module already ignores keypresses while an input is focused.
    keyboard: { enabled: true, onlyInViewport: true },
    ...(autoplay && { autoplay: { delay: autoplayDelay, disableOnInteraction: false } }),
    loop,
    watchSlidesProgress: true,
    speed: DEFAULT_CONFIG.speed,
  }), [autoplay, autoplayDelay, slidesPerView, spaceBetween, centeredSlides, loop, navigation, breakpoints]);
}