"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Spinner,
  Button,
  Link,
  useDisclosure,
  Input,
} from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Film, X, Flame, Star } from "lucide-react";
import debounce from "lodash/debounce";

import { useAuth } from "@/contexts/AuthContext";
import AddToWatchlistModal from "@/components/Watchlist/AddToWatchlistModal";
import useWatchlistStatus from "@/hooks/useWatchlistStatus";
import EnhancedMovieCarousel from "@/components/Discovery/EnhancedMovieCarousel";
import EnhancedWatchlistSection from "@/components/Discovery/EnhancedWatchlistSection";
import FixedMovieDiscoveryCard from "@/components/Discovery/FixedMovieDiscoveryCard";

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
  isWatched?: boolean;
}

interface PublicWatchlist {
  id: number;
  name: string;
  description?: string;
  likesCount: number;
  slug?: string;
  moviesCount: number;
  owner: {
    username: string;
    id: string | number;
  };
  items?: Array<{
    id: number;
    tmdbMovieId: number;
    title: string;
    posterPath?: string;
  }>;
}

export default function DiscoveryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
const { token, isAuthenticated, currentGroupId } = useAuth();
  // Movie data state
  const [trending, setTrending] = useState<Movie[]>([]);
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [publicWatchlists, setPublicWatchlists] = useState<PublicWatchlist[]>(
    [],
  );

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Loading states
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [loadingTopRated, setLoadingTopRated] = useState(true);
  const [loadingPublicWatchlists, setLoadingPublicWatchlists] = useState(true);

  // Watchlist modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const { allWatchlistMovieIds } = useWatchlistStatus(0);
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  // Check for search query in URL
  useEffect(() => {
    const query = searchParams.get("search");

    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  // Listen for search input from the navbar
  useEffect(() => {
    const handleNavbarSearch = (event: CustomEvent) => {
      if (window.location.pathname === "/discover") {
        setSearchQuery(event.detail.query);
        performSearch(event.detail.query);
      }
    };

    // Add event listener
    window.addEventListener(
      "navbarSearch",
      handleNavbarSearch as EventListener,
    );

    // Clean up
    return () => {
      window.removeEventListener(
        "navbarSearch",
        handleNavbarSearch as EventListener,
      );
    };
  }, []);

  // Core data loading
  useEffect(() => {
    fetchTrending();
    fetchTopRated();

    if (isAuthenticated && token) {
      generateRecommendations();
    }

    fetchPublicWatchlists();
  }, [isAuthenticated, token]);

  // Fetch trending movies
  const fetchTrending = async () => {
    try {
      setLoadingTrending(true);
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.NEXT_PUBLIC_API_Key}&page=1`,
      );

      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }

      const data = await response.json();

      setTrending(data.results || []);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
      setTrending([]);
    } finally {
      setLoadingTrending(false);
    }
  };

  // Fetch top rated movies
  const fetchTopRated = async () => {
    try {
      setLoadingTopRated(true);
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/top_rated?api_key=${process.env.NEXT_PUBLIC_API_Key}&page=1`,
      );

      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }

      const data = await response.json();

      setTopRatedMovies(data.results || []);
    } catch (error) {
      console.error("Error fetching top rated movies:", error);
      setTopRatedMovies([]);
    } finally {
      setLoadingTopRated(false);
    }
  };

  // Fetch personalized recommendations
  const generateRecommendations = async () => {
    if (!token) return;

    try {
      setLoadingRecommended(true);

      // First, fetch user's watchlist items from all watchlists
      const watchlistResponse = await fetch(
        `${API_BASE_URL}/api/watchlists/all-items`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (!watchlistResponse.ok) {
        throw new Error("Failed to fetch watchlist items");
      }

      const watchlistItems = await watchlistResponse.json();

      if (!watchlistItems || watchlistItems.length === 0) {
        setRecommended([]);
        setLoadingRecommended(false);

        return;
      }

      // Get recommendations based on 2-3 random movies from watchlists
      const sampleSize = Math.min(3, watchlistItems.length);
      const sampleMovies = [...watchlistItems]
        .sort(() => 0.5 - Math.random())
        .slice(0, sampleSize);

      if (sampleMovies.length === 0 || !sampleMovies[0].tmdbMovieId) {
        setRecommended([]);
        setLoadingRecommended(false);

        return;
      }

      // Fetch recommendations for each sample movie
      const recommendationPromises = sampleMovies.map((movie) =>
        fetch(
          `https://api.themoviedb.org/3/movie/${movie.tmdbMovieId}/recommendations?api_key=${process.env.NEXT_PUBLIC_API_Key}`,
        )
          .then((res) => {
            if (!res.ok) return { results: [] };

            return res.json();
          })
          .catch(() => ({ results: [] })),
      );

      const results = await Promise.all(recommendationPromises);
      const allRecommendations = results.flatMap(
        (result) => result.results || [],
      );

      if (allRecommendations.length === 0) {
        setRecommended([]);
        setLoadingRecommended(false);

        return;
      }

      // Use a Map for efficient deduplication by movie ID
      const uniqueRecommendationsMap = new Map();

      allRecommendations.forEach((movie) => {
        if (movie && movie.id) {
          uniqueRecommendationsMap.set(movie.id, movie);
        }
      });

      const uniqueRecommendations = Array.from(
        uniqueRecommendationsMap.values(),
      );

      // Remove movies that are already in watchlist
      const watchlistIds = new Set(watchlistItems.map((m) => m.tmdbMovieId));
      const filteredRecommendations = uniqueRecommendations.filter(
        (movie) => !watchlistIds.has(movie.id),
      );

      if (filteredRecommendations.length === 0) {
        setRecommended([]);
        setLoadingRecommended(false);

        return;
      }

      // Sort by vote average and popularity for better quality recommendations
      const sortedRecommendations = filteredRecommendations.sort((a, b) => {
        // First prioritize vote count to ensure we're getting well-reviewed movies
        const aVoteCount = a.vote_count || 0;
        const bVoteCount = b.vote_count || 0;

        // Movies with very few votes should be ranked lower regardless of score
        if (aVoteCount > 100 && bVoteCount < 100) return -1;
        if (aVoteCount < 100 && bVoteCount > 100) return 1;

        // Then by vote average
        const aScore = a.vote_average || 0;
        const bScore = b.vote_average || 0;

        if (Math.abs(aScore - bScore) > 1) {
          return bScore - aScore; // Prioritize significantly higher ratings
        }

        // If ratings are similar, consider popularity
        return (b.popularity || 0) - (a.popularity || 0);
      });

      setRecommended(sortedRecommendations.slice(0, 20));
    } catch (error) {
      console.error("Error generating recommendations:", error);
      setRecommended([]);
    } finally {
      setLoadingRecommended(false);
    }
  };

  // Fetch popular public watchlists
  const fetchPublicWatchlists = async () => {
    try {
      setLoadingPublicWatchlists(true);

      // Fetch the watchlists with explicit request for items
      const response = await fetch(
        `${API_BASE_URL}/api/watchlists/public?sort=popular&limit=5&include_items=true`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch public watchlists: ${response.status}`,
        );
      }

      const data = await response.json();

      // Extract watchlists from the response format
      const watchlists = data.categories || [];

      if (watchlists.length === 0) {
        setPublicWatchlists([]);
        setLoadingPublicWatchlists(false);

        return;
      }

      // Normalize the watchlist data to ensure consistent structure
      const normalizedWatchlists = watchlists.map((watchlist) => ({
        id: watchlist.id,
        name: watchlist.name || "Unnamed Watchlist",
        description: watchlist.description || "",
        likesCount: watchlist.likesCount || 0,
        slug: watchlist.slug || String(watchlist.id),
        moviesCount: watchlist.moviesCount || 0,
        owner: {
          username:
            watchlist.User?.username || watchlist.owner?.username || "User",
          id: watchlist.User?.id || watchlist.owner?.id || 0,
        },
        items: Array.isArray(watchlist.items)
          ? watchlist.items.map((item) => ({
              id: item.id,
              tmdbMovieId: item.tmdbMovieId || 0,
              title: item.title || "Unknown movie",
              posterPath: item.posterPath || null,
            }))
          : [],
      }));

      setPublicWatchlists(normalizedWatchlists);
    } catch (error) {
      console.error("Error fetching public watchlists:", error);
      setPublicWatchlists([]);
    } finally {
      setLoadingPublicWatchlists(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query) performSearch(query);
      else setSearchResults([]);
    }, 500),
    [],
  );

  const checkWatchedStatus = async (movies: Movie[]) => {
  if (!currentGroupId || movies.length === 0) return;
  
  try {
    const tmdbIds = movies.map(m => m.id);
    
    const response = await fetch(
      `${API_BASE_URL}/api/movie-monday/check-watched`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: currentGroupId,
          tmdb_ids: tmdbIds
        })
      }
    );

    if (response.ok) {
      const { watched } = await response.json();
      
      // Update search results with watched status
      setSearchResults(prev =>
        prev.map(movie => ({
          ...movie,
          isWatched: watched.includes(movie.id)
        }))
      );
    }
  } catch (error) {
    console.error('Error checking watched status:', error);
    // Silently fail - search results still work without this
  }
};

  // Handle search input changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;

    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Perform search against TMDB API
const performSearch = async (query: string) => {
  if (!query.trim()) {
    setSearchResults([]);
    setIsSearching(false);
    return;
  }

  try {
    setIsSearching(true);

    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${process.env.NEXT_PUBLIC_API_Key}&query=${encodeURIComponent(query)}&include_adult=false&page=1`,
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || [];

    setSearchResults(results);
    
    // Check watched status in parallel (don't await)
    if (currentGroupId && results.length > 0) {
      checkWatchedStatus(results);
    }
  } catch (error) {
    console.error("Error searching movies:", error);
    setSearchResults([]);
  } finally {
    setIsSearching(false);
  }
};

  // Handle adding a movie to watchlist
  const handleAddToWatchlist = (movie: Movie) => {
    setSelectedMovie(movie);
    onOpen();
  };

  // Utility to get movie recommendation reason
  const getRecommendationReason = (movie: Movie) => {
    // We're no longer displaying this in the hover state
    return null;
  };

  return (
    <div className="container mx-auto px-4 pb-16">
      <div className="flex flex-col items-center justify-center gap-4 py-6 md:py-8">
        <h1 className="text-4xl font-bold text-center">Discover Movies</h1>
        <p className="text-center text-default-500 max-w-3xl">
          Find your next favorite movie for Movie Monday with personalized
          recommendations and trending titles.
        </p>
      </div>

      {/* Search section */}
      <div className="mb-8 max-w-2xl mx-auto">
        <div className="relative">
          <Input
            isClearable
            className="w-full"
            placeholder="Search movies..."
            radius="lg"
            size="lg"
            startContent={<Search className="text-default-400" />}
            value={searchQuery}
            onChange={handleSearchChange}
            onClear={() => {
              setSearchQuery("");
              setSearchResults([]);
              router.push("/discover");
            }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {searchQuery && (
          <div className="mb-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <Search className="mr-2 h-6 w-6 text-primary" />
                Search Results for "{searchQuery}"
              </h2>
              <Button
                startContent={<X className="h-4 w-4" />}
                variant="light"
                onPress={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  router.push("/discover");
                }}
              >
                Clear Search
              </Button>
            </div>

            {isSearching ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
                {searchResults.map((movie) => (
                  <div key={movie.id} className="aspect-[2/3]">
                    <FixedMovieDiscoveryCard movie={movie} />
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <Card className="py-12">
                <div className="text-center">
                  <p className="text-xl font-medium mb-2">
                    No results found for "{searchQuery}"
                  </p>
                  <p className="text-default-500">
                    Try searching for a different movie title
                  </p>
                </div>
              </Card>
            ) : null}
          </div>
        )}

        {/* Only show other sections if not searching or with no results */}
        {(!searchQuery || searchResults.length === 0) && (
          <>
            {/* Featured collections with icons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
              <Card
                isPressable
                className="p-6"
                onPress={() =>
                  window.scrollTo({
                    top: document.getElementById("trending")?.offsetTop - 100,
                    behavior: "smooth",
                  })
                }
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
                    <Flame className="h-8 w-8 text-danger" />
                  </div>
                  <h3 className="text-xl font-bold">Trending Now</h3>
                  <p className="text-default-500 text-sm">
                    The hottest movies people are watching this week
                  </p>
                </div>
              </Card>

              <Card
                isPressable
                className="p-6"
                onPress={() =>
                  window.scrollTo({
                    top: document.getElementById("top-rated")?.offsetTop - 100,
                    behavior: "smooth",
                  })
                }
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
                    <Star className="h-8 w-8 text-warning" />
                  </div>
                  <h3 className="text-xl font-bold">Top Rated</h3>
                  <p className="text-default-500 text-sm">
                    The highest rated films of all time by viewers
                  </p>
                </div>
              </Card>

              <Card
                isPressable
                className="p-6"
                onPress={() =>
                  window.scrollTo({
                    top: document.getElementById("watchlists")?.offsetTop - 100,
                    behavior: "smooth",
                  })
                }
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Film className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Watchlists</h3>
                  <p className="text-default-500 text-sm">
                    Curated collections by the community
                  </p>
                </div>
              </Card>
            </div>

            {/* Trending Now Section */}
            <section className="mb-6" id="trending">
              <EnhancedMovieCarousel
                loading={loadingTrending}
                movies={trending}
                subtitle="The hottest films everyone is watching right now"
                title="Trending This Week"
              />
            </section>

            {/* Personalized Recommendations */}
            {isAuthenticated ? (
              <section className="mb-6">
                <EnhancedMovieCarousel
                  emptyMessage="Add movies to your watchlist to get personalized recommendations"
                  loading={loadingRecommended}
                  movies={recommended}
                  reason={getRecommendationReason}
                  subtitle="Customized suggestions based on your watchlist"
                  title="Recommended For You"
                />
              </section>
            ) : (
              <Card className="mb-12 overflow-hidden">
                <div className="p-8 flex flex-col md:flex-row items-center gap-6">
                  <div className="md:w-1/2">
                    <h3 className="text-2xl font-bold mb-3">
                      Get Personalized Recommendations
                    </h3>
                    <p className="text-default-600 mb-4">
                      Sign in to see movie recommendations based on your
                      watchlist and viewing history. Create custom watchlists
                      and track what you want to watch next.
                    </p>
                    <Button as={Link} color="primary" href="/login" size="lg">
                      Sign In
                    </Button>
                  </div>

                  <div className="md:w-1/2 relative h-48 overflow-hidden rounded-lg">
                    <div className="absolute inset-0 flex gap-1">
                      {topRatedMovies.slice(0, 5).map((movie) => (
                        <div
                          key={movie.id}
                          className="h-full w-1/5 overflow-hidden"
                        >
                          <img
                            alt=""
                            className="h-full w-full object-cover opacity-60"
                            src={
                              movie.poster_path
                                ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                                : "/placeholder-poster.jpg"
                            }
                          />
                        </div>
                      ))}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
                  </div>
                </div>
              </Card>
            )}

            {/* Top Rated Movies Section */}
            <section className="mb-6" id="top-rated">
              <EnhancedMovieCarousel
                loading={loadingTopRated}
                movies={topRatedMovies}
                subtitle="The best films of all time according to users"
                title="Top Rated Movies"
              />
            </section>

            {/* Popular Public Watchlists Section */}
            <section className="mb-6" id="watchlists">
              <EnhancedWatchlistSection
                loading={loadingPublicWatchlists}
                watchlists={publicWatchlists}
              />
            </section>
          </>
        )}
      </div>

      {/* AddToWatchlist Modal */}
      {selectedMovie && (
        <AddToWatchlistModal
          isOpen={isOpen}
          movieDetails={{
            id: selectedMovie.id,
            title: selectedMovie.title,
            posterPath: selectedMovie.poster_path,
          }}
          onClose={onClose}
        />
      )}
    </div>
  );
}
