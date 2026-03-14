import React, { useState, useEffect, useRef } from "react";
import { Input, Avatar } from "@heroui/react";
import { Search, Film, Eye, Clock } from "lucide-react";
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
  isVotedOn?: boolean;
}

export const MovieSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isAuthenticated, currentGroupId } = useAuth();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Store currentGroupId in a ref so debounced function can access the latest value
  const currentGroupIdRef = useRef(currentGroupId);

  useEffect(() => {
    currentGroupIdRef.current = currentGroupId;
  }, [currentGroupId]);

  // Check which movies have been watched OR voted on
  const checkDiscoveryStatus = async (movies: Movie[]) => {
    const groupId = currentGroupIdRef.current;

    if (!groupId) return;

    try {
      const tmdbIds = movies.map((m) => m.id);

      const response = await fetch(
        `${API_BASE_URL}/api/movie-monday/discovery-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            group_id: groupId,
            tmdb_ids: tmdbIds,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Build sets for fast lookup
        const watchedSet = new Set<number>(data.watched || []);
        const votedSet = new Set<number>(
          (data.votedButNotPicked || []).map((m: any) => m.tmdbMovieId)
        );

        // Update suggestions with accurate status
        setSuggestions((prev) =>
          prev.map((movie) => ({
            ...movie,
            isWatched: watchedSet.has(movie.id),
            // Only mark as voted if it has NOT also been watched
            isVotedOn: !watchedSet.has(movie.id) && votedSet.has(movie.id),
          }))
        );
      }
    } catch (error) {
      console.error("MovieSearch - Error checking discovery status:", error);
      // Silently fail — search results still work without this
    }
  };

  // Create a debounced search function
  const debouncedSearch = useRef(
    debounce(
      async (
        term: string,
        performCheck: (movies: Movie[]) => Promise<void>
      ) => {
        if (!term) {
          setSuggestions([]);
          return;
        }

        setIsLoading(true);
        try {
          const response = await fetch(
            `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(term)}&include_adult=false&language=en-US&page=1&api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
          );

          if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);

          const data = await response.json();
          const results = data.results.slice(0, 5);
          setSuggestions(results);

          if (results.length > 0) {
            performCheck(results);
          }
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      },
      300
    )
  ).current;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);

    if (value.trim()) {
      debouncedSearch(value, checkDiscoveryStatus);
    } else {
      setSuggestions([]);
    }
  };

  const handleMovieClick = (movieId: number) => {
    setShowSuggestions(false);
    setSearchTerm("");
    setSuggestions([]);
    router.push(`/movie/${movieId}`);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative w-64">
      <Input
        classNames={{
          inputWrapper: "h-9",
        }}
        endContent={
          isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          ) : (
            <Search className="h-4 w-4 text-default-400" />
          )
        }
        placeholder="Search movies..."
        size="sm"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
      />

      {showSuggestions && (searchTerm || suggestions.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-content1 border border-default-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {isLoading ? (
            <div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            </div>
          ) : suggestions.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {suggestions.map((movie) => (
                <div
                  key={movie.id}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors
                    hover:bg-default-100
                    ${movie.isWatched ? "opacity-60" : ""}
                  `}
                  onClick={() => handleMovieClick(movie.id)}
                >
                  {/* Poster thumbnail */}
                  <div className="relative flex-shrink-0 w-9 h-[54px] rounded-md overflow-hidden">
                    {movie.poster_path ? (
                      <>
                        <img
                          src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                          alt={movie.title}
                          className={`w-full h-full object-cover ${movie.isWatched ? "brightness-50" : ""}`}
                        />
                        {/* Watched overlay icon */}
                        {movie.isWatched && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white drop-shadow-md" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full bg-default-200 flex items-center justify-center rounded-md">
                        <Film className="w-4 h-4 text-default-400" />
                      </div>
                    )}
                  </div>

                  {/* Title + year */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate leading-tight">
                      {movie.title}
                    </p>
                    <p className="text-xs text-default-500 mt-0.5">
                      {movie.release_date
                        ? new Date(movie.release_date).getFullYear()
                        : "Unknown"}
                    </p>
                  </div>

                  {/* Status badge */}
                  {movie.isWatched && (
                    <div className="flex items-center gap-1 bg-success/15 text-success rounded-full px-2 py-0.5 flex-shrink-0">
                      <Eye className="w-3 h-3" />
                      <span className="text-xs font-semibold">Watched</span>
                    </div>
                  )}
                  {movie.isVotedOn && (
                    <div className="flex items-center gap-1 bg-warning/15 text-warning rounded-full px-2 py-0.5 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs font-semibold">Voted</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : searchTerm ? (
            <div className="p-4 text-center text-sm text-default-500">
              No results found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};