import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Image, Card, Spinner } from "@heroui/react";

// Lazy load the VHS component to avoid loading Three.js unnecessarily
const VHSTape = lazy(() => import('./VHSTape'));

const VHSMovieItem = ({ 
  movie, 
  width = 270, 
  height = 180,
  enable3D = true, // Prop to allow disabling 3D mode from parent
  onMovieClick,
  className = "" 
}) => {
  const [use3D, setUse3D] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hadError, setHadError] = useState(false);
  
  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
    : '/placeholder-poster.jpg';

  // Check if we should use 3D mode
  useEffect(() => {
    if (!enable3D) {
      setUse3D(false);
      setIsLoading(false);
      return;
    }
    
    // Basic feature detection
    const checkFeatureSupport = () => {
      // Check for WebGL support
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        // Check if WebGL is supported
        if (!gl) {
          console.log('WebGL not supported, falling back to 2D mode');
          return false;
        }
        
        // Check if device is likely a mobile with low power
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isLowPower = isMobile && !(/iPad|Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
        
        if (isLowPower) {
          console.log('Low power device detected, falling back to 2D mode');
          return false;
        }
        
        // Check if reduced motion is preferred
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          console.log('Reduced motion preference detected, falling back to 2D mode');
          return false;
        }
        
        // Check if the device might struggle with 3D
        const isOldDevice = /MSIE|Trident|Edge\/12|Edge\/13|Edge\/14|Edge\/15/i.test(navigator.userAgent);
        if (isOldDevice) {
          console.log('Older browser detected, falling back to 2D mode');
          return false;
        }
        
        // If all checks pass, enable 3D
        return true;
      } catch (e) {
        console.error('Error during feature detection:', e);
        return false;
      }
    };
    
    // Use 3D if supported
    const shouldUse3D = checkFeatureSupport();
    setUse3D(shouldUse3D);
    
    // If not using 3D, we're not loading
    if (!shouldUse3D) {
      setIsLoading(false);
    }
  }, [enable3D]);

  // Handle 3D loading completion or error
  const handleLoaded = () => {
    setIsLoading(false);
  };
  
  const handleError = (error) => {
    console.error('VHS rendering error:', error);
    setHadError(true);
    setUse3D(false);
    setIsLoading(false);
  };

  // Handle click on the movie item
  const handleClick = () => {
    if (onMovieClick) {
      onMovieClick(movie.id || movie.tmdbMovieId);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card className={`w-full flex justify-center items-center ${className}`} style={{ height }}>
        <Spinner size="lg" />
      </Card>
    );
  }

  // Render 2D fallback
  if (!use3D || hadError) {
    return (
      <Card 
        className={`w-full cursor-pointer transition-transform hover:scale-105 ${className}`}
        isPressable
        onClick={handleClick}
      >
        <Image
          src={posterUrl}
          alt={movie.title}
          className="object-cover rounded-xl"
          style={{ height }}
          removeWrapper
        />
        <div className="p-2">
          <p className="text-sm font-medium line-clamp-1">{movie.title}</p>
        </div>
      </Card>
    );
  }

  // Render 3D VHS
  return (
    <div 
      className={`w-full cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <Suspense fallback={
        <Card className="w-full flex justify-center items-center" style={{ height }}>
          <Spinner size="lg" />
        </Card>
      }>
        <div className="flex justify-center mb-2">
          <VHSTape 
            posterUrl={posterUrl}
            width={width}
            height={height}
            onError={handleError}
          />
        </div>
        <div className="p-2 text-center">
          <p className="text-sm font-medium line-clamp-1">{movie.title}</p>
        </div>
      </Suspense>
    </div>
  );
};

export default VHSMovieItem;