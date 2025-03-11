"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
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
} from "@heroui/react";
import {
  Heart,
  Plus,
  Share2,
  Star,
  Calendar,
  PlayCircle,
  Eye,
  Clock,
  Film,
  Users,
  Info,
  Tag,
  Globe,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import MovieMondaySelector from "@/components/MovieMondaySelector";
import EmblaCarouselRec from "@/components/EmblaCarouselRec/EmblaCarouselRec";
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
            />
          </div>
        </Tooltip>
      ))}
    </div>
  );
};

// Analytics Widget Component (placeholder - to be expanded later)
const AnalyticsWidget = ({ movieId }) => {
  return (
    <div className="p-4 rounded-lg border border-default-200">
      <h4 className="text-sm font-medium mb-2">Movie Monday Analytics</h4>
      <p className="text-xs text-default-500">
        This widget will compare actors and directors from this movie with 
        those from winning Movie Monday selections.
      </p>
      <div className="mt-3 h-32 bg-default-100 rounded flex items-center justify-center">
        <CalendarIcon className="w-8 h-8 text-default-300" />
      </div>
    </div>
  );
};

export default function MoviePage() {
  const pathname = usePathname();
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
        const data = await response.json();
        setMovieDetails(data);
        setCredits(data.credits || { cast: [], crew: [] });
        
        // Check watch later status if user is authenticated
        if (token) {
          checkWatchLaterStatus(extractedId);
        }
        
        // Fetch watch providers
        fetchWatchProviders(extractedId);
      } catch (error) {
        console.error("Error fetching movie details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [pathname, token]);

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
          
      setWatchProviders(usProviders.length > 0 ? usProviders : firstRegionProviders);
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
      const response = await fetch(
        `http://localhost:8000/api/movie-monday/watch-later/status/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsInWatchLater(data.isInWatchLater);
      }
    } catch (error) {
      console.error("Error checking watch later status:", error);
    }
  };

  // Toggle watch later status
  const toggleWatchLater = async () => {
    if (!token || !movieId || loadingWatchlist) return;

    setLoadingWatchlist(true);
    try {
      if (isInWatchLater) {
        // Find the watch later entry
        const watchLaterResponse = await fetch(
          "http://localhost:8000/api/movie-monday/watch-later",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!watchLaterResponse.ok) {
          throw new Error(`HTTP error! status: ${watchLaterResponse.status}`);
        }

        const watchLaterData = await watchLaterResponse.json();
        const watchLaterList = Array.isArray(watchLaterData)
          ? watchLaterData
          : [];
        const movieEntry = watchLaterList.find(
          (item) => item.tmdbMovieId === parseInt(movieId)
        );

        if (movieEntry) {
          // Remove from watch later
          const deleteResponse = await fetch(
            `http://localhost:8000/api/movie-monday/watch-later/${movieEntry.id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!deleteResponse.ok) {
            throw new Error(`Failed to delete movie: ${deleteResponse.status}`);
          }
        }
      } else {
        // Add to watch later
        const addResponse = await fetch(
          "http://localhost:8000/api/movie-monday/watch-later",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tmdbMovieId: parseInt(movieId),
              title: movieDetails?.title,
              posterPath: movieDetails?.poster_path,
            }),
          }
        );

        if (!addResponse.ok) {
          throw new Error(`Failed to add movie: ${addResponse.status}`);
        }
      }

      setIsInWatchLater(!isInWatchLater);
    } catch (error) {
      console.error("Error toggling watch later:", error);
    } finally {
      setLoadingWatchlist(false);
    }
  };

  // Handle adding movie to Movie Monday
  const handleAddToMovieMonday = async (movieMondayId) => {
    if (!token || !movieId || !movieDetails?.title) {
      console.error('Missing required data:', { token: !!token, movieId, title: movieDetails?.title });
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:8000/api/movie-monday/add-movie`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          movieMondayId,
          tmdbMovieId: parseInt(movieId),
          title: movieDetails.title,
          posterPath: movieDetails.poster_path
        })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add movie to Movie Monday');
      }
  
      console.log('Movie added successfully:', data);
      return data;
    } catch (error) {
      console.error('Error adding movie to Movie Monday:', error);
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
    return credits.crew.filter(person => person.job === "Director");
  };

  // Get writers from crew
  const getWriters = () => {
    if (!credits || !credits.crew) return [];
    return credits.crew.filter(
      person => person.job === "Screenplay" || 
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
      video => video.type === "Trailer" && video.site === "YouTube"
    );
    
    return trailers.length > 0 ? trailers[0] : null;
  };

  // Handle share button click
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: movieDetails?.title,
          text: `Check out ${movieDetails?.title} on Movie Monday!`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      } catch (error) {
        console.error("Error copying to clipboard:", error);
      }
    }
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
          backgroundImage: backdropUrl ? `url(${backdropUrl})` : 'none',
          backgroundColor: !backdropUrl ? 'rgba(0,0,0,0.8)' : 'transparent'
        }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        
        {/* Content container */}
        <div className="container mx-auto px-4 h-full relative z-10">
          <div className="flex flex-col md:flex-row items-end h-full pb-10">
            {/* Poster */}
            <div className="hidden md:block w-64 flex-shrink-0 -mb-20 shadow-xl rounded-lg overflow-hidden">
              <Image
                src={posterUrl}
                alt={movieDetails.title}
                className="w-full h-auto"
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
                <p className="mt-4 text-xl italic text-white/70">{movieDetails.tagline}</p>
              )}
              
              {/* Action buttons for mobile */}
              <div className="flex md:hidden gap-2 mt-4">
                {isAuthenticated && (
                  <>
                    <Button
                      color={isInWatchLater ? "success" : "primary"}
                      variant="solid"
                      startContent={<Heart className={isInWatchLater ? "fill-current" : ""} />}
                      onPress={toggleWatchLater}
                      isLoading={loadingWatchlist}
                      className="flex-1"
                    >
                      {isInWatchLater ? "In Watchlist" : "Add to Watchlist"}
                    </Button>
                    
                    <Button
                      color="secondary"
                      variant="solid"
                      startContent={<Calendar />}
                      onPress={() => setShowMovieMondayModal(true)}
                      className="flex-1"
                    >
                      Add to Movie Monday
                    </Button>
                  </>
                )}
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
              />
            </div>
            
            {/* Tabs */}
            <Tabs
              aria-label="Movie information"
              selectedKey={activeTab}
              onSelectionChange={setActiveTab}
              className="mb-6"
            >
              <Tab key="cast" title={
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Cast</span>
                </div>
              }>
                <Card>
                  <CardBody>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {credits.cast?.slice(0, 16).map((person) => (
                        <div key={person.id} className="flex flex-col items-center text-center">
                          <Avatar
                            src={
                              person.profile_path
                                ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                                : null
                            }
                            name={person.name}
                            className="w-16 h-16 mb-2"
                          />
                          <p className="font-medium text-sm">{person.name}</p>
                          <p className="text-xs text-default-500">{person.character}</p>
                        </div>
                      ))}
                    </div>
                    {credits.cast?.length > 16 && (
                      <Button variant="light" className="mt-4 mx-auto">
                        View All Cast
                      </Button>
                    )}
                  </CardBody>
                </Card>
              </Tab>
              
              <Tab key="crew" title={
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  <span>Crew</span>
                </div>
              }>
                <Card>
                  <CardBody>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Directors</h3>
                      <div className="flex flex-wrap gap-4">
                        {getDirectors().map((person) => (
                          <div key={person.id} className="flex items-center gap-3">
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
                              <p className="text-xs text-default-500">Director</p>
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
                          <div key={`${person.id}-${person.job}`} className="flex items-center gap-3">
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
                              <p className="text-xs text-default-500">{person.job}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Tab>
              
              <Tab key="details" title={
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span>Details</span>
                </div>
              }>
                <Card>
                  <CardBody className="space-y-4">
                    <div>
                      <h3 className="text-default-500 text-sm">Overview</h3>
                      <p className="mt-1">{movieDetails.overview}</p>
                    </div>
                    
                    <Divider />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-default-500 text-sm">Status</h3>
                        <p className="font-medium">{movieDetails.status}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-default-500 text-sm">Original Language</h3>
                        <p className="font-medium">
                          {movieDetails.original_language?.toUpperCase() || "Unknown"}
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
                          <h3 className="text-default-500 text-sm mb-2">Production Companies</h3>
                          <div className="flex flex-wrap gap-4">
                            {movieDetails.production_companies.map((company) => (
                              <div key={company.id} className="flex flex-col items-center">
                                {company.logo_path ? (
                                  <Image
                                    src={`https://image.tmdb.org/t/p/w92${company.logo_path}`}
                                    alt={company.name}
                                    className="h-12 object-contain mb-1"
                                  />
                                ) : (
                                  <div className="h-12 w-24 bg-default-100 flex items-center justify-center rounded mb-1">
                                    <span className="text-xs text-default-500">No logo</span>
                                  </div>
                                )}
                                <p className="text-xs text-center">{company.name}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardBody>
                </Card>
              </Tab>
              
              <Tab key="genres" title={
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  <span>Genres</span>
                </div>
              }>
                <Card>
                  <CardBody>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {movieDetails.genres?.map((genre) => (
                        <div key={genre.id} className="bg-default-100 p-4 rounded-lg">
                          <h3 className="font-semibold">{genre.name}</h3>
                          <p className="text-sm text-default-500 mt-1">
                            {/* This would ideally come from a genres database with descriptions */}
                            Movies categorized as {genre.name.toLowerCase()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </Tab>
              
              <Tab key="releases" title={
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>Releases</span>
                </div>
              }>
                <Card>
                  <CardBody>
                    {movieDetails.release_dates?.results?.length > 0 ? (
                      <div className="space-y-4">
                        {movieDetails.release_dates.results.map((country) => (
                          <div key={country.iso_3166_1}>
                            <h3 className="font-semibold">{country.iso_3166_1}</h3>
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
                                      {release.type === 3 ? "Theatrical" : 
                                       release.type === 4 ? "Digital" : 
                                       release.type === 5 ? "Physical" : "Release"}
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
                      <p className="text-default-500">No release information available.</p>
                    )}
                  </CardBody>
                </Card>
              </Tab>
            </Tabs>
            
            {/* Recommendations */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Recommendations</h2>
              <EmblaCarouselRec slides={[]} />
            </div>
          </div>
          
          {/* Right Column */}
          <div className="w-full md:w-1/3">
            {/* Action buttons (desktop) */}
            <div className="hidden md:flex flex-col gap-3">
              <div className="flex flex-col gap-3">
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<Star />}
                  className="font-semibold"
                >
                  Sign in to log, rate or review
                </Button>
                
                <Button
                  variant="flat"
                  startContent={<Share2 />}
                  onPress={handleShare}
                >
                  Share
                </Button>
                
                {isAuthenticated && (
                  <>
                    <Button
                      color={isInWatchLater ? "success" : "primary"}
                      variant="solid"
                      startContent={<Heart className={isInWatchLater ? "fill-current" : ""} />}
                      onPress={toggleWatchLater}
                      isLoading={loadingWatchlist}
                    >
                      {isInWatchLater ? "In Watchlist" : "Add to Watchlist"}
                    </Button>
                    
                    <Button
                      color="secondary"
                      variant="solid"
                      startContent={<Calendar />}
                      onPress={() => setShowMovieMondayModal(true)}
                    >
                      Add to Movie Monday
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {/* Ratings card (placeholder for analytics widget) */}
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
                  
                  <div className="mt-6 w-full">
                    <AnalyticsWidget movieId={movieId} />
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
                      <p className="text-sm text-default-500">Original Language</p>
                      <p>{movieDetails.original_language.toUpperCase()}</p>
                    </div>
                  )}
                  
                  {movieDetails.production_countries?.length > 0 && (
                    <div>
                      <p className="text-sm text-default-500">Production Countries</p>
                      <p>
                        {movieDetails.production_countries
                          .map(country => country.name)
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
      
      {/* Movie Monday Selector Modal */}
      <MovieMondaySelector
        isOpen={showMovieMondayModal}
        onOpenChange={() => setShowMovieMondayModal(false)}
        onSelect={handleAddToMovieMonday}
        token={token}
      />
    </div>
  );
}
