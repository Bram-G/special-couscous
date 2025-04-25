"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, Spinner, Button, Link, useDisclosure } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { title } from "@/components/primitives";
import MovieCarouselRow from "@/components/Discovery/MovieCarouselRow";
import MovieDiscoveryCard from "@/components/Discovery/MovieDiscoveryCard";
import debounce from "lodash/debounce";
import AddToWatchlistModal from "@/components/Watchlist/AddToWatchlistModal";
import useWatchlistStatus from "@/hooks/useWatchlistStatus";
import ClientOnly from "@/components/ui/client-only";

// Types for movie data
interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  release_date: string;
  vote_average: number;
  overview: string;
  genre_ids: number[];
  popularity?: number;
}

interface WatchlistMovie {
  id: number;
  tmdbMovieId: number;
  title: string;
  posterPath: string;
  watched?: boolean;
  isWinner?: boolean;
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
  const { token, isAuthenticated } = useAuth();

  // Movie data state
  const [trending, setTrending] = useState<Movie[]>([]);
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [publicWatchlists, setPublicWatchlists] = useState<PublicWatchlist[]>(
    []
  );
  const [watchlistMovies, setWatchlistMovies] = useState<{
    [key: string]: Movie[];
  }>({});

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
  const { inWatchlist, allWatchlistMovieIds, isLoading } =
    useWatchlistStatus(0);

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
      handleNavbarSearch as EventListener
    );

    // Clean up
    return () => {
      window.removeEventListener(
        "navbarSearch",
        handleNavbarSearch as EventListener
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
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.NEXT_PUBLIC_API_Key}&page=1`
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
        `https://api.themoviedb.org/3/movie/top_rated?api_key=${process.env.NEXT_PUBLIC_API_Key}&page=1`
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
        "http://localhost:8000/api/watchlists/all-items",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
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

      // Log for debugging
      console.log(
        "Fetched watchlist items for recommendations:",
        watchlistItems
      );

      // Get recommendations based on 2-3 random movies from watchlists
      const sampleSize = Math.min(3, watchlistItems.length);
      const sampleMovies = [...watchlistItems]
        .sort(() => 0.5 - Math.random())
        .slice(0, sampleSize);

      // Ensure we're using the correct property (tmdbMovieId)
      if (sampleMovies.length === 0 || !sampleMovies[0].tmdbMovieId) {
        console.error("Invalid watchlist item format:", sampleMovies);
        setRecommended([]);
        setLoadingRecommended(false);
        return;
      }

      // Fetch recommendations for each sample movie - with better error handling
      const recommendationPromises = sampleMovies.map((movie) =>
        fetch(
          `https://api.themoviedb.org/3/movie/${movie.tmdbMovieId}/recommendations?api_key=${process.env.NEXT_PUBLIC_API_Key}`
        )
          .then((res) => {
            if (!res.ok) {
              console.warn(
                `Failed to get recommendations for movie ${movie.tmdbMovieId}`,
                res.status
              );
              return { results: [] };
            }
            return res.json();
          })
          .catch((err) => {
            console.error(
              `Error fetching recommendations for movie ${movie.tmdbMovieId}:`,
              err
            );
            return { results: [] };
          })
      );

      const results = await Promise.all(recommendationPromises);

      // Combine all recommendations and remove duplicates
      const allRecommendations = results.flatMap(
        (result) => result.results || []
      );

      if (allRecommendations.length === 0) {
        console.log("No recommendations found for any of the sample movies");
        setRecommended([]);
        setLoadingRecommended(false);
        return;
      }

      // Add debug logging
      console.log(
        `Found ${allRecommendations.length} total recommendations before deduplication`
      );

      // Use a Map for efficient deduplication by movie ID
      const uniqueRecommendationsMap = new Map();
      allRecommendations.forEach((movie) => {
        if (movie && movie.id) {
          uniqueRecommendationsMap.set(movie.id, movie);
        }
      });

      const uniqueRecommendations = Array.from(
        uniqueRecommendationsMap.values()
      );

      // Remove movies that are already in watchlist
      const watchlistIds = new Set(watchlistItems.map((m) => m.tmdbMovieId));
      const filteredRecommendations = uniqueRecommendations.filter(
        (movie) => !watchlistIds.has(movie.id)
      );

      console.log(
        `After filtering out watchlist movies, ${filteredRecommendations.length} recommendations remain`
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
        "http://localhost:8000/api/watchlists/public?sort=popular&limit=5&include_items=true"
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch public watchlists: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Public watchlists data:", data);

      // Extract watchlists from the response format
      const watchlists = data.categories || [];

      if (watchlists.length === 0) {
        console.log("No watchlists found in response");
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
          username: watchlist.owner?.username || "Unknown user",
          id: watchlist.owner?.id || 0,
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

      console.log("Normalized watchlists:", normalizedWatchlists);
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
    []
  );

  // Handle search input changes
  const handleSearchChange = (query: string) => {
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
        `https://api.themoviedb.org/3/search/movie?api_key=${process.env.NEXT_PUBLIC_API_Key}&query=${encodeURIComponent(query)}&include_adult=false&page=1`
      );

      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data.results || []);
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
    if (!movie) return null;

    return {
      type: "generic",
      text: "Recommended for you",
      detail: "Based on your watchlist",
    };
  };

  return (
    <div className="container mx-auto px-4 mb-8">
      <div className="flex flex-col items-center justify-center gap-4 py-6 md:py-8">
        <h1 className={title({ size: "lg" })}>Discover Movies</h1>
        <p className="text-center text-default-500 max-w-3xl">
          Find your next favorite movie for Movie Monday with personalized
          recommendations and trending titles.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="space-y-10">
        {searchQuery && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                Search Results for "{searchQuery}"
              </h2>
              <Button
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {searchResults.map((movie) => (
                  <MovieDiscoveryCard key={movie.id} movie={movie} />
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
            {/* Trending Now Section - with limited number of visible items */}
            <MovieCarouselRow
              title="Trending Now"
              movies={trending}
              loading={loadingTrending}
              visibleItemCount={5} // Limit visible items to prevent cutoff
            />

            {/* Personalized Recommendations */}
            {isAuthenticated ? (
              <MovieCarouselRow
                title="Recommended For You"
                subtitle="Based on your watchlist"
                movies={recommended}
                loading={loadingRecommended}
                reason={getRecommendationReason}
                emptyMessage="Add movies to your watchlist to get personalized recommendations"
                visibleItemCount={5}
              />
            ) : (
              <Card className="mb-8">
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <p className="text-center text-xl font-medium mb-2">
                    Sign in to see personalized recommendations
                  </p>
                  <Button as={Link} href="/login" color="primary">
                    Sign in
                  </Button>
                </div>
              </Card>
            )}

            {/* Top Rated Movies Section */}
            <MovieCarouselRow
              title="Top Rated Movies"
              subtitle="The best films of all time according to users"
              movies={topRatedMovies}
              loading={loadingTopRated}
              visibleItemCount={5}
            />

            {/* Popular Public Watchlists Section */}
            {loadingPublicWatchlists ? (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-2">Popular Watchlists</h2>
                <p className="text-default-500 mb-6">
                  Discovering curated movie collections from the community...
                </p>
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              </div>
            ) : publicWatchlists.length > 0 ? (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-2">Popular Watchlists</h2>
                <p className="text-default-500 mb-6">
                  Discover curated movie collections from the community
                </p>

                {publicWatchlists.map((watchlist) => (
                  <div key={watchlist.id} className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-xl font-bold flex items-center">
                          {watchlist.name || "Untitled Watchlist"}
                          <span className="ml-2 text-sm font-normal text-default-500">
                            by {watchlist.owner?.username || "Unknown user"}
                          </span>
                        </h2>
                        {watchlist.description && (
                          <p className="text-sm text-default-500">
                            {watchlist.description}
                          </p>
                        )}
                      </div>
                      <Button
                        as={Link}
                        href={`/watchlist/${watchlist.slug || watchlist.id}`}
                        variant="light"
                        color="primary"
                      >
                        View Watchlist
                      </Button>
                    </div>

                    {/* Display watchlist movies */}
                    {watchlist.items && watchlist.items.length > 0 ? (
                      <MovieCarouselRow
                        title=""
                        movies={watchlist.items
                          .filter((item) => item && item.tmdbMovieId)
                          .map((item) => ({
                            id: item.tmdbMovieId,
                            title: item.title,
                            poster_path: item.posterPath || undefined,
                          }))}
                        visibleItemCount={5}
                      />
                    ) : (
                      <Card className="py-6">
                        <div className="text-center text-default-500">
                          No movies available in this watchlist
                        </div>
                      </Card>
                    )}
                  </div>
                ))}

                <div className="text-center mt-8">
                  <Button
                    as={Link}
                    href="/explore-watchlists"
                    color="primary"
                    variant="flat"
                  >
                    Explore More Watchlists
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* AddToWatchlist Modal */}
      {selectedMovie && (
        <AddToWatchlistModal
          isOpen={isOpen}
          onClose={onClose}
          movieDetails={{
            id: selectedMovie.id,
            title: selectedMovie.title,
            posterPath: selectedMovie.poster_path,
          }}
        />
      )}
    </div>
  );
}
