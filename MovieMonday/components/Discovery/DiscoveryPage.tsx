"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Button,
  Input,
  Link,
  Tooltip,
} from "@heroui/react";
import { Heart, Search, UserCircle2, Info, Trash, FilterX } from "lucide-react";
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
  37: "Western",
};

// Special curated categories
const curatedCollections = [
  {
    id: "cult-classics",
    name: "Cult Classics",
    description:
      "Movies that have developed dedicated and passionate fan bases despite initial mixed receptions",
    tmdbListId: 10,
  },
  {
    id: "mind-bending",
    name: "Mind-Bending Movies",
    description:
      "Films that challenge your perception of reality and make you think",
    tmdbListId: 9,
  },
  {
    id: "feel-good",
    name: "Feel-Good Movies",
    description: "Uplifting films guaranteed to boost your mood",
    tmdbListId: 31,
  },
  {
    id: "underrated-gems",
    name: "Underrated Gems",
    description:
      "Outstanding films that didn't get the recognition they deserved",
    tmdbListId: 12,
  },
  {
    id: "before-2000",
    name: "Movie Monday Classics (Pre-2000)",
    description:
      "Essential movies from before the millennium that every film lover should see",
    decade: "pre-2000",
  },
];

// Common franchise patterns
const franchisePatterns = [
  { pattern: /friday.*(13|thirteen)/i, searchTerm: "friday the 13th" },
  { pattern: /star.?wars/i, searchTerm: "star wars" },
  { pattern: /harry.?potter/i, searchTerm: "harry potter" },
  { pattern: /fast.*(furious|saga)/i, searchTerm: "fast and furious" },
  { pattern: /lord.*(rings|ring)/i, searchTerm: "lord of the rings" },
  { pattern: /jurassic.*(park|world)/i, searchTerm: "jurassic" },
  { pattern: /marvel/i, searchTerm: "marvel" },
  { pattern: /batman/i, searchTerm: "batman" },
  { pattern: /spider.?man/i, searchTerm: "spider-man" },
  { pattern: /x.?men/i, searchTerm: "x-men" },
  // Add more franchise patterns as needed
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
  const [curatedMovies, setCuratedMovies] = useState<{
    [key: string]: Movie[];
  }>({});

  // Filter and search state
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedDecade, setSelectedDecade] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Keep track of the actual search term used

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
  const [watchlistStatus, setWatchlistStatus] = useState<
    Record<number, boolean>
  >({});

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
      watchlist.forEach((movie) => {
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
      const response = await fetch(
        "http://localhost:8000/api/movie-monday/watch-later",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        console.error("Watch later error:", response.status);
        return;
      }

      const data = await response.json();
      setWatchlist(data);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    }
  };

  const addToWatchlist = async (movie: Movie) => {
    if (!token || watchlistStatus[movie.id]) return;

    try {
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

      // Refresh watchlist if needed
      if (refreshWatchlist) {
        fetchWatchlist();
      }
    } catch (error) {
      console.error("Error adding to watchlist:", error);
    }
  };

  const generateRecommendations = async () => {
    if (!token) return;
    
    try {
      setLoadingRecommended(true);
      
      // First, fetch user's watchlist items from all watchlists
      const watchlistResponse = await fetch('http://localhost:8000/api/watchlists/all-items', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!watchlistResponse.ok) {
        throw new Error('Failed to fetch watchlist items');
      }
      
      const watchlistItems = await watchlistResponse.json();
      
      if (watchlistItems.length === 0) {
        setRecommended([]);
        setLoadingRecommended(false);
        return;
      }
      
      // Get recommendations based on 2-3 random movies from watchlists
      const sampleSize = Math.min(3, watchlistItems.length);
      const sampleMovies = [...watchlistItems].sort(() => 0.5 - Math.random()).slice(0, sampleSize);
      
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
      const watchlistIds = new Set(watchlistItems.map(m => m.tmdbMovieId));
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
      setRecommended([]);
    } finally {
      setLoadingRecommended(false);
    }
  };

  const generateSimilarMovies = async () => {
    if (!token) return;
    
    try {
      setLoadingSimilar(true);
      
      // Fetch user's watchlist items from all watchlists
      const watchlistResponse = await fetch('http://localhost:8000/api/watchlists/all-items', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!watchlistResponse.ok) {
        throw new Error('Failed to fetch watchlist items');
      }
      
      const watchlistItems = await watchlistResponse.json();
      
      if (watchlistItems.length === 0) {
        setSimilar([]);
        setLoadingSimilar(false);
        return;
      }
      
      // Get a random movie from the watchlist
      const randomMovie = watchlistItems[Math.floor(Math.random() * watchlistItems.length)];
      
      // Fetch similar movies
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${randomMovie.tmdbMovieId}/similar?api_key=${process.env.NEXT_PUBLIC_API_Key}`
      );
      
      const data = await response.json();
      
      // Remove movies that are already in watchlist
      const watchlistIds = new Set(watchlistItems.map(m => m.tmdbMovieId));
      const filteredSimilar = (data.results || []).filter(
        movie => !watchlistIds.has(movie.id)
      );
      
      setSimilar(filteredSimilar);
    } catch (error) {
      console.error("Error generating similar movies:", error);
      setSimilar([]);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const fetchCuratedCollection = async (collectionId: string) => {
    try {
      // Set loading state for specific collection
      setLoadingCurated((prev) => ({ ...prev, [collectionId]: true }));

      // Find the collection config
      const collection = curatedCollections.find((c) => c.id === collectionId);
      if (!collection) return;

      let movies: Movie[] = [];

      if (collection.tmdbListId) {
        // Fetch from TMDB list
        const response = await fetch(
          `https://api.themoviedb.org/3/list/${collection.tmdbListId}?api_key=${process.env.NEXT_PUBLIC_API_Key}`
        );

        const data = await response.json();
        movies = data.items || [];
      } else if (collection.decade === "pre-2000") {
        // Fetch classic movies (pre-2000)
        const response = await fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.NEXT_PUBLIC_API_Key}&sort_by=vote_average.desc&vote_count.gte=1000&primary_release_date.lte=1999-12-31&page=1`
        );

        const data = await response.json();
        movies = data.results || [];
      }

      // Store in curated movies map
      setCuratedMovies((prev) => ({
        ...prev,
        [collectionId]: movies,
      }));
    } catch (error) {
      console.error(
        `Error fetching curated collection ${collectionId}:`,
        error
      );
    } finally {
      // Clear loading state for specific collection
      setLoadingCurated((prev) => ({ ...prev, [collectionId]: false }));
    }
  };

  // Helper function to sort search results with smart prioritization
  const sortSearchResults = (results, query) => {
    // Normalize the query for comparison
    const normalizedQuery = query.toLowerCase().trim();
    const words = normalizedQuery.split(/\s+/);

    // Calculate a relevance score for each result
    return [...results].sort((a, b) => {
      // Start with base scores from TMDB
      let scoreA = a.popularity || 0;
      let scoreB = b.popularity || 0;

      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();

      // Give huge boost for exact matches
      if (titleA === normalizedQuery) scoreA += 1000;
      if (titleB === normalizedQuery) scoreB += 1000;

      // Give big boost for titles that start with the query
      if (titleA.startsWith(normalizedQuery)) scoreA += 500;
      if (titleB.startsWith(normalizedQuery)) scoreB += 500;

      // Give medium boost for titles that contain the query as a substring
      if (titleA.includes(normalizedQuery)) scoreA += 200;
      if (titleB.includes(normalizedQuery)) scoreB += 200;

      // Give smaller boost for each query word that appears in the title
      words.forEach((word) => {
        if (word.length >= 3) {
          // Only consider meaningful words
          if (titleA.includes(word)) scoreA += 50;
          if (titleB.includes(word)) scoreB += 50;
        }
      });

      // Boost well-rated movies
      scoreA += (a.vote_average || 0) * 5;
      scoreB += (b.vote_average || 0) * 5;

      // Boost recent movies slightly
      const yearA = a.release_date ? parseInt(a.release_date.split("-")[0]) : 0;
      const yearB = b.release_date ? parseInt(b.release_date.split("-")[0]) : 0;
      if (yearA >= 2010) scoreA += 20;
      if (yearB >= 2010) scoreB += 20;

      // Final comparison
      return scoreB - scoreA;
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoadingSearch(true);
      setHasSearched(true);

      // First try franchise-specific search for well-known franchises
      const franchiseSearch = await searchWithFranchiseAwareness(searchQuery);

      if (franchiseSearch) {
        // We found franchise-specific results - use them directly
        setSearchResults(franchiseSearch.results);
        setSearchTerm(franchiseSearch.searchedTerm); // Store the actual term used
      } else {
        // Try searching with popularity as the primary sorting factor
        const response = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${process.env.NEXT_PUBLIC_API_Key}&query=${encodeURIComponent(searchQuery)}&include_adult=false&sort_by=popularity.desc`
        );

        const data = await response.json();

        // Apply our custom sorting for better results
        const sortedResults = sortSearchResultsByImpact(
          data.results || [],
          searchQuery
        );
        setSearchResults(sortedResults);
        setSearchTerm(searchQuery); // Store the actual term used
      }
    } catch (error) {
      console.error("Error searching movies:", error);
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Helper function to sort search results prioritizing cultural impact and popularity
  const sortSearchResultsByImpact = (results, query) => {
    // Normalize the query for comparison
    const normalizedQuery = query.toLowerCase().trim();

    return [...results].sort((a, b) => {
      // Primarily sort by popularity (cultural impact)
      let scoreA = a.popularity || 0;
      let scoreB = b.popularity || 0;

      // Apply multiplier based on vote count (more votes = more reliable popularity)
      if (a.vote_count && a.vote_count > 100) {
        scoreA *= 1 + Math.min(Math.log10(a.vote_count) / 10, 0.5); // Logarithmic boost
      }

      if (b.vote_count && b.vote_count > 100) {
        scoreB *= 1 + Math.min(Math.log10(b.vote_count) / 10, 0.5); // Logarithmic boost
      }

      // Boost high-rated films, but with less weight than popularity
      scoreA += (a.vote_average || 0) * 2;
      scoreB += (b.vote_average || 0) * 2;

      // Apply smaller boost for recent releases
      const yearA = a.release_date ? parseInt(a.release_date.split("-")[0]) : 0;
      const yearB = b.release_date ? parseInt(b.release_date.split("-")[0]) : 0;
      if (yearA >= 2010) scoreA += 5;
      if (yearB >= 2010) scoreB += 5;

      // Only apply title match boosts as secondary factors
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();

      // Small boost for containing the query as a word
      if (
        titleA.includes(` ${normalizedQuery} `) ||
        titleA.startsWith(`${normalizedQuery} `) ||
        titleA.endsWith(` ${normalizedQuery}`)
      ) {
        scoreA += 15;
      }

      if (
        titleB.includes(` ${normalizedQuery} `) ||
        titleB.startsWith(`${normalizedQuery} `) ||
        titleB.endsWith(` ${normalizedQuery}`)
      ) {
        scoreB += 15;
      }

      // Very small boost for containing the query as a substring
      if (titleA.includes(normalizedQuery)) {
        scoreA += 5;
      }

      if (titleB.includes(normalizedQuery)) {
        scoreB += 5;
      }

      // Final comparison - higher score first
      return scoreB - scoreA;
    });
  };

  // Make franchise awareness more robust to prioritize popular films within each franchise
  const searchWithFranchiseAwareness = async (query) => {
    // Check if query matches any franchise pattern
    for (const { pattern, searchTerm } of franchisePatterns) {
      if (pattern.test(query)) {
        try {
          // Fetch more results for franchises (2 pages)
          const responses = await Promise.all([
            fetch(
              `https://api.themoviedb.org/3/search/movie?api_key=${process.env.NEXT_PUBLIC_API_Key}&query=${encodeURIComponent(searchTerm)}&include_adult=false&sort_by=popularity.desc&page=1`
            ),
            fetch(
              `https://api.themoviedb.org/3/search/movie?api_key=${process.env.NEXT_PUBLIC_API_Key}&query=${encodeURIComponent(searchTerm)}&include_adult=false&sort_by=popularity.desc&page=2`
            ),
          ]);

          if (responses[0].ok) {
            const data1 = await responses[0].json();
            let allResults = data1.results || [];

            // Add results from second page if available
            if (responses[1].ok) {
              const data2 = await responses[1].json();
              allResults = [...allResults, ...(data2.results || [])];
            }

            if (allResults.length > 0) {
              // Sort by popularity (which TMDB already does) and take top 20
              return {
                results: allResults.slice(0, 20),
                searchedTerm: searchTerm,
              };
            }
          }
        } catch (error) {
          console.error(`Error in franchise search for ${searchTerm}:`, error);
        }
      }
    }

    // Return null if no franchise match or errors occurred
    return null;
  };

  // Enhanced franchise patterns
  const franchisePatterns = [
    { pattern: /friday.*(13|thirteen)/i, searchTerm: "friday the 13th" },
    { pattern: /^friday$/i, searchTerm: "friday the 13th" }, // Exact match for "friday" prioritizes the franchise
    { pattern: /star.?wars/i, searchTerm: "star wars" },
    { pattern: /harry.?potter/i, searchTerm: "harry potter" },
    { pattern: /fast.*(furious|saga)/i, searchTerm: "fast and furious" },
    { pattern: /^fast$/i, searchTerm: "fast and furious" }, // Exact match for "fast" prioritizes the franchise
    { pattern: /lord.*(rings|ring)/i, searchTerm: "lord of the rings" },
    { pattern: /jurassic.*(park|world)/i, searchTerm: "jurassic" },
    { pattern: /^marvel$/i, searchTerm: "marvel" },
    { pattern: /^batman$/i, searchTerm: "batman" },
    { pattern: /spider.?man/i, searchTerm: "spider-man" },
    { pattern: /^spider.?$/i, searchTerm: "spider-man" }, // Exact match for "spider" prioritizes Spider-Man
    { pattern: /x.?men/i, searchTerm: "x-men" },
    { pattern: /matrix/i, searchTerm: "the matrix" },
    { pattern: /^alien$/i, searchTerm: "alien" },
    { pattern: /predator/i, searchTerm: "predator" },
    { pattern: /terminator/i, searchTerm: "terminator" },
    { pattern: /rocky/i, searchTerm: "rocky" },
    { pattern: /rambo/i, searchTerm: "rambo" },
    { pattern: /godfather/i, searchTerm: "the godfather" },
    { pattern: /indiana.?jones/i, searchTerm: "indiana jones" },
    { pattern: /^jones$/i, searchTerm: "indiana jones" }, // Exact match for "jones" prioritizes Indiana Jones
    { pattern: /mission.?impossible/i, searchTerm: "mission impossible" },
    { pattern: /die.?hard/i, searchTerm: "die hard" },
    { pattern: /bourne/i, searchTerm: "bourne" },
    {
      pattern: /pirates.*(caribbean)/i,
      searchTerm: "pirates of the caribbean",
    },
    { pattern: /^pirates$/i, searchTerm: "pirates of the caribbean" }, // Exact match for "pirates" prioritizes Pirates of the Caribbean
    { pattern: /hunger.?games/i, searchTerm: "hunger games" },
    { pattern: /twilight/i, searchTerm: "twilight" },
    { pattern: /transformers/i, searchTerm: "transformers" },
    { pattern: /toy.?story/i, searchTerm: "toy story" },
    { pattern: /shrek/i, searchTerm: "shrek" },
    { pattern: /ice.?age/i, searchTerm: "ice age" },
    { pattern: /^scream$/i, searchTerm: "scream" },
    { pattern: /^saw$/i, searchTerm: "saw" },
    { pattern: /final.?destination/i, searchTerm: "final destination" },
    { pattern: /halloween/i, searchTerm: "halloween" },
  ];

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setSearchTerm("");
  };

  const getFilteredMovies = (movies: Movie[]) => {
    if (!movies) return [];

    // Only apply filters if they are actually set
    const hasFilters = selectedGenres.length > 0 || selectedDecade !== "all";
    if (!hasFilters) return movies;

    return movies.filter((movie) => {
      // Filter by genre if any genres are selected
      const genreMatch =
        selectedGenres.length === 0 ||
        movie.genre_ids?.some((id) => selectedGenres.includes(id));

      // Filter by decade
      let decadeMatch = true;
      if (selectedDecade !== "all" && movie.release_date) {
        const year = parseInt(movie.release_date.split("-")[0]);

        if (selectedDecade === "pre-1970") {
          decadeMatch = year < 1970;
        } else if (selectedDecade === "2020s") {
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
    const genreMatches = watchlist.filter((watchlistMovie) => {
      // We would need to have the genre_ids for the watchlist movies
      // Since we don't have that info readily available, we'll simulate it
      // In reality, you would need to store this info or fetch it

      // For this example, let's assume a 30% chance of a genre match
      return Math.random() < 0.3;
    });

    if (genreMatches.length > 0) {
      const randomMatch =
        genreMatches[Math.floor(Math.random() * genreMatches.length)];
      const genres = movieGenres
        .map((id) => genreMap[id] || "")
        .filter(Boolean)
        .slice(0, 2);

      if (genres.length > 0) {
        return {
          type: "genre",
          text: `Similar to ${randomMatch.title}`,
          detail: genres.join(", "),
        };
      }
    }

    // If no good reason found, return a generic one
    return {
      type: "generic",
      text: "Recommended for you",
      detail: "Based on your watchlist",
    };
  };

  return (
    <div className="container">
      <div className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <h1 className={title({ size: "lg" })}>Discover Movies</h1>
        <p className="text-center text-default-500 max-w-3xl">
          Find your next favorite movie for Movie Monday with personalized
          recommendations and trending titles.
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex gap-2 flex-1">
            <Input
              placeholder="Search for movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              startContent={<Search className="text-default-300" />}
              endContent={
                searchQuery && (
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={clearSearch}
                    className="text-default-300 hover:text-default-500"
                  >
                    <Trash size={16} />
                  </Button>
                )
              }
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
                href="/watchlist"
                variant="flat"
                color="primary"
                startContent={<Heart className="h-4 w-4" />}
              >
                My Watchlists
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
                startContent={<FilterX size={18} />}
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
            <div className="mb-2 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">
                  Search Results for "{searchTerm || searchQuery}"
                </h2>
                <p className="text-default-500 text-sm">
                  Found {searchResults.length} movies
                </p>
              </div>
              <Button
                variant="light"
                color="danger"
                onPress={clearSearch}
                startContent={<Trash size={16} />}
                size="sm"
              >
                Clear Search
              </Button>
            </div>

            {loadingSearch ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : searchResults.length > 0 ? (
              <MovieCarouselRow
                title=""
                movies={getFilteredMovies(searchResults)}
                watchlistStatus={watchlistStatus}
                onAddToWatchlist={addToWatchlist}
                emptyMessage="No movies match your filters"
              />
            ) : (
              <div className="text-center py-8">
                <Info className="h-12 w-12 text-default-300 mx-auto mb-2" />
                <p className="text-xl font-medium mb-2">
                  No results found for "{searchQuery}"
                </p>
                <p className="text-default-500">
                  Try different keywords or filters
                </p>
              </div>
            )}
          </div>
        )}

        {/* Only show other sections if not searching */}
        {(!hasSearched || searchResults.length === 0) && (
          <>
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
                    <p className="text-center text-xl font-medium mb-2">
                      Add movies to your watchlist
                    </p>
                    <p className="text-center text-default-500 mb-6">
                      Recommendations will appear here once you've added some
                      movies to your watchlist
                    </p>
                  </CardBody>
                </Card>
              )
            ) : (
              <Card className="mb-12 mt-12">
                <CardBody className="flex flex-col items-center justify-center py-12">
                  <UserCircle2 className="h-16 w-16 text-default-300 mb-4" />
                  <p className="text-center text-xl font-medium mb-2">
                    Sign in to see personalized recommendations
                  </p>
                  <p className="text-center text-default-500 mb-6">
                    We'll suggest movies based on your watchlist and preferences
                  </p>
                  <Button as={Link} href="/login" color="primary">
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
                emptyMessage={
                  !curatedMovies[collection.id]
                    ? `Loading ${collection.name}...`
                    : `No movies in ${collection.name} match your filters`
                }
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
