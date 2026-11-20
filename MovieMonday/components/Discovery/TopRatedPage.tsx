"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  Button,
  Spinner,
  Pagination,
  Select,
  SelectItem,
  Chip,
} from "@heroui/react";
import { Star, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import EnhancedMovieDiscoveryCard from "@/components/Discovery/EnhancedMovieDiscoveryCard";
import type { Movie } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { dedupedFetch } from "@/utils/apiClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

const TMDB_PAGES_PER_FETCH = 3; // 3 TMDB pages (20 each) = 60 movies per page
// Keeps obscure films with a handful of perfect votes out of genre results
const MIN_VOTE_COUNT = 300;

const GENRE_OPTIONS = [
  { value: "all", label: "All Genres" },
  { value: "28", label: "Action" },
  { value: "12", label: "Adventure" },
  { value: "16", label: "Animation" },
  { value: "35", label: "Comedy" },
  { value: "80", label: "Crime" },
  { value: "99", label: "Documentary" },
  { value: "18", label: "Drama" },
  { value: "10751", label: "Family" },
  { value: "14", label: "Fantasy" },
  { value: "36", label: "History" },
  { value: "27", label: "Horror" },
  { value: "10402", label: "Music" },
  { value: "9648", label: "Mystery" },
  { value: "10749", label: "Romance" },
  { value: "878", label: "Science Fiction" },
  { value: "10770", label: "TV Movie" },
  { value: "53", label: "Thriller" },
  { value: "10752", label: "War" },
  { value: "37", label: "Western" },
];

// /movie/top_rated ignores with_genres, so genre filtering goes through /discover
const buildTmdbUrl = (tmdbPage: number, genre: string) =>
  genre === "all"
    ? `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&page=${tmdbPage}`
    : `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=vote_average.desc&vote_count.gte=${MIN_VOTE_COUNT}&with_genres=${genre}&page=${tmdbPage}`;

export default function TopRatedPage() {
  const router = useRouter();
  const { isAuthenticated, currentGroupId } = useAuth();

  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [watchedMovies, setWatchedMovies] = useState<Set<number>>(new Set());
  const [votedButNotPicked, setVotedButNotPicked] = useState<Set<number>>(
    new Set(),
  );

  // Ignore responses from requests that were superseded
  const requestIdRef = useRef(0);

  const checkDiscoveryStatus = async (tmdbIds: number[]) => {
    if (!currentGroupId) return;

    try {
      const { ok, data } = await dedupedFetch(
        `${API_BASE_URL}/api/movie-monday/discovery-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            group_id: currentGroupId,
            tmdb_ids: tmdbIds,
          }),
        },
      );

      if (ok && data) {
        setWatchedMovies(new Set(data.watched || []));
        setVotedButNotPicked(
          new Set(data.votedButNotPicked?.map((m: any) => m.tmdbMovieId) || []),
        );
      }
    } catch (error) {
      console.error("Error checking discovery status:", error);
    }
  };

  const fetchTopRatedMovies = useCallback(
    async (page: number, genre: string) => {
      const requestId = ++requestIdRef.current;

      setLoading(true);

      try {
        const startTmdbPage = (page - 1) * TMDB_PAGES_PER_FETCH + 1;
        const tmdbPagePromises = Array.from(
          { length: TMDB_PAGES_PER_FETCH },
          (_, i) =>
            fetch(buildTmdbUrl(startTmdbPage + i, genre)).then((res) =>
              res.ok ? res.json() : { results: [], total_pages: 0 },
            ),
        );

        const responses = await Promise.all(tmdbPagePromises);

        if (requestId !== requestIdRef.current) return;

        // Combine and de-duplicate (TMDB pages can overlap slightly)
        const seen = new Set<number>();
        const allMovies: Movie[] = responses
          .flatMap((data) => data.results || [])
          .filter((m: Movie) => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });

        const tmdbTotalPages = responses[0]?.total_pages || 1;
        const adjustedTotalPages = Math.max(
          1,
          Math.ceil(Math.min(tmdbTotalPages, 500) / TMDB_PAGES_PER_FETCH),
        );

        setMovies(allMovies);
        setTotalPages(adjustedTotalPages);

        if (currentGroupId && allMovies.length > 0) {
          await checkDiscoveryStatus(allMovies.map((m: Movie) => m.id));
        }
      } catch (error) {
        console.error("Error fetching top rated movies:", error);
        if (requestId === requestIdRef.current) setMovies([]);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentGroupId],
  );

  useEffect(() => {
    fetchTopRatedMovies(currentPage, selectedGenre);
  }, [currentPage, selectedGenre, fetchTopRatedMovies]);

  // Genre + page reset in the same event, so only one fetch fires
  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectedGenreName =
    GENRE_OPTIONS.find((g) => g.value === selectedGenre)?.label || "All Genres";

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
          <div className="flex items-start gap-2">
            <div className="w-9 h-9 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center flex-shrink-0 mt-1">
              <Star className="h-4 w-4 text-warning" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Top Rated Movies</h1>
              <p className="text-default-500">
                The highest rated films of all time by viewers
              </p>
            </div>
          </div>

          <Select
            disallowEmptySelection
            className="w-full md:w-64"
            label="Filter by Genre"
            selectedKeys={new Set([selectedGenre])}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0];

              if (value) handleGenreChange(String(value));
            }}
          >
            {GENRE_OPTIONS.map((genre) => (
              <SelectItem key={genre.value}>{genre.label}</SelectItem>
            ))}
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
              {movies.length} movies showing
            </Chip>
            {selectedGenre !== "all" && (
              <Chip color="warning" variant="flat">
                Genre: {selectedGenreName}
              </Chip>
            )}
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
              />
            ))}
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
            <h3 className="text-xl font-semibold mb-2">No movies found</h3>
            <p className="text-default-500">Try adjusting your filters</p>
          </div>
        </Card>
      )}
    </div>
  );
}