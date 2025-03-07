// MovieMonday/utils/analyticsUtils.ts

export interface MovieMonday {
  id: number;
  date: string;
  status: string;
  pickerUserId: string;
  movieSelections: MovieSelection[];
  picker: {
    id: string;
    username: string;
  };
  eventDetails?: EventDetails;
}

interface EventDetails {
  meals: string;
  cocktails: string[];
  desserts: string[];
  notes: string;
}

interface MovieSelection {
  id: number;
  tmdbMovieId: number;
  title: string;
  posterPath: string;
  isWinner: boolean;
  genres: string[];
  releaseYear: number;
  director?: string;
  directors?: { id: number; name: string }[];
  actors?: { id: number; name: string; character: string }[];
  cast?: { actorId: number; name: string; character: string }[];
  crew?: { personId: number; name: string; job: string }[];
}

export interface GenreAnalytics {
  genreDistribution: { name: string; value: number }[];
  genreWins: { name: string; value: number }[];
  totalUniqueGenres: number;
  totalGenres: number;
}

export interface DirectorAnalytics {
  topDirectors: { name: string; value: number }[];
  topWinningDirectors: { name: string; value: number }[];
  totalUniqueDirectors: number;
  totalDirectors: number;
}

export interface WinRateAnalytics {
  mostWins: { name: string; value: number }[];
  mostLosses: { name: string; value: number }[];
}

export const getFoodDrinkAnalytics = (movieMondays: MovieMonday[]) => {
  // Initialize counters for food and drinks
  const cocktailCounts: Record<string, number> = {};
  const mealCounts: Record<string, number> = {};
  const dessertCounts: Record<string, number> = {};
  
  let totalCocktails = 0;
  let totalMeals = 0;
  let totalDesserts = 0;
  
  // Process all movie mondays with event details
  movieMondays.forEach(mm => {
    if (!mm.eventDetails) return;
    
    // Process cocktails
    if (mm.eventDetails.cocktails && mm.eventDetails.cocktails.length) {
      mm.eventDetails.cocktails.forEach(cocktail => {
        const normalized = cocktail.trim().toLowerCase();
        if (normalized) {
          cocktailCounts[normalized] = (cocktailCounts[normalized] || 0) + 1;
          totalCocktails++;
        }
      });
    }
    
    // Process meals
    if (mm.eventDetails.meals) {
      const meal = mm.eventDetails.meals.trim();
      if (meal) {
        mealCounts[meal] = (mealCounts[meal] || 0) + 1;
        totalMeals++;
      }
    }
    
    // Process desserts
    if (mm.eventDetails.desserts) {
      const dessert = mm.eventDetails.desserts.trim();
      if (dessert) {
        dessertCounts[dessert] = (dessertCounts[dessert] || 0) + 1;
        totalDesserts++;
      }
    }
  });
  
  // Format data for charts
  const topCocktails = Object.entries(cocktailCounts)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    .sort((a, b) => b.value - a.value);
    
  const topMeals = Object.entries(mealCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
    
  const topDesserts = Object.entries(dessertCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  
  return {
    topCocktails,
    topMeals,
    topDesserts,
    totalCocktails,
    totalMeals,
    totalDesserts
  };
};

// Alias for backwards compatibility
export type WinLossAnalytics = WinRateAnalytics;

export interface PickerAnalytics {
  pickerStats: {
    id: string;
    name: string;
    selections: number;
    wins: number;
  }[];
  totalPickers: number;
  mostSuccessful: {
    id: string;
    name: string;
    selections: number;
    wins: number;
  } | null;
}

export interface TimeAnalytics {
  monthlyMovies: { name: string; value: number }[];
  monthlyWinners: { name: string; value: number }[];
  totalMoviesWatched: number;
}

export interface ActorAnalytics {
  topActors: { name: string; value: number }[];
  topWinningActors: { name: string; value: number }[];
  topLosingActors: { name: string; value: number }[]; // New metric
  totalUniqueActors: number;
  totalActors: number;
}

// Get genre distribution and wins
export function getGenreAnalytics(movieMondays: MovieMonday[]): GenreAnalytics {
  const genreCounts: Record<string, number> = {};
  const genreWins: Record<string, number> = {};
  let totalGenres = 0;
  
  movieMondays.forEach(movieMonday => {
    movieMonday.movieSelections.forEach(movie => {
      if (movie.genres && Array.isArray(movie.genres)) {
        movie.genres.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          totalGenres++;
          
          if (movie.isWinner) {
            genreWins[genre] = (genreWins[genre] || 0) + 1;
          }
        });
      }
    });
  });
  
  return {
    genreDistribution: Object.entries(genreCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    genreWins: Object.entries(genreWins)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    totalUniqueGenres: Object.keys(genreCounts).length,
    totalGenres
  };
}

// Get actor distribution and wins
export function getActorAnalytics(movieMondays: MovieMonday[]): ActorAnalytics {
  const actorCounts: Record<string, number> = {};
  const actorWins: Record<string, number> = {};
  const actorLosses: Record<string, number> = {}; // Track losses separately
  let totalActors = 0;
  
  movieMondays.forEach(movieMonday => {
    // Only consider Movie Mondays with a winner selected
    const hasWinner = movieMonday.movieSelections.some(m => m.isWinner);
    
    if (hasWinner) {
      movieMonday.movieSelections.forEach(movie => {
        // Handle different data structures for actors
        const actors = movie.actors || (movie.cast ? movie.cast.map(c => ({ 
          id: c.actorId, 
          name: c.name 
        })) : []);
        
        actors.forEach(actor => {
          if (actor.name) {
            actorCounts[actor.name] = (actorCounts[actor.name] || 0) + 1;
            totalActors++;
            
            if (movie.isWinner) {
              actorWins[actor.name] = (actorWins[actor.name] || 0) + 1;
            } else {
              // If this movie was rejected, count as a loss for the actor
              actorLosses[actor.name] = (actorLosses[actor.name] || 0) + 1;
            }
          }
        });
      });
    }
  });
  
  return {
    topActors: Object.entries(actorCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    topWinningActors: Object.entries(actorWins)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    topLosingActors: Object.entries(actorLosses)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    totalUniqueActors: Object.keys(actorCounts).length,
    totalActors
  };
}

// Get director distribution and wins
export function getDirectorAnalytics(movieMondays: MovieMonday[]): DirectorAnalytics {
  const directorCounts: Record<string, number> = {};
  const directorWins: Record<string, number> = {};
  let totalDirectors = 0;
  
  movieMondays.forEach(movieMonday => {
    movieMonday.movieSelections.forEach(movie => {
      // Handle different data structures for directors
      let directors: { id: number, name: string }[] = [];
      
      if (movie.directors) {
        directors = movie.directors;
      } else if (movie.crew) {
        directors = movie.crew
          .filter(p => p.job === 'Director')
          .map(d => ({ id: d.personId, name: d.name }));
      } else if (movie.director) {
        directors = [{ id: 0, name: movie.director }];
      }
      
      directors.forEach(director => {
        if (director.name) {
          directorCounts[director.name] = (directorCounts[director.name] || 0) + 1;
          totalDirectors++;
          
          if (movie.isWinner) {
            directorWins[director.name] = (directorWins[director.name] || 0) + 1;
          }
        }
      });
    });
  });
  
  return {
    topDirectors: Object.entries(directorCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    topWinningDirectors: Object.entries(directorWins)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    totalUniqueDirectors: Object.keys(directorCounts).length,
    totalDirectors
  };
}

// Get absolute win/loss counts (not percentages)
export function getWinRateAnalytics(movieMondays: MovieMonday[]): WinRateAnalytics {
  const movieStats: Record<string, { 
    id: number;
    wins: number;
    losses: number;
    selections: number; 
  }> = {};
  
  movieMondays.forEach(movieMonday => {
    // Only count movies from completed sessions (where a winner was chosen)
    const hasWinner = movieMonday.movieSelections.some(m => m.isWinner);
    
    if (hasWinner) {
      movieMonday.movieSelections.forEach(movie => {
        const key = movie.title;
        
        if (!movieStats[key]) {
          movieStats[key] = { 
            id: movie.tmdbMovieId,
            wins: 0, 
            losses: 0,
            selections: 0
          };
        }
        
        movieStats[key].selections++;
        
        if (movie.isWinner) {
          movieStats[key].wins++;
        } else {
          movieStats[key].losses++;
        }
      });
    }
  });
  
  const movieEntries = Object.entries(movieStats)
    .map(([name, stats]) => ({
      name,
      id: stats.id,
      wins: stats.wins,
      losses: stats.losses,
      selections: stats.selections
    }));
  
  return {
    mostWins: movieEntries
      .filter(movie => movie.wins > 0)
      .map(movie => ({ 
        name: movie.name, 
        value: movie.wins
      }))
      .sort((a, b) => b.value - a.value),
    mostLosses: movieEntries
      .filter(movie => movie.losses > 0)
      .map(movie => ({ 
        name: movie.name, 
        value: movie.losses
      }))
      .sort((a, b) => b.value - a.value)
  };
}

// Get picker statistics
export function getPickerAnalytics(movieMondays: MovieMonday[]): PickerAnalytics {
  const pickerStats: Record<string, {
    id: string;
    selections: number;
    wins: number;
  }> = {};
  
  movieMondays.forEach(movieMonday => {
    if (movieMonday.picker && movieMonday.picker.username) {
      const pickerName = movieMonday.picker.username;
      
      if (!pickerStats[pickerName]) {
        pickerStats[pickerName] = {
          id: movieMonday.picker.id,
          selections: 0,
          wins: 0
        };
      }
      
      // Only count selections that had a chance to win
      const decidedSelections = movieMonday.movieSelections.filter(
        m => movieMonday.status === 'completed'
      );
      
      pickerStats[pickerName].selections += decidedSelections.length;
      
      // Count wins
      const winningSelections = decidedSelections.filter(m => m.isWinner);
      pickerStats[pickerName].wins += winningSelections.length;
    }
  });
  
  const formattedStats = Object.entries(pickerStats)
    .map(([name, stats]) => ({
      id: stats.id,
      name,
      selections: stats.selections,
      wins: stats.wins
    }))
    .sort((a, b) => b.wins - a.wins);
  
  const mostSuccessful = formattedStats.length > 0 ? formattedStats[0] : null;
  
  return {
    pickerStats: formattedStats,
    totalPickers: formattedStats.length,
    mostSuccessful
  };
}

// Get time-based analytics
export function getTimeBasedAnalytics(movieMondays: MovieMonday[]): TimeAnalytics {
  const monthlyData: Record<string, {
    movieMondayCount: number; // Count of actual Movie Monday events
    movies: number;
    winners: number;
  }> = {};
  
  let totalMoviesWatched = 0;
  
  movieMondays.forEach(movieMonday => {
    const date = new Date(movieMonday.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        movieMondayCount: 0,
        movies: 0,
        winners: 0
      };
    }
    
    // Count this Movie Monday event
    monthlyData[monthKey].movieMondayCount++;
    
    // Also track movies for other metrics
    const movieCount = movieMonday.movieSelections.length;
    monthlyData[monthKey].movies += movieCount;
    totalMoviesWatched += movieCount;
    
    // Count winners
    const winnerCount = movieMonday.movieSelections.filter(m => m.isWinner).length;
    monthlyData[monthKey].winners += winnerCount;
  });
  
  // Sort by date (month)
  const sortedMonths = Object.keys(monthlyData).sort();
  
  return {
    movieMondaysByMonth: sortedMonths.map(month => ({
      name: month,
      value: monthlyData[month].movieMondayCount
    })),
    monthlyMovies: sortedMonths.map(month => ({
      name: month,
      value: monthlyData[month].movies
    })),
    monthlyWinners: sortedMonths.map(month => ({
      name: month,
      value: monthlyData[month].winners
    })),
    totalMoviesWatched,
    totalMovieMondayCount: movieMondays.length
  };
}