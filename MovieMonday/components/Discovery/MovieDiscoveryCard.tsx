"use client";
import React from "react";
import { Card, CardBody, CardFooter, Chip } from "@heroui/react";
import { Star, Eye, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Movie } from "@/types";

interface MovieDiscoveryCardProps {
  movie: Movie;
  showAddButton?: boolean;
  onAddClick?: (movie: Movie) => void;
  isWatched?: boolean;
  isVotedButNotPicked?: boolean;
}

export default function EnhancedMovieDiscoveryCard({
  movie,
  showAddButton = true,
  onAddClick,
  isWatched = false,
  isVotedButNotPicked = false,
}: MovieDiscoveryCardProps) {
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking the add button
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    router.push(`/movie/${movie.id}`);
  };

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder-movie.png";

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "N/A";

  return (
    <Card
      isPressable
      className="h-full w-full group relative overflow-visible"
      shadow="sm"
      onPress={handleCardClick}
    >
      {/* Status Badges - positioned at top */}
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
            startContent={<X className="w-3 h-3" />}
          >
            Voted
          </Chip>
        )}
      </div>

      <CardBody className="p-0 overflow-hidden">
        <div className="relative aspect-[2/3] w-full">
          <img
            alt={movie.title}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            src={posterUrl}
          />
          
          {/* Overlay with movie info on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
            <div className="text-white space-y-1">
              <h3 className="font-bold text-sm line-clamp-2">{movie.title}</h3>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{movie.vote_average?.toFixed(1) || "N/A"}</span>
                </div>
                <span>•</span>
                <span>{releaseYear}</span>
              </div>
              {movie.overview && (
                <p className="text-xs text-gray-300 line-clamp-3 mt-2">
                  {movie.overview}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardBody>

      <CardFooter className="flex flex-col items-start gap-1 p-3">
        <p className="text-sm font-semibold line-clamp-1 w-full">
          {movie.title}
        </p>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1 text-default-500">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs">
              {movie.vote_average?.toFixed(1) || "N/A"}
            </span>
          </div>
          <span className="text-xs text-default-400">{releaseYear}</span>
        </div>

        {showAddButton && onAddClick && !isWatched && (
          <button
            className="mt-2 w-full py-1.5 px-3 bg-primary text-white text-xs rounded-lg hover:bg-primary-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onAddClick(movie);
            }}
          >
            Add to Watchlist
          </button>
        )}
      </CardFooter>
    </Card>
  );
}