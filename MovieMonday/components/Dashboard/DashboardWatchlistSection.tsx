// DashboardWatchlistSection.tsx - Fixed clickable area issue
import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Image,
  Link,
} from "@heroui/react";
import { Plus, Film, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
import { useAuth } from "@/contexts/AuthContext";

interface WatchlistItem {
  id: number;
  posterPath: string;
}

interface WatchlistCategory {
  id: number;
  name: string;
  description?: string;
  items: WatchlistItem[];
  moviesCount: number;
  slug: string;
}

const DashboardWatchlistSection: React.FC = () => {
  const { token } = useAuth();
  const router = useRouter();

  const [watchlists, setWatchlists] = useState<WatchlistCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlists();
  }, [token]);

  const fetchWatchlists = async () => {
    if (!token) return;

    try {
      setLoading(true);
      // Updated API call to include items with their posters
      const response = await fetch(
        `${API_BASE_URL}/api/watchlists/categories?include_items=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();

        // Log the data to see what we're getting
        console.log("Fetched watchlists:", data);

        // Make sure the data structure is correct
        const processedWatchlists = data.map((watchlist) => {
          // Ensure items array exists and has the right properties
          const processedItems = (watchlist.items || []).map((item) => ({
            id: item.id,
            // Convert posterPath property name if needed
            posterPath: item.posterPath || item.poster_path || null,
          }));

          return {
            ...watchlist,
            items: processedItems,
            // Make sure moviesCount is calculated properly
            moviesCount: watchlist.moviesCount || processedItems.length || 0,
          };
        });

        setWatchlists(processedWatchlists);
      } else {
        console.error("Failed to fetch watchlists");
      }
    } catch (error) {
      console.error("Error fetching watchlists:", error);
    } finally {
      setLoading(false);
    }
  };
  // Handle navigation to create a new watchlist
  const handleCreateWatchlist = () => {
    router.push("/watchlist");
  };

  // Handle navigation to view a specific watchlist
  const handleViewWatchlist = (slug: string) => {
    router.push(`/watchlist/${slug}`);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-lg font-bold">My Watchlists</h3>
        </CardHeader>
        <CardBody className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </CardBody>
      </Card>
    );
  }

  // Select up to 4 watchlists to display
  const displayWatchlists = watchlists.slice(0, 4);

  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center px-6 pt-6 pb-4">
        <h3 className="text-xl font-bold">My Watchlists</h3>
        <Button
          as={Link}
          color="primary"
          endContent={<ArrowRight className="h-4 w-4" />}
          href="/watchlist"
          size="sm"
          variant="light"
        >
          View All
        </Button>
      </CardHeader>
      <CardBody className="px-6 pb-6">
        {watchlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Film className="h-16 w-16 text-default-300" />
            <p className="text-default-500 text-lg">
              You don't have any watchlists yet
            </p>
            <Button
              color="primary"
              startContent={<Plus className="h-4 w-4" />}
              onPress={handleCreateWatchlist}
            >
              Create Watchlist
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayWatchlists.map((watchlist) => (
              <Button
                key={watchlist.id}
                as={Link}
                className="p-0 h-auto min-h-64 bg-transparent"
                href={`/watchlist/${watchlist.slug}`}
                onPress={() => handleViewWatchlist(watchlist.slug)}
              >
                <Card
                  isPressable
                  className="w-full h-full hover:shadow-md transition-shadow overflow-hidden"
                >
                  <CardBody className="p-0">
                    {/* Grid of movie posters (2x2) */}
                    <div className="grid grid-cols-2 gap-0.5 bg-default-100">
                      {watchlist.items &&
                        watchlist.items.slice(0, 4).map((item, index) => (
                          <div
                            key={index}
                            className="aspect-[2/3] overflow-hidden"
                          >
                            {item.posterPath ? (
                              <Image
                                removeWrapper
                                alt="Movie poster"
                                className="w-full h-full object-cover"
                                src={`https://image.tmdb.org/t/p/w200${item.posterPath}`}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-default-200">
                                <Film className="h-6 w-6 text-default-400" />
                              </div>
                            )}
                          </div>
                        ))}
                      {/* Add placeholders if less than 4 movies */}
                      {Array.from({
                        length: Math.max(0, 4 - (watchlist.items?.length || 0)),
                      }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="aspect-[2/3] bg-default-200 flex items-center justify-center"
                        >
                          <Film className="h-6 w-6 text-default-300" />
                        </div>
                      ))}
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-base truncate text-left">
                        {watchlist.name}
                      </h4>
                      <p className="text-sm text-default-500 text-left">
                        {watchlist.moviesCount} movies
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </Button>
            ))}

            {/* Add Watchlist button */}
            {watchlists.length < 4 && (
              <Button
                className="p-0 h-auto min-h-64 bg-transparent"
                onPress={handleCreateWatchlist}
              >
                <Card className="w-full h-full border-2 border-dashed border-default-200 hover:border-primary transition-colors">
                  <CardBody className="flex flex-col items-center justify-center py-8">
                    <div className="p-3 bg-default-100 rounded-full mb-3">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-default-600 font-bold">
                      Create Watchlist
                    </p>
                  </CardBody>
                </Card>
              </Button>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default DashboardWatchlistSection;
