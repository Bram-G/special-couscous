// MovieMonday/components/analytics/MovieDetailsModal.tsx
import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Image,
  Chip,
} from "@heroui/react";
import { Trophy } from "lucide-react";

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
  filterType: "actor" | "director" | "genre" | "cocktail" | "meal";
  filterValue: string;
}

const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  movies,
  filterType,
}) => {
  // Function to handle clicking on a movie poster
  const handleMovieClick = (movieId: number) => {
    window.open(`/movie/${movieId}`, "_blank");
  };

  // Function to handle keyboard events for accessibility
  const handleKeyDown = (event: React.KeyboardEvent, movieId: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleMovieClick(movieId);
    }
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {title}
              <p className="text-sm text-default-500">
                {movies.length} movie{movies.length !== 1 ? "s" : ""} found
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
                      aria-label={`View details for ${movie.title}`}
                      className="flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleMovieClick(movie.id)}
                      onKeyDown={(e) => handleKeyDown(e, movie.id)}
                    >
                      <div className="relative w-full aspect-[2/3] overflow-hidden rounded-lg mb-2 group">
                        {/* Container with fixed aspect ratio */}
                        <div className="absolute inset-0 bg-default-200">
                          <Image
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            fallbackSrc="/placeholder-poster.jpg"
                            src={
                              movie.posterPath
                                ? `https://image.tmdb.org/t/p/w342${movie.posterPath}`
                                : "/placeholder-poster.jpg"
                            }
                          />

                          {/* Winner badge overlay */}
                          {movie.isWinner && (
                            <div className="absolute top-2 left-2">
                              <Chip
                                color="warning"
                                size="sm"
                                startContent={<Trophy className="w-3 h-3" />}
                                variant="solid"
                              >
                                Winner
                              </Chip>
                            </div>
                          )}

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <Button color="primary" size="sm" variant="solid">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Movie title and year */}
                      <div className="text-center">
                        <h3 className="text-sm font-medium line-clamp-2 mb-1">
                          {movie.title}
                        </h3>
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
              <Button color="danger" variant="light" onPress={onClose}>
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
