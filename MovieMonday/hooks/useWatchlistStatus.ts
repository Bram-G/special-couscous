// Save as hooks/useWatchlistStatus.ts

import { useState, useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";

interface WatchlistInfo {
  watchlistId: number;
  watchlistName: string;
  itemId: number;
  isDefault: boolean;
}

interface UseWatchlistStatusResult {
  inWatchlist: boolean;
  inDefaultWatchlist: boolean;
  watchlistIds: number[];
  watchlistInfo: WatchlistInfo[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook to check if a movie is in the user's watchlists
 * @param movieId The TMDB movie ID to check
 * @returns Status information about the movie in the user's watchlists
 */
export default function useWatchlistStatus(
  movieId: number,
): UseWatchlistStatusResult {
  const { token, isAuthenticated } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inDefaultWatchlist, setInDefaultWatchlist] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);
  const [watchlistInfo, setWatchlistInfo] = useState<WatchlistInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to check watchlist status
  const checkWatchlistStatus = async () => {
    // Skip if no movie ID, not authenticated, or no token
    if (!movieId || !isAuthenticated || !token) {
      setInWatchlist(false);
      setInDefaultWatchlist(false);
      setWatchlistIds([]);
      setWatchlistInfo([]);

      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the status endpoint to check all watchlists at once
      const response = await fetch(
        `http://localhost:8000/api/watchlists/status/${movieId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to check watchlist status: ${response.status}`);
      }

      const data = await response.json();

      // Update state based on response
      setInWatchlist(data.inWatchlist || false);
      setInDefaultWatchlist(data.inDefaultWatchlist || false);

      // Extract watchlist IDs and info
      if (data.watchlists && Array.isArray(data.watchlists)) {
        const ids = data.watchlists.map((w: any) => w.watchlistId);

        setWatchlistIds(ids);
        setWatchlistInfo(data.watchlists);
      } else {
        setWatchlistIds([]);
        setWatchlistInfo([]);
      }
    } catch (err) {
      console.error("Error checking watchlist status:", err);
      setError(err.message || "Failed to check watchlist status");
      // Don't reset status on error to prevent UI flicker
    } finally {
      setIsLoading(false);
    }
  };

  // Initial check
  useEffect(() => {
    if (movieId) {
      checkWatchlistStatus();
    }
  }, [movieId, token, isAuthenticated]);

  // Provide a way to manually refresh the status
  const refresh = async () => {
    await checkWatchlistStatus();
  };

  return {
    inWatchlist,
    inDefaultWatchlist,
    watchlistIds,
    watchlistInfo,
    isLoading,
    error,
    refresh,
  };
}
