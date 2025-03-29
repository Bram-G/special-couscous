"use client";
import React from "react";
import { Button, Link } from "@heroui/react";
import InfiniteMovieScroll from "./InfiniteMovieScroll";
import MovieMondayStats from "../MovieMondayStats";

export default function EnhancedHomePage() {
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
      
      {/* Stats Section */}
      <MovieMondayStats />
    </>
  );
}