"use client";

import React, { useState } from "react";
import {
  Card,
  CardBody,
  Badge,
  Tooltip,
  Button,
  useDisclosure,
} from "@heroui/react";
import { Eye, X, Star, Plus, Calendar, Heart } from "lucide-react";
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
  onAddClick?: (movie: Movie) => void;
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

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder-movie.png";

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "N/A";

  // FIXED: Simplified to not require event parameter
  const handleCardClick = () => {
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
        {/* Badges - Top Left */}
        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
          {isWatched && (
            <Badge
              className="flex items-center gap-1 bg-success/90 text-white px-2 py-1"
              size="sm"
            >
              <Eye className="w-3 h-3" />
              <span className="text-xs font-semibold">Watched</span>
            </Badge>
          )}
          {isVotedButNotPicked && !isWatched && (
            <Badge
              className="flex items-center gap-1 bg-warning/90 text-white px-2 py-1"
              size="sm"
            >
              <X className="w-3 h-3" />
              <span className="text-xs font-semibold">Voted</span>
            </Badge>
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
            <img
              alt={movie.title}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              src={posterUrl}
              onError={() => setImageError(true)}
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              <h3 className="text-white font-bold text-sm mb-1 line-clamp-2">
                {movie.title}
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-3 h-3 fill-yellow-400" />
                  <span className="font-semibold">
                    {movie.vote_average?.toFixed(1) || "N/A"}
                  </span>
                </div>
                <span className="text-white/70">{releaseYear}</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Modals */}
      <AddToWatchlistModal
        isOpen={isWatchlistModalOpen}
        movie={movie}
        onClose={onWatchlistModalClose}
      />
      <AddToMovieMondayModal
        isOpen={isMovieMondayModalOpen}
        movie={movie}
        onClose={onMovieMondayModalClose}
      />
    </>
  );
};

export default EnhancedMovieDiscoveryCard;