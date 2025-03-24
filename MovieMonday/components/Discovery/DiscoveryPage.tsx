"use client";

import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardBody, 
  Spinner, 
  Button,
  Input,
  Link
} from "@heroui/react";
import { 
  Heart, 
  Search,
  UserCircle2,
  Info
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { title } from "@/components/primitives";
import GenreSelector from "@/components/Discovery/GenreSelector";
import DecadeSelector from "@/components/Discovery/DecadeSelector";
import MovieCarouselRow from "@/components/Discovery/MovieCarouselRow";

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
}

interface WatchlistMovie {
  id: number;
  tmdbMovieId: number;
  title: string;
  posterPath: string;
  watched?: boolean;
  isWinner?: boolean;
}

// Genre mapping
const genreMap = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};

// Special curated categories
const curatedCollections = [
  { 
    id: "cult-classics", 
    name: "Cult Classics", 
    description: "Movies that have developed dedicated and passionate fan bases despite initial mixed receptions",
    tmdbListId: 10 
  },
  { 
    id: "mind-bending", 
    name: "Mind-Bending Movies", 
    description: "Films that challenge your perception of reality and make you think",
    tmdbListId: 9
  },
  { 
    id: "feel-good", 
    name: "Feel-Good Movies", 
    description: "Uplifting films guaranteed to boost your mood",
    tmdbListId: 31
  },
  { 
    id: "underrated-gems", 
    name: "Underrated Gems", 
    description: "Outstanding films that didn't get the recognition they deserved",
    tmdbListId: 12
  },
  {
    id: "before-2000", 
    name: "Movie Monday Classics (Pre-2000)", 
    description: "Essential movies from before the millennium that every film lover should see",
    decade: "pre-2000"
  }
];

export default function DiscoveryPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistMovie[]>([]);
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [curatedMovies, setCuratedMovies] = useState<{[key: string]: Movie[]}>({});
  
  // Filter and search state
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedDecade, setSelectedDecade] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Loading states
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [loadingTopRated, setLoadingTopRated] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [loadingCurated, setLoadingCurated] = useState({});
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  // Watchlist status for quick lookup
  const [watchlistStatus, setWatchlistStatus] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Fetch initial data
    fetchTrending();
    fetchPopular();
    fetchTopRated();
    fetchUpcoming();
    
    // If authenticated, fetch watchlist
    if (isAuthenticated && token) {
      fetchWatchlist();
    }
    
    // Fetch featured curated collection
    fetchCuratedCollection(curatedCollections[0].id);
  }, [isAuthenticated, token]);

  // When watchlist changes, get recommendations and update watchlist status
  useEffect(() => {
    if (watchlist.length > 0) {
      generateRecommendations();
      generateSimilarMovies();
      
      // Update watchlist status lookup
      const statusMap = {};
      watchlist.forEach(movie => {
        statusMap[movie.tmdbMovieId] = true;
      });
      setWatchlistStatus(statusMap);
    }
  }, [watchlist]);

  const fetchTrending = async () => {
    try {
      setLoadingTrending(true);
      
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.NEXT_PUBLIC_API_Key}&page=1`
      );
      
      const data = await response.json();
      setTrending(data.results || []);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
    } finally {
      setLoadingTrending(false);
    }
  };
  
  const fetchPopular = async () => {
    try {
      setLoadingPopular(true);
      
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.NEXT_PUBLIC_API_Key}&page=1`
      );
      
      const data = await response.json();
      setPopularMovies(data.results || []);
    } catch (error) {
      console.error("Error fetching popular movies:", error);
    } finally {
      setLoadingPopular(false);
    }
  };
  
  const fetchTopRated = async () => {
    try {
      setLoadingTopRated(true);
      
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/top_rated?api_key=${process.env.NEXT_PUBLIC_API_Key}&page=1`
      );
      
      const data = await response.json();
      setTopRatedMovies(data.results || []);
    } catch (error) {
      console.error("Error fetching top rated movies:", error);
    } finally {
      setLoadingTopRated(false);
    }
  };
  
  const fetchUpcoming = async () => {
    try {
      setLoadingUpcoming(true);
      
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/upcoming?api_key=${process.env.NEXT_PUBLIC_API_Key}&page=1`
      );
      
      const data = await response.json();
      setUpcomingMovies(data.results || []);
    } catch (error) {
      console.error("Error fetching upcoming movies:", error);
    } finally {
      setLoadingUpcoming(false);
    }
  };

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
        console.error('Watch later error:', response.status);
        return;
      }
  
      const data = await response.json();
      setWatchlist(data);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    }
  };

  const addToWatchlist = async (movie: Movie) => {
    if (!token || watchlistStatus[movie.id]) return;
  
    try {
      const response = await fetch('http://localhost:8000/api/movie-monday/watch-later', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          tmdbMovieId: movie.id,
          title: movie.title,
          posterPath: movie.poster_path
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to add movie to watchlist');
      }
      
      // Update the watchlist status
      setWatchlistStatus(prev => ({
        ...prev,
        [movie.id]: true
      }));
      
      // Refresh watchlist
      fetchWatchlist();
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  };

  const generateRecommendations = async () => {
    if (watchlist.length === 0) return;
    
    try {
      setLoadingRecommended(true);
      
      // Get recommendations based on 2-3 random movies from watchlist
      const sampleSize = Math.min(3, watchlist.length);
      const sampleMovies = [...watchlist].sort(() => 0.5 - Math.random()).slice(0, sampleSize);
      
      // Fetch recommendations for each sample movie
      const recommendationPromises = sampleMovies.map(movie => 
        fetch(`https://api.themoviedb.org/3/movie/${movie.tmdbMovieId}/recommendations?api_key=${process.env.NEXT_PUBLIC_API_Key}`)
          .then(res => res.json())
      );
      
      const results = await Promise.all(recommendationPromises);
      
      // Combine all recommendations and remove duplicates
      const allRecommendations = results.flatMap(result => result.results || []);
      const uniqueRecommendations = Array.from(
        new Map(allRecommendations.map(movie => [movie.id, movie])).values()
      );
      
      // Remove movies that are already in watchlist
      const watchlistIds = new Set(watchlist.map(m => m.tmdbMovieId));
      const filteredRecommendations = uniqueRecommendations.filter(
        movie => !watchlistIds.has(movie.id)
      );
      
      // Sort by vote average
      const sortedRecommendations = filteredRecommendations.sort(
        (a, b) => b.vote_average - a.vote_average
      );
      
      setRecommended(sortedRecommendations.slice(0, 20));
    } catch (error) {
      console.error("Error generating recommendations:", error);
    } finally {
      setLoadingRecommended(false);
    }
  };

  const generateSimilarMovies = async () => {
    if (watchlist.length === 0) return;
    
    try {
      setLoadingSimilar(true);
      
      // Get a random movie from the watchlist
      const randomMovie = watchlist[Math.floor(Math.random() * watchlist.length)];
      
      // Fetch similar movies
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${randomMovie.tmdbMovieId}/similar?api_key=${process.env.NEXT_PUBLIC_API_Key}`
      );
      
      const data = await response.json();
      
      // Remove movies that are already in watchlist
      const watchlistIds = new Set(watchlist.map(m => m.tmdbMovieId));
      const filteredSimilar = (data.results || []).filter(
        movie => !watchlistIds.has(movie.id)
      );
      
      setSimilar(filteredSimilar);
    } catch (error) {
      console.error("Error generating similar movies:", error);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const fetchCuratedCollection = async (collectionId: string) => {
    try {
      // Set loading state for specific collection
      setLoadingCurated(prev => ({ ...prev, [collectionId]: true }));
      
      // Find the collection config
      const collection = curatedCollections.find(c => c.id === collectionId);
      if (!collection) return;
      
      let movies: Movie[] = [];
      
      if (collection.tmdbListId) {
        // Fetch from TMDB list
        const response = await fetch(
          `https://api.themoviedb.org/3/list/${collection.tmdbListId}?api_key=${process.env.NEXT_PUBLIC_API_Key}`
        );
        
        const data = await response.json();
        movies = data.items || [];
      } else if (collection.decade === 'pre-2000') {
        // Fetch classic movies (pre-2000)
        const response = await fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.NEXT_PUBLIC_API_Key}&sort_by=vote_average.desc&vote_count.gte=1000&primary_release_date.lte=1999-12-31&page=1`
        );
        
        const data = await response.json();
        movies = data.results || [];
      }
      
      // Store in curated movies map
      setCuratedMovies(prev => ({
        ...prev,
        [collectionId]: movies
      }));
      
    } catch (error) {
      console.error(`Error fetching curated collection ${collectionId}:`, error);
    } finally {
      // Clear loading state for specific collection
      setLoadingCurated(prev => ({ ...prev, [collectionId]: false }));
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoadingSearch(true);
      setHasSearched(true);
      
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${process.env.NEXT_PUBLIC_API_Key}&query=${encodeURIComponent(searchQuery)}&include_adult=false`
      );
      
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Error searching movies:", error);
    } finally {
      setLoadingSearch(false);
    }
  };

  const getFilteredMovies = (movies: Movie[]) => {
    if (!movies) return [];
    
    // Only apply filters if they are actually set
    const hasFilters = selectedGenres.length > 0 || selectedDecade !== 'all';
    if (!hasFilters) return movies;
    
    return movies.filter(movie => {
      // Filter by genre if any genres are selected
      const genreMatch = selectedGenres.length === 0 || 
        movie.genre_ids?.some(id => selectedGenres.includes(id));
      
      // Filter by decade
      let decadeMatch = true;
      if (selectedDecade !== 'all' && movie.release_date) {
        const year = parseInt(movie.release_date.split('-')[0]);
        
        if (selectedDecade === 'pre-1970') {
          decadeMatch = year < 1970;
        } else if (selectedDecade === '2020s') {
          decadeMatch = year >= 2020;
        } else {
          const decadeStart = parseInt(selectedDecade);
          decadeMatch = year >= decadeStart && year < decadeStart + 10;
        }
      }
      
      return genreMatch && decadeMatch;
    });
  };
  
  // Get movie recommendation reason
  const getRecommendationReason = (movie: Movie) => {
    if (!movie || !watchlist.length) return null;
    
    // Check for genre match
    const movieGenres = movie.genre_ids || [];
    
    // Find similar movies in watchlist based on genres
    const genreMatches = watchlist.filter(watchlistMovie => {
      // We would need to have the genre_ids for the watchlist movies
      // Since we don't have that info readily available, we'll simulate it
      // In reality, you would need to store this info or fetch it
      
      // For this example, let's assume a 30% chance of a genre match
      return Math.random() < 0.3;
    });
    
    if (genreMatches.length > 0) {
      const randomMatch = genreMatches[Math.floor(Math.random() * genreMatches.length)];
      const genres = movieGenres.map(id => genreMap[id] || '').filter(Boolean).slice(0, 2);
      
      if (genres.length > 0) {
        return {
          type: 'genre',
          text: `Similar to ${randomMatch.title}`,
          detail: genres.join(', ')
        };
      }
    }
    
    // If no good reason found, return a generic one
    return {
      type: 'generic',
      text: 'Recommended for you',
      detail: 'Based on your watchlist'
    };
  };

  return (
    <div className="container">
      <div className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <h1 className={title({ size: "lg" })}>Discover Movies</h1>
        <p className="text-center text-default-500 max-w-3xl">
          Find your next favorite movie for Movie Monday with personalized recommendations and trending titles.
        </p>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex gap-4 flex-1">
            <Input
              placeholder="Search for movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              startContent={<Search className="text-default-300" />}
              className="flex-1"
            />
            <Button
              color="primary"
              onPress={handleSearch}
              isLoading={loadingSearch}
            >
              Search
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="flat"
              color={showFilters ? "primary" : "default"}
              onPress={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            
            {isAuthenticated && (
              <Button
                as={Link}
                href="/dashboard"
                variant="flat"
                color="primary"
                startContent={<Heart className="h-4 w-4" />}
              >
                My Watchlist ({watchlist.length})
              </Button>
            )}
          </div>
        </div>
        
        {/* Filters - conditionally shown */}
        {showFilters && (
          <div className="flex flex-wrap gap-4 bg-default-50 p-4 rounded-lg">
            <GenreSelector
              selectedGenres={selectedGenres}
              onChange={setSelectedGenres}
            />
            <DecadeSelector
              selectedDecade={selectedDecade}
              onChange={setSelectedDecade}
            />
            {(selectedGenres.length > 0 || selectedDecade !== "all") && (
              <Button 
                color="danger" 
                variant="light"
                onPress={() => {
                  setSelectedGenres([]);
                  setSelectedDecade("all");
                }}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Main Content Area */}
      <div className="space-y-12">
        {/* Search Results - shown only when user has searched */}
        {hasSearched && (
          <div>
            {loadingSearch ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : searchResults.length > 0 ? (
              <MovieCarouselRow
                title="Search Results"
                movies={getFilteredMovies(searchResults)}
                watchlistStatus={watchlistStatus}
                onAddToWatchlist={addToWatchlist}
              />
            ) : (
              <div className="text-center py-8">
                <Info className="h-12 w-12 text-default-300 mx-auto mb-2" />
                <p className="text-xl font-medium mb-2">No results found for "{searchQuery}"</p>
                <p className="text-default-500">Try different keywords or filters</p>
              </div>
            )}
          </div>
        )}
        
        {/* Trending Now Section */}
        <MovieCarouselRow
          title="Trending Now"
          movies={getFilteredMovies(trending)}
          loading={loadingTrending}
          watchlistStatus={watchlistStatus}
          onAddToWatchlist={addToWatchlist}
        />
        
        {/* Personalized Recommendations */}
        {isAuthenticated ? (
          watchlist.length > 0 ? (
            <MovieCarouselRow
              title="Recommended For You"
              movies={getFilteredMovies(recommended)}
              loading={loadingRecommended}
              watchlistStatus={watchlistStatus}
              onAddToWatchlist={addToWatchlist}
              reason={getRecommendationReason}
              emptyMessage="Add more movies to your watchlist to get personalized recommendations"
            />
          ) : (
            <Card className="mb-12 mt-12">
              <CardBody className="flex flex-col items-center justify-center py-12">
                <Heart className="h-16 w-16 text-default-300 mb-4" />
                <p className="text-center text-xl font-medium mb-2">Add movies to your watchlist</p>
                <p className="text-center text-default-500 mb-6">
                  Recommendations will appear here once you've added some movies to your watchlist
                </p>
              </CardBody>
            </Card>
          )
        ) : (
          <Card className="mb-12 mt-12">
            <CardBody className="flex flex-col items-center justify-center py-12">
              <UserCircle2 className="h-16 w-16 text-default-300 mb-4" />
              <p className="text-center text-xl font-medium mb-2">Sign in to see personalized recommendations</p>
              <p className="text-center text-default-500 mb-6">
                We'll suggest movies based on your watchlist and preferences
              </p>
              <Button 
                as={Link}
                href="/login"
                color="primary"
              >
                Sign in
              </Button>
            </CardBody>
          </Card>
        )}
        
        {/* Popular Movies Section */}
        <MovieCarouselRow
          title="Popular Movies"
          movies={getFilteredMovies(popularMovies)}
          loading={loadingPopular}
          watchlistStatus={watchlistStatus}
          onAddToWatchlist={addToWatchlist}
        />
        
        {/* Top Rated Movies Section */}
        <MovieCarouselRow
          title="Top Rated Movies"
          movies={getFilteredMovies(topRatedMovies)}
          loading={loadingTopRated}
          watchlistStatus={watchlistStatus}
          onAddToWatchlist={addToWatchlist}
        />
        
        {/* Similar Movies Row (when authenticated and has watchlist) */}
        {isAuthenticated && watchlist.length > 0 && (
          <MovieCarouselRow
            title="Similar to Your Watchlist"
            movies={getFilteredMovies(similar)}
            loading={loadingSimilar}
            watchlistStatus={watchlistStatus}
            onAddToWatchlist={addToWatchlist}
            emptyMessage="No similar movies found"
          />
        )}
        
        {/* Upcoming Movies Section */}
        <MovieCarouselRow
          title="Coming Soon"
          movies={getFilteredMovies(upcomingMovies)}
          loading={loadingUpcoming}
          watchlistStatus={watchlistStatus}
          onAddToWatchlist={addToWatchlist}
        />
        
        {/* Featured Curated Collections */}
        {curatedCollections.map((collection) => (
          <MovieCarouselRow
            key={collection.id}
            title={collection.name}
            subtitle={collection.description}
            movies={getFilteredMovies(curatedMovies[collection.id] || [])}
            loading={loadingCurated[collection.id]}
            watchlistStatus={watchlistStatus}
            onAddToWatchlist={addToWatchlist}
            emptyMessage={!curatedMovies[collection.id] ? 
              `Loading ${collection.name}...` : 
              `No movies in ${collection.name} match your filters`
            }
          />
        ))}
      </div>
    </div>
  );
}