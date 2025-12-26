"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Spinner,
  Pagination,
  Select,
  SelectItem,
  Chip,
} from "@heroui/react";
import { Flame, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import EnhancedMovieDiscoveryCard from "@/components/Discovery/EnhancedMovieDiscoveryCard";
import AddToWatchlistModal from "@/components/Watchlist/AddToWatchlistModal";
import type { Movie } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function TrendingPage() {
  const router = useRouter();
  const { isAuthenticated, token, currentGroupId } = useAuth();
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [timeWindow, setTimeWindow] = useState<"day" | "week">("week");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [watchedMovies, setWatchedMovies] = useState<Set<number>>(new Set());
  const [votedButNotPicked, setVotedButNotPicked] = useState<Set<number>>(new Set());

  // Fetch trending movies
  const fetchTrendingMovies = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/movie/${timeWindow}?api_key=${process.env.NEXT_PUBLIC_API_Key}&page=${page}`
      );

      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }

      const data = await response.json();
      setMovies(data.results || []);
      setTotalPages(Math.min(data.total_pages, 500)); // TMDB limits to 500 pages
      
      // Check watched status for these movies
      if (currentGroupId && data.results?.length > 0) {
        await checkDiscoveryStatus(data.results.map((m: Movie) => m.id));
      }
    } catch (error) {
      console.error("Error fetching trending movies:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [timeWindow, currentGroupId]);

  // Check watched status and voted-but-not-picked status
  const checkDiscoveryStatus = async (tmdbIds: number[]) => {
    if (!currentGroupId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/movie-monday/discovery-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: currentGroupId,
          tmdb_ids: tmdbIds,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setWatchedMovies(new Set(data.watched || []));
        setVotedButNotPicked(new Set(data.votedButNotPicked?.map((m: any) => m.tmdbMovieId) || []));
      }
    } catch (error) {
      console.error('Error checking discovery status:', error);
    }
  };

  // Load movies on component mount and when dependencies change
  useEffect(() => {
    fetchTrendingMovies(currentPage);
  }, [currentPage, fetchTrendingMovies]);

  // Reset to page 1 when time window changes
  useEffect(() => {
    setCurrentPage(1);
  }, [timeWindow]);

  const handleAddToWatchlist = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
              <Flame className="h-6 w-6 text-danger" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Trending Movies</h1>
              <p className="text-default-500">
                The hottest movies people are watching right now
              </p>
            </div>
          </div>

          <Select
            className="w-full md:w-48"
            label="Time Window"
            selectedKeys={[timeWindow]}
            onChange={(e) => setTimeWindow(e.target.value as "day" | "week")}
          >
            <SelectItem key="day" value="day">
              Today
            </SelectItem>
            <SelectItem key="week" value="week">
              This Week
            </SelectItem>
          </Select>
        </div>
      </div>

      {/* Stats Bar */}
      {!loading && movies.length > 0 && (
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start">
            <Chip color="primary" variant="flat">
              Page {currentPage} of {totalPages}
            </Chip>
            <Chip color="default" variant="flat">
              {movies.length} movies on this page
            </Chip>
            {watchedMovies.size > 0 && (
              <Chip color="success" variant="flat">
                {watchedMovies.size} already watched
              </Chip>
            )}
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
            {movies.map((movie) => (
              <EnhancedMovieDiscoveryCard
                key={movie.id}
                isVotedButNotPicked={votedButNotPicked.has(movie.id)}
                isWatched={watchedMovies.has(movie.id)}
                movie={movie}
                showAddButton={isAuthenticated}
                onAddClick={handleAddToWatchlist}
              />
            ))}
          </div>

          {/* Pagination */}
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
            <h3 className="text-xl font-semibold mb-2">No movies found</h3>
            <p className="text-default-500">Try adjusting your filters</p>
          </div>
        </Card>
      )}

      {/* Add to Watchlist Modal */}
      {selectedMovie && (
        <AddToWatchlistModal
          isOpen={isModalOpen}
          movie={selectedMovie}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMovie(null);
          }}
        />
      )}
    </div>
  );
}