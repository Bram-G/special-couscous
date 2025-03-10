"use client";
import React from "react";
import { Button, Link } from "@heroui/react";
import InfiniteMovieScroll from "./InfiniteMovieScroll";
import MovieMondayStats from "../MovieMondayStats";

export default function EnhancedHomePage() {
  return (
    <>
      <section className="relative h-screen flex flex-col md:flex-row overflow-hidden">
        {/* Left section - Hero content */}
        <div className="flex-1 flex flex-col justify-center bg-background dark:bg-background z-10 px-6 md:px-12 lg:px-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-8">
              <span className="block text-white">
                Make Mondays the Highlight of your week
              </span>
            </h1>
            <p className="text-xl md:text-xl text-white/80 mb-10">
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

          {/* Dark overlay for mobile view */}
          <div className="absolute inset-0 bg-black/60 md:hidden"></div>
        </div>

        {/* Right section - Infinite scrolling movie posters */}
        <div className="absolute inset-0 md:relative md:w-1/2 lg:w-3/5">
          <InfiniteMovieScroll />
        </div>
      </section>
      
      {/* Stats Section */}
      <MovieMondayStats />
    </>
  );
}