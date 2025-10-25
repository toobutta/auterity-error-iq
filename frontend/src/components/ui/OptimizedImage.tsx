import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../utils/cn';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  quality?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
}

/**
 * Optimized Image Component with WebP support and lazy loading
 * Implements performance best practices for Core Web Vitals
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  sizes = '100vw',
  quality = 75,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  className,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate WebP and fallback sources
  const generateSources = useCallback((originalSrc: string) => {
    const baseUrl = originalSrc.split('?')[0];
    const params = new URLSearchParams(originalSrc.split('?')[1] || '');

    // Add quality parameter
    params.set('q', quality.toString());

    const webpSrc = `${baseUrl}?${params}&fmt=webp`;
    const fallbackSrc = `${baseUrl}?${params}`;

    return { webpSrc, fallbackSrc };
  }, [quality]);

  useEffect(() => {
    if (!src) return;

    const { webpSrc, fallbackSrc } = generateSources(src);

    // Check WebP support
    const checkWebPSupport = () => {
      return new Promise<boolean>((resolve) => {
        const webP = new Image();
        webP.onload = webP.onerror = () => {
          resolve(webP.height === 2);
        };
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
      });
    };

    checkWebPSupport().then((supportsWebP) => {
      setCurrentSrc(supportsWebP ? webpSrc : fallbackSrc);
    });
  }, [src, generateSources]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate responsive sizes
  const generateSrcSet = (baseSrc: string) => {
    if (!width) return baseSrc;

    const breakpoints = [320, 640, 768, 1024, 1280, 1536];
    const srcSet = breakpoints
      .filter(bp => bp <= (width * 2)) // Don't generate larger than 2x the original
      .map(bp => {
        const scale = Math.min(bp / width, 2);
        const newWidth = Math.round(width * scale);
        const srcWithWidth = baseSrc.replace(/(\?|&)w=\d+/, `$1w=${newWidth}`);
        return `${srcWithWidth} ${newWidth}w`;
      })
      .join(', ');

    return srcSet || baseSrc;
  };

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          className
        )}
        style={{ width, height }}
        role="img"
        aria-label={`Failed to load image: ${alt}`}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Blur placeholder */}
      {placeholder === 'blur' && blurDataURL && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={currentSrc}
        srcSet={width ? generateSrcSet(currentSrc) : undefined}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...props}
      />

      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

// Preload critical images
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Preload multiple images
export const preloadImages = (sources: string[]): Promise<void[]> => {
  return Promise.all(sources.map(preloadImage));
};

export default OptimizedImage;


