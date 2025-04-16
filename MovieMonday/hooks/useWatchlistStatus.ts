'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to check if a movie is in any of the user's watchlists
 * @param movieId - The TMDB movie ID to check
 */
export default function useWatchlistStatus(movieId: number) {
  const { token, isAuthenticated } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inDefaultWatchlist, setInDefaultWatchlist] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allWatchlistMovieIds, setAllWatchlistMovieIds] = useState<number[]>([]);

  const checkStatus = async () => {
    if (!isAuthenticated || !token || !movieId) {
      setInWatchlist(false);
      setInDefaultWatchlist(false);
      setWatchlistIds([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/api/watchlists/status/${movieId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to check watchlist status: ${response.status}`);
      }

      const data = await response.json();
      setInWatchlist(!!data.inWatchlist);
      
      // Check if any watchlist is marked as default
      const defaultWatchlist = data.watchlists?.find(w => w.isDefault);
      setInDefaultWatchlist(!!defaultWatchlist);
      
      // Extract watchlist IDs
      setWatchlistIds(
        (data.watchlists || [])
          .filter(w => w && w.watchlistId)
          .map(w => w.watchlistId)
      );

      if (isAuthenticated && token) {
        try {
          const allMoviesResponse = await fetch(
            'http://localhost:8000/api/watchlists/all-movies',
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            }
          );
          
          if (allMoviesResponse.ok) {
            const moviesData = await allMoviesResponse.json();
            // Set the array of all movie IDs from all watchlists
            setAllWatchlistMovieIds(moviesData.map(m => m.tmdbMovieId));
          }
        } catch (err) {
          console.error('Error fetching all watchlist movies:', err);
          setAllWatchlistMovieIds([]);
        }
      }
    } catch (err) {
      console.error('Error checking watchlist status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setInWatchlist(false);
      setInDefaultWatchlist(false);
      setWatchlistIds([]);
      setAllWatchlistMovieIds([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Check status when component mounts or movieId changes
  useEffect(() => {
    checkStatus();
  }, [movieId, token, isAuthenticated]);

  return {
    inWatchlist,
    inDefaultWatchlist,
    watchlistIds,
    allWatchlistMovieIds,
    isLoading,
    error,
    refresh: checkStatus,
  };
}