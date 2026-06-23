// app/public/[slug]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { Button, Chip, Spinner } from "@heroui/react";
import {
  ArrowLeft,
  Star,
  UtensilsCrossed,
  Wine,
  IceCream,
  User as UserIcon,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Crew {
  id: number;
  personId: number;
  name: string;
  job: string;
}
interface Cast {
  id: number;
  actorId: number;
  name: string;
  character: string;
  profilePath: string | null;
}
interface Selection {
  id: number;
  title: string;
  posterPath: string | null;
  isWinner: boolean;
  cast?: Cast[];
  crew?: Crew[];
}
interface EventDetails {
  meals?: unknown;
  cocktails?: unknown;
  desserts?: unknown;
}
interface MovieMonday {
  slug: string;
  date: string;
  weekTheme: string | null;
  picker?: { id: number; username: string } | null;
  movieSelections: Selection[];
  eventDetails?: EventDetails | null;
  Group?: { id: number; name: string; slug: string } | null;
}

const posterUrl = (path?: string | null) =>
  !path
    ? "/placeholder-poster.jpg"
    : path.startsWith("http")
      ? path
      : `https://image.tmdb.org/t/p/w500${path}`;

const parseLocalDate = (s: string) => {
  const [y, m, d] = String(s).split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
};

// meals/cocktails/desserts can be arrays or JSON strings
const normalizeList = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return value.trim() ? [value] : [];
    }
  }
  return [];
};

const MenuBlock = ({
  icon,
  label,
  items,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
}) => {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <Chip key={`${label}-${i}`} size="sm" variant="flat">
            {item}
          </Chip>
        ))}
      </div>
    </div>
  );
};

export default function PublicMovieMondayPage() {
  const params = useParams();
  const slug = (Array.isArray(params?.slug) ? params?.slug[0] : params?.slug) as
    | string
    | undefined;

  const [monday, setMonday] = useState<MovieMonday | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${API_BASE_URL}/api/movie-monday/public/${slug}`
        );
        if (!res.ok) {
          if (active) setNotFound(true);
          return;
        }
        const data = await res.json();
        if (active) setMonday(data.movieMonday || null);
      } catch (err) {
        console.error("Error loading public Movie Monday:", err);
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound || !monday) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Movie Monday not found
        </h1>
        <p className="text-default-500">
          This night may be private or the link may be incorrect.
        </p>
        <Button as={NextLink} href="/" variant="flat" color="primary">
          Back home
        </Button>
      </div>
    );
  }

  const meals = normalizeList(monday.eventDetails?.meals);
  const cocktails = normalizeList(monday.eventDetails?.cocktails);
  const desserts = normalizeList(monday.eventDetails?.desserts);
  const hasMenu = meals.length || cocktails.length || desserts.length;

  const directorOf = (m: Selection) =>
    (m.crew || []).find((c) => c.job === "Director")?.name;

  const formattedDate = parseLocalDate(monday.date).toLocaleDateString(
    "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="container mx-auto max-w-5xl px-6 py-8">
      {/* Back to the group's calendar */}
      {monday.Group?.slug && (
        <Button
          as={NextLink}
          href={`/browse/${monday.Group.slug}`}
          variant="light"
          size="sm"
          startContent={<ArrowLeft className="h-4 w-4" />}
          className="mb-4"
        >
          {monday.Group.name}
        </Button>
      )}

      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {formattedDate}
        </p>
        {monday.weekTheme && (
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {monday.weekTheme}
          </h1>
        )}
        {monday.picker?.username && (
          <p className="mt-2 flex items-center gap-1.5 text-default-500">
            <UserIcon className="h-4 w-4" />
            Picked by {monday.picker.username}
          </p>
        )}
      </div>

      {/* Movies */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
        {monday.movieSelections.map((m) => {
          const director = directorOf(m);
          return (
            <div
              key={m.id}
              className={`overflow-hidden rounded-2xl border bg-content1 ${
                m.isWinner
                  ? "border-primary ring-1 ring-primary"
                  : "border-default-200"
              }`}
            >
              <div className="relative">
                <img
                  src={posterUrl(m.posterPath)}
                  alt={m.title}
                  className="aspect-[2/3] w-full object-cover"
                />
                {m.isWinner && (
                  <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow">
                    <Star className="h-3 w-3 fill-current" />
                    Winner
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold leading-tight text-foreground">
                  {m.title}
                </h3>
                {director && (
                  <p className="mt-1 text-sm text-default-500">
                    Dir. {director}
                  </p>
                )}
                {(m.cast || []).length > 0 && (
                  <p className="mt-2 line-clamp-2 text-xs text-default-400">
                    {(m.cast || [])
                      .slice(0, 3)
                      .map((c) => c.name)
                      .join(", ")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Menu */}
      {hasMenu ? (
        <div className="mt-10 rounded-2xl border border-default-200 bg-content1 p-6">
          <h2 className="mb-5 text-lg font-bold text-foreground">
            On the menu
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <MenuBlock
              icon={<UtensilsCrossed className="h-4 w-4" />}
              label="Dinner"
              items={meals}
            />
            <MenuBlock
              icon={<Wine className="h-4 w-4" />}
              label="Cocktails"
              items={cocktails}
            />
            <MenuBlock
              icon={<IceCream className="h-4 w-4" />}
              label="Dessert"
              items={desserts}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
