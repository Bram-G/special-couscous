"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  Input,
  Button,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import { Search, X, Flame, Star, Film, Sparkles, Heart, Users } from "lucide-react";
import debounce from "lodash.debounce";
import Link from "next/link";

import EnhancedMovieCarousel from "@/components/Discovery/EnhancedMovieCarousel";
import EnhancedMovieDiscoveryCard from "@/components/Discovery/EnhancedMovieDiscoveryCard";
import AddToWatchlistModal from "@/components/Watchlist/AddToWatchlistModal";
import WatchlistMovieCarousel from "@/components/Discovery/WatchlistMovieCarousel";
import type { Movie } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function UpdatedDiscoveryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, token, currentGroupId } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // State
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [trending, setTrending] = useState<Movie[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [loadingTopRated, setLoadingTopRated] = useState(false);
  
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  
  const [publicWatchlists, setPublicWatchlists] = useState<any[]>([]);
  const [loadingPublicWatchlists, setLoadingPublicWatchlists] = useState(false);

  const [votedButNotPicked, setVotedButNotPicked] = useState<any[]>([]);
  const [loadingVotedButNotPicked, setLoadingVotedButNotPicked] = useState(false);

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [watchedMovies, setWatchedMovies] = useState<Set<number>>(new Set());
  const [votedMovies, setVotedMovies] = useState<Set<number>>(new Set());

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

      const watchlistResponse = await fetch(
        `${API_BASE_URL}/api/watchlists/all-items`,
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

      const sampleSize = Math.min(3, watchlistItems.length);
      const sampleMovies = [...watchlistItems]
        .sort(() => 0.5 - Math.random())
        .slice(0, sampleSize);

      if (sampleMovies.length === 0 || !sampleMovies[0].tmdbMovieId) {
        setRecommended([]);
        setLoadingRecommended(false);
        return;
      }

      const recommendationPromises = sampleMovies.map((movie) =>
        fetch(
          `https://api.themoviedb.org/3/movie/${movie.tmdbMovieId}/recommendations?api_key=${process.env.NEXT_PUBLIC_API_Key}`
        )
          .then((res) => {
            if (!res.ok) return { results: [] };
            return res.json();
          })
          .catch(() => ({ results: [] }))
      );

      const results = await Promise.all(recommendationPromises);
      const allRecommendations = results.flatMap(
        (result) => result.results || []
      );

      if (allRecommendations.length === 0) {
        setRecommended([]);
        setLoadingRecommended(false);
        return;
      }

      const uniqueRecommendationsMap = new Map();
      allRecommendations.forEach((movie) => {
        if (movie && movie.id) {
          uniqueRecommendationsMap.set(movie.id, movie);
        }
      });

      const uniqueRecommendations = Array.from(
        uniqueRecommendationsMap.values()
      );

      const watchlistIds = new Set(watchlistItems.map((m) => m.tmdbMovieId));
      const filteredRecommendations = uniqueRecommendations.filter(
        (movie) => !watchlistIds.has(movie.id) && !watchedMovies.has(movie.id)
      );

      const sortedRecommendations = filteredRecommendations.sort((a, b) => {
        const aVoteCount = a.vote_count || 0;
        const bVoteCount = b.vote_count || 0;

        if (aVoteCount > 100 && bVoteCount < 100) return -1;
        if (aVoteCount < 100 && bVoteCount > 100) return 1;

        const aScore = a.vote_average || 0;
        const bScore = b.vote_average || 0;

        if (Math.abs(aScore - bScore) > 1) {
          return bScore - aScore;
        }

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

  // Fetch public watchlists
  const fetchPublicWatchlists = async () => {
    try {
      setLoadingPublicWatchlists(true);

      const response = await fetch(
        `${API_BASE_URL}/api/watchlists/public?sort=popular&limit=5&include_items=true`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch public watchlists: ${response.status}`
        );
      }

      const data = await response.json();
      const watchlists = data.categories || [];

      const normalizedWatchlists = watchlists.map((watchlist: any) => ({
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
          ? watchlist.items.map((item: any) => ({
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

  // Fetch voted but not picked movies
  const fetchVotedButNotPicked = async () => {
    if (!currentGroupId) return;

    try {
      setLoadingVotedButNotPicked(true);
      const response = await fetch(
        `${API_BASE_URL}/api/movie-monday/voted-but-not-picked/${currentGroupId}?limit=10`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch voted movies");
      }

      const data = await response.json();
      setVotedButNotPicked(data.movies || []);
    } catch (error) {
      console.error("Error fetching voted but not picked:", error);
      setVotedButNotPicked([]);
    } finally {
      setLoadingVotedButNotPicked(false);
    }
  };

  // Check discovery status for movies
  const checkDiscoveryStatus = async (tmdbIds: number[]) => {
    if (!currentGroupId || tmdbIds.length === 0) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/movie-monday/discovery-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            group_id: currentGroupId,
            tmdb_ids: tmdbIds,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWatchedMovies(new Set(data.watched || []));
        setVotedMovies(
          new Set(
            data.votedButNotPicked?.map((m: any) => m.tmdbMovieId) || []
          )
        );
      }
    } catch (error) {
      console.error("Error checking discovery status:", error);
    }
  };

  // Search movies
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${process.env.NEXT_PUBLIC_API_Key}&query=${encodeURIComponent(
          query
        )}&page=1`
      );

      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }

      const data = await response.json();
      const results = data.results || [];
      
      setSearchResults(results);

      if (currentGroupId && results.length > 0) {
        await checkDiscoveryStatus(results.map((m: Movie) => m.id));
      }
    } catch (error) {
      console.error("Error searching movies:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query) performSearch(query);
      else setSearchResults([]);
    }, 500),
    [currentGroupId]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);

    const newParams = new URLSearchParams(searchParams.toString());
    if (value) {
      newParams.set("q", value);
    } else {
      newParams.delete("q");
    }
    router.replace(`/discover?${newParams.toString()}`, { scroll: false });
  };

  const handleAddToWatchlist = (movie: Movie) => {
    setSelectedMovie(movie);
    onOpen();
  };

  // Load data on mount
  useEffect(() => {
    fetchTrending();
    fetchTopRated();
    fetchPublicWatchlists();

    if (isAuthenticated) {
      generateRecommendations();
      fetchVotedButNotPicked();
    }

    if (searchQuery) {
      performSearch(searchQuery);
    }
  }, [isAuthenticated, currentGroupId]);

  // Check discovery status when movies load
  useEffect(() => {
    const allMovieIds = [
      ...trending.map((m) => m.id),
      ...topRatedMovies.map((m) => m.id),
      ...recommended.map((m) => m.id),
    ];

    if (allMovieIds.length > 0) {
      checkDiscoveryStatus(allMovieIds);
    }
  }, [trending, topRatedMovies, recommended]);

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
                    <EnhancedMovieDiscoveryCard
                      isVotedButNotPicked={votedMovies.has(movie.id)}
                      isWatched={watchedMovies.has(movie.id)}
                      movie={movie}
                      showAddButton={isAuthenticated}
                      onAddClick={handleAddToWatchlist}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center">
                  <Search className="w-16 h-16 mx-auto mb-4 text-default-300" />
                  <h3 className="text-xl font-semibold mb-2">
                    No movies found
                  </h3>
                  <p className="text-default-500">
                    Try different search terms
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}

        {!searchQuery && (
          <>
            {/* Quick Access Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card
                isPressable
                as={Link}
                className="p-6 hover:scale-105 transition-transform"
                href="/discover/trending"
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
                as={Link}
                className="p-6 hover:scale-105 transition-transform"
                href="/discover/top-rated"
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
                as={Link}
                className="p-6 hover:scale-105 transition-transform"
                href="/explore-watchlists"
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

              <Card
                isPressable
                as={Link}
                className="p-6 hover:scale-105 transition-transform"
                href="/discover/recommended"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="text-xl font-bold">Recommended For You</h3>
                  <p className="text-default-500 text-sm">
                    Personalized suggestions based on your tastes
                  </p>
                </div>
              </Card>
            </div>

            {/* Voted But Not Picked Section */}
            {isAuthenticated && votedButNotPicked.length > 0 && (
              <section className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <X className="h-6 w-6 text-warning" />
                    Voted But Not Picked
                  </h2>
                  <Button
                    as={Link}
                    color="warning"
                    href="/discover/voted-but-not-picked"
                    variant="flat"
                  >
                    View All
                  </Button>
                </div>
                <p className="text-default-500 mb-4">
                  Movies your group considered but didn't watch yet
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {votedButNotPicked.slice(0, 10).map((movie) => {
                    const movieData: Movie = {
                      id: movie.tmdbMovieId,
                      title: movie.title,
                      poster_path: movie.posterPath,
                      release_date: movie.releaseDate,
                      vote_average: movie.voteAverage,
                      overview: movie.overview,
                      backdrop_path: null,
                      genre_ids: [],
                      original_language: "",
                      original_title: movie.title,
                      popularity: 0,
                      video: false,
                      vote_count: 0,
                      adult: false,
                    };

                    return (
                      <EnhancedMovieDiscoveryCard
                        key={movie.tmdbMovieId}
                        isVotedButNotPicked={true}
                        movie={movieData}
                        showAddButton={true}
                        onAddClick={handleAddToWatchlist}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* Trending Section */}
            <section className="mb-6" id="trending">
              <EnhancedMovieCarousel
                loading={loadingTrending}
                movies={trending.filter((m) => !watchedMovies.has(m.id))}
                subtitle="The hottest films everyone is watching right now"
                title="Trending This Week"
                watchedMovies={watchedMovies}
                votedButNotPickedMovies={votedMovies}
              />
              <div className="flex justify-end mt-4">
                <Button
                  as={Link}
                  color="danger"
                  href="/discover/trending"
                  variant="flat"
                >
                  View All Trending Movies
                </Button>
              </div>
            </section>

            {/* Personalized Recommendations */}
            {isAuthenticated ? (
              <section className="mb-6">
                <EnhancedMovieCarousel
                  emptyMessage="Add movies to your watchlist to get personalized recommendations"
                  loading={loadingRecommended}
                  movies={recommended.filter((m) => !watchedMovies.has(m.id))}
                  subtitle="Customized suggestions based on your watchlist"
                  title="Recommended For You"
                  watchedMovies={watchedMovies}
                  votedButNotPickedMovies={votedMovies}
                />
                <div className="flex justify-end mt-4">
                  <Button
                    as={Link}
                    color="secondary"
                    href="/discover/recommended"
                    variant="flat"
                  >
                    View All Recommendations
                  </Button>
                </div>
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
                      watchlist and viewing history.
                    </p>
                    <Button as={Link} color="primary" href="/login" size="lg">
                      Sign In
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Top Rated Section */}
            <section className="mb-6" id="top-rated">
              <EnhancedMovieCarousel
                loading={loadingTopRated}
                movies={topRatedMovies.filter((m) => !watchedMovies.has(m.id))}
                subtitle="The highest rated films of all time"
                title="Top Rated Movies"
                watchedMovies={watchedMovies}
                votedButNotPickedMovies={votedMovies}
              />
              <div className="flex justify-end mt-4">
                <Button
                  as={Link}
                  color="warning"
                  href="/discover/top-rated"
                  variant="flat"
                >
                  View All Top Rated Movies
                </Button>
              </div>
            </section>

            {/* Public Watchlists */}
            <section className="mb-6" id="watchlists">
              <WatchlistMovieCarousel
                loading={loadingPublicWatchlists}
                subtitle="Curated collections created by the community"
                title="Popular Watchlists"
                watchlists={publicWatchlists}
              />
              <div className="flex justify-end mt-4">
                <Button
                  as={Link}
                  color="primary"
                  href="/explore-watchlists"
                  variant="flat"
                >
                  Explore All Watchlists
                </Button>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Add to Watchlist Modal */}
      {selectedMovie && (
        <AddToWatchlistModal
          isOpen={isOpen}
          movie={selectedMovie}
          onClose={() => {
            onClose();
            setSelectedMovie(null);
          }}
        />
      )}
    </div>
  );
}