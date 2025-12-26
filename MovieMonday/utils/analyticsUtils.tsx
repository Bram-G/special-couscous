// Analytics utility functions for MovieMonday app

// Main data type
export interface MovieMonday {
  id: number;
  date: string;
  status: string;
  picker: {
    id: string;
    username: string;
  };
  movieSelections: Array<{
    id: number;
    tmdbMovieId: number;
    title: string;
    posterPath: string | null;
    isWinner: boolean;
    genres: string[];
    releaseYear?: number;
    actors: Array<{
      id: number;
      name: string;
      character: string;
    }>;
    directors: Array<{
      id: number;
      name: string;
    }>;
    writers: Array<{
      id: number;
      name: string;
      job: string;
    }>;
    cast: Array<any>;
    crew: Array<any>;
  }>;
  eventDetails?: {
    meals: string[];
    cocktails: string[];
    desserts?: string[];
    notes: string;
  };
}

// Gets genre-related analytics from MovieMonday data
export function getGenreAnalytics(movieMondayData: MovieMonday[]) {
  // Initialize counters
  const genreCounts: Record<string, { count: number; wins: number }> = {};
  let totalGenres = 0;
  const uniqueGenres = new Set<string>();

  // Process all movies
  movieMondayData.forEach((mm) => {
    mm.movieSelections.forEach((movie) => {
      if (movie.genres && Array.isArray(movie.genres)) {
        movie.genres.forEach((genre) => {
          // Count each genre
          if (!genreCounts[genre]) {
            genreCounts[genre] = { count: 0, wins: 0 };
            uniqueGenres.add(genre);
          }

          genreCounts[genre].count++;
          totalGenres++;

          // Count wins for this genre
          if (movie.isWinner) {
            genreCounts[genre].wins++;
          }
        });
      }
    });
  });

  // Format data for charts
  const genreDistribution = Object.entries(genreCounts)
    .map(([name, data]) => ({
      name,
      value: data.count,
    }))
    .sort((a, b) => b.value - a.value);

  // Calculate win rates for genres
  const genreWins = Object.entries(genreCounts)
    .map(([name, data]) => ({
      name,
      value: data.wins,
      winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    genreDistribution,
    genreWins,
    totalUniqueGenres: uniqueGenres.size,
    totalGenres,
  };
}

// Gets actor-related analytics

export function getActorAnalytics(movieMondayData: MovieMonday[]) {
  // Initialize counters
  const actorCounts: Record<
    string,
    { id: number; count: number; wins: number }
  > = {};
  let totalActors = 0;
  const uniqueActors = new Set<number>();

  // Process all movie data
  movieMondayData.forEach((mm) => {
    mm.movieSelections.forEach((movie) => {
      // Process cast (directly from cast array, not actors property)
      if (movie.cast && Array.isArray(movie.cast)) {
        movie.cast.forEach((actor) => {
          if (!actor.name) return;

          // Increment actor count
          const actorKey = actor.name;

          if (!actorCounts[actorKey]) {
            actorCounts[actorKey] = {
              id: actor.actorId,
              count: 0,
              wins: 0,
            };
            uniqueActors.add(actor.actorId);
          }

          actorCounts[actorKey].count++;
          totalActors++;

          // Count wins for this actor
          if (movie.isWinner) {
            actorCounts[actorKey].wins++;
          }
        });
      }
    });
  });

  // Format data for charts
  const topActors = Object.entries(actorCounts)
    .map(([name, data]) => ({
      name,
      id: data.id,
      value: data.count,
    }))
    .sort((a, b) => b.value - a.value);

  // Actors in winning movies - LIMITED TO TOP 100
  const topWinningActors = Object.entries(actorCounts)
    .map(([name, data]) => ({
      name,
      id: data.id,
      value: data.wins,
    }))
    .filter((actor) => actor.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 25); // LIMIT TO TOP 50

  // Actors in losing movies - LIMITED TO TOP 100
  const topLosingActors = Object.entries(actorCounts)
    .map(([name, data]) => ({
      name,
      id: data.id,
      value: data.count - data.wins, // Movies that didn't win
    }))
    .filter((actor) => actor.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 25); // LIMIT TO TOP 100

  // Get the most seen actor (highest total appearances)
  const mostSeenActor = topActors.length > 0 ? topActors[0] : null;

  return {
    topActors,
    topWinningActors,
    topLosingActors,
    mostSeenActor,
    totalActors,
    totalUniqueActors: uniqueActors.size,
  };
}

// Gets director-related analytics
export function getDirectorAnalytics(movieMondayData: MovieMonday[]) {
  // Initialize counters
  const directorCounts: Record<
    string,
    { id: number; count: number; wins: number }
  > = {};
  let totalDirectors = 0;
  const uniqueDirectors = new Set<number>();

  // Process all movies
  movieMondayData.forEach((mm) => {
    mm.movieSelections.forEach((movie) => {
      // Process directors from crew
      if (movie.crew && Array.isArray(movie.crew)) {
        // Filter for directors
        const directors = movie.crew.filter(
          (person) => person.job === "Director",
        );

        directors.forEach((director) => {
          const directorKey = director.name;

          if (!directorCounts[directorKey]) {
            directorCounts[directorKey] = {
              id: director.personId,
              count: 0,
              wins: 0,
            };
            uniqueDirectors.add(director.personId);
          }

          directorCounts[directorKey].count++;
          totalDirectors++;

          // Count wins for this director
          if (movie.isWinner) {
            directorCounts[directorKey].wins++;
          }
        });
      }
    });
  });

  // Format data for charts
  const topDirectors = Object.entries(directorCounts)
    .map(([name, data]) => ({
      name,
      id: data.id,
      value: data.count,
    }))
    .sort((a, b) => b.value - a.value);

  // Directors of winning movies
  const topWinningDirectors = Object.entries(directorCounts)
    .map(([name, data]) => ({
      name,
      id: data.id,
      value: data.wins,
    }))
    .filter((director) => director.value > 0)
    .sort((a, b) => b.value - a.value);

  return {
    topDirectors,
    topWinningDirectors,
    totalDirectors,
    totalUniqueDirectors: uniqueDirectors.size,
  };
}

// Gets win/loss analytics
export function getWinRateAnalytics(movieMondayData: MovieMonday[]) {
  // Track movies by title
  const movieStats: Record<
    string,
    {
      id: number;
      selections: number;
      wins: number;
    }
  > = {};

  // Process all movies
  movieMondayData.forEach((mm) => {
    mm.movieSelections.forEach((movie) => {
      if (!movieStats[movie.title]) {
        movieStats[movie.title] = {
          id: movie.tmdbMovieId,
          selections: 0,
          wins: 0,
        };
      }

      movieStats[movie.title].selections++;

      if (movie.isWinner) {
        movieStats[movie.title].wins++;
      }
    });
  });

  // Most frequently winning movies
  const mostWins = Object.entries(movieStats)
    .map(([name, data]) => ({
      name,
      tmdbMovieId: data.id,
      value: data.wins,
      selections: data.selections,
    }))
    .filter((movie) => movie.value > 0)
    .sort((a, b) => b.value - a.value);

  // Most frequently losing movies
  const mostLosses = Object.entries(movieStats)
    .map(([name, data]) => ({
      name,
      tmdbMovieId: data.id,
      value: data.selections - data.wins, // Count of losses
      selections: data.selections,
      wins: data.wins,
    }))
    .filter((movie) => movie.value > 0)
    .sort((a, b) => b.value - a.value);

  return {
    mostWins,
    mostLosses,
  };
}

// Gets time-based analytics
export function getTimeBasedAnalytics(movieMondayData: MovieMonday[]) {
  // Track counts by month
  const monthlyData: Record<
    string,
    {
      count: number;
      winners: number;
      events: number;
    }
  > = {};

  // Process all movie mondays
  movieMondayData.forEach((mm) => {
    const date = new Date(mm.date);
    const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format

    // Initialize month data if needed
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { count: 0, winners: 0, events: 0 };
    }

    // Count movies in this month
    monthlyData[monthKey].count += mm.movieSelections.length;

    // Count winners in this month
    const winners = mm.movieSelections.filter((m) => m.isWinner);

    monthlyData[monthKey].winners += winners.length;

    // Count events
    monthlyData[monthKey].events += 1;
  });

  // Format for time series charts
  const movieMondaysByMonth = Object.entries(monthlyData)
    .map(([month, data]) => ({
      name: month,
      value: data.events, // Number of events
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Monthly movie count
  const monthlyMovies = Object.entries(monthlyData)
    .map(([month, data]) => ({
      name: month,
      value: data.count, // Total movies
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    movieMondaysByMonth,
    monthlyMovies,
    totalMoviesWatched: Object.values(monthlyData).reduce(
      (sum, data) => sum + data.count,
      0,
    ),
    totalMovieMondayCount: movieMondayData.length,
  };
}

// Gets picker analytics
export function getPickerAnalytics(movieMondayData: MovieMonday[]) {
  // Track stats by picker
  const pickerStats: Record<
    string,
    {
      id: string;
      selections: number;
      wins: number;
    }
  > = {};

  // Process all movie mondays
  movieMondayData.forEach((mm) => {
    if (!mm.picker || !mm.picker.username) return;

    const pickerName = mm.picker.username;

    // Initialize picker data if needed
    if (!pickerStats[pickerName]) {
      pickerStats[pickerName] = {
        id: mm.picker.id,
        selections: 0,
        wins: 0,
      };
    }

    // Count decided selections for this picker
    const decidedSelections = mm.movieSelections.filter(
      (m) => m.isWinner !== null,
    );

    if (decidedSelections.length > 0) {
      pickerStats[pickerName].selections += decidedSelections.length;

      // Count wins for this picker
      const wins = decidedSelections.filter((m) => m.isWinner);

      pickerStats[pickerName].wins += wins.length;
    }
  });

  // Format picker stats
  const formattedPickerStats = Object.entries(pickerStats).map(
    ([name, data]) => ({
      name,
      id: data.id,
      selections: data.selections,
      wins: data.wins,
    }),
  );

  // Find most successful picker
  let mostSuccessful = null;
  let highestWinRate = 0;

  for (const [name, data] of Object.entries(pickerStats)) {
    if (data.selections > 0) {
      const winRate = data.wins / data.selections;

      if (winRate > highestWinRate) {
        highestWinRate = winRate;
        mostSuccessful = {
          id: data.id,
          name,
          selections: data.selections,
          wins: data.wins,
        };
      }
    }
  }

  return {
    pickerStats: formattedPickerStats,
    totalPickers: Object.keys(pickerStats).length,
    mostSuccessful,
  };
}

/**
 * Get all movies by a specific director with optional win status filtering
 */
export function getMoviesByDirector(
  data: MovieMonday[],
  directorName: string,
  winStatus?: boolean,
) {
  const movies: any[] = [];

  data.forEach((mm) => {
    mm.movieSelections.forEach((movie) => {
      // Skip if we're filtering by win status and this movie doesn't match
      if (winStatus !== undefined && movie.isWinner !== winStatus) {
        return;
      }

      const directorFound = movie.directors?.some(
        (director) =>
          director.name.toLowerCase() === directorName.toLowerCase(),
      );

      if (
        directorFound &&
        !movies.some((m) => m.tmdbMovieId === movie.tmdbMovieId)
      ) {
        movies.push({
          id: movie.tmdbMovieId,
          title: movie.title,
          posterPath: movie.posterPath,
          releaseYear: movie.releaseYear,
          isWinner: movie.isWinner,
        });
      }
    });
  });

  return movies;
}

/**
 * Get all movies with a specific genre with optional win status filtering
 */
export function getMoviesByGenre(
  data: MovieMonday[],
  genreName: string,
  winStatus?: boolean,
) {
  const movies: any[] = [];

  data.forEach((mm) => {
    mm.movieSelections.forEach((movie) => {
      // Skip if we're filtering by win status and this movie doesn't match
      if (winStatus !== undefined && movie.isWinner !== winStatus) {
        return;
      }

      if (movie.genres && Array.isArray(movie.genres)) {
        const genreFound = movie.genres.some(
          (genre) => genre.toLowerCase() === genreName.toLowerCase(),
        );

        if (
          genreFound &&
          !movies.some((m) => m.tmdbMovieId === movie.tmdbMovieId)
        ) {
          movies.push({
            id: movie.tmdbMovieId,
            title: movie.title,
            posterPath: movie.posterPath,
            releaseYear: movie.releaseYear,
            isWinner: movie.isWinner,
          });
        }
      }
    });
  });

  return movies;
}

/**
 * Get all movies where a specific actor appears with optional win status filtering
 */
export function getMoviesByActor(
  data: MovieMonday[],
  actorName: string,
  winStatus?: boolean,
) {
  const movies: any[] = [];

  data.forEach((mm) => {
    mm.movieSelections.forEach((movie) => {
      // Skip if we're filtering by win status and this movie doesn't match
      if (winStatus !== undefined && movie.isWinner !== winStatus) {
        return;
      }

      const actorFound = movie.actors?.some(
        (actor) => actor.name.toLowerCase() === actorName.toLowerCase(),
      );

      if (
        actorFound &&
        !movies.some((m) => m.tmdbMovieId === movie.tmdbMovieId)
      ) {
        movies.push({
          id: movie.tmdbMovieId,
          title: movie.title,
          posterPath: movie.posterPath,
          releaseYear: movie.releaseYear,
          isWinner: movie.isWinner,
        });
      }
    });
  });

  return movies;
}

export function getMoviesByCocktail(data: MovieMonday[], cocktailName: string) {
  const movies: any[] = [];

  data.forEach((mm) => {
    // Normalize cocktail data and check if the specified cocktail was served
    let eventCocktails: string[] = [];

    if (mm.eventDetails && mm.eventDetails.cocktails) {
      if (Array.isArray(mm.eventDetails.cocktails)) {
        eventCocktails = mm.eventDetails.cocktails;
      } else if (typeof mm.eventDetails.cocktails === "string") {
        try {
          const parsed = JSON.parse(mm.eventDetails.cocktails);

          eventCocktails = Array.isArray(parsed)
            ? parsed
            : [mm.eventDetails.cocktails];
        } catch (e) {
          eventCocktails = [mm.eventDetails.cocktails];
        }
      }
    }

    // Standardize comparison by trimming and lowercasing
    const normalizedCocktailName = cocktailName.toLowerCase().trim();
    const cocktailFound = eventCocktails.some(
      (c) =>
        typeof c === "string" &&
        c.toLowerCase().trim() === normalizedCocktailName,
    );

    if (cocktailFound) {
      // Add all movies from this MovieMonday session
      mm.movieSelections.forEach((movie) => {
        if (!movies.some((m) => m.tmdbMovieId === movie.tmdbMovieId)) {
          movies.push({
            id: movie.tmdbMovieId,
            title: movie.title,
            posterPath: movie.posterPath,
            releaseYear: movie.releaseYear,
            isWinner: movie.isWinner,
          });
        }
      });
    }
  });

  return movies;
}

export function getWinningMovies(data: MovieMonday[]) {
  const movies: any[] = [];

  data.forEach((mm) => {
    mm.movieSelections.forEach((movie) => {
      if (
        movie.isWinner &&
        !movies.some((m) => m.tmdbMovieId === movie.tmdbMovieId)
      ) {
        movies.push({
          id: movie.tmdbMovieId,
          title: movie.title,
          posterPath: movie.posterPath,
          releaseYear: movie.releaseYear,
          isWinner: true,
        });
      }
    });
  });

  return movies;
}

export function getMoviesByPicker(data: MovieMonday[], pickerName: string) {
  const movies: any[] = [];

  data.forEach((mm) => {
    if (
      mm.picker &&
      mm.picker.username.toLowerCase() === pickerName.toLowerCase()
    ) {
      mm.movieSelections.forEach((movie) => {
        if (!movies.some((m) => m.tmdbMovieId === movie.tmdbMovieId)) {
          movies.push({
            id: movie.tmdbMovieId,
            title: movie.title,
            posterPath: movie.posterPath,
            releaseYear: movie.releaseYear,
            isWinner: movie.isWinner,
          });
        }
      });
    }
  });

  return movies;
}

export function getMoviesByMeal(data: MovieMonday[], mealName: string) {
  const movies: any[] = [];

  data.forEach((mm) => {
    // Normalize meal data and check if the specified meal was served
    let eventMeals: string[] = [];

    if (mm.eventDetails && mm.eventDetails.meals) {
      if (Array.isArray(mm.eventDetails.meals)) {
        eventMeals = mm.eventDetails.meals;
      } else if (typeof mm.eventDetails.meals === "string") {
        try {
          const parsed = JSON.parse(mm.eventDetails.meals);

          eventMeals = Array.isArray(parsed) ? parsed : [mm.eventDetails.meals];
        } catch (e) {
          eventMeals = [mm.eventDetails.meals];
        }
      }
    }

    // Standardize comparison by trimming and lowercasing
    const normalizedMealName = mealName.toLowerCase().trim();
    const mealFound = eventMeals.some(
      (m) =>
        typeof m === "string" && m.toLowerCase().trim() === normalizedMealName,
    );

    if (mealFound) {
      // Add all movies from this MovieMonday session
      mm.movieSelections.forEach((movie) => {
        if (!movies.some((m) => m.tmdbMovieId === movie.tmdbMovieId)) {
          movies.push({
            id: movie.tmdbMovieId,
            title: movie.title,
            posterPath: movie.posterPath,
            releaseYear: movie.releaseYear,
            isWinner: movie.isWinner,
          });
        }
      });
    }
  });

  return movies;
}

// Gets food & drink analytics
export function getFoodDrinkAnalytics(movieMondayData: MovieMonday[]) {
  // Track cocktails, meals and desserts
  const cocktailCounts: Record<string, number> = {};
  const mealCounts: Record<string, number> = {};
  const dessertCounts: Record<string, number> = {};

  let totalCocktails = 0;
  let totalMeals = 0;
  let totalDesserts = 0;

  // Process all movie mondays with event details
  movieMondayData.forEach((mm) => {
    if (!mm.eventDetails) return;

    // Process cocktails
    if (mm.eventDetails.cocktails) {
      const cocktails = Array.isArray(mm.eventDetails.cocktails)
        ? mm.eventDetails.cocktails
        : [mm.eventDetails.cocktails];

      cocktails.forEach((cocktail) => {
        if (!cocktail || typeof cocktail !== "string") return;

        const trimmed = cocktail.trim();

        if (!trimmed) return;

        cocktailCounts[trimmed] = (cocktailCounts[trimmed] || 0) + 1;
        totalCocktails++;
      });
    }

    // Process meals
    if (mm.eventDetails.meals) {
      const meals = Array.isArray(mm.eventDetails.meals)
        ? mm.eventDetails.meals
        : [mm.eventDetails.meals];

      meals.forEach((meal) => {
        if (!meal || typeof meal !== "string") return;

        const trimmed = meal.trim();

        if (!trimmed) return;

        mealCounts[trimmed] = (mealCounts[trimmed] || 0) + 1;
        totalMeals++;
      });
    }

    // Process desserts
    if (mm.eventDetails.desserts) {
      const desserts = Array.isArray(mm.eventDetails.desserts)
        ? mm.eventDetails.desserts
        : [mm.eventDetails.desserts];

      desserts.forEach((dessert) => {
        if (!dessert || typeof dessert !== "string") return;

        const trimmed = dessert.trim();

        if (!trimmed) return;

        dessertCounts[trimmed] = (dessertCounts[trimmed] || 0) + 1;
        totalDesserts++;
      });
    }
  });

  // Format for charts
  const topCocktails = Object.entries(cocktailCounts)
    .map(([name, value]) => ({ name, value }))
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
    totalDesserts,
  };
}
// utils/analyticsUtils.ts (extending existing file)

// Add these functions to your existing analyticsUtils.ts file

/**
 * Gets similar movie recommendations based on a reference movie
 * @param tmdbId The TMDB ID of the reference movie
 * @returns A promise that resolves to an array of similar movies
 */
export async function getSimilarMovies(tmdbId: number) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}/similar?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
    );

    const data = await response.json();

    return data.results || [];
  } catch (error) {
    console.error(`Error fetching similar movies for ${tmdbId}:`, error);

    return [];
  }
}

/**
 * Gets movie recommendations based on a reference movie
 * @param tmdbId The TMDB ID of the reference movie
 * @returns A promise that resolves to an array of recommended movies
 */
export async function getRecommendedMovies(tmdbId: number) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}/recommendations?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
    );

    const data = await response.json();

    return data.results || [];
  } catch (error) {
    console.error(`Error fetching recommendations for ${tmdbId}:`, error);

    return [];
  }
}

/**
 * Extracts genres from a MovieMonday collection
 * @param movieMondays Array of MovieMonday objects
 * @returns Object containing genre data
 */
export function extractWatchlistGenres(watchlist: any[]) {
  // This would require having genre_ids in your watchlist items,
  // which you might need to add by enriching your watchlist data

  const genreCounts = {};

  watchlist.forEach((movie) => {
    if (movie.genres && Array.isArray(movie.genres)) {
      movie.genres.forEach((genre) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    }
  });

  // Sort genres by frequency
  const sortedGenres = Object.entries(genreCounts)
    .map(([genreId, count]) => ({
      id: parseInt(genreId),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    topGenres: sortedGenres,
    allGenres: Object.keys(genreCounts).map((id) => parseInt(id)),
  };
}

/**
 * Gets a curated list of movies by genre
 * @param genreId The genre ID to filter by
 * @param page The page number
 * @returns A promise that resolves to an array of movies
 */

export async function getMoviesByGenreTMDB(genreId: number, page = 1) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&page=${page}`,
    );

    const data = await response.json();

    return data.results || [];
  } catch (error) {
    console.error(`Error fetching movies for genre ${genreId}:`, error);

    return [];
  }
}

/**
 * Gets a curated list of movies by decade
 * @param decade The decade (e.g., "1980" for 1980s)
 * @param page The page number
 * @returns A promise that resolves to an array of movies
 */
export async function getMoviesByDecade(decade: string, page = 1) {
  try {
    let fromYear, toYear;

    if (decade === "pre-1970") {
      fromYear = "1900";
      toYear = "1969";
    } else if (decade === "2020") {
      fromYear = "2020";
      toYear = new Date().getFullYear().toString();
    } else {
      fromYear = decade;
      toYear = (parseInt(decade) + 9).toString();
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&primary_release_date.gte=${fromYear}-01-01&primary_release_date.lte=${toYear}-12-31&sort_by=vote_average.desc&vote_count.gte=100&page=${page}`,
    );

    const data = await response.json();

    return data.results || [];
  } catch (error) {
    console.error(`Error fetching movies for decade ${decade}:`, error);

    return [];
  }
}
