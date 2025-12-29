"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Spinner,
  Chip,
  Pagination,
} from "@heroui/react";
import { X, ArrowLeft, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

import EnhancedMovieDiscoveryCard from "@/components/Discovery/EnhancedMovieDiscoveryCard";
import AddToWatchlistModal from "@/components/Watchlist/AddToWatchlistModal";
import type { Movie } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function VotedButNotPickedPage() {
  const router = useRouter();
  const { isAuthenticated, currentGroupId } = useAuth();
  
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);


  useEffect(() => {
    if (!isAuthenticated || !currentGroupId) {
      router.push("/discover");
      return;
    }

    fetchVotedButNotPicked();
  }, [currentPage, currentGroupId, isAuthenticated]);

  const fetchVotedButNotPicked = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/movie-monday/voted-but-not-picked/${currentGroupId}?page=${currentPage}&limit=24`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch voted movies");
      }

      const data = await response.json();
      setMovies(data.movies || []);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (error) {
      console.error("Error fetching voted but not picked movies:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <Button
          className="w-fit"
          startContent={<ArrowLeft className="w-4 h-4" />}
          variant="light"
          onPress={() => router.push("/discover")}
        >
          Back to Discovery
        </Button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
            <X className="h-6 w-6 text-warning" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Voted But Not Picked</h1>
            <p className="text-default-500">
              Movies your group considered but didn't watch yet
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {!loading && movies.length > 0 && (
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start">
            <Chip color="warning" variant="flat">
              {totalCount} total movies
            </Chip>
            <Chip color="default" variant="flat">
              Page {currentPage} of {totalPages}
            </Chip>
          </div>
        </Card>
      )}

      {/* Movies Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : movies.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
            {movies.map((movie) => {
              const movieData: Movie = {
                id: movie.tmdbMovieId,
                title: movie.title,
                poster_path: movie.posterPath,
                release_date: movie.releaseDate,
                vote_average: movie.voteAverage,
                overview: movie.overview,
                backdrop_path: null,
                genre_ids: [],
                original_language: "",
                original_title: movie.title,
                popularity: 0,
                video: false,
                vote_count: 0,
                adult: false,
              };

              return (
                <div key={movie.tmdbMovieId} className="relative">
                  <EnhancedMovieDiscoveryCard
                    isVotedButNotPicked={true}
                    movie={movieData}
                    showAddButton={true}
                    
                  />
                  <div className="mt-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-default-500">
                      <Calendar className="w-3 h-3" />
                      <span>Last voted: {formatDate(movie.lastVotedDate)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination
                showControls
                color="primary"
                page={currentPage}
                total={totalPages}
                onChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <X className="w-16 h-16 mx-auto mb-4 text-default-300" />
            <h3 className="text-xl font-semibold mb-2">
              No movies here yet
            </h3>
            <p className="text-default-500 mb-4">
              When you vote on movies that don't win, they'll appear here for future consideration
            </p>
            <Button
              color="primary"
              onPress={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </Button>
          </div>
        </Card>
      )}

      
    </div>
  );
}