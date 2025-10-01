"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Chip, Avatar, Tabs, Tab, Skeleton, Divider } from '@heroui/react';
import { Heart, Calendar, Film, Users, Wine, Popcorn, TrendingUp, Clock, ArrowLeft, Share2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface MovieMondayPreview {
  id: number;
  date: string;
  slug: string;
  weekTheme: string | null;
  status: string;
  likesCount: number;
  picker: {
    id: number;
    username: string;
  };
  movieSelections: Array<{
    id: number;
    tmdbMovieId: number;
    title: string;
    posterPath: string;
    isWinner: boolean;
  }>;
  eventDetails: {
    meals: string[];
    cocktails: string[];
    desserts: string[];
  } | null;
}

interface GroupDetail {
  id: number;
  name: string;
  slug: string;
  description: string;
  coverImagePath: string | null;
  owner: {
    id: number;
    username: string;
  };
  members: Array<{
    id: number;
    username: string;
  }>;
  stats: {
    totalWeeks: number;
    totalMovies: number;
    topGenre: { name: string; count: number };
    topActor: { name: string; count: number };
    signatureDrink: { name: string; count: number };
    signatureMeal: { name: string; count: number };
    activeSince: string;
  };
}

const PublicGroupDetail = () => {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [movieMondays, setMovieMondays] = useState<MovieMondayPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (slug) {
      fetchGroupData();
    }
  }, [slug, currentPage]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/movie-monday/browse/group/${slug}?page=${currentPage}&limit=12`
      );
      const data = await response.json();
      
      setGroup(data.group);
      setMovieMondays(data.movieMondays);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: `${group?.name} - Movie Monday`,
        text: group?.description || 'Check out this Movie Monday group!',
        url
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const MovieMondayCard = ({ mm }: { mm: MovieMondayPreview }) => {
    const winnerMovie = mm.movieSelections.find(m => m.isWinner);
    
    return (
      <Card 
        isPressable
        onPress={() => router.push(`/movie-monday/public/${mm.slug}`)}
        className="hover:scale-[1.02] transition-transform"
      >
        <CardHeader className="flex-col items-start gap-2 pb-2">
          <div className="w-full flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-default-500 mb-1">{formatDate(mm.date)}</p>
              {mm.weekTheme && (
                <h3 className="text-sm font-bold mb-1">{mm.weekTheme}</h3>
              )}
            </div>
            <Chip size="sm" variant="flat" startContent={<Heart className="w-3 h-3" />}>
              {mm.likesCount}
            </Chip>
          </div>
          
          {/* Movie Posters Grid */}
          <div className="w-full aspect-[3/2] rounded-lg overflow-hidden bg-default-100">
            {mm.movieSelections.length > 0 ? (
              <div className={`grid h-full gap-0.5 ${
                mm.movieSelections.length === 1 ? 'grid-cols-1' :
                mm.movieSelections.length === 2 ? 'grid-cols-2' :
                mm.movieSelections.length === 3 ? 'grid-cols-3' :
                'grid-cols-2 grid-rows-2'
              }`}>
                {mm.movieSelections.slice(0, 4).map((movie, idx) => (
                  <div key={idx} className="relative overflow-hidden">
                    {movie.posterPath && (
                      <>
                        <img
                          src={`https://image.tmdb.org/t/p/w300${movie.posterPath}`}
                          alt={movie.title}
                          className={`w-full h-full object-cover ${movie.isWinner ? 'ring-2 ring-warning' : ''}`}
                        />
                        {movie.isWinner && (
                          <div className="absolute top-1 right-1 bg-warning text-warning-foreground rounded-full p-1">
                            <Film className="w-3 h-3" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Film className="w-12 h-12 text-default-300" />
              </div>
            )}
          </div>
        </CardHeader>

        <CardBody className="pt-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Users className="w-3 h-3 text-primary" />
              <span className="text-default-500">Picked by</span>
              <span className="font-medium">{mm.picker.username}</span>
            </div>
            
            {mm.movieSelections.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <Film className="w-3 h-3 text-secondary" />
                <span className="font-medium">{mm.movieSelections.length} movies</span>
              </div>
            )}
            
            {mm.eventDetails && (
              <div className="flex flex-wrap gap-1">
                {mm.eventDetails.cocktails?.slice(0, 2).map((drink, idx) => (
                  <Chip key={idx} size="sm" variant="flat" color="secondary">
                    {drink}
                  </Chip>
                ))}
                {mm.eventDetails.meals?.slice(0, 1).map((meal, idx) => (
                  <Chip key={idx} size="sm" variant="flat" color="success">
                    {meal}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    );
  };

  if (loading && !group) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Skeleton className="w-full h-48 rounded-lg mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Group not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back Button */}
      <Button
        variant="light"
        startContent={<ArrowLeft className="w-4 h-4" />}
        onPress={() => router.push('/browse')}
        className="mb-4"
      >
        Back to Browse
      </Button>

      {/* Group Header */}
      <Card className="mb-8">
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Cover Image or Placeholder */}
            <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden bg-gradient-to-br from-primary-100 to-secondary-100 flex-shrink-0">
              {group.coverImagePath ? (
                <img 
                  src={group.coverImagePath} 
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Film className="w-16 h-16 text-default-300" />
                </div>
              )}
            </div>

            {/* Group Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
                  <p className="text-default-600">{group.description}</p>
                </div>
                <Button
                  isIconOnly
                  variant="flat"
                  onPress={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xl font-bold">{group.stats.totalWeeks}</p>
                    <p className="text-xs text-default-500">Weeks</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-secondary" />
                  <div>
                    <p className="text-xl font-bold">{group.stats.totalMovies}</p>
                    <p className="text-xs text-default-500">Movies</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-success" />
                  <div>
                    <p className="text-xl font-bold">{group.members?.length || 0}</p>
                    <p className="text-xs text-default-500">Members</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-warning" />
                  <div>
                    <p className="text-xs text-default-500">
                      Since {formatDate(group.stats.activeSince)}
                    </p>
                  </div>
                </div>
              </div>

              <Divider className="my-4" />

              {/* Signature Items */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {group.stats.topGenre && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-default-500">Top Genre</p>
                      <p className="text-sm font-medium">{group.stats.topGenre.name}</p>
                    </div>
                  </div>
                )}
                
                {group.stats.signatureDrink && (
                  <div className="flex items-center gap-2">
                    <Wine className="w-4 h-4 text-secondary" />
                    <div>
                      <p className="text-xs text-default-500">Signature Drink</p>
                      <p className="text-sm font-medium">{group.stats.signatureDrink.name}</p>
                    </div>
                  </div>
                )}
                
                {group.stats.topActor && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-success" />
                    <div>
                      <p className="text-xs text-default-500">Top Actor</p>
                      <p className="text-sm font-medium">{group.stats.topActor.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Movie Mondays Grid */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Movie Monday Timeline</h2>
      </div>

      {movieMondays.length === 0 ? (
        <Card>
          <CardBody className="p-12 text-center">
            <Film className="w-16 h-16 text-default-300 mx-auto mb-4" />
            <p className="text-xl text-default-500">No public Movie Mondays yet</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {movieMondays.map((mm) => (
              <MovieMondayCard key={mm.id} mm={mm} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                isDisabled={currentPage === 1}
                onPress={() => setCurrentPage(p => p - 1)}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2 px-4">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                isDisabled={currentPage === totalPages}
                onPress={() => setCurrentPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PublicGroupDetail;