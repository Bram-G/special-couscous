import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Spinner, Link } from "@heroui/react";
import { ChevronLeft, ChevronRight, Info, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

import MovieDiscoveryCard from "./MovieDiscoveryCard";

interface Movie {
  id: number;
  title: string;
  poster_path?: string;
  release_date?: string;
  vote_average?: number;
}

interface WatchlistItem {
  id: number;
  tmdbMovieId: number;
  title: string;
  posterPath?: string;
}

interface WatchlistMovieCarouselProps {
  watchlistId: number;
  watchlistName: string;
  watchlistSlug?: string;
  items?: WatchlistItem[];
  ownerName?: string;
  description?: string;
  maxItems?: number;
}

const WatchlistMovieCarousel: React.FC<WatchlistMovieCarouselProps> = ({
  watchlistId,
  watchlistName,
  watchlistSlug,
  items = [],
  ownerName = "Unknown user",
  description,
  maxItems = 10,
}) => {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [moviesPerPage, setMoviesPerPage] = useState(5);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    // Set visible movies based on screen width
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < 640) setMoviesPerPage(2);
      else if (width < 1024) setMoviesPerPage(3);
      else if (width < 1280) setMoviesPerPage(4);
      else setMoviesPerPage(5);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Reset index when items change
    setCurrentIndex(0);

    // Only fetch if we have items with tmdbMovieId
    const validItems = items.filter(
      (item) => item.tmdbMovieId && typeof item.tmdbMovieId === "number",
    );

    if (validItems.length === 0) {
      setMovies([]);
      setLoading(false);

      return;
    }

    // Fetch movie details for each item
    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      setLoadProgress(0);

      try {
        // Limit to a reasonable number
        const itemsToFetch = validItems.slice(0, maxItems);
        const fetchedMovies: Movie[] = [];
        let completedFetches = 0;

        // Create a promise for each movie
        const moviePromises = itemsToFetch.map(async (item, index) => {
          try {
            const response = await fetch(
              `https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
            );

            if (!response.ok) {
              console.warn(
                `Error fetching movie ${item.tmdbMovieId}: ${response.status}`,
              );

              return null;
            }

            const movieData = await response.json();

            // Update progress
            completedFetches++;
            setLoadProgress(
              Math.round((completedFetches / itemsToFetch.length) * 100),
            );

            return movieData;
          } catch (error) {
            console.error(`Error fetching movie ${item.tmdbMovieId}:`, error);

            return null;
          }
        });

        // Wait for all promises to resolve
        const results = await Promise.all(moviePromises);

        // Filter out failed requests and sort by popularity
        const validMovies = results
          .filter(Boolean)
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

        setMovies(validMovies);
      } catch (error) {
        console.error("Error fetching watchlist movies:", error);
        setError("Failed to load movies");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [items, maxItems]);

  // Navigation functions
  const handleNext = () => {
    if (currentIndex + moviesPerPage < movies.length) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Calculate which movies to show
  const visibleMovies = movies.slice(
    currentIndex,
    currentIndex + moviesPerPage,
  );
  const canGoNext = currentIndex + moviesPerPage < movies.length;
  const canGoPrevious = currentIndex > 0;

  // Format release year
  const getYear = (dateString?: string) => {
    if (!dateString) return "";

    return new Date(dateString).getFullYear();
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center">
            {watchlistName || "Untitled Watchlist"}
            <span className="ml-2 text-sm font-normal text-default-500">
              by {ownerName}
            </span>
          </h2>
          {description && (
            <p className="text-sm text-default-500">{description}</p>
          )}
        </div>
        <Button
          as={Link}
          color="primary"
          endContent={<ExternalLink size={16} />}
          href={`/watchlist/${watchlistSlug || watchlistId}`}
          variant="light"
        >
          View Full List
        </Button>
      </div>

      {loading ? (
        <Card className="w-full p-6">
          <CardBody className="flex flex-col items-center gap-2">
            <Spinner color="primary" size="lg" />
            <p className="text-default-500 mt-2">Loading movies...</p>
            {loadProgress > 0 && (
              <div className="w-full mt-2">
                <div className="h-2 w-full bg-default-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${loadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-default-500 text-center mt-1">
                  {loadProgress}% complete
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      ) : error ? (
        <Card className="w-full">
          <CardBody className="flex flex-col items-center justify-center py-8">
            <Info className="h-12 w-12 text-danger mb-4" />
            <p className="text-center">{error}</p>
          </CardBody>
        </Card>
      ) : movies.length === 0 ? (
        <Card className="w-full">
          <CardBody className="flex flex-col items-center justify-center py-8">
            <Info className="h-12 w-12 text-default-300 mb-4" />
            <p className="text-center text-default-500">
              No movies available in this watchlist
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="relative">
          {/* Navigation buttons */}
          {canGoPrevious && (
            <Button
              isIconOnly
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full shadow-md"
              variant="flat"
              onPress={handlePrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}

          {canGoNext && (
            <Button
              isIconOnly
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full shadow-md"
              variant="flat"
              onPress={handleNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}

          {/* Movie carousel */}
          <div className="flex gap-4 px-3 overflow-hidden">
            {visibleMovies.map((movie) => (
              <MovieDiscoveryCard key={movie.id} movie={movie} />
            ))}
          </div>

          {/* Gradient indicators for more content */}
          {canGoPrevious && (
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent opacity-60 pointer-events-none" />
          )}
          {canGoNext && (
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent opacity-60 pointer-events-none" />
          )}
        </div>
      )}
    </div>
  );
};

export default WatchlistMovieCarousel;
