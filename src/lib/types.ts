export type { AnimeItem, JikanAnimeData, JikanResponse } from "./jikan-api";

export interface PageProps {
  params: Record<string, string>;
  searchParams: Record<string, string | string[] | undefined>;
}

export interface LayoutProps {
  children: React.ReactNode;
}

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
}

export interface CarouselConfig {
  autoplay?: boolean;
  autoplayDelay?: number;
  slidesPerView?: number;
  spaceBetween?: number;
  centeredSlides?: boolean;
  loop?: boolean;
}

export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface UserPreferences {
  theme: "dark" | "light";
  autoplayCarousels: boolean;
  emailNotifications: boolean;
  language: string;
}

export interface SearchFilters {
  genre?: string[];
  status?: string;
  year?: number;
  rating?: number;
  sortBy?: "title" | "rating" | "year" | "popularity";
  sortOrder?: "asc" | "desc";
}