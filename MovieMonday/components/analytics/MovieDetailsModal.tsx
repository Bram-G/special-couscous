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
  Spinner,
  Tooltip,
} from "@heroui/react";
import { Trophy } from "lucide-react";

import type {
  DrilldownMovie,
  DrilldownOutcome,
} from "@/hooks/useAnalyticsDrilldown";

interface MovieDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  movies: DrilldownMovie[];
  outcome?: DrilldownOutcome;
  loading?: boolean;
}

function countLabel(movie: DrilldownMovie, outcome: DrilldownOutcome) {
  if (outcome === "lost") {
    return `Picked and lost ${movie.count} times`;
  }
  if (outcome === "won") {
    return `Won ${movie.count} times`;
  }

  return `Picked ${movie.count} times · won ${movie.wins}`;
}

const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  movies,
  outcome = "won",
  loading = false,
}) => {
  const totalPicks = movies.reduce((sum, m) => sum + m.count, 0);

  const openMovie = (tmdbMovieId: number) => {
    window.open(`/movie/${tmdbMovieId}`, "_blank");
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose}>
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {title}
              {!loading && (
                <p className="text-sm font-normal text-default-500">
                  {movies.length} movie{movies.length !== 1 ? "s" : ""}
                  {totalPicks > movies.length &&
                    ` · ${totalPicks} ${outcome === "lost" ? "losses" : "picks"} total`}
                </p>
              )}
            </ModalHeader>
            <ModalBody>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : movies.length === 0 ? (
                <div className="py-8 text-center text-default-500">
                  No movies found
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {movies.map((movie) => {
                    const isWinner = movie.wins > 0;

                    return (
                      <div
                        key={movie.tmdbMovieId}
                        aria-label={`View details for ${movie.title}`}
                        className="flex cursor-pointer flex-col rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        role="button"
                        tabIndex={0}
                        onClick={() => openMovie(movie.tmdbMovieId)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openMovie(movie.tmdbMovieId);
                          }
                        }}
                      >
                        <div className="group relative mb-2 aspect-[2/3] w-full overflow-hidden rounded-lg bg-default-200">
                          <Image
                            removeWrapper
                            alt={movie.title}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                            fallbackSrc="/placeholder-poster.jpg"
                            src={
                              movie.posterPath
                                ? `https://image.tmdb.org/t/p/w342${movie.posterPath}`
                                : "/placeholder-poster.jpg"
                            }
                          />

                          {/* HeroUI <Image> sets `relative z-10` on the <img>,
                              so every overlay must sit at z-20+ to paint above it. */}

                          {/* Winner ring — inset so it's never clipped or hidden */}
                          {isWinner && outcome !== "lost" && (
                            <div className="pointer-events-none absolute inset-0 z-20 rounded-lg ring-2 ring-inset ring-warning" />
                          )}

                          {isWinner && outcome !== "lost" && (
                            <div className="absolute left-2 top-2 z-30">
                              <Chip
                                color="warning"
                                size="sm"
                                startContent={<Trophy className="h-3 w-3" />}
                                variant="solid"
                              >
                                Winner
                              </Chip>
                            </div>
                          )}

                          {movie.count > 1 && (
                            <Tooltip content={countLabel(movie, outcome)}>
                              <div className="absolute right-2 top-2 z-30 rounded-full bg-black/75 px-2 py-0.5 text-xs font-bold text-white shadow-md backdrop-blur-sm">
                                ×{movie.count}
                              </div>
                            </Tooltip>
                          )}

                          {/* Hover overlay */}
                          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                              View Details
                            </span>
                          </div>
                        </div>

                        <div className="text-center">
                          <h3 className="mb-1 line-clamp-2 text-sm font-medium">
                            {movie.title}
                          </h3>
                          {movie.releaseYear && (
                            <p className="text-xs text-default-500">
                              {movie.releaseYear}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={close}>
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