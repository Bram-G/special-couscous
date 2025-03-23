import React, { useState, useEffect, lazy, Suspense } from "react";
import { Image, Card, CardBody, Spinner, Button } from "@heroui/react";
import { Info, Play } from "lucide-react";

// Lazy load the VHS component
const VHSTape = lazy(() => import("../VHS/VHSTape"));

const getProxiedPosterUrl = (posterPath) => {
  if (!posterPath) return "/placeholder-poster.jpg";

  const tmdbUrl = `https://image.tmdb.org/t/p/w500${posterPath}`;
  return `/api/proxy-image?url=${encodeURIComponent(tmdbUrl)}`;
};

const ResponsiveVHSMovieItem = ({
  movie,
  width = 240,
  height = 360,
  enable3D = true,
  onMovieClick,
}) => {
  const [use3D, setUse3D] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder-poster.jpg";

  // Get movie details
  const title = movie.title || "";
  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "";
  const voteAverage = movie.vote_average ? movie.vote_average.toFixed(1) : "";

  // Check if we should use 3D mode
  useEffect(() => {
    if (!enable3D) {
      setUse3D(false);
      setIsLoading(false);
      return;
    }

    // Basic feature detection
    const checkFeatureSupport = () => {
      // Check for WebGL support
      try {
        const canvas = document.createElement("canvas");
        const gl =
          canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

        if (!gl) {
          return false;
        }

        // Check for mobile devices
        const isMobile =
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          );
        const isLowPower =
          isMobile &&
          !(
            /iPad|Macintosh/i.test(navigator.userAgent) &&
            navigator.maxTouchPoints > 1
          );

        if (isLowPower) {
          return false;
        }

        // Check if reduced motion is preferred
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          return false;
        }

        // If all checks pass, enable 3D
        return true;
      } catch (e) {
        console.error("Error during feature detection:", e);
        return false;
      }
    };

    // Use 3D if supported
    const shouldUse3D = checkFeatureSupport();
    setUse3D(shouldUse3D);

    // If not using 3D, we're not loading
    if (!shouldUse3D) {
      setIsLoading(false);
    }
  }, [enable3D]);

  // Handle click
  const handleClick = () => {
    if (onMovieClick) {
      onMovieClick(movie.id);
    }
  };

  // 3D model loaded callback
  const handleLoaded = () => {
    setIsLoading(false);
  };

  // Error callback
  const handleError = () => {
    setUse3D(false);
    setIsLoading(false);
  };

  // Handle hover
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  // Loading state
  if (isLoading && use3D) {
    return (
      <Card
        className="w-full flex justify-center items-center"
        style={{ height }}
      >
        <Spinner size="md" />
      </Card>
    );
  }

  // 2D fallback
  if (!use3D) {
    return (
      <Card
        isPressable
        onPress={handleClick}
        className="group overflow-hidden transition-transform duration-300 hover:scale-105"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CardBody className="p-0 overflow-hidden">
          <div className="relative">
            <Image
              src={posterUrl}
              alt={title}
              className="w-full object-cover transition-transform duration-700 group-hover:scale-110"
              removeWrapper
            />

            {/* Info overlay on hover */}
            <div
              className={`absolute inset-0 bg-black/70 flex flex-col justify-end p-3 transition-opacity duration-300 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
            >
              <h3 className="text-white font-medium">{title}</h3>
              <div className="flex justify-between items-center mt-1">
                <p className="text-white/70 text-sm">{releaseYear}</p>
                {voteAverage && (
                  <div className="bg-primary text-white rounded-full px-2 py-0.5 text-xs font-bold">
                    {voteAverage}
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  className="flex-1"
                  startContent={<Play className="h-3 w-3" />}
                >
                  View
                </Button>
                <Button
                  size="sm"
                  isIconOnly
                  variant="flat"
                  startContent={<Info className="h-4 w-4" />}
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  // 3D VHS version
  return (
    <div
      className="cursor-pointer"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Suspense
        fallback={
          <Card
            className="w-full flex justify-center items-center"
            style={{ height }}
          >
            <Spinner size="md" />
          </Card>
        }
      >
        <div className="flex justify-center transition-transform duration-300 hover:scale-105">
          <VHSTape
            posterUrl={getProxiedPosterUrl(movie.poster_path)}
            width={width}
            height={height}
          />
        </div>

        {/* Title and details below the VHS */}
        <div
          className={`mt-2 p-1 transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-70"
          }`}
        >
          <p className="text-sm font-medium line-clamp-1">{title}</p>
          {(releaseYear || voteAverage) && (
            <div className="flex justify-between items-center mt-0.5">
              <p className="text-xs text-default-500">{releaseYear}</p>
              {voteAverage && (
                <div className="bg-primary/20 text-primary rounded-full px-1.5 py-0.5 text-xs">
                  {voteAverage}
                </div>
              )}
            </div>
          )}
        </div>
      </Suspense>
    </div>
  );
};

export default ResponsiveVHSMovieItem;
