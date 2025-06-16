"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { Link } from "@heroui/react";
import { useTheme } from "next-themes";
import { Film, Info } from "lucide-react";

import DiscoveryPage from "../Discovery/DiscoveryPage";
import MovieMondayStats from "../MovieMondayStats";

import InfiniteMovieScroll from "./InfiniteMovieScroll";

import { useAuth } from "@/contexts/AuthContext";

export default function EnhancedHomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  // After mounting, we have access to authentication state
  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted yet or still loading authentication, show a loading state
  if (!mounted || isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // If authenticated, show just the discovery page
  if (isAuthenticated) {
    return <DiscoveryPage />;
  }

  const gradientClass =
    theme === "light"
      ? "from-white via-white/80 to-transparent"
      : "from-black to-transparent";

  const textColorClass = theme === "light" ? "text-black" : "text-white";
  const textSecondaryColorClass =
    theme === "light" ? "text-black/90" : "text-white/90";

  return (
    <>
      <section className="relative rounded-sm h-screen overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 lg:w-3/5">
          <InfiniteMovieScroll />
          <div
            className={`absolute left-0 top-0 bottom-0 w-5/6 bg-gradient-to-r ${gradientClass}`}
          />
        </div>

        {/* Content container */}
        <div className="relative h-full flex flex-col md:flex-row">
          <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-16 z-10">
            <div className="max-w-2xl md:max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-8">
                <span className={`block ${textColorClass}`}>
                  Make Mondays the Highlight of your week
                </span>
              </h1>
              <p
                className={`text-xl md:text-xl ${textSecondaryColorClass} mb-10`}
              >
                Turn your Mondays into a celebration of connection with Movie
                Monday! Gather your friends for a night of movies, cocktails,
                homemade dinners, and sweet desserts. It's more than just a
                movie night—it's about building community, creating memories,
                and making Mondays something to look forward to. Let the
                laughter, conversation, and great food roll as you share an
                unforgettable weekly tradition.
              </p>

              <Button
                as={Link}
                className="px-10 py-6 text-lg font-medium"
                color="primary"
                href="/login"
                size="lg"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>

        {/* Dark overlay for mobile view - adapt for light/dark modes */}
        <div
          className={`absolute inset-0 ${theme === "light" ? "bg-white/60" : "bg-black/60"} md:hidden`}
        />
      </section>

      {/* Quick Discovery Summary for unauthenticated users */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Discover Movies for Your Next Movie Monday
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-content1 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-3">Trending Movies</h3>
              <p className="mb-4">
                Stay up to date with the hottest films that everyone is talking
                about right now.
              </p>
              <Button
                fullWidth
                as={Link}
                color="primary"
                href="/login"
                variant="flat"
              >
                Sign In to Explore
              </Button>
            </div>

            <div className="bg-content1 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-3">
                Personal Recommendations
              </h3>
              <p className="mb-4">
                Get movie suggestions tailored just for you based on your
                watching history.
              </p>
              <Button
                fullWidth
                as={Link}
                color="primary"
                href="/login"
                variant="flat"
              >
                Sign In to See Recommendations
              </Button>
            </div>

            <div className="bg-content1 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-3">Create Watchlists</h3>
              <p className="mb-4">
                Organize movies you want to watch and share your lists with
                friends.
              </p>
              <Button
                fullWidth
                as={Link}
                color="primary"
                href="/login"
                variant="flat"
              >
                Sign In to Create Watchlists
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with adaptive styling */}
      <MovieMondayStatsWrapper />

      {/* About Section Preview */}
      <section className="py-16 my-16 bg-gradient-to-r from-primary-900/20 to-secondary-900/20 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-xl overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-primary" />
          <div className="absolute top-1/4 right-0 w-32 h-32 rounded-full bg-secondary" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-primary" />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-block mb-6">
            <h2 className="text-3xl md:text-4xl font-bold pb-2 border-b-4 border-primary">
              Movie Monday Rules
            </h2>
          </div>

          <div className="max-w-4xl mx-auto bg-background/80 backdrop-blur-sm p-6 rounded-lg shadow-lg mb-8">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/4 flex-shrink-0 flex justify-center">
                <div className="relative w-32 h-32 md:w-40 md:h-40">
                  <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Film className="w-16 h-16 md:w-20 md:h-20 text-primary" />
                  </div>
                </div>
              </div>

              <div className="md:w-3/4 text-left space-y-4">
                <p className="text-lg">
                  Each Monday, a different group member takes their turn as the
                  movie selector. That person chooses three movies and presents
                  them to the group. Everyone votes on which movie they'd like
                  to watch, and the movie with the most votes wins. If there's a
                  tie, the movie selector gets to make the final decision.
                </p>
                <p className="text-lg text-default-700">
                  The Movie Monday app tracks your viewing history, meal
                  choices, and voting patterns, revealing interesting insights
                  about your group's tastes and discovering fun connections
                  between films over time.
                </p>
              </div>
            </div>
          </div>

          <Button
            as={Link}
            className="font-medium px-8 py-6"
            color="primary"
            href="/about"
            size="lg"
            startContent={<Info className="h-5 w-5" />}
            variant="flat"
          >
            Learn More About Us
          </Button>
        </div>
      </section>
    </>
  );
}

// Wrapper for the MovieMondayStats component to ensure theme compatibility
function MovieMondayStatsWrapper() {
  const { theme } = useTheme();

  // Apply theme-specific styling to the stats component
  const themeClass =
    theme === "light" ? "bg-gray-100 text-gray-900" : "bg-gray-900 text-white";

  return (
    <div className={themeClass}>
      <MovieMondayStats />
    </div>
  );
}
