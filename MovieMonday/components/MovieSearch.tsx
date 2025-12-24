import React, { useState, useEffect, useRef } from "react";
import { Input, Avatar, Badge } from "@heroui/react";
import { Search, Film } from "lucide-react";
import { useRouter } from "next/navigation";
import debounce from "lodash/debounce";

import AddToWatchlistButton from "./Watchlist/AddToWatchlistButton";

import { useAuth } from "@/contexts/AuthContext";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
  isWatched?: boolean;
}

export const MovieSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isAuthenticated, currentGroupId } = useAuth();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Store currentGroupId in a ref so debounced function can access the latest value
  const currentGroupIdRef = useRef(currentGroupId);
  
  useEffect(() => {
    currentGroupIdRef.current = currentGroupId;
    console.log('MovieSearch - currentGroupId updated:', currentGroupId);
  }, [currentGroupId]);

  // Debug logging
  useEffect(() => {
    console.log('MovieSearch - Auth state:', { isAuthenticated, currentGroupId });
  }, [isAuthenticated, currentGroupId]);

  // Check which movies have been watched
  const checkWatchedStatus = async (movies: Movie[]) => {
    // Use the ref to get the latest currentGroupId
    const groupId = currentGroupIdRef.current;
    
    if (!groupId) {
      console.log('MovieSearch checkWatchedStatus - No currentGroupId, skipping');
      return;
    }

    try {
      const tmdbIds = movies.map(m => m.id);
      
      console.log('MovieSearch - Making check-watched request:', {
        url: `${API_BASE_URL}/api/movie-monday/check-watched`,
        group_id: groupId,
        tmdb_ids: tmdbIds
      });
      
      const response = await fetch(
        `${API_BASE_URL}/api/movie-monday/check-watched`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            group_id: groupId,
            tmdb_ids: tmdbIds
          })
        }
      );

      if (response.ok) {
        const { watched } = await response.json();
        console.log('MovieSearch - Watched status response:', watched);
        
        // Update suggestions with watched status
        setSuggestions(prev =>
          prev.map(movie => ({
            ...movie,
            isWatched: watched.includes(movie.id)
          }))
        );
      } else {
        console.error('MovieSearch - check-watched response not ok:', response.status, await response.text());
      }
    } catch (error) {
      console.error('MovieSearch - Error checking watched status:', error);
      // Silently fail - search results still work without this
    }
  };

  // Create a debounced search function
  const debouncedSearch = useRef(
    debounce(async (term: string, performCheckWatchedStatus: (movies: Movie[]) => Promise<void>) => {
      if (!term) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(term)}&include_adult=false&language=en-US&page=1&api_key=${process.env.NEXT_PUBLIC_API_Key}`,
        );

        if (!response.ok) {
          throw new Error(`TMDB API error: ${response.status}`);
        }

        const data = await response.json();

        // Get first 5 results for quick suggestions
        const results = data.results.slice(0, 5);
        setSuggestions(results);

        // Check watched status in parallel
        // Pass the function so it uses the latest currentGroupId via ref
        if (results.length > 0) {
          console.log('MovieSearch - Calling checkWatchedStatus with currentGroupIdRef:', currentGroupIdRef.current);
          performCheckWatchedStatus(results);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
  ).current;

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
    // Pass the checkWatchedStatus function to debounced search
    debouncedSearch(value, checkWatchedStatus);
  };

  const handleMovieClick = (movieId: number) => {
    setShowSuggestions(false);
    setSearchTerm("");
    router.push(`/movie/${movieId}`);
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      router.push(`/discover?search=${encodeURIComponent(searchTerm.trim())}`);
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={searchRef} className="relative w-64">
      <Input
        classNames={{
          input: "text-small",
          inputWrapper: "h-8",
        }}
        placeholder="Search movies..."
        size="sm"
        startContent={<Search className="text-default-300 w-4 h-4" />}
        type="search"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleSearchSubmit}
      />

      {showSuggestions && (searchTerm || isLoading) && (
        <div className="absolute top-full mt-2 w-full bg-content1 shadow-lg rounded-lg z-50 overflow-hidden">
          {isLoading ? (
            <div className="p-2 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
            </div>
          ) : suggestions.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {suggestions.map((movie) => (
                <div
                  key={movie.id}
                  className="p-2 hover:bg-default-100 transition-colors"
                >
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => handleMovieClick(movie.id)}
                  >
                    <Avatar
                      className="w-8 h-12 rounded"
                      fallback={
                        <div className="w-8 h-12 bg-default-200 flex items-center justify-center rounded">
                          <Film className="w-4 h-4 text-default-500" />
                        </div>
                      }
                      src={
                        movie.poster_path
                          ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
                          : undefined
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {movie.title}
                        </p>
                        {/* Watched indicator */}
                        {movie.isWatched && (
                          <Badge 
                            color="success" 
                            variant="flat" 
                            size="sm"
                            className="shrink-0"
                          >
                            ✓
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-default-500">
                        {movie.release_date
                          ? new Date(movie.release_date).getFullYear()
                          : "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-default-500">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};