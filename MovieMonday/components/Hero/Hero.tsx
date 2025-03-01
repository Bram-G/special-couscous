"use client";
import React, { useEffect, useState } from "react";
import { Button, Link } from "@heroui/react";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CustomHero = () => {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Fetch trending movies
    fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${process.env.NEXT_PUBLIC_API_Key}`)
      .then((res) => res.json())
      .then((data) => {
        setTrendingMovies(data.results.slice(0, 5));
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching trending movies:", err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    // Auto-cycle through background images every 5 seconds
    if (trendingMovies.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % trendingMovies.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [trendingMovies]);

  if (isLoading) {
    return (
      <div className="w-full h-[600px] bg-default-100 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (trendingMovies.length === 0) {
    return (
      <div className="w-full h-[600px] bg-default-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome to Movie Monday</h2>
          <p>Discover and share movies with friends every week</p>
        </div>
      </div>
    );
  }

  const currentMovie = trendingMovies[currentIndex];
  
  return (
    <div className="relative w-full h-[600px] overflow-hidden">
      {/* Background image */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentMovie.id}
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: `url(https://image.tmdb.org/t/p/original${currentMovie.backdrop_path})`,
              filter: 'brightness(0.7)'
            }}
          />
        </motion.div>
      </AnimatePresence>
      
      {/* Solid color overlay (1/3 of the container) */}
      <div 
        className="absolute inset-0 z-10"
        style={{
          background: 'linear-gradient(to right, rgba(var(--background), 0.9) 33%, rgba(var(--background), 0.1) 100%)'
        }}
      ></div>
      
      {/* Content */}
      <div className="relative z-20 container mx-auto px-6 h-full flex items-center">
        <div className="w-full max-w-xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold mb-2">Movie Monday</h1>
            
            {/* Movie title with animation */}
            <AnimatePresence mode="wait">
              <motion.h2 
                key={currentMovie.id}
                className="text-2xl font-medium text-primary mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
              >
                Featuring: {currentMovie.title}
              </motion.h2>
            </AnimatePresence>
            
            <p className="text-lg mb-6 text-default-600">
              Movie Monday is a weekly tradition that brings friends together to enjoy cinema.
              Each week, group members take turns selecting films, creating a shared experience
              that builds community and exposes everyone to new genres and perspectives.
            </p>
            
            <p className="text-lg mb-8 text-default-600">
              Our platform makes it easy to organize your Movie Monday group,
              track what you've watched, and discover new films to enjoy together.
            </p>
            
            <Button 
              color="primary" 
              size="lg"
              endContent={<ArrowRight className="h-4 w-4" />}
              as={Link}
              href="/dashboard"
            >
              Start Your Group
            </Button>
          </motion.div>
        </div>
      </div>
      
      {/* Simple indicator dots */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
        {trendingMovies.map((_, idx) => (
          <div 
            key={idx} 
            className={`w-2 h-2 rounded-full ${idx === currentIndex ? 'bg-primary' : 'bg-default-200'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default CustomHero;