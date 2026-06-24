// components/MovieMonday/MovieMondayRating.tsx
"use client";

import React, { useEffect, useState } from "react";
import NextLink from "next/link";
import { Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  movieMondayId: number;
}

export default function MovieMondayRating({ movieMondayId }: Props) {
  const { token } = useAuth();
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const isLoggedIn = !!token;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const headers: HeadersInit = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(
          `${API_BASE_URL}/api/ratings/moviemonday/${movieMondayId}`,
          { headers }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setAverage(data.average || 0);
        setCount(data.count || 0);
        setUserRating(data.userRating ?? null);
      } catch (err) {
        console.error("Error loading rating:", err);
      }
    })();
    return () => {
      active = false;
    };
  }, [movieMondayId, token]);

  const submit = async (value: number) => {
    if (!token || saving) return;
    const previous = userRating;
    setUserRating(value); // optimistic
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/ratings/moviemonday/${movieMondayId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rating: value }),
        }
      );
      if (!res.ok) throw new Error("Failed to save rating");
      const data = await res.json();
      setAverage(data.average || 0);
      setCount(data.count || 0);
      setUserRating(data.userRating ?? value);
    } catch (err) {
      console.error("Error saving rating:", err);
      setUserRating(previous); // revert
    } finally {
      setSaving(false);
    }
  };

  // Logged-in users see their own rating (with hover preview); logged-out
  // visitors see the rounded average rendered as read-only stars.
  const displayValue = isLoggedIn
    ? hover ?? userRating ?? 0
    : Math.round(average);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-default-200 bg-content1 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-foreground">
          {count > 0 ? average.toFixed(1) : "—"}
        </span>
        <span className="text-sm text-default-500">
          / 5 · {count} {count === 1 ? "rating" : "ratings"}
        </span>
      </div>

      <div className="flex flex-col items-start gap-1 sm:items-end">
        <div className="flex gap-1" onMouseLeave={() => setHover(null)}>
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= displayValue;
            return (
              <button
                key={star}
                type="button"
                disabled={!isLoggedIn || saving}
                aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
                onMouseEnter={() => isLoggedIn && setHover(star)}
                onClick={() => submit(star)}
                className={`transition-transform ${
                  isLoggedIn
                    ? "cursor-pointer hover:scale-110"
                    : "cursor-default"
                }`}
              >
                <Star
                  className={`h-7 w-7 ${
                    filled
                      ? "fill-primary text-primary"
                      : "text-default-300"
                  }`}
                />
              </button>
            );
          })}
        </div>
        {isLoggedIn ? (
          <span className="text-xs text-default-500">
            {userRating
              ? "Your rating — tap to change"
              : "Tap a star to rate this night"}
          </span>
        ) : (
          <span className="text-xs text-default-500">
            <NextLink href="/login" className="text-primary hover:underline">
              Log in
            </NextLink>{" "}
            to rate this night
          </span>
        )}
      </div>
    </div>
  );
}
