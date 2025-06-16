"use client";
import React, { useEffect, useState } from "react";
import { Image } from "@heroui/react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

type Movie = {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
};

const InfiniteMovieScroll = () => {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchTrendingMovies = async () => {
      try {
        // Use the API key from your environment variables
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.NEXT_PUBLIC_API_Key}&language=en-US&page=1`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch trending movies");
        }

        const data = await response.json();

        // Shuffle the movies array for more randomness at start
        const shuffledMovies = shuffleArray([...data.results]);

        // Create separate arrays for each column to ensure diversity
        const firstColumnMovies = shuffleArray([...shuffledMovies]).slice(
          0,
          10,
        );
        const secondColumnMovies = shuffleArray([...shuffledMovies]).slice(
          0,
          10,
        );
        const thirdColumnMovies = shuffleArray([...shuffledMovies]).slice(
          0,
          10,
        );

        // Combine all movies for easier state management
        const organizedMovies = [
          ...firstColumnMovies,
          ...secondColumnMovies,
          ...thirdColumnMovies,
        ];

        setTrendingMovies(organizedMovies);
      } catch (error) {
        console.error("Error fetching trending movies:", error);
        // Use placeholder data if API fails
        setTrendingMovies(generatePlaceholderMovies(30));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingMovies();
  }, []);

  // Fisher-Yates shuffle algorithm for randomizing arrays
  const shuffleArray = (array: any[]) => {
    const newArray = [...array];

    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }

    return newArray;
  };

  // Generate placeholder movie data in case the API fails
  const generatePlaceholderMovies = (count: number): Movie[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      title: `Movie ${i}`,
      poster_path: "",
      backdrop_path: "",
    }));
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Create a grid-based mosaic layout that fills the entire container
  return (
    <div className="h-full w-full relative overflow-hidden bg-black">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1 relative">
        {/* First scrolling section - downward */}
        <div className="col-span-1 relative">
          <motion.div
            animate={{ y: ["0%", "-50%"] }}
            className="w-full"
            transition={{
              y: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 60,
                ease: "linear",
              },
            }}
          >
            {trendingMovies.slice(0, 10).map((movie, index) => (
              <div
                key={`col1-${movie.id}-${index}`}
                className="mb-1 h-64 md:h-80 overflow-hidden"
              >
                <Image
                  removeWrapper
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  src={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                      : "/placeholder-poster.jpg"
                  }
                />
              </div>
            ))}
            {/* Duplicate first set for seamless loop */}
            {trendingMovies.slice(0, 10).map((movie, index) => (
              <div
                key={`col1-dup-${movie.id}-${index}`}
                className="mb-1 h-64 md:h-80 overflow-hidden"
              >
                <Image
                  removeWrapper
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  src={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                      : "/placeholder-poster.jpg"
                  }
                />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Second scrolling section - upward */}
        <div className="col-span-1 relative">
          <motion.div
            animate={{ y: ["-50%", "0%"] }}
            className="w-full"
            transition={{
              y: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 50,
                ease: "linear",
              },
            }}
          >
            {trendingMovies.slice(10, 20).map((movie, index) => (
              <div
                key={`col2-${movie.id}-${index}`}
                className="mb-1 h-64 md:h-80 overflow-hidden"
              >
                <Image
                  removeWrapper
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  src={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                      : "/placeholder-poster.jpg"
                  }
                />
              </div>
            ))}
            {/* Duplicate second set for seamless loop */}
            {trendingMovies.slice(10, 20).map((movie, index) => (
              <div
                key={`col2-dup-${movie.id}-${index}`}
                className="mb-1 h-64 md:h-80 overflow-hidden"
              >
                <Image
                  removeWrapper
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  src={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                      : "/placeholder-poster.jpg"
                  }
                />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Third scrolling section - downward slower */}
        <div className="col-span-1 relative">
          <motion.div
            animate={{ y: ["0%", "-50%"] }}
            className="w-full"
            transition={{
              y: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 70,
                ease: "linear",
              },
            }}
          >
            {trendingMovies.slice(20, 30).map((movie, index) => (
              <div
                key={`col3-${movie.id}-${index}`}
                className="mb-1 h-64 md:h-80 overflow-hidden"
              >
                <Image
                  removeWrapper
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  src={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                      : "/placeholder-poster.jpg"
                  }
                />
              </div>
            ))}
            {/* Duplicate third set for seamless loop */}
            {trendingMovies.slice(20, 30).map((movie, index) => (
              <div
                key={`col3-dup-${movie.id}-${index}`}
                className="mb-1 h-64 md:h-80 overflow-hidden"
              >
                <Image
                  removeWrapper
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  src={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                      : "/placeholder-poster.jpg"
                  }
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default InfiniteMovieScroll;
