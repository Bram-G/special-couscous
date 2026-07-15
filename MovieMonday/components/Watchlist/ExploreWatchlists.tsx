// MovieMonday/components/Watchlist/ExploreWatchlists.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  Image,
  Spinner,
  Tab,
  Tabs,
  Chip,
  Input,
} from "@heroui/react";
import { Film, Heart, ListIcon, Search, UserCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WatchlistHeroCarousel from "./WatchlistHeroCarousel";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
interface WatchlistCategory {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  likesCount: number;
  moviesCount: number;
  coverImagePath?: string;
  slug: string;
  items: Array<{
    id: number;
    posterPath: string;
  }>;
  User: {
    id: string;
    username: string;
  };
}

const ExploreWatchlists: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [watchlists, setWatchlists] = useState<WatchlistCategory[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [heroWatchlists, setHeroWatchlists] = useState<WatchlistCategory[]>([]);

  const limit = 12; // Number of watchlists per page

  useEffect(() => {
  const fetchHeroWatchlists = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/watchlists/public?sort=popular&limit=5&include_items=true`,
      );
      if (response.ok) {
        const data = await response.json();
        setHeroWatchlists(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching hero watchlists:", error);
    }
  };

  fetchHeroWatchlists();
}, []);

  // Fetch watchlists based on current tab and search
  useEffect(() => {
    fetchWatchlists(true);
  }, [selectedTab]);

  const fetchWatchlists = async (reset = false) => {
    const newOffset = reset ? 0 : offset;

    if (reset) {
      setWatchlists([]);
      setOffset(0);
      setTotal(0);
      setHasMore(false);
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      let url = `${API_BASE_URL}/api/watchlists/public?sort=${selectedTab}&limit=${limit}&offset=${newOffset}&include_items=true`;

      // Add search query if present
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();

        if (reset) {
          setWatchlists(data.categories);
        } else {
          setWatchlists((prev) => [...prev, ...data.categories]);
        }

        setTotal(data.total);
        setHasMore(
          data.categories.length === limit && newOffset + limit < data.total,
        );
        setOffset(newOffset + limit);
      }
    } catch (error) {
      console.error("Error fetching watchlists:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = () => {
    setSearching(true);
    fetchWatchlists(true); // Reset and search
    setSearching(false);
  };

  const handleTabChange = (key: string) => {
    setSelectedTab(key);
  };

  const posterUrl = (path?: string | null) => {
    if (!path) return "/placeholder-poster.jpg";
    if (path.startsWith("http")) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Explore Watchlists</h1>
        <p className="text-default-600">
          Discover curated watchlists from the Movie Monday community
        </p>
      </div>

      <WatchlistHeroCarousel watchlists={heroWatchlists} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Tabs
          aria-label="Watchlist categories"
          selectedKey={selectedTab}
          onSelectionChange={handleTabChange}
        >
          <Tab
            key="popular"
            title={
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span>Popular</span>
              </div>
            }
          />
          <Tab
            key="latest"
            title={
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Latest</span>
              </div>
            }
          />
          <Tab
            key="most_movies"
            title={
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4" />
                <span>Most Movies</span>
              </div>
            }
          />
        </Tabs>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            className="w-full sm:w-60"
            placeholder="Search watchlists..."
            size="sm"
            startContent={<Search className="text-default-300" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            color="primary"
            isLoading={searching}
            size="sm"
            onPress={handleSearch}
          >
            Search
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      ) : watchlists.length === 0 ? (
        <div className="text-center py-12">
          <ListIcon className="mx-auto text-default-300 mb-4" size={48} />
          <p className="text-xl font-medium mb-2">No watchlists found</p>
          <p className="text-default-500 mb-6">
            {searchQuery
              ? `No watchlists matching "${searchQuery}"`
              : "There are no public watchlists to display"}
          </p>
          {searchQuery && (
            <Button
              variant="flat"
              onPress={() => {
                setSearchQuery("");
                fetchWatchlists(true);
              }}
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {watchlists.map((watchlist) => {
                const posters = (watchlist.items || []).slice(0, 5);

                return (
                  <Link
                    key={watchlist.id}
                    legacyBehavior
                    href={`/watchlist/${watchlist.slug}`}
                  >
                    <a className="group block h-full rounded-2xl outline-none transition-transform duration-200 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-primary">
                      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-default-200 bg-content1 shadow-sm transition-shadow duration-200 group-hover:shadow-xl">
                        {/* Poster collage header */}
                        <div className="relative h-40 overflow-hidden bg-default-200">
                          {watchlist.coverImagePath ? (
                            <img
                              src={watchlist.coverImagePath}
                              alt=""
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : posters.length > 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center gap-2 px-3">
                              {posters.map((item, i, arr) => (
                                <img
                                  key={`${watchlist.id}-poster-${i}`}
                                  src={posterUrl(item?.posterPath)}
                                  alt=""
                                  className="h-32 w-auto flex-shrink-0 rounded-md object-cover shadow-md transition-transform duration-300 group-hover:scale-105"
                                  style={{
                                    transform: `rotate(${(i - (arr.length - 1) / 2) * 4}deg)`,
                                    zIndex:
                                      arr.length -
                                      Math.abs(i - (arr.length - 1) / 2),
                                  }}
                                  loading="lazy"
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Film className="h-10 w-10 text-default-400" />
                            </div>
                          )}
                          {/* Fade into card body */}
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-content1 to-transparent" />
                        </div>

                        {/* Body */}
                        <div className="flex flex-1 flex-col gap-3 p-5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-lg font-bold leading-tight text-foreground line-clamp-1">
                              {watchlist.name}
                            </h3>
                            <div className="flex flex-shrink-0 items-center gap-1">
                              <Heart className="h-4 w-4 fill-current text-danger" />
                              <span className="text-sm font-semibold text-foreground">
                                {watchlist.likesCount}
                              </span>
                            </div>
                          </div>

                          {watchlist.description && (
                            <p className="text-sm text-default-500 line-clamp-2">
                              {watchlist.description}
                            </p>
                          )}

                          <div className="mt-auto flex items-center justify-between pt-2">
                            <span className="flex items-center gap-1 text-sm text-default-500">
                              <UserCircle className="h-4 w-4" />
                              {watchlist.User.username}
                            </span>
                            <Chip color="primary" size="sm" variant="flat">
                              {watchlist.moviesCount} movies
                            </Chip>
                          </div>
                        </div>
                      </div>
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                color="primary"
                isLoading={loadingMore}
                variant="flat"
                onPress={() => fetchWatchlists(false)}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExploreWatchlists;
