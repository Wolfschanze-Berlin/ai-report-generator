'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ImageComponent as ImageComponentType } from '@/types/report-schema';

interface ImageComponentProps {
  component: ImageComponentType;
}

export function ImageComponent({ component }: ImageComponentProps) {
  const { src, alt = '', fit = 'contain', caption } = component.data;
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Map fit modes to Next.js Image objectFit
  const objectFitMap = {
    contain: 'contain' as const,
    cover: 'cover' as const,
    fill: 'fill' as const,
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Check if it's a data URL
  const isDataUrl = src.startsWith('data:');

  return (
    <div className="w-full h-full flex flex-col">
      {/* Image Container */}
      <div className="relative flex-1 bg-muted/20 rounded-lg overflow-hidden">
        {/* Loading State */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Loading image...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="flex flex-col items-center gap-3 text-center p-6">
              <svg
                className="w-16 h-16 text-muted-foreground/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-foreground">Failed to load image</p>
                <p className="text-xs text-muted-foreground mt-1">The image could not be displayed</p>
              </div>
            </div>
          </div>
        )}

        {/* Image */}
        {!hasError && (
          <div className={`relative w-full h-full ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
            {isDataUrl ? (
              // Data URL - use regular img tag with object-fit
              <img
                src={src}
                alt={alt}
                onLoad={handleLoadingComplete}
                onError={handleError}
                className="w-full h-full"
                style={{ objectFit: objectFitMap[fit] }}
              />
            ) : (
              // External URL - use Next.js Image for optimization
              <Image
                src={src}
                alt={alt}
                fill
                style={{ objectFit: objectFitMap[fit] }}
                onLoad={handleLoadingComplete}
                onError={handleError}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
              />
            )}
          </div>
        )}
      </div>

      {/* Caption */}
      {caption && (
        <div className="mt-3 px-2">
          <p className="text-sm text-muted-foreground text-center italic">
            {caption}
          </p>
        </div>
      )}
    </div>
  );
}
