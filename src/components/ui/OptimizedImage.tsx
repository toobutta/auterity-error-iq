import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../utils/cn.js';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  onLoad,
  onError,
  placeholder,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate WebP and fallback sources
  const generateSources = useCallback((originalSrc: string) => {
    const webpSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    return { webpSrc, fallbackSrc: originalSrc };
  }, []);

  useEffect(() => {
    const supportsWebP = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    };

    const { webpSrc, fallbackSrc } = generateSources(src);
    setCurrentSrc(supportsWebP() ? webpSrc : fallbackSrc);
  }, [src, generateSources]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div className={cn('optimized-image', className)} style={{ position: 'relative' }}>
      {!isLoaded && !hasError && (
        <div
          className="image-placeholder"
          style={{
            width: width || '100%',
            height: height || 200,
            background: placeholder || '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
          }}
        >
          Loading...
        </div>
      )}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          display: isLoaded ? 'block' : 'none',
          width: '100%',
          height: 'auto',
          borderRadius: '4px',
        }}
        {...props}
      />
      {hasError && (
        <div
          className="image-error"
          style={{
            width: width || '100%',
            height: height || 200,
            background: '#ffe6e6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d32f2f',
            borderRadius: '4px',
          }}
        >
          Failed to load image
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
