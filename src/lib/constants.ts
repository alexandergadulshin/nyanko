export const APP_CONFIG = {
  name: "AnimeWeb",
  description: "Discover amazing anime series and connect with fellow fans",
  version: "1.0.0",
} as const;

export const ROUTES = {
  HOME: "/",
  DISCOVER: "/discover", 
  PROFILE: "/profile",
  SETTINGS: "/settings",
  AUTH: "/auth",
} as const;

export const API_CONFIG = {
  JIKAN_BASE_URL: "https://api.jikan.moe/v4",
  REQUEST_DELAY: 1000,
  DEFAULT_ANIME_LIMIT: 20,
  MAX_ANIME_LIMIT: 25,
} as const;

export const UI_CONFIG = {
  CAROUSEL_AUTOPLAY_DELAY: {
    DEFAULT: 3200,
    TOP_ANIME: 6000,
    UPCOMING: 7000,
  },
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
} as const;

export const THEME_COLORS = {
  PRIMARY: {
    GRADIENT: "from-pink-400 to-purple-400",
    PINK: "#ff6b9d",
    PURPLE: "#b76eff",
  },
  BACKGROUND: {
    MAIN: "from-gray-900 via-purple-900 to-gray-900",
    CARD: "rgba(255, 255, 255, 0.1)",
    CARD_HOVER: "rgba(255, 255, 255, 0.2)",
  },
  TEXT: {
    PRIMARY: "#ffffff",
    SECONDARY: "rgba(255, 255, 255, 0.9)",
    MUTED: "rgba(255, 255, 255, 0.7)",
  },
} as const;