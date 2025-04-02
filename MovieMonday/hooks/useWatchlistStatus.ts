// hooks/useWatchlistStatus.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface WatchlistInfo {
  watchlistId: number;
  watchlistName: string;
  itemId: number;
  isDefault: boolean;
}

interface WatchlistStatus {
  inWatchlist: boolean;
  inDefaultWatchlist: boolean;
  watchlists: WatchlistInfo[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useWatchlistStatus = (tmdbMovieId: number | string | null): WatchlistStatus => {
  const { token, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<Omit<WatchlistStatus, 'refresh'>>({
    inWatchlist: false,
    inDefaultWatchlist: false,
    watchlists: [],
    loading: false,
    error: null
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Skip if not authenticated or no movie ID
    if (!isAuthenticated || !token || !tmdbMovieId) {
      return;
    }

    const fetchStatus = async () => {
      try {
        setStatus(prev => ({ ...prev, loading: true, error: null }));
        
        const response = await fetch(`http://localhost:8000/api/watchlists/status/${tmdbMovieId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch watchlist status');
        }
        
        const data = await response.json();
        
        setStatus({
          inWatchlist: data.inWatchlist,
          inDefaultWatchlist: data.inDefaultWatchlist || false,
          watchlists: data.watchlists || [],
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching watchlist status:', error);
        setStatus(prev => ({ 
          ...prev, 
          loading: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }));
      }
    };
    
    fetchStatus();
  }, [tmdbMovieId, token, isAuthenticated, refreshTrigger]);
  
  // Function to trigger a refresh
  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  return {
    ...status,
    refresh
  };
};

export default useWatchlistStatus;