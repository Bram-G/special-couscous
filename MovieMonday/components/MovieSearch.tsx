import React, { useState, useEffect, useRef } from 'react';
import { Input, Avatar } from "@heroui/react";
import { Search, Film } from "lucide-react";
import { useRouter } from "next/navigation";
import debounce from 'lodash/debounce';
import { useAuth } from "@/contexts/AuthContext"; 
import AddToWatchlistButton from './Watchlist/AddToWatchlistButton';

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
}

export const MovieSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  // Create a debounced search function
  const debouncedSearch = useRef(
    debounce(async (term: string) => {
      if (!term) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(term)}&include_adult=false&language=en-US&page=1&api_key=${process.env.NEXT_PUBLIC_API_Key}`
        );

        if (!response.ok) {
          throw new Error(`TMDB API error: ${response.status}`);
        }

        const data = await response.json();
        // Only take the first 5 results for quick suggestions
        setSuggestions(data.results.slice(0, 5));
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300) // Wait 300ms after the user stops typing before searching
  ).current;

  useEffect(() => {
    // Clean up the debounced function when component unmounts
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  useEffect(() => {
    // Add click event listener to handle clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
    debouncedSearch(value);
  };

  const handleMovieClick = (movieId: number) => {
    setShowSuggestions(false);
    setSearchTerm("");
    router.push(`/movie/${movieId}`);
  };
  
  // Handle search completion (when user presses Enter)
  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      router.push(`/discover?search=${encodeURIComponent(searchTerm.trim())}`);
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative w-64" ref={searchRef}>
      <Input
        classNames={{
          input: "text-small",
          inputWrapper: "h-8"
        }}
        placeholder="Search movies..."
        size="sm"
        startContent={<Search className="text-default-300 w-4 h-4" />}
        type="search"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleSearchSubmit}
        onFocus={() => setShowSuggestions(true)}
      />
      
      {showSuggestions && (searchTerm || isLoading) && (
        <div className="absolute top-full mt-2 w-full bg-content1 shadow-lg rounded-lg z-50 overflow-hidden">
          {isLoading ? (
            <div className="p-2 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"/>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {suggestions.map((movie) => (
                <div key={movie.id} className="p-2 hover:bg-default-100 transition-colors">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleMovieClick(movie.id)}>
                    <Avatar
                      src={movie.poster_path ? 
                        `https://image.tmdb.org/t/p/w92${movie.poster_path}` :
                        undefined
                      }
                      fallback={
                        <div className="w-8 h-12 bg-default-200 flex items-center justify-center rounded">
                          <Film className="w-4 h-4 text-default-500" />
                        </div>
                      }
                      className="w-8 h-12 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{movie.title}</p>
                      <p className="text-xs text-default-500">
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : ''}
                      </p>
                    </div>
                  </div>
                  {isAuthenticated && (
                    <div className="mt-1 pl-10">
                      <AddToWatchlistButton
                        movie={{
                          id: movie.id,
                          title: movie.title,
                          posterPath: movie.poster_path
                        }}
                        variant="light"
                        size="sm"
                        showText={false}
                        useQuickAdd={true}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : searchTerm && (
            <div className="p-2 text-center text-default-500">
              No movies found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MovieSearch;