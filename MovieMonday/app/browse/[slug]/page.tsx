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