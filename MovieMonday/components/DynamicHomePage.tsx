"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import InfiniteMovieScroll from "./InfiniteMovieScroll";
import MovieMondayStats from "../MovieMondayStats";
import { useAuth } from "@/contexts/AuthContext";
import DiscoveryPage from "../Discovery/DiscoveryPage";
import { Link } from "@heroui/react";

export default function DynamicHomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  // After mounting, we have access to authentication state
  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted yet or still loading authentication, show a loading state
  if (!mounted || isLoading) {
    return <div className="h-screen w-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  // If authenticated, show just the discovery page
  if (isAuthenticated) {
    return <DiscoveryPage />;
  }

  // If not authenticated, show the landing page with hero
  return (
    <>
      <section className="relative h-screen overflow-hidden">
        {/* Movie poster background on right side */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 lg:w-3/5">
          <InfiniteMovieScroll />
          {/* Add a left-to-right gradient overlay for text readability */}
          <div className="absolute left-0 top-0 bottom-0 w-full bg-gradient-to-r from-black to-transparent"></div>
        </div>

        {/* Content container */}
        <div className="relative h-full flex flex-col md:flex-row">
          {/* Left section - Text content that can overflow */}
          <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-16 z-10">
            <div className="max-w-2xl md:max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-8">
                <span className="block text-white">
                  Make Mondays the Highlight of your week
                </span>
              </h1>
              <p className="text-xl md:text-xl text-white/90 mb-10">
                Turn your Mondays into a celebration of connection with Movie
                Monday! Gather your friends for a night of movies, cocktails,
                homemade dinners, and sweet desserts. It's more than just a movie
                night—it's about building community, creating memories, and making
                Mondays something to look forward to. Let the laughter,
                conversation, and great food roll as you share an unforgettable
                weekly tradition.
              </p>

              <Button
                as={Link}
                href="/login"
                color="primary"
                size="lg"
                className="px-10 py-6 text-lg font-medium"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>

        {/* Dark overlay for mobile view */}
        <div className="absolute inset-0 bg-black/60 md:hidden"></div>
      </section>
      
      {/* Quick Discovery Summary for unauthenticated users */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Discover Movies for Your Next Movie Monday</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-content1 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-3">Trending Movies</h3>
              <p className="mb-4">Stay up to date with the hottest films that everyone is talking about right now.</p>
              <Button as={Link} href="/login" color="primary" variant="flat" fullWidth>
                Sign In to Explore
              </Button>
            </div>
            
            <div className="bg-content1 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-3">Personal Recommendations</h3>
              <p className="mb-4">Get movie suggestions tailored just for you based on your watching history.</p>
              <Button as={Link} href="/login" color="primary" variant="flat" fullWidth>
                Sign In to See Recommendations
              </Button>
            </div>
            
            <div className="bg-content1 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-3">Create Watchlists</h3>
              <p className="mb-4">Organize movies you want to watch and share your lists with friends.</p>
              <Button as={Link} href="/login" color="primary" variant="flat" fullWidth>
                Sign In to Create Watchlists
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <MovieMondayStats />
      
      {/* About Section Preview */}
      <section className="py-16 bg-content1">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">About Movie Monday</h2>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            Learn more about how Movie Monday started and why it's the perfect way to kick off your week.
          </p>
          <Button as={Link} href="/about" variant="flat" color="primary">
            Learn More About Us
          </Button>
        </div>
      </section>
    </>
  );
}