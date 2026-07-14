// app/browse/[slug]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { Button, Chip, Spinner } from "@heroui/react";
import {
  ArrowLeft,
  Star,
  Film,
  UtensilsCrossed,
  Wine,
  Users,
  CalendarDays,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Selection {
  id: number;
  title: string;
  posterPath: string | null;
  isWinner: boolean;
}
interface CalendarMonday {
  id: number;
  date: string;
  slug: string;
  weekTheme: string | null;
  status: string;
  movieSelections: Selection[];
}
interface GroupHeader {
  name: string;
  description: string | null;
  owner: { id: number; username: string };
  stats: {
    totalWeeks: number;
    totalMovies: number;
    totalWinners: number;
    totalMembers: number;
    totalMeals: number;
    totalCocktails: number;
    activeSince: string;
  };
}

// Parse "YYYY-MM-DD" (or ISO) as a LOCAL date to avoid timezone day-shift
const parseLocalDate = (s: string) => {
  const [y, m, d] = String(s).split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
};
const monthKeyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const posterUrl = (path?: string | null) =>
  !path
    ? "/placeholder-poster.jpg"
    : path.startsWith("http")
      ? path
      : `https://image.tmdb.org/t/p/w342${path}`;

// Reorder up to 3 posters so the winner sits in the middle of the fan
const orderPosters = (movies: Selection[]): Selection[] => {
  const arr = movies.slice(0, 3);
  const wIdx = arr.findIndex((m) => m.isWinner);
  if (wIdx <= 0) return arr;
  const [winner] = arr.splice(wIdx, 1);
  arr.splice(Math.floor(arr.length / 2), 0, winner);
  return arr;
};

// One Monday rendered as a poster-collage card (winner centered, ringed, starred)
const MondayCard = ({ monday }: { monday: CalendarMonday }) => {
  const posters = orderPosters(monday.movieSelections);
  const date = parseLocalDate(monday.date);
  const winner = monday.movieSelections.find((m) => m.isWinner);

  return (
    <NextLink
      href={`/public/${monday.slug}`}
      className="group block h-full rounded-2xl outline-none transition-transform duration-200 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-default-200 bg-content1 shadow-sm transition-shadow duration-200 group-hover:shadow-xl">
        {/* Fanned poster header — posters rotate out and clip at the edges */}
        <div className="relative h-44 overflow-hidden bg-default-200">
          {posters.length > 0 ? (
            <div className="absolute inset-0 flex items-center justify-center px-4">
              {posters.map((m, i) => {
                const offset = i - (posters.length - 1) / 2;
                return (
                  <div
                    key={`${monday.id}-${m.id}`}
                    className={`relative -mx-2 flex-shrink-0 ${
                      m.isWinner ? "z-10" : ""
                    }`}
                    style={{
                      transform: `rotate(${offset * 7}deg) translateY(${
                        Math.abs(offset) * 8
                      }px)`,
                      zIndex: posters.length - Math.abs(offset),
                    }}
                  >
                    <img
                      src={posterUrl(m.posterPath)}
                      alt={m.title}
                      loading="lazy"
                      className={`h-36 w-auto rounded-md object-cover shadow-md transition-transform duration-300 group-hover:scale-105 ${
                        m.isWinner
                          ? "ring-2 ring-primary"
                          : "ring-1 ring-black/10"
                      }`}
                    />
                    {m.isWinner && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                        <Star className="h-3 w-3 fill-current" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Film className="h-10 w-10 text-default-400" />
            </div>
          )}
          {/* Fade the bottom of the collage into the card body */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-content1 to-transparent" />
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-0.5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {date.toLocaleDateString("en-US", { weekday: "long" })}
          </p>
          <p className="text-lg font-bold leading-tight text-foreground">
            {date.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
            })}
          </p>
          {monday.weekTheme ? (
            <p className="mt-1 line-clamp-2 text-sm text-default-500">
              {monday.weekTheme}
            </p>
          ) : winner ? (
            <p className="mt-1 line-clamp-1 text-sm text-default-500">
              Winner:{" "}
              <span className="text-foreground">{winner.title}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-default-400">
              {monday.movieSelections.length} nominated
            </p>
          )}
        </div>
      </div>
    </NextLink>
  );
};

export default function GroupCalendarPage() {
  const params = useParams();
  const slug = (Array.isArray(params?.slug) ? params?.slug[0] : params?.slug) as
    | string
    | undefined;

  const [header, setHeader] = useState<GroupHeader | null>(null);
  const [mondays, setMondays] = useState<CalendarMonday[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const [calRes, headRes] = await Promise.all([
          fetch(
            `${API_BASE_URL}/api/movie-monday/browse/group/${slug}/calendar`
          ),
          fetch(`${API_BASE_URL}/api/movie-monday/browse/group/${slug}`),
        ]);

        if (!calRes.ok) {
          if (active) setNotFound(true);
          return;
        }
        const calData = await calRes.json();
        if (active) setMondays(calData.movieMondays || []);

        if (headRes.ok) {
          const headData = await headRes.json();
          if (active) setHeader(headData.group || null);
        }
      } catch (err) {
        console.error("Error loading group calendar:", err);
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  // Group Mondays into month sections, newest month first and newest Monday
  // first within each — no empty day cells, every card is an actual Monday
  const monthSections = useMemo(() => {
    const map = new Map<string, CalendarMonday[]>();
    mondays.forEach((m) => {
      const key = monthKeyOf(parseLocalDate(m.date));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });

    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, list]) => {
        const [y, mo] = key.split("-").map(Number);
        return {
          key,
          label: new Date(y, mo - 1, 1).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
          mondays: list.sort(
            (a, b) =>
              parseLocalDate(b.date).getTime() -
              parseLocalDate(a.date).getTime()
          ),
        };
      });
  }, [mondays]);

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">Group not found</h1>
        <p className="text-default-500">
          This group may be private or the link may be incorrect.
        </p>
        <Button as={NextLink} href="/" variant="flat" color="primary">
          Back home
        </Button>
      </div>
    );
  }

  const stats = header?.stats;
  const since = stats ? parseLocalDate(stats.activeSince).getFullYear() : null;

  return (
    <div className="w-full">
      {/* ── Header ── */}
      <div className="border-b border-default-100 bg-content1">
        <div className="container mx-auto px-6 py-8">
          <Button
            as={NextLink}
            href="/"
            variant="light"
            size="sm"
            startContent={<ArrowLeft className="h-4 w-4" />}
            className="mb-4"
          >
            All groups
          </Button>

          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {header?.name || "Movie Monday"}
          </h1>
          <p className="mt-1 text-default-500">
            by {header?.owner?.username}
            {since ? ` · going since ${since}` : ""}
          </p>
          {header?.description && (
            <p className="mt-3 max-w-2xl text-default-600">
              {header.description}
            </p>
          )}

          {stats && (
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <span className="flex items-center gap-2 text-default-600">
                <CalendarDays className="h-4 w-4 text-primary" />
                <strong className="text-foreground">{stats.totalWeeks}</strong>{" "}
                Mondays
              </span>
              <span className="flex items-center gap-2 text-default-600">
                <Film className="h-4 w-4 text-primary" />
                <strong className="text-foreground">
                  {stats.totalWinners || stats.totalMovies}
                </strong>{" "}
                movies watched
              </span>
              <span className="flex items-center gap-2 text-default-600">
                <UtensilsCrossed className="h-4 w-4 text-primary" />
                <strong className="text-foreground">{stats.totalMeals}</strong>{" "}
                dinners eaten
              </span>
              <span className="flex items-center gap-2 text-default-600">
                <Wine className="h-4 w-4 text-primary" />
                <strong className="text-foreground">
                  {stats.totalCocktails}
                </strong>{" "}
                cocktails poured
              </span>
              <span className="flex items-center gap-2 text-default-600">
                <Users className="h-4 w-4 text-primary" />
                <strong className="text-foreground">
                  {stats.totalMembers}
                </strong>{" "}
                members
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Mondays, grouped by month ── */}
      <div className="container mx-auto px-6 py-10">
        {monthSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Film className="h-10 w-10 text-default-300" />
            <p className="text-default-500">
              This group hasn&apos;t shared any Mondays yet.
            </p>
          </div>
        ) : (
          <>
            {monthSections.map((section) => (
              <section key={section.key} className="mb-12 last:mb-0">
                <div className="mb-5 flex items-center gap-3">
                  <h2 className="text-xl font-bold text-foreground">
                    {section.label}
                  </h2>
                  <Chip size="sm" variant="flat">
                    {section.mondays.length} Monday
                    {section.mondays.length === 1 ? "" : "s"}
                  </Chip>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {section.mondays.map((monday) => (
                    <MondayCard key={monday.id} monday={monday} />
                  ))}
                </div>
              </section>
            ))}

            {/* Legend */}
            <div className="mt-10 flex items-center gap-2 text-xs text-default-500">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Star className="h-2.5 w-2.5 fill-current" />
              </span>
              marks the movie the group voted in that night
            </div>
          </>
        )}
      </div>
    </div>
  );
}