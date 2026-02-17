// ============================================================================
// RATIO.RUN - IMAGE HANDLER
// Optimized Amazon image loading with elegant fallback icons
// ============================================================================

import { useState, useEffect } from 'react';

/**
 * Image optimization configuration
 */
export const IMAGE_CONFIG = {
  referrerPolicy: 'no-referrer' as const,
  sizes: {
    thumbnail: { width: 150, height: 150 },
    card: { width: 400, height: 400 },
    detail: { width: 800, height: 800 },
  },
  fallbackIcon: `
    <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="url(#gradient)"/>
      <path d="M100 50C72.4 50 50 72.4 50 100C50 127.6 72.4 150 100 150C127.6 150 150 127.6 150 100C150 72.4 127.6 50 100 50ZM100 140C77.9 140 60 122.1 60 100C60 77.9 77.9 60 100 60C122.1 60 140 77.9 140 100C140 122.1 122.1 140 100 140Z" fill="white" fill-opacity="0.1"/>
      <path d="M100 70C83.4 70 70 83.4 70 100C70 116.6 83.4 130 100 130C116.6 130 130 116.6 130 100C130 83.4 116.6 70 100 70ZM100 120C88.95 120 80 111.05 80 100C80 88.95 88.95 80 100 80C111.05 80 120 88.95 120 100C120 111.05 111.05 120 100 120Z" fill="white" fill-opacity="0.15"/>
      <circle cx="100" cy="100" r="25" fill="white" fill-opacity="0.08"/>
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
          <stop stop-color="#1F2937"/>
          <stop offset="1" stop-color="#111827"/>
        </linearGradient>
      </defs>
    </svg>
  `,
};

/**
 * Optimize Amazon image URL
 * Adds size parameters for better performance
 */
export function optimizeAmazonImageUrl(
  url: string,
  size: 'thumbnail' | 'card' | 'detail' = 'card'
): string {
  if (!url) return '';

  const dimensions = IMAGE_CONFIG.sizes[size];
  
  // Amazon image URL optimization
  // Replace size parameters in URL
  let optimizedUrl = url;
  
  // Common patterns to replace
  const patterns = [
    /\._[A-Z0-9]+_\./,  // ._SX500_.jpg -> ._SX400_.jpg
    /\._[A-Z]{2}\d+_\./,  // ._SL500_.jpg
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(optimizedUrl)) {
      optimizedUrl = optimizedUrl.replace(
        pattern,
        `._SX${dimensions.width}_.`
      );
      return optimizedUrl;
    }
  }
  
  // If no pattern matched, try appending size
  if (optimizedUrl.includes('images-amazon.com')) {
    const extension = optimizedUrl.match(/\.(jpg|jpeg|png|webp)$/i)?.[0] || '.jpg';
    optimizedUrl = optimizedUrl.replace(
      extension,
      `._SX${dimensions.width}_${extension}`
    );
  }
  
  return optimizedUrl;
}

/**
 * Custom hook for image loading with fallback
 */
export function useImageLoader(imageUrl: string) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [optimizedUrl, setOptimizedUrl] = useState<string>('');

  useEffect(() => {
    if (!imageUrl) {
      setStatus('error');
      return;
    }

    setStatus('loading');
    const optimized = optimizeAmazonImageUrl(imageUrl);
    setOptimizedUrl(optimized);

    const img = new Image();
    
    img.onload = () => {
      setStatus('loaded');
    };
    
    img.onerror = () => {
      setStatus('error');
    };

    img.src = optimized;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  return { status, optimizedUrl };
}

/**
 * Get fallback icon as data URL
 */
export function getFallbackIconDataUrl(): string {
  return `data:image/svg+xml;base64,${btoa(IMAGE_CONFIG.fallbackIcon)}`;
}

/**
 * Preload critical images
 */
export function preloadImages(urls: string[]): void {
  if (typeof window === 'undefined') return;

  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = optimizeAmazonImageUrl(url);
    document.head.appendChild(link);
  });
}

/**
 * Get responsive srcset for image
 */
export function getResponsiveSrcSet(baseUrl: string): string {
  const sizes = [300, 400, 600, 800];
  
  return sizes
    .map(size => {
      const url = optimizeAmazonImageUrl(baseUrl, 
        size <= 300 ? 'thumbnail' : 
        size <= 500 ? 'card' : 
        'detail'
      );
      return `${url} ${size}w`;
    })
    .join(', ');
}

/**
 * Component-ready image props
 */
export interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  onError?: () => void;
}

export function getOptimizedImageProps(
  url: string,
  alt: string,
  size: 'thumbnail' | 'card' | 'detail' = 'card'
): OptimizedImageProps {
  return {
    src: optimizeAmazonImageUrl(url, size),
    alt,
    className: 'object-cover',
  };
}
