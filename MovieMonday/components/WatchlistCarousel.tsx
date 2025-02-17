import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Image } from "@nextui-org/react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

interface WatchlistMovie {
  id: number;
  tmdbMovieId: number;
  title: string;
  posterPath: string;
}

const WatchlistCarousel = () => {
  const { token } = useAuth();
  const [movies, setMovies] = useState<WatchlistMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [startIndex, setStartIndex] = useState(0);
  const moviesPerPage = 4;

  useEffect(() => {
    fetchWatchlist();
  }, [token]);

  const fetchWatchlist = async () => {
    if (!token) return;
  
    try {
      const response = await fetch('http://localhost:8000/api/movie-monday/watch-later', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Watch later error:', errorData);
        return;
      }
  
      const data = await response.json();
      setMovies(data);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (startIndex + moviesPerPage < movies.length) {
      setStartIndex(prev => prev + moviesPerPage);
    }
  };

  const handlePrevious = () => {
    if (startIndex > 0) {
      setStartIndex(prev => prev - moviesPerPage);
    }
  };

  const handleAddToMonday = async (movieId: number) => {
    // TODO: Implement adding to next Monday
    console.log('Adding movie to next Monday:', movieId);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardBody className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
        <h4 className="text-lg font-medium">Your Watchlist</h4>
      </CardHeader>
      <CardBody>
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="light"
            onPress={handlePrevious}
            isDisabled={startIndex === 0}
            className="min-w-unit-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div className="flex-1 grid grid-cols-4 gap-4">
            {movies.slice(startIndex, startIndex + moviesPerPage).map((movie) => (
              <div key={movie.id} className="relative group">
                <Image
                  src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
                  alt={movie.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
                  <p className="text-white text-sm font-medium text-center px-2">
                    {movie.title}
                  </p>
                  <Button
                    isIconOnly
                    color="primary"
                    size="sm"
                    onPress={() => handleAddToMonday(movie.tmdbMovieId)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            isIconOnly
            variant="light"
            onPress={handleNext}
            isDisabled={startIndex + moviesPerPage >= movies.length}
            className="min-w-unit-10"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default WatchlistCarousel;