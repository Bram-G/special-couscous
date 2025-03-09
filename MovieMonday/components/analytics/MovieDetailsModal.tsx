// MovieMonday/components/analytics/MovieDetailsModal.tsx
import React from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody,
  ModalFooter,
  Button,
  Image,
  Chip
} from "@heroui/react";
import { Trophy } from "lucide-react";
import { type MovieMonday } from '@/utils/analyticsUtils';

interface MovieDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  movies: Array<{
    id: number;
    title: string;
    posterPath: string | null;
    releaseYear?: number | null;
    isWinner?: boolean;
  }>;
  filterType: 'actor' | 'director' | 'genre' | 'cocktail' | 'meal';
  filterValue: string;
}

const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  movies,
  filterType,
  filterValue
}) => {
  // Function to handle clicking on a movie poster
  const handleMovieClick = (movieId: number) => {
    window.open(`/movie/${movieId}`, '_blank');
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {title}
              <p className="text-sm text-default-500">
                {movies.length} movie{movies.length !== 1 ? 's' : ''} found
              </p>
            </ModalHeader>
            <ModalBody>
              {movies.length === 0 ? (
                <div className="text-center text-default-500 py-8">
                  No movies found for this {filterType}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {movies.map((movie) => (
                    <div 
                      key={movie.id} 
                      className="flex flex-col cursor-pointer"
                      onClick={() => handleMovieClick(movie.id)}
                    >
                      <div className="relative w-full aspect-[2/3] overflow-hidden rounded-lg mb-2 group">
                        {/* Container with fixed aspect ratio */}
                        <div className="absolute inset-0 bg-default-200">
                          <Image
                            src={movie.posterPath 
                              ? `https://image.tmdb.org/t/p/w300${movie.posterPath}` 
                              : "/placeholder-poster.jpg"
                            }
                            alt={movie.title}
                            className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                            removeWrapper
                          />

                          {/* Fixed size winner badge - positioned in top right corner */}
                          {movie.isWinner && (
                            <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-white rounded-full p-1 w-8 h-8 flex items-center justify-center shadow-md">
                              <Trophy className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Title and year in container with fixed height and truncation */}
                      <div className="h-14 overflow-hidden">
                        <p className="font-medium text-sm truncate max-w-full" title={movie.title}>
                          {movie.title}
                        </p>
                        {movie.releaseYear && (
                          <p className="text-xs text-default-500">
                            {movie.releaseYear}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="primary" variant="light" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default MovieDetailsModal;