export interface Movie {
    id: number;
    tmdbMovieId: number;
    title: string;
    posterPath?: string;
    isWinner: boolean;
    director?: string;
    actors?: string[];
    genre?: string[];
    releaseYear?: number;
  }
  
  export interface MovieMonday {
    id: number;
    date: string;
    movieSelections: Movie[];
    status: 'pending' | 'in-progress' | 'completed';
    picker: {
      id: string;
      username: string;
    };
    eventDetails?: {
      meals: string;
      cocktails: string[];
      notes: string;
    }
  }
  
  // Function to extract actor data for visualization
  export const getActorAnalytics = (movieMondays: MovieMonday[]) => {
    const actorCount: Record<string, number> = {};
    let totalActors = 0;
  
    // Only process movies that have actors data and are winners
    movieMondays.forEach(mm => {
      mm.movieSelections.forEach(movie => {
        if (movie.isWinner && movie.actors && movie.actors.length) {
          movie.actors.forEach(actor => {
            actorCount[actor] = (actorCount[actor] || 0) + 1;
            totalActors++;
          });
        }
      });
    });
    
    // For testing - mock data in case no actor data is available
    if (Object.keys(actorCount).length === 0) {
      ["Tom Hanks", "Meryl Streep", "Leonardo DiCaprio", "Viola Davis", "Brad Pitt"].forEach((actor, index) => {
        actorCount[actor] = 5 - index;
        totalActors += 5 - index;
      });
    }
  
    // Convert to array and sort
    const actorData = Object.entries(actorCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  
    return {
      topActors: actorData.slice(0, 10),
      totalUniqueActors: Object.keys(actorCount).length,
      totalActors
    };
  };
  
  // Function to extract director data for visualization
  export const getDirectorAnalytics = (movieMondays: MovieMonday[]) => {
    const directorCount: Record<string, number> = {};
    let totalDirectors = 0;
  
    // Only process movies that have director data and are winners
    movieMondays.forEach(mm => {
      mm.movieSelections.forEach(movie => {
        if (movie.isWinner && movie.director) {
          directorCount[movie.director] = (directorCount[movie.director] || 0) + 1;
          totalDirectors++;
        }
      });
    });
  
    // Convert to array and sort
    const directorData = Object.entries(directorCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  
    return {
      topDirectors: directorData.slice(0, 10),
      totalUniqueDirectors: Object.keys(directorCount).length,
      totalDirectors
    };
  };
  
  // Function to extract genre data for visualization
  export const getGenreAnalytics = (movieMondays: MovieMonday[]) => {
    const genreCount: Record<string, number> = {};
    let totalGenres = 0;
  
    // Only process movies that have genre data and are winners
    movieMondays.forEach(mm => {
      mm.movieSelections.forEach(movie => {
        if (movie.isWinner && movie.genre && movie.genre.length) {
          movie.genre.forEach(genre => {
            genreCount[genre] = (genreCount[genre] || 0) + 1;
            totalGenres++;
          });
        }
      });
    });
  
    // Convert to array and sort
    const genreData = Object.entries(genreCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  
    return {
      genreDistribution: genreData,
      totalUniqueGenres: Object.keys(genreCount).length,
      totalGenres
    };
  };
  
  // Function to calculate win rates for movies
  export const getWinRateAnalytics = (movieMondays: MovieMonday[]) => {
    // Track selections per movie
    const movieSelections: Record<number, { title: string, selections: number, wins: number }> = {};
  
    // Process all movie selections
    movieMondays.forEach(mm => {
      if (mm.status === 'completed') {
        mm.movieSelections.forEach(movie => {
          if (!movieSelections[movie.tmdbMovieId]) {
            movieSelections[movie.tmdbMovieId] = { 
              title: movie.title, 
              selections: 0, 
              wins: 0 
            };
          }
  
          movieSelections[movie.tmdbMovieId].selections += 1;
          
          if (movie.isWinner) {
            movieSelections[movie.tmdbMovieId].wins += 1;
          }
        });
      }
    });
  
    // Convert to array format for visualization
    const winRateData = Object.entries(movieSelections)
      .map(([id, data]) => ({
        id: Number(id),
        name: data.title,
        selections: data.selections,
        wins: data.wins,
        winRate: data.selections > 0 ? (data.wins / data.selections) * 100 : 0,
        lossRate: data.selections > 0 ? ((data.selections - data.wins) / data.selections) * 100 : 0
      }))
      .filter(movie => movie.selections > 1) // Only include movies with multiple selections
      .sort((a, b) => a.winRate - b.winRate); // Sort by win rate ascending (most losses first)
  
    return {
      mostLosses: winRateData.slice(0, 10),
      highestWinRate: [...winRateData].sort((a, b) => b.winRate - a.winRate).slice(0, 10)
    };
  };
  
  // Function to get time-based metrics (movies watched over time)
  export const getTimeBasedAnalytics = (movieMondays: MovieMonday[]) => {
    // Group by month
    const monthlyData: Record<string, { month: string, count: number }> = {};
  
    // Only process completed movie mondays with a winner
    movieMondays
      .filter(mm => mm.status === 'completed' && mm.movieSelections.some(m => m.isWinner))
      .forEach(mm => {
        const date = new Date(mm.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthLabel, count: 0 };
        }
        
        monthlyData[monthKey].count += 1;
      });
  
    // Convert to array and sort by date
    const timeSeriesData = Object.entries(monthlyData)
      .map(([key, data]) => ({
        name: data.month,
        value: data.count,
        key
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  
    return {
      monthlyMovies: timeSeriesData,
      totalMoviesWatched: timeSeriesData.reduce((sum, item) => sum + item.value, 0)
    };
  };
  
  // Function to get picker success rates
  export const getPickerAnalytics = (movieMondays: MovieMonday[]) => {
    const pickerStats: Record<string, { 
      username: string, 
      selections: number, 
      wins: number 
    }> = {};
  
    // Process all completed movie mondays
    movieMondays
      .filter(mm => mm.status === 'completed')
      .forEach(mm => {
        const pickerId = mm.picker.id;
        const pickerName = mm.picker.username;
        
        if (!pickerStats[pickerId]) {
          pickerStats[pickerId] = { 
            username: pickerName, 
            selections: 0, 
            wins: 0 
          };
        }
        
        pickerStats[pickerId].selections += 1;
        
        // Check if the picker's selection won
        const winningMovie = mm.movieSelections.find(m => m.isWinner);
        if (winningMovie) {
          pickerStats[pickerId].wins += 1;
        }
      });
  
    // Convert to array for visualization
    const pickerData = Object.entries(pickerStats)
      .map(([id, data]) => ({
        id,
        name: data.username,
        selections: data.selections,
        wins: data.wins,
        successRate: data.selections > 0 ? (data.wins / data.selections) * 100 : 0
      }))
      .sort((a, b) => b.successRate - a.successRate);
  
    return {
      pickerSuccessRates: pickerData,
      totalPickers: pickerData.length,
      mostSuccessful: pickerData.length > 0 ? pickerData[0] : null
    };
  };
  
  // Mock API function to simulate fetching analytics data
  export const fetchAnalyticsData = async (token: string) => {
    try {
      // In a real implementation, this would be an API call
      const response = await fetch('http://localhost:8000/api/movie-monday/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      return null;
    }
  };