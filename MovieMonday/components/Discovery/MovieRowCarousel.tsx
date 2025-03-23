import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import VHSMovieItem from '../VHS/VHSMovieItem';
import ResponsiveVHSMovieItem from './ResponsiveVHSMovieItem'

const MovieRowCarousel = ({ 
  title,
  movies = [],
  vhsMode = false,
  onMovieClick,
  itemWidth = 240, // Default width for each movie item
  gap = 16, // Gap between items
  itemsToShow = 5, // Number of items visible in the viewport
}) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 5 });
  const carouselRef = useRef(null);
  
  // Calculate total width and max scroll position
  useEffect(() => {
    if (!carouselRef.current) return;
    
    const calculateWidths = () => {
      const containerEl = carouselRef.current;
      const containerWidth = containerEl.clientWidth;
      setContainerWidth(containerWidth);
      
      // Calculate total content width including gaps
      const totalItems = movies.length;
      const totalContentWidth = totalItems * (itemWidth + gap) - gap;
      const maxScroll = Math.max(0, totalContentWidth - containerWidth);
      
      setMaxScroll(maxScroll);
    };
    
    // Calculate initially and on resize
    calculateWidths();
    window.addEventListener('resize', calculateWidths);
    
    return () => {
      window.removeEventListener('resize', calculateWidths);
    };
  }, [movies, itemWidth, gap]);
  
  // Handle scroll
  const scroll = (direction) => {
    // Scroll by the width of visible items
    const scrollAmount = direction * Math.floor(containerWidth * 0.8);
    let newPosition = scrollPosition + scrollAmount;
    
    // Clamp scroll position
    newPosition = Math.max(0, Math.min(newPosition, maxScroll));
    setScrollPosition(newPosition);
    const itemsPerView = Math.floor(containerWidth / (itemWidth + gap));
    const start = Math.floor(newPosition / (itemWidth + gap));
    const end = start + itemsPerView + 1; // +1 for partially visible item
    
    setVisibleRange({ start, end });
  };
  
  // Handle item click
  const handleMovieClick = (movieId) => {
    if (onMovieClick) {
      onMovieClick(movieId);
    }
  };
  
  return (
    <div className="movie-row mb-10">
    <h2 className="text-xl font-bold mb-3">{title}</h2>
    <div className="relative">
      {/* Carousel content */}
      <div 
        ref={carouselRef}
        className="relative overflow-hidden"
      >
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{ 
            transform: `translateX(-${scrollPosition}px)`,
            gap: `${gap}px`
          }}
        >
          {movies.map((movie, index) => (
            <div
              key={movie.id} 
              style={{ 
                width: `${itemWidth}px`,
                flexShrink: 0,
              }}
            >
              {/* Only render 3D for visible items */}
              <ResponsiveVHSMovieItem
                movie={movie}
                enable3D={vhsMode && index >= visibleRange.start && index <= visibleRange.end}
                width={itemWidth}
                height={Math.floor(itemWidth * 1.5)}
                onMovieClick={handleMovieClick}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
};

export default MovieRowCarousel;