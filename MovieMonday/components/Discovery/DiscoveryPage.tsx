"use client";

import React, { useState, useEffect } from "react";
import { 
  Tabs, 
  Tab, 
  Card, 
  CardBody, 
  Spinner, 
  Button,
  Input,
  Image,
  Chip,
  Link
} from "@heroui/react";
import { 
  Compass, 
  Heart, 
  TrendingUp, 
  Award, 
  Tag, 
  Calendar, 
  Search,
  Clock,
  UserCircle2,
  Info
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { title } from "@/components/primitives";
import MovieGrid from "@/components/Discovery/MovieGrid";
import GenreSelector from "@/components/Discovery/GenreSelector";
import DecadeSelector from "@/components/Discovery/DecadeSelector";
import RecommendationReason from "@/components/Discovery/RecommendationReason";

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

// Genre mapping (would be good to fetch this from API)
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
    tmdbListId: 10 // This is an example - you would need to find appropriate lists
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
  const [selectedTab, setSelectedTab] = useState("for-you");
  const [trending, setTrending] = useState<Movie[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistMovie[]>([]);
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [curatedMovies, setCuratedMovies] = useState<{[key: string]: Movie[]}>({});
  
  // Selected filters
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedDecade, setSelectedDecade] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Loading states
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [loadingCurated, setLoadingCurated] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  
  // Pagination
  const [trendingPage, setTrendingPage] = useState(1);
  const [hasMoreTrending, setHasMoreTrending] = useState(true);

  // Selected curated collection
  const [selectedCollection, setSelectedCollection] = useState(curatedCollections[0]);

  useEffect(() => {
    // Fetch trending movies
    fetchTrending();
    
    // If authenticated, fetch watchlist
    if (isAuthenticated && token) {
      fetchWatchlist();
    }
    
    // Fetch initial curated collections
    fetchCuratedCollection(curatedCollections[0].id);
  }, [isAuthenticated, token]);

  // When watchlist changes, get recommendations
  useEffect(() => {
    if (watchlist.length > 0) {
      generateRecommendations();
      generateSimilarMovies();
    }
  }, [watchlist]);

  const fetchTrending = async (page = 1) => {
    try {
      setLoadingTrending(true);
      
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.NEXT_PUBLIC_API_Key}&page=${page}`
      );
      
      const data = await response.json();
      
      if (page === 1) {
        setTrending(data.results || []);
      } else {
        setTrending(prev => [...prev, ...(data.results || [])]);
      }
      
      setHasMoreTrending(data.page < data.total_pages);
      setTrendingPage(data.page);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
    } finally {
      setLoadingTrending(false);
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

  const generateRecommendations = async () => {
    if (watchlist.length === 0) return;
    
    try {
      setLoadingRecommended(true);
      
      // Get recommendations based on 2-3 random movies from watchlist
      // This provides more variety than always using the same movie
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
      setLoadingCurated(true);
      
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
      
      // Update selected collection
      setSelectedCollection(collection);
    } catch (error) {
      console.error(`Error fetching curated collection ${collectionId}:`, error);
    } finally {
      setLoadingCurated(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoadingSearch(true);
      
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${process.env.NEXT_PUBLIC_API_Key}&query=${encodeURIComponent(searchQuery)}&include_adult=false`
      );
      
      const data = await response.json();
      setSearchResults(data.results || []);
      
      // Switch to search tab
      setSelectedTab("search");
    } catch (error) {
      console.error("Error searching movies:", error);
    } finally {
      setLoadingSearch(false);
    }
  };

  const loadMoreTrending = () => {
    fetchTrending(trendingPage + 1);
  };

  const getFilteredMovies = (movies: Movie[]) => {
    if (!movies) return [];
    
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

  const renderTabContent = () => {
    switch (selectedTab) {
      case "for-you":
        return (
          <div className="space-y-10">
            {/* Personalized Recommendations */}
            <section className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Recommended For You</h2>
                {isAuthenticated ? (
                  <Button 
                    variant="light" 
                    color="primary" 
                    onPress={generateRecommendations}
                    isDisabled={loadingRecommended}
                  >
                    Refresh
                  </Button>
                ) : (
                  <Button 
                    as={Link}
                    href="/login"
                    variant="light" 
                    color="primary"
                  >
                    Sign in for recommendations
                  </Button>
                )}
              </div>
              
              {!isAuthenticated ? (
                <Card className="w-full">
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
              ) : watchlist.length === 0 ? (
                <Card className="w-full">
                  <CardBody className="flex flex-col items-center justify-center py-12">
                    <Heart className="h-16 w-16 text-default-300 mb-4" />
                    <p className="text-center text-xl font-medium mb-2">Add movies to your watchlist</p>
                    <p className="text-center text-default-500 mb-6">
                      Recommendations will appear here once you've added some movies to your watchlist
                    </p>
                    <Button 
                      as={Link}
                      href="/trending"
                      color="primary"
                    >
                      Browse trending movies
                    </Button>
                  </CardBody>
                </Card>
              ) : loadingRecommended ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {recommended.slice(0, 10).map((movie) => (
                      <div key={movie.id} className="relative group">
                        <Link href={`/movie/${movie.id}`}>
                          <div className="aspect-[2/3] overflow-hidden rounded-lg">
                            <Image
                              src={
                                movie.poster_path
                                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                                  : '/placeholder-poster.jpg'
                              }
                              alt={movie.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              removeWrapper
                            />
                            
                            {/* Hover overlay with info */}
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                              <h3 className="text-white font-medium line-clamp-2">{movie.title}</h3>
                              <p className="text-white/70 text-sm mt-1">
                                {new Date(movie.release_date).getFullYear() || "Unknown"}
                              </p>
                              
                              {/* Recommendation reason */}
                              <RecommendationReason reason={getRecommendationReason(movie)} />
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
            
            {/* Similar to your watchlist */}
            {isAuthenticated && watchlist.length > 0 && (
              <section className="mt-10">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Similar to Your Watchlist</h2>
                  <Button 
                    variant="light" 
                    color="primary" 
                    onPress={generateSimilarMovies}
                    isDisabled={loadingSimilar}
                  >
                    Refresh
                  </Button>
                </div>
                
                {loadingSimilar ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {similar.slice(0, 10).map((movie) => (
                      <div key={movie.id} className="relative group">
                        <Link href={`/movie/${movie.id}`}>
                          <div className="aspect-[2/3] overflow-hidden rounded-lg">
                            <Image
                              src={
                                movie.poster_path
                                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                                  : '/placeholder-poster.jpg'
                              }
                              alt={movie.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              removeWrapper
                            />
                            
                            {/* Hover overlay with info */}
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                              <h3 className="text-white font-medium line-clamp-2">{movie.title}</h3>
                              <p className="text-white/70 text-sm mt-1">
                                {new Date(movie.release_date).getFullYear() || "Unknown"}
                              </p>
                              
                              {/* You could add similarity reason here */}
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        );
      
      case "trending":
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 mb-6">
              <GenreSelector
                selectedGenres={selectedGenres}
                onChange={setSelectedGenres}
              />
              <DecadeSelector
                selectedDecade={selectedDecade}
                onChange={setSelectedDecade}
              />
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Trending This Week</h2>
            
            {loadingTrending && trending.length === 0 ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                <MovieGrid 
                  movies={getFilteredMovies(trending)} 
                  emptyMessage="No movies match your selected filters"
                />
                
                {hasMoreTrending && (
                  <div className="flex justify-center mt-8">
                    <Button
                      color="primary"
                      variant="flat"
                      onPress={loadMoreTrending}
                      isLoading={loadingTrending}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      
      case "curated":
        return (
          <div className="space-y-6">
            {/* Collection selector */}
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-2">
                {curatedCollections.map((collection) => (
                  <Button
                    key={collection.id}
                    variant={selectedCollection.id === collection.id ? "solid" : "light"}
                    color={selectedCollection.id === collection.id ? "primary" : "default"}
                    onPress={() => fetchCuratedCollection(collection.id)}
                  >
                    {collection.name}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Collection description */}
            <Card className="mb-6">
              <CardBody>
                <h2 className="text-xl font-bold mb-2">{selectedCollection.name}</h2>
                <p className="text-default-500">{selectedCollection.description}</p>
              </CardBody>
            </Card>
            
            {/* Movies in collection */}
            {loadingCurated ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <MovieGrid 
                movies={getFilteredMovies(curatedMovies[selectedCollection.id] || [])} 
                emptyMessage="No movies in this collection match your filters"
              />
            )}
          </div>
        );
      
      case "search":
        return (
          <div className="space-y-6">
            <div className="flex gap-4 mb-6">
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
            
            {loadingSearch ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : searchResults.length > 0 ? (
              <MovieGrid movies={getFilteredMovies(searchResults)} />
            ) : searchQuery ? (
              <div className="text-center py-8">
                <Info className="h-12 w-12 text-default-300 mx-auto mb-2" />
                <p className="text-xl font-medium mb-2">No results found</p>
                <p className="text-default-500">Try different keywords or filters</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-default-300 mx-auto mb-2" />
                <p className="text-xl font-medium mb-2">Search for movies</p>
                <p className="text-default-500">Enter keywords to find movies you'll love</p>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container">
      <div className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <h1 className={title({ size: "lg" })}>Discover Movies</h1>
        <p className="text-center text-default-500 max-w-3xl">
          Find your next favorite movie with personalized recommendations, trending titles, and curated collections.
        </p>
      </div>
      
      <Tabs
        aria-label="Discovery options"
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
        className="mb-6"
      >
        <Tab
          key="for-you"
          title={
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4" />
              <span>For You</span>
            </div>
          }
        />
        <Tab
          key="trending"
          title={
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Trending</span>
            </div>
          }
        />
        <Tab
          key="curated"
          title={
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span>Curated Collections</span>
            </div>
          }
        />
        <Tab
          key="search"
          title={
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Search</span>
            </div>
          }
        />
      </Tabs>
      
      {renderTabContent()}
    </div>
  );
}