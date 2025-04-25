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
  Link2
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// Types (same as before, but I'll skip them for brevity)
// ...

const MovieMondayDetail: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { token, isAuthenticated } = useAuth();

  const [data, setData] = useState<MovieMondayDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

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
        `http://localhost:8000/api/movie-monday/${movieMondayId}/details`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          setUnauthorized(true);
          throw new Error("You don't have permission to view this Movie Monday");
        }
        if (response.status === 404) {
          throw new Error(
            "Movie Monday not found or you do not have access to it"
          );
        }
        throw new Error("Failed to fetch Movie Monday details");
      }

      const data = await response.json();
      setData(data);
    } catch (err) {
      console.error("Error fetching Movie Monday details:", err);
      setError(
        err.message || "An error occurred while loading Movie Monday details"
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

  // Find common elements between movies
  const findConnections = () => {
    if (!data || !data.movieMonday || data.movieMonday.movieSelections.length < 2) return null;
    
    const { movieSelections } = data.movieMonday;
    const connections = {
      actors: [],
      directors: [],
      genres: [],
      years: []
    };
    
    // Collect all actors, directors and genres
    const actorsMap = new Map();
    const directorsMap = new Map();
    const genresMap = new Map();
    const yearsMap = new Map();
    
    // Process each movie
    movieSelections.forEach(movie => {
      // Process actors
      movie.cast?.forEach(actor => {
        const actorKey = `${actor.name}-${actor.actorId}`;
        if (!actorsMap.has(actorKey)) {
          actorsMap.set(actorKey, { 
            id: actor.actorId,
            name: actor.name,
            profilePath: actor.profilePath,
            movies: [] 
          });
        }
        actorsMap.get(actorKey).movies.push({
          id: movie.tmdbMovieId,
          title: movie.title,
          isWinner: movie.isWinner
        });
      });
      
      // Process directors
      movie.crew?.filter(c => c.job === 'Director').forEach(director => {
        const directorKey = `${director.name}-${director.personId}`;
        if (!directorsMap.has(directorKey)) {
          directorsMap.set(directorKey, { 
            id: director.personId,
            name: director.name,
            profilePath: director.profilePath,
            movies: [] 
          });
        }
        directorsMap.get(directorKey).movies.push({
          id: movie.tmdbMovieId,
          title: movie.title,
          isWinner: movie.isWinner
        });
      });
      
      // Process genres
      movie.genres?.forEach(genre => {
        if (!genresMap.has(genre)) {
          genresMap.set(genre, { name: genre, movies: [] });
        }
        genresMap.get(genre).movies.push({
          id: movie.tmdbMovieId,
          title: movie.title,
          isWinner: movie.isWinner
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
          isWinner: movie.isWinner
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

  // Generate interesting facts based on movie monday data
  const generateInterestingFacts = () => {
    if (!data || !data.movieMonday || !data.stats) return [];
    
    const facts = [];
    const { movieMonday, stats } = data;
    const connections = findConnections();
    
    // Theme connections
    if (connections) {
      // Actor connections
      if (connections.actors.length > 0) {
        const topActor = connections.actors.sort((a, b) => b.movies.length - a.movies.length)[0];
        if (topActor.movies.length === movieMonday.movieSelections.length) {
          facts.push({
            text: <>Actor <strong>{topActor.name}</strong> appears in <strong>all {topActor.movies.length} movies</strong> this week!</>,
            icon: <Users className="h-5 w-5 text-primary" />,
            priority: 10
          });
        } else if (topActor.movies.length >= 2) {
          facts.push({
            text: <>Actor <strong>{topActor.name}</strong> appears in <strong>{topActor.movies.length}</strong> of this week's selections</>,
            icon: <Users className="h-5 w-5 text-primary" />,
            priority: 8
          });
        }
      }
      
      // Director connections
      if (connections.directors.length > 0) {
        const topDirector = connections.directors.sort((a, b) => b.movies.length - a.movies.length)[0];
        if (topDirector.movies.length > 1) {
          facts.push({
            text: <>Director <strong>{topDirector.name}</strong> directed <strong>{topDirector.movies.length}</strong> of this week's movies</>,
            icon: <Film className="h-5 w-5 text-success" />,
            priority: 9
          });
        }
      }
      
      // Genre theme
      if (connections.genres.length > 0) {
        const topGenre = connections.genres.sort((a, b) => b.movies.length - a.movies.length)[0];
        if (topGenre.movies.length === movieMonday.movieSelections.length) {
          facts.push({
            text: <>This week has a <strong>{topGenre.name} theme</strong> - all movies share this genre!</>,
            icon: <Zap className="h-5 w-5 text-warning" />,
            priority: 10
          });
        } else if (topGenre.movies.length >= 2) {
          facts.push({
            text: <><strong>{topGenre.movies.length}</strong> movies this week share the <strong>{topGenre.name}</strong> genre</>,
            icon: <Link2 className="h-5 w-5 text-primary" />,
            priority: 7
          });
        }
      }
      
      // Decade theme
      if (connections.years.length > 0) {
        const topDecade = connections.years.sort((a, b) => b.movies.length - a.movies.length)[0];
        if (topDecade.movies.length === movieMonday.movieSelections.length) {
          facts.push({
            text: <>All movies this week are from the <strong>{topDecade.decade}</strong>!</>,
            icon: <Calendar className="h-5 w-5 text-danger" />,
            priority: 9
          });
        } else if (topDecade.movies.length >= 2) {
          facts.push({
            text: <><strong>{topDecade.movies.length}</strong> movies this week are from the <strong>{topDecade.decade}</strong></>,
            icon: <Calendar className="h-5 w-5 text-danger" />,
            priority: 6
          });
        }
      }
    }
    
    // Facts about winning movies
    const winningMovie = movieMonday.movieSelections.find(m => m.isWinner);
    if (winningMovie) {
      // Check if this movie has been in previous selections
      const previousAppearances = winningMovie.previousAppearances || 0;
      if (previousAppearances > 0) {
        facts.push({
          text: <>The movie <strong>{winningMovie.title}</strong> has appeared in <strong>{previousAppearances + 1}</strong> Movie Mondays and finally won!</>,
          icon: <Trophy className="h-5 w-5 text-warning" />,
          priority: 10
        });
      }
    }
    
    // Facts about actors
    if (stats.actors && stats.actors.length > 0) {
      // Actor with most appearances but few wins
      const frequentActor = stats.actors.find(a => a.count > 2 && a.isWinner === 0);
      if (frequentActor) {
        facts.push({
          text: <><strong>{frequentActor.name}</strong> has appeared in <strong>{frequentActor.count}</strong> selections but hasn't won yet!</>,
          icon: <Users className="h-5 w-5 text-primary" />,
          priority: 8
        });
      }
      
      // Actor with multiple wins
      const winningActor = stats.actors.find(a => a.isWinner > 1);
      if (winningActor) {
        facts.push({
          text: <><strong>{winningActor.name}</strong> is a Movie Monday favorite with <strong>{winningActor.isWinner}</strong> winning movies!</>,
          icon: <Star className="h-5 w-5 text-warning" />,
          priority: 9
        });
      }
    }
    
    // Facts about directors
    if (stats.directors && stats.directors.length > 0) {
      const frequentDirector = stats.directors.find(d => d.count > 1);
      if (frequentDirector) {
        facts.push({
          text: <>Director <strong>{frequentDirector.name}</strong> has had <strong>{frequentDirector.count}</strong> films featured in Movie Mondays!</>,
          icon: <Film className="h-5 w-5 text-success" />,
          priority: 7
        });
      }
    }
    
    // Facts about food/drinks
    if (stats.meals && stats.meals.length > 0) {
      const popularMeal = stats.meals[0]; // Assuming sorted by popularity
      facts.push({
        text: <><strong>{popularMeal}</strong> has been the most popular meal choice for Movie Mondays!</>,
        icon: <Utensils className="h-5 w-5 text-primary" />,
        priority: 6
      });
    }
    
    if (stats.cocktails && stats.cocktails.length > 0) {
      const popularCocktail = stats.cocktails[0]; // Assuming sorted by popularity
      facts.push({
        text: <><strong>{popularCocktail}</strong> has been the signature Movie Monday cocktail!</>,
        icon: <Wine className="h-5 w-5 text-danger" />,
        priority: 5
      });
    }
    
    // Sort by priority and take top 3
    return facts.sort((a, b) => b.priority - a.priority).slice(0, 3);
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
        <div className="text-danger text-xl mb-4">You don't have permission to view this Movie Monday</div>
        <Button
          variant="flat"
          color="primary"
          onPress={() => router.push("/dashboard")}
          startContent={<ArrowLeft />}
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
          variant="flat"
          color="primary"
          onPress={() => router.push("/dashboard")}
          startContent={<ArrowLeft />}
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
          variant="flat"
          color="primary"
          onPress={() => router.push("/dashboard")}
          startContent={<ArrowLeft />}
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
    (movie) => movie.isWinner
  );

  return (
    <div className="container mx-auto px-4 pb-16">
      {/* Header with Back button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button
            isIconOnly
            variant="light"
            onPress={() => router.back()}
            className="mr-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Movie Monday</h1>
            <div className="flex items-center text-default-500">
              <Calendar size={16} className="mr-1" />
              <span>{formatDate(movieMonday.date)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-default-500">
            Selected by <span className="font-medium">{movieMonday.picker.username}</span>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {interestingFacts.map((fact, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-background/60 backdrop-blur-sm rounded-lg">
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
                        <h4 className="font-medium text-default-700 mb-2">Common Actors</h4>
                        <div className="flex flex-wrap gap-2">
                          {connections.actors.map(actor => (
                            <Tooltip 
                              key={actor.id}
                              content={
                                <div>
                                  <p className="font-bold mb-1">Appears in:</p>
                                  <ul className="list-disc pl-4">
                                    {actor.movies.map(m => (
                                      <li key={m.id} className={m.isWinner ? "text-warning" : ""}>
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
                                  <span className="font-medium">{actor.name}</span>
                                  <Badge content={actor.movies.length} size="sm" color="primary" placement="top-right">
                                    <div className="w-2 h-5"></div>
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
                        <h4 className="font-medium text-default-700 mb-2">Common Directors</h4>
                        <div className="flex flex-wrap gap-2">
                          {connections.directors.map(director => (
                            <Tooltip 
                              key={director.id}
                              content={
                                <div>
                                  <p className="font-bold mb-1">Directed:</p>
                                  <ul className="list-disc pl-4">
                                    {director.movies.map(m => (
                                      <li key={m.id} className={m.isWinner ? "text-warning" : ""}>
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
                                  <span className="font-medium">{director.name}</span>
                                  <Badge content={director.movies.length} size="sm" color="success" placement="top-right">
                                    <div className="w-2 h-5"></div>
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
                        <h4 className="font-medium text-default-700 mb-2">Common Genres</h4>
                        <div className="flex flex-wrap gap-2">
                          {connections.genres.map((genre, idx) => (
                            <Tooltip 
                              key={idx}
                              content={
                                <div>
                                  <p className="font-bold mb-1">Movies in this genre:</p>
                                  <ul className="list-disc pl-4">
                                    {genre.movies.map(m => (
                                      <li key={m.id} className={m.isWinner ? "text-warning" : ""}>
                                        {m.title} {m.isWinner && "(Winner)"}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              }
                            >
                              <Chip 
                                color={genre.movies.length === movieMonday.movieSelections.length ? "warning" : "default"}
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
                        <h4 className="font-medium text-default-700 mb-2">Common Decades</h4>
                        <div className="flex flex-wrap gap-2">
                          {connections.years.map((decade, idx) => (
                            <Tooltip 
                              key={idx}
                              content={
                                <div>
                                  <p className="font-bold mb-1">Movies from {decade.decade}:</p>
                                  <ul className="list-disc pl-4">
                                    {decade.movies.map(m => (
                                      <li key={m.id} className={m.isWinner ? "text-warning" : ""}>
                                        {m.title} ({m.year}) {m.isWinner && "(Winner)"}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              }
                            >
                              <Chip 
                                color={decade.movies.length === movieMonday.movieSelections.length ? "danger" : "default"}
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
                    <Chip color="warning" variant="flat">Winner</Chip>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Poster */}
                    <div className="sm:w-1/5 flex-shrink-0">
                      <Image
                        src={
                          winningMovie.posterPath
                            ? `https://image.tmdb.org/t/p/w300${winningMovie.posterPath}`
                            : "/placeholder-poster.jpg"
                        }
                        alt={winningMovie.title}
                        className="w-full aspect-[2/3] object-cover rounded-lg shadow-md"
                        removeWrapper
                      />
                    </div>
                    
                    {/* Movie details */}
                    <div className="sm:w-4/5">
                      <h4 className="text-xl font-bold">{winningMovie.title}</h4>
                      
                      <div className="flex flex-wrap gap-3 mt-2">
                        {winningMovie.releaseYear && (
                          <div className="flex items-center text-default-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{winningMovie.releaseYear}</span>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                          {winningMovie.genres?.map((genre, index) => (
                            <Chip key={index} size="sm" variant="flat">{genre}</Chip>
                          ))}
                        </div>
                      </div>
                      
                      <Divider className="my-3" />
                      
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        {/* Directors */}
                        <div>
                          <h5 className="text-sm font-medium text-default-600">Director:</h5>
                          <div>
                            {winningMovie.crew
                              .filter((c) => c.job === "Director")
                              .map((director) => (
                                <div key={director.id} className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{director.name}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                        
                        {/* Cast */}
                        <div>
                          <h5 className="text-sm font-medium text-default-600">Starring:</h5>
                          <div>
                            {winningMovie.cast.slice(0, 3).map((actor) => (
                              <span key={actor.id} className="block">{actor.name}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        as={Link}
                        href={`/movie/${winningMovie.tmdbMovieId}`}
                        color="warning"
                        className="mt-4"
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
                .filter(movie => !movie.isWinner)
                .map((movie) => (
                  <Card key={movie.id}>
                    <CardBody className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Poster - smaller */}
                        <div className="sm:w-1/6 flex-shrink-0">
                          <Image
                            src={
                              movie.posterPath
                                ? `https://image.tmdb.org/t/p/w200${movie.posterPath}`
                                : "/placeholder-poster.jpg"
                            }
                            alt={movie.title}
                            className="w-full aspect-[2/3] object-cover rounded-lg shadow-sm"
                            removeWrapper
                          />
                        </div>
                        
                        {/* Movie details - more space */}
                        <div className="sm:w-5/6">
                          <div className="flex justify-between items-start">
                            <h4 className="text-lg font-bold">{movie.title}</h4>
                            
                            <Button
                              as={Link}
                              href={`/movie/${movie.tmdbMovieId}`}
                              size="sm"
                              variant="flat"
                              color="primary"
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
                              <Chip key={index} size="sm" variant="flat">{genre}</Chip>
                            ))}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          {/* Director */}
                          <div>
                            <h5 className="text-sm font-medium text-default-600">Director:</h5>
                            <div>
                              {movie.crew?.find((c) => c.job === "Director")?.name || "Unknown"}
                            </div>
                          </div>
                          
                          {/* Cast */}
                          <div>
                            <h5 className="text-sm font-medium text-default-600">Starring:</h5>
                            <div>
                              {movie.cast?.slice(0, 2).map((actor, i) => (
                                <span key={actor.id} className="block">{actor.name}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Key Talent - Show actors/directors that appear in multiple movies */}
                        {connections && (
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-2">
                              {connections.actors
                                .filter(conn => conn.movies.some(m => m.id === movie.tmdbMovieId))
                                .map(conn => (
                                  <Tooltip
                                    key={conn.id}
                                    content={`Also appears in ${conn.movies.length - 1} other movie${conn.movies.length > 2 ? 's' : ''} this week`}
                                  >
                                    <Chip
                                      size="sm"
                                      color="primary"
                                      variant="dot"
                                      className="cursor-help"
                                    >
                                      {conn.name}
                                    </Chip>
                                  </Tooltip>
                                ))}
                              
                              {connections.directors
                                .filter(conn => conn.movies.some(m => m.id === movie.tmdbMovieId))
                                .map(conn => (
                                  <Tooltip
                                    key={conn.id}
                                    content={`Also directed ${conn.movies.length - 1} other movie${conn.movies.length > 2 ? 's' : ''} this week`}
                                  >
                                    <Chip
                                      size="sm"
                                      color="success"
                                      variant="dot"
                                      className="cursor-help"
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
                          <span className="text-sm">{actor.count} movies</span>
                          {actor.isWinner > 0 && (
                            <Tooltip content={`${actor.isWinner} winning movies`}>
                              <Trophy className="h-4 w-4 text-warning" />
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      <Progress 
                        value={(actor.count / Math.max(...stats.actors.map(a => a.count))) * 100} 
                        color="primary"
                        size="sm"
                        className="h-2"
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
                            <span className="font-medium">{director.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{director.count} movies</span>
                            {director.isWinner > 0 && (
                              <Tooltip content={`${director.isWinner} winning movies`}>
                                <Trophy className="h-4 w-4 text-warning" />
                              </Tooltip>
                            )}
                          </div>
                        </div>
                        <Progress 
                          value={(director.count / Math.max(...stats.directors.map(d => d.count))) * 100} 
                          color="success"
                          size="sm"
                          className="h-2"
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
                          <span className="text-sm">{genre.count} movies</span>
                          {genre.isWinner > 0 && (
                            <Tooltip content={`${genre.isWinner} winning movies`}>
                              <Trophy className="h-4 w-4 text-warning" />
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      <Progress 
                        value={(genre.count / Math.max(...stats.genres.map(g => g.count))) * 100} 
                        color={index === 0 ? "warning" : index === 1 ? "danger" : "secondary"}
                        size="sm"
                        className="h-2"
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
                {movieMonday.movieSelections.some(m => m.releaseYear) ? (
                  <div>
                    {/* We're creating a simple decade chart from the movie selections */}
                    {(() => {
                      // Group by decades
                      const decades = {};
                      movieMonday.movieSelections.forEach(movie => {
                        if (movie.releaseYear) {
                          const decade = Math.floor(movie.releaseYear / 10) * 10;
                          if (!decades[decade]) {
                            decades[decade] = {
                              count: 0,
                              winners: 0,
                              movies: []
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
                          ...data
                        }))
                        .sort((a, b) => parseInt(a.decade) - parseInt(b.decade));
                        
                      // Render decade bars
                      return (
                        <div className="space-y-3">
                          {decadeArray.map(decade => (
                            <div key={decade.decade}>
                              <div className="flex justify-between mb-1">
                                <div className="flex items-center">
                                  <span className="font-medium">{decade.decade}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Tooltip
                                    content={
                                      <div>
                                        <p className="font-bold mb-1">Movies from this decade:</p>
                                        <ul className="list-disc pl-4">
                                          {decade.movies.map(m => (
                                            <li key={m.tmdbMovieId} className={m.isWinner ? "text-warning" : ""}>
                                              {m.title} ({m.releaseYear}) {m.isWinner && "(Winner)"}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    }
                                  >
                                    <span className="text-sm cursor-help">{decade.count} movies</span>
                                  </Tooltip>
                                  {decade.winners > 0 && (
                                    <Trophy className="h-4 w-4 text-warning" />
                                  )}
                                </div>
                              </div>
                              <Progress 
                                value={(decade.count / Math.max(...decadeArray.map(d => d.count))) * 100} 
                                color="danger"
                                size="sm"
                                className="h-2"
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
              <p className="whitespace-pre-line">{movieMonday.eventDetails.notes}</p>
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
                {stats.meals && stats.meals.length > 0 ? (
                  <div className="space-y-2">
                    {stats.meals.map((meal, index) => (
                      <div key={index} className="p-2 bg-default-100 rounded-lg">
                        {meal}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-default-500 text-sm">No meals specified</p>
                )}
              </div>
              
              {/* Cocktails */}
              <div>
                <h4 className="font-medium flex items-center text-default-600 mb-2">
                  <Wine className="h-4 w-4 mr-2" />
                  Cocktails
                </h4>
                {stats.cocktails && stats.cocktails.length > 0 ? (
                  <div className="space-y-2">
                    {stats.cocktails.map((cocktail, index) => (
                      <div key={index} className="p-2 bg-default-100 rounded-lg">
                        {cocktail}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-default-500 text-sm">No cocktails specified</p>
                )}
              </div>
              
              {/* Desserts */}
              <div>
                <h4 className="font-medium flex items-center text-default-600 mb-2">
                  <Cake className="h-4 w-4 mr-2" />
                  Desserts
                </h4>
                {stats.desserts && stats.desserts.length > 0 ? (
                  <div className="space-y-2">
                    {stats.desserts.map((dessert, index) => (
                      <div key={index} className="p-2 bg-default-100 rounded-lg">
                        {dessert}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-default-500 text-sm">No desserts specified</p>
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
                            {Math.round(100 - (index * 25))}% popularity
                          </span>
                        </div>
                        <Progress 
                          value={100 - (index * 25)} 
                          color="primary"
                          size="sm"
                          className="h-2"
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
                            {Math.round(100 - (index * 25))}% popularity
                          </span>
                        </div>
                        <Progress 
                          value={100 - (index * 25)} 
                          color="danger"
                          size="sm"
                          className="h-2"
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
                            {Math.round(100 - (index * 25))}% popularity
                          </span>
                        </div>
                        <Progress 
                          value={100 - (index * 25)} 
                          color="warning"
                          size="sm"
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  </div>
);
};

export default MovieMondayDetail;