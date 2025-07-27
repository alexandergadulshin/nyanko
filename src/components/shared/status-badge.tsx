import React from "react";
import { cn } from "~/lib/utils";
import { 
  getStatusBadgeClasses, 
  type StatusBadgeProps as BaseStatusBadgeProps,
  type UserAnimeStatus,
  type UserMangaStatus,
  type AnimeStatus,
  type MangaStatus,
  type ApiStatus
} from "~/lib/status-utils";

export interface StatusBadgeProps extends Omit<BaseStatusBadgeProps, 'status'> {
  status: UserAnimeStatus | UserMangaStatus | AnimeStatus | MangaStatus | ApiStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = (props) => {
  const { className: customClassName, ...badgeProps } = props;
  const { className, content } = getStatusBadgeClasses(badgeProps);

  if (props.variant === 'dot') {
    return (
      <div 
        className={cn(className, customClassName)}
        title={content}
        aria-label={`Status: ${content}`}
      />
    );
  }

  if (props.variant === 'text') {
    const textColorClass = props.type === 'userAnime' 
      ? `text-${props.status}-400` 
      : props.type === 'api' && props.status === 'error'
      ? 'text-red-400'
      : props.type === 'api' && props.status === 'success'
      ? 'text-green-400'
      : 'text-gray-400';

    return (
      <span className={cn(textColorClass, customClassName)}>
        {content}
      </span>
    );
  }

  return (
    <span className={cn(className, customClassName)}>
      {content}
    </span>
  );
};

// Specialized components for common use cases
export interface AnimeStatusBadgeProps {
  status: AnimeStatus;
  variant?: 'badge' | 'dot' | 'text';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AnimeStatusBadge: React.FC<AnimeStatusBadgeProps> = (props) => (
  <StatusBadge
    {...props}
    type="anime"
    showText={props.variant !== 'dot'}
  />
);

export interface UserAnimeStatusBadgeProps {
  status: UserAnimeStatus;
  variant?: 'badge' | 'dot' | 'text';
  size?: 'sm' | 'md' | 'lg';
  showEmoji?: boolean;
  className?: string;
}

export const UserAnimeStatusBadge: React.FC<UserAnimeStatusBadgeProps> = (props) => (
  <StatusBadge
    {...props}
    type="userAnime"
    showText={props.variant !== 'dot'}
  />
);

export interface MangaStatusBadgeProps {
  status: MangaStatus;
  variant?: 'badge' | 'dot' | 'text';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const MangaStatusBadge: React.FC<MangaStatusBadgeProps> = (props) => (
  <StatusBadge
    {...props}
    type="manga"
    showText={props.variant !== 'dot'}
  />
);

export interface UserMangaStatusBadgeProps {
  status: UserMangaStatus;
  variant?: 'badge' | 'dot' | 'text';
  size?: 'sm' | 'md' | 'lg';
  showEmoji?: boolean;
  className?: string;
}

export const UserMangaStatusBadge: React.FC<UserMangaStatusBadgeProps> = (props) => (
  <StatusBadge
    {...props}
    type="userManga"
    showText={props.variant !== 'dot'}
  />
);

export interface ApiStatusBadgeProps {
  status: ApiStatus;
  variant?: 'badge' | 'dot' | 'text';
  size?: 'sm' | 'md' | 'lg';
  showEmoji?: boolean;
  className?: string;
}

export const ApiStatusBadge: React.FC<ApiStatusBadgeProps> = (props) => (
  <StatusBadge
    {...props}
    type="api"
    showEmoji={props.showEmoji ?? true}
    showText={props.variant !== 'dot'}
  />
);

// Status indicator with count (for filter dropdowns, stats, etc.)
export interface StatusIndicatorProps {
  status: UserAnimeStatus | UserMangaStatus;
  type: 'userAnime' | 'userManga';
  count?: number;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  type,
  count,
  isActive = false,
  onClick,
  className
}) => {
  const { content } = getStatusBadgeClasses({
    status,
    type,
    variant: 'text',
    showEmoji: true,
    showText: true
  });

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex items-center justify-between w-full px-3 py-2 text-left rounded-lg transition-colors",
        isActive 
          ? "bg-purple-500/20 text-purple-300 font-medium"
          : "text-gray-300 hover:bg-gray-700/50 hover:text-white",
        !onClick && "cursor-default",
        className
      )}
    >
      <span className="flex items-center space-x-2">
        <StatusBadge
          status={status}
          type={type}
          variant="dot"
          size="sm"
        />
        <span>{content}</span>
      </span>
      {count !== undefined && (
        <span className={cn(
          "text-sm font-medium",
          isActive ? "text-purple-200" : "text-gray-400"
        )}>
          {count}
        </span>
      )}
    </button>
  );
};

// Status progress component (for statistics)
export interface StatusProgressProps {
  status: UserAnimeStatus | UserMangaStatus;
  type: 'userAnime' | 'userManga';
  value: number;
  total: number;
  showPercentage?: boolean;
  className?: string;
}

export const StatusProgress: React.FC<StatusProgressProps> = ({
  status,
  type,
  value,
  total,
  showPercentage = true,
  className
}) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const { content } = getStatusBadgeClasses({
    status,
    type,
    variant: 'text',
    showEmoji: false,
    showText: true
  });

  const colorClass = type === 'userAnime' 
    ? `bg-${status === 'watching' ? 'blue' : status === 'completed' ? 'green' : status === 'paused' ? 'yellow' : status === 'dropped' ? 'red' : 'gray'}-500`
    : `bg-${status === 'reading' ? 'blue' : status === 'completed' ? 'green' : status === 'paused' ? 'yellow' : status === 'dropped' ? 'red' : 'gray'}-500`;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          <StatusBadge
            status={status}
            type={type}
            variant="dot"
            size="sm"
          />
          <span className="text-gray-300">{content}</span>
        </div>
        <span className="text-gray-400">
          {value} {showPercentage && `(${percentage.toFixed(1)}%)`}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={cn("h-2 rounded-full transition-all duration-300", colorClass)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};