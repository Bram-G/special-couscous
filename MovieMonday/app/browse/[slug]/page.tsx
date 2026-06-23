// app/browse/[slug]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { Button, Chip, Spinner, Tooltip } from "@heroui/react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Star,
  Film,
  UtensilsCrossed,
  Wine,
  Users,
  CalendarDays,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const monthKeyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const posterUrl = (path?: string | null) =>
  !path
    ? "/placeholder-poster.jpg"
    : path.startsWith("http")
      ? path
      : `https://image.tmdb.org/t/p/w185${path}`;

// Renders the 3 (or fewer) posters with the winner ringed + starred
const MondayPosters = ({
  movies,
  size = "sm",
}: {
  movies: Selection[];
  size?: "sm" | "lg";
}) => {
  const dims = size === "lg" ? "w-14 h-20" : "w-8 h-12";
  return (
    <div className="flex -space-x-3">
      {movies.slice(0, 3).map((m) => (
        <div key={m.id} className="relative">
          <img
            src={posterUrl(m.posterPath)}
            alt={m.title}
            loading="lazy"
            className={`${dims} flex-shrink-0 rounded-sm object-cover ring-1 ring-background ${
              m.isWinner ? "z-10 ring-2 ring-primary" : ""
            }`}
          />
          {m.isWinner && (
            <span className="absolute -right-1 -top-1 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Star className="h-2.5 w-2.5 fill-current" />
            </span>
          )}
        </div>
      ))}
    </div>
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
  const [monthIdx, setMonthIdx] = useState(0);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const [calRes, headRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/movie-monday/browse/group/${slug}/calendar`),
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

  // Map every Monday by its date key for O(1) cell lookup
  const mondaysByDay = useMemo(() => {
    const map: Record<string, CalendarMonday> = {};
    mondays.forEach((m) => {
      map[dateKey(parseLocalDate(m.date))] = m;
    });
    return map;
  }, [mondays]);

  // Distinct months that actually contain Mondays, oldest → newest
  const monthKeys = useMemo(() => {
    const set = new Set(mondays.map((m) => monthKeyOf(parseLocalDate(m.date))));
    return Array.from(set).sort();
  }, [mondays]);

  // Default to the most recent month once data lands
  useEffect(() => {
    if (monthKeys.length) setMonthIdx(monthKeys.length - 1);
  }, [monthKeys.length]);

  const activeMonthKey = monthKeys[monthIdx];

  // Build the grid cells for the active month
  const { cells, monthLabel, monthMondays } = useMemo(() => {
    if (!activeMonthKey)
      return { cells: [], monthLabel: "", monthMondays: [] as CalendarMonday[] };

    const [y, m] = activeMonthKey.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const daysInMonth = new Date(y, m, 0).getDate();
    const lead = first.getDay(); // 0 = Sunday

    const grid: Array<{ day: number; date: Date } | null> = [];
    for (let i = 0; i < lead; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push({ day: d, date: new Date(y, m - 1, d) });

    const label = first.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const inMonth = mondays
      .filter((mm) => monthKeyOf(parseLocalDate(mm.date)) === activeMonthKey)
      .sort(
        (a, b) =>
          parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime()
      );

    return { cells: grid, monthLabel: label, monthMondays: inMonth };
  }, [activeMonthKey, mondays]);

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

      {/* ── Calendar ── */}
      <div className="container mx-auto px-6 py-10">
        {monthKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <CalendarDays className="h-10 w-10 text-default-400" />
            <p className="text-default-500">No Movie Mondays to show yet.</p>
          </div>
        ) : (
          <>
            {/* Month switcher */}
            <div className="mb-6 flex items-center justify-between">
              <Button
                isIconOnly
                variant="flat"
                isDisabled={monthIdx === 0}
                onPress={() => setMonthIdx((i) => Math.max(0, i - 1))}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground">
                  {monthLabel}
                </h2>
                <Chip size="sm" variant="flat" color="primary">
                  {monthMondays.length} Monday
                  {monthMondays.length === 1 ? "" : "s"}
                </Chip>
              </div>
              <Button
                isIconOnly
                variant="flat"
                isDisabled={monthIdx === monthKeys.length - 1}
                onPress={() =>
                  setMonthIdx((i) => Math.min(monthKeys.length - 1, i + 1))
                }
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* ── Desktop / tablet: full month grid ── */}
            <div className="hidden md:block">
              <div className="mb-2 grid grid-cols-7 gap-2">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-semibold uppercase tracking-wide text-default-400"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {cells.map((cell, i) => {
                  if (!cell)
                    return <div key={`blank-${i}`} className="min-h-[96px]" />;

                  const key = dateKey(cell.date);
                  const monday = mondaysByDay[key];
                  const isMonday = cell.date.getDay() === 1;

                  if (monday) {
                    return (
                      <Tooltip
                        key={key}
                        content={monday.weekTheme || "View this Monday"}
                        placement="top"
                      >
                        <NextLink
                          href={`/public/${monday.slug}`}
                          className="group flex min-h-[96px] flex-col rounded-xl border border-primary/40 bg-primary/5 p-2 outline-none transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <span className="mb-1 text-xs font-semibold text-primary">
                            {cell.day}
                          </span>
                          <div className="flex flex-1 items-center justify-center">
                            <MondayPosters movies={monday.movieSelections} />
                          </div>
                          {monday.weekTheme && (
                            <span className="mt-1 truncate text-[10px] text-default-500">
                              {monday.weekTheme}
                            </span>
                          )}
                        </NextLink>
                      </Tooltip>
                    );
                  }

                  return (
                    <div
                      key={key}
                      className={`flex min-h-[96px] flex-col rounded-xl p-2 ${
                        isMonday
                          ? "border border-dashed border-default-200"
                          : ""
                      }`}
                    >
                      <span className="text-xs text-default-400">{cell.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Mobile: vertical list of the month's Mondays ── */}
            <div className="flex flex-col gap-3 md:hidden">
              {monthMondays.length === 0 ? (
                <p className="py-8 text-center text-default-500">
                  No Mondays this month.
                </p>
              ) : (
                monthMondays.map((monday) => (
                  <NextLink
                    key={monday.id}
                    href={`/public/${monday.slug}`}
                    className="flex items-center gap-4 rounded-xl border border-default-200 bg-content1 p-3 active:scale-[0.99]"
                  >
                    <MondayPosters movies={monday.movieSelections} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">
                        {parseLocalDate(monday.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      {monday.weekTheme && (
                        <p className="truncate text-sm text-default-500">
                          {monday.weekTheme}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 flex-shrink-0 text-default-400" />
                  </NextLink>
                ))
              )}
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center gap-2 text-xs text-default-500">
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