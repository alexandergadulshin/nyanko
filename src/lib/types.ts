export type { AnimeItem, JikanAnimeData, JikanResponse } from "../utils/api";

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

