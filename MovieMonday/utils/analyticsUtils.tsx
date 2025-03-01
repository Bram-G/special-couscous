// MovieMonday/utils/analyticsUtils.tsx

// Type definitions
export interface MovieMonday {
  id: number;
  date: string;
  pickerUserId: string;
  status: string;
  movieSelections: MovieSelection[];
  picker: {
    id: string;
    username: string;
  };
  eventDetails?: {
    meals: string;
    cocktails: string[];
    notes: string;
  };
}

export interface MovieSelection {
  id: number;
  tmdbMovieId: number;
  title: string;
  posterPath: string;
  isWinner: boolean;
  genres?: string[]; // Array of genre names
  releaseYear?: number;
  director?: string; // Main director name
  directors?: { id: number; name: string }[]; // All directors
  actors?: { id: number; name: string; character?: string }[]; // Cast
}

// Function to fetch analytics data directly from the backend
export async function fetchAnalyticsData(token: string) {
  try {
    const response = await fetch('http://localhost:8000/api/movie-monday/analytics', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch analytics data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return null;
  }
}

// Genre Analytics
export function getGenreAnalytics(data: MovieMonday[]) {
  // Initialize counts
  const genreCounts: Record<string, { count: number; wins: number }> = {};
  let totalGenres = 0;
  
  // Process each movie
  data.forEach(mm => {
    mm.movieSelections.forEach(movie => {
      // Check if genres exists and is an array
      const genres = Array.isArray(movie.genres) ? movie.genres : [];
      
      genres.forEach(genre => {
        if (!genreCounts[genre]) {
          genreCounts[genre] = { count: 0, wins: 0 };
        }
        genreCounts[genre].count++;
        totalGenres++;
        
        if (movie.isWinner) {
          genreCounts[genre].wins++;
        }
      });
    });
  });
  
  // Format for chart display
  const genreDistribution = Object.entries(genreCounts)
    .map(([name, { count, wins }]) => ({
      name,
      value: count,
      wins,
      winRate: count > 0 ? (wins / count * 100) : 0
    }))
    .sort((a, b) => b.value - a.value);
  
  return {
    genreDistribution,
    totalUniqueGenres: Object.keys(genreCounts).length,
    totalGenres
  };
}

// Actor Analytics
export function getActorAnalytics(data: MovieMonday[]) {
  // Initialize counts
  const actorCounts: Record<string, { id: number; count: number; wins: number }> = {};
  let totalActors = 0;
  
  // Process each movie
  data.forEach(mm => {
    mm.movieSelections.forEach(movie => {
      // Check if actors exists and is an array
      const actors = Array.isArray(movie.actors) ? movie.actors : [];
      
      actors.forEach(actor => {
        if (!actorCounts[actor.name]) {
          actorCounts[actor.name] = { id: actor.id, count: 0, wins: 0 };
        }
        actorCounts[actor.name].count++;
        totalActors++;
        
        if (movie.isWinner) {
          actorCounts[actor.name].wins++;
        }
      });
    });
  });
  
  // Format for chart display
  const topActors = Object.entries(actorCounts)
    .map(([name, { id, count, wins }]) => ({
      name,
      id,
      value: count, // For chart compatibility
      count,
      wins,
      winRate: count > 0 ? (wins / count * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);
  
  return {
    topActors,
    totalUniqueActors: Object.keys(actorCounts).length,
    totalActors
  };
}

// Director Analytics
export function getDirectorAnalytics(data: MovieMonday[]) {
  // Initialize counts
  const directorCounts: Record<string, { id: number; count: number; wins: number }> = {};
  let totalDirectors = 0;
  
  // Process each movie
  data.forEach(mm => {
    mm.movieSelections.forEach(movie => {
      // Check for director - either use directors array or the director string
      if (Array.isArray(movie.directors) && movie.directors.length > 0) {
        movie.directors.forEach(director => {
          if (!directorCounts[director.name]) {
            directorCounts[director.name] = { id: director.id, count: 0, wins: 0 };
          }
          directorCounts[director.name].count++;
          totalDirectors++;
          
          if (movie.isWinner) {
            directorCounts[director.name].wins++;
          }
        });
      } else if (movie.director) {
        const dirName = movie.director;
        if (!directorCounts[dirName]) {
          directorCounts[dirName] = { id: 0, count: 0, wins: 0 };
        }
        directorCounts[dirName].count++;
        totalDirectors++;
        
        if (movie.isWinner) {
          directorCounts[dirName].wins++;
        }
      }
    });
  });
  
  // Format for chart display
  const topDirectors = Object.entries(directorCounts)
    .map(([name, { id, count, wins }]) => ({
      name,
      id,
      value: count, // For chart compatibility
      count,
      wins,
      winRate: count > 0 ? (wins / count * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);
  
  return {
    topDirectors,
    totalUniqueDirectors: Object.keys(directorCounts).length,
    totalDirectors
  };
}

// Win Rate Analytics
export function getWinRateAnalytics(data: MovieMonday[]) {
  // Track movie selections and their win/loss status
  const movieStats: Record<string, { 
    id: number;
    name: string;
    selections: number;
    wins: number;
    winRate: number;
    lossRate: number;
  }> = {};
  
  // Process each movie
  data.forEach(mm => {
    mm.movieSelections.forEach(movie => {
      const key = `${movie.tmdbMovieId}`;
      
      if (!movieStats[key]) {
        movieStats[key] = {
          id: movie.tmdbMovieId,
          name: movie.title,
          selections: 0,
          wins: 0,
          winRate: 0,
          lossRate: 0
        };
      }
      
      // Only count movies that have been decided (i.e., not null isWinner)
      if (movie.isWinner !== undefined && movie.isWinner !== null) {
        movieStats[key].selections++;
        
        if (movie.isWinner) {
          movieStats[key].wins++;
        }
      }
    });
  });
  
  // Calculate rates
  Object.values(movieStats).forEach(movie => {
    if (movie.selections > 0) {
      movie.winRate = (movie.wins / movie.selections) * 100;
      movie.lossRate = 100 - movie.winRate;
    }
  });
  
  // Create sorted lists for most losses and highest win rates
  const mostLosses = Object.values(movieStats)
    .filter(movie => movie.selections >= 1) // Only include movies with at least 1 selection
    .sort((a, b) => b.lossRate - a.lossRate);
    
  const highestWinRate = Object.values(movieStats)
    .filter(movie => movie.selections >= 1) // Only include movies with at least 1 selection
    .sort((a, b) => b.winRate - a.winRate);
  
  return {
    mostLosses,
    highestWinRate,
    totalMovies: Object.keys(movieStats).length
  };
}

// Time-based Analytics
export function getTimeBasedAnalytics(data: MovieMonday[]) {
  // Track movies by month
  const monthlyData: Record<string, { 
    count: number;
    winners: number;
  }> = {};
  
  let totalMoviesWatched = 0;
  
  // Process each movie monday
  data.forEach(mm => {
    const date = new Date(mm.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { count: 0, winners: 0 };
    }
    
    mm.movieSelections.forEach(movie => {
      totalMoviesWatched++;
      monthlyData[monthKey].count++;
      
      if (movie.isWinner) {
        monthlyData[monthKey].winners++;
      }
    });
  });
  
  // Format for chart display
  const monthlyMovies = Object.entries(monthlyData)
    .map(([name, data]) => ({
      name,
      value: data.count,
      winners: data.winners
    }))
    .sort((a, b) => a.name.localeCompare(b.name)); // Sort chronologically
  
  return {
    monthlyMovies,
    totalMonths: Object.keys(monthlyData).length,
    totalMoviesWatched
  };
}

// Picker Analytics
export function getPickerAnalytics(data: MovieMonday[]) {
  // Track picker success rates
  const pickerStats: Record<string, { 
    id: string;
    name: string;
    selections: number;
    wins: number;
    successRate: number;
  }> = {};
  
  // Process each movie monday
  data.forEach(mm => {
    if (mm.picker) {
      const pickerId = mm.picker.id;
      const pickerName = mm.picker.username;
      
      if (!pickerStats[pickerId]) {
        pickerStats[pickerId] = {
          id: pickerId,
          name: pickerName,
          selections: 0,
          wins: 0,
          successRate: 0
        };
      }
      
      // Only count selections that have been decided
      const decidedSelections = mm.movieSelections.filter(
        movie => movie.isWinner !== undefined && movie.isWinner !== null
      );
      
      if (decidedSelections.length > 0) {
        pickerStats[pickerId].selections += decidedSelections.length;
        
        const pickerWins = decidedSelections.filter(movie => movie.isWinner);
        pickerStats[pickerId].wins += pickerWins.length;
      }
    }
  });
  
  // Calculate success rates
  Object.values(pickerStats).forEach(picker => {
    if (picker.selections > 0) {
      picker.successRate = (picker.wins / picker.selections) * 100;
    }
  });
  
  // Sort by success rate
  const pickerSuccessRates = Object.values(pickerStats)
    .sort((a, b) => b.successRate - a.successRate);
  
  // Find most successful picker
  const mostSuccessful = pickerSuccessRates.length > 0 ? pickerSuccessRates[0] : null;
  
  return {
    pickerSuccessRates,
    totalPickers: Object.keys(pickerStats).length,
    mostSuccessful
  };
}

// Function to get all analytics in one call
export async function getAllAnalytics(token: string) {
  try {
    // First, try to get analytics from the backend
    const apiData = await fetchAnalyticsData(token);
    if (apiData) {
      return apiData;
    }
    
    // Fallback to calculating from raw movie data
    const response = await fetch('http://localhost:8000/api/movie-monday/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch movie data');
    }
    
    const data: MovieMonday[] = await response.json();
    
    // Generate all analytics
    return {
      genres: getGenreAnalytics(data),
      actors: getActorAnalytics(data),
      directors: getDirectorAnalytics(data),
      winRates: getWinRateAnalytics(data),
      timeData: getTimeBasedAnalytics(data),
      pickers: getPickerAnalytics(data)
    };
  } catch (error) {
    console.error('Error generating analytics:', error);
    return null;
  }
}