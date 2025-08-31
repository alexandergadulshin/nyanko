"use client";

import React, { useState, useCallback, forwardRef } from "react";
import { cn } from "~/lib/utils";

export interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onError' | 'onLoad'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  fallbackType?: 'anime' | 'manga' | 'character' | 'person' | 'generic';
  aspectRatio?: 'square' | '3/4' | '16/9' | '4/3' | 'auto';
  lazy?: boolean;
  blur?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  showLoadingState?: boolean;
  errorIcon?: React.ReactNode;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  onError?: (error: string) => void;
  retryAttempts?: number;
  retryDelay?: number;
  className?: string;
}

const fallbackImages = {
  anime: '/placeholder-anime.jpg',
  manga: '/placeholder-manga.jpg', 
  character: '/placeholder-character.jpg',
  person: '/placeholder-person.jpg',
  generic: '/placeholder-image.jpg'
};

const aspectRatioClasses = {
  'square': 'aspect-square',
  '3/4': 'aspect-[3/4]',
  '16/9': 'aspect-video',
  '4/3': 'aspect-[4/3]',
  'auto': ''
};

const roundedClasses = {
  'none': '',
  'sm': 'rounded-sm',
  'md': 'rounded-md', 
  'lg': 'rounded-lg',
  'xl': 'rounded-xl',
  'full': 'rounded-full'
};

const objectFitClasses = {
  'cover': 'object-cover',
  'contain': 'object-contain',
  'fill': 'object-fill',
  'scale-down': 'object-scale-down',
  'none': 'object-none'
};

export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(({
  src,
  alt,
  fallbackSrc,
  fallbackType = 'generic',
  aspectRatio = 'auto',
  lazy = true,
  blur = true,
  rounded = 'md',
  objectFit = 'cover',
  showLoadingState = true,
  errorIcon,
  onLoadStart,
  onLoadComplete,
  onError,
  retryAttempts = 3,
  retryDelay = 1000,
  className,
  ...props
}, ref) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [attempts, setAttempts] = useState(0);

  const finalFallbackSrc = fallbackSrc ?? fallbackImages[fallbackType];

  const handleLoadStart = useCallback(() => {
    setLoading(true);
    setError(false);
    onLoadStart?.();
  }, [onLoadStart]);

  const handleLoadComplete = useCallback(() => {
    setLoading(false);
    setError(false);
    onLoadComplete?.();
  }, [onLoadComplete]);

  const handleError = useCallback(async () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    // Try to retry with the same URL first
    if (newAttempts <= retryAttempts && currentSrc === src) {
      await new Promise(resolve => setTimeout(resolve, retryDelay * newAttempts));
      
      // Force reload by adding timestamp
      const retryUrl = src.includes('?') 
        ? `${src}&retry=${newAttempts}&t=${Date.now()}`
        : `${src}?retry=${newAttempts}&t=${Date.now()}`;
      
      setCurrentSrc(retryUrl);
      return;
    }

    // If retries failed and we haven't tried the fallback yet
    if (currentSrc !== finalFallbackSrc && finalFallbackSrc) {
      setCurrentSrc(finalFallbackSrc);
      setAttempts(0); // Reset attempts for fallback
      return;
    }

    // All options exhausted
    setLoading(false);
    setError(true);
    onError?.(`Failed to load image after ${retryAttempts} attempts`);
  }, [attempts, retryAttempts, retryDelay, currentSrc, src, finalFallbackSrc, onError]);

  const baseClasses = cn(
    "transition-all duration-300",
    aspectRatioClasses[aspectRatio],
    roundedClasses[rounded],
    objectFitClasses[objectFit],
    blur && loading && "blur-sm",
    loading && "opacity-75",
    className
  );

  // Error state
  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gray-800/40 border border-gray-700/40",
        aspectRatioClasses[aspectRatio],
        roundedClasses[rounded],
        className
      )}>
        {errorIcon || (
          <div className="text-center text-gray-400 p-4">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Image unavailable</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative", aspectRatio !== 'auto' && aspectRatioClasses[aspectRatio])}>
      {loading && showLoadingState && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-gray-800/40 border border-gray-700/40",
          roundedClasses[rounded]
        )}>
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent" />
        </div>
      )}

      <img
        ref={ref}
        src={currentSrc}
        alt={alt}
        className={baseClasses}
        loading={lazy ? "lazy" : "eager"}
        decoding="async"
        onLoadStart={handleLoadStart}
        onLoad={handleLoadComplete}
        onError={handleError}
        {...props}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// Specialized image components for common use cases
export interface AnimeImageProps extends Omit<OptimizedImageProps, 'fallbackType'> {}

export const AnimeImage = forwardRef<HTMLImageElement, AnimeImageProps>((props, ref) => (
  <OptimizedImage
    ref={ref}
    fallbackType="anime"
    aspectRatio="3/4"
    {...props}
  />
));

AnimeImage.displayName = 'AnimeImage';

export interface MangaImageProps extends Omit<OptimizedImageProps, 'fallbackType'> {}

export const MangaImage = forwardRef<HTMLImageElement, MangaImageProps>((props, ref) => (
  <OptimizedImage
    ref={ref}
    fallbackType="manga"
    aspectRatio="3/4"
    {...props}
  />
));

MangaImage.displayName = 'MangaImage';

export interface CharacterImageProps extends Omit<OptimizedImageProps, 'fallbackType'> {}

export const CharacterImage = forwardRef<HTMLImageElement, CharacterImageProps>((props, ref) => (
  <OptimizedImage
    ref={ref}
    fallbackType="character"
    aspectRatio="3/4"
    {...props}
  />
));

CharacterImage.displayName = 'CharacterImage';

export interface PersonImageProps extends Omit<OptimizedImageProps, 'fallbackType'> {}

export const PersonImage = forwardRef<HTMLImageElement, PersonImageProps>((props, ref) => (
  <OptimizedImage
    ref={ref}
    fallbackType="person"
    aspectRatio="square"
    {...props}
  />
));

PersonImage.displayName = 'PersonImage';

export interface ProfileImageProps extends Omit<OptimizedImageProps, 'fallbackType' | 'aspectRatio' | 'rounded'> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const ProfileImage = forwardRef<HTMLImageElement, ProfileImageProps>(({
  size = 'md',
  className,
  ...props
}, ref) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20'
  };

  return (
    <OptimizedImage
      ref={ref}
      fallbackType="person"
      aspectRatio="square"
      rounded="full"
      className={cn(sizeClasses[size], className)}
      {...props}
    />
  );
});

ProfileImage.displayName = 'ProfileImage';

// Image gallery component for multiple images
export interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  columns?: number;
  gap?: number;
  aspectRatio?: OptimizedImageProps['aspectRatio'];
  rounded?: OptimizedImageProps['rounded'];
  className?: string;
  onImageClick?: (index: number) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  columns = 3,
  gap = 4,
  aspectRatio = 'square',
  rounded = 'lg',
  className,
  onImageClick
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  };

  const gapClasses = {
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8'
  };

  return (
    <div className={cn(
      "grid",
      gridClasses[columns as keyof typeof gridClasses] || 'grid-cols-3',
      gapClasses[gap as keyof typeof gapClasses] || 'gap-4',
      className
    )}>
      {images.map((image, index) => (
        <div key={index} className="space-y-2">
          <OptimizedImage
            src={image.src}
            alt={image.alt}
            aspectRatio={aspectRatio}
            rounded={rounded}
            className={cn(
              "w-full transition-transform duration-200",
              onImageClick && "cursor-pointer hover:scale-105"
            )}
            onClick={() => onImageClick?.(index)}
          />
          {image.caption && (
            <p className="text-sm text-gray-400 text-center">{image.caption}</p>
          )}
        </div>
      ))}
    </div>
  );
};

// Progressive image loader for better UX
export interface ProgressiveImageProps extends OptimizedImageProps {
  placeholder?: string;
  placeholderBlur?: boolean;
}

export const ProgressiveImage = forwardRef<HTMLImageElement, ProgressiveImageProps>(({
  src,
  placeholder,
  placeholderBlur = true,
  className,
  ...props
}, ref) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="relative">
      {placeholder && !imageLoaded && (
        <OptimizedImage
          src={placeholder}
          alt=""
          className={cn(
            "absolute inset-0 z-0",
            placeholderBlur && "blur-sm scale-110",
            className
          )}
          showLoadingState={false}
          lazy={false}
        />
      )}
      <OptimizedImage
        ref={ref}
        src={src}
        className={cn(
          "relative z-10 transition-opacity duration-300",
          !imageLoaded && "opacity-0",
          className
        )}
        onLoadComplete={() => setImageLoaded(true)}
        {...props}
      />
    </div>
  );
});

ProgressiveImage.displayName = 'ProgressiveImage';