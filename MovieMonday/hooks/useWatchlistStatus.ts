// MovieMonday/hooks/useWatchlistStatus.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface WatchlistStatus {
  inWatchlist: boolean;
  inDefaultWatchlist: boolean;
  watchlistIds: number[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to check if a movie is in any of the user's watchlists
 * @param movieId The TMDB movie ID to check
 * @returns Object with watchlist status information
 */
const useWatchlistStatus = (movieId: number): WatchlistStatus => {
  const { token, isAuthenticated } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inDefaultWatchlist, setInDefaultWatchlist] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!isAuthenticated || !token || !movieId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:8000/api/watchlists/status/${movieId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        setInWatchlist(data.inWatchlist);
        
        // Check if it's in the default watchlist
        if (data.watchlists && data.watchlists.length > 0) {
          const defaultWatchlist = data.watchlists.find(w => w.isDefault);
          setInDefaultWatchlist(!!defaultWatchlist);
          
          // Collect all watchlist IDs where this movie exists
          setWatchlistIds(data.watchlists.map(w => w.watchlistId));
        } else {
          setInDefaultWatchlist(false);
          setWatchlistIds([]);
        }
      } else {
        setInWatchlist(false);
        setInDefaultWatchlist(false);
        setWatchlistIds([]);
        
        if (response.status !== 404) { // Ignore 404 errors as they just mean "not found"
          const errorData = await response.json();
          setError(errorData.message || 'Failed to check watchlist status');
        }
      }
    } catch (err) {
      console.error('Error checking watchlist status:', err);
      setError('An error occurred while checking watchlist status');
      setInWatchlist(false);
      setInDefaultWatchlist(false);
      setWatchlistIds([]);
    } finally {
      setIsLoading(false);
    }
  }, [movieId, token, isAuthenticated]);

  // Check status on mount and when dependencies change
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Function to manually refresh the status
  const refresh = async () => {
    await checkStatus();
  };

  return {
    inWatchlist,
    inDefaultWatchlist,
    watchlistIds,
    isLoading,
    error,
    refresh
  };
};

export default useWatchlistStatus;