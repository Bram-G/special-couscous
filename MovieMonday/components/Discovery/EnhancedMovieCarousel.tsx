import React, { useState, useRef, useEffect } from "react";
import { Button, Card, Spinner, Tooltip } from "@heroui/react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import FixedMovieDiscoveryCard from "./FixedMovieDiscoveryCard";

interface Movie {
  id: number;
  title: string;
  poster_path?: string;
  release_date?: string;
  vote_average?: number;
}

interface EnhancedMovieCarouselProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  loading?: boolean;
  emptyMessage?: string;
  onSuccess?: () => void;
  reason?: (movie: Movie) => { type: string; text: string; detail?: string } | null;
}

const EnhancedMovieCarousel: React.FC<EnhancedMovieCarouselProps> = ({
  title,
  subtitle,
  movies,
  loading = false,
  emptyMessage = "No movies found",
  reason
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [slidesToShow, setSlidesToShow] = useState(5);
  
  // Calculate how many slides to show based on screen width
  useEffect(() => {
    const updateSlidesToShow = () => {
      const width = window.innerWidth;
      if (width < 640) setSlidesToShow(2);
      else if (width < 768) setSlidesToShow(3);
      else if (width < 1280) setSlidesToShow(4);
      else setSlidesToShow(5);
    };
    
    updateSlidesToShow();
    window.addEventListener('resize', updateSlidesToShow);
    return () => window.removeEventListener('resize', updateSlidesToShow);
  }, []);

  // Calculate if we can navigate forward or backward
  const canGoNext = currentIndex + slidesToShow < movies.length;
  const canGoPrevious = currentIndex > 0;
  
  // Get visible movies for the current "page"
  const visibleMovies = movies.slice(currentIndex, currentIndex + slidesToShow);
  
  // Handle navigation
  const goNext = () => {
    if (canGoNext) {
      // Move by a full "page" of movies instead of just one
      const nextIndex = Math.min(currentIndex + slidesToShow, movies.length - slidesToShow);
      setCurrentIndex(nextIndex);
    }
  };
  
  const goPrevious = () => {
    if (canGoPrevious) {
      // Move by a full "page" of movies instead of just one
      const prevIndex = Math.max(currentIndex - slidesToShow, 0);
      setCurrentIndex(prevIndex);
    }
  };

  if (loading) {
    return (
      <div className="mb-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          {subtitle && <p className="text-default-500 text-sm">{subtitle}</p>}
        </div>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="mb-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          {subtitle && <p className="text-default-500 text-sm">{subtitle}</p>}
        </div>
        <Card className="w-full">
          <div className="flex flex-col items-center justify-center p-8">
            <Info className="h-12 w-12 text-default-300 mb-4" />
            <p className="text-center text-lg">{emptyMessage}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {subtitle && <p className="text-default-500 text-sm">{subtitle}</p>}
        </div>
        
        {/* Navigation controls - always visible */}
        <div className="flex gap-2">
          <Button
            isIconOnly
            variant="flat"
            onPress={goPrevious}
            isDisabled={!canGoPrevious}
            className="rounded-full"
            size="sm"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            isIconOnly
            variant="flat"
            onPress={goNext}
            isDisabled={!canGoNext}
            className="rounded-full"
            size="sm"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Carousel - using CSS grid for consistent sizing */}
      <div ref={carouselRef} className="relative overflow-hidden">
                  <div 
          className={`grid grid-cols-${slidesToShow} gap-4`}
          style={{ 
            display: 'grid',
            gridTemplateColumns: `repeat(${slidesToShow}, minmax(0, 1fr))`,
            gap: '1rem'
          }}
        >
          {visibleMovies.map((movie) => (
            <div key={movie.id} className="aspect-[2/3]">
              <FixedMovieDiscoveryCard 
                movie={movie}
                reason={reason ? reason(movie) : null}
              />
            </div>
          ))}
          
          {/* Fill empty slots with placeholder elements to maintain grid */}
          {visibleMovies.length < slidesToShow && 
            Array(slidesToShow - visibleMovies.length).fill(0).map((_, index) => (
              <div key={`placeholder-${index}`} className="w-full"></div>
            ))
          }
        </div>
        
        {/* Progress indicator */}
        {movies.length > slidesToShow && (
          <div className="flex justify-center mt-4 gap-1">
            {Array(Math.ceil(movies.length / slidesToShow)).fill(0).map((_, index) => {
              const isActive = Math.floor(currentIndex / slidesToShow) === index;
              return (
                <div 
                  key={index}
                  className={`h-1 rounded-full transition-all ${isActive ? 'w-8 bg-primary' : 'w-4 bg-default-200'}`}
                ></div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMovieCarousel;