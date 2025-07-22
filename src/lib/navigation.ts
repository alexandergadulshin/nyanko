import { ROUTES } from "./constants";
import type { NavItem } from "./types";

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: ROUTES.HOME,
  },
  {
    label: "Discover",
    href: ROUTES.DISCOVER,
  },
];

export const USER_MENU_ITEMS: NavItem[] = [
  {
    label: "Profile",
    href: ROUTES.PROFILE,
    requiresAuth: true,
  },
  {
    label: "Settings", 
    href: ROUTES.SETTINGS,
    requiresAuth: true,
  },
];

export const GUEST_MENU_ITEMS: NavItem[] = [
  {
    label: "Sign In",
    href: ROUTES.AUTH,
  },
  {
    label: "Sign Up",
    href: `${ROUTES.AUTH}?tab=signup`,
  },
];

export const PAGE_METADATA = {
  [ROUTES.HOME]: {
    title: "AnimeWeb - Discover Amazing Anime",
    description: "Explore the latest and greatest anime series with stunning visuals and engaging stories",
  },
  [ROUTES.DISCOVER]: {
    title: "Discover Anime - AnimeWeb",
    description: "Find your next favorite anime with our curated recommendations and top-rated series",
  },
  [ROUTES.PROFILE]: {
    title: "Your Profile - AnimeWeb",
    description: "Manage your anime preferences and account settings",
  },
  [ROUTES.SETTINGS]: {
    title: "Settings - AnimeWeb", 
    description: "Customize your AnimeWeb experience",
  },
  [ROUTES.AUTH]: {
    title: "Sign In - AnimeWeb",
    description: "Sign in to your account or create a new one",
  },
} as const;