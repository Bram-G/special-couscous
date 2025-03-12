import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Image, 
  Tooltip,
  useDisclosure,
  Spinner
} from "@heroui/react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Calendar, 
  Eye, 
  Trophy
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import MovieMondaySelector from './MovieMondaySelector';
import { motion, AnimatePresence } from 'framer-motion';

interface WatchlistMovie {
  id: number;
  tmdbMovieId: number;
  title: string;
  posterPath: string;
  watched?: boolean;
  isWinner?: boolean;
}

const WatchlistCarousel: React.FC = () => {
  const { token } = useAuth();
  const [movies, setMovies] = useState<WatchlistMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleMovies, setVisibleMovies] = useState<WatchlistMovie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [moviesPerPage, setMoviesPerPage] = useState(5);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [hoveredMovieId, setHoveredMovieId] = useState<number | null>(null);
  
  // Movie Monday Selector Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [selectedMovieTitle, setSelectedMovieTitle] = useState<string>('');
  const [selectedMoviePoster, setSelectedMoviePoster] = useState<string>('');

  useEffect(() => {
    fetchWatchlist();
    
    // Determine how many movies to show based on window width
    const calculateMoviesPerPage = () => {
      const width = window.innerWidth;
      if (width < 640) return 2; // Mobile
      if (width < 1024) return 3; // Tablet
      if (width < 1280) return 4; // Small desktop
      return 5; // Large desktop
    };
    
    setMoviesPerPage(calculateMoviesPerPage());
    
    // Update on resize
    const handleResize = () => {
      setMoviesPerPage(calculateMoviesPerPage());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [token]);

  // Update visible movies when index or total movies change
  useEffect(() => {
    if (movies.length > 0) {
      // Sort watched/winners to the end
      const sortedMovies = [...movies].sort((a, b) => {
        if (a.isWinner && !b.isWinner) return 1;
        if (!a.isWinner && b.isWinner) return -1;
        return 0;
      });
      
      const endIndex = Math.min(currentIndex + moviesPerPage, sortedMovies.length);
      setVisibleMovies(sortedMovies.slice(currentIndex, endIndex));
    }
  }, [currentIndex, movies, moviesPerPage]);

  const fetchWatchlist = async () => {
    if (!token) return;
  
    try {
      setLoading(true);
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
    if (currentIndex + moviesPerPage < movies.length) {
      setCurrentIndex(prev => prev + moviesPerPage);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => Math.max(0, prev - moviesPerPage));
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    
    try {
      setIsDeleting(id);
      const response = await fetch(`http://localhost:8000/api/movie-monday/watch-later/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        // Remove the movie from the state
        setMovies(prev => prev.filter(movie => movie.id !== id));
        
        // Adjust index if needed
        if (currentIndex > 0 && currentIndex >= movies.length - moviesPerPage) {
          setCurrentIndex(Math.max(0, movies.length - moviesPerPage - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting movie from watchlist:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAddToMovieMonday = (movie: WatchlistMovie) => {
    setSelectedMovieId(movie.tmdbMovieId);
    setSelectedMovieTitle(movie.title);
    setSelectedMoviePoster(movie.posterPath);
    onOpen();
  };

  const handleMovieSelected = async (movieMondayId: number) => {
    if (!token || !selectedMovieId) return;
    
    try {
      const response = await fetch('http://localhost:8000/api/movie-monday/add-movie', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          movieMondayId,
          tmdbMovieId: selectedMovieId,
          title: selectedMovieTitle,
          posterPath: selectedMoviePoster
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to add movie');
      }
      
      // Success! You could show a success message here
      onClose();
    } catch (error) {
      console.error('Error adding movie to Movie Monday:', error);
      // You could show an error message here
    } finally {
      setSelectedMovieId(null);
    }
  };

  // Navigate to movie details page
  const handleMovieClick = (tmdbMovieId: number) => {
    window.open(`/movie/${tmdbMovieId}`, '_blank');
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
          <h4 className="text-lg font-medium">Your Watchlist</h4>
        </CardHeader>
        <CardBody className="flex items-center justify-center h-48">
          <Spinner size="lg" />
        </CardBody>
      </Card>
    );
  }

  if (movies.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
          <h4 className="text-lg font-medium">Your Watchlist</h4>
        </CardHeader>
        <CardBody className="flex flex-col items-center justify-center h-48 gap-3">
          <Eye className="h-10 w-10 text-default-300" />
          <p className="text-default-500">Your watchlist is empty</p>
          <Button 
            as="a" 
            href="/trending" 
            color="primary" 
            variant="flat"
            startContent={<Plus className="h-4 w-4" />}
          >
            Browse movies to add
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
        <h4 className="text-lg font-medium">Your Watchlist</h4>
        <div className="flex items-center gap-2">
          <Tooltip content="Previous page">
            <Button
              isIconOnly
              variant="light"
              onPress={handlePrevious}
              isDisabled={currentIndex === 0}
              className="min-w-unit-10"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Tooltip>
          <Tooltip content="Next page">
            <Button
              isIconOnly
              variant="light"
              onPress={handleNext}
              isDisabled={currentIndex + moviesPerPage >= movies.length}
              className="min-w-unit-10"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </Tooltip>
        </div>
      </CardHeader>
      <CardBody className="px-4 py-2 mb-2">
        <div 
          className="flex gap-4 transition-all duration-300 ease-out" 
          ref={carouselRef}
        >
          {visibleMovies.map((movie) => (
            <div 
              key={movie.id} 
              className={`relative w-48 shrink-0 transition-opacity duration-300 ${
                movie.isWinner ? 'opacity-60' : 'opacity-100'
              }`}
              onMouseEnter={() => setHoveredMovieId(movie.id)}
              onMouseLeave={() => setHoveredMovieId(null)}
              style={{ height: '318px' }}  /* Fixed height to prevent layout shifts */
            >
              {/* Movie card with poster */}
              <div className="w-full h-72 relative rounded-xl overflow-hidden shadow-md">
                {/* Movie poster image */}
                <Image
                  src={movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '/placeholder-poster.jpg'}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-300 cursor-pointer hover:scale-105"
                  onClick={() => handleMovieClick(movie.tmdbMovieId)}
                />
                
                {/* Winner badge if applicable */}
                {movie.isWinner && (
                  <div className="absolute top-2 right-2 z-10 bg-warning rounded-full p-1 shadow-md">
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                )}
                
                {/* Hover menu - with AnimatePresence for clean animations */}
                <AnimatePresence>
                  {hoveredMovieId === movie.id && (
                    <motion.div 
                      className="absolute left-0 right-0 bottom-0 z-50"
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="bg-gradient-to-t from-black to-black/70 p-3 text-white">
                        <p className="text-sm font-medium truncate mb-2">{movie.title}</p>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            color="primary"
                            variant="solid"
                            startContent={<Calendar className="h-3.5 w-3.5" />}
                            onPress={() => handleAddToMovieMonday(movie)}
                            className="w-full"
                          >
                            Add to Monday
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            startContent={<Trash2 className="h-3.5 w-3.5" />}
                            onPress={() => handleDelete(movie.id)}
                            isLoading={isDeleting === movie.id}
                            className="w-full"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Movie title shown below poster */}
              <div className="mt-2 w-full px-1">
                <p className="text-sm font-medium truncate">{movie.title}</p>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
      
      {/* Movie Monday Selector Modal */}
      <MovieMondaySelector
        isOpen={isOpen}
        onOpenChange={onClose}
        onSelect={handleMovieSelected}
        token={token}
      />
    </Card>
  );
};

export default WatchlistCarousel;