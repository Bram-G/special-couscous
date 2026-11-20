"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Person = { id: number; name: string };

export type AnalyticsOverview = {
  totals: {
    movieMondays: number;
    moviesWatched: number;
    rejectedPicks: number;
    uniqueGenres: number;
    uniqueActors: number;
    uniqueDirectors: number;
  };
  /** Winners only — what the group actually watched. */
  genres: { name: string; count: number }[];
  winningActors: (Person & { wins: number })[];
  rejectedActors: (Person & { losses: number })[];
  winningDirectors: (Person & { wins: number })[];
  /** `id` is the TMDB movie id. */
  rejectedMovies: (Person & { losses: number })[];
  pickers: { name: string; winningPicks: number }[];
  meals: { name: string; count: number }[];
  cocktails: { name: string; count: number }[];
  desserts: { name: string; count: number }[];
};

/** Map an overview list onto the { name, value, id } shape the charts expect. */
export function toChart<T extends { name: string; id?: number }>(
  arr: T[] | undefined,
  valueKey: keyof T,
  topN?: number,
) {
  return (arr || []).slice(0, topN ?? arr?.length).map((d) => ({
    id: d.id,
    name: d.name,
    value: Number(d[valueKey]) || 0,
  }));
}

export function useAnalyticsOverview(limit = 12) {
  const { token } = useAuth();
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    setLoading(true);
    fetch(`${API_BASE_URL}/api/analytics/overview?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [token, limit]);

  return { data, loading };
}