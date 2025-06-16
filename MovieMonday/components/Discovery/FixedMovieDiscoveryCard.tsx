import React, { useState } from "react";
import { Card, Image, Button, useDisclosure, Tooltip } from "@heroui/react";
import { Heart, Plus, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AddToWatchlistModal from "@/components/Watchlist/AddToWatchlistModal";
import useWatchlistStatus from "@/hooks/useWatchlistStatus";

interface MovieCardProps {
  movie: {
    id: number;
    title: string;
    poster_path?: string;
    release_date?: string;
    vote_average?: number;
  };
  reason?: {
    type: string;
    text: string;
    detail?: string;
  } | null;
  compact?: boolean; // New prop to enable compact mode
}

const FixedMovieDiscoveryCard: React.FC<MovieCardProps> = ({
  movie,
  reason,
  compact = false // Default to false for backward compatibility
}) => {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSuccessTooltip, setShowSuccessTooltip] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Use our custom hook to check watchlist status
  const { inWatchlist, refresh } = useWatchlistStatus(movie.id);
  
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
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      router.push('/login');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:8000/api/watchlists/quick-add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tmdbMovieId: movie.id,
          title: movie.title,
          posterPath: movie.poster_path
        })
      });
      
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
      console.error('Error adding to watchlist:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Card className="overflow-hidden h-full group">
        <div className="relative h-full">
          {/* Movie poster - Full height */}
          <div className="h-full overflow-hidden cursor-pointer" onClick={handleMovieClick}>
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
            
            {/* Gradient overlay for bottom third - Always present but only visible on hover */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 z-10">
              {/* Movie title and year */}
              <h3 className="text-white font-medium truncate">{movie.title}</h3>
              <div className="flex items-center justify-between">
                <p className="text-white/80 text-sm">{getReleaseYear()}</p>
                
                {movie.vote_average && (
                  <div className="bg-primary rounded-full px-2 py-0.5 text-xs font-medium">
                    {movie.vote_average.toFixed(1)}
                  </div>
                )}
              </div>
              
              {/* Action buttons - Different layouts based on compact mode */}
              {compact ? (
                // Compact mode: Icon-only buttons that are larger and easier to tap
                <div className="flex justify-center items-center mt-2 gap-3">
                  {/* Quick Save button - Icon only */}
                  <Tooltip 
                    content={showSuccessTooltip ? "Added to Watchlist" : (inWatchlist ? "In your watchlist" : "Add to watchlist")}
                    placement="top"
                    isOpen={showSuccessTooltip}
                  >
                    <Button
                      isIconOnly
                      size="md" // Larger size for better touch targets
                      color={inWatchlist ? "success" : "primary"}
                      variant="solid"
                      className="bg-primary/90 min-w-10 h-10" // Ensure consistent size
                      onPress={handleQuickAdd}
                      isLoading={loading}
                    >
                      {inWatchlist ? <Check className="h-5 w-5" /> : <Heart className="h-5 w-5" />}
                    </Button>
                  </Tooltip>
                  
                  {/* Add to specific watchlist button - Icon only */}
                  {isAuthenticated && (
                    <Tooltip content="Add to specific watchlist" placement="top">
                      <Button
                        isIconOnly
                        size="md"
                        color="default"
                        variant="solid"
                        className="bg-default/80 min-w-10 h-10"
                        onPress={onOpen}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </Tooltip>
                  )}
                </div>
              ) : (
                // Normal mode: Buttons with text (original layout)
                <div className="flex justify-between items-center mt-2 gap-2">
                  {/* Quick Save button */}
                  <Tooltip 
                    content={showSuccessTooltip ? "Added to Watchlist" : (inWatchlist ? "In your watchlist" : "Add to watchlist")}
                    placement="top"
                    isOpen={showSuccessTooltip}
                  >
                    <Button
                      size="sm"
                      color={inWatchlist ? "success" : "primary"}
                      variant="solid"
                      className="flex-1 bg-primary/90"
                      onPress={handleQuickAdd}
                      isLoading={loading}
                      startContent={inWatchlist ? <Check className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
                    >
                      {inWatchlist ? "Saved" : "Save"}
                    </Button>
                  </Tooltip>
                  
                  {/* Add to specific watchlist button */}
                  {isAuthenticated && (
                    <Button
                      size="sm"
                      color="default"
                      variant="solid"
                      className="flex-1 bg-default/80"
                      onPress={onOpen}
                      startContent={<Plus className="h-4 w-4" />}
                    >
                      Add to...
                    </Button>
                  )}
                </div>
              )}
              
              {/* Recommendation reason if provided */}
              {reason && (
                <div className="mt-2 bg-black/30 px-2 py-1 rounded text-xs">
                  <p className="text-white/90">{reason.text}</p>
                  {reason.detail && (
                    <p className="text-white/70 text-xs">{reason.detail}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Advanced watchlist modal */}
      <AddToWatchlistModal 
        isOpen={isOpen}
        onClose={onClose}
        movieDetails={{
          id: movie.id,
          title: movie.title,
          posterPath: movie.poster_path
        }}
        onSuccess={() => refresh()}
      />
    </>
  );
};

export default FixedMovieDiscoveryCard;