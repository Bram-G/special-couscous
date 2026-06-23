// components/HomePage/PublicGroupCard.tsx
"use client";

import React from "react";
import NextLink from "next/link";
import { Chip } from "@heroui/react";
import { Film, UtensilsCrossed, Wine, ArrowRight } from "lucide-react";
import CountUp from "react-countup";

interface GroupStats {
  totalWeeks: number;
  totalMovies: number;
  totalWinners: number;
  totalMembers: number;
  totalMeals: number;
  totalCocktails: number;
  totalDesserts: number;
  topGenre: { name: string; count: number } | null;
  signatureDrink: { name: string; count: number } | null;
  signatureMeal: { name: string; count: number } | null;
  activeSince: string;
  recentPosters: string[];
}

export interface PublicGroup {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  coverImagePath: string | null;
  owner: { id: number; username: string };
  stats: GroupStats;
}

const posterUrl = (path?: string | null) => {
  if (!path) return "/placeholder-poster.jpg";
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/w342${path}`;
};

const yearOf = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.getFullYear();
};

const Stat = ({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) => (
  <div className="flex flex-col items-center gap-1 rounded-xl bg-default-100 px-2 py-3 text-center">
    <span className="text-default-500">{icon}</span>
    <span className="text-xl font-bold leading-none text-foreground">
      <CountUp end={value} duration={1.6} enableScrollSpy scrollSpyOnce />
    </span>
    <span className="text-[10px] font-medium uppercase tracking-wide text-default-500">
      {label}
    </span>
  </div>
);

export default function PublicGroupCard({ group }: { group: PublicGroup }) {
  const { stats } = group;
  const posters = (stats.recentPosters || []).slice(0, 5);
  const moviesWatched = stats.totalWinners || stats.totalMovies;
  const since = yearOf(stats.activeSince);

  return (
    <NextLink
      href={`/browse/${group.slug}`}
      className="group block h-full rounded-2xl outline-none transition-transform duration-200 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-default-200 bg-content1 shadow-sm transition-shadow duration-200 group-hover:shadow-xl">
        {/* Poster collage header */}
        <div className="relative h-40 overflow-hidden bg-default-200">
          {posters.length > 0 ? (
            <div className="absolute inset-0 flex items-center justify-center gap-2 px-3">
              {posters.map((p, i) => (
                <img
                  key={`${group.id}-poster-${i}`}
                  src={posterUrl(p)}
                  alt=""
                  className="h-32 w-auto flex-shrink-0 rounded-md object-cover shadow-md transition-transform duration-300 group-hover:scale-105"
                  style={{
                    transform: `rotate(${(i - (posters.length - 1) / 2) * 4}deg)`,
                    zIndex: posters.length - Math.abs(i - (posters.length - 1) / 2),
                  }}
                  loading="lazy"
                />
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Film className="h-10 w-10 text-default-400" />
            </div>
          )}
          {/* Bottom fade into card body */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-content1 to-transparent" />
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div>
            <h3 className="text-lg font-bold leading-tight text-foreground">
              {group.name}
            </h3>
            <p className="mt-1 text-sm text-default-500">
              by {group.owner.username}
              {since ? ` · going since ${since}` : ""}
            </p>
          </div>

          {/* Stat trio */}
          <div className="grid grid-cols-3 gap-2">
            <Stat
              icon={<Film className="h-4 w-4" />}
              value={moviesWatched}
              label="movies watched"
            />
            <Stat
              icon={<UtensilsCrossed className="h-4 w-4" />}
              value={stats.totalMeals}
              label="dinners eaten"
            />
            <Stat
              icon={<Wine className="h-4 w-4" />}
              value={stats.totalCocktails}
              label="cocktails poured"
            />
          </div>

          {/* Flavor line */}
          {(stats.signatureMeal || stats.signatureDrink || stats.topGenre) && (
            <div className="flex flex-wrap gap-2">
              {stats.topGenre && (
                <Chip size="sm" variant="flat" color="primary">
                  {stats.topGenre.name}
                </Chip>
              )}
              {stats.signatureDrink && (
                <Chip size="sm" variant="flat">
                  🍸 {stats.signatureDrink.name}
                </Chip>
              )}
              {stats.signatureMeal && (
                <Chip size="sm" variant="flat">
                  🍽️ {stats.signatureMeal.name}
                </Chip>
              )}
            </div>
          )}

          {/* CTA affordance */}
          <div className="mt-auto flex items-center gap-1 pt-1 text-sm font-medium text-primary">
            <span>Take a look</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </NextLink>
  );
}
