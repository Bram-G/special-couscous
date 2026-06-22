"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Image,
  Card,
  CardBody,
  Tabs,
  Tab,
  Button,
  Spinner,
  Tooltip,
  Progress,
} from "@heroui/react";
import {
  Calendar,
  MapPin,
  Film,
  Trophy,
  ArrowLeft,
  Star,
  Eye,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

interface PersonCredit {
  id: number;
  title?: string;
  name?: string;
  character?: string;
  job?: string;
  department?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  popularity?: number;
  media_type?: string;
}

interface PersonDetails {
  id: number;
  name: string;
  biography?: string;
  birthday?: string | null;
  deathday?: string | null;
  place_of_birth?: string | null;
  profile_path?: string | null;
  known_for_department?: string;
  movie_credits?: {
    cast?: PersonCredit[];
    crew?: PersonCredit[];
  };
}

interface WatchedMovie {
  tmdbMovieId: number;
  title: string;
  posterPath?: string | null;
  isWinner: boolean;
  appearances: number;
  dates: string[];
}

type WatchedMap = Record<string, WatchedMovie>;
type SortMode = "newest" | "popular";

export default function ActorPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();

  const actorId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [watchedMap, setWatchedMap] = useState<WatchedMap>({});
  const [activeTab, setActiveTab] = useState<string>("acting");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [onlyWatched, setOnlyWatched] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  // ---- Fetch person details from TMDB --------------------------------------
  useEffect(() => {
    const fetchPerson = async () => {
      if (!actorId) return;

      try {
        setLoading(true);
        setNotFound(false);

        const response = await fetch(
          `https://api.themoviedb.org/3/person/${actorId}?api_key=${TMDB_KEY}&append_to_response=movie_credits`,
        );

        if (response.status === 404) {
          setNotFound(true);
          return;
        }
        if (!response.ok) {
          throw new Error(`TMDB API error: ${response.status}`);
        }

        const data = await response.json();
        setPerson(data);
      } catch (error) {
        console.error("Error fetching actor details:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPerson();
  }, [actorId]);

  // ---- De-duplicated / sorted credit lists ---------------------------------
  const actingCredits = useMemo(() => {
    const cast = person?.movie_credits?.cast || [];
    const seen = new Set<number>();
    const unique: PersonCredit[] = [];

    cast.forEach((credit) => {
      if (!credit.id || seen.has(credit.id)) return;
      seen.add(credit.id);
      unique.push(credit);
    });

    return unique;
  }, [person]);

  const crewCredits = useMemo(() => {
    const crew = person?.movie_credits?.crew || [];
    // Keep the jobs Movie Monday actually tracks/cares about, de-duped per movie+job
    const relevantJobs = ["Director", "Writer", "Screenplay", "Story"];
    const seen = new Set<string>();
    const filtered: PersonCredit[] = [];

    crew.forEach((credit) => {
      if (!credit.id || !credit.job) return;
      if (!relevantJobs.includes(credit.job)) return;

      const key = `${credit.id}-${credit.job}`;
      if (seen.has(key)) return;
      seen.add(key);
      filtered.push(credit);
    });

    return filtered;
  }, [person]);

  const hasCrew = crewCredits.length > 0;

  // ---- Fetch watched status for this actor's filmography --------------------
  useEffect(() => {
    const fetchWatched = async () => {
      if (!isAuthenticated || !token) return;

      const ids = Array.from(
        new Set([
          ...actingCredits.map((c) => c.id),
          ...crewCredits.map((c) => c.id),
        ]),
      ).filter(Boolean);

      if (ids.length === 0) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/movie-monday/actor-watched-status`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ tmdbMovieIds: ids }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          setWatchedMap(data.watchedMovies || {});
        }
      } catch (error) {
        console.error("Error fetching watched status:", error);
      }
    };

    fetchWatched();
  }, [isAuthenticated, token, actingCredits, crewCredits]);

  // ---- Derived stats --------------------------------------------------------
  const watchedValues = Object.values(watchedMap);
  const watchedCount = watchedValues.filter((m) => m.isWinner).length;
  const nominatedCount = watchedValues.filter((m) => !m.isWinner).length;

  // Of the actor's films that ever made it onto a ballot, how often did the
  // group actually pick them? This is the win-rate analytics from the old modal,
  // reframed for the actor page.
  const ballotCount = watchedCount + nominatedCount;
  const pickRate =
    ballotCount > 0 ? Math.round((watchedCount / ballotCount) * 100) : 0;

  const getYear = (credit: PersonCredit) => {
    const date = credit.release_date || credit.first_air_date || "";
    return date ? date.split("-")[0] : "";
  };

  const sortCredits = (credits: PersonCredit[]) => {
    const list = [...credits];

    if (sortMode === "popular") {
      list.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else {
      // Newest first; undated entries sink to the bottom
      list.sort((a, b) => {
        const yearA = getYear(a);
        const yearB = getYear(b);
        if (!yearA) return 1;
        if (!yearB) return -1;
        return yearB.localeCompare(yearA);
      });
    }

    if (onlyWatched) {
      return list.filter((c) => watchedMap[c.id]);
    }
    return list;
  };

  const visibleActing = useMemo(
    () => sortCredits(actingCredits),
    [actingCredits, sortMode, onlyWatched, watchedMap],
  );
  const visibleCrew = useMemo(
    () => sortCredits(crewCredits),
    [crewCredits, sortMode, onlyWatched, watchedMap],
  );

  // ---- Helpers --------------------------------------------------------------
  const calculateAge = () => {
    if (!person?.birthday) return null;
    const end = person.deathday ? new Date(person.deathday) : new Date();
    const birth = new Date(person.birthday);
    let age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ---- Render: loading / not found -----------------------------------------
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound || !person) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Film className="h-12 w-12 text-default-300" />
        <p className="text-lg font-medium">We couldn&apos;t find that person.</p>
        <Button color="primary" variant="flat" onPress={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const age = calculateAge();

  // ---- Single credit card ---------------------------------------------------
  const renderCreditCard = (credit: PersonCredit) => {
    const watched = watchedMap[credit.id];
    const isWinner = watched?.isWinner;
    const isNominated = watched && !watched.isWinner;
    const year = getYear(credit);
    const subtitle = credit.character || credit.job || "";

    return (
      <Card
        key={`${credit.id}-${credit.job || "cast"}`}
        isPressable
        className={`w-full transition-transform hover:scale-[1.03] ${
          isWinner
            ? "ring-2 ring-warning"
            : isNominated
              ? "ring-2 ring-primary"
              : ""
        }`}
        onPress={() => router.push(`/movie/${credit.id}`)}
      >
        <CardBody className="p-0 relative overflow-hidden">
          <div className="relative aspect-[2/3] w-full">
            <Image
              removeWrapper
              alt={credit.title || credit.name || "Movie poster"}
              className="object-cover w-full h-full"
              src={
                credit.poster_path
                  ? `https://image.tmdb.org/t/p/w500${credit.poster_path}`
                  : "/placeholder-poster.jpg"
              }
            />

            {/* Watched / nominated badge */}
            {watched && (
              <div className="absolute top-2 right-2 z-10">
                {isWinner ? (
                  <Tooltip
                    content={`Watched on Movie Monday${
                      watched.appearances > 1
                        ? ` (${watched.appearances}x)`
                        : ""
                    }`}
                  >
                    <div className="bg-warning text-white p-1.5 rounded-full shadow-md">
                      <Trophy className="h-4 w-4" />
                    </div>
                  </Tooltip>
                ) : (
                  <Tooltip content="Nominated but not picked">
                    <div className="bg-primary text-white p-1.5 rounded-full shadow-md">
                      <Eye className="h-4 w-4" />
                    </div>
                  </Tooltip>
                )}
              </div>
            )}

            {/* Rating chip */}
            {credit.vote_average ? (
              <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                {credit.vote_average.toFixed(1)}
              </div>
            ) : null}
          </div>

          <div className="p-2">
            <p className="text-sm font-medium line-clamp-1">
              {credit.title || credit.name}
            </p>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p className="text-xs text-default-500 line-clamp-1">
                {subtitle}
              </p>
              {year && (
                <span className="text-xs text-default-400 shrink-0">
                  {year}
                </span>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    );
  };

  const renderGrid = (credits: PersonCredit[]) => {
    if (credits.length === 0) {
      return (
        <div className="text-center py-12">
          <Film className="h-10 w-10 text-default-300 mx-auto mb-3" />
          <p className="text-default-500">
            {onlyWatched
              ? `Your group hasn't watched anything from ${person.name} yet.`
              : "No credits to show."}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {credits.map(renderCreditCard)}
      </div>
    );
  };

  // ---- Page -----------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto pb-12">
      <Button
        className="mb-4"
        size="sm"
        startContent={<ArrowLeft className="h-4 w-4" />}
        variant="light"
        onPress={() => router.back()}
      >
        Back
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="shrink-0 mx-auto md:mx-0">
          <Image
            alt={person.name}
            className="object-cover rounded-xl"
            height={300}
            src={
              person.profile_path
                ? `https://image.tmdb.org/t/p/h632${person.profile_path}`
                : "/placeholder-poster.jpg"
            }
            width={200}
          />
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-1">{person.name}</h1>
          {person.known_for_department && (
            <p className="text-default-500 mb-4">
              {person.known_for_department}
            </p>
          )}

          {/* Movie Monday analytics */}
          {isAuthenticated && ballotCount > 0 && (
            <Card className="mb-4 border border-default-200" shadow="none">
              <CardBody className="py-3">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-warning">
                      {watchedCount}
                    </p>
                    <p className="text-xs text-default-500">Watched</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {nominatedCount}
                    </p>
                    <p className="text-xs text-default-500">Nominated only</p>
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-default-500">Pick rate</span>
                      <span className="text-xs font-medium">{pickRate}%</span>
                    </div>
                    <Progress
                      aria-label="Pick rate"
                      color="warning"
                      size="sm"
                      value={pickRate}
                    />
                    <p className="text-[11px] text-default-400 mt-1">
                      When a {person.name} film is on the ballot, your group
                      picks it {pickRate}% of the time.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Personal facts */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-default-600 mb-4">
            {person.birthday && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-default-400" />
                <span>
                  {formatDate(person.birthday)}
                  {age !== null &&
                    (person.deathday
                      ? ` (died at ${age})`
                      : ` (age ${age})`)}
                </span>
              </div>
            )}
            {person.place_of_birth && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-default-400" />
                <span>{person.place_of_birth}</span>
              </div>
            )}
          </div>

          {/* Biography */}
          {person.biography && (
            <div>
              <p
                className={`text-sm text-default-700 whitespace-pre-line ${
                  bioExpanded ? "" : "line-clamp-4"
                }`}
              >
                {person.biography}
              </p>
              {person.biography.length > 320 && (
                <button
                  className="text-sm text-primary mt-1 hover:underline"
                  onClick={() => setBioExpanded((v) => !v)}
                >
                  {bioExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold">Filmography</h2>
        <div className="flex flex-wrap items-center gap-2">
          {isAuthenticated && (
            <Button
              color={onlyWatched ? "warning" : "default"}
              size="sm"
              startContent={<Trophy className="h-4 w-4" />}
              variant={onlyWatched ? "flat" : "bordered"}
              onPress={() => setOnlyWatched((v) => !v)}
            >
              {onlyWatched ? "Showing watched" : "Only watched"}
            </Button>
          )}
          <Button
            size="sm"
            variant="bordered"
            onPress={() =>
              setSortMode((m) => (m === "newest" ? "popular" : "newest"))
            }
          >
            {sortMode === "newest" ? "Sort: Newest" : "Sort: Most popular"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      {hasCrew ? (
        <Tabs
          aria-label="Filmography sections"
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
        >
          <Tab key="acting" title={`Acting (${actingCredits.length})`}>
            <div className="mt-4">{renderGrid(visibleActing)}</div>
          </Tab>
          <Tab key="crew" title={`Directing & Writing (${crewCredits.length})`}>
            <div className="mt-4">{renderGrid(visibleCrew)}</div>
          </Tab>
        </Tabs>
      ) : (
        <div className="mt-2">{renderGrid(visibleActing)}</div>
      )}
    </div>
  );
}