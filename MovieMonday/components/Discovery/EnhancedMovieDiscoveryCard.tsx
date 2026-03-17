"use client";

import React, { useState } from "react";
import {
  Card,
  CardBody,
  Chip,
  Tooltip,
  Button,
  useDisclosure,
} from "@heroui/react";
import { Eye, Clock, Star, Calendar, Heart, X as XIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import AddToWatchlistModal from "@/components/Watchlist/AddToWatchlistModal";
import AddToMovieMondayModal from "@/components/AddToMovieMondayModal";

interface Movie {
  id: number;
  title: string;
  poster_path?: string;
  release_date?: string;
  vote_average?: number;
  overview?: string;
  backdrop_path?: string | null;
  genre_ids?: number[];
  original_language?: string;
  original_title?: string;
  popularity?: number;
  video?: boolean;
  vote_count?: number;
  adult?: boolean;
}

interface EnhancedMovieDiscoveryCardProps {
  movie: Movie;
  isWatched?: boolean;
  isVotedButNotPicked?: boolean;
  showAddButton?: boolean;
  onAddClick?: (movie: Movie) => void; // Legacy - kept for compatibility
}

const EnhancedMovieDiscoveryCard: React.FC<EnhancedMovieDiscoveryCardProps> = ({
  movie,
  isWatched = false,
  isVotedButNotPicked = false,
  showAddButton = true,
}) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const {
    isOpen: isWatchlistModalOpen,
    onOpen: onWatchlistModalOpen,
    onClose: onWatchlistModalClose,
  } = useDisclosure();

  const {
    isOpen: isMovieMondayModalOpen,
    onOpen: onMovieMondayModalOpen,
    onClose: onMovieMondayModalClose,
  } = useDisclosure();

  const posterUrl =
    !imageError && movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "/placeholder-movie.png";

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "N/A";

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("[role='button']") ||
      target.closest("a")
    ) {
      return;
    }
    router.push(`/movie/${movie.id}`);
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onWatchlistModalOpen();
  };

  const handleMovieMondayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMovieMondayModalOpen();
  };

  return (
    <>
      <Card
        isPressable
        className="group relative cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl"
        onPress={handleCardClick}
      >
        {/* Status Pills - Top Left */}
        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
          {isWatched && (
            <Chip
              className="bg-success/90 text-white font-semibold"
              size="sm"
              startContent={<Eye className="w-3 h-3" />}
            >
              Watched
            </Chip>
          )}
          {isVotedButNotPicked && !isWatched && (
            <Chip
              className="bg-warning/90 text-white font-semibold"
              size="sm"
              startContent={<XIcon className="w-3 h-3" />}
            >
              Voted
            </Chip>
          )}
        </div>

        {/* Action Buttons - Top Right - ONLY VISIBLE ON HOVER */}
        {showAddButton && !isWatched && (
          <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip content="Add to Watchlist">
              <Button
                isIconOnly
                className="bg-primary text-white"
                size="sm"
                onClick={handleWatchlistClick}
              >
                <Heart className="w-4 h-4" />
              </Button>
            </Tooltip>
            <Tooltip content="Add to Movie Monday">
              <Button
                isIconOnly
                className="bg-secondary text-white"
                size="sm"
                onClick={handleMovieMondayClick}
              >
                <Calendar className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
        )}

        <CardBody className="p-0 overflow-hidden">
          <div className="relative aspect-[2/3] w-full">
            {/* Poster image — dimmed when watched */}
            <img
              alt={movie.title}
              className={`object-cover w-full h-full transition-transform duration-300 group-hover:scale-105 ${
                isWatched ? "brightness-50" : ""
              }`}
              src={posterUrl}
              onError={() => setImageError(true)}
            />

            {/* Watched centre icon overlay */}
            {isWatched && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Eye className="w-10 h-10 text-white/80 drop-shadow-lg" />
              </div>
            )}

            {/* Hover Overlay - ONLY VISIBLE ON HOVER */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <div className="text-white space-y-2">
                <h3 className="font-bold text-base line-clamp-2">
                  {movie.title}
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{movie.vote_average?.toFixed(1) || "N/A"}</span>
                  </div>
                  <span>•</span>
                  <span>{releaseYear}</span>
                </div>
                {movie.overview && (
                  <p className="text-xs text-gray-300 line-clamp-4 mt-2">
                    {movie.overview}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Modals */}
      <AddToWatchlistModal
        isOpen={isWatchlistModalOpen}
        movieDetails={{
          id: movie.id,
          title: movie.title,
          posterPath: movie.poster_path,
        }}
        onClose={onWatchlistModalClose}
      />

      <AddToMovieMondayModal
        isOpen={isMovieMondayModalOpen}
        movie={{
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
        }}
        onClose={onMovieMondayModalClose}
      />
    </>
  );
};

export default EnhancedMovieDiscoveryCard;
