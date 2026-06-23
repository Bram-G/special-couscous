// components/HomePage/PublicGroupsShowcase.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Skeleton } from "@heroui/react";
import { Popcorn } from "lucide-react";

import PublicGroupCard, { PublicGroup } from "./PublicGroupCard";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CardSkeleton = () => (
  <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-default-200 bg-content1">
    <Skeleton className="h-40 w-full" />
    <div className="flex flex-1 flex-col gap-4 p-5">
      <Skeleton className="h-5 w-2/3 rounded-lg" />
      <Skeleton className="h-4 w-1/2 rounded-lg" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  </div>
);

export default function PublicGroupsShowcase() {
  const [groups, setGroups] = useState<PublicGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/movie-monday/browse/groups`
        );
        if (!res.ok) throw new Error("Failed to load groups");
        const data = await res.json();
        if (active) setGroups(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading public groups:", err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Hide the whole section if there's genuinely nothing to show
  if (!loading && (error || groups.length === 0)) return null;

  return (
    <section id="public-groups" className="w-full bg-background py-20">
      <div className="container mx-auto px-6">
        <div className="mb-10 max-w-2xl">
          <span className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
            <Popcorn className="h-4 w-4" />
            See what&apos;s playing
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Peek at real Movie Monday groups
          </h2>
          <p className="mt-3 text-lg text-default-600">
            No account needed. Browse the films they&apos;ve watched, the
            dinners they&apos;ve cooked, and the drinks they&apos;ve poured —
            then start your own.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={`sk-${i}`} />
              ))
            : groups.map((group) => (
                <PublicGroupCard key={group.id} group={group} />
              ))}
        </div>
      </div>
    </section>
  );
}
