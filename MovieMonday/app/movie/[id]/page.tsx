"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Button,
  Image,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Tabs,
  Tab,
  Tooltip,
  Divider,
  Avatar,
  Spinner,
  Badge,
  Link,
} from "@heroui/react";
import {
  Heart,
  Calendar,
  Star,
  Clock,
  Film,
  Users,
  Info,
  Tag,
  Globe,
  PlayCircle,
  LinkIcon,
  Trophy,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AddToWatchlistModal from "@/components/Watchlist/AddToWatchlistModal";
import MovieMondaySelector from "@/components/MovieMondaySelector";
import EnhancedRecommendations from "@/components/MoviePage/EnhancedRecommendations";
import ActorAnalyticsModal from "@/components/MoviePage/ActorAnalyticsModal";
import { useDisclosure } from "@heroui/react";
import "./moviePage.css";

// Rating component to mimic the reference image
const RatingBar = ({ rating, count = 0 }) => {
  // Convert rating to percentage (for a 5-star scale)
  const percentage = (rating / 5) * 100;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center w-full">
        <div className="text-4xl font-bold mr-2">{rating.toFixed(1)}</div>
        <div className="flex-1">
          <div className="h-4 bg-default-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="text-xs text-default-500 mt-1">{count} ratings</div>
        </div>
      </div>
    </div>
  );
};

// Where to Watch logos component
const StreamingServices = ({ providers }) => {
  if (!providers || providers.length === 0) {
    return (
      <div className="text-default-500 text-sm py-2">
        No streaming information available
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {providers.map((provider) => (
        <Tooltip key={provider.provider_id} content={provider.provider_name}>
          <div className="w-10 h-10 rounded-md overflow-hidden">
            <Image
              src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
              alt={provider.provider_name}
              className="w-full h-full object-cover"
              removeWrapper
            />
          </div>
        </Tooltip>
      ))}
    </div>
  );
};

// Actor Stats Component
const ActorStatsBadge = ({ actorName, stats }) => {
  if (!stats || !stats.appearances || stats.appearances === 0) {
    return null;
  }

  return (
    <Badge
      content={
        <div className="flex items-center">
          <span className="font-bold text-xs mr-1">{stats.appearances}</span>
          {stats.wins > 0 && <Trophy className="h-3 w-3" />}
        </div>
      }
      color={stats.wins > 0 ? "success" : "primary"}
      placement="top-right"
      size="sm"
    />
  );
};

export default function MoviePage() {
  const pathname = usePathname();
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const [movieId, setMovieId] = useState<string | null>(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [credits, setCredits] = useState({ cast: [], crew: [] });
  const [isInWatchLater, setIsInWatchLater] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMovieMondayModal, setShowMovieMondayModal] = useState(false);
  const [activeTab, setActiveTab] = useState("cast");
  const [watchProviders, setWatchProviders] = useState(null);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  const [actorStats, setActorStats] = useState({});
  const [loadingActorStats, setLoadingActorStats] = useState(false);
  const [watchlistModalOpen, setWatchlistModalOpen] = useState(false);
  const {
    isOpen: isWatchlistModalOpen,
    onOpen: onWatchlistModalOpen,
    onClose: onWatchlistModalClose,
  } = useDisclosure();
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  // State for actor analytics modal
  const [showActorAnalyticsModal, setShowActorAnalyticsModal] = useState(false);
  const [selectedActor, setSelectedActor] = useState(null);

  useEffect(() => {
    // Extract movie ID from pathname
    const extractedId = pathname.split("/").pop();
    setMovieId(extractedId);

    // Fetch movie details
    const fetchMovieDetails = async () => {
      if (!extractedId) return;

      try {
        setLoading(true);
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${extractedId}?append_to_response=credits,videos,release_dates&api_key=${process.env.NEXT_PUBLIC_API_Key}`
        );

        if (!response.ok) {
          throw new Error(`TMDB API error: ${response.status}`);
        }

        const data = await response.json();
        setMovieDetails(data);
        setCredits(data.credits || { cast: [], crew: [] });

        // Fetch watch providers as well
        fetchWatchProviders(extractedId);

        // Only check watchlist status after we have the movie details
        if (isAuthenticated && token) {
          setTimeout(() => {
            // Use setTimeout to ensure this happens after state update
            checkWatchLaterStatus(extractedId);
          }, 100);
        }
      } catch (error) {
        console.error("Error fetching movie details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [pathname, isAuthenticated, token]);

  // Also add an effect to refresh watchlist status when auth changes
  useEffect(() => {
    if (movieId && isAuthenticated && token) {
      checkWatchLaterStatus(movieId);
    }
  }, [isAuthenticated, token]);

  // Fetch actor statistics from your analytics endpoint
  const fetchActorStats = async (castList) => {
    if (!token || !castList.length) return;

    try {
      setLoadingActorStats(true);

      // This would be replaced with a real API endpoint that returns actor statistics
      // For now, we'll simulate it with a timeout
      const actorNames = castList.map((actor) => actor.name);

      // In a real implementation, you would send this list to your backend
      // and get back statistics about these actors from your group's watch history
      const response = await fetch(
        "http://localhost:8000/api/movie-monday/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const movieData = await response.json();

        // Process the data to get actor statistics
        const actorStatsMap = {};

        actorNames.forEach((actorName) => {
          // Initialize stats for all actors with zero values
          actorStatsMap[actorName] = { appearances: 0, wins: 0, movies: [] };

          // Go through all movie Mondays
          movieData.forEach((movieMonday) => {
            // Go through all movie selections
            movieMonday.movieSelections.forEach((movie) => {
              // Check if this actor is in the cast
              const actorInCast =
                movie.cast &&
                movie.cast.some(
                  (castMember) =>
                    castMember.name.toLowerCase() === actorName.toLowerCase()
                );

              if (actorInCast) {
                actorStatsMap[actorName].appearances++;
                if (movie.isWinner) {
                  actorStatsMap[actorName].wins++;
                }

                // Add movie details
                actorStatsMap[actorName].movies.push({
                  id: movie.tmdbMovieId,
                  title: movie.title,
                  posterPath: movie.posterPath,
                  isWinner: movie.isWinner,
                });
              }
            });
          });
        });

        setActorStats(actorStatsMap);
      }
    } catch (error) {
      console.error("Error fetching actor stats:", error);
    } finally {
      setLoadingActorStats(false);
    }
  };

  // Function to fetch watch providers
  const fetchWatchProviders = async (id) => {
    try {
      setLoadingProviders(true);
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${process.env.NEXT_PUBLIC_API_Key}`
      );
      const data = await response.json();

      // Get US providers or fall back to first available region
      const usProviders = data.results?.US?.flatrate || [];
      const firstRegionProviders =
        Object.values(data.results || {}).length > 0
          ? Object.values(data.results)[0]?.flatrate || []
          : [];

      setWatchProviders(
        usProviders.length > 0 ? usProviders : firstRegionProviders
      );
    } catch (error) {
      console.error("Error fetching watch providers:", error);
    } finally {
      setLoadingProviders(false);
    }
  };

  // Check if movie is in watch later list
  const checkWatchLaterStatus = async (id) => {
    if (!token) return;

    try {
      console.log(`Checking watchlist status for movie ID: ${id}`);
      const response = await fetch(
        `http://localhost:8000/api/movie-monday/watch-later/status/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Watch later status response:", data);
        setIsInWatchLater(data.isInWatchLater);
      } else {
        console.error("Error response:", response.status, response.statusText);
        // Don't update state on error to avoid flickering UI
      }
    } catch (error) {
      console.error("Error checking watch later status:", error);
    }
  };

  const checkWatchlistStatus = async (movieId: number) => {
    if (!token) return false;
    
    try {
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
        return data.inWatchlist;
      }
      return false;
    } catch (error) {
      console.error(`Error checking watchlist status for movie ${movieId}:`, error);
      return false;
    }
  };

  // Toggle watch later status
  const toggleWatchlist = async () => {
    if (!token || !movieId || loadingWatchlist) return;
  
    setLoadingWatchlist(true);
    try {
      if (isInWatchlist) {
        // Get default watchlist ID first
        const watchlistResponse = await fetch(
          `http://localhost:8000/api/watchlists/status/${movieId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          }
        );
  
        if (!watchlistResponse.ok) {
          throw new Error(`HTTP error! status: ${watchlistResponse.status}`);
        }
  
        const watchlistData = await watchlistResponse.json();
        
        if (watchlistData.inWatchlist && watchlistData.watchlists.length > 0) {
          // Find the default watchlist item (or just use the first one)
          const defaultEntry = watchlistData.watchlists.find(item => item.isDefault) || 
                               watchlistData.watchlists[0];
          
          // Remove from watchlist using the item ID
          const deleteResponse = await fetch(
            `http://localhost:8000/api/watchlists/categories/${defaultEntry.watchlistId}/movies/${defaultEntry.itemId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              credentials: 'include'
            }
          );
  
          if (!deleteResponse.ok) {
            throw new Error(`Failed to delete movie: ${deleteResponse.status}`);
          }
          
          setIsInWatchlist(false);
        } else {
          console.error('Movie found in watch later status but not in watchlists');
          // Refresh status to be sure
          await checkWatchlistStatus(movieId);
        }
      } else {
        // Use the quick add endpoint for simplicity
        const addResponse = await fetch(
          "http://localhost:8000/api/watchlists/quick-add",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              tmdbMovieId: parseInt(movieId),
              title: movieDetails?.title,
              posterPath: movieDetails?.poster_path
            }),
          }
        );
  
        if (!addResponse.ok) {
          const errorData = await addResponse.json();
          throw new Error(`Failed to add movie: ${addResponse.status} - ${errorData.message || 'Unknown error'}`);
        }
        
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error);
      // Refresh status to be sure
      await checkWatchlistStatus(movieId);
    } finally {
      setLoadingWatchlist(false);
    }
  };

  // Handle login redirection
  const handleLoginRedirect = (action) => {
    // Store the current URL for redirection after login
    localStorage.setItem("redirectAfterLogin", window.location.pathname);

    // Add a flag for which action to perform after login
    localStorage.setItem("postLoginAction", action);

    // Redirect to login page
    router.push("/login");
  };

  // Handle adding movie to Movie Monday
  const handleAddToMovieMonday = async (movieMondayId) => {
    if (!token || !movieId || !movieDetails?.title) {
      console.error("Missing required data:", {
        token: !!token,
        movieId,
        title: movieDetails?.title,
      });
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/movie-monday/add-movie`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            movieMondayId,
            tmdbMovieId: parseInt(movieId),
            title: movieDetails.title,
            posterPath: movieDetails.poster_path,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add movie to Movie Monday");
      }

      console.log("Movie added successfully:", data);
      return data;
    } catch (error) {
      console.error("Error adding movie to Movie Monday:", error);
      throw error;
    }
  };

  // Format runtime to hours and minutes
  const formatRuntime = (minutes) => {
    if (!minutes) return "Unknown";
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get release year
  const getReleaseYear = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).getFullYear();
  };

  // Get directors from crew
  const getDirectors = () => {
    if (!credits || !credits.crew) return [];
    return credits.crew.filter((person) => person.job === "Director");
  };

  // Get writers from crew
  const getWriters = () => {
    if (!credits || !credits.crew) return [];
    return credits.crew.filter(
      (person) =>
        person.job === "Screenplay" ||
        person.job === "Writer" ||
        person.job === "Story"
    );
  };

  // Get trailer
  const getTrailer = () => {
    if (!movieDetails || !movieDetails.videos || !movieDetails.videos.results) {
      return null;
    }

    const trailers = movieDetails.videos.results.filter(
      (video) => video.type === "Trailer" && video.site === "YouTube"
    );

    return trailers.length > 0 ? trailers[0] : null;
  };

  // Handle actor click to show analytics
  const handleActorClick = (actor) => {
    setSelectedActor({
      ...actor,
      stats: actorStats[actor.name] || { appearances: 0, wins: 0, movies: [] },
    });
    setShowActorAnalyticsModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!movieDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
        <p>The requested movie could not be found.</p>
      </div>
    );
  }

  const backdropUrl = movieDetails.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movieDetails.backdrop_path}`
    : null;

  const posterUrl = movieDetails.poster_path
    ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`
    : "/placeholder-poster.jpg";

  return (
    <div className="movie-detail-page w-full">
      {/* Hero Section with Backdrop */}
      <div
        className="relative w-full bg-cover bg-center h-[70vh]"
        style={{
          backgroundImage: backdropUrl ? `url(${backdropUrl})` : "none",
          backgroundColor: !backdropUrl ? "rgba(0,0,0,0.8)" : "transparent",
        }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>

        {/* Content container */}
        <div className="container mx-auto px-4 h-full relative z-10">
          <div className="flex flex-col md:flex-row items-end h-full pb-10">
            {/* Poster - FIXED: Moved inside hero section only */}
            <div className="hidden md:block w-64 flex-shrink-0 shadow-xl rounded-lg overflow-hidden">
              <Image
                src={posterUrl}
                alt={movieDetails.title}
                className="w-full h-auto"
                removeWrapper
              />
            </div>

            {/* Movie info */}
            <div className="md:ml-8 flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {movieDetails.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-white/80">
                {movieDetails.release_date && (
                  <span>{getReleaseYear(movieDetails.release_date)}</span>
                )}

                {movieDetails.runtime && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/80"></span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatRuntime(movieDetails.runtime)}
                    </span>
                  </>
                )}

                {movieDetails.vote_average > 0 && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/80"></span>
                    <span className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-400" />
                      {movieDetails.vote_average.toFixed(1)}
                    </span>
                  </>
                )}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 mt-4">
                {movieDetails.genres?.map((genre) => (
                  <Chip key={genre.id} color="primary" variant="flat" size="sm">
                    {genre.name}
                  </Chip>
                ))}
              </div>

              {/* Tagline */}
              {movieDetails.tagline && (
                <p className="mt-4 text-xl italic text-white/70">
                  {movieDetails.tagline}
                </p>
              )}

              {/* Action buttons for mobile */}
              <div className="flex md:hidden gap-2 mt-4">
                <Button
                  color={isInWatchlist ? "success" : "primary"}
                  variant="solid"
                  startContent={
                    <Heart className={isInWatchlist ? "fill-current" : ""} />
                  }
                  onPress={toggleWatchlist}
                  isLoading={loadingWatchlist}
                >
                  {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
                </Button>

                <Button
                  color="secondary"
                  variant="solid"
                  startContent={<Calendar />}
                  onPress={
                    isAuthenticated
                      ? () => setShowMovieMondayModal(true)
                      : () => handleLoginRedirect("moviemonday")
                  }
                  className="flex-1"
                >
                  {isAuthenticated
                    ? "Add to Movie Monday"
                    : "Sign in to Add to Monday"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column */}
          <div className="w-full md:w-2/3">
            {/* Mobile poster */}
            <div className="block md:hidden w-48 mb-6 mx-auto">
              <Image
                src={posterUrl}
                alt={movieDetails.title}
                className="w-full h-auto rounded-lg shadow-lg"
                removeWrapper
              />
            </div>

            {/* Overview section */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Overview</h2>
              <p>{movieDetails.overview}</p>
            </div>

            {/* Tabs */}
            <Tabs
              aria-label="Movie information"
              selectedKey={activeTab}
              onSelectionChange={setActiveTab}
              className="mb-6"
            >
              <Tab
                key="cast"
                title={
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Cast</span>
                  </div>
                }
              >
                <Card>
                  <CardBody>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {credits.cast?.slice(0, 16).map((person) => (
                        <div
                          key={person.id}
                          className="flex flex-col items-center text-center relative cursor-pointer group"
                          onClick={() => handleActorClick(person)}
                        >
                          <div className="relative">
                            <Avatar
                              src={
                                person.profile_path
                                  ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                                  : null
                              }
                              name={person.name}
                              className="w-16 h-16 mb-2 transition-transform group-hover:scale-105"
                            />

                            {/* Actor Statistics Badge */}
                            {actorStats[person.name] &&
                              actorStats[person.name].appearances > 0 && (
                                <ActorStatsBadge
                                  actorName={person.name}
                                  stats={actorStats[person.name]}
                                />
                              )}
                          </div>

                          <p className="font-medium text-sm group-hover:text-primary transition-colors">
                            {person.name}
                          </p>
                          <p className="text-xs text-default-500">
                            {person.character}
                          </p>

                          {/* Indicator for analytics available */}
                          {actorStats[person.name] &&
                            actorStats[person.name].appearances > 0 && (
                              <div className="text-xs text-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                View stats
                              </div>
                            )}
                        </div>
                      ))}
                    </div>

                    {credits.cast?.length > 16 && (
                      <Button variant="light" className="mt-4 mx-auto">
                        View All Cast
                      </Button>
                    )}

                    <div className="mt-6 text-sm text-center text-default-500">
                      <p>
                        Click on an actor to see their Movie Monday statistics.
                      </p>
                      {loadingActorStats && (
                        <p className="mt-2">Loading actor statistics...</p>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </Tab>

              <Tab
                key="crew"
                title={
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4" />
                    <span>Crew</span>
                  </div>
                }
              >
                <Card>
                  <CardBody>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Directors</h3>
                      <div className="flex flex-wrap gap-4">
                        {getDirectors().map((person) => (
                          <div
                            key={person.id}
                            className="flex items-center gap-3"
                          >
                            <Avatar
                              src={
                                person.profile_path
                                  ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                                  : null
                              }
                              name={person.name}
                              className="w-12 h-12"
                            />
                            <div>
                              <p className="font-medium">{person.name}</p>
                              <p className="text-xs text-default-500">
                                Director
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Divider />

                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-3">Writers</h3>
                      <div className="flex flex-wrap gap-4">
                        {getWriters().map((person) => (
                          <div
                            key={`${person.id}-${person.job}`}
                            className="flex items-center gap-3"
                          >
                            <Avatar
                              src={
                                person.profile_path
                                  ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                                  : null
                              }
                              name={person.name}
                              className="w-12 h-12"
                            />
                            <div>
                              <p className="font-medium">{person.name}</p>
                              <p className="text-xs text-default-500">
                                {person.job}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Tab>

              <Tab
                key="details"
                title={
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    <span>Details</span>
                  </div>
                }
              >
                <Card>
                  <CardBody className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-default-500 text-sm">Status</h3>
                        <p className="font-medium">{movieDetails.status}</p>
                      </div>

                      <div>
                        <h3 className="text-default-500 text-sm">
                          Original Language
                        </h3>
                        <p className="font-medium">
                          {movieDetails.original_language?.toUpperCase() ||
                            "Unknown"}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-default-500 text-sm">Budget</h3>
                        <p className="font-medium">
                          {movieDetails.budget > 0
                            ? `$${movieDetails.budget.toLocaleString()}`
                            : "Not specified"}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-default-500 text-sm">Revenue</h3>
                        <p className="font-medium">
                          {movieDetails.revenue > 0
                            ? `$${movieDetails.revenue.toLocaleString()}`
                            : "Not specified"}
                        </p>
                      </div>
                    </div>

                    {movieDetails.production_companies?.length > 0 && (
                      <>
                        <Divider />
                        <div>
                          <h3 className="text-default-500 text-sm mb-2">
                            Production Companies
                          </h3>
                          <div className="flex flex-wrap gap-4">
                            {movieDetails.production_companies.map(
                              (company) => (
                                <div
                                  key={company.id}
                                  className="flex flex-col items-center"
                                >
                                  {company.logo_path ? (
                                    <Image
                                      src={`https://image.tmdb.org/t/p/w92${company.logo_path}`}
                                      alt={company.name}
                                      className="h-12 object-contain mb-1"
                                      removeWrapper
                                    />
                                  ) : (
                                    <div className="h-12 w-24 bg-default-100 flex items-center justify-center rounded mb-1">
                                      <span className="text-xs text-default-500">
                                        No logo
                                      </span>
                                    </div>
                                  )}
                                  <p className="text-xs text-center">
                                    {company.name}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardBody>
                </Card>
              </Tab>

              <Tab
                key="genres"
                title={
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <span>Genres</span>
                  </div>
                }
              >
                <Card>
                  <CardBody>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {movieDetails.genres?.map((genre) => (
                        <div
                          key={genre.id}
                          className="bg-default-100 p-4 rounded-lg"
                        >
                          <h3 className="font-semibold">{genre.name}</h3>
                          <p className="text-sm text-default-500 mt-1">
                            Movies categorized as {genre.name.toLowerCase()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </Tab>

              <Tab
                key="releases"
                title={
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>Releases</span>
                  </div>
                }
              >
                <Card>
                  <CardBody>
                    {movieDetails.release_dates?.results?.length > 0 ? (
                      <div className="space-y-4">
                        {movieDetails.release_dates.results.map((country) => (
                          <div key={country.iso_3166_1}>
                            <h3 className="font-semibold">
                              {country.iso_3166_1}
                            </h3>
                            <div className="mt-2 space-y-2">
                              {country.release_dates.map((release, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between bg-default-50 p-2 rounded"
                                >
                                  <div>
                                    <p className="text-sm">
                                      {formatDate(release.release_date)}
                                    </p>
                                    <p className="text-xs text-default-500">
                                      {release.type === 3
                                        ? "Theatrical"
                                        : release.type === 4
                                          ? "Digital"
                                          : release.type === 5
                                            ? "Physical"
                                            : "Release"}
                                    </p>
                                  </div>
                                  <div>
                                    <Chip size="sm" color="primary">
                                      {release.certification || "Not Rated"}
                                    </Chip>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-default-500">
                        No release information available.
                      </p>
                    )}
                  </CardBody>
                </Card>
              </Tab>
            </Tabs>

            {/* Recommendations */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Recommendations</h2>
              <EnhancedRecommendations movieId={movieId} />
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full md:w-1/3">
            {/* Action buttons (desktop) */}
            <div className="hidden md:flex flex-col gap-3">
              <Button
                color={isInWatchlist ? "success" : "primary"}
                variant="solid"
                startContent={
                  <Heart className={isInWatchlist ? "fill-current" : ""} />
                }
                onPress={toggleWatchlist}
                isLoading={loadingWatchlist}
              >
                {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
              </Button>

              <Button
                color="secondary"
                variant="solid"
                startContent={<Calendar />}
                onPress={
                  isAuthenticated
                    ? () => setShowMovieMondayModal(true)
                    : () => handleLoginRedirect("moviemonday")
                }
              >
                {isAuthenticated
                  ? "Add to Movie Monday"
                  : "Sign in to Add to Monday"}
              </Button>

              {/* Copy Link Button */}
              <Button
                variant="flat"
                startContent={<LinkIcon />}
                onPress={() => {
                  navigator.clipboard.writeText(window.location.href);
                  // You could add a toast notification here
                }}
              >
                Copy Link
              </Button>
            </div>

            {/* Ratings card with improved analytics content */}
            <Card className="mt-6">
              <CardHeader>
                <h3 className="text-lg font-semibold">Ratings</h3>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col items-center">
                  <div className="text-6xl font-bold mb-2">
                    {movieDetails.vote_average?.toFixed(1) || "N/A"}
                  </div>

                  <div className="text-sm text-default-500 mb-4">
                    {movieDetails.vote_count?.toLocaleString() || 0} ratings
                  </div>

                  <RatingBar
                    rating={(movieDetails.vote_average || 0) / 2}
                    count={movieDetails.vote_count || 0}
                  />

                  {/* Movie Monday Analytics card */}
                  <div className="mt-6 w-full">
                    <Card className="border border-default-200">
                      <CardHeader className="px-4 py-3">
                        <h4 className="text-sm font-medium">
                          Movie Monday Insights
                        </h4>
                      </CardHeader>
                      <CardBody className="px-4 py-3">
                        <div className="space-y-2">
                          {/* Actor insights */}
                          <div>
                            <p className="text-xs font-medium text-default-500">
                              TOP ACTORS
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {credits.cast?.slice(0, 3).map((actor) => {
                                const stats = actorStats[actor.name] || {
                                  appearances: 0,
                                  wins: 0,
                                };
                                return (
                                  <Chip
                                    key={actor.id}
                                    variant="flat"
                                    color={
                                      stats.wins > 0
                                        ? "success"
                                        : stats.appearances > 0
                                          ? "primary"
                                          : "default"
                                    }
                                    size="sm"
                                    onClick={() => handleActorClick(actor)}
                                    className="cursor-pointer"
                                  >
                                    {actor.name}
                                    {stats.appearances > 0 && (
                                      <span className="ml-1 text-xs">
                                        ({stats.appearances}
                                        {stats.wins > 0 ? "🏆" : ""})
                                      </span>
                                    )}
                                  </Chip>
                                );
                              })}
                            </div>
                          </div>

                          {/* Director insights */}
                          <div className="mt-3">
                            <p className="text-xs font-medium text-default-500">
                              DIRECTORS
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {getDirectors().map((director) => {
                                const stats = actorStats[director.name] || {
                                  appearances: 0,
                                  wins: 0,
                                };
                                return (
                                  <Chip
                                    key={director.id}
                                    variant="flat"
                                    color={
                                      stats.wins > 0
                                        ? "success"
                                        : stats.appearances > 0
                                          ? "primary"
                                          : "default"
                                    }
                                    size="sm"
                                  >
                                    {director.name}
                                    {stats.appearances > 0 && (
                                      <span className="ml-1 text-xs">
                                        ({stats.appearances}
                                        {stats.wins > 0 ? "🏆" : ""})
                                      </span>
                                    )}
                                  </Chip>
                                );
                              })}
                            </div>
                          </div>

                          {/* Genre insights */}
                          <div className="mt-3">
                            <p className="text-xs font-medium text-default-500">
                              GENRES
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {movieDetails.genres?.slice(0, 3).map((genre) => (
                                <Chip
                                  key={genre.id}
                                  variant="flat"
                                  color="default"
                                  size="sm"
                                >
                                  {genre.name}
                                </Chip>
                              ))}
                            </div>
                          </div>
                        </div>

                        {isAuthenticated ? (
                          <Link
                            href="/analytics"
                            className="flex items-center justify-end text-xs text-primary mt-4"
                          >
                            View full analytics{" "}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Link>
                        ) : (
                          <Link
                            href="/login"
                            className="flex items-center justify-end text-xs text-primary mt-4"
                          >
                            Sign in to see your analytics{" "}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Link>
                        )}
                      </CardBody>
                    </Card>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Where to Watch card */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Where to Watch</h3>
                </div>
              </CardHeader>
              <CardBody>
                {loadingProviders ? (
                  <div className="flex justify-center py-4">
                    <Spinner size="sm" />
                  </div>
                ) : (
                  <StreamingServices providers={watchProviders} />
                )}

                {/* Trailer button */}
                {getTrailer() && (
                  <Button
                    className="w-full mt-4"
                    color="primary"
                    variant="flat"
                    startContent={<PlayCircle />}
                    as="a"
                    href={`https://www.youtube.com/watch?v=${getTrailer().key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Watch Trailer
                  </Button>
                )}
              </CardBody>
            </Card>

            {/* Additional Info Card */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Additional Info</h3>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-default-500">Original Title</p>
                    <p>{movieDetails.original_title}</p>
                  </div>

                  {movieDetails.release_date && (
                    <div>
                      <p className="text-sm text-default-500">Release Date</p>
                      <p>{formatDate(movieDetails.release_date)}</p>
                    </div>
                  )}

                  {movieDetails.runtime > 0 && (
                    <div>
                      <p className="text-sm text-default-500">Runtime</p>
                      <p>{formatRuntime(movieDetails.runtime)}</p>
                    </div>
                  )}

                  {movieDetails.original_language && (
                    <div>
                      <p className="text-sm text-default-500">
                        Original Language
                      </p>
                      <p>{movieDetails.original_language.toUpperCase()}</p>
                    </div>
                  )}

                  {movieDetails.production_countries?.length > 0 && (
                    <div>
                      <p className="text-sm text-default-500">
                        Production Countries
                      </p>
                      <p>
                        {movieDetails.production_countries
                          .map((country) => country.name)
                          .join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
      {movieDetails && (
        <AddToWatchlistModal
          isOpen={isWatchlistModalOpen}
          onClose={onWatchlistModalClose}
          movieDetails={{
            id: parseInt(movieId),
            title: movieDetails.title,
            posterPath: movieDetails.poster_path,
          }}
          onSuccess={() => {
            setIsInWatchlist(true);
          }}
        />
      )}
      <AddToWatchlistModal
        isOpen={watchlistModalOpen}
        onClose={() => setWatchlistModalOpen(false)}
        movieDetails={{
          id: parseInt(movieId),
          title: movieDetails?.title,
          posterPath: movieDetails?.poster_path,
        }}
        onSuccess={() => {
          setIsInWatchLater(true);
          setWatchlistModalOpen(false);
        }}
      />
      {/* Movie Monday Selector Modal */}
      <MovieMondaySelector
        isOpen={showMovieMondayModal}
        onOpenChange={() => setShowMovieMondayModal(false)}
        onSelect={handleAddToMovieMonday}
        token={token}
      />

      {/* Actor Analytics Modal */}
      {selectedActor && (
        <ActorAnalyticsModal
          isOpen={showActorAnalyticsModal}
          onClose={() => setShowActorAnalyticsModal(false)}
          actor={selectedActor}
        />
      )}
    </div>
  );
}
