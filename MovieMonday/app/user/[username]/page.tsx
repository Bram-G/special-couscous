"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Spinner,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  Film,
  Star,
  Calendar,
  Trophy,
  Users,
  BookOpen,
  Clapperboard,
  Tag,
  UserPlus,
  UserCheck,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import NextImage from "next/image";
import NextLink from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TMDB_IMG = "https://image.tmdb.org/t/p/w185";
const TMDB_IMG_SM = "https://image.tmdb.org/t/p/w92";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(username: string) {
  if (!username) return "?";
  if (!username.includes(" ")) return username.substring(0, 2).toUpperCase();
  const parts = username.split(" ");
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatEventDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function StatPill({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-default-400">{label}</p>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
        <span key={star} className={`text-sm ${star <= rating ? "text-yellow-400" : "text-default-300"}`}>
          ★
        </span>
      ))}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;
  const { token, user: authUser } = useAuth();

  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : ({ "Content-Type": "application/json" } as Record<string, string>);

  const [profile, setProfile] = useState<any>(null);
  const [picks, setPicks] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [picksLoaded, setPicksLoaded] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [picksLoading, setPicksLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("picks");
  const [followLoading, setFollowLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Load profile on mount
  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/users/${username}`, { headers: authHeaders })
      .then(async (r) => {
        if (r.status === 404) { setNotFound(true); return; }
        if (!r.ok) return;
        setProfile(await r.json());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, token]);

  // Redirect to /profile if this is the logged-in user's own page
  useEffect(() => {
    if (profile?.isOwner) {
      router.replace("/profile");
    }
  }, [profile, router]);

  // Lazy load picks
  useEffect(() => {
    if (activeTab !== "picks" || picksLoaded || !username) return;
    setPicksLoading(true);
    fetch(`${API_BASE_URL}/api/users/${username}/picks?limit=24`, { headers: authHeaders })
      .then((r) => r.json())
      .then((d) => { setPicks(d.picks || []); setPicksLoaded(true); })
      .catch(console.error)
      .finally(() => setPicksLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, username]);

  // Lazy load reviews
  useEffect(() => {
    if (activeTab !== "reviews" || reviewsLoaded || !username) return;
    setReviewsLoading(true);
    fetch(`${API_BASE_URL}/api/users/${username}/reviews?limit=20`, { headers: authHeaders })
      .then((r) => r.json())
      .then((d) => { setReviews(d.reviews || []); setReviewsLoaded(true); })
      .catch(console.error)
      .finally(() => setReviewsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, username]);

  const toggleFollow = async () => {
    if (!token || !profile) return;
    setFollowLoading(true);
    const method = profile.isFollowing ? "DELETE" : "POST";
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${username}/follow`, {
        method,
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        setProfile((p: any) => ({ ...p, isFollowing: data.isFollowing, followerCount: data.followerCount }));
      }
    } catch (e) {
      console.error("Follow error:", e);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-4xl mb-4">🎬</p>
        <h1 className="text-2xl font-bold mb-2">User not found</h1>
        <p className="text-default-500 mb-6">No one goes by &ldquo;{username}&rdquo; here.</p>
        <Button as={NextLink} href="/" variant="flat">Back to home</Button>
      </div>
    );
  }

  const displayName = profile.displayName || profile.username;
  const avatarColor = profile.avatarColor || "#5E35B1";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-default-500 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* ── Profile Header ────────────────────────────────────────────────── */}
      <Card>
        <CardBody className="p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg ring-4 ring-white/20"
              style={{ backgroundColor: avatarColor }}
            >
              {getInitials(profile.username)}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h1 className="text-2xl font-bold truncate">{displayName}</h1>
              {profile.displayName && (
                <p className="text-default-400 text-sm">@{profile.username}</p>
              )}
              {profile.bio && (
                <p className="text-default-500 mt-2 text-sm max-w-xl leading-relaxed">{profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <Chip size="sm" variant="flat" startContent={<Calendar className="w-3 h-3" />}>
                  Joined {formatDate(profile.createdAt)}
                </Chip>
              </div>

              {/* Social counts */}
              <div className="flex gap-5 mt-4 justify-center sm:justify-start">
                <StatPill value={profile.followerCount} label="Followers" />
                <div className="w-px bg-default-200" />
                <StatPill value={profile.followingCount} label="Following" />
                <div className="w-px bg-default-200" />
                <StatPill value={profile.pickCount} label="Picks" />
                <div className="w-px bg-default-200" />
                <StatPill value={profile.reviewCount} label="Reviews" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              {token && !profile.isOwner && (
                <Button
                  color={profile.isFollowing ? "default" : "primary"}
                  variant={profile.isFollowing ? "flat" : "solid"}
                  size="sm"
                  startContent={
                    profile.isFollowing
                      ? <UserCheck className="w-3.5 h-3.5" />
                      : <UserPlus className="w-3.5 h-3.5" />
                  }
                  isLoading={followLoading}
                  onPress={toggleFollow}
                >
                  {profile.isFollowing ? "Following" : "Follow"}
                </Button>
              )}
              {!token && (
                <Button
                  as={NextLink}
                  href={`/login?redirect=/user/${username}`}
                  size="sm"
                  variant="flat"
                  startContent={<UserPlus className="w-3.5 h-3.5" />}
                >
                  Follow
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(k) => setActiveTab(k as string)}
        variant="underlined"
        color="primary"
        classNames={{ tabList: "gap-4" }}
      >

        {/* ── Picks tab ───────────────────────────────────────────────────── */}
        <Tab key="picks" title={
          <span className="flex items-center gap-1.5">
            <Clapperboard className="w-3.5 h-3.5" />
            Picks
          </span>
        }>
          <div className="pt-3">
            {picksLoading ? (
              <div className="flex justify-center py-16"><Spinner /></div>
            ) : picks.length === 0 ? (
              <div className="text-center py-16 text-default-400">
                <Clapperboard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No public picks yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {picks.map((pick: any) => {
                  const winner = pick.movieSelections?.find((s: any) => s.isWinner);
                  const others = pick.movieSelections?.filter((s: any) => !s.isWinner) || [];
                  const cocktails = Array.isArray(pick.eventDetails?.cocktails)
                    ? pick.eventDetails.cocktails.join(", ")
                    : pick.eventDetails?.cocktails;
                  const meals = Array.isArray(pick.eventDetails?.meals)
                    ? pick.eventDetails.meals.join(", ")
                    : pick.eventDetails?.meals;

                  return (
                    <Card
                      key={pick.id}
                      className="overflow-hidden cursor-pointer hover:scale-[1.01] transition-transform"
                      as={pick.slug ? NextLink : "div"}
                      href={pick.slug ? `/movie-monday/${pick.slug}` : undefined}
                    >
                      <div className="relative h-36 bg-default-100">
                        {winner?.posterPath ? (
                          <NextImage
                            src={`${TMDB_IMG}${winner.posterPath}`}
                            alt={winner.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Film className="w-10 h-10 text-default-300" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <span className="bg-black/70 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                            {formatEventDate(pick.date)}
                          </span>
                        </div>
                        {winner?.posterPath && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        )}
                        {winner?.title && (
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-white text-xs font-semibold truncate flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                              {winner.title}
                            </p>
                          </div>
                        )}
                      </div>
                      <CardBody className="p-3 space-y-1">
                        {others.length > 0 && (
                          <p className="text-xs text-default-400 truncate">
                            Also: {others.map((o: any) => o.title).join(", ")}
                          </p>
                        )}
                        {cocktails && <p className="text-xs text-default-400 truncate">🍹 {cocktails}</p>}
                        {meals && <p className="text-xs text-default-400 truncate">🍽️ {meals}</p>}
                        {pick.Group && (
                          <Chip size="sm" variant="flat" className="text-xs mt-1"
                            startContent={<Users className="w-2.5 h-2.5" />}
                          >
                            {pick.Group.name}
                          </Chip>
                        )}
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </Tab>

        {/* ── Reviews tab ─────────────────────────────────────────────────── */}
        <Tab key="reviews" title={
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Reviews
          </span>
        }>
          <div className="pt-3">
            {reviewsLoading ? (
              <div className="flex justify-center py-16"><Spinner /></div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-16 text-default-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No public reviews yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review: any) => (
                  <Card key={review.id}>
                    <CardBody className="p-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          {review.posterPath ? (
                            <NextImage
                              src={`${TMDB_IMG_SM}${review.posterPath}`}
                              alt={review.movieTitle}
                              width={54}
                              height={80}
                              className="rounded-md object-cover"
                            />
                          ) : (
                            <div className="w-[54px] h-[80px] rounded-md bg-default-100 flex items-center justify-center">
                              <Film className="w-5 h-5 text-default-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{review.movieTitle}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <StarRating rating={review.rating} />
                            <span className="text-xs text-default-400">{review.rating}/10</span>
                            {review.containsSpoilers && (
                              <Chip size="sm" color="warning" variant="flat" className="text-xs">Spoilers</Chip>
                            )}
                          </div>
                          {review.reviewText && (
                            <p className="text-sm text-default-600 mt-2 leading-relaxed line-clamp-4">
                              {review.reviewText}
                            </p>
                          )}
                          <p className="text-xs text-default-400 mt-2">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}