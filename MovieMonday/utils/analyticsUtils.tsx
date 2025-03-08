export interface MovieMonday {
  id: number;
  date: string;
  pickerUserId: string;
  status: string;
  GroupId: number;
  movieSelections: Array<{
    id: number;
    tmdbMovieId: number;
    title: string;
    posterPath: string;
    isWinner: boolean;
    genres?: string[];
    releaseYear?: number;
    cast?: Array<{
      actorId: number;
      name: string;
      character?: string;
    }>;
    crew?: Array<{
      personId: number;
      name: string;
      job: string;
    }>;
  }>;
  picker: {
    id: string;
    username: string;
  };
  eventDetails?: {
    meals?: string;
    cocktails?: string[] | string;
    desserts?: string;
    notes?: string;
  };
}

/**
 * Process genres from movie data
 */
export function getGenreAnalytics(movieMondays: MovieMonday[]) {
  const genres: Record<string, { count: number; wins: number }> = {};
  let totalGenres = 0;
  let totalUniqueGenres = 0;

  movieMondays.forEach(mm => {
    mm.movieSelections.forEach(movie => {
      if (movie.genres && Array.isArray(movie.genres)) {
        movie.genres.forEach(genre => {
          if (!genres[genre]) {
            genres[genre] = { count: 0, wins: 0 };
            totalUniqueGenres++;
          }
          genres[genre].count++;
          totalGenres++;
          if (movie.isWinner) {
            genres[genre].wins++;
          }
        });
      }
    });
  });

  // Format for visualization
  const genreDistribution = Object.entries(genres)
    .map(([name, data]) => ({
      name,
      value: data.count
    }))
    .sort((a, b) => b.value - a.value);

  const genreWins = Object.entries(genres)
    .map(([name, data]) => ({
      name,
      value: data.wins
    }))
    .sort((a, b) => b.value - a.value);

  return {
    genreDistribution,
    genreWins,
    totalGenres,
    totalUniqueGenres
  };
}

/**
 * Process actor data from movie selections
 */
export function getActorAnalytics(movieMondays: MovieMonday[]) {
  const actors: Record<string, { id: number; count: number; wins: number }> = {};
  let totalActors = 0;

  movieMondays.forEach(mm => {
    mm.movieSelections.forEach(movie => {
      if (movie.cast && Array.isArray(movie.cast)) {
        movie.cast.forEach(actor => {
          if (!actors[actor.name]) {
            actors[actor.name] = { id: actor.actorId, count: 0, wins: 0 };
          }
          actors[actor.name].count++;
          totalActors++;
          if (movie.isWinner) {
            actors[actor.name].wins++;
          }
        });
      }
    });
  });

  // Format for visualization
  const topActors = Object.entries(actors)
    .map(([name, data]) => ({
      name,
      value: data.count,
      id: data.id
    }))
    .sort((a, b) => b.value - a.value);

  const topWinningActors = Object.entries(actors)
    .map(([name, data]) => ({
      name,
      value: data.wins,
      id: data.id
    }))
    .filter(actor => actor.value > 0)
    .sort((a, b) => b.value - a.value);

  const topLosingActors = Object.entries(actors)
    .map(([name, data]) => ({
      name,
      value: data.count - data.wins,
      id: data.id
    }))
    .filter(actor => actor.value > 0)
    .sort((a, b) => b.value - a.value);

  return {
    topActors,
    topWinningActors,
    topLosingActors,
    totalActors,
    totalUniqueActors: Object.keys(actors).length
  };
}

/**
 * Process director data from movie selections
 */
export function getDirectorAnalytics(movieMondays: MovieMonday[]) {
  const directors: Record<string, { id: number; count: number; wins: number }> = {};
  let totalDirectors = 0;

  movieMondays.forEach(mm => {
    mm.movieSelections.forEach(movie => {
      if (movie.crew && Array.isArray(movie.crew)) {
        const movieDirectors = movie.crew.filter(person => person.job === 'Director');
        movieDirectors.forEach(director => {
          if (!directors[director.name]) {
            directors[director.name] = { id: director.personId, count: 0, wins: 0 };
          }
          directors[director.name].count++;
          totalDirectors++;
          if (movie.isWinner) {
            directors[director.name].wins++;
          }
        });
      }
    });
  });

  // Format for visualization
  const topDirectors = Object.entries(directors)
    .map(([name, data]) => ({
      name,
      value: data.count,
      id: data.id
    }))
    .sort((a, b) => b.value - a.value);

  const topWinningDirectors = Object.entries(directors)
    .map(([name, data]) => ({
      name,
      value: data.wins,
      id: data.id
    }))
    .filter(director => director.value > 0)
    .sort((a, b) => b.value - a.value);

  return {
    topDirectors,
    topWinningDirectors,
    totalDirectors,
    totalUniqueDirectors: Object.keys(directors).length
  };
}

/**
 * Analyze win rates for movies
 */
export function getWinRateAnalytics(movieMondays: MovieMonday[]) {
  const movies: Record<string, { id: number; selections: number; wins: number }> = {};

  movieMondays.forEach(mm => {
    mm.movieSelections.forEach(movie => {
      if (!movies[movie.title]) {
        movies[movie.title] = { id: movie.tmdbMovieId, selections: 0, wins: 0 };
      }
      movies[movie.title].selections++;
      if (movie.isWinner) {
        movies[movie.title].wins++;
      }
    });
  });

  // Movies with most losses
  const mostLosses = Object.entries(movies)
    .map(([name, data]) => ({
      name,
      id: data.id,
      selections: data.selections,
      wins: data.wins,
      losses: data.selections - data.wins
    }))
    .sort((a, b) => b.losses - a.losses);

  // Movies with most wins
  const mostWins = Object.entries(movies)
    .map(([name, data]) => ({
      name,
      id: data.id,
      selections: data.selections,
      wins: data.wins
    }))
    .filter(movie => movie.wins > 0)
    .sort((a, b) => b.wins - a.wins);

  return {
    mostLosses,
    mostWins
  };
}

/**
 * Analyze time-based metrics
 */
export function getTimeBasedAnalytics(movieMondays: MovieMonday[]) {
  const moviesByMonth: Record<string, { count: number; winners: number }> = {};
  const eventsByMonth: Record<string, number> = {};
  
  let totalMoviesWatched = 0;
  let totalMovieMondayCount = 0;

  movieMondays.forEach(mm => {
    const date = new Date(mm.date);
    if (isNaN(date.getTime())) return; // Skip invalid dates

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    // Count events by month
    if (!eventsByMonth[monthKey]) {
      eventsByMonth[monthKey] = 0;
    }
    eventsByMonth[monthKey]++;
    totalMovieMondayCount++;

    // Count movies by month
    if (!moviesByMonth[monthKey]) {
      moviesByMonth[monthKey] = { count: 0, winners: 0 };
    }
    
    const movieCount = mm.movieSelections.length;
    moviesByMonth[monthKey].count += movieCount;
    totalMoviesWatched += movieCount;

    // Count winners by month
    const winnerCount = mm.movieSelections.filter(m => m.isWinner).length;
    moviesByMonth[monthKey].winners += winnerCount;
  });

  // Format for time series charts
  const monthlyMovies = Object.entries(moviesByMonth)
    .map(([name, data]) => ({
      name,
      value: data.count
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const movieMondaysByMonth = Object.entries(eventsByMonth)
    .map(([name, value]) => ({
      name,
      value
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    monthlyMovies,
    movieMondaysByMonth,
    totalMoviesWatched,
    totalMovieMondayCount
  };
}

/**
 * Analyze picker performance
 */
export function getPickerAnalytics(movieMondays: MovieMonday[]) {
  const pickers: Record<string, { id: string; selections: number; wins: number }> = {};

  movieMondays.forEach(mm => {
    if (!mm.picker) return;
    
    const pickerName = mm.picker.username;
    if (!pickers[pickerName]) {
      pickers[pickerName] = { id: mm.picker.id, selections: 0, wins: 0 };
    }

    // Count this picker's selections
    const pickerSelections = mm.movieSelections.length;
    pickers[pickerName].selections += pickerSelections;

    // Count this picker's wins
    const winnerCount = mm.movieSelections.filter(m => m.isWinner).length;
    pickers[pickerName].wins += winnerCount;
  });

  // Format for visualization
  const pickerStats = Object.entries(pickers)
    .map(([name, data]) => ({
      name,
      id: data.id,
      selections: data.selections,
      wins: data.wins
    }))
    .sort((a, b) => (b.wins / Math.max(1, b.selections)) - (a.wins / Math.max(1, a.selections)));

  // Find most successful picker
  const mostSuccessful = pickerStats.length > 0 ? pickerStats[0] : null;

  return {
    pickerStats,
    totalPickers: Object.keys(pickers).length,
    mostSuccessful
  };
}

/**
 * Process event details for food and drink analytics
 */
export function getFoodDrinkAnalytics(movieMondays: MovieMonday[]) {
  // Initialize counters and maps for food and drinks
  const cocktailsMap = new Map<string, number>();
  const mealsMap = new Map<string, number>();
  const dessertsMap = new Map<string, number>();
  
  let totalCocktails = 0;
  let totalMeals = 0;
  let totalDesserts = 0;

  // Process all movie mondays
  movieMondays.forEach(mm => {
    if (!mm.eventDetails) return;

    // Process cocktails (ensuring we handle both array and string formats)
    if (mm.eventDetails.cocktails) {
      const cocktails = Array.isArray(mm.eventDetails.cocktails) 
        ? mm.eventDetails.cocktails
        : typeof mm.eventDetails.cocktails === 'string'
          ? [mm.eventDetails.cocktails] 
          : [];
      
      cocktails.forEach(cocktail => {
        if (typeof cocktail === 'string' && cocktail.trim()) {
          totalCocktails++;
          const cocktailName = cocktail.trim();
          cocktailsMap.set(
            cocktailName, 
            (cocktailsMap.get(cocktailName) || 0) + 1
          );
        }
      });
    }

    // Process meals (ensuring we handle both array and string formats)
    if (mm.eventDetails.meals) {
      const meals = Array.isArray(mm.eventDetails.meals) 
        ? mm.eventDetails.meals
        : typeof mm.eventDetails.meals === 'string'
          ? [mm.eventDetails.meals] 
          : [];
      
      meals.forEach(meal => {
        if (typeof meal === 'string' && meal.trim()) {
          totalMeals++;
          const mealName = meal.trim();
          mealsMap.set(
            mealName, 
            (mealsMap.get(mealName) || 0) + 1
          );
        }
      });
    }

    // Process desserts (ensuring we handle both array and string formats)
    if (mm.eventDetails.desserts) {
      const desserts = Array.isArray(mm.eventDetails.desserts) 
        ? mm.eventDetails.desserts
        : typeof mm.eventDetails.desserts === 'string'
          ? [mm.eventDetails.desserts] 
          : [];
      
      desserts.forEach(dessert => {
        if (typeof dessert === 'string' && dessert.trim()) {
          totalDesserts++;
          const dessertName = dessert.trim();
          dessertsMap.set(
            dessertName, 
            (dessertsMap.get(dessertName) || 0) + 1
          );
        }
      });
    }
  });

  // Convert maps to sorted arrays for charting
  const topCocktails = Array.from(cocktailsMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const topMeals = Array.from(mealsMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
    
  const topDesserts = Array.from(dessertsMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return {
    totalCocktails,
    totalMeals,
    totalDesserts,
    topCocktails,
    topMeals,
    topDesserts
  };
}