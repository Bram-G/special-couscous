"use client";

import { useCallback, useRef, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type DrilldownType =
  | "genre"
  | "actor"
  | "director"
  | "movie"
  | "picker"
  | "meal"
  | "cocktail"
  | "dessert";

export type DrilldownOutcome = "won" | "lost" | "all";

export interface DrilldownMovie {
  tmdbMovieId: number;
  title: string;
  posterPath: string | null;
  releaseYear?: number | null;
  /** How many selections matched the filter (drives the "×3" badge). */
  count: number;
  wins: number;
  losses: number;
  lastDate: string | null;
}

export interface DrilldownRequest {
  type: DrilldownType;
  /** Person id / tmdb id for actor, director, movie; name for everything else. */
  key: string | number;
  outcome?: DrilldownOutcome;
  /** Display label, e.g. "Brad Pitt". */
  label: string;
}

function buildTitle({ type, outcome = "won", label }: DrilldownRequest) {
  const won = outcome === "won";
  const lost = outcome === "lost";

  switch (type) {
    case "actor":
      return won
        ? `Winning movies featuring ${label}`
        : lost
          ? `Rejected movies featuring ${label}`
          : `Movies featuring ${label}`;
    case "director":
      return won
        ? `Winning movies directed by ${label}`
        : lost
          ? `Rejected movies directed by ${label}`
          : `Movies directed by ${label}`;
    case "genre":
      return won ? `${label} movies you watched` : `${label} movies`;
    case "movie":
      return lost ? `${label} — times it lost` : label;
    case "picker":
      return `Winning movies from ${label}'s nights`;
    case "meal":
      return `Watched while eating ${label}`;
    case "cocktail":
      return `Watched while drinking ${label}`;
    case "dessert":
      return `Watched with ${label} for dessert`;
    default:
      return label;
  }
}

/**
 * Shared drill-down state for any analytics chart. Call `open()` from a bar /
 * slice click; spread `modalProps` onto <MovieDetailsModal />.
 */
export function useAnalyticsDrilldown() {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState<DrilldownMovie[]>([]);
  const [request, setRequest] = useState<DrilldownRequest | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const open = useCallback(
    async (req: DrilldownRequest) => {
      // "Other" is a pie-chart rollup, not a real item.
      if (!token || req.key === "" || req.key == null || req.label === "Other") {
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();

      abortRef.current = controller;

      const outcome = req.outcome ?? "won";

      setRequest({ ...req, outcome });
      setMovies([]);
      setLoading(true);
      setIsOpen(true);

      try {
        const params = new URLSearchParams({
          type: req.type,
          key: String(req.key),
          outcome,
        });
        const res = await fetch(
          `${API_BASE_URL}/api/analytics/movies?${params}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );
        const data = res.ok ? await res.json() : { movies: [] };

        setMovies(data.movies || []);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Analytics drill-down failed:", err);
          setMovies([]);
        }
      } finally {
        if (abortRef.current === controller) setLoading(false);
      }
    },
    [token],
  );

  const close = useCallback(() => {
    abortRef.current?.abort();
    setIsOpen(false);
  }, []);

  return {
    open,
    modalProps: {
      isOpen,
      onClose: close,
      loading,
      movies,
      outcome: request?.outcome ?? "won",
      title: request ? buildTitle(request) : "",
    },
  };
}