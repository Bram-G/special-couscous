import React from "react";
import {
  Card,
  CardBody,
  Button,
  Image,
  Chip,
  Spinner,
  Link,
} from "@heroui/react";
import {
  Heart,
  Film,
  Trophy,
  User,
  Globe,
  Flame,
  TrendingUp,
  List,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface WatchlistMovie {
  id: number;
  tmdbMovieId: number;
  title: string;
  posterPath?: string;
}

interface PublicWatchlist {
  id: number;
  name: string;
  description?: string;
  likesCount: number;
  slug: string;
  moviesCount: number;
  owner: {
    username: string;
    id: string | number;
  };
  items?: WatchlistMovie[];
}

interface EnhancedWatchlistSectionProps {
  watchlists: PublicWatchlist[];
  loading: boolean;
}

const EnhancedWatchlistSection: React.FC<EnhancedWatchlistSectionProps> = ({
  watchlists = [],
  loading,
}) => {
  const router = useRouter();

  if (loading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-2">Popular Watchlists</h2>
        <p className="text-default-500 mb-6">
          Discovering curated movie collections from the community...
        </p>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!watchlists || watchlists.length === 0) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-2">Popular Watchlists</h2>
        <Card className="py-12">
          <div className="text-center">
            <List className="h-12 w-12 text-default-300 mx-auto mb-4" />
            <p className="text-xl font-medium mb-2">No watchlists found</p>
            <p className="text-default-500">
              Be the first to create and share a public watchlist!
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Sort watchlists by likes to emphasize competition
  const sortedWatchlists = [...watchlists].sort(
    (a, b) => b.likesCount - a.likesCount,
  );

  return (
    <div className="mb-12">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1 flex items-center">
            <Trophy className="mr-2 h-6 w-6 text-warning" />
            Top Watchlists
          </h2>
          <p className="text-default-500">
            The community's most loved movie collections
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedWatchlists.slice(0, 2).map((watchlist, index) => (
          <Card
            key={watchlist.id}
            isPressable
            className="overflow-hidden h-full min-h-[320px]"
            onPress={() => router.push(`/watchlist/${watchlist.slug}`)}
          >
            {/* Top badge corner banner (fixed position) */}
            {index === 0 && (
              <div className="absolute left-0 top-0 w-38 z-20">
                <div className="bg-warning text-white px-3 py-1 shadow-md">
                  <div className="flex items-center">
                    <Flame className="h-4 w-4 mr-2" />
                    <span>Top Watchlist</span>
                  </div>
                </div>
              </div>
            )}
            {index === 1 && (
              <div className="absolute left-0 top-0 w-36 z-20">
                <div className="bg-primary text-white px-3 py-1 shadow-md">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    <span>Rising Star</span>
                  </div>
                </div>
              </div>
            )}

            <div className="relative h-full">
              {/* Background grid of movie posters */}
              <div className="absolute inset-0 p-4 grid grid-cols-2 gap-2 opacity-30">
                {watchlist.items?.slice(0, 4).map((movie, idx) => (
                  <div
                    key={idx}
                    className="aspect-[2/3] overflow-hidden rounded-md"
                  >
                    <Image
                      removeWrapper
                      alt=""
                      className="w-full h-full object-cover"
                      src={
                        movie.posterPath
                          ? `https://image.tmdb.org/t/p/w200${movie.posterPath}`
                          : "/placeholder-poster.jpg"
                      }
                    />
                  </div>
                ))}
              </div>

              {/* Gradient bottom overlay */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent z-[1]" />

              {/* Bottom content only */}
              <CardBody className="h-full flex flex-col justify-end relative z-[2] py-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold line-clamp-2 mr-3">
                    {watchlist.name}
                  </h3>
                  <div className="flex items-center bg-background/40 backdrop-blur-sm rounded-full px-3 py-1 ml-2 flex-shrink-0">
                    <Heart className="h-4 w-4 text-danger fill-current mr-1" />
                    <span className="font-semibold">
                      {watchlist.likesCount}
                    </span>
                  </div>
                </div>

                {watchlist.description && (
                  <p className="text-default-700 text-sm mb-4 line-clamp-2">
                    {watchlist.description}
                  </p>
                )}

                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-default-500 mr-1" />
                    <span className="text-sm text-default-500 truncate max-w-[120px]">
                      {watchlist.owner?.username || "User"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Chip size="sm" variant="flat">
                      <div className="flex items-center">
                        <Film className="h-3 w-3 mr-1" />
                        <span>{watchlist.moviesCount} movies</span>
                      </div>
                    </Chip>
                    <Chip color="success" size="sm" variant="flat">
                      <div className="flex items-center">
                        <Globe className="h-3 w-3 mr-1" />
                        <span>Public</span>
                      </div>
                    </Chip>
                  </div>
                </div>
              </CardBody>
            </div>
          </Card>
        ))}
      </div>

      {/* Secondary watchlists displayed in a more compact row */}
      {sortedWatchlists.length > 2 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {sortedWatchlists.slice(2, 5).map((watchlist) => (
            <Card
              key={watchlist.id}
              isPressable
              className="overflow-hidden min-h-[120px]"
              onPress={() => router.push(`/watchlist/${watchlist.slug}`)}
            >
              <CardBody className="p-4">
                <div className="flex items-start gap-4">
                  {/* Watchlist "cover" - first movie poster or placeholder */}
                  <div className="w-14 h-20 flex-shrink-0 rounded overflow-hidden">
                    <Image
                      removeWrapper
                      alt=""
                      className="w-full h-full object-cover"
                      src={
                        watchlist.items?.[0]?.posterPath
                          ? `https://image.tmdb.org/t/p/w200${watchlist.items[0].posterPath}`
                          : "/placeholder-poster.jpg"
                      }
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-bold truncate max-w-[160px]">
                        {watchlist.name}
                      </h3>
                      <div className="flex items-center ml-2 flex-shrink-0">
                        <Heart className="h-3 w-3 text-danger fill-current mr-1" />
                        <span className="text-xs">{watchlist.likesCount}</span>
                      </div>
                    </div>

                    <p className="text-default-500 text-xs mb-2 truncate">
                      by {watchlist.owner?.username || "User"}
                    </p>

                    <div className="flex gap-2">
                      <Chip className="text-xs h-6" size="sm" variant="flat">
                        <div className="flex items-center">
                          <Film className="h-3 w-3 mr-1" />
                          <span>{watchlist.moviesCount} movies</span>
                        </div>
                      </Chip>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <Button
          as={Link}
          color="primary"
          endContent={<ExternalLink className="h-4 w-4" />}
          href="/explore-watchlists"
          size="lg"
        >
          Browse All Watchlists
        </Button>
      </div>
    </div>
  );
};

export default EnhancedWatchlistSection;
