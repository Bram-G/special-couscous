// components/Discovery/MovieDiscoveryCard.tsx
import React from "react";
import { Card, Image, Button } from "@heroui/react";
import { Heart, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface MovieCardProps {
  movie: {
    id: number;
    title: string;
    poster_path: string;
    release_date?: string;
    vote_average?: number;
  };
  isInWatchlist?: boolean;
  onAddToWatchlist?: () => void;
  reason?: {
    type: string;
    text: string;
    detail?: string;
  } | null;
}

const MovieDiscoveryCard: React.FC<MovieCardProps> = ({
  movie,
  isInWatchlist = false,
  onAddToWatchlist,
  reason
}) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  const handleMovieClick = () => {
    router.push(`/movie/${movie.id}`);
  };
  
  const getReleaseYear = () => {
    if (!movie.release_date) return "Unknown";
    return new Date(movie.release_date).getFullYear();
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="relative group">
        {/* Movie poster */}
        <div className="aspect-[2/3] overflow-hidden cursor-pointer" onClick={handleMovieClick}>
          <Image
            src={
              movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : '/placeholder-poster.jpg'
            }
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            removeWrapper
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
            size="sm"
            color="primary"
            variant="flat"
            className="flex-1 bg-background/80 backdrop-blur-sm"
            onPress={handleMovieClick}
            startContent={<Eye className="h-4 w-4" />}
          >
            View
          </Button>
          
          {isAuthenticated && (
            <Button
              size="sm"
              color={isInWatchlist ? "success" : "default"}
              variant="flat"
              className="flex-1 bg-background/80 backdrop-blur-sm"
              onPress={onAddToWatchlist}
              startContent={<Heart className={`h-4 w-4 ${isInWatchlist ? "fill-current" : ""}`} />}
            >
              {isInWatchlist ? "Saved" : "Save"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MovieDiscoveryCard;