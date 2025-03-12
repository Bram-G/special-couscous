import React, { useState, useEffect } from 'react';
import { Card, CardBody, Image, Button, Spinner } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from 'next/link';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
}

interface EnhancedRecommendationsProps {
  movieId: string | null;
}

const EnhancedRecommendations: React.FC<EnhancedRecommendationsProps> = ({ movieId }) => {
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Number of visible items based on screen width
  const [visibleItems, setVisibleItems] = useState(4);
  
  useEffect(() => {
    // Function to handle resize and update visible items
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisibleItems(1);
      } else if (window.innerWidth < 768) {
        setVisibleItems(2);
      } else if (window.innerWidth < 1024) {
        setVisibleItems(3);
      } else {
        setVisibleItems(4);
      }
    };

    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
  }, [movieId]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => 
      (prev < recommendations.length - visibleItems ? prev + 1 : prev)
    );
  };

  // Format release year
  const getYear = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).getFullYear();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-default-500 p-8">
        {error}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center text-default-500 p-8">
        No recommendations available.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center">
        <Button
          isIconOnly
          variant="light"
          onPress={handlePrevious}
          disabled={currentIndex === 0}
          className="mr-2 z-10"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        <div className="flex-1 overflow-hidden">
          <div
            className="flex transition-transform duration-300"
            style={{
              transform: `translateX(-${currentIndex * (100 / visibleItems)}%)`,
              width: `${(recommendations.length * 100) / visibleItems}%`,
            }}
          >
            {recommendations.map((movie) => (
              <div
                key={movie.id}
                className="pr-4"
                style={{ width: `${100 / visibleItems}%` }}
              >
                <Link href={`/movie/${movie.id}`} legacyBehavior>
                  <a className="block">
                    <Card className="w-full h-full hover:shadow-md transition-shadow cursor-pointer overflow-hidden group">
                      <CardBody className="p-0 relative">
                        {/* Poster image */}
                        <div className="relative aspect-[2/3] w-full">
                          <Image
                            src={
                              movie.poster_path
                                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                                : '/placeholder-poster.jpg'
                            }
                            alt={movie.title}
                            className="object-cover w-full h-full transform transition-transform group-hover:scale-105"
                            removeWrapper
                          />
                          
                          {/* Gradient overlay for text readability */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-24"></div>
                          
                          {/* Rating badge */}
                          {movie.vote_average > 0 && (
                            <div className="absolute top-2 right-2 bg-primary rounded-full w-10 h-10 flex items-center justify-center text-white font-bold text-sm">
                              {movie.vote_average.toFixed(1)}
                            </div>
                          )}
                        </div>
                        
                        {/* Movie info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                          <h3 className="font-medium text-sm line-clamp-1">{movie.title}</h3>
                          {movie.release_date && (
                            <p className="text-xs opacity-80">{getYear(movie.release_date)}</p>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  </a>
                </Link>
              </div>
            ))}
          </div>
        </div>
        
        <Button
          isIconOnly
          variant="light"
          onPress={handleNext}
          disabled={currentIndex >= recommendations.length - visibleItems}
          className="ml-2 z-10"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default EnhancedRecommendations;