import React, { useState, useEffect, useRef } from "react";
import { Button, Card, Spinner } from "@heroui/react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import FixedMovieDiscoveryCard from "../Discovery/FixedMovieDiscoveryCard";

interface Movie {
  id: number;
  title: string;
  poster_path?: string;
  release_date?: string;
  vote_average?: number;
}

interface EnhancedRecommendationsProps {
  movieId: string | null;
}

const EnhancedRecommendations: React.FC<EnhancedRecommendationsProps> = ({ movieId }) => {
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [slidesToShow, setSlidesToShow] = useState(5);
  
  // Calculate how many slides to show based on screen width (same logic as EnhancedMovieCarousel)
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

  // Fetch recommendations whenever movieId changes
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!movieId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${process.env.NEXT_PUBLIC_API_Key}&language=en-US&page=1`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          setRecommendations(data.results);
        } else {
          // If no recommendations, try similar movies
          const similarResponse = await fetch(
            `https://api.themoviedb.org/3/movie/${movieId}/similar?api_key=${process.env.NEXT_PUBLIC_API_Key}&language=en-US&page=1`
          );
          
          if (!similarResponse.ok) {
            throw new Error('Failed to fetch similar movies');
          }
          
          const similarData = await similarResponse.json();
          setRecommendations(similarData.results || []);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
    // Reset index when movieId changes
    setCurrentIndex(0);
  }, [movieId]);

  // Calculate if we can navigate forward or backward
  const canGoNext = currentIndex + slidesToShow < recommendations.length;
  const canGoPrevious = currentIndex > 0;
  
  // Get visible movies for the current "page"
  const visibleMovies = recommendations.slice(currentIndex, currentIndex + slidesToShow);
  
  // Handle navigation (same logic as EnhancedMovieCarousel)
  const goNext = () => {
    if (canGoNext) {
      // Move by a full "page" of movies instead of just one
      const nextIndex = Math.min(currentIndex + slidesToShow, recommendations.length - slidesToShow);
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
          <h2 className="text-xl font-bold">Similar Movies</h2>
          <p className="text-default-500 text-sm">Movies you might also enjoy</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="mb-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Similar Movies</h2>
          <p className="text-default-500 text-sm">Movies you might also enjoy</p>
        </div>
        <Card className="w-full">
          <div className="flex flex-col items-center justify-center p-8">
            <Info className="h-12 w-12 text-default-300 mb-4" />
            <p className="text-center text-lg">No recommendations available</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-10">
      {/* Header - matches EnhancedMovieCarousel style */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Similar Movies</h2>
          <p className="text-default-500 text-sm">Movies you might also enjoy</p>
        </div>
        
        {/* Navigation controls - always visible, same style as EnhancedMovieCarousel */}
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
      
      {/* Carousel - using CSS grid for consistent sizing, same as EnhancedMovieCarousel */}
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
                compact={true}
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
        
        {/* Progress indicator - same as EnhancedMovieCarousel */}
        {recommendations.length > slidesToShow && (
          <div className="flex justify-center mt-4 gap-1">
            {Array(Math.ceil(recommendations.length / slidesToShow)).fill(0).map((_, index) => {
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

export default EnhancedRecommendations;