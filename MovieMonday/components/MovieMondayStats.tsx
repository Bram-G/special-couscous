"use client";
import React, { useEffect, useState, useRef } from "react";
import { Card } from "@heroui/react";
import { Calendar, Utensils, Wine } from "lucide-react";
import { motion } from "framer-motion";

interface MovieMondayStats {
  totalMovieMondays: number;
  totalMealsShared: number;
  totalCocktailsConsumed: number;
}

// Counter animation component
const AnimatedCounter = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const prevValue = useRef(0);

  useEffect(() => {
    // Don't animate if value hasn't changed or on initial render with 0
    if (value === prevValue.current) return;
    
    // Reset counter if we're starting a new animation
    if (value !== prevValue.current) {
      countRef.current = prevValue.current;
    }
    
    const startValue = countRef.current;
    const endValue = value;
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;
    
    const animateCount = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (endTime - startTime), 1);
      
      // Easing function - ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      
      // Calculate current count
      const currentCount = Math.floor(startValue + (endValue - startValue) * eased);
      
      countRef.current = currentCount;
      setCount(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };
    
    requestAnimationFrame(animateCount);
    prevValue.current = value;
  }, [value, duration]);
  
  return <>{count.toLocaleString()}</>;
};

const MovieMondayStats = () => {
  const [stats, setStats] = useState<MovieMondayStats>({
    totalMovieMondays: 0,
    totalMealsShared: 0,
    totalCocktailsConsumed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/movie-monday/stats', {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // If the API fails, set some demo data
          setStats({
            totalMovieMondays: 246,
            totalMealsShared: 517,
            totalCocktailsConsumed: 829
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Set demo data if fetch fails
        setStats({
          totalMovieMondays: 246,
          totalMealsShared: 517,
          totalCocktailsConsumed: 829
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Set up intersection observer to trigger animations when in view
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    
    // Get the stats container
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
      observer.observe(statsContainer);
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full py-8 flex justify-center" id="stats-container">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-gray-900 to-black py-10 border-t border-gray-800" id="stats-container">
      <div className="container mx-auto px-4">
        <motion.h2 
          className="text-2xl md:text-3xl font-bold text-center text-white mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          Join our growing community
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-gray-800/50 border-none backdrop-blur-sm overflow-hidden">
              <div className="p-6 flex items-center">
                <motion.div 
                  className="mr-4 bg-primary/10 p-3 rounded-full"
                  initial={{ scale: 0.8 }}
                  animate={isVisible ? { scale: 1 } : { scale: 0.8 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.4,
                    type: "spring",
                    stiffness: 200
                  }}
                >
                  <Calendar className="h-8 w-8 text-primary" />
                </motion.div>
                <div>
                  <p className="text-3xl md:text-4xl font-bold text-white">
                    {isVisible ? <AnimatedCounter value={stats.totalMovieMondays} /> : "0"}
                  </p>
                  <p className="text-gray-400">Movie Mondays Hosted</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-gray-800/50 border-none backdrop-blur-sm">
              <div className="p-6 flex items-center">
                <motion.div 
                  className="mr-4 bg-secondary/10 p-3 rounded-full"
                  initial={{ scale: 0.8 }}
                  animate={isVisible ? { scale: 1 } : { scale: 0.8 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.5,
                    type: "spring",
                    stiffness: 200
                  }}
                >
                  <Utensils className="h-8 w-8 text-secondary" />
                </motion.div>
                <div>
                  <p className="text-3xl md:text-4xl font-bold text-white">
                    {isVisible ? <AnimatedCounter value={stats.totalMealsShared} /> : "0"}
                  </p>
                  <p className="text-gray-400">Meals Shared with Friends</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-gray-800/50 border-none backdrop-blur-sm">
              <div className="p-6 flex items-center">
                <motion.div 
                  className="mr-4 bg-danger/10 p-3 rounded-full"
                  initial={{ scale: 0.8 }}
                  animate={isVisible ? { scale: 1 } : { scale: 0.8 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.6,
                    type: "spring",
                    stiffness: 200
                  }}
                >
                  <Wine className="h-8 w-8 text-danger" />
                </motion.div>
                <div>
                  <p className="text-3xl md:text-4xl font-bold text-white">
                    {isVisible ? <AnimatedCounter value={stats.totalCocktailsConsumed} /> : "0"}
                  </p>
                  <p className="text-gray-400">Cocktails Consumed</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MovieMondayStats;