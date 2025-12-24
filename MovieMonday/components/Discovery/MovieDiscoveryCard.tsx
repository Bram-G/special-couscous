import React, { useState } from "react";
import { Card, Image, Button, Badge, useDisclosure, Tooltip } from "@heroui/react";
import { Heart, Eye, Check } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import AddToWatchlistModal from "@/components/Watchlist/AddToWatchlistModal";
import useWatchlistStatus from "@/hooks/useWatchlistStatus";

interface MovieCardProps {
  movie: {
    id: number;
    title: string;
    poster_path: string;
    release_date?: string;
    vote_average?: number;
    isWatched?: boolean; // ADD THIS
  };
  reason?: {
    type: string;
    text: string;
    detail?: string;
  } | null;
}

const MovieDiscoveryCard: React.FC<MovieCardProps> = ({ movie, reason }) => {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSuccessTooltip, setShowSuccessTooltip] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Use our custom hook to check watchlist status
  const { inWatchlist, inDefaultWatchlist, refresh } = useWatchlistStatus(
    movie.id,
  );

  const handleMovieClick = () => {
    router.push(`/movie/${movie.id}`);
  };

  const getReleaseYear = () => {
    if (!movie.release_date) return "Unknown";

    return new Date(movie.release_date).getFullYear();
  };

  const handleQuickAdd = async () => {
    if (!isAuthenticated || !token) {
      // Redirect to login
      localStorage.setItem("redirectAfterLogin", "/dashboard");
      router.push("/login");

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/watchlists/quick-add`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tmdbMovieId: movie.id,
            title: movie.title,
            posterPath: movie.poster_path,
          }),
        },
      );

      if (response.ok) {
        // Refresh the watchlist status
        refresh();

        // Show success tooltip
        setShowSuccessTooltip(true);
        setTimeout(() => {
          setShowSuccessTooltip(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error adding to watchlist:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="relative group">
          {/* NEW: Watched badge - shows at top right */}
          {movie.isWatched && (
            <Badge
              color="success"
              variant="solid"
              className="absolute top-2 right-2 z-20"
              size="sm"
            >
              Watched ✓
            </Badge>
          )}

          {/* Movie poster */}
          <div
            className="aspect-[2/3] overflow-hidden cursor-pointer"
            onClick={handleMovieClick}
          >
            <Image
              removeWrapper
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              src={
                movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                  : "/placeholder-poster.jpg"
              }
            />

            {/* Info overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              <h3 className="text-white font-medium">{movie.title}</h3>
              <p className="text-white/70 text-sm">{getReleaseYear()}</p>

              {movie.vote_average && (
                <div className="flex items-center mt-1">
                  <div className="bg-primary rounded-full px-2 py-0.5 text-xs font-medium">
                    {movie.vote_average.toFixed(1)}
                  </div>
                </div>
              )}

              {reason && (
                <div className="mt-2">
                  <p className="text-white/80 text-xs">{reason.text}</p>
                  {reason.detail && (
                    <p className="text-white/60 text-xs">{reason.detail}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons overlaid at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-2 flex gap-1">
            <Button
              className="flex-1 bg-background/80 backdrop-blur-sm"
              color="primary"
              size="sm"
              startContent={<Eye className="h-4 w-4" />}
              variant="flat"
              onPress={handleMovieClick}
            >
              View
            </Button>

            {isAuthenticated && (
              <Tooltip
                content={
                  showSuccessTooltip
                    ? "Added to My Watchlist"
                    : inWatchlist
                      ? "In your watchlist"
                      : "Add to watchlist"
                }
                isOpen={showSuccessTooltip}
                placement="top"
              >
                <Button
                  className="flex-1 bg-background/80 backdrop-blur-sm"
                  color={inWatchlist ? "success" : "default"}
                  isLoading={loading}
                  size="sm"
                  startContent={
                    inWatchlist ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Heart className="h-4 w-4" />
                    )
                  }
                  variant="flat"
                  onPress={handleQuickAdd}
                >
                  {inWatchlist ? "Saved" : "Save"}
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
      </Card>

      {/* Advanced watchlist modal for full movie page (not shown on cards) */}
      <AddToWatchlistModal
        isOpen={isOpen}
        movieDetails={{
          id: movie.id,
          title: movie.title,
          posterPath: movie.poster_path,
        }}
        onClose={onClose}
        onSuccess={() => refresh()}
      />
    </>
  );
};

export default MovieDiscoveryCard;