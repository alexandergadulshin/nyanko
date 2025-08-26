// Anime status utilities
export type AnimeStatus = "Airing Now" | "Scheduled" | "Movie" | "Finished";
export type UserAnimeStatus = "planning" | "watching" | "completed" | "dropped" | "paused";

// Manga status utilities  
export type MangaStatus = "Publishing" | "Finished" | "Not yet published" | "Discontinued";
export type UserMangaStatus = "planning" | "reading" | "completed" | "dropped" | "paused";

// API Response status utilities
export type ApiStatus = "success" | "error" | "warning" | "info" | "loading";

// Form validation status utilities
export type ValidationStatus = "valid" | "invalid" | "pending";

// Status color mappings
export const statusColors = {
  // Anime broadcast status colors
  anime: {
    "Airing Now": {
      bg: "bg-green-500",
      text: "text-green-400",
      border: "border-green-500",
      ring: "ring-green-500",
      light: "bg-green-100 text-green-800 border-green-200"
    },
    "Scheduled": {
      bg: "bg-blue-500", 
      text: "text-blue-400",
      border: "border-blue-500",
      ring: "ring-blue-500",
      light: "bg-blue-100 text-blue-800 border-blue-200"
    },
    "Movie": {
      bg: "bg-purple-500",
      text: "text-purple-400", 
      border: "border-purple-500",
      ring: "ring-purple-500",
      light: "bg-purple-100 text-purple-800 border-purple-200"
    },
    "Finished": {
      bg: "bg-gray-500",
      text: "text-gray-400",
      border: "border-gray-500", 
      ring: "ring-gray-500",
      light: "bg-gray-100 text-gray-800 border-gray-200"
    }
  } as const,

  // User anime list status colors
  userAnime: {
    "planning": {
      bg: "bg-gray-500",
      text: "text-gray-400",
      border: "border-gray-500",
      ring: "ring-gray-500",
      light: "bg-gray-100 text-gray-800 border-gray-200",
      dot: "bg-gray-500"
    },
    "watching": {
      bg: "bg-blue-500",
      text: "text-blue-400", 
      border: "border-blue-500",
      ring: "ring-blue-500",
      light: "bg-blue-100 text-blue-800 border-blue-200",
      dot: "bg-blue-500"
    },
    "completed": {
      bg: "bg-green-500",
      text: "text-green-400",
      border: "border-green-500",
      ring: "ring-green-500", 
      light: "bg-green-100 text-green-800 border-green-200",
      dot: "bg-green-500"
    },
    "paused": {
      bg: "bg-yellow-500",
      text: "text-yellow-400",
      border: "border-yellow-500",
      ring: "ring-yellow-500",
      light: "bg-yellow-100 text-yellow-800 border-yellow-200", 
      dot: "bg-yellow-500"
    },
    "dropped": {
      bg: "bg-red-500",
      text: "text-red-400",
      border: "border-red-500", 
      ring: "ring-red-500",
      light: "bg-red-100 text-red-800 border-red-200",
      dot: "bg-red-500"
    }
  } as const,

  // Manga status colors
  manga: {
    "Publishing": {
      bg: "bg-green-500",
      text: "text-green-400",
      border: "border-green-500",
      ring: "ring-green-500",
      light: "bg-green-100 text-green-800 border-green-200"
    },
    "Finished": {
      bg: "bg-gray-500", 
      text: "text-gray-400",
      border: "border-gray-500",
      ring: "ring-gray-500",
      light: "bg-gray-100 text-gray-800 border-gray-200"
    },
    "Not yet published": {
      bg: "bg-blue-500",
      text: "text-blue-400",
      border: "border-blue-500", 
      ring: "ring-blue-500",
      light: "bg-blue-100 text-blue-800 border-blue-200"
    },
    "Discontinued": {
      bg: "bg-red-500",
      text: "text-red-400",
      border: "border-red-500",
      ring: "ring-red-500", 
      light: "bg-red-100 text-red-800 border-red-200"
    }
  } as const,

  // API response status colors
  api: {
    "success": {
      bg: "bg-green-500",
      text: "text-green-400", 
      border: "border-green-500",
      ring: "ring-green-500",
      light: "bg-green-100 text-green-800 border-green-200"
    },
    "error": {
      bg: "bg-red-500",
      text: "text-red-400",
      border: "border-red-500",
      ring: "ring-red-500",
      light: "bg-red-100 text-red-800 border-red-200"
    },
    "warning": {
      bg: "bg-yellow-500", 
      text: "text-yellow-400",
      border: "border-yellow-500",
      ring: "ring-yellow-500",
      light: "bg-yellow-100 text-yellow-800 border-yellow-200"
    },
    "info": {
      bg: "bg-blue-500",
      text: "text-blue-400",
      border: "border-blue-500",
      ring: "ring-blue-500",
      light: "bg-blue-100 text-blue-800 border-blue-200"
    },
    "loading": {
      bg: "bg-gray-500",
      text: "text-gray-400", 
      border: "border-gray-500",
      ring: "ring-gray-500",
      light: "bg-gray-100 text-gray-800 border-gray-200"
    }
  } as const
};

// Status text mappings
export const statusText = {
  userAnime: {
    "planning": "Plan to Watch",
    "watching": "Watching", 
    "completed": "Completed",
    "paused": "On Hold",
    "dropped": "Dropped"
  } as const,

  userManga: {
    "planning": "Plan to Read",
    "reading": "Reading",
    "completed": "Completed", 
    "paused": "On Hold",
    "dropped": "Dropped"
  } as const
};

// Status emojis for visual enhancement
export const statusEmojis = {
  userAnime: {
    "planning": "📅",
    "watching": "👀",
    "completed": "✅", 
    "paused": "⏸️",
    "dropped": "❌"
  } as const,

  userManga: {
    "planning": "📅",
    "reading": "📖",
    "completed": "✅",
    "paused": "⏸️", 
    "dropped": "❌"
  } as const,

  api: {
    "success": "✅",
    "error": "❌", 
    "warning": "⚠️",
    "info": "ℹ️",
    "loading": "⏳"
  } as const
};

// Helper functions to get status information
export function getAnimeStatusColor(status: AnimeStatus, variant: keyof typeof statusColors.anime[AnimeStatus] = 'bg') {
  return statusColors.anime[status]?.[variant] || statusColors.anime.Finished[variant];
}

export function getUserAnimeStatusColor(status: UserAnimeStatus, variant: keyof typeof statusColors.userAnime[UserAnimeStatus] = 'bg') {
  return statusColors.userAnime[status]?.[variant] || statusColors.userAnime.planning[variant];
}

export function getMangaStatusColor(status: MangaStatus, variant: keyof typeof statusColors.manga[MangaStatus] = 'bg') {
  return statusColors.manga[status]?.[variant] || statusColors.manga.Finished[variant];
}

export function getApiStatusColor(status: ApiStatus, variant: keyof typeof statusColors.api[ApiStatus] = 'bg') {
  return statusColors.api[status]?.[variant] || statusColors.api.info[variant];
}

export function getUserAnimeStatusText(status: UserAnimeStatus): string {
  return statusText.userAnime[status] || "Unknown";
}

export function getUserMangaStatusText(status: UserMangaStatus): string {
  return statusText.userManga[status] || "Unknown";
}

export function getUserAnimeStatusEmoji(status: UserAnimeStatus): string {
  return statusEmojis.userAnime[status] || "❓";
}

export function getUserMangaStatusEmoji(status: UserMangaStatus): string {
  return statusEmojis.userManga[status] || "❓";
}

export function getApiStatusEmoji(status: ApiStatus): string {
  return statusEmojis.api[status] || "❓";
}

// Priority ordering for status (for sorting)
export const statusPriority = {
  userAnime: {
    "watching": 1,
    "completed": 2, 
    "planning": 3,
    "paused": 4,
    "dropped": 5
  } as const,

  userManga: {
    "reading": 1,
    "completed": 2,
    "planning": 3, 
    "paused": 4,
    "dropped": 5
  } as const
};

export function getUserAnimeStatusPriority(status: UserAnimeStatus): number {
  return statusPriority.userAnime[status] || 999;
}

export function getUserMangaStatusPriority(status: UserMangaStatus): number {
  return statusPriority.userManga[status] || 999;
}

// Status validation helpers
export function isValidAnimeStatus(status: string): status is AnimeStatus {
  return ["Airing Now", "Scheduled", "Movie", "Finished"].includes(status);
}

export function isValidUserAnimeStatus(status: string): status is UserAnimeStatus {
  return ["planning", "watching", "completed", "dropped", "paused"].includes(status);
}

export function isValidMangaStatus(status: string): status is MangaStatus {
  return ["Publishing", "Finished", "Not yet published", "Discontinued"].includes(status);
}

export function isValidUserMangaStatus(status: string): status is UserMangaStatus {
  return ["planning", "reading", "completed", "dropped", "paused"].includes(status);
}

export function isValidApiStatus(status: string): status is ApiStatus {
  return ["success", "error", "warning", "info", "loading"].includes(status);
}

// Convert between different status formats
export function normalizeAnimeStatus(status: string): AnimeStatus {
  const normalized = status.toLowerCase();
  if (normalized.includes('airing') || normalized.includes('ongoing')) return "Airing Now";
  if (normalized.includes('scheduled') || normalized.includes('upcoming')) return "Scheduled"; 
  if (normalized.includes('movie') || normalized.includes('film')) return "Movie";
  return "Finished";
}

export function normalizeMangaStatus(status: string): MangaStatus {
  const normalized = status.toLowerCase();
  if (normalized.includes('publishing') || normalized.includes('ongoing')) return "Publishing";
  if (normalized.includes('not yet') || normalized.includes('upcoming')) return "Not yet published";
  if (normalized.includes('discontinued') || normalized.includes('cancelled')) return "Discontinued";
  return "Finished";
}

// Status transition helpers (what statuses can transition to what)
export const statusTransitions = {
  userAnime: {
    "planning": ["watching", "completed", "dropped"],
    "watching": ["completed", "paused", "dropped", "planning"],
    "completed": ["watching", "planning"], // Can rewatch
    "paused": ["watching", "completed", "dropped", "planning"],
    "dropped": ["planning", "watching"]
  } as const,

  userManga: {
    "planning": ["reading", "completed", "dropped"],
    "reading": ["completed", "paused", "dropped", "planning"], 
    "completed": ["reading", "planning"], // Can reread
    "paused": ["reading", "completed", "dropped", "planning"],
    "dropped": ["planning", "reading"]
  } as const
};

export function getValidStatusTransitions(currentStatus: UserAnimeStatus): UserAnimeStatus[] {
  return [...statusTransitions.userAnime[currentStatus], currentStatus];
}

export function getValidMangaStatusTransitions(currentStatus: UserMangaStatus): UserMangaStatus[] {
  return [...statusTransitions.userManga[currentStatus], currentStatus];
}

// Status badge component props helper
export interface StatusBadgeProps {
  status: UserAnimeStatus | UserMangaStatus | AnimeStatus | MangaStatus | ApiStatus;
  type: 'userAnime' | 'userManga' | 'anime' | 'manga' | 'api';
  variant?: 'badge' | 'dot' | 'text';
  size?: 'sm' | 'md' | 'lg';
  showEmoji?: boolean;
  showText?: boolean;
  className?: string;
}

export function getStatusBadgeClasses(props: StatusBadgeProps) {
  const { status, type, variant = 'badge', size = 'md', showEmoji = false, showText = true } = props;
  
  let colorClasses = '';
  let emoji = '';
  let text = '';

  // Get appropriate color classes and content
  switch (type) {
    case 'userAnime':
      colorClasses = getUserAnimeStatusColor(status as UserAnimeStatus, variant === 'dot' ? 'dot' : 'bg');
      if (showEmoji) emoji = getUserAnimeStatusEmoji(status as UserAnimeStatus);
      if (showText) text = getUserAnimeStatusText(status as UserAnimeStatus);
      break;
    case 'userManga':
      colorClasses = getUserAnimeStatusColor(status as UserAnimeStatus, variant === 'dot' ? 'dot' : 'bg'); // Reuse anime colors
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

  const sizeClasses = {
    sm: variant === 'dot' ? 'w-2 h-2' : 'px-1.5 py-0.5 text-xs',
    md: variant === 'dot' ? 'w-2.5 h-2.5' : 'px-2 py-1 text-sm', 
    lg: variant === 'dot' ? 'w-3 h-3' : 'px-3 py-1.5 text-base'
  };

  const baseClasses = variant === 'dot' 
    ? `rounded-full ${sizeClasses[size]} ${colorClasses}`
    : `rounded font-medium text-white ${sizeClasses[size]} ${colorClasses}`;

  return {
    className: baseClasses,
    content: [emoji, text].filter(Boolean).join(' ').trim()
  };
}