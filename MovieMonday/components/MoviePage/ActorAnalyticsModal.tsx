import React from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Button,
  Avatar, 
  Card, 
  CardBody,
  Chip,
  Image,
  Progress,
  Divider
} from "@heroui/react";
import { FilmIcon, Trophy, Star, Clock, Film } from "lucide-react";
import Link from 'next/link';

interface MovieAppearance {
  id: number;
  title: string;
  posterPath: string;
  isWinner: boolean;
}

interface ActorStats {
  appearances: number;
  wins: number;
  movies: MovieAppearance[];
}

interface ActorData {
  id: number;
  name: string;
  profile_path: string;
  character?: string;
  stats: ActorStats;
}

interface ActorAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: ActorData;
}

const ActorAnalyticsModal: React.FC<ActorAnalyticsModalProps> = ({ isOpen, onClose, actor }) => {
  const { name, profile_path, stats } = actor;
  const winRate = stats.appearances > 0 
    ? ((stats.wins / stats.appearances) * 100).toFixed(0) 
    : '0';
  
  // Sort movies - winning movies first, then alphabetically
  const sortedMovies = [...(stats.movies || [])].sort((a, b) => {
    if (a.isWinner && !b.isWinner) return -1;
    if (!a.isWinner && b.isWinner) return 1;
    return a.title.localeCompare(b.title);
  });

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex gap-4 items-center">
              <Avatar
                src={profile_path ? `https://image.tmdb.org/t/p/w185${profile_path}` : null}
                name={name}
                className="h-16 w-16"
                isBordered={stats.wins > 0}
                color={stats.wins > 0 ? "warning" : "default"}
              />
              <div>
                <h3 className="text-xl font-bold">{name}</h3>
                {stats.appearances > 0 ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex rounded-full overflow-hidden border border-default-200">
                      <div className="bg-primary px-2 py-1 text-white text-sm font-medium flex items-center">
                        <FilmIcon className="h-4 w-4 mr-1" />
                        {stats.appearances}
                      </div>
                      
                      {stats.wins > 0 && (
                        <div className="bg-warning px-2 py-1 text-white text-sm font-medium flex items-center">
                          <Trophy className="h-4 w-4 mr-1" />
                          {stats.wins}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-default-500">
                      {stats.appearances === 1 ? 'appearance' : 'appearances'}
                      {stats.wins > 0 && `, ${stats.wins === 1 ? '1 win' : `${stats.wins} wins`}`}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-default-500">No Movie Monday appearances yet</p>
                )}
              </div>
            </ModalHeader>
            
            <ModalBody>
              {stats.appearances > 0 ? (
                <div className="space-y-6">
                  {/* Analytics section */}
                  <Card>
                    <CardBody className="p-4">
                      <div className="flex flex-col gap-3">
                        <h4 className="font-medium">Movie Monday Stats</h4>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Win Rate</span>
                            <span className="text-sm font-medium">{winRate}%</span>
                          </div>
                          <Progress 
                            value={parseInt(winRate)} 
                            color="warning"
                            className="h-2"
                            aria-label="Win rate"
                          />
                        </div>
                        
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-default-500">Total Appearances</p>
                            <p className="font-medium">{stats.appearances}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-default-500">Winning Movies</p>
                            <p className="font-medium">{stats.wins}</p>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                  
                  <Divider />
                  
                  {/* Movie Appearances */}
                  <div>
                    <h4 className="font-medium mb-3">Movie Monday Appearances</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {sortedMovies.map((movie) => (
                        <Link key={movie.id} href={`/movie/${movie.id}`} passHref legacyBehavior>
                          <a className="block">
                            <Card 
                              isPressable
                              className={movie.isWinner ? "border-2 border-warning" : ""}
                            >
                              <CardBody className="p-0 relative">
                                {/* Fixed aspect ratio container for movie poster */}
                                <div className="relative aspect-[2/3] w-full">
                                  <Image
                                    src={
                                      movie.posterPath
                                        ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
                                        : '/placeholder-poster.jpg'
                                    }
                                    alt={movie.title}
                                    className="object-cover w-full h-full"
                                    removeWrapper
                                  />
                                  {movie.isWinner && (
                                    <div className="absolute top-2 right-2 bg-warning text-white p-1 rounded-full">
                                      <Trophy className="h-4 w-4" />
                                    </div>
                                  )}
                                </div>
                                {/* Fixed height container for title */}
                                <div className="p-2 h-10 flex items-center justify-center">
                                  <p className="text-sm font-medium line-clamp-2 text-center">
                                    {movie.title}
                                  </p>
                                </div>
                              </CardBody>
                            </Card>
                          </a>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FilmIcon className="h-12 w-12 text-default-300 mx-auto mb-4" />
                  <p>
                    {name} hasn't appeared in any Movie Monday selections yet.
                  </p>
                  <p className="text-sm text-default-500 mt-2">
                    As you watch more movies, you'll see analytics for this actor here.
                  </p>
                </div>
              )}
            </ModalBody>
            
            <ModalFooter>
              <Button color="primary" variant="light" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ActorAnalyticsModal;