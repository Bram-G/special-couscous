"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Spinner,
  Chip,
  Tabs,
  Tab,
} from "@heroui/react";
import { Sparkles, ArrowLeft, Users, Heart } from "lucide-react";
import { useRouter } from "next/navigation";

import EnhancedMovieDiscoveryCard from "@/components/Discovery/EnhancedMovieDiscoveryCard";
import AddToWatchlistModal from "@/components/Watchlist/AddToWatchlistModal";
import type { Movie } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function RecommendedPage() {
  const router = useRouter();
  const { isAuthenticated, token, currentGroupId } = useAuth();
  
  const [personalRecommendations, setPersonalRecommendations] = useState<Movie[]>([]);
  const [groupRecommendations, setGroupRecommendations] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [watchedMovies, setWatchedMovies] = useState<Set<number>>(new Set());
  const [votedButNotPicked, setVotedButNotPicked] = useState<Set<number>>(new Set());
  const [groupStats, setGroupStats] = useState<any>(null);

  // Fetch personal recommendations (based on watchlist)
  const fetchPersonalRecommendations = useCallback(async () => {
    if (!token) return;

    try {
      // Fetch user's watchlist items
      const watchlistResponse = await fetch(
        `${API_BASE_URL}/api/watchlists/all-items`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!watchlistResponse.ok) {
        throw new Error("Failed to fetch watchlist items");
      }

      const watchlistItems = await watchlistResponse.json();

      if (!watchlistItems || watchlistItems.length === 0) {
        setPersonalRecommendations([]);
        return;
      }

      // Get recommendations from 3 random movies
      const sampleSize = Math.min(3, watchlistItems.length);
      const sampleMovies = [...watchlistItems]
        .sort(() => 0.5 - Math.random())
        .slice(0, sampleSize);

      const recommendationPromises = sampleMovies.map((movie) =>
        fetch(
          `https://api.themoviedb.org/3/movie/${movie.tmdbMovieId}/recommendations?api_key=${process.env.NEXT_PUBLIC_API_Key}`
        )
          .then((res) => (res.ok ? res.json() : { results: [] }))
          .catch(() => ({ results: [] }))
      );

      const results = await Promise.all(recommendationPromises);
      const allRecommendations = results.flatMap((result) => result.results || []);

      // Deduplicate and filter out watchlist movies
      const uniqueRecommendationsMap = new Map();
      allRecommendations.forEach((movie: Movie) => {
        if (movie && movie.id) {
          uniqueRecommendationsMap.set(movie.id, movie);
        }
      });

      const watchlistIds = new Set(watchlistItems.map((m: any) => m.tmdbMovieId));
      const filtered = Array.from(uniqueRecommendationsMap.values())
        .filter((movie: Movie) => !watchlistIds.has(movie.id));

      // Sort by quality
      const sorted = filtered.sort((a: Movie, b: Movie) => {
        const aVoteCount = a.vote_count || 0;
        const bVoteCount = b.vote_count || 0;

        if (aVoteCount > 100 && bVoteCount < 100) return -1;
        if (aVoteCount < 100 && bVoteCount > 100) return 1;

        const aScore = a.vote_average || 0;
        const bScore = b.vote_average || 0;

        if (Math.abs(aScore - bScore) > 1) {
          return bScore - aScore;
        }

        return (b.popularity || 0) - (a.popularity || 0);
      });

      setPersonalRecommendations(sorted.slice(0, 50));
    } catch (error) {
      console.error("Error fetching personal recommendations:", error);
      setPersonalRecommendations([]);
    }
  }, [token]);

  // Fetch group-based recommendations
  const fetchGroupRecommendations = useCallback(async () => {
    if (!currentGroupId) return;

    try {
      // Get group's voting/watching history
      const historyResponse = await fetch(
        `${API_BASE_URL}/api/movie-monday/group-recommendations/${currentGroupId}`
      );

      if (!historyResponse.ok) {
        throw new Error("Failed to fetch group history");
      }

      const historyData = await historyResponse.json();
      setGroupStats(historyData.recommendations);

      if (!historyData.recommendations?.basedOnMovies?.length) {
        setGroupRecommendations([]);
        return;
      }

      // Get recommendations from group's watch history
      const sampleSize = Math.min(5, historyData.recommendations.basedOnMovies.length);
      const sampleMovies = [...historyData.recommendations.basedOnMovies]
        .sort(() => 0.5 - Math.random())
        .slice(0, sampleSize);

      const recommendationPromises = sampleMovies.map((movieId: number) =>
        fetch(
          `https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${process.env.NEXT_PUBLIC_API_Key}`
        )
          .then((res) => (res.ok ? res.json() : { results: [] }))
          .catch(() => ({ results: [] }))
      );

      const results = await Promise.all(recommendationPromises);
      const allRecommendations = results.flatMap((result) => result.results || []);

      // Deduplicate
      const uniqueRecommendationsMap = new Map();
      allRecommendations.forEach((movie: Movie) => {
        if (movie && movie.id) {
          uniqueRecommendationsMap.set(movie.id, movie);
        }
      });

      // Filter out already watched movies
      const alreadyWatched = new Set(historyData.recommendations.basedOnMovies);
      const filtered = Array.from(uniqueRecommendationsMap.values())
        .filter((movie: Movie) => !alreadyWatched.has(movie.id));

      // Sort by quality and genre match
      const topGenres = new Set(historyData.recommendations.topGenres || []);
      const sorted = filtered.sort((a: Movie, b: Movie) => {
        // Boost movies matching top genres
        const aGenreMatch = a.genre_ids?.some((id: number) => 
          topGenres.has(id.toString())
        ) ? 1 : 0;
        const bGenreMatch = b.genre_ids?.some((id: number) => 
          topGenres.has(id.toString())
        ) ? 1 : 0;

        if (aGenreMatch !== bGenreMatch) {
          return bGenreMatch - aGenreMatch;
        }

        return (b.vote_average || 0) - (a.vote_average || 0);
      });

      setGroupRecommendations(sorted.slice(0, 50));
    } catch (error) {
      console.error("Error fetching group recommendations:", error);
      setGroupRecommendations([]);
    }
  }, [currentGroupId]);

  // Check discovery status
  const checkDiscoveryStatus = async (tmdbIds: number[]) => {
    if (!currentGroupId || tmdbIds.length === 0) return;

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

  // Load recommendations on mount
  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      await Promise.all([
        fetchPersonalRecommendations(),
        fetchGroupRecommendations(),
      ]);
      setLoading(false);
    };

    if (isAuthenticated) {
      loadRecommendations();
    } else {
      router.push("/discover");
    }
  }, [isAuthenticated, fetchPersonalRecommendations, fetchGroupRecommendations]);

  // Check discovery status when recommendations load
  useEffect(() => {
    const allMovieIds = [
      ...personalRecommendations.map(m => m.id),
      ...groupRecommendations.map(m => m.id),
    ];
    
    if (allMovieIds.length > 0) {
      checkDiscoveryStatus(allMovieIds);
    }
  }, [personalRecommendations, groupRecommendations]);

  const handleAddToWatchlist = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const currentMovies = activeTab === "personal" 
    ? personalRecommendations 
    : groupRecommendations;

  // Filter out watched movies from display
  const displayMovies = currentMovies.filter(movie => !watchedMovies.has(movie.id));

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

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Recommended For You</h1>
            <p className="text-default-500">
              Personalized suggestions based on your tastes and group history
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs 
          aria-label="Recommendation types"
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
        >
          <Tab
            key="personal"
            title={
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span>Personal</span>
              </div>
            }
          />
          <Tab
            key="group"
            title={
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Group Favorites</span>
              </div>
            }
          />
        </Tabs>
      </div>

      {/* Stats Bar */}
      {!loading && (
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start">
            {activeTab === "personal" ? (
              <>
                <Chip color="secondary" variant="flat">
                  {personalRecommendations.length} personal recommendations
                </Chip>
                {watchedMovies.size > 0 && (
                  <Chip color="success" variant="flat">
                    {watchedMovies.size} already watched (hidden)
                  </Chip>
                )}
              </>
            ) : (
              <>
                <Chip color="secondary" variant="flat">
                  {groupRecommendations.length} group recommendations
                </Chip>
                {groupStats && (
                  <>
                    <Chip color="default" variant="flat">
                      Based on {groupStats.totalMoviesVotedOn} voted movies
                    </Chip>
                    {groupStats.topGenres?.length > 0 && (
                      <Chip color="primary" variant="flat">
                        Top genres: {groupStats.topGenres.join(", ")}
                      </Chip>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </Card>
      )}

      {/* Movies Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : displayMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {displayMovies.map((movie) => (
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
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-default-300" />
            <h3 className="text-xl font-semibold mb-2">
              {activeTab === "personal" 
                ? "Add movies to your watchlist" 
                : "Start watching movies with your group"
              }
            </h3>
            <p className="text-default-500 mb-4">
              {activeTab === "personal"
                ? "We'll generate personalized recommendations based on your watchlist"
                : "Recommendations will appear based on movies your group has voted on"
              }
            </p>
            <Button
              color="primary"
              onPress={() => router.push(activeTab === "personal" ? "/watchlist" : "/dashboard")}
            >
              {activeTab === "personal" ? "Go to Watchlist" : "Go to Dashboard"}
            </Button>
          </div>
        </Card>
      )}

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