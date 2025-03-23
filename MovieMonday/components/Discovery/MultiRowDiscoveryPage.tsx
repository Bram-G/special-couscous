"use client";

import React, { useState, useEffect } from "react";
import { Card, Spinner, useDisclosure } from "@heroui/react";
import { title } from "@/components/primitives";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MovieRowCarousel from "./MovieRowCarousel";
import VHSModeToggle from "@/components/VHS/VHSModeToggle";
import VHSMovieItem from "@/components/VHS/VHSMovieItem";

// Discovery Categories
const CATEGORIES = [
  {
    id: "trending",
    title: "Trending Movies",
    endpoint: "trending/movie/week",
    params: {}
  },
  {
    id: "top-rated",
    title: "Top Rated Films",
    endpoint: "movie/top_rated",
    params: { "vote_count.gte": 500 }
  },
  {
    id: "action",
    title: "Action & Adventure",
    endpoint: "discover/movie",
    params: { with_genres: "28,12", sort_by: "popularity.desc" }
  },
  {
    id: "comedy",
    title: "Comedy",
    endpoint: "discover/movie",
    params: { with_genres: "35", sort_by: "popularity.desc" }
  },
  {
    id: "sci-fi",
    title: "Sci-Fi & Fantasy",
    endpoint: "discover/movie",
    params: { with_genres: "878,14", sort_by: "popularity.desc" }
  },
  {
    id: "horror",
    title: "Horror",
    endpoint: "discover/movie",
    params: { with_genres: "27", sort_by: "popularity.desc" }
  },
  {
    id: "classics",
    title: "Classic Movies",
    endpoint: "discover/movie",
    params: { 
      "primary_release_date.lte": "1990-12-31", 
      sort_by: "vote_average.desc",
      "vote_count.gte": 1000
    }
  }
];

const MultiRowDiscoveryPage = () => {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const [categoryData, setCategoryData] = useState({});
  const [loadingCategories, setLoadingCategories] = useState({});
  const [vhsMode, setVhsMode] = useState(false);
  
  // Load VHS mode preference on mount
  useEffect(() => {
    try {
      const savedPreference = localStorage.getItem('vhs3dMode');
      if (savedPreference !== null) {
        setVhsMode(savedPreference === 'true');
      } else {
        // Default to enabled on desktop, disabled on mobile
        const isMobile = window.innerWidth < 768;
        setVhsMode(!isMobile);
      }
    } catch (e) {
      // If localStorage is not available, default to disabled
      setVhsMode(false);
    }
  }, []);
  
  // Save VHS mode preference when it changes
  useEffect(() => {
    try {
      localStorage.setItem('vhs3dMode', vhsMode.toString());
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [vhsMode]);
  
  // Fetch data for each category
  useEffect(() => {
    const fetchCategoryData = async (category) => {
      try {
        setLoadingCategories(prev => ({ ...prev, [category.id]: true }));
        
        // Build query params
        const queryParams = new URLSearchParams({
          api_key: process.env.NEXT_PUBLIC_API_Key,
          language: 'en-US',
          page: 1,
          ...category.params
        }).toString();
        
        const response = await fetch(
          `https://api.themoviedb.org/3/${category.endpoint}?${queryParams}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ${category.title}`);
        }
        
        const data = await response.json();
        
        setCategoryData(prev => ({
          ...prev,
          [category.id]: data.results || []
        }));
      } catch (error) {
        console.error(`Error fetching ${category.title}:`, error);
      } finally {
        setLoadingCategories(prev => ({ ...prev, [category.id]: false }));
      }
    };
    
    // Fetch all categories
    CATEGORIES.forEach(category => {
      fetchCategoryData(category);
    });
  }, []);
  
  // Toggle VHS mode
  const handleToggleVHSMode = () => {
    setVhsMode(!vhsMode);
  };
  
  // Handle movie click
  const handleMovieClick = (movieId) => {
    router.push(`/movie/${movieId}`);
  };
  
  return (
    <div className="container mx-auto pb-10">
      <div className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <h1 className={title({ size: "lg" })}>Discover Movies</h1>
        <p className="text-center text-default-500 max-w-3xl">
          Find your next favorite movie to watch for Movie Monday.
        </p>
        
        {/* VHS Mode Toggle */}
        <div className="flex justify-center items-center mt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-default-500">VHS Mode:</span>
            <VHSModeToggle enabled={vhsMode} onChange={handleToggleVHSMode} />
          </div>
        </div>
      </div>
      
      {/* Category Rows */}
      <div className="space-y-4">
        {CATEGORIES.map((category) => (
          <div key={category.id}>
            {loadingCategories[category.id] ? (
              <Card className="w-full p-6 mb-8">
                <div className="flex flex-col items-center justify-center h-40">
                  <Spinner size="lg" />
                  <p className="mt-4 text-default-500">Loading {category.title}...</p>
                </div>
              </Card>
            ) : categoryData[category.id]?.length > 0 ? (
              <MovieRowCarousel
                title={category.title}
                movies={categoryData[category.id] || []}
                vhsMode={vhsMode}
                onMovieClick={handleMovieClick}
                itemsToShow={window.innerWidth < 640 ? 2 : window.innerWidth < 1024 ? 3 : 5}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiRowDiscoveryPage;