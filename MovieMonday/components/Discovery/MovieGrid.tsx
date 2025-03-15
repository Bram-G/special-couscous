// components/Discovery/MovieGrid.tsx
import React from "react";
import { Image, Link, Card, CardBody } from "@heroui/react";
import { Info } from "lucide-react";

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
}

interface MovieGridProps {
  movies: Movie[];
  emptyMessage?: string;
}

const MovieGrid: React.FC<MovieGridProps> = ({ 
  movies,
  emptyMessage = "No movies found" 
}) => {
  if (!movies || movies.length === 0) {
    return (
      <Card className="w-full">
        <CardBody className="flex flex-col items-center justify-center py-12">
          <Info className="h-16 w-16 text-default-300 mb-4" />
          <p className="text-center text-xl font-medium">{emptyMessage}</p>
        </CardBody>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {movies.map((movie) => (
        <div key={movie.id} className="relative group">
          <Link href={`/movie/${movie.id}`}>
            <div className="aspect-[2/3] overflow-hidden rounded-lg">
              <Image
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : '/placeholder-poster.jpg'
                }
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                removeWrapper
              />
              
              {/* Hover overlay with info */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <h3 className="text-white font-medium line-clamp-2">{movie.title}</h3>
                                <div className="flex justify-between items-center mt-1">
                  <p className="text-white/70 text-sm">
                    {movie.release_date ? new Date(movie.release_date).getFullYear() : "Unknown"}
                  </p>
                  {movie.vote_average > 0 && (
                    <div className="bg-primary rounded-full px-2 py-1 text-xs font-bold">
                      {movie.vote_average.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default MovieGrid;