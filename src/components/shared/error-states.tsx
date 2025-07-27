import React from "react";
import { cn } from "~/lib/utils";

export interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  variant = 'error',
  size = 'md',
  dismissible = false,
  onDismiss,
  className,
  icon
}) => {
  const variantClasses = {
    error: 'bg-red-100 light:bg-red-50 border-red-200 light:border-red-300 text-red-700 light:text-red-800',
    warning: 'bg-yellow-100 light:bg-yellow-50 border-yellow-200 light:border-yellow-300 text-yellow-700 light:text-yellow-800',
    info: 'bg-blue-100 light:bg-blue-50 border-blue-200 light:border-blue-300 text-blue-700 light:text-blue-800'
  };

  const sizeClasses = {
    sm: 'p-2 text-sm',
    md: 'p-3',
    lg: 'p-4 text-lg'
  };

  const defaultIcons = {
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };

  return (
    <div className={cn(
      "rounded-md border",
      variantClasses[variant],
      sizeClasses[size],
      className
    )}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {icon || defaultIcons[variant]}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="font-medium mb-1">{title}</h3>
          )}
          <p className={cn(!title && "font-medium")}>{message}</p>
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-2 flex-shrink-0 hover:opacity-70 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export interface ErrorCardProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'error' | 'warning' | 'info';
  className?: string;
  icon?: React.ReactNode;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  title = "Something went wrong",
  message,
  actionLabel = "Try again",
  onAction,
  variant = 'error',
  className,
  icon
}) => {
  const variantClasses = {
    error: 'border-red-500/30 bg-red-500/10',
    warning: 'border-yellow-500/30 bg-yellow-500/10',
    info: 'border-blue-500/30 bg-blue-500/10'
  };

  const textColorClasses = {
    error: 'text-red-400 light:text-red-600',
    warning: 'text-yellow-400 light:text-yellow-600',
    info: 'text-blue-400 light:text-blue-600'
  };

  const buttonClasses = {
    error: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
  };

  const defaultIcons = {
    error: "❌",
    warning: "⚠️",
    info: "ℹ️"
  };

  return (
    <div className={cn(
      "p-6 rounded-xl border backdrop-blur-sm",
      variantClasses[variant],
      className
    )}>
      <div className="text-center">
        <div className="text-4xl mb-4">
          {icon || defaultIcons[variant]}
        </div>
        <h3 className={cn("text-lg font-semibold mb-2", textColorClasses[variant])}>
          {title}
        </h3>
        <p className="text-gray-400 light:text-gray-600 mb-6">
          {message}
        </p>
        {onAction && (
          <button
            onClick={onAction}
            className={cn(
              "px-6 py-3 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent",
              buttonClasses[variant]
            )}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export interface ErrorPageProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  title = "Something went wrong",
  message = "We encountered an unexpected error. Please try again.",
  actionLabel = "Go back",
  onAction,
  className,
  children
}) => {
  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      window.history.back();
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center p-4",
      className
    )}>
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">😵</div>
        <h1 className="text-2xl font-bold text-white light:text-gray-800 mb-4">
          {title}
        </h1>
        <p className="text-gray-400 light:text-gray-600 mb-8">
          {message}
        </p>
        
        {children || (
          <button
            onClick={handleAction}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export interface NotFoundProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const NotFound: React.FC<NotFoundProps> = ({
  title = "Page not found",
  message = "The page you're looking for doesn't exist or has been moved.",
  actionLabel = "Go home",
  onAction,
  className
}) => {
  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-[#181622] light:bg-transparent flex items-center justify-center p-4",
      className
    )}>
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="text-4xl font-bold text-white light:text-gray-800 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-300 light:text-gray-700 mb-4">
          {title}
        </h2>
        <p className="text-gray-400 light:text-gray-600 mb-8">
          {message}
        </p>
        <button
          onClick={handleAction}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};

export interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionLabel,
  onAction,
  icon,
  className
}) => {
  return (
    <div className={cn(
      "text-center p-12 bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/30",
      className
    )}>
      <div className="mb-4">
        {icon || <div className="text-6xl">📭</div>}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      {message && (
        <p className="text-gray-400 mb-6">{message}</p>
      )}
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// Toast-style error notifications
export interface ErrorToastProps {
  message: string;
  isVisible: boolean;
  onDismiss: () => void;
  duration?: number;
  variant?: 'error' | 'warning' | 'success' | 'info';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  message,
  isVisible,
  onDismiss,
  duration = 5000,
  variant = 'error',
  position = 'top-right'
}) => {
  React.useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onDismiss]);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  const variantClasses = {
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    success: 'bg-green-600',
    info: 'bg-blue-600'
  };

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed z-50 max-w-sm w-full transition-all duration-300",
      positionClasses[position]
    )}>
      <div className={cn(
        "text-white px-4 py-3 rounded-lg shadow-lg",
        variantClasses[variant]
      )}>
        <div className="flex items-center justify-between">
          <span className="font-medium">{message}</span>
          <button
            onClick={onDismiss}
            className="ml-3 text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};