import React from "react";
import { cn } from "~/lib/utils";

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'purple' | 'blue' | 'green' | 'red' | 'yellow' | 'gray';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'purple',
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const colorClasses = {
    purple: 'border-purple-500',
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500',
    gray: 'border-gray-500'
  };

  return (
    <div 
      className={cn(
        "animate-spin rounded-full border-2 border-transparent border-t-current",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      aria-label="Loading"
    />
  );
};

export interface LoadingCardProps {
  title?: string;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  title = "Loading...", 
  message,
  size = 'md',
  className 
}) => {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/30",
      sizeClasses[size],
      className
    )}>
      <LoadingSpinner size={size === 'sm' ? 'md' : 'lg'} className="mb-4" />
      <h3 className="text-white font-medium text-center">{title}</h3>
      {message && (
        <p className="text-gray-400 text-sm text-center mt-2">{message}</p>
      )}
    </div>
  );
};

export interface LoadingPageProps {
  title?: string;
  message?: string;
  className?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ 
  title = "Loading...", 
  message,
  className 
}) => {
  return (
    <div className={cn(
      "min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center",
      className
    )}>
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        <h2 className="text-white light:text-gray-800 text-xl font-semibold mb-2">
          {title}
        </h2>
        {message && (
          <p className="text-gray-400 light:text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
};

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}) => {
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded',
    circular: 'rounded-full'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Could be enhanced with a wave animation
    none: ''
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={cn(
        "bg-gray-700/40 light:bg-gray-200",
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
    />
  );
};

export interface LoadingListProps {
  count?: number;
  itemHeight?: number;
  className?: string;
}

export const LoadingList: React.FC<LoadingListProps> = ({ 
  count = 5, 
  itemHeight = 80,
  className 
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index}
          className="flex items-center space-x-4 p-4 bg-gray-800/60 rounded-lg"
          style={{ height: itemHeight }}
        >
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
          <div className="space-y-2">
            <Skeleton variant="rectangular" width={80} height={20} />
            <Skeleton variant="rectangular" width={60} height={16} />
          </div>
        </div>
      ))}
    </div>
  );
};

export interface LoadingGridProps {
  count?: number;
  columns?: number;
  itemHeight?: number;
  className?: string;
}

export const LoadingGrid: React.FC<LoadingGridProps> = ({ 
  count = 12, 
  columns = 4,
  itemHeight = 200,
  className 
}) => {
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  };

  return (
    <div className={cn(
      "grid gap-4",
      gridClasses[columns as keyof typeof gridClasses] || 'grid-cols-4',
      className
    )}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton 
            variant="rectangular" 
            height={itemHeight}
            className="w-full" 
          />
          <Skeleton variant="text" className="w-full" />
          <Skeleton variant="text" className="w-3/4" />
        </div>
      ))}
    </div>
  );
};

// Inline loading states for buttons and small components
export interface InlineLoadingProps {
  text?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({ 
  text = "Loading...", 
  size = 'sm',
  className 
}) => {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <LoadingSpinner size={size} />
      <span className="text-gray-400">{text}</span>
    </div>
  );
};

// Loading overlay for existing content
export interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
  children?: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isVisible, 
  message = "Loading...",
  className,
  children 
}) => {
  if (!isVisible) return <>{children}</>;

  return (
    <div className={cn("relative", className)}>
      {children}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-white">{message}</p>
        </div>
      </div>
    </div>
  );
};