"use client";
import React, { useEffect, useState } from "react";
import { 
  Button, 
  Card, 
  CardBody, 
  Image,
  Link
} from "@heroui/react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Film, 
  Users, 
  ArrowRight 
} from "lucide-react";
import { motion } from "framer-motion";
import Hero from "../components/Hero/Hero";

// Trending movies section with enhanced animation
const TrendingSection = () => {
  const [popMovies, setPopMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const moviesPerPage = 5; // Number of movies to show at once
  
  useEffect(() => {
    fetchPopMovies();
  }, []);
  
  function fetchPopMovies() {
    fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${process.env.NEXT_PUBLIC_API_Key}`)
      .then((res) => res.json())
      .then((data) => {
        setPopMovies(data.results.slice(0, 15));
      });
  }
  
  const handleNext = () => {
    setCurrentIndex(prev => 
      prev + moviesPerPage >= popMovies.length ? 0 : prev + moviesPerPage
    );
  };
  
  const handlePrev = () => {
    setCurrentIndex(prev => 
      prev - moviesPerPage < 0 ? Math.max(0, popMovies.length - moviesPerPage) : prev - moviesPerPage
    );
  };

  return (
    <div className="relative py-10">
      <h2 className="text-3xl font-bold mb-6 text-center">Trending Movies</h2>
      
      <div className="flex items-center">
        <Button
          isIconOnly
          variant="light"
          className="mr-2"
          onPress={handlePrev}
          aria-label="Previous movies"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        <div className="flex-1 overflow-hidden">
          <motion.div 
            className="flex gap-4"
            initial={{ x: 0 }}
            animate={{ x: `-${currentIndex * (100 / moviesPerPage)}%` }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.5 }}
          >
            {popMovies.map((movie) => (
              <motion.div 
                key={movie.id} 
                className="flex-shrink-0 w-1/5 px-2"
                whileHover={{ y: -10, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Link href={`/movie/${movie.id}`} className="block">
                  <Card className="overflow-hidden h-80 cursor-pointer hover:shadow-xl transition-shadow duration-300">
                    <Image
                      removeWrapper
                      alt={movie.title}
                      className="z-0 w-full h-full object-cover"
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                      <h4 className="font-bold text-white">{movie.title}</h4>
                      <p className="text-white/80 text-sm">
                        {new Date(movie.release_date).getFullYear()}
                      </p>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
        
        <Button
          isIconOnly
          variant="light"
          className="ml-2"
          onPress={handleNext}
          aria-label="Next movies"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <section className="flex flex-col">
      {/* Custom Hero Section with trending movies background */}
      <Hero />

      {/* Trending Section */}
      <div className="w-full py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <TrendingSection />
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full bg-gradient-to-r from-secondary-900/20 to-secondary-800/10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg max-w-2xl mx-auto text-default-600">
              Movie Monday makes it easy to organize your weekly film nights and keep track of what you've watched.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Calendar className="h-10 w-10" />,
                title: "Schedule",
                description: "Plan your Movie Mondays with our easy-to-use calendar. Set dates, invite friends, and keep everyone on the same page."
              },
              {
                icon: <Film className="h-10 w-10" />,
                title: "Discover",
                description: "Browse trending films, search for classics, or let us recommend something based on your group's tastes."
              },
              {
                icon: <Users className="h-10 w-10" />,
                title: "Connect",
                description: "Create a group for your friends, family, or colleagues. Take turns picking films and build your shared watchlist."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-background rounded-xl p-6 shadow-lg"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardBody className="flex flex-col items-center text-center">
                    <div className="bg-primary/10 p-4 rounded-full mb-4 text-primary">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-default-600">{feature.description}</p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="w-full py-16 px-6 bg-black/5 dark:bg-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6">Ready to Start Your Movie Monday?</h2>
            <p className="text-lg mb-8 text-default-600">
              Create your account, invite your friends, and start building your movie watching tradition today.
            </p>
            <Button 
              color="primary" 
              size="lg" 
              as={Link}
              href="/login"
            >
              Sign Up Now
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}