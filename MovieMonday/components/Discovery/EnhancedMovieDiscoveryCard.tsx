"use client";

import React, { useState } from "react";
import { Card, CardBody, Badge, Tooltip, Button } from "@heroui/react";
import { Eye, X, Star, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

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
  onAddClick,
}) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder-movie.png";

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "N/A";

  const handleCardClick = () => {
    router.push(`/movie/${movie.id}`);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (onAddClick) {
      onAddClick(movie);
    }
  };

  return (
    <Card
      className="group relative cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl"
      onClick={handleCardClick}
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
        {isVotedButNotPicked && (
          <Badge
            className="flex items-center gap-1 bg-warning/90 text-white px-2 py-1"
            size="sm"
          >
            <X className="w-3 h-3" />
            <span className="text-xs font-semibold">Voted</span>
          </Badge>
        )}
      </div>

      {/* Quick Add Button - Top Right */}
      {showAddButton && !isWatched && onAddClick && (
        <Tooltip content="Add to Watchlist / Movie Monday">
          <Button
            isIconOnly
            className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-white"
            size="sm"
            onClick={handleAddClick}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}

      <CardBody className="p-0 overflow-hidden">
        <div className="relative aspect-[2/3] w-full">
          <img
            alt={movie.title}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            src={posterUrl}
            onError={() => setImageError(true)}
          />

          {/* Hover Overlay - ONLY VISIBLE ON HOVER */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <div className="text-white space-y-2">
              <h3 className="font-bold text-base line-clamp-2">{movie.title}</h3>
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
  );
};

export default EnhancedMovieDiscoveryCard;