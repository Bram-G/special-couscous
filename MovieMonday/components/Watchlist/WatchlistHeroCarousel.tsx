"use client";

import React, { useState, useEffect, useCallback } from "react";
import NextLink from "next/link";
import { Button, Chip } from "@heroui/react";
import { ChevronLeft, ChevronRight, Heart, Film, Sparkles } from "lucide-react";

interface HeroWatchlistItem {
  posterPath?: string;
}

interface HeroWatchlist {
  id: number;
  name: string;
  description?: string;
  slug: string;
  likesCount: number;
  moviesCount: number;
  User?: { username: string };
  items?: HeroWatchlistItem[];
}

const posterUrl = (path?: string | null) => {
  if (!path) return "/placeholder-poster.jpg";
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/w500${path}`;
};

const AUTO_ADVANCE_MS = 6000;

export default function WatchlistHeroCarousel({
  watchlists,
}: {
  watchlists: HeroWatchlist[];
}) {
  const [active, setActive] = useState(0);
  const slides = watchlists.slice(0, 5);

  const goTo = useCallback(
    (index: number) => {
      setActive(((index % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => goTo(active + 1), AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [active, goTo, slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[active];
  const owner = slide.User?.username || "A member";
  const backdropPosters = (slide.items || []).slice(0, 6);

  return (
    <div className="relative mb-10 overflow-hidden rounded-2xl border border-default-200 bg-content1">
      <div className="relative h-72 md:h-96">
        {/* Blurred poster backdrop */}
        <div className="absolute inset-0 flex">
          {backdropPosters.length > 0 ? (
            backdropPosters.map((item, i) => (
              <div key={i} className="relative h-full flex-1 overflow-hidden">
                <img
                  src={posterUrl(item?.posterPath)}
                  alt=""
                  className="h-full w-full scale-110 object-cover blur-sm brightness-[0.35]"
                />
              </div>
            ))
          ) : (
            <div className="h-full w-full bg-default-800" />
          )}
        </div>

        {/* Gradient overlays for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-end p-6 md:p-10">
          <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Community Favorite
          </span>

          <h2 className="max-w-xl text-2xl font-bold leading-tight text-foreground md:text-4xl">
            {slide.name}
          </h2>

          {slide.description && (
            <p className="mt-2 max-w-lg text-sm text-default-600 line-clamp-2 md:text-base">
              {slide.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-default-500">by {owner}</span>
            <Chip size="sm" variant="flat">
              <div className="flex items-center gap-1">
                <Film className="h-3 w-3" />
                {slide.moviesCount} movies
              </div>
            </Chip>
            <Chip size="sm" variant="flat" color="danger">
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 fill-current" />
                {slide.likesCount}
              </div>
            </Chip>
          </div>

          <Button
            as={NextLink}
            href={`/watchlist/${slide.slug}`}
            color="primary"
            className="mt-5 w-fit"
          >
            View Watchlist
          </Button>
        </div>

        {/* Prev / next arrows */}
        {slides.length > 1 && (
          <>
            <button
              aria-label="Previous watchlist"
              onClick={() => goTo(active - 1)}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/60 p-2 text-foreground backdrop-blur-sm transition hover:bg-background/90"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              aria-label="Next watchlist"
              onClick={() => goTo(active + 1)}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/60 p-2 text-foreground backdrop-blur-sm transition hover:bg-background/90"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 right-6 z-10 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-6 bg-primary" : "w-1.5 bg-default-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}