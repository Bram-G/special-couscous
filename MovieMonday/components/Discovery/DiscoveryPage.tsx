"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Spinner,
  Button,
  Input,
  useDisclosure,
} from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Film, X, Flame, Star, TrendingUp, Award, List, Users } from "lucide-react";
import debounce from "lodash/debounce";

import { useAuth } from "@/contexts/AuthContext";
import AddToWatchlistModal from "@/components/Watchlist/AddToWatchlistModal";
import useWatchlistStatus from "@/hooks/useWatchlistStatus";
import EnhancedMovieCarousel from "@/components/Discovery/EnhancedMovieCarousel";
import EnhancedWatchlistSection from "@/components/Discovery/EnhancedWatchlistSection";
import EnhancedMovieDiscoveryCard from "@/components/Discovery/EnhancedMovieDiscoveryCard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; 
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

// Types for movie data
interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  release_date?: string;
  vote_average?: number;
  overview?: string;
  genre_ids?: number[];
  popularity?: number;
}

interface VotedMovie {
  tmdbMovieId: number;
  title: string;
  posterPath: string | null;
  lastVotedDate: string;
}

const DiscoveryPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, currentGroupId } = useAuth();

  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [votedMovies, setVotedMovies] = useState<VotedMovie[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [watchedMovies, setWatchedMovies] = useState<Set<number>>(new Set());
  const [votedButNotPickedMovies, setVotedButNotPickedMovies] = useState<Set<number>>(new Set());

  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { checkStatus, addToWatchlist } = useWatchlistStatus();

  // Check discovery status for movies
  const checkDiscoveryStatus = async (tmdbIds: number[]) => {
    if (!isAuthenticated || !currentGroupId || tmdbIds.length === 0) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/movie-monday/discovery-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            group_id: currentGroupId,
            tmdb_ids: tmdbIds,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWatchedMovies(new Set(data.watched));
        setVotedButNotPickedMovies(
          new Set(data.votedButNotPicked.map((m: VotedMovie) => m.tmdbMovieId))
        );
      }
    } catch (error) {
      console.error("Error checking discovery status:", error);
    }
  };

  // Fetch voted but not picked movies
  const fetchVotedMovies = async () => {
    if (!isAuthenticated || !currentGroupId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/movie-monday/voted-but-not-picked/${currentGroupId}?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVotedMovies(data.movies || []);
      }
    } catch (error) {
      console.error("Error fetching voted movies:", error);
    }
  };

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch trending
        const trendingRes = await fetch(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}`
        );
        const trendingData = await trendingRes.json();
        setTrendingMovies(trendingData.results?.slice(0, 20) || []);

        // Fetch top rated
        const topRatedRes = await fetch(
          `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}`
        );
        const topRatedData = await topRatedRes.json();
        setTopRatedMovies(topRatedData.results?.slice(0, 20) || []);

        // Fetch voted movies if authenticated
        if (isAuthenticated && currentGroupId) {
          await fetchVotedMovies();
        }

        // Check status for all movies
        const allMovieIds = [
          ...trendingData.results.slice(0, 20).map((m: Movie) => m.id),
          ...topRatedData.results.slice(0, 20).map((m: Movie) => m.id),
        ];
        await checkDiscoveryStatus(allMovieIds);
      } catch (error) {
        console.error("Error fetching discovery data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, currentGroupId]);

  // Search movies with debounce
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);

        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        const results = data.results || [];

        setSearchResults(results);

        // Check status for search results
        const searchIds = results.map((m: Movie) => m.id);

        await checkDiscoveryStatus(searchIds);
      } catch (error) {
        console.error("Error searching movies:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [currentGroupId, isAuthenticated]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;

    setSearchQuery(query);
    debouncedSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleAddClick = (movie: Movie) => {
    setSelectedMovie(movie);
    onOpen();
  };

  const handleSuccess = () => {
    if (selectedMovie) {
      checkStatus(selectedMovie.id);
    }
  };

  // Convert voted movies to Movie type for display
  const votedMoviesAsMovies: Movie[] = votedMovies.map((vm) => ({
    id: vm.tmdbMovieId,
    title: vm.title,
    poster_path: vm.posterPath || "",
    release_date: vm.lastVotedDate,
  }));

  // Filter recommendations to exclude watched movies
  const filteredRecommendations = recommendedMovies.filter(
    (m) => !watchedMovies.has(m.id)
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Discover Movies</h1>
        <p className="text-default-500">
          Explore trending movies, top rated films, and personalized recommendations
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <Input
          classNames={{
            base: "max-w-2xl",
            inputWrapper: "h-12",
          }}
          endContent={
            searchQuery ? (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Search className="h-5 w-5 text-default-400" />
            )
          }
          placeholder="Search for movies..."
          size="lg"
          startContent={<Film className="h-5 w-5 text-default-400" />}
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-4">
            Search Results {isSearching && <Spinner size="sm" />}
          </h2>
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {searchResults.map((movie) => (
                <EnhancedMovieDiscoveryCard
                  key={movie.id}
                  isVotedButNotPicked={votedButNotPickedMovies.has(movie.id)}
                  isWatched={watchedMovies.has(movie.id)}
                  movie={movie}
                  showAddButton={!watchedMovies.has(movie.id)}
                  onAddClick={handleAddClick}
                />
              ))}
            </div>
          ) : (
            !isSearching && (
              <p className="text-default-500">No results found for "{searchQuery}"</p>
            )
          )}
        </div>
      )}

      {/* Quick Access Cards - NOT clickable cards, just styled sections */}
      {!searchQuery && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div
              className="p-6 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => router.push("/discover/trending")}
            >
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-orange-500" />
                <h3 className="text-lg font-bold">Trending</h3>
              </div>
              <p className="text-sm text-default-500">What's hot this week</p>
            </div>

            <div
              className="p-6 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => router.push("/discover/top-rated")}
            >
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-6 h-6 text-yellow-500" />
                <h3 className="text-lg font-bold">Top Rated</h3>
              </div>
              <p className="text-sm text-default-500">Highest rated films</p>
            </div>

            <div
              className="p-6 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => router.push("/discover/recommended")}
            >
              <div className="flex items-center gap-3 mb-2">
                <List className="w-6 h-6 text-blue-500" />
                <h3 className="text-lg font-bold">Recommended</h3>
              </div>
              <p className="text-sm text-default-500">Based on your taste</p>
            </div>

            <div
              className="p-6 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => router.push("/discover/voted-but-not-picked")}
            >
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-purple-500" />
                <h3 className="text-lg font-bold">Voted Movies</h3>
              </div>
              <p className="text-sm text-default-500">Movies you considered</p>
            </div>
          </div>

          {/* Trending Section */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-500" />
                Trending This Week
              </h2>
              <Button
                color="primary"
                variant="flat"
                onClick={() => router.push("/discover/trending")}
              >
                View All
              </Button>
            </div>
            <EnhancedMovieCarousel
              emptyMessage="No trending movies available"
              movies={trendingMovies}
              subtitle="Popular movies trending this week"
              title=""
              votedButNotPickedMovies={votedButNotPickedMovies}
              watchedMovies={watchedMovies}
            />
          </div>

          {/* Top Rated Section */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500" />
                Top Rated Movies
              </h2>
              <Button
                color="primary"
                variant="flat"
                onClick={() => router.push("/discover/top-rated")}
              >
                View All
              </Button>
            </div>
            <EnhancedMovieCarousel
              emptyMessage="No top rated movies available"
              movies={topRatedMovies}
              subtitle="Highest rated movies of all time"
              title=""
              votedButNotPickedMovies={votedButNotPickedMovies}
              watchedMovies={watchedMovies}
            />
          </div>

          {/* Voted But Not Picked Section */}
          {isAuthenticated && votedMoviesAsMovies.length > 0 && (
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <X className="w-6 h-6 text-warning" />
                  Voted But Not Picked
                </h2>
                <Button
                  color="primary"
                  variant="flat"
                  onClick={() => router.push("/discover/voted-but-not-picked")}
                >
                  View All
                </Button>
              </div>
              <EnhancedMovieCarousel
                emptyMessage="No voted movies yet"
                movies={votedMoviesAsMovies}
                subtitle="Movies your group considered but didn't watch"
                title=""
                votedButNotPickedMovies={votedButNotPickedMovies}
                watchedMovies={watchedMovies}
              />
            </div>
          )}

          {/* Public Watchlists */}
          <EnhancedWatchlistSection />
        </>
      )}

      {/* Add to Watchlist Modal */}
      {selectedMovie && (
        <AddToWatchlistModal
          isOpen={isOpen}
          movie={selectedMovie}
          onOpenChange={onOpenChange}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default DiscoveryPage;