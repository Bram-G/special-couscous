// Updated MovieCarouselRow.tsx with fixed height and improved layout
import React, { useState, useRef, useEffect } from "react";
import { Card, Image, Button, Spinner, useDisclosure } from "@heroui/react";
import { Heart, ChevronLeft, ChevronRight, Eye, Info } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AddToWatchlistModal from "../Watchlist/AddToWatchlistModal";

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  release_date?: string;
  vote_average?: number;
}

interface MovieCarouselRowProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  loading?: boolean;
  emptyMessage?: string;
  onSuccess?: () => void;
  watchlistStatus?: Record<number, boolean>;
  onAddToWatchlist?: (movie: Movie) => Promise<void>;
  reason?: (
    movie: Movie
  ) => { type: string; text: string; detail?: string } | null;
}

const MovieCarouselRow: React.FC<MovieCarouselRowProps> = ({
  title,
  subtitle,
  movies,
  loading = false,
  emptyMessage = "No movies found",
  onSuccess,
  onAddToWatchlist,
  reason,
}) => {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const [hoveredMovieId, setHoveredMovieId] = useState<number | null>(null);
  const [watchlistStatus, setWatchlistStatus] = useState<
    Record<number, boolean>
  >({});
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>(
    {}
  );
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Add missing state for currentIndex and moviesPerPage
  const [currentIndex, setCurrentIndex] = useState(0);
  const [moviesPerPage, setMoviesPerPage] = useState(5);

  // For add to watchlist modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  
  // Effect to calculate moviesPerPage based on screen width
  useEffect(() => {
    const calculateMoviesPerPage = () => {
      if (!carouselRef.current) return 5;
      
      const containerWidth = carouselRef.current.offsetWidth;
      
      if (containerWidth < 640) return 2; // Mobile
      if (containerWidth < 1024) return 3; // Tablet
      if (containerWidth < 1280) return 4; // Small desktop
      return 5; // Large desktop
    };
    
    const handleResize = () => {
      setMoviesPerPage(calculateMoviesPerPage());
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isAuthenticated && token && movies.length > 0) {
      checkWatchlistStatus();
    }
  }, [movies, token, isAuthenticated]);

  // Add navigation handlers
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

  const checkWatchlistStatus = async () => {
    if (!token) return;

    try {
      // Create a set of movie IDs to check
      const movieIds = movies.map((movie) => movie.id);

      // Check status for each movie
      const statuses: Record<number, boolean> = {};

      await Promise.all(
        movieIds.map(async (id) => {
          try {
            const response = await fetch(
              `http://localhost:8000/api/watchlists/status/${id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                credentials: "include",
              }
            );

            if (response.ok) {
              const data = await response.json();
              statuses[id] = data.inWatchlist;
            }
          } catch (error) {
            console.error(`Error checking status for movie ${id}:`, error);
          }
        })
      );

      setWatchlistStatus(statuses);
    } catch (error) {
      console.error("Error checking watchlist statuses:", error);
    }
  };

  const handleAddToWatchlist = async (movie: Movie) => {
    if (!token || loadingStates[movie.id]) return;

    setLoadingStates((prev) => ({ ...prev, [movie.id]: true }));

    try {
      // Use the quick-add endpoint to add to default watchlist
      const response = await fetch(
        "http://localhost:8000/api/watchlists/quick-add",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            tmdbMovieId: movie.id,
            title: movie.title,
            posterPath: movie.poster_path,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add movie to watchlist");
      }

      // Update the watchlist status
      setWatchlistStatus((prev) => ({
        ...prev,
        [movie.id]: true,
      }));

      // If there's a success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error adding to watchlist:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [movie.id]: false }));
    }
  };

  const handleOpenWatchlistModal = (movie: Movie) => {
    setSelectedMovie(movie);
    onOpen();
  };

  // Function to get movie release year
  const getReleaseYear = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).getFullYear();
  };

  // Calculate if we can navigate left or right
  const canGoNext =
    movies.length > 0 && currentIndex + moviesPerPage < movies.length;
  const canGoPrevious = currentIndex > 0;

  // Get the visible movies for the current page
  const visibleMovies = movies.slice(
    currentIndex,
    currentIndex + moviesPerPage
  );

  if (loading) {
    return (
      <div className="mb-12">
        <div className="mb-2">
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
      <div className="mb-12">
        <div className="mb-2">
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
    <div className="mb-12">
      <div className="mb-2">
        <h2 className="text-xl font-bold">{title}</h2>
        {subtitle && <p className="text-default-500 text-sm">{subtitle}</p>}
      </div>

      <div className="relative" ref={carouselRef}>
        {/* Left navigation button */}
        {canGoPrevious && (
          <Button
            isIconOnly
            variant="flat"
            onPress={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full shadow-md"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Right navigation button */}
        {canGoNext && (
          <Button
            isIconOnly
            variant="flat"
            onPress={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full shadow-md"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}

        {/* Movie carousel */}
        <div className="flex gap-4 px-3 overflow-hidden">
          {visibleMovies.map((movie) => (
            <div
              key={movie.id}
              className="relative flex-none w-48 transition-opacity duration-300"
              onMouseEnter={() => setHoveredMovieId(movie.id)}
              onMouseLeave={() => setHoveredMovieId(null)}
            >
              {/* Movie card with poster */}
              <div className="w-full" style={{ height: "360px" }}> {/* Fixed height container */}
                <div className="h-72 overflow-hidden rounded-md">
                  <Image
                    src={
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                        : "/placeholder-poster.jpg"
                    }
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-300 cursor-pointer hover:scale-105"
                    onClick={() => window.open(`/movie/${movie.id}`, "_blank")}
                    removeWrapper
                  />
                </div>

                {/* Movie title shown below poster */}
                <div className="mt-2 w-full px-1">
                  <p className="text-sm font-medium line-clamp-1">{movie.title}</p>
                  {movie.release_date && (
                    <p className="text-xs text-default-500">
                      {getReleaseYear(movie.release_date)}
                    </p>
                  )}
                </div>

                {/* Hover menu - with AnimatePresence for clean animations */}
                <AnimatePresence>
                  {hoveredMovieId === movie.id && (
                    <motion.div
                      className="absolute left-0 right-0 bottom-[72px] z-50"
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="bg-gradient-to-t from-black to-black/70 p-3 text-white">
                        <p className="text-sm font-medium truncate mb-2">
                          {movie.title}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                          <span className="text-xs">
                            {getReleaseYear(movie.release_date)}
                          </span>
                          {movie.vote_average && (
                            <div className="bg-primary rounded-full px-2 py-0.5 text-xs">
                              {movie.vote_average.toFixed(1)}
                            </div>
                          )}
                        </div>

                        {/* Recommendation reason, if provided */}
                        {reason && reason(movie) && (
                          <div className="mb-2 text-xs text-white/80">
                            {reason(movie)?.text}
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            color="primary"
                            variant="solid"
                            startContent={<Eye className="h-3.5 w-3.5" />}
                            as={Link}
                            href={`/movie/${movie.id}`}
                            className="w-full"
                          >
                            View Details
                          </Button>

                          {isAuthenticated ? (
                            watchlistStatus[movie.id] ? (
                              // Already in watchlist
                              <Button
                                size="sm"
                                color="success"
                                variant="flat"
                                className="bg-white/20 backdrop-blur-sm"
                                onPress={() => handleOpenWatchlistModal(movie)}
                              >
                                <Heart className="h-3 w-3 fill-current" />
                              </Button>
                            ) : (
                              // Not in watchlist
                              <Button
                                size="sm"
                                color="default"
                                variant="flat"
                                className="bg-white/20 backdrop-blur-sm"
                                onPress={() => handleAddToWatchlist(movie)}
                                isLoading={loadingStates[movie.id]}
                              >
                                <Heart className="h-3 w-3" />
                              </Button>
                            )
                          ) : (
                            // Not authenticated
                            <Button
                              size="sm"
                              variant="flat"
                              className="bg-white/20 backdrop-blur-sm"
                              onPress={() => {
                                // Store the current URL for redirection after login
                                localStorage.setItem(
                                  "redirectAfterLogin",
                                  window.location.pathname
                                );
                                router.push("/login");
                              }}
                            >
                              <Heart className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>

        {/* Show more indicator if there are more movies */}
        {canGoNext && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-full bg-gradient-to-l from-background to-transparent opacity-60 pointer-events-none"></div>
        )}
      </div>
      {/* Only render the modal when it's open and we have a selected movie */}
      {isOpen && selectedMovie && (
        <AddToWatchlistModal
          isOpen={isOpen}
          onClose={onClose}
          movieDetails={{
            id: selectedMovie.id,
            title: selectedMovie.title,
            posterPath: selectedMovie.poster_path,
          }}
          onSuccess={() => {
            // Update the watchlist status
            setWatchlistStatus((prev) => ({
              ...prev,
              [selectedMovie.id]: true,
            }));

            if (onSuccess) onSuccess();
          }}
        />
      )}
    </div>
  );
};

export default MovieCarouselRow;