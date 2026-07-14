// app/browse/[slug]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import NextLink from "next/link";
import { Spinner, Chip } from "@heroui/react";
import { Film, Users, CalendarHeart, Trophy, ArrowLeft } from "lucide-react";
import CountUp from "react-countup";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface MovieSelection {
  id: number;
  title: string;
  tmdbMovieId: number;
  posterPath: string | null;
  isWinner: boolean;
}

interface MovieMondayItem {
  id: number;
  date: string;
  slug: string | null;
  weekTheme: string | null;
  status: string;
  movieSelections: MovieSelection[];
}

interface GroupData {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  coverImagePath: string | null;
  owner: { id: number; username: string };
  members: { id: number; username: string }[];
  stats: {
    totalWeeks: number;
    totalMovies: number;
    totalWinners: number;
    totalMembers: number;
    activeSince: string;
  };
}

const posterUrl = (path?: string | null) => {
  if (!path) return "/placeholder-poster.jpg";
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/w342${path}`;
};

// Avoids UTC off-by-one day issues with plain "YYYY-MM-DD" strings
const parseLocalDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
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
  <div className="flex flex-col items-center gap-1 rounded-xl bg-default-100 px-3 py-4 text-center">
    <span className="text-default-500">{icon}</span>
    <span className="text-2xl font-bold leading-none text-foreground">
      <CountUp end={value} duration={1.4} enableScrollSpy scrollSpyOnce />
    </span>
    <span className="text-[10px] font-medium uppercase tracking-wide text-default-500">
      {label}
    </span>
  </div>
);

const MondayCard = ({ mm }: { mm: MovieMondayItem }) => {
  const winner = mm.movieSelections?.find((m) => m.isWinner);
  const formattedDate = parseLocalDate(mm.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const content = (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-default-200 bg-content1 shadow-sm transition-shadow duration-200 group-hover:shadow-xl">
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-default-200">
        <img
          src={posterUrl(winner?.posterPath)}
          alt={winner?.title || "No winner selected"}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {winner && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow">
            <Trophy className="h-3 w-3 fill-current" />
            Winner
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {formattedDate}
        </p>
        <p className="line-clamp-2 text-sm font-medium text-foreground">
          {mm.weekTheme || winner?.title || "Movie Monday"}
        </p>
      </div>
    </div>
  );

  if (!mm.slug) {
    // No individual slug yet — not clickable until it's generated
    return <div className="opacity-60">{content}</div>;
  }

  return (
    <NextLink
      href={`/public/${mm.slug}`}
      className="group block h-full rounded-2xl outline-none transition-transform duration-200 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-primary"
    >
      {content}
    </NextLink>
  );
};

export default function PublicGroupPage() {
  const params = useParams();
  const slug = (Array.isArray(params?.slug) ? params?.slug[0] : params?.slug) as
    | string
    | undefined;

  const [group, setGroup] = useState<GroupData | null>(null);
  const [movieMondays, setMovieMondays] = useState<MovieMondayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${API_BASE_URL}/api/movie-monday/browse/group/${slug}`
        );
        if (!res.ok) {
          if (active) setNotFound(true);
          return;
        }
        const data = await res.json();
        if (active) {
          setGroup(data.group || null);
          setMovieMondays(data.movieMondays || []);
        }
      } catch (err) {
        console.error("Error loading public group:", err);
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

  if (notFound || !group) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">Group not found</h1>
        <p className="text-default-500">
          This group may be private or the link may be incorrect.
        </p>
        <NextLink
          href="/browse"
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to all groups
        </NextLink>
      </div>
    );
  }

  const since = (() => {
    const d = new Date(group.stats?.activeSince);
    return Number.isNaN(d.getTime()) ? null : d.getFullYear();
  })();

  return (
    <div className="w-full">
      <div className="border-b border-default-100 bg-content1">
        <div className="container mx-auto max-w-5xl px-6 py-10">
          <NextLink
            href="/browse"
            className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-default-500 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            All groups
          </NextLink>

          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {group.name}
          </h1>
          {group.description && (
            <p className="mt-2 max-w-2xl text-default-600">
              {group.description}
            </p>
          )}
          {since && (
            <Chip size="sm" variant="flat" className="mt-3">
              Since {since}
            </Chip>
          )}

          <div className="mt-6 grid max-w-xl grid-cols-3 gap-3">
            <Stat
              icon={<Film className="h-4 w-4" />}
              value={group.stats?.totalWeeks || 0}
              label="Mondays"
            />
            <Stat
              icon={<CalendarHeart className="h-4 w-4" />}
              value={group.stats?.totalWinners || group.stats?.totalMovies || 0}
              label="Movies"
            />
            <Stat
              icon={<Users className="h-4 w-4" />}
              value={group.stats?.totalMembers || 0}
              label="Members"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-6 py-10">
        {movieMondays.length === 0 ? (
          <p className="text-default-500">
            No Movie Mondays to show yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {movieMondays.map((mm) => (
              <MondayCard key={mm.id} mm={mm} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}