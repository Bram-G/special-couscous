"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Image,
  Link,
  Spinner,
  Progress,
  Button,
  Tooltip,
  Badge,
} from "@heroui/react";
import {
  Calendar,
  ArrowLeft,
  Film,
  Star,
  Trophy,
  Utensils,
  Wine,
  UserCircle,
  Cake,
  Sparkles,
  BarChart4,
  Box,
  Zap,
  Users,
  Info,
  Link2,
  History,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

// Enhanced with historical data types
interface HistoricalStats {
  // Common items across past Movie Mondays
  mealFrequencies: Array<{
    name: string;
    count: number;
    lastSeenDate?: string;
    firstSeenDate?: string;
  }>;
  cocktailFrequencies: Array<{
    name: string;
    count: number;
    lastSeenDate?: string;
    firstSeenDate?: string;
  }>;
  dessertFrequencies: Array<{
    name: string;
    count: number;
    lastSeenDate?: string;
    firstSeenDate?: string;
  }>;

  // Actor stats
  actorAppearances: Array<{
    id: number;
    name: string;
    totalAppearances: number;
    wins: number;
    losses: number;
    appearances: Array<{
      date: string;
      movieTitle: string;
      isWinner: boolean;
      movieMondayId: number;
    }>;
  }>;

  // Director stats
  directorAppearances: Array<{
    id: number;
    name: string;
    totalAppearances: number;
    wins: number;
    losses: number;
    appearances: Array<{
      date: string;
      movieTitle: string;
      isWinner: boolean;
      movieMondayId: number;
    }>;
  }>;

  // Movie stats (for repeated movies)
  repeatedMovies: Array<{
    tmdbMovieId: number;
    title: string;
    appearances: number;
    wins: number;
    firstAppearance: string;
    appearances: Array<{
      date: string;
      isWinner: boolean;
      movieMondayId: number;
    }>;
  }>;

  // Picker stats
  pickerStats: {
    totalPicks: number;
    winRate: number;
    mostSelectedGenres: Array<{ name: string; count: number }>;
  };
}

interface MovieMondayDetailData {
  movieMonday: {
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
      posterPath: string;
      isWinner: boolean;
      genres: string[];
      releaseYear: number;
      previousAppearances?: number;
      cast: Array<{
        id: number;
        actorId: number;
        name: string;
        character: string;
        profilePath: string;
      }>;
      crew: Array<{
        id: number;
        personId: number;
        name: string;
        job: string;
        department: string;
        profilePath: string;
      }>;
    }>;
    eventDetails: {
      id: number;
      meals: string[];
      cocktails: string[];
      desserts: string[];
      notes: string;
    };
  };
  stats: {
    actors: Array<{
      id: number;
      name: string;
      count: number;
      isWinner: number;
    }>;
    directors: Array<{
      id: number;
      name: string;
      count: number;
      isWinner: number;
    }>;
    genres: Array<{
      name: string;
      count: number;
      isWinner: number;
    }>;
    meals: string[];
    cocktails: string[];
    desserts: string[];
  };
  // Add historical stats
  history: HistoricalStats;
}

const MovieMondayDetail: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { token, isAuthenticated } = useAuth();

  const [data, setData] = useState<MovieMondayDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [showHistorySection, setShowHistorySection] = useState(false);

  const movieMondayId = params?.id as string;

  useEffect(() => {
    fetchMovieMondayDetails();
  }, [movieMondayId, token]);

  const fetchMovieMondayDetails = async () => {
    if (!movieMondayId) return;

    try {
      setLoading(true);
      setError(null);

      // Check auth if needed
      if (!token) {
        // For public viewing, we can still try to fetch but server will verify access
        // This allows public access if server permits it
      }

      const response = await fetch(
        `http://localhost:8000/api/movie-monday/${movieMondayId}/details?include_history=true`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 403) {
          setUnauthorized(true);
          throw new Error(
            "You don't have permission to view this Movie Monday",
          );
        }
        if (response.status === 404) {
          throw new Error(
            "Movie Monday not found or you do not have access to it",
          );
        }
        throw new Error("Failed to fetch Movie Monday details");
      }

      const data = await response.json();

      setData(data);
    } catch (err) {
      console.error("Error fetching Movie Monday details:", err);
      setError(
        err.message || "An error occurred while loading Movie Monday details",
      );
    } finally {
      setLoading(false);
    }
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format date to relative time
  const formatRelativeDate = (dateString: string) => {
    if (!dateString) return "Unknown";

    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.round(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.round(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.round(diffDays / 30)} months ago`;

    return `${Math.round(diffDays / 365)} years ago`;
  };

  // Find common elements between movies
  const findConnections = () => {
    if (
      !data ||
      !data.movieMonday ||
      data.movieMonday.movieSelections.length < 2
    )
      return null;

    const { movieSelections } = data.movieMonday;
    const connections = {
      actors: [],
      directors: [],
      genres: [],
      years: [],
    };

    // Collect all actors, directors and genres
    const actorsMap = new Map();
    const directorsMap = new Map();
    const genresMap = new Map();
    const yearsMap = new Map();

    // Process each movie
    movieSelections.forEach((movie) => {
      // Process actors
      movie.cast?.forEach((actor) => {
        const actorKey = `${actor.name}-${actor.actorId}`;

        if (!actorsMap.has(actorKey)) {
          actorsMap.set(actorKey, {
            id: actor.actorId,
            name: actor.name,
            profilePath: actor.profilePath,
            movies: [],
          });
        }
        actorsMap.get(actorKey).movies.push({
          id: movie.tmdbMovieId,
          title: movie.title,
          isWinner: movie.isWinner,
        });
      });

      // Process directors
      movie.crew
        ?.filter((c) => c.job === "Director")
        .forEach((director) => {
          const directorKey = `${director.name}-${director.personId}`;

          if (!directorsMap.has(directorKey)) {
            directorsMap.set(directorKey, {
              id: director.personId,
              name: director.name,
              profilePath: director.profilePath,
              movies: [],
            });
          }
          directorsMap.get(directorKey).movies.push({
            id: movie.tmdbMovieId,
            title: movie.title,
            isWinner: movie.isWinner,
          });
        });

      // Process genres
      movie.genres?.forEach((genre) => {
        if (!genresMap.has(genre)) {
          genresMap.set(genre, { name: genre, movies: [] });
        }
        genresMap.get(genre).movies.push({
          id: movie.tmdbMovieId,
          title: movie.title,
          isWinner: movie.isWinner,
        });
      });

      // Process years
      if (movie.releaseYear) {
        const decade = Math.floor(movie.releaseYear / 10) * 10;
        const decadeLabel = `${decade}s`;

        if (!yearsMap.has(decadeLabel)) {
          yearsMap.set(decadeLabel, { decade: decadeLabel, movies: [] });
        }
        yearsMap.get(decadeLabel).movies.push({
          id: movie.tmdbMovieId,
          title: movie.title,
          year: movie.releaseYear,
          isWinner: movie.isWinner,
        });
      }
    });

    // Find connections (items appearing in multiple movies)
    for (const [_, actor] of actorsMap) {
      if (actor.movies.length >= 2) {
        connections.actors.push(actor);
      }
    }

    for (const [_, director] of directorsMap) {
      if (director.movies.length >= 2) {
        connections.directors.push(director);
      }
    }

    for (const [_, genre] of genresMap) {
      if (genre.movies.length >= 2) {
        connections.genres.push(genre);
      }
    }

    for (const [_, decade] of yearsMap) {
      if (decade.movies.length >= 2) {
        connections.years.push(decade);
      }
    }

    return connections;
  };

  // Generate interesting facts based on movie monday data and history
  const generateInterestingFacts = () => {
    if (!data || !data.movieMonday || !data.stats) return [];

    const facts = [];
    const { movieMonday, stats, history } = data;
    const connections = findConnections();

    // Theme connections
    if (connections) {
      // Actor connections
      if (connections.actors.length > 0) {
        const topActor = connections.actors.sort(
          (a, b) => b.movies.length - a.movies.length,
        )[0];

        if (topActor.movies.length === movieMonday.movieSelections.length) {
          facts.push({
            text: (
              <>
                Actor <strong>{topActor.name}</strong> appears in{" "}
                <strong>all {topActor.movies.length} movies</strong> this week!
              </>
            ),
            icon: <Users className="h-5 w-5 text-primary" />,
            priority: 10,
          });
        } else if (topActor.movies.length >= 2) {
          facts.push({
            text: (
              <>
                Actor <strong>{topActor.name}</strong> appears in{" "}
                <strong>{topActor.movies.length}</strong> of this week's
                selections
              </>
            ),
            icon: <Users className="h-5 w-5 text-primary" />,
            priority: 8,
          });
        }
      }

      // Director connections
      if (connections.directors.length > 0) {
        const topDirector = connections.directors.sort(
          (a, b) => b.movies.length - a.movies.length,
        )[0];

        if (topDirector.movies.length > 1) {
          facts.push({
            text: (
              <>
                Director <strong>{topDirector.name}</strong> directed{" "}
                <strong>{topDirector.movies.length}</strong> of this week's
                movies
              </>
            ),
            icon: <Film className="h-5 w-5 text-success" />,
            priority: 9,
          });
        }
      }

      // Genre theme
      if (connections.genres.length > 0) {
        const topGenre = connections.genres.sort(
          (a, b) => b.movies.length - a.movies.length,
        )[0];

        if (topGenre.movies.length === movieMonday.movieSelections.length) {
          facts.push({
            text: (
              <>
                This week has a <strong>{topGenre.name} theme</strong> - all
                movies share this genre!
              </>
            ),
            icon: <Zap className="h-5 w-5 text-warning" />,
            priority: 10,
          });
        } else if (topGenre.movies.length >= 2) {
          facts.push({
            text: (
              <>
                <strong>{topGenre.movies.length}</strong> movies this week share
                the <strong>{topGenre.name}</strong> genre
              </>
            ),
            icon: <Link2 className="h-5 w-5 text-primary" />,
            priority: 7,
          });
        }
      }

      // Decade theme
      if (connections.years.length > 0) {
        const topDecade = connections.years.sort(
          (a, b) => b.movies.length - a.movies.length,
        )[0];

        if (topDecade.movies.length === movieMonday.movieSelections.length) {
          facts.push({
            text: (
              <>
                All movies this week are from the{" "}
                <strong>{topDecade.decade}</strong>!
              </>
            ),
            icon: <Calendar className="h-5 w-5 text-danger" />,
            priority: 9,
          });
        } else if (topDecade.movies.length >= 2) {
          facts.push({
            text: (
              <>
                <strong>{topDecade.movies.length}</strong> movies this week are
                from the <strong>{topDecade.decade}</strong>
              </>
            ),
            icon: <Calendar className="h-5 w-5 text-danger" />,
            priority: 6,
          });
        }
      }
    }

    // Facts about winning movies
    const winningMovie = movieMonday.movieSelections.find((m) => m.isWinner);

    if (winningMovie) {
      // Check if this movie has been in previous selections
      const previousAppearances = winningMovie.previousAppearances || 0;

      if (previousAppearances > 0) {
        facts.push({
          text: (
            <>
              The movie <strong>{winningMovie.title}</strong> has appeared in{" "}
              <strong>{previousAppearances + 1}</strong> Movie Mondays and
              finally won!
            </>
          ),
          icon: <Trophy className="h-5 w-5 text-warning" />,
          priority: 10,
        });
      }

      // If we have history data, check for additional insights
      if (history && history.repeatedMovies) {
        const movieHistory = history.repeatedMovies.find(
          (m) => m.tmdbMovieId === winningMovie.tmdbMovieId,
        );

        if (movieHistory && movieHistory.appearances > 1) {
          facts.push({
            text: (
              <>
                <strong>{winningMovie.title}</strong> has won{" "}
                {movieHistory.wins} out of {movieHistory.appearances} times it
                has been selected!
              </>
            ),
            icon: <TrendingUp className="h-5 w-5 text-primary" />,
            priority: 9,
          });
        }
      }
    }

    // Food/drink facts with history
    if (history && movieMonday.eventDetails) {
      // Meal history facts
      movieMonday.eventDetails.meals?.forEach((meal) => {
        const mealHistory = history.mealFrequencies?.find(
          (m) => m.name === meal,
        );

        if (mealHistory && mealHistory.count > 1) {
          facts.push({
            text: (
              <>
                <strong>{meal}</strong> has been served{" "}
                <strong>{mealHistory.count}</strong> times for Movie Monday!
              </>
            ),
            icon: <Utensils className="h-5 w-5 text-primary" />,
            priority: 8,
          });
        }
      });

      // Cocktail history facts
      movieMonday.eventDetails.cocktails?.forEach((cocktail) => {
        const cocktailHistory = history.cocktailFrequencies?.find(
          (c) => c.name === cocktail,
        );

        if (cocktailHistory && cocktailHistory.count > 1) {
          facts.push({
            text: (
              <>
                <strong>{cocktail}</strong> has been mixed{" "}
                <strong>{cocktailHistory.count}</strong> times for Movie Monday
                gatherings!
              </>
            ),
            icon: <Wine className="h-5 w-5 text-danger" />,
            priority: 7,
          });
        }
      });

      // Dessert history facts
      movieMonday.eventDetails.desserts?.forEach((dessert) => {
        const dessertHistory = history.dessertFrequencies?.find(
          (d) => d.name === dessert,
        );

        if (dessertHistory && dessertHistory.count > 1) {
          facts.push({
            text: (
              <>
                <strong>{dessert}</strong> has been enjoyed{" "}
                <strong>{dessertHistory.count}</strong> times as a Movie Monday
                dessert!
              </>
            ),
            icon: <Cake className="h-5 w-5 text-warning" />,
            priority: 6,
          });
        }
      });
    }

    // Actor history facts
    if (history && history.actorAppearances) {
      // Find actors in current selections that have interesting histories
      movieMonday.movieSelections.forEach((movie) => {
        movie.cast.forEach((actor) => {
          const actorHistory = history.actorAppearances.find(
            (a) => a.id === actor.actorId,
          );

          if (actorHistory) {
            // Actor with many appearances but few/no wins
            if (actorHistory.totalAppearances > 3 && actorHistory.wins === 0) {
              facts.push({
                text: (
                  <>
                    <strong>{actor.name}</strong> has appeared in{" "}
                    <strong>{actorHistory.totalAppearances}</strong> Movie
                    Monday selections but never won!
                  </>
                ),
                icon: <AlertCircle className="h-5 w-5 text-danger" />,
                priority: 9,
              });
            }
            // Actor with good win rate
            else if (
              actorHistory.wins > 0 &&
              actorHistory.wins / actorHistory.totalAppearances > 0.5
            ) {
              facts.push({
                text: (
                  <>
                    <strong>{actor.name}</strong> has a winning record with{" "}
                    <strong>{actorHistory.wins}</strong> wins out of{" "}
                    {actorHistory.totalAppearances} appearances!
                  </>
                ),
                icon: <Star className="h-5 w-5 text-warning" />,
                priority: 8,
              });
            }
            // Actor who keeps appearing
            else if (actorHistory.totalAppearances > 5) {
              facts.push({
                text: (
                  <>
                    <strong>{actor.name}</strong> is a Movie Monday regular with{" "}
                    <strong>{actorHistory.totalAppearances}</strong>{" "}
                    appearances!
                  </>
                ),
                icon: <Users className="h-5 w-5 text-primary" />,
                priority: 7,
              });
            }
          }
        });
      });
    }

    // Director history facts
    if (history && history.directorAppearances) {
      // Find directors in current selections with interesting histories
      movieMonday.movieSelections.forEach((movie) => {
        const directors = movie.crew.filter((c) => c.job === "Director");

        directors.forEach((director) => {
          const directorHistory = history.directorAppearances.find(
            (d) => d.id === director.personId,
          );

          if (directorHistory && directorHistory.totalAppearances > 1) {
            if (directorHistory.wins > 0) {
              facts.push({
                text: (
                  <>
                    Director <strong>{director.name}</strong> has a{" "}
                    {Math.round(
                      (directorHistory.wins /
                        directorHistory.totalAppearances) *
                        100,
                    )}
                    % win rate across {directorHistory.totalAppearances} Movie
                    Mondays!
                  </>
                ),
                icon: <Film className="h-5 w-5 text-success" />,
                priority: 8,
              });
            } else {
              facts.push({
                text: (
                  <>
                    Director <strong>{director.name}</strong> has been featured{" "}
                    <strong>{directorHistory.totalAppearances}</strong> times
                    but hasn't won yet!
                  </>
                ),
                icon: <Film className="h-5 w-5 text-success" />,
                priority: 7,
              });
            }
          }
        });
      });
    }

    // Picker stats
    if (history && history.pickerStats) {
      const { pickerStats } = history;

      // If the picker has made selections before
      if (pickerStats.totalPicks > 1) {
        facts.push({
          text: (
            <>
              <strong>{movieMonday.picker.username}</strong> has selected movies
              for <strong>{pickerStats.totalPicks}</strong> Movie Mondays with a{" "}
              {Math.round(pickerStats.winRate * 100)}% success rate!
            </>
          ),
          icon: <UserCircle className="h-5 w-5 text-primary" />,
          priority: 8,
        });

        // If the picker has genre preferences
        if (
          pickerStats.mostSelectedGenres &&
          pickerStats.mostSelectedGenres.length > 0
        ) {
          const favoriteGenre = pickerStats.mostSelectedGenres[0];

          facts.push({
            text: (
              <>
                <strong>{movieMonday.picker.username}</strong> favors{" "}
                <strong>{favoriteGenre.name}</strong> films, selecting them{" "}
                {favoriteGenre.count} times!
              </>
            ),
            icon: <Film className="h-5 w-5 text-primary" />,
            priority: 7,
          });
        }
      }
    }

    // Sort by priority and take top 4
    return facts.sort((a, b) => b.priority - a.priority).slice(0, 4);
  };

  // Render the historical comparison section
  const renderHistoricalSection = () => {
    if (!data || !data.history) return null;

    const { history, movieMonday } = data;

    return (
      <Card className="mt-6">
        <CardHeader className="flex gap-2">
          <History className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Historical Insights</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            {/* Repeat appearances section */}
            {history.repeatedMovies && history.repeatedMovies.length > 0 && (
              <div>
                <h4 className="font-medium text-default-700 mb-3">
                  Repeat Movie Appearances
                </h4>
                <div className="space-y-3">
                  {history.repeatedMovies.slice(0, 3).map((movie) => (
                    <div
                      key={movie.tmdbMovieId}
                      className="p-3 bg-default-50 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">{movie.title}</span>
                        <Chip color="primary" size="sm">
                          {movie.appearances} times
                        </Chip>
                      </div>
                      <div className="text-sm">
                        <div className="flex justify-between">
                          <span>First appearance:</span>
                          <span>
                            {formatRelativeDate(movie.firstAppearance)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Win rate:</span>
                          <span>
                            {movie.wins} / {movie.appearances} (
                            {Math.round((movie.wins / movie.appearances) * 100)}
                            %)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actor history section */}
            {history.actorAppearances &&
              history.actorAppearances.length > 0 && (
                <div>
                  <h4 className="font-medium text-default-700 mb-3">
                    Actor Success Rates
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {history.actorAppearances
                      .filter((actor) => actor.totalAppearances > 1)
                      .sort(
                        (a, b) =>
                          b.wins / b.totalAppearances -
                          a.wins / a.totalAppearances,
                      )
                      .slice(0, 4)
                      .map((actor) => (
                        <div
                          key={actor.id}
                          className="p-3 bg-default-50 rounded-lg"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium">{actor.name}</span>
                            <div className="flex items-center gap-1">
                              <Trophy className="h-4 w-4 text-warning" />
                              <span>
                                {actor.wins} / {actor.totalAppearances}
                              </span>
                            </div>
                          </div>
                          <Progress
                            className="h-2 mb-2"
                            color="warning"
                            size="sm"
                            value={(actor.wins / actor.totalAppearances) * 100}
                          />
                          <p className="text-xs text-default-500">
                            {actor.wins === 0
                              ? `0% win rate over ${actor.totalAppearances} appearances`
                              : `${Math.round((actor.wins / actor.totalAppearances) * 100)}% win rate`}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Menu favorites section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Meals */}
              {history.mealFrequencies &&
                history.mealFrequencies.length > 0 && (
                  <div>
                    <h4 className="font-medium text-default-700 mb-2 flex items-center">
                      <Utensils className="h-4 w-4 mr-1" />
                      Top Meals
                    </h4>
                    <div className="space-y-2">
                      {history.mealFrequencies
                        .slice(0, 3)
                        .map((meal, index) => (
                          <Tooltip
                            key={index}
                            content={`Served ${meal.count} times, last seen ${formatRelativeDate(meal.lastSeenDate)}`}
                          >
                            <div className="p-2 bg-default-100 rounded-lg flex justify-between items-center cursor-help">
                              <span className="truncate">{meal.name}</span>
                              <Badge
                                color="primary"
                                content={meal.count}
                                size="sm"
                              />
                            </div>
                          </Tooltip>
                        ))}
                    </div>
                  </div>
                )}

              {/* Cocktails */}
              {history.cocktailFrequencies &&
                history.cocktailFrequencies.length > 0 && (
                  <div>
                    <h4 className="font-medium text-default-700 mb-2 flex items-center">
                      <Wine className="h-4 w-4 mr-1" />
                      Top Cocktails
                    </h4>
                    <div className="space-y-2">
                      {history.cocktailFrequencies
                        .slice(0, 3)
                        .map((cocktail, index) => (
                          <Tooltip
                            key={index}
                            content={`Mixed ${cocktail.count} times, last seen ${formatRelativeDate(cocktail.lastSeenDate)}`}
                          >
                            <div className="p-2 bg-default-100 rounded-lg flex justify-between items-center cursor-help">
                              <span className="truncate">{cocktail.name}</span>
                              <Badge
                                color="danger"
                                content={cocktail.count}
                                size="sm"
                              />
                            </div>
                          </Tooltip>
                        ))}
                    </div>
                  </div>
                )}

              {/* Desserts */}
              {history.dessertFrequencies &&
                history.dessertFrequencies.length > 0 && (
                  <div>
                    <h4 className="font-medium text-default-700 mb-2 flex items-center">
                      <Cake className="h-4 w-4 mr-1" />
                      Top Desserts
                    </h4>
                    <div className="space-y-2">
                      {history.dessertFrequencies
                        .slice(0, 3)
                        .map((dessert, index) => (
                          <Tooltip
                            key={index}
                            content={`Enjoyed ${dessert.count} times, last seen ${formatRelativeDate(dessert.lastSeenDate)}`}
                          >
                            <div className="p-2 bg-default-100 rounded-lg flex justify-between items-center cursor-help">
                              <span className="truncate">{dessert.name}</span>
                              <Badge
                                color="warning"
                                content={dessert.count}
                                size="sm"
                              />
                            </div>
                          </Tooltip>
                        ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Directors section */}
            {history.directorAppearances &&
              history.directorAppearances &&
              history.directorAppearances.length > 0 && (
                <div>
                  <h4 className="font-medium text-default-700 mb-3">
                    Director Stats
                  </h4>
                  <div className="space-y-3">
                    {history.directorAppearances
                      .filter((director) => director.totalAppearances > 1)
                      .sort((a, b) => b.totalAppearances - a.totalAppearances)
                      .slice(0, 3)
                      .map((director) => (
                        <div
                          key={director.id}
                          className="p-3 bg-default-50 rounded-lg"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium">{director.name}</span>
                            <span>{director.totalAppearances} appearances</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>
                              {director.wins} wins (
                              {Math.round(
                                (director.wins / director.totalAppearances) *
                                  100,
                              )}
                              % success)
                            </span>
                            <div className="flex items-center gap-1">
                              <Film className="h-4 w-4 text-success" />
                              <span>{director.appearances.length} films</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Picker stats section */}
            {history.pickerStats && (
              <div>
                <h4 className="font-medium text-default-700 mb-3">
                  Picker Performance
                </h4>
                <div className="p-3 bg-default-50 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">
                      {movieMonday.picker.username}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>
                        {Math.round(history.pickerStats.winRate * 100)}% win
                        rate
                      </span>
                      <Trophy className="h-4 w-4 text-warning" />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total selections:</span>
                      <span>
                        {history.pickerStats.totalPicks} Movie Mondays
                      </span>
                    </div>

                    {history.pickerStats.mostSelectedGenres &&
                      history.pickerStats.mostSelectedGenres.length > 0 && (
                        <div>
                          <span>Favorite genres:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {history.pickerStats.mostSelectedGenres
                              .slice(0, 3)
                              .map((genre, index) => (
                                <Chip key={index} size="sm" variant="flat">
                                  {genre.name} ({genre.count})
                                </Chip>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-danger text-xl mb-4">
          You don't have permission to view this Movie Monday
        </div>
        <Button
          color="primary"
          startContent={<ArrowLeft />}
          variant="flat"
          onPress={() => router.push("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-danger text-xl mb-4">{error}</div>
        <Button
          color="primary"
          startContent={<ArrowLeft />}
          variant="flat"
          onPress={() => router.push("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!data || !data.movieMonday) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-xl mb-4">Movie Monday not found</div>
        <Button
          color="primary"
          startContent={<ArrowLeft />}
          variant="flat"
          onPress={() => router.push("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const { movieMonday, stats } = data;
  const interestingFacts = generateInterestingFacts();
  const connections = findConnections();

  // Find the winning movie if there is one
  const winningMovie = movieMonday.movieSelections.find(
    (movie) => movie.isWinner,
  );

  return (
    <div className="container mx-auto px-4 pb-16">
      {/* Header with Back button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button
            isIconOnly
            className="mr-2"
            variant="light"
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Movie Monday</h1>
            <div className="flex items-center text-default-500">
              <Calendar className="mr-1" size={16} />
              <span>{formatDate(movieMonday.date)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-default-500">
            Selected by{" "}
            <span className="font-medium">{movieMonday.picker.username}</span>
          </div>

          <Chip
            color={
              movieMonday.status === "completed"
                ? "success"
                : movieMonday.status === "in-progress"
                  ? "warning"
                  : "primary"
            }
            size="sm"
            variant="flat"
          >
            {movieMonday.status.replace("-", " ")}
          </Chip>
        </div>
      </div>

      {/* Interesting Facts Section - Only show if we have facts */}
      {interestingFacts.length > 0 && (
        <Card className="mb-8 bg-gradient-to-r from-primary-100/30 to-secondary-100/30 dark:from-primary-900/30 dark:to-secondary-900/30 border-none shadow-md">
          <CardBody className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Movie Monday Insights</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {interestingFacts.map((fact, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-background/60 backdrop-blur-sm rounded-lg"
                >
                  <div className="mt-1 flex-shrink-0">{fact.icon}</div>
                  <p>{fact.text}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Movies and Connections (takes 2/3 of space on large screens) */}
        <div className="lg:col-span-2">
          {/* Movie Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Film className="w-5 h-5 mr-2 text-primary" />
              Movie Selections
            </h2>

            {/* Connections Section - if there are connections between movies */}
            {connections && (
              <Card className="mb-6 bg-default-50">
                <CardBody>
                  <h3 className="text-lg font-bold mb-3 flex items-center">
                    <Link2 className="h-5 w-5 mr-2 text-primary" />
                    Movie Connections
                  </h3>

                  <div className="space-y-4">
                    {/* Actor Connections */}
                    {connections.actors.length > 0 && (
                      <div>
                        <h4 className="font-medium text-default-700 mb-2">
                          Common Actors
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {connections.actors.map((actor) => (
                            <Tooltip
                              key={actor.id}
                              content={
                                <div>
                                  <p className="font-bold mb-1">Appears in:</p>
                                  <ul className="list-disc pl-4">
                                    {actor.movies.map((m) => (
                                      <li
                                        key={m.id}
                                        className={
                                          m.isWinner ? "text-warning" : ""
                                        }
                                      >
                                        {m.title} {m.isWinner && "(Winner)"}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              }
                            >
                              <div className="inline-flex items-center bg-background py-1 pl-2 pr-3 rounded-full border border-default-200 cursor-help">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-6 h-6 rounded-full bg-default-200 flex items-center justify-center">
                                    <Users size={14} />
                                  </div>
                                  <span className="font-medium">
                                    {actor.name}
                                  </span>
                                  <Badge
                                    color="primary"
                                    content={actor.movies.length}
                                    placement="top-right"
                                    size="sm"
                                  >
                                    <div className="w-2 h-5" />
                                  </Badge>
                                </div>
                              </div>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Director Connections */}
                    {connections.directors.length > 0 && (
                      <div>
                        <h4 className="font-medium text-default-700 mb-2">
                          Common Directors
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {connections.directors.map((director) => (
                            <Tooltip
                              key={director.id}
                              content={
                                <div>
                                  <p className="font-bold mb-1">Directed:</p>
                                  <ul className="list-disc pl-4">
                                    {director.movies.map((m) => (
                                      <li
                                        key={m.id}
                                        className={
                                          m.isWinner ? "text-warning" : ""
                                        }
                                      >
                                        {m.title} {m.isWinner && "(Winner)"}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              }
                            >
                              <div className="inline-flex items-center bg-background py-1 pl-2 pr-3 rounded-full border border-default-200 cursor-help">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-6 h-6 rounded-full bg-default-200 flex items-center justify-center">
                                    <Film size={14} />
                                  </div>
                                  <span className="font-medium">
                                    {director.name}
                                  </span>
                                  <Badge
                                    color="success"
                                    content={director.movies.length}
                                    placement="top-right"
                                    size="sm"
                                  >
                                    <div className="w-2 h-5" />
                                  </Badge>
                                </div>
                              </div>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Genre Connections */}
                    {connections.genres.length > 0 && (
                      <div>
                        <h4 className="font-medium text-default-700 mb-2">
                          Common Genres
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {connections.genres.map((genre, idx) => (
                            <Tooltip
                              key={idx}
                              content={
                                <div>
                                  <p className="font-bold mb-1">
                                    Movies in this genre:
                                  </p>
                                  <ul className="list-disc pl-4">
                                    {genre.movies.map((m) => (
                                      <li
                                        key={m.id}
                                        className={
                                          m.isWinner ? "text-warning" : ""
                                        }
                                      >
                                        {m.title} {m.isWinner && "(Winner)"}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              }
                            >
                              <Chip
                                color={
                                  genre.movies.length ===
                                  movieMonday.movieSelections.length
                                    ? "warning"
                                    : "default"
                                }
                                variant="flat"
                              >
                                {genre.name} ({genre.movies.length})
                              </Chip>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Decade Connections */}
                    {connections.years.length > 0 && (
                      <div>
                        <h4 className="font-medium text-default-700 mb-2">
                          Common Decades
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {connections.years.map((decade, idx) => (
                            <Tooltip
                              key={idx}
                              content={
                                <div>
                                  <p className="font-bold mb-1">
                                    Movies from {decade.decade}:
                                  </p>
                                  <ul className="list-disc pl-4">
                                    {decade.movies.map((m) => (
                                      <li
                                        key={m.id}
                                        className={
                                          m.isWinner ? "text-warning" : ""
                                        }
                                      >
                                        {m.title} ({m.year}){" "}
                                        {m.isWinner && "(Winner)"}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              }
                            >
                              <Chip
                                color={
                                  decade.movies.length ===
                                  movieMonday.movieSelections.length
                                    ? "danger"
                                    : "default"
                                }
                                variant="flat"
                              >
                                {decade.decade} ({decade.movies.length})
                              </Chip>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Winner Movie Card */}
            {winningMovie && (
              <Card className="mb-6 border-2 border-warning overflow-hidden">
                <CardBody>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold flex items-center">
                      <Trophy className="h-5 w-5 text-warning mr-2" />
                      Winning Movie
                    </h3>
                    <Chip color="warning" variant="flat">
                      Winner
                    </Chip>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Poster */}
                    <div className="sm:w-1/5 flex-shrink-0">
                      <Image
                        removeWrapper
                        alt={winningMovie.title}
                        className="w-full aspect-[2/3] object-cover rounded-lg shadow-md"
                        src={
                          winningMovie.posterPath
                            ? `https://image.tmdb.org/t/p/w300${winningMovie.posterPath}`
                            : "/placeholder-poster.jpg"
                        }
                      />
                    </div>

                    {/* Movie details */}
                    <div className="sm:w-4/5">
                      <h4 className="text-xl font-bold">
                        {winningMovie.title}
                      </h4>

                      <div className="flex flex-wrap gap-3 mt-2">
                        {winningMovie.releaseYear && (
                          <div className="flex items-center text-default-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{winningMovie.releaseYear}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {winningMovie.genres?.map((genre, index) => (
                            <Chip key={index} size="sm" variant="flat">
                              {genre}
                            </Chip>
                          ))}
                        </div>
                      </div>

                      <Divider className="my-3" />

                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        {/* Directors */}
                        <div>
                          <h5 className="text-sm font-medium text-default-600">
                            Director:
                          </h5>
                          <div>
                            {winningMovie.crew
                              .filter((c) => c.job === "Director")
                              .map((director) => (
                                <div
                                  key={director.id}
                                  className="flex items-center gap-2 mb-1"
                                >
                                  <span className="font-medium">
                                    {director.name}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Cast */}
                        <div>
                          <h5 className="text-sm font-medium text-default-600">
                            Starring:
                          </h5>
                          <div>
                            {winningMovie.cast.slice(0, 3).map((actor) => (
                              <span key={actor.id} className="block">
                                {actor.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button
                        as={Link}
                        className="mt-4"
                        color="warning"
                        href={`/movie/${winningMovie.tmdbMovieId}`}
                        size="sm"
                      >
                        View Movie Details
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Other Movies */}
            <div className="space-y-4">
              {movieMonday.movieSelections
                .filter((movie) => !movie.isWinner)
                .map((movie) => (
                  <Card key={movie.id}>
                    <CardBody className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Poster - smaller */}
                        <div className="sm:w-1/6 flex-shrink-0">
                          <Image
                            removeWrapper
                            alt={movie.title}
                            className="w-full aspect-[2/3] object-cover rounded-lg shadow-sm"
                            src={
                              movie.posterPath
                                ? `https://image.tmdb.org/t/p/w200${movie.posterPath}`
                                : "/placeholder-poster.jpg"
                            }
                          />
                        </div>

                        {/* Movie details - more space */}
                        <div className="sm:w-5/6">
                          <div className="flex justify-between items-start">
                            <h4 className="text-lg font-bold">{movie.title}</h4>

                            <Button
                              as={Link}
                              color="primary"
                              href={`/movie/${movie.tmdbMovieId}`}
                              size="sm"
                              variant="flat"
                            >
                              Details
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-3 mt-2">
                            {movie.releaseYear && (
                              <div className="flex items-center text-default-500">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>{movie.releaseYear}</span>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                              {movie.genres?.slice(0, 3).map((genre, index) => (
                                <Chip key={index} size="sm" variant="flat">
                                  {genre}
                                </Chip>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-3">
                            {/* Director */}
                            <div>
                              <h5 className="text-sm font-medium text-default-600">
                                Director:
                              </h5>
                              <div>
                                {movie.crew?.find((c) => c.job === "Director")
                                  ?.name || "Unknown"}
                              </div>
                            </div>

                            {/* Cast */}
                            <div>
                              <h5 className="text-sm font-medium text-default-600">
                                Starring:
                              </h5>
                              <div>
                                {movie.cast?.slice(0, 2).map((actor, i) => (
                                  <span key={actor.id} className="block">
                                    {actor.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Key Talent - Show actors/directors that appear in multiple movies */}
                          {connections && (
                            <div className="mt-3">
                              <div className="flex flex-wrap gap-2">
                                {connections.actors
                                  .filter((conn) =>
                                    conn.movies.some(
                                      (m) => m.id === movie.tmdbMovieId,
                                    ),
                                  )
                                  .map((conn) => (
                                    <Tooltip
                                      key={conn.id}
                                      content={`Also appears in ${conn.movies.length - 1} other movie${conn.movies.length > 2 ? "s" : ""} this week`}
                                    >
                                      <Chip
                                        className="cursor-help"
                                        color="primary"
                                        size="sm"
                                        variant="dot"
                                      >
                                        {conn.name}
                                      </Chip>
                                    </Tooltip>
                                  ))}

                                {connections.directors
                                  .filter((conn) =>
                                    conn.movies.some(
                                      (m) => m.id === movie.tmdbMovieId,
                                    ),
                                  )
                                  .map((conn) => (
                                    <Tooltip
                                      key={conn.id}
                                      content={`Also directed ${conn.movies.length - 1} other movie${conn.movies.length > 2 ? "s" : ""} this week`}
                                    >
                                      <Chip
                                        className="cursor-help"
                                        color="success"
                                        size="sm"
                                        variant="dot"
                                      >
                                        {conn.name} (Dir)
                                      </Chip>
                                    </Tooltip>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
            </div>
          </div>

          {/* Analytics Visualizations */}
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <BarChart4 className="w-5 h-5 mr-2 text-primary" />
              Movie Monday Analytics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Actors Chart */}
              <Card>
                <CardHeader className="pb-0">
                  <h3 className="text-md font-bold">Top Actors</h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {stats.actors.slice(0, 5).map((actor) => (
                      <div key={actor.id}>
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center">
                            <span className="font-medium">{actor.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {actor.count} movies
                            </span>
                            {actor.isWinner > 0 && (
                              <Tooltip
                                content={`${actor.isWinner} winning movies`}
                              >
                                <Trophy className="h-4 w-4 text-warning" />
                              </Tooltip>
                            )}
                          </div>
                        </div>
                        <Progress
                          className="h-2"
                          color="primary"
                          size="sm"
                          value={
                            (actor.count /
                              Math.max(...stats.actors.map((a) => a.count))) *
                            100
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              {/* Directors Chart */}
              <Card>
                <CardHeader className="pb-0">
                  <h3 className="text-md font-bold">Top Directors</h3>
                </CardHeader>
                <CardBody>
                  {stats.directors?.length > 0 ? (
                    <div className="space-y-3">
                      {stats.directors.slice(0, 5).map((director) => (
                        <div key={director.id}>
                          <div className="flex justify-between mb-1">
                            <div className="flex items-center">
                              <span className="font-medium">
                                {director.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {director.count} movies
                              </span>
                              {director.isWinner > 0 && (
                                <Tooltip
                                  content={`${director.isWinner} winning movies`}
                                >
                                  <Trophy className="h-4 w-4 text-warning" />
                                </Tooltip>
                              )}
                            </div>
                          </div>
                          <Progress
                            className="h-2"
                            color="success"
                            size="sm"
                            value={
                              (director.count /
                                Math.max(
                                  ...stats.directors.map((d) => d.count),
                                )) *
                              100
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-default-500">
                      No director data available
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Genres Chart */}
              <Card>
                <CardHeader className="pb-0">
                  <h3 className="text-md font-bold">Genre Distribution</h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {stats.genres.slice(0, 5).map((genre, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center">
                            <span className="font-medium">{genre.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {genre.count} movies
                            </span>
                            {genre.isWinner > 0 && (
                              <Tooltip
                                content={`${genre.isWinner} winning movies`}
                              >
                                <Trophy className="h-4 w-4 text-warning" />
                              </Tooltip>
                            )}
                          </div>
                        </div>
                        <Progress
                          className="h-2"
                          color={
                            index === 0
                              ? "warning"
                              : index === 1
                                ? "danger"
                                : "secondary"
                          }
                          size="sm"
                          value={
                            (genre.count /
                              Math.max(...stats.genres.map((g) => g.count))) *
                            100
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              {/* Movie Year Chart */}
              <Card>
                <CardHeader className="pb-0">
                  <h3 className="text-md font-bold">Movie Decade Trends</h3>
                </CardHeader>
                <CardBody>
                  {movieMonday.movieSelections.some((m) => m.releaseYear) ? (
                    <div>
                      {/* We're creating a simple decade chart from the movie selections */}
                      {(() => {
                        // Group by decades
                        const decades = {};

                        movieMonday.movieSelections.forEach((movie) => {
                          if (movie.releaseYear) {
                            const decade =
                              Math.floor(movie.releaseYear / 10) * 10;

                            if (!decades[decade]) {
                              decades[decade] = {
                                count: 0,
                                winners: 0,
                                movies: [],
                              };
                            }
                            decades[decade].count++;
                            if (movie.isWinner) decades[decade].winners++;
                            decades[decade].movies.push(movie);
                          }
                        });

                        // Convert to array and sort
                        const decadeArray = Object.entries(decades)
                          .map(([decade, data]) => ({
                            decade: `${decade}s`,
                            ...data,
                          }))
                          .sort(
                            (a, b) => parseInt(a.decade) - parseInt(b.decade),
                          );

                        // Render decade bars
                        return (
                          <div className="space-y-3">
                            {decadeArray.map((decade) => (
                              <div key={decade.decade}>
                                <div className="flex justify-between mb-1">
                                  <div className="flex items-center">
                                    <span className="font-medium">
                                      {decade.decade}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Tooltip
                                      content={
                                        <div>
                                          <p className="font-bold mb-1">
                                            Movies from this decade:
                                          </p>
                                          <ul className="list-disc pl-4">
                                            {decade.movies.map((m) => (
                                              <li
                                                key={m.tmdbMovieId}
                                                className={
                                                  m.isWinner
                                                    ? "text-warning"
                                                    : ""
                                                }
                                              >
                                                {m.title} ({m.releaseYear}){" "}
                                                {m.isWinner && "(Winner)"}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      }
                                    >
                                      <span className="text-sm cursor-help">
                                        {decade.count} movies
                                      </span>
                                    </Tooltip>
                                    {decade.winners > 0 && (
                                      <Trophy className="h-4 w-4 text-warning" />
                                    )}
                                  </div>
                                </div>
                                <Progress
                                  className="h-2"
                                  color="danger"
                                  size="sm"
                                  value={
                                    (decade.count /
                                      Math.max(
                                        ...decadeArray.map((d) => d.count),
                                      )) *
                                    100
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-default-500">
                      No release year data available
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Event Notes (only if present) */}
          {movieMonday.eventDetails?.notes && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold">Event Notes</h3>
                </div>
              </CardHeader>
              <CardBody>
                <p className="whitespace-pre-line">
                  {movieMonday.eventDetails.notes}
                </p>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right Column - Menu Details (takes 1/3 of space on large screens) */}
        <div>
          {/* Food & Drinks Card */}
          <Card className="mb-6">
            <CardHeader className="flex gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Food & Drinks</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {/* Meals */}
                <div>
                  <h4 className="font-medium flex items-center text-default-600 mb-2">
                    <Utensils className="h-4 w-4 mr-2" />
                    Meals
                  </h4>
                  {movieMonday.eventDetails?.meals &&
                  movieMonday.eventDetails.meals.length > 0 ? (
                    <div className="space-y-2">
                      {movieMonday.eventDetails.meals.map((meal, index) => (
                        <div
                          key={index}
                          className="p-2 bg-default-100 rounded-lg"
                        >
                          {meal}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-default-500 text-sm">
                      No meals specified
                    </p>
                  )}
                </div>

                {/* Cocktails */}
                <div>
                  <h4 className="font-medium flex items-center text-default-600 mb-2">
                    <Wine className="h-4 w-4 mr-2" />
                    Cocktails
                  </h4>
                  {movieMonday.eventDetails?.cocktails &&
                  movieMonday.eventDetails.cocktails.length > 0 ? (
                    <div className="space-y-2">
                      {movieMonday.eventDetails.cocktails.map(
                        (cocktail, index) => (
                          <div
                            key={index}
                            className="p-2 bg-default-100 rounded-lg"
                          >
                            {cocktail}
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="text-default-500 text-sm">
                      No cocktails specified
                    </p>
                  )}
                </div>

                {/* Desserts */}
                <div>
                  <h4 className="font-medium flex items-center text-default-600 mb-2">
                    <Cake className="h-4 w-4 mr-2" />
                    Desserts
                  </h4>
                  {movieMonday.eventDetails?.desserts &&
                  movieMonday.eventDetails.desserts.length > 0 ? (
                    <div className="space-y-2">
                      {movieMonday.eventDetails.desserts.map(
                        (dessert, index) => (
                          <div
                            key={index}
                            className="p-2 bg-default-100 rounded-lg"
                          >
                            {dessert}
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="text-default-500 text-sm">
                      No desserts specified
                    </p>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Movie Picker Card */}
          <Card className="mb-6">
            <CardHeader className="flex gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Movie Picker</h3>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                  {movieMonday.picker.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {movieMonday.picker.username}
                  </h3>
                  <p className="text-sm text-default-500">
                    Selected this week's movie options
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Menu Stats Card */}
          <Card>
            <CardHeader className="flex gap-2">
              <Box className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Menu Statistics</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                {/* Popular Meals */}
                {stats.meals && stats.meals.length > 0 && (
                  <div>
                    <h4 className="font-medium text-default-700 mb-2 flex items-center">
                      <Utensils className="h-4 w-4 mr-2" />
                      Popular Meals
                    </h4>
                    <div className="space-y-3">
                      {stats.meals.slice(0, 3).map((meal, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{meal}</span>
                            <span className="text-xs text-default-500">
                              {Math.round(100 - index * 25)}% popularity
                            </span>
                          </div>
                          <Progress
                            className="h-2"
                            color="primary"
                            size="sm"
                            value={100 - index * 25}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Cocktails */}
                {stats.cocktails && stats.cocktails.length > 0 && (
                  <div>
                    <h4 className="font-medium text-default-700 mb-2 flex items-center">
                      <Wine className="h-4 w-4 mr-2" />
                      Popular Cocktails
                    </h4>
                    <div className="space-y-3">
                      {stats.cocktails.slice(0, 3).map((cocktail, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{cocktail}</span>
                            <span className="text-xs text-default-500">
                              {Math.round(100 - index * 25)}% popularity
                            </span>
                          </div>
                          <Progress
                            className="h-2"
                            color="danger"
                            size="sm"
                            value={100 - index * 25}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Desserts */}
                {stats.desserts && stats.desserts.length > 0 && (
                  <div>
                    <h4 className="font-medium text-default-700 mb-2 flex items-center">
                      <Cake className="h-4 w-4 mr-2" />
                      Popular Desserts
                    </h4>
                    <div className="space-y-3">
                      {stats.desserts.slice(0, 3).map((dessert, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{dessert}</span>
                            <span className="text-xs text-default-500">
                              {Math.round(100 - index * 25)}% popularity
                            </span>
                          </div>
                          <Progress
                            className="h-2"
                            color="warning"
                            size="sm"
                            value={100 - index * 25}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Historical Insights Toggle */}
          {data.history && (
            <div className="flex items-center justify-between mt-8">
              <h2 className="text-xl font-bold flex items-center">
                <History className="w-5 h-5 mr-2 text-primary" />
                Historical Insights
              </h2>
              <Button
                color="primary"
                size="sm"
                startContent={
                  showHistorySection ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )
                }
                variant="light"
                onPress={() => setShowHistorySection(!showHistorySection)}
              >
                {showHistorySection ? "Hide History" : "Show History"}
              </Button>
            </div>
          )}
          {/* Historical Comparison Section */}
          {showHistorySection && data.history && renderHistoricalSection()}
        </div>
      </div>
    </div>
  );
};

export default MovieMondayDetail;
