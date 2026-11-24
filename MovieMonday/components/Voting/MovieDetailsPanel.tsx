"use client";

// Expandable movie info shown inside ballot cards so voters can learn about a
// movie without leaving the ballot. The open/close animation uses the CSS
// grid-rows 0fr → 1fr trick, so it animates to the content's real height
// with no measuring and no animation library.

import React from "react";
import { Chip, Skeleton } from "@heroui/react";
import { Clock, Clapperboard, Star } from "lucide-react";

import { VoteCandidateDetails } from "@/types/voting";

const profileUrl = (path: string | null) =>
  path ? `https://image.tmdb.org/t/p/w185${path}` : null;

const formatRuntime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;

  return h ? `${h}h ${m}m` : `${m}m`;
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

interface CollapseProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Height-animated wrapper. Content stays mounted so closing animates too. */
export function Collapse({ isOpen, children, className = "" }: CollapseProps) {
  return (
    <div
      aria-hidden={!isOpen}
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      } ${className}`}
      // Keep collapsed content out of the tab order
      {...(!isOpen ? { inert: "" as any } : {})}
    >
      <div className="overflow-hidden min-h-0">{children}</div>
    </div>
  );
}

interface MovieDetailsPanelProps {
  details: VoteCandidateDetails | undefined;
  loading: boolean;
  /** Hide the year/title row when the parent card already shows them */
  showMetaRow?: boolean;
}

export default function MovieDetailsPanel({
  details,
  loading,
  showMetaRow = true,
}: MovieDetailsPanelProps) {
  if (!details) {
    if (loading) {
      return (
        <div className="flex flex-col gap-2 py-1">
          <Skeleton className="h-3 w-1/2 rounded-lg" />
          <Skeleton className="h-3 w-full rounded-lg" />
          <Skeleton className="h-3 w-full rounded-lg" />
          <Skeleton className="h-3 w-3/4 rounded-lg" />
        </div>
      );
    }

    return (
      <p className="text-sm text-default-400 py-1">
        Couldn&apos;t load details for this one.
      </p>
    );
  }

  const hasMeta =
    !!details.runtime || details.voteAverage !== null || details.genres.length > 0;

  return (
    <div className="flex flex-col gap-3 text-left">
      {showMetaRow && hasMeta && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-default-500">
          {details.voteAverage !== null && details.voteAverage > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-foreground">
                {details.voteAverage.toFixed(1)}
              </span>
            </span>
          )}
          {!!details.runtime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatRuntime(details.runtime)}
            </span>
          )}
        </div>
      )}

      {details.genres.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {details.genres.slice(0, 4).map((g) => (
            <Chip key={g} size="sm" variant="flat">
              {g}
            </Chip>
          ))}
        </div>
      )}

      {details.tagline && (
        <p className="text-sm italic text-default-500">&ldquo;{details.tagline}&rdquo;</p>
      )}

      <p className="text-sm leading-relaxed text-default-700">
        {details.overview || "No summary available."}
      </p>

      {details.directors.length > 0 && (
        <p className="text-sm flex items-center gap-1.5">
          <Clapperboard className="h-4 w-4 text-default-400 flex-shrink-0" />
          <span className="text-default-500">Directed by</span>
          <span className="font-semibold">{details.directors.join(", ")}</span>
        </p>
      )}

      {details.cast.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-default-400 mb-2">
            Top billed
          </p>
          {/* Horizontal scroller — fits phones without wrapping into a wall */}
          <ul className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
            {details.cast.map((c) => {
              const img = profileUrl(c.profilePath);

              return (
                <li
                  key={`${c.name}-${c.character}`}
                  className="flex flex-col items-center w-16 flex-shrink-0 snap-start"
                >
                  {img ? (
                    <img
                      alt={c.name}
                      className="h-14 w-14 rounded-full object-cover ring-1 ring-default-200"
                      loading="lazy"
                      src={img}
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-default-100 flex items-center justify-center text-sm font-semibold text-default-500">
                      {initials(c.name)}
                    </div>
                  )}
                  <p className="text-[11px] font-medium leading-tight text-center mt-1 line-clamp-2">
                    {c.name}
                  </p>
                  {c.character && (
                    <p className="text-[10px] text-default-400 leading-tight text-center line-clamp-1">
                      {c.character}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}