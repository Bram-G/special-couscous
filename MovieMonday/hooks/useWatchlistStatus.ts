import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function useWatchlistStatus(movieId: number) {
  const { token, isAuthenticated } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [watchlists, setWatchlists] = useState([]);

  // Check if movie is in watchlist
  const checkWatchlistStatus = async () => {
    if (!token || !movieId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:8000/api/watchlists/status/${movieId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        setInWatchlist(data.inWatchlist);
        setWatchlists(data.watchlists || []);
      }
    } catch (error) {
      console.error(`Error checking watchlist status for movie ${movieId}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add to watchlist
  const addToWatchlist = async (movieData: { title: string, posterPath: string }) => {
    if (!token || !movieId) return;

    try {
      const response = await fetch(
        "http://localhost:8000/api/watchlists/quick-add",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            tmdbMovieId: movieId,
            title: movieData.title,
            posterPath: movieData.posterPath
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add to watchlist');
      }

      setInWatchlist(true);
      return await response.json();
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      throw error;
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = async (watchlistId: number, itemId: number) => {
    if (!token) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/watchlists/categories/${watchlistId}/movies/${itemId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove from watchlist');
      }

      setInWatchlist(false);
      return true;
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      throw error;
    }
  };

  // Refresh watchlist status
  const refresh = () => {
    checkWatchlistStatus();
  };

  // Check status when movie id changes
  useEffect(() => {
    if (movieId && isAuthenticated) {
      checkWatchlistStatus();
    } else {
      setInWatchlist(false);
      setIsLoading(false);
    }
  }, [movieId, isAuthenticated, token]);

  return {
    inWatchlist,
    isLoading,
    watchlists,
    addToWatchlist,
    removeFromWatchlist,
    refresh
  };
}