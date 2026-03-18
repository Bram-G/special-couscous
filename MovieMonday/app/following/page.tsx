"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, Button, Chip, Spinner } from "@heroui/react";
import { Film, Trophy, Users, UserPlus, ChevronDown, Rss } from "lucide-react";
import NextImage from "next/image";
import NextLink from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/protectedRoute";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TMDB_IMG = "https://image.tmdb.org/t/p/w185";

function getInitials(username: string) {
  if (!username) return "?";
  if (!username.includes(" ")) return username.substring(0, 2).toUpperCase();
  const parts = username.split(" ");
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function FollowingFeedPage() {
  return (
    <ProtectedRoute>
      <FeedContent />
    </ProtectedRoute>
  );
}

function FeedContent() {
  const { token } = useAuth();
  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [emptyReason, setEmptyReason] = useState<string | null>(null);
  const [following, setFollowing] = useState<any[]>([]);
  const [followingLoaded, setFollowingLoaded] = useState(false);

  const loadFeed = useCallback(async (pageNum: number, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me/feed?page=${pageNum}&limit=15`, {
        headers: authHeaders,
      });
      if (!res.ok) return;
      const data = await res.json();
      setEvents((prev) => append ? [...prev, ...(data.events || [])] : (data.events || []));
      setTotalPages(data.totalPages || 1);
      setEmptyReason(data.emptyReason || null);
    } catch (e) {
      console.error("Feed load error:", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadFollowing = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me/following`, { headers: authHeaders });
      if (res.ok) setFollowing(await res.json());
    } catch (e) {
      console.error("Following load error:", e);
    } finally {
      setFollowingLoaded(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    loadFeed(1);
    loadFollowing();
  }, [loadFeed, loadFollowing]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    loadFeed(next, true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Rss className="w-5 h-5 text-primary" />
            Following Feed
          </h1>
          <p className="text-sm text-default-500 mt-0.5">
            Recent Movie Mondays from people you follow
          </p>
        </div>
        <Button
          as={NextLink}
          href="/profile"
          size="sm"
          variant="flat"
          startContent={<UserPlus className="w-3.5 h-3.5" />}
        >
          Find People
        </Button>
      </div>

      {/* Following pill bar */}
      {followingLoaded && following.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {following.map((u: any) => (
            <NextLink key={u.id} href={`/user/${u.username}`}>
              <Chip
                size="sm"
                variant="flat"
                avatar={
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                    style={{ backgroundColor: u.avatarColor || "#5E35B1" }}
                  >
                    {getInitials(u.username)}
                  </div>
                }
                className="cursor-pointer hover:opacity-75 transition-opacity"
              >
                {u.displayName || u.username}
              </Chip>
            </NextLink>
          ))}
        </div>
      )}

      {/* Empty state — not following anyone */}
      {emptyReason === "not_following_anyone" && (
        <Card className="border-dashed border-2 border-default-200">
          <CardBody className="p-8 text-center text-default-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-lg mb-1">Your feed is empty</p>
            <p className="text-sm mb-5">
              Follow other Movie Monday members to see their picks and events here.
            </p>
            <Button
              as={NextLink}
              href="/discover"
              color="primary"
              startContent={<UserPlus className="w-3.5 h-3.5" />}
            >
              Discover people
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Empty state — following people but no public events */}
      {emptyReason === null && events.length === 0 && following.length > 0 && (
        <Card className="border-dashed border-2 border-default-200">
          <CardBody className="p-8 text-center text-default-400">
            <Film className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold mb-1">No public events yet</p>
            <p className="text-sm">
              The people you follow haven&apos;t shared any public Movie Mondays yet.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Feed events */}
      {events.length > 0 && (
        <div className="space-y-4">
          {events.map((event: any) => {
            const picker = event.picker;
            const winner = event.movieSelections?.find((s: any) => s.isWinner);
            const others = event.movieSelections?.filter((s: any) => !s.isWinner) || [];
            const cocktails = Array.isArray(event.eventDetails?.cocktails)
              ? event.eventDetails.cocktails.join(", ")
              : event.eventDetails?.cocktails;
            const meals = Array.isArray(event.eventDetails?.meals)
              ? event.eventDetails.meals.join(", ")
              : event.eventDetails?.meals;
            const genres: string[] = winner?.genres
              ? (Array.isArray(winner.genres) ? winner.genres : [])
              : [];

            return (
              <Card key={event.id} className="overflow-hidden">
                <CardBody className="p-0">
                  {/* Event meta bar */}
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                    <NextLink href={`/user/${picker?.username}`} className="flex-shrink-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                        style={{ backgroundColor: picker?.avatarColor || "#5E35B1" }}
                      >
                        {getInitials(picker?.username || "")}
                      </div>
                    </NextLink>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">
                        <NextLink
                          href={`/user/${picker?.username}`}
                          className="hover:underline"
                        >
                          {picker?.displayName || picker?.username}
                        </NextLink>
                        <span className="font-normal text-default-500"> picked for Movie Monday</span>
                      </p>
                      <p className="text-xs text-default-400">{formatDate(event.date)}</p>
                    </div>
                    {event.Group && (
                      <Chip
                        as={NextLink}
                        href={`/browse/${event.Group.slug}`}
                        size="sm"
                        variant="flat"
                        startContent={<Users className="w-2.5 h-2.5" />}
                        className="text-xs flex-shrink-0 cursor-pointer hover:opacity-75"
                      >
                        {event.Group.name}
                      </Chip>
                    )}
                  </div>

                  {/* Movie poster + info */}
                  <div className="flex gap-3 px-4 pb-4">
                    {/* Winner poster */}
                    <div className="flex-shrink-0">
                      {winner?.posterPath ? (
                        <NextImage
                          src={`${TMDB_IMG}${winner.posterPath}`}
                          alt={winner.title}
                          width={72}
                          height={108}
                          className="rounded-lg object-cover shadow-md"
                        />
                      ) : (
                        <div className="w-[72px] h-[108px] rounded-lg bg-default-100 flex items-center justify-center">
                          <Film className="w-7 h-7 text-default-300" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      {winner && (
                        <div className="mb-2">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Trophy className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                            <p className="text-sm font-bold truncate">{winner.title}</p>
                          </div>
                          {genres.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {genres.slice(0, 3).map((g) => (
                                <Chip key={g} size="sm" variant="flat" color="primary" className="text-xs">
                                  {g}
                                </Chip>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {others.length > 0 && (
                        <p className="text-xs text-default-400 mb-1 truncate">
                          Also nominated: {others.map((o: any) => o.title).join(", ")}
                        </p>
                      )}

                      {event.weekTheme && (
                        <p className="text-xs text-primary-500 font-medium mb-1">
                          🎯 {event.weekTheme}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-default-500">
                        {cocktails && <span>🍹 {cocktails}</span>}
                        {meals && <span>🍽️ {meals}</span>}
                      </div>

                      {event.slug && (
                        <Button
                          as={NextLink}
                          href={`/movie-monday/${event.slug}`}
                          size="sm"
                          variant="light"
                          className="mt-2 -ml-2 h-7 text-xs"
                        >
                          View event →
                        </Button>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}

          {/* Load more */}
          {page < totalPages && (
            <div className="flex justify-center pt-2">
              <Button
                variant="flat"
                isLoading={loadingMore}
                onPress={loadMore}
                startContent={!loadingMore && <ChevronDown className="w-4 h-4" />}
              >
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}