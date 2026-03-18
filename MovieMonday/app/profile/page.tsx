"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Tabs,
  Tab,
  Chip,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import {
  Film,
  Star,
  Calendar,
  Trophy,
  Edit2,
  X,
  Lock,
  Mail,
  User,
  BookOpen,
  BarChart2,
  Clapperboard,
  Search,
  Trash2,
  Eye,
  EyeOff,
  Tag,
  ChevronRight,
  Users,
  Rss,
  UserPlus,
} from "lucide-react";
import NextImage from "next/image";
import NextLink from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/protectedRoute";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_IMG = "https://image.tmdb.org/t/p/w185";
const TMDB_IMG_SM = "https://image.tmdb.org/t/p/w92";
const TMDB_SEARCH = "https://api.themoviedb.org/3/search/movie";

const AVATAR_COLORS = [
  "#5E35B1", "#3949AB", "#1E88E5", "#00897B",
  "#43A047", "#E53935", "#D81B60", "#8E24AA",
  "#F4511E", "#6D4C41",
];

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

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardBody className="flex flex-row items-center gap-3 py-3 px-4">
        <div className="p-2 rounded-xl bg-primary/10 text-primary flex-shrink-0">{icon}</div>
        <div>
          <p className="text-xl font-bold leading-tight">{value}</p>
          <p className="text-xs text-default-500">{label}</p>
          {sub && <p className="text-xs text-default-400">{sub}</p>}
        </div>
      </CardBody>
    </Card>
  );
}

function SocialStatButton({ value, label, href }: { value: number; label: string; href: string }) {
  return (
    <NextLink href={href} className="text-center group">
      <p className="text-lg font-bold group-hover:text-primary transition-colors">{value}</p>
      <p className="text-xs text-default-400 group-hover:text-default-600 transition-colors">{label}</p>
    </NextLink>
  );
}

function StarRating({ rating, onRate, size = "md" }: { rating: number; onRate?: (r: number) => void; size?: "sm" | "md" }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate?.(star)}
          onMouseEnter={() => onRate && setHover(star)}
          onMouseLeave={() => onRate && setHover(0)}
          className={`transition-colors ${size === "sm" ? "text-sm" : "text-base"} ${
            star <= (hover || rating) ? "text-yellow-400" : "text-default-300"
          } ${onRate ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { token, user: authUser } = useAuth();
  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [picks, setPicks] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [picksLoaded, setPicksLoaded] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [picksLoading, setPicksLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [settingsForm, setSettingsForm] = useState({ username: "", email: "", displayName: "", bio: "", avatarColor: AVATAR_COLORS[0] });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const { isOpen: reviewOpen, onOpen: openReview, onClose: closeReview } = useDisclosure();
  const [editingReview, setEditingReview] = useState<any>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 7, reviewText: "", isPublic: true, containsSpoilers: false });
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [movieQuery, setMovieQuery] = useState("");
  const [movieResults, setMovieResults] = useState<any[]>([]);
  const [searchingMovies, setSearchingMovies] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);

  // Load profile + stats
  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, sRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/users/me`, { headers: authHeaders }),
          fetch(`${API_BASE_URL}/api/users/me/stats`, { headers: authHeaders }),
        ]);
        if (pRes.ok) {
          const p = await pRes.json();
          setProfile(p);
          setSettingsForm({ username: p.username || "", email: p.email || "", displayName: p.displayName || "", bio: p.bio || "", avatarColor: p.avatarColor || AVATAR_COLORS[0] });
        }
        if (sRes.ok) setStats(await sRes.json());
      } catch (e) { console.error("Profile load error:", e); }
      finally { setLoading(false); }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Lazy load picks
  useEffect(() => {
    if (activeTab !== "picks" || picksLoaded || !token) return;
    setPicksLoading(true);
    fetch(`${API_BASE_URL}/api/users/me/picks?limit=24`, { headers: authHeaders })
      .then((r) => r.json()).then((d) => { setPicks(d.picks || []); setPicksLoaded(true); })
      .catch(console.error).finally(() => setPicksLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token]);

  // Lazy load reviews
  useEffect(() => {
    if (activeTab !== "reviews" || reviewsLoaded || !token) return;
    setReviewsLoading(true);
    fetch(`${API_BASE_URL}/api/reviews/mine`, { headers: authHeaders })
      .then((r) => r.json()).then((d) => { setReviews(d.reviews || []); setReviewsLoaded(true); })
      .catch(console.error).finally(() => setReviewsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token]);

  // TMDB search debounce
  useEffect(() => {
    if (!movieQuery || movieQuery.length < 2) { setMovieResults([]); return; }
    const t = setTimeout(async () => {
      setSearchingMovies(true);
      try {
        const res = await fetch(`${TMDB_SEARCH}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieQuery)}&page=1`);
        const data = await res.json();
        setMovieResults((data.results || []).slice(0, 6));
      } catch (e) { console.error("TMDB search error:", e); }
      finally { setSearchingMovies(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [movieQuery]);

  const saveSettings = async () => {
    setSettingsSaving(true); setSettingsMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me`, { method: "PUT", headers: authHeaders, body: JSON.stringify(settingsForm) });
      const data = await res.json();
      if (res.ok) { setProfile((p: any) => ({ ...p, ...data.user })); setSettingsMsg({ type: "success", text: "Profile updated successfully!" }); }
      else setSettingsMsg({ type: "error", text: data.message || "Failed to update" });
    } catch { setSettingsMsg({ type: "error", text: "Network error — please try again" }); }
    finally { setSettingsSaving(false); }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setPasswordMsg({ type: "error", text: "New passwords do not match" }); return; }
    if (passwordForm.newPassword.length < 6) { setPasswordMsg({ type: "error", text: "Password must be at least 6 characters" }); return; }
    setPasswordSaving(true); setPasswordMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me/password`, { method: "PUT", headers: authHeaders, body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }) });
      const data = await res.json();
      if (res.ok) { setPasswordMsg({ type: "success", text: "Password changed successfully!" }); setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }
      else setPasswordMsg({ type: "error", text: data.message || "Failed to change password" });
    } catch { setPasswordMsg({ type: "error", text: "Network error — please try again" }); }
    finally { setPasswordSaving(false); }
  };

  const resetReviewForm = () => {
    setReviewForm({ rating: 7, reviewText: "", isPublic: true, containsSpoilers: false });
    setSelectedMovie(null); setMovieQuery(""); setMovieResults([]); setEditingReview(null);
  };
  const openEditReview = (review: any) => {
    setEditingReview(review);
    setReviewForm({ rating: review.rating, reviewText: review.reviewText || "", isPublic: review.isPublic, containsSpoilers: review.containsSpoilers });
    openReview();
  };
  const submitReview = async () => {
    if (!selectedMovie && !editingReview) return;
    setReviewSaving(true);
    try {
      const isEditing = !!editingReview;
      const url = isEditing ? `${API_BASE_URL}/api/reviews/${editingReview.id}` : `${API_BASE_URL}/api/reviews`;
      const body = isEditing
        ? { rating: reviewForm.rating, reviewText: reviewForm.reviewText, isPublic: reviewForm.isPublic, containsSpoilers: reviewForm.containsSpoilers }
        : { tmdbMovieId: selectedMovie.id, movieTitle: selectedMovie.title, posterPath: selectedMovie.poster_path || null, ...reviewForm };
      const res = await fetch(url, { method: isEditing ? "PUT" : "POST", headers: authHeaders, body: JSON.stringify(body) });
      if (res.ok) {
        const saved = await res.json();
        if (isEditing) setReviews((prev) => prev.map((r) => (r.id === editingReview.id ? saved : r)));
        else { setReviews((prev) => [saved, ...prev]); if (stats) setStats((s: any) => ({ ...s, reviewCount: (s.reviewCount || 0) + 1 })); }
        closeReview(); resetReviewForm();
      } else { const err = await res.json(); alert(err.message || "Failed to save review"); }
    } catch (e) { console.error("Review save error:", e); }
    finally { setReviewSaving(false); }
  };
  const deleteReview = async (id: number) => {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews/${id}`, { method: "DELETE", headers: authHeaders });
      if (res.ok) { setReviews((prev) => prev.filter((r) => r.id !== id)); if (stats) setStats((s: any) => ({ ...s, reviewCount: Math.max(0, (s.reviewCount || 1) - 1) })); }
    } catch (e) { console.error("Delete review error:", e); }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>;
  }

  const displayName = profile?.displayName || profile?.username || authUser?.username || "User";
  const avatarColor = settingsForm.avatarColor || AVATAR_COLORS[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* ── Profile Header ────────────────────────────────────────────────── */}
      <Card>
        <CardBody className="p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg ring-4 ring-white/20"
              style={{ backgroundColor: profile?.avatarColor || AVATAR_COLORS[0] }}
            >
              {getInitials(profile?.username || "")}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-2xl font-bold truncate">{displayName}</h1>
                {/* Public profile link */}
                <Button
                  as={NextLink}
                  href={`/user/${profile?.username}`}
                  size="sm"
                  variant="light"
                  className="text-xs text-default-400 h-6 w-fit"
                >
                  @{profile?.username} ↗
                </Button>
              </div>
              {profile?.bio && (
                <p className="text-default-500 mt-2 text-sm max-w-xl leading-relaxed">{profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <Chip size="sm" variant="flat" startContent={<Calendar className="w-3 h-3" />}>
                  Joined {formatDate(profile?.createdAt)}
                </Chip>
                {profile?.Groups?.map((g: any) => (
                  <Chip key={g.id} size="sm" color="primary" variant="flat" startContent={<Users className="w-3 h-3" />}>
                    {g.name}
                  </Chip>
                ))}
              </div>

              {/* Social counts */}
              <div className="flex gap-5 mt-4 justify-center sm:justify-start">
                <SocialStatButton
                  value={stats?.followerCount || 0}
                  label="Followers"
                  href="/profile?tab=followers"
                />
                <div className="w-px bg-default-200" />
                <SocialStatButton
                  value={stats?.followingCount || 0}
                  label="Following"
                  href="/following"
                />
                <div className="w-px bg-default-200" />
                <div className="text-center">
                  <p className="text-lg font-bold">{stats?.totalPickEvents || 0}</p>
                  <p className="text-xs text-default-400">Picks</p>
                </div>
                <div className="w-px bg-default-200" />
                <div className="text-center">
                  <p className="text-lg font-bold">{stats?.reviewCount || 0}</p>
                  <p className="text-xs text-default-400">Reviews</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Button
                as={NextLink}
                href="/following"
                size="sm"
                variant="flat"
                startContent={<Rss className="w-3.5 h-3.5" />}
              >
                Feed
              </Button>
              <Button
                size="sm"
                variant="flat"
                startContent={<Edit2 className="w-3.5 h-3.5" />}
                onPress={() => setActiveTab("settings")}
              >
                Edit
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Clapperboard className="w-4 h-4" />} label="Times as Picker" value={stats.totalPickEvents} sub={stats.totalGroupSessions > 0 ? `${stats.pickRate}% of sessions` : undefined} />
          <StatCard icon={<Film className="w-4 h-4" />} label="Movies Nominated" value={stats.totalNominations} />
          <StatCard icon={<Star className="w-4 h-4" />} label="Avg Movie Rating" value={stats.avgVoteAverage ? `${stats.avgVoteAverage}/10` : "—"} />
          <StatCard icon={<BookOpen className="w-4 h-4" />} label="Reviews Written" value={stats.reviewCount} />
        </div>
      )}

      {/* ── Main Tabs ─────────────────────────────────────────────────────── */}
      <Tabs selectedKey={activeTab} onSelectionChange={(k) => setActiveTab(k as string)} variant="underlined" color="primary" classNames={{ tabList: "gap-4" }}>

        {/* ── Overview ──────────────────────────────────────────────────── */}
        <Tab key="overview" title="Overview">
          <div className="space-y-4 pt-2">
            {stats?.topGenres?.length > 0 && (
              <Card>
                <CardBody className="p-4">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    Top Genres You Pick
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {stats.topGenres.map((g: any) => (
                      <Chip key={g.genre} size="sm" color="primary" variant="flat">
                        {g.genre}<span className="ml-1.5 opacity-60 text-xs">×{g.count}</span>
                      </Chip>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            <Card>
              <CardBody className="p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  Group Activity
                </h3>
                <p className="text-sm text-default-500 leading-relaxed">
                  Your group has held{" "}
                  <span className="font-semibold text-foreground">{stats?.totalGroupSessions || 0}</span>{" "}
                  Movie Monday sessions. You&apos;ve been the picker for{" "}
                  <span className="font-semibold text-foreground">{stats?.totalPickEvents || 0}</span>{" "}
                  of them{stats?.pickRate > 0 && ` (${stats.pickRate}% of the time)`}.
                  Together you&apos;ve nominated{" "}
                  <span className="font-semibold text-foreground">{stats?.totalNominations || 0}</span>{" "}
                  films.
                </p>
              </CardBody>
            </Card>

            {stats?.totalPickEvents === 0 && (
              <Card className="border-dashed border-2 border-default-200">
                <CardBody className="p-6 text-center text-default-400">
                  <Clapperboard className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">You haven&apos;t been the picker yet!</p>
                </CardBody>
              </Card>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" variant="flat" endContent={<ChevronRight className="w-3.5 h-3.5" />} onPress={() => setActiveTab("picks")}>View My Picks</Button>
              <Button size="sm" variant="flat" endContent={<ChevronRight className="w-3.5 h-3.5" />} onPress={() => setActiveTab("reviews")}>My Reviews</Button>
              <Button as={NextLink} href="/following" size="sm" variant="flat" startContent={<Rss className="w-3.5 h-3.5" />} endContent={<ChevronRight className="w-3.5 h-3.5" />}>Following Feed</Button>
            </div>
          </div>
        </Tab>

        {/* ── My Picks ──────────────────────────────────────────────────── */}
        <Tab key="picks" title="My Picks">
          <div className="pt-2">
            {picksLoading ? (
              <div className="flex justify-center py-16"><Spinner /></div>
            ) : picks.length === 0 ? (
              <div className="text-center py-16 text-default-400">
                <Clapperboard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No picks yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {picks.map((pick: any) => {
                  const winner = pick.movieSelections?.find((s: any) => s.isWinner);
                  const others = pick.movieSelections?.filter((s: any) => !s.isWinner) || [];
                  const cocktails = Array.isArray(pick.eventDetails?.cocktails) ? pick.eventDetails.cocktails.join(", ") : pick.eventDetails?.cocktails;
                  const meals = Array.isArray(pick.eventDetails?.meals) ? pick.eventDetails.meals.join(", ") : pick.eventDetails?.meals;
                  return (
                    <Card key={pick.id} className="overflow-hidden">
                      <div className="relative h-36 bg-default-100">
                        {winner?.posterPath ? (
                          <NextImage src={`${TMDB_IMG}${winner.posterPath}`} alt={winner.title} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center"><Film className="w-10 h-10 text-default-300" /></div>
                        )}
                        <div className="absolute top-2 left-2">
                          <span className="bg-black/70 text-white text-xs font-medium px-2 py-0.5 rounded-full">{formatEventDate(pick.date)}</span>
                        </div>
                        {winner?.posterPath && <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />}
                        {winner?.title && (
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-white text-xs font-semibold truncate flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                              {winner.title}
                            </p>
                          </div>
                        )}
                      </div>
                      <CardBody className="p-3 space-y-1.5">
                        {others.length > 0 && <p className="text-xs text-default-400 truncate">Also: {others.map((o: any) => o.title).join(", ")}</p>}
                        {cocktails && <p className="text-xs text-default-400 truncate">🍹 {cocktails}</p>}
                        {meals && <p className="text-xs text-default-400 truncate">🍽️ {meals}</p>}
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </Tab>

        {/* ── Reviews ───────────────────────────────────────────────────── */}
        <Tab key="reviews" title="Reviews">
          <div className="pt-2 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-default-500">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
              <Button color="primary" size="sm" startContent={<Edit2 className="w-3.5 h-3.5" />} onPress={() => { resetReviewForm(); openReview(); }}>Write a Review</Button>
            </div>
            {reviewsLoading ? (
              <div className="flex justify-center py-16"><Spinner /></div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-16 text-default-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review: any) => (
                  <Card key={review.id}>
                    <CardBody className="p-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          {review.posterPath ? (
                            <NextImage src={`${TMDB_IMG_SM}${review.posterPath}`} alt={review.movieTitle} width={54} height={80} className="rounded-md object-cover" />
                          ) : (
                            <div className="w-[54px] h-[80px] rounded-md bg-default-100 flex items-center justify-center"><Film className="w-5 h-5 text-default-300" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-semibold text-sm truncate">{review.movieTitle}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                <StarRating rating={review.rating} size="sm" />
                                <span className="text-xs text-default-400">{review.rating}/10</span>
                                {review.containsSpoilers && <Chip size="sm" color="warning" variant="flat" className="text-xs">Spoilers</Chip>}
                                {!review.isPublic && <Chip size="sm" variant="flat" className="text-xs">Private</Chip>}
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button isIconOnly size="sm" variant="light" onPress={() => openEditReview(review)}><Edit2 className="w-3.5 h-3.5" /></Button>
                              <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => deleteReview(review.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </div>
                          {review.reviewText && <p className="text-sm text-default-600 mt-2 leading-relaxed line-clamp-4">{review.reviewText}</p>}
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

        {/* ── Settings ──────────────────────────────────────────────────── */}
        <Tab key="settings" title="Settings">
          <div className="pt-2 space-y-5 max-w-lg">
            {/* Avatar color */}
            <Card>
              <CardBody className="p-4">
                <h3 className="font-semibold text-sm mb-4">Avatar Color</h3>
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0 transition-colors" style={{ backgroundColor: settingsForm.avatarColor }}>
                    {getInitials(settingsForm.username)}
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {AVATAR_COLORS.map((color) => (
                      <button key={color} type="button" onClick={() => setSettingsForm((f) => ({ ...f, avatarColor: color }))}
                        className={`w-7 h-7 rounded-full transition-all ${settingsForm.avatarColor === color ? "scale-125 ring-2 ring-offset-2 ring-primary" : "hover:scale-110"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Profile info */}
            <Card>
              <CardBody className="p-4 space-y-4">
                <h3 className="font-semibold text-sm">Profile Info</h3>
                <Input label="Display Name" placeholder="How you appear to others (optional)" value={settingsForm.displayName} onValueChange={(v) => setSettingsForm((f) => ({ ...f, displayName: v }))} description="Shown instead of your username on your public profile" startContent={<User className="w-4 h-4 text-default-400" />} />
                <Textarea label="Bio" placeholder="Tell the group a little about yourself..." value={settingsForm.bio} onValueChange={(v) => setSettingsForm((f) => ({ ...f, bio: v }))} maxRows={4} description={`${settingsForm.bio.length}/500`} />
                <Input label="Username" value={settingsForm.username} onValueChange={(v) => setSettingsForm((f) => ({ ...f, username: v }))} startContent={<span className="text-default-400 text-sm">@</span>} description={`Your public profile: /user/${settingsForm.username}`} />
                <Input label="Email" type="email" value={settingsForm.email} onValueChange={(v) => setSettingsForm((f) => ({ ...f, email: v }))} startContent={<Mail className="w-4 h-4 text-default-400" />} />
                {settingsMsg && (
                  <div className={`text-sm px-3 py-2 rounded-lg ${settingsMsg.type === "success" ? "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400" : "bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400"}`}>
                    {settingsMsg.text}
                  </div>
                )}
                <Button color="primary" isLoading={settingsSaving} onPress={saveSettings} className="w-full sm:w-auto">Save Profile</Button>
              </CardBody>
            </Card>

            {/* Change Password */}
            <Card>
              <CardBody className="p-4 space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2"><Lock className="w-4 h-4" />Change Password</h3>
                <Input label="Current Password" type={showCurrent ? "text" : "password"} value={passwordForm.currentPassword} onValueChange={(v) => setPasswordForm((f) => ({ ...f, currentPassword: v }))} endContent={<button type="button" onClick={() => setShowCurrent((p) => !p)}>{showCurrent ? <EyeOff className="w-4 h-4 text-default-400" /> : <Eye className="w-4 h-4 text-default-400" />}</button>} />
                <Input label="New Password" type={showNew ? "text" : "password"} value={passwordForm.newPassword} onValueChange={(v) => setPasswordForm((f) => ({ ...f, newPassword: v }))} endContent={<button type="button" onClick={() => setShowNew((p) => !p)}>{showNew ? <EyeOff className="w-4 h-4 text-default-400" /> : <Eye className="w-4 h-4 text-default-400" />}</button>} />
                <Input label="Confirm New Password" type="password" value={passwordForm.confirmPassword} onValueChange={(v) => setPasswordForm((f) => ({ ...f, confirmPassword: v }))} isInvalid={passwordForm.confirmPassword.length > 0 && passwordForm.confirmPassword !== passwordForm.newPassword} errorMessage="Passwords don't match" />
                {passwordMsg && (
                  <div className={`text-sm px-3 py-2 rounded-lg ${passwordMsg.type === "success" ? "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400" : "bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400"}`}>
                    {passwordMsg.text}
                  </div>
                )}
                <Button color="primary" variant="flat" isLoading={passwordSaving} onPress={changePassword} className="w-full sm:w-auto">Change Password</Button>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>

      {/* ── Review Modal ───────────────────────────────────────────────────── */}
      <Modal isOpen={reviewOpen} onClose={() => { closeReview(); resetReviewForm(); }} size="lg" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="text-lg font-bold">{editingReview ? "Edit Review" : "Write a Review"}</ModalHeader>
          <ModalBody className="gap-4 pb-2">
            {!editingReview && (
              <div className="space-y-2">
                {!selectedMovie ? (
                  <>
                    <Input label="Search for a movie" placeholder="Start typing a title..." value={movieQuery} onValueChange={setMovieQuery} startContent={<Search className="w-4 h-4 text-default-400" />} isClearable onClear={() => { setMovieQuery(""); setMovieResults([]); }} />
                    {searchingMovies && <div className="text-center py-2"><Spinner size="sm" /></div>}
                    {movieResults.length > 0 && (
                      <div className="rounded-xl border border-default-200 overflow-hidden">
                        {movieResults.map((movie: any, i: number) => (
                          <button key={movie.id} type="button" className={`w-full flex items-center gap-3 p-2.5 hover:bg-default-100 text-left transition-colors ${i > 0 ? "border-t border-default-100" : ""}`} onClick={() => { setSelectedMovie(movie); setMovieQuery(""); setMovieResults([]); }}>
                            {movie.poster_path ? <NextImage src={`${TMDB_IMG_SM}${movie.poster_path}`} alt={movie.title} width={28} height={42} className="rounded flex-shrink-0" /> : <div className="w-7 h-10 bg-default-200 rounded flex items-center justify-center flex-shrink-0"><Film className="w-3.5 h-3.5 text-default-400" /></div>}
                            <div>
                              <p className="text-sm font-medium">{movie.title}</p>
                              {movie.release_date && <p className="text-xs text-default-400">{movie.release_date.split("-")[0]}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-default-50 rounded-xl">
                    {selectedMovie.poster_path && <NextImage src={`${TMDB_IMG_SM}${selectedMovie.poster_path}`} alt={selectedMovie.title} width={36} height={54} className="rounded" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{selectedMovie.title}</p>
                      {selectedMovie.release_date && <p className="text-xs text-default-400">{selectedMovie.release_date.split("-")[0]}</p>}
                    </div>
                    <Button isIconOnly size="sm" variant="light" onPress={() => setSelectedMovie(null)}><X className="w-4 h-4" /></Button>
                  </div>
                )}
              </div>
            )}
            {editingReview && (
              <div className="flex items-center gap-3 p-3 bg-default-50 rounded-xl">
                {editingReview.posterPath && <NextImage src={`${TMDB_IMG_SM}${editingReview.posterPath}`} alt={editingReview.movieTitle} width={36} height={54} className="rounded" />}
                <div><p className="font-semibold text-sm">{editingReview.movieTitle}</p><p className="text-xs text-default-400">Editing review</p></div>
              </div>
            )}
            {(selectedMovie || editingReview) && (
              <>
                <div>
                  <p className="text-sm font-medium mb-2">Your Rating</p>
                  <div className="flex items-center gap-3">
                    <StarRating rating={reviewForm.rating} onRate={(r) => setReviewForm((f) => ({ ...f, rating: r }))} />
                    <span className="text-default-500 text-sm font-semibold">{reviewForm.rating}/10</span>
                  </div>
                </div>
                <Textarea label="Your Review (optional)" placeholder="What did you think?" value={reviewForm.reviewText} onValueChange={(v) => setReviewForm((f) => ({ ...f, reviewText: v }))} maxRows={7} description={`${reviewForm.reviewText.length}/2000`} />
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="flat" color={reviewForm.containsSpoilers ? "warning" : "default"} onPress={() => setReviewForm((f) => ({ ...f, containsSpoilers: !f.containsSpoilers }))}>
                    {reviewForm.containsSpoilers ? "⚠️ Contains Spoilers" : "No Spoilers"}
                  </Button>
                  <Button size="sm" variant="flat" startContent={reviewForm.isPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />} onPress={() => setReviewForm((f) => ({ ...f, isPublic: !f.isPublic }))}>
                    {reviewForm.isPublic ? "Public" : "Private"}
                  </Button>
                </div>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => { closeReview(); resetReviewForm(); }}>Cancel</Button>
            <Button color="primary" isLoading={reviewSaving} onPress={submitReview} isDisabled={!selectedMovie && !editingReview}>
              {editingReview ? "Save Changes" : "Submit Review"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}