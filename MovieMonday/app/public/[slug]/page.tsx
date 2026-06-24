// app/public/[slug]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { Button, Chip, Spinner } from "@heroui/react";
import {
  ArrowLeft,
  Star,
  Trophy,
  UtensilsCrossed,
  Wine,
  IceCream,
  User as UserIcon,
  Sparkles,
  Clapperboard,
} from "lucide-react";
import CommentSection from "@/components/Comments/CommentSection";
import MovieMondayRating from "@/components/MovieMonday/MovieMondayRating";

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
  tmdbMovieId: number;
  title: string;
  posterPath: string | null;
  isWinner: boolean;
  genres?: unknown;
  releaseYear?: number | null;
  cast?: Cast[];
  crew?: Crew[];
}
interface EventDetails {
  meals?: unknown;
  cocktails?: unknown;
  desserts?: unknown;
}
interface MovieMonday {
  id: number;
  slug: string;
  date: string;
  weekTheme: string | null;
  picker?: { id: number; username: string } | null;
  movieSelections: Selection[];
  eventDetails?: EventDetails | null;
  Group?: { id: number; name: string; slug: string } | null;
}

const posterUrl = (path?: string | null, size: "w342" | "w500" = "w500") =>
  !path
    ? "/placeholder-poster.jpg"
    : path.startsWith("http")
      ? path
      : `https://image.tmdb.org/t/p/${size}${path}`;

const parseLocalDate = (s: string) => {
  const [y, m, d] = String(s).split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
};

// meals/cocktails/desserts/genres can be arrays or JSON strings
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

const directorOf = (m: Selection) =>
  (m.crew || []).find((c) => c.job === "Director")?.name;

// Build a short, human recap + a few "did you notice" facts from the picks
// themselves — shared people/genres across the night and who took it.
function buildRecap(selections: Selection[]): {
  blurb: string | null;
  facts: string[];
} {
  if (!selections || selections.length === 0)
    return { blurb: null, facts: [] };

  const total = selections.length;
  const winner = selections.find((s) => s.isWinner);

  // Count distinct people / genres across the night (dedupe within a movie)
  const tally = (
    pick: (s: Selection) => string[]
  ): { name: string; count: number }[] => {
    const counts = new Map<string, number>();
    selections.forEach((s) => {
      const seen = new Set<string>();
      pick(s).forEach((name) => {
        if (!name || seen.has(name)) return;
        seen.add(name);
        counts.set(name, (counts.get(name) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .filter((x) => x.count >= 2)
      .sort((a, b) => b.count - a.count);
  };

  const actors = tally((s) => (s.cast || []).slice(0, 8).map((c) => c.name));
  const directors = tally((s) =>
    (s.crew || []).filter((c) => c.job === "Director").map((c) => c.name)
  );
  const genres = tally((s) => normalizeList(s.genres));

  const facts: string[] = [];

  const topGenre = genres[0];
  if (topGenre && topGenre.count === total) {
    facts.push(`All ${total} picks are ${topGenre.name.toLowerCase()} films.`);
  } else if (topGenre) {
    facts.push(
      `${topGenre.count} of the night's picks share the ${topGenre.name.toLowerCase()} genre.`
    );
  }

  const topActor = actors[0];
  if (topActor) {
    facts.push(
      topActor.count === total
        ? `${topActor.name} appears in every film tonight.`
        : `${topActor.name} shows up in ${topActor.count} of the picks.`
    );
  }

  const topDirector = directors[0];
  if (topDirector) {
    facts.push(
      `${topDirector.name} directed ${topDirector.count} of the night's films.`
    );
  }

  // Compose a one/two sentence blurb
  const parts: string[] = [];
  if (topGenre && topGenre.count === total) {
    parts.push(`A ${topGenre.name.toLowerCase()} night through and through`);
  } else if (topGenre) {
    parts.push(`A night leaning ${topGenre.name.toLowerCase()}`);
  } else {
    parts.push(`Three films on the table`);
  }
  if (winner) parts.push(`${winner.title} took the win`);

  const blurb = parts.length ? `${parts.join(", and ")}.` : null;

  return { blurb, facts };
}

// Wrapping pill — long names wrap instead of overflowing the column
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
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={`${label}-${i}`}
            className="inline-block max-w-full whitespace-normal break-words rounded-full bg-default-100 px-3 py-1 text-sm text-default-700"
          >
            {item}
          </span>
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

  const recap = useMemo(
    () => buildRecap(monday?.movieSelections || []),
    [monday]
  );

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
          This page may be private or the link may be incorrect.
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

  const winner = monday.movieSelections.find((m) => m.isWinner);
  const winnerGenres = winner ? normalizeList(winner.genres) : [];
  const winnerDirector = winner ? directorOf(winner) : undefined;

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

      {/* ── Hero: winner-forward ── */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end">
        {winner && (
          <NextLink
            href={`/movie/${winner.tmdbMovieId}`}
            className="group relative w-40 flex-shrink-0 self-center sm:self-auto"
          >
            <img
              src={posterUrl(winner.posterPath)}
              alt={winner.title}
              className="aspect-[2/3] w-full rounded-2xl object-cover shadow-lg ring-1 ring-primary transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow">
              <Trophy className="h-3 w-3 fill-current" />
              Winner
            </span>
          </NextLink>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {formattedDate}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {monday.weekTheme || (winner ? winner.title : "Movie Monday")}
          </h1>

          {recap.blurb && (
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-default-600">
              {recap.blurb}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-default-500">
            {monday.picker?.username && (
              <span className="flex items-center gap-1.5">
                <UserIcon className="h-4 w-4" />
                Picked by {monday.picker.username}
              </span>
            )}
            {winnerDirector && (
              <span className="flex items-center gap-1.5">
                <Clapperboard className="h-4 w-4" />
                Dir. {winnerDirector}
              </span>
            )}
          </div>

          {winnerGenres.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {winnerGenres.map((g) => (
                <Chip key={g} size="sm" variant="flat" color="primary">
                  {g}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Rating ── */}
      <div className="mb-12">
        <MovieMondayRating movieMondayId={monday.id} />
      </div>

      {/* ── The lineup ── */}
      <h2 className="mb-4 text-lg font-bold text-foreground">The lineup</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
        {monday.movieSelections.map((m) => {
          const director = directorOf(m);
          return (
            <NextLink
              key={m.id}
              href={`/movie/${m.tmdbMovieId}`}
              className={`group block overflow-hidden rounded-2xl border bg-content1 outline-none transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary ${
                m.isWinner
                  ? "border-primary ring-1 ring-primary"
                  : "border-default-200"
              }`}
            >
              <div className="relative">
                <img
                  src={posterUrl(m.posterPath)}
                  alt={m.title}
                  className="aspect-[2/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                {m.isWinner && (
                  <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow">
                    <Star className="h-3 w-3 fill-current" />
                    Winner
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold leading-tight text-foreground group-hover:text-primary">
                  {m.title}
                </h3>
                {director && (
                  <p className="mt-1 text-sm text-default-500">Dir. {director}</p>
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
            </NextLink>
          );
        })}
      </div>

      {/* ── Did you notice ── */}
      {recap.facts.length > 0 && (
        <div className="mt-8 rounded-2xl border border-default-200 bg-content1 p-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Did you notice
          </h2>
          <ul className="flex flex-col gap-2">
            {recap.facts.map((fact, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-default-600"
              >
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                {fact}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Menu ── */}
      {hasMenu ? (
        <div className="mt-8 rounded-2xl border border-default-200 bg-content1 p-6">
          <h2 className="mb-5 text-lg font-bold text-foreground">On the menu</h2>
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

      {/* ── Comments ── */}
      <div className="mt-12">
        <CommentSection
          contentType="moviemonday"
          contentId={monday.id}
          contentTitle={monday.weekTheme || winner?.title || "Movie Monday"}
        />
      </div>
    </div>
  );
}