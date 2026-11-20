"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button, Card, Spinner } from "@heroui/react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";

import EnhancedMovieDiscoveryCard from "./EnhancedMovieDiscoveryCard";

interface Movie {
  id: number;
  title: string;
  poster_path?: string;
  release_date?: string;
  vote_average?: number;
  overview?: string;
  backdrop_path?: string | null;
  genre_ids?: number[];
  original_language?: string;
  original_title?: string;
  popularity?: number;
  video?: boolean;
  vote_count?: number;
  adult?: boolean;
}

interface EnhancedMovieCarouselProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  loading?: boolean;
  emptyMessage?: string;
  onSuccess?: () => void;
  reason?: (
    movie: Movie,
  ) => { type: string; text: string; detail?: string } | null;
  watchedMovies?: Set<number>;
  votedButNotPickedMovies?: Set<number>;
}

// Gap between cards, in rem (matches Tailwind gap-4)
const GAP_REM = 1;

// Fractional values on small screens leave a "peek" of the next poster,
// which signals that the row is swipeable.
const getItemsPerView = (width: number) => {
  if (width < 640) return 2.3;
  if (width < 768) return 3.3;
  if (width < 1280) return 4;
  return 5;
};

const EnhancedMovieCarousel: React.FC<EnhancedMovieCarouselProps> = ({
  title,
  subtitle,
  movies,
  loading = false,
  emptyMessage = "No movies found",
  reason,
  watchedMovies = new Set(),
  votedButNotPickedMovies = new Set(),
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [itemsPerView, setItemsPerView] = useState(5);
  const [canGoPrevious, setCanGoPrevious] = useState(false);
  const [canGoNext, setCanGoNext] = useState(false);
  const [activePage, setActivePage] = useState(0);

  const wholeItemsPerView = Math.max(1, Math.floor(itemsPerView));
  const pageCount = Math.max(1, Math.ceil(movies.length / wholeItemsPerView));

  // Read the scroller's position and derive arrow + progress state from it
  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;

    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);

    setCanGoPrevious(scrollLeft > 4);
    setCanGoNext(scrollLeft < maxScroll - 4);

    if (pageCount <= 1 || maxScroll === 0) {
      setActivePage(0);
    } else if (scrollLeft >= maxScroll - 4) {
      setActivePage(pageCount - 1);
    } else {
      setActivePage(Math.round((scrollLeft / maxScroll) * (pageCount - 1)));
    }
  }, [pageCount]);

  // Responsive cards-per-view
  useEffect(() => {
    const handleResize = () => {
      setItemsPerView(getItemsPerView(window.innerWidth));
      requestAnimationFrame(updateScrollState);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [updateScrollState]);

  // Reset to the start when the movie list changes, then recompute state
  useEffect(() => {
    const el = scrollerRef.current;

    if (el) el.scrollTo({ left: 0 });
    const frame = requestAnimationFrame(updateScrollState);

    return () => cancelAnimationFrame(frame);
  }, [movies, itemsPerView, updateScrollState]);

  // Arrow buttons scroll by one "page" of whole cards
  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollerRef.current;

    if (!el) return;

    const firstCard = el.firstElementChild as HTMLElement | null;
    const gapPx = parseFloat(getComputedStyle(el).columnGap) || 16;
    const step = firstCard
      ? (firstCard.offsetWidth + gapPx) * wholeItemsPerView
      : el.clientWidth;

    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  // Progress segments jump to that position
  const scrollToPage = (page: number) => {
    const el = scrollerRef.current;

    if (!el || pageCount <= 1) return;

    const maxScroll = el.scrollWidth - el.clientWidth;

    el.scrollTo({
      left: (page / (pageCount - 1)) * maxScroll,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <div className="mb-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          {subtitle && <p className="text-default-500 text-sm">{subtitle}</p>}
        </div>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="mb-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          {subtitle && <p className="text-default-500 text-sm">{subtitle}</p>}
        </div>
        <Card className="w-full">
          <div className="flex flex-col items-center justify-center p-8">
            <Info className="h-12 w-12 text-default-300 mb-4" />
            <p className="text-center text-lg">{emptyMessage}</p>
          </div>
        </Card>
      </div>
    );
  }

  const cardBasis = `calc((100% - ${(itemsPerView - 1) * GAP_REM}rem) / ${itemsPerView})`;

  return (
    <div className="mb-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {subtitle && <p className="text-default-500 text-sm">{subtitle}</p>}
        </div>

        {/* Navigation controls */}
        <div className="flex gap-2">
          <Button
            isIconOnly
            aria-label="Scroll left"
            className="rounded-full"
            isDisabled={!canGoPrevious}
            size="sm"
            variant="flat"
            onPress={() => scrollByPage(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Button
            isIconOnly
            aria-label="Scroll right"
            className="rounded-full"
            isDisabled={!canGoNext}
            size="sm"
            variant="flat"
            onPress={() => scrollByPage(1)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Swipeable scroller — native scroll + snap */}
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory overscroll-x-contain [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
        onScroll={updateScrollState}
      >
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="aspect-[2/3] snap-start shrink-0"
            style={{ flex: `0 0 ${cardBasis}` }}
          >
            <EnhancedMovieDiscoveryCard
              isVotedButNotPicked={votedButNotPickedMovies.has(movie.id)}
              isWatched={watchedMovies.has(movie.id)}
              movie={movie}
              showAddButton={false}
            />
          </div>
        ))}
      </div>

      {/* Progress indicator (tappable) */}
      {pageCount > 1 && (
        <div className="flex justify-center mt-4 gap-1">
          {Array.from({ length: pageCount }).map((_, index) => (
            <button
              key={index}
              aria-label={`Go to section ${index + 1}`}
              className={`h-1 rounded-full transition-all ${
                index === activePage ? "w-8 bg-primary" : "w-4 bg-default-200"
              }`}
              type="button"
              onClick={() => scrollToPage(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedMovieCarousel;