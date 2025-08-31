export type AnimeStatus = "Airing Now" | "Scheduled" | "Movie" | "Finished";
export type UserAnimeStatus = "planning" | "watching" | "completed" | "dropped" | "paused";
export type MangaStatus = "Publishing" | "Finished" | "Not yet published" | "Discontinued";
export type UserMangaStatus = "planning" | "reading" | "completed" | "dropped" | "paused";
export type ApiStatus = "success" | "error" | "warning" | "info" | "loading";
export type ValidationStatus = "valid" | "invalid" | "pending";

const BASE_COLORS = {
  green: { bg: "bg-green-500", text: "text-green-400", border: "border-green-500", ring: "ring-green-500", light: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" },
  blue: { bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-500", ring: "ring-blue-500", light: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  purple: { bg: "bg-purple-500", text: "text-purple-400", border: "border-purple-500", ring: "ring-purple-500", light: "bg-purple-100 text-purple-800 border-purple-200", dot: "bg-purple-500" },
  gray: { bg: "bg-gray-500", text: "text-gray-400", border: "border-gray-500", ring: "ring-gray-500", light: "bg-gray-100 text-gray-800 border-gray-200", dot: "bg-gray-500" },
  yellow: { bg: "bg-yellow-500", text: "text-yellow-400", border: "border-yellow-500", ring: "ring-yellow-500", light: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-500" },
  red: { bg: "bg-red-500", text: "text-red-400", border: "border-red-500", ring: "ring-red-500", light: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" }
} as const;

export const statusColors = {
  anime: {
    "Airing Now": BASE_COLORS.green,
    "Scheduled": BASE_COLORS.blue,
    "Movie": BASE_COLORS.purple,
    "Finished": BASE_COLORS.gray
  },
  userAnime: {
    "planning": BASE_COLORS.gray,
    "watching": BASE_COLORS.blue,
    "completed": BASE_COLORS.green,
    "paused": BASE_COLORS.yellow,
    "dropped": BASE_COLORS.red
  },
  manga: {
    "Publishing": BASE_COLORS.green,
    "Finished": BASE_COLORS.gray,
    "Not yet published": BASE_COLORS.blue,
    "Discontinued": BASE_COLORS.red
  },
  api: {
    "success": BASE_COLORS.green,
    "error": BASE_COLORS.red,
    "warning": BASE_COLORS.yellow,
    "info": BASE_COLORS.blue,
    "loading": BASE_COLORS.gray
  }
} as const;

export const statusText = {
  userAnime: {
    "planning": "Plan to Watch",
    "watching": "Watching",
    "completed": "Completed",
    "paused": "On Hold",
    "dropped": "Dropped"
  },
  userManga: {
    "planning": "Plan to Read",
    "reading": "Reading",
    "completed": "Completed",
    "paused": "On Hold",
    "dropped": "Dropped"
  }
} as const;

export const statusEmojis = {
  userAnime: {
    "planning": "📅",
    "watching": "👀",
    "completed": "✅",
    "paused": "⏸️",
    "dropped": "❌"
  },
  userManga: {
    "planning": "📅",
    "reading": "📖",
    "completed": "✅",
    "paused": "⏸️",
    "dropped": "❌"
  },
  api: {
    "success": "✅",
    "error": "❌",
    "warning": "⚠️",
    "info": "ℹ️",
    "loading": "⏳"
  }
} as const;

export const statusPriority = {
  userAnime: { "watching": 1, "completed": 2, "planning": 3, "paused": 4, "dropped": 5 },
  userManga: { "reading": 1, "completed": 2, "planning": 3, "paused": 4, "dropped": 5 }
} as const;

export const statusTransitions = {
  userAnime: {
    "planning": ["watching", "completed", "dropped"],
    "watching": ["completed", "paused", "dropped", "planning"],
    "completed": ["watching", "planning"],
    "paused": ["watching", "completed", "dropped", "planning"],
    "dropped": ["planning", "watching"]
  },
  userManga: {
    "planning": ["reading", "completed", "dropped"],
    "reading": ["completed", "paused", "dropped", "planning"],
    "completed": ["reading", "planning"],
    "paused": ["reading", "completed", "dropped", "planning"],
    "dropped": ["planning", "reading"]
  }
} as const;

const VALID_STATUSES = {
  anime: ["Airing Now", "Scheduled", "Movie", "Finished"],
  userAnime: ["planning", "watching", "completed", "dropped", "paused"],
  manga: ["Publishing", "Finished", "Not yet published", "Discontinued"],
  userManga: ["planning", "reading", "completed", "dropped", "paused"],
  api: ["success", "error", "warning", "info", "loading"]
} as const;

const STATUS_NORMALIZERS = {
  anime: new Map([
    ['airing', 'Airing Now'], ['ongoing', 'Airing Now'],
    ['scheduled', 'Scheduled'], ['upcoming', 'Scheduled'],
    ['movie', 'Movie'], ['film', 'Movie']
  ]),
  manga: new Map([
    ['publishing', 'Publishing'], ['ongoing', 'Publishing'],
    ['not yet', 'Not yet published'], ['upcoming', 'Not yet published'],
    ['discontinued', 'Discontinued'], ['cancelled', 'Discontinued']
  ])
} as const;

export function getAnimeStatusColor(status: AnimeStatus, variant: keyof typeof BASE_COLORS.green = 'bg') {
  return statusColors.anime[status]?.[variant] ?? statusColors.anime.Finished[variant];
}

export function getUserAnimeStatusColor(status: UserAnimeStatus, variant: keyof typeof BASE_COLORS.green = 'bg') {
  return statusColors.userAnime[status]?.[variant] ?? statusColors.userAnime.planning[variant];
}

export function getMangaStatusColor(status: MangaStatus, variant: keyof typeof BASE_COLORS.green = 'bg') {
  return statusColors.manga[status]?.[variant] ?? statusColors.manga.Finished[variant];
}

export function getApiStatusColor(status: ApiStatus, variant: keyof typeof BASE_COLORS.green = 'bg') {
  return statusColors.api[status]?.[variant] ?? statusColors.api.info[variant];
}

export function getUserAnimeStatusText(status: UserAnimeStatus): string {
  return statusText.userAnime[status] ?? "Unknown";
}

export function getUserMangaStatusText(status: UserMangaStatus): string {
  return statusText.userManga[status] ?? "Unknown";
}

export function getUserAnimeStatusEmoji(status: UserAnimeStatus): string {
  return statusEmojis.userAnime[status] ?? "❓";
}

export function getUserMangaStatusEmoji(status: UserMangaStatus): string {
  return statusEmojis.userManga[status] ?? "❓";
}

export function getApiStatusEmoji(status: ApiStatus): string {
  return statusEmojis.api[status] ?? "❓";
}

export function getUserAnimeStatusPriority(status: UserAnimeStatus): number {
  return statusPriority.userAnime[status] ?? 999;
}

export function getUserMangaStatusPriority(status: UserMangaStatus): number {
  return statusPriority.userManga[status] ?? 999;
}

export function isValidAnimeStatus(status: string): status is AnimeStatus {
  return VALID_STATUSES.anime.includes(status as AnimeStatus);
}

export function isValidUserAnimeStatus(status: string): status is UserAnimeStatus {
  return VALID_STATUSES.userAnime.includes(status as UserAnimeStatus);
}

export function isValidMangaStatus(status: string): status is MangaStatus {
  return VALID_STATUSES.manga.includes(status as MangaStatus);
}

export function isValidUserMangaStatus(status: string): status is UserMangaStatus {
  return VALID_STATUSES.userManga.includes(status as UserMangaStatus);
}

export function isValidApiStatus(status: string): status is ApiStatus {
  return VALID_STATUSES.api.includes(status as ApiStatus);
}

export function normalizeAnimeStatus(status: string): AnimeStatus {
  const normalized = status.toLowerCase();
  for (const [key, value] of STATUS_NORMALIZERS.anime) {
    if (normalized.includes(key)) return value;
  }
  return "Finished" as AnimeStatus;
}

export function normalizeMangaStatus(status: string): MangaStatus {
  const normalized = status.toLowerCase();
  for (const [key, value] of STATUS_NORMALIZERS.manga) {
    if (normalized.includes(key)) return value;
  }
  return "Finished" as MangaStatus;
}

export function getValidStatusTransitions(currentStatus: UserAnimeStatus): UserAnimeStatus[] {
  return [...statusTransitions.userAnime[currentStatus], currentStatus];
}

export function getValidMangaStatusTransitions(currentStatus: UserMangaStatus): UserMangaStatus[] {
  return [...statusTransitions.userManga[currentStatus], currentStatus];
}

export interface StatusBadgeProps {
  status: UserAnimeStatus | UserMangaStatus | AnimeStatus | MangaStatus | ApiStatus;
  type: 'userAnime' | 'userManga' | 'anime' | 'manga' | 'api';
  variant?: 'badge' | 'dot' | 'text';
  size?: 'sm' | 'md' | 'lg';
  showEmoji?: boolean;
  showText?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: { dot: 'w-2 h-2', badge: 'px-1.5 py-0.5 text-xs' },
  md: { dot: 'w-2.5 h-2.5', badge: 'px-2 py-1 text-sm' },
  lg: { dot: 'w-3 h-3', badge: 'px-3 py-1.5 text-base' }
} as const;

export function getStatusBadgeClasses(props: StatusBadgeProps) {
  const { status, type, variant = 'badge', size = 'md', showEmoji = false, showText = true } = props;
  
  let colorClasses = '';
  let emoji = '';
  let text = '';

  switch (type) {
    case 'userAnime':
      colorClasses = getUserAnimeStatusColor(status as UserAnimeStatus, variant === 'dot' ? 'dot' : 'bg');
      if (showEmoji) emoji = getUserAnimeStatusEmoji(status as UserAnimeStatus);
      if (showText) text = getUserAnimeStatusText(status as UserAnimeStatus);
      break;
    case 'userManga':
      colorClasses = getUserAnimeStatusColor(status as UserAnimeStatus, variant === 'dot' ? 'dot' : 'bg');
      if (showEmoji) emoji = getUserMangaStatusEmoji(status as UserMangaStatus);
      if (showText) text = getUserMangaStatusText(status as UserMangaStatus);
      break;
    case 'anime':
      colorClasses = getAnimeStatusColor(status as AnimeStatus);
      if (showText) text = status as string;
      break;
    case 'manga':
      colorClasses = getMangaStatusColor(status as MangaStatus);
      if (showText) text = status as string;
      break;
    case 'api':
      colorClasses = getApiStatusColor(status as ApiStatus);
      if (showEmoji) emoji = getApiStatusEmoji(status as ApiStatus);
      if (showText) text = status as string;
      break;
  }

  const sizeClasses = SIZE_CLASSES[size][variant === 'dot' ? 'dot' : 'badge'];
  const baseClasses = variant === 'dot' 
    ? `rounded-full ${sizeClasses} ${colorClasses}`
    : `rounded font-medium text-white ${sizeClasses} ${colorClasses}`;

  return {
    className: baseClasses,
    content: [emoji, text].filter(Boolean).join(' ').trim()
  };
}