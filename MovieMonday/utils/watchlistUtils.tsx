import debounce from 'lodash/debounce';

interface Movie {
  id: number;
  title: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  vote_average?: number;
  overview?: string;
  genre_ids?: number[];
}

interface WatchlistItem {
  id: number;
  tmdbMovieId: number;
  title: string;
  posterPath?: string;
}

interface Watchlist {
  id: number;
  name: string;
  description?: string;
  items?: WatchlistItem[];
  moviesCount?: number;
  slug?: string;
  owner?: {
    username?: string;
    id?: string | number;
  };
}

/**
 * Fetch movie details from TMDB API for a watchlist item
 * @param item The watchlist item containing tmdbMovieId
 * @param apiKey The TMDB API key
 * @returns The movie details or null if fetch fails
 */
export const fetchMovieDetails = async (
  item: WatchlistItem,
  apiKey: string
): Promise<Movie | null> => {
  if (!item.tmdbMovieId || typeof item.tmdbMovieId !== 'number') {
    console.warn('Invalid tmdbMovieId in item:', item);
    return null;
  }
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${item.tmdbMovieId}?api_key=${apiKey}`
    );
    
    if (!response.ok) {
      console.warn(`TMDB API error for movie ${item.tmdbMovieId}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching movie ${item.tmdbMovieId}:`, error);
    return null;
  }
};

/**
 * Fetch movie details for multiple watchlist items with progress tracking
 * @param items Array of watchlist items
 * @param apiKey TMDB API key
 * @param onProgress Optional progress callback
 * @param maxConcurrent Maximum number of concurrent requests
 * @returns Array of movie details
 */
export const fetchWatchlistMovies = async (
  items: WatchlistItem[],
  apiKey: string,
  onProgress?: (progress: number) => void,
  maxConcurrent: number = 5
): Promise<Movie[]> => {
  if (!items || items.length === 0) {
    return [];
  }
  
  // Filter out items without valid IDs
  const validItems = items.filter(
    item => item.tmdbMovieId && typeof item.tmdbMovieId === 'number'
  );
  
  if (validItems.length === 0) {
    return [];
  }
  
  // Track progress
  let completedCount = 0;
  const totalCount = validItems.length;
  const updateProgress = () => {
    completedCount++;
    const progressPercent = Math.round((completedCount / totalCount) * 100);
    if (onProgress) {
      onProgress(progressPercent);
    }
  };
  
  // Process in batches for better performance
  const results: (Movie | null)[] = [];
  const batchSize = maxConcurrent;
  
  for (let i = 0; i < validItems.length; i += batchSize) {
    const batch = validItems.slice(i, i + batchSize);
    const batchPromises = batch.map(item => 
      fetchMovieDetails(item, apiKey)
        .then(movie => {
          updateProgress();
          return movie;
        })
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  // Filter out null results and sort by popularity
  return results
    .filter(Boolean) as Movie[]
    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
};

/**
 * Debounced function to search through watchlists
 * @param query The search query
 * @param watchlists Array of watchlists to search through
 * @param callback Callback function to receive search results
 */
export const debouncedWatchlistSearch = debounce(
  (
    query: string,
    watchlists: Watchlist[],
    callback: (results: Watchlist[]) => void
  ) => {
    if (!query || !watchlists || watchlists.length === 0) {
      callback([]);
      return;
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    
    // Search through watchlists
    const results = watchlists.filter(watchlist => {
      // Check watchlist name
      if (watchlist.name.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      
      // Check watchlist description
      if (
        watchlist.description &&
        watchlist.description.toLowerCase().includes(normalizedQuery)
      ) {
        return true;
      }
      
      // Check movie titles if items are available
      if (watchlist.items && watchlist.items.length > 0) {
        return watchlist.items.some(item => 
          item.title.toLowerCase().includes(normalizedQuery)
        );
      }
      
      return false;
    });
    
    callback(results);
  },
  300
);

/**
 * Validate and normalize watchlist data
 * @param watchlist The watchlist to normalize
 * @returns Normalized watchlist data
 */
export const normalizeWatchlist = (watchlist: any): Watchlist => {
  return {
    id: watchlist.id || 0,
    name: watchlist.name || watchlist.title || 'Unnamed Watchlist',
    description: watchlist.description || '',
    items: Array.isArray(watchlist.items) 
      ? watchlist.items.map((item: any) => ({
          id: item.id || 0,
          tmdbMovieId: item.tmdbMovieId || 0,
          title: item.title || 'Unknown movie',
          posterPath: item.posterPath || item.poster_path || null
        }))
      : [],
    moviesCount: watchlist.moviesCount || (watchlist.items?.length || 0),
    slug: watchlist.slug || String(watchlist.id),
    owner: {
      username: watchlist.owner?.username || 'Unknown user',
      id: watchlist.owner?.id || 0
    }
  };
};

export default {
  fetchMovieDetails,
  fetchWatchlistMovies,
  debouncedWatchlistSearch,
  normalizeWatchlist
};