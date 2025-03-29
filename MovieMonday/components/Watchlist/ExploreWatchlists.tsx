// MovieMonday/components/Watchlist/ExploreWatchlists.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  CardBody, 
  Image, 
  Spinner, 
  Tab, 
  Tabs,
  Chip,
  Input
} from "@heroui/react";
import { 
  Film, 
  Grid, 
  Heart, 
  ListIcon, 
  Search, 
  TrendingUp, 
  UserCircle,
  Globe,
  Clock
} from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  
  const limit = 12; // Number of watchlists per page
  
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
      let url = `http://localhost:8000/api/watchlists/public?sort=${selectedTab}&limit=${limit}&offset=${newOffset}`;
      
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
          setWatchlists(prev => [...prev, ...data.categories]);
        }
        
        setTotal(data.total);
        setHasMore(data.categories.length === limit && newOffset + limit < data.total);
        setOffset(newOffset + limit);
      }
    } catch (error) {
      console.error('Error fetching watchlists:', error);
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
  
  const renderPosterGrid = (watchlist: WatchlistCategory) => {
    const maxPosters = 4;
    const posters = watchlist.items || [];
    const placeholders = Array(Math.max(0, maxPosters - posters.length)).fill(null);
    
    return (
      <div className="grid grid-cols-2 gap-1 h-40">
        {posters.map((item, index) => (
          <div key={index} className="aspect-[2/3] bg-default-100 overflow-hidden rounded">
            {item?.posterPath ? (
              <Image
                src={`https://image.tmdb.org/t/p/w200${item.posterPath}`}
                alt="Movie poster"
                className="w-full h-full object-cover"
                removeWrapper
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-default-200">
                <Film className="w-6 h-6 text-default-400" />
              </div>
            )}
          </div>
        ))}
        {placeholders.map((_, index) => (
          <div key={`placeholder-${index}`} className="aspect-[2/3] bg-default-100 rounded flex items-center justify-center">
            <Film className="w-6 h-6 text-default-300" />
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Explore Watchlists</h1>
        <p className="text-default-600">
          Discover curated watchlists from the Movie Monday community
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Tabs 
          selectedKey={selectedTab}
          onSelectionChange={handleTabChange}
          aria-label="Watchlist categories"
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
            placeholder="Search watchlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            startContent={<Search className="text-default-300" />}
            size="sm"
            className="w-full sm:w-60"
          />
          <Button
            color="primary"
            size="sm"
            onPress={handleSearch}
            isLoading={searching}
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
          <ListIcon size={48} className="mx-auto text-default-300 mb-4" />
          <p className="text-xl font-medium mb-2">No watchlists found</p>
          <p className="text-default-500 mb-6">
            {searchQuery 
              ? `No watchlists matching "${searchQuery}"`
              : "There are no public watchlists to display"
            }
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
            {watchlists.map(watchlist => (
              <Link 
                href={`/watchlist/${watchlist.slug}`} 
                key={watchlist.id}
                legacyBehavior
              >
                <a className="block">
                  <Card className="hover:shadow-md transition-shadow overflow-hidden">
                    <CardBody className="p-0">
                      {/* Posters grid or cover image */}
                      {watchlist.coverImagePath ? (
                        <div className="h-40 overflow-hidden">
                          <Image
                            src={watchlist.coverImagePath}
                            alt={watchlist.name}
                            className="w-full h-full object-cover"
                            removeWrapper
                          />
                        </div>
                      ) : (
                        renderPosterGrid(watchlist)
                      )}
                      
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-lg line-clamp-1">{watchlist.name}</h3>
                          <div className="flex items-center">
                            <Heart className="h-4 w-4 text-danger fill-current mr-1" />
                            <span>{watchlist.likesCount}</span>
                          </div>
                        </div>
                        
                        {watchlist.description && (
                          <p className="text-default-600 text-sm line-clamp-2 mb-2">
                            {watchlist.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center">
                            <UserCircle className="h-4 w-4 mr-1 text-default-500" />
                            <span className="text-sm text-default-500">{watchlist.User.username}</span>
                          </div>
                          
                          <Chip size="sm" variant="flat" color="primary">
                            {watchlist.moviesCount} movies
                          </Chip>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </a>
              </Link>
            ))}
          </div>
          
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="flat"
                color="primary"
                onPress={() => fetchWatchlists(false)}
                isLoading={loadingMore}
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