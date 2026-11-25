// app/vote/[token]/page.tsx — public ballot reached by scanning the host's QR
// code. No login: each browser gets a random anonymous voter key.
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { Button, Chip, Skeleton, Spinner } from "@heroui/react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  History,
  Clapperboard,
  Clock,
  Lock,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  UtensilsCrossed,
  Vote,
} from "lucide-react";

import MovieDetailsPanel, { Collapse } from "@/components/Voting/MovieDetailsPanel";
import RankedBallotList from "@/components/Voting/RankedBallotList";
import VoteResults from "@/components/Voting/VoteResults";
import { useAuth } from "@/contexts/AuthContext";
import { useVoteStream } from "@/hooks/useVoteStream";
import { loginHref } from "@/utils/authRedirect";
import {
  VoteCandidate,
  VoteCandidateDetails,
  VoteMode,
  VoteStatus,
} from "@/types/voting";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const VOTER_KEY_STORAGE = "mm-voter-key";
const ballotStorageKey = (token: string) => `mm-ballot-${token}`;

const posterUrl = (path: string | null) =>
  path ? `https://image.tmdb.org/t/p/w342${path}` : "/placeholder-poster.jpg";
const backdropUrl = (path: string | null) =>
  path ? `https://image.tmdb.org/t/p/w780${path}` : null;

// localStorage can throw (private mode, embedded browsers) — never let it
// break voting.
const safeGet = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
const safeSet = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

const makeVoterKey = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }

  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 36).toString(36),
  ).join("");
};

// A tiny buzz on phones that support it, so picking feels physical
const buzz = () => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(10);
    } catch {
      // ignore
    }
  }
};

interface PublicVoteData {
  session: { mode: VoteMode; status: VoteStatus };
  movieMonday: {
    date: string;
    weekTheme: string | null;
    groupName: string | null;
    pickerName: string | null;
  } | null;
  candidates: VoteCandidate[];
}

// Parse YYYY-MM-DD as a local date (avoids the UTC day-shift bug)
const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);

  return new Date(y, m - 1, d).toLocaleDateString("default", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

const formatRuntime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;

  return h ? `${h}h ${m}m` : `${m}m`;
};

// ---------------------------------------------------------------------------
// Hero — fanned posters over a backdrop that follows the voter's pick
// ---------------------------------------------------------------------------

interface VoteHeroProps {
  data: PublicVoteData;
  candidates: VoteCandidate[];
  details: Record<number, VoteCandidateDetails>;
  focusId: number | null;
  totalBallots: number | null;
  isClosed: boolean;
}

function VoteHero({
  data,
  candidates,
  details,
  focusId,
  totalBallots,
  isClosed,
}: VoteHeroProps) {
  const mm = data.movieMonday;
  // Before a pick, the first movie sets the mood
  const bgId = focusId ?? candidates[0]?.id ?? null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-default-200 bg-content1">
      {/* Every backdrop stays mounted so switching picks crossfades */}
      <div className="absolute inset-0">
        {candidates.map((c) => {
          const bg = backdropUrl(details[c.id]?.backdropPath ?? null);

          return (
            <img
              key={c.id}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                bg ? "" : "scale-125 blur-2xl"
              } ${bgId === c.id ? "opacity-60" : "opacity-0"}`}
              src={bg || posterUrl(c.posterPath)}
            />
          );
        })}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-content1/70 to-content1" />
      </div>

      <div className="relative flex flex-col items-center px-5 pt-5 pb-6 text-center">
        {/* Top row: group + live pill */}
        <div className="flex w-full items-center justify-between gap-2">
          <p className="truncate text-xs font-medium uppercase tracking-widest text-white/70">
            {mm?.groupName || "Movie Monday"}
          </p>
          {isClosed ? (
            <span className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white/80 backdrop-blur-md">
              <Lock className="h-3 w-3" /> Closed
            </span>
          ) : (
            <span className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              Live
              {totalBallots !== null && (
                <span className="text-white/70">
                  · {totalBallots} {totalBallots === 1 ? "vote" : "votes"}
                </span>
              )}
            </span>
          )}
        </div>

        {/* Fanned poster trio — same visual language as PublicGroupCard */}
        <div className="mt-5 mb-4 flex h-36 items-end justify-center">
          {candidates.map((c, i) => {
            const offset = i - (candidates.length - 1) / 2;
            const isFocus = focusId === c.id;

            return (
              <img
                key={c.id}
                alt=""
                className="-mx-2 h-32 w-auto rounded-lg object-cover shadow-2xl ring-1 ring-white/10 transition-transform duration-500 ease-out"
                src={posterUrl(c.posterPath)}
                style={{
                  transform: isFocus
                    ? "rotate(0deg) translateY(-10px) scale(1.12)"
                    : `rotate(${offset * 8}deg) translateY(${Math.abs(offset) * 8}px)`,
                  zIndex: isFocus ? 10 : candidates.length - Math.abs(offset),
                }}
              />
            );
          })}
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight">
          {isClosed ? "The votes are in" : "What are we watching?"}
        </h1>

        {mm && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-default-500">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(mm.date)}
            </span>
            {mm.pickerName && (
              <span>
                picked by{" "}
                <span className="font-semibold text-foreground">{mm.pickerName}</span>
              </span>
            )}
          </div>
        )}

        {mm?.weekTheme && (
          <Chip
            className="mt-3"
            color="primary"
            startContent={<Sparkles className="h-3.5 w-3.5" />}
            variant="flat"
          >
            {mm.weekTheme}
          </Chip>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ballot card — one per movie (single-vote mode)
// ---------------------------------------------------------------------------

interface BallotCardProps {
  candidate: VoteCandidate;
  index: number;
  details: VoteCandidateDetails | undefined;
  detailsLoading: boolean;
  isSelected: boolean;
  isDimmed: boolean;
  isExpanded: boolean;
  onPick: () => void;
  onToggleDetails: () => void;
}

function BallotCard({
  candidate: c,
  index,
  details,
  detailsLoading,
  isSelected,
  isDimmed,
  isExpanded,
  onPick,
  onToggleDetails,
}: BallotCardProps) {
  const bg = backdropUrl(details?.backdropPath ?? null);
  const panelId = `ballot-card-details-${c.id}`;

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-content1 transition-all duration-300 ${
        isSelected
          ? "border-primary shadow-[0_0_40px_-10px] shadow-primary/60"
          : "border-default-200 shadow-sm"
      } ${isDimmed ? "opacity-60 scale-[0.98]" : "opacity-100"}`}
    >
      {/* Main tap target: backdrop + poster + title → picks this movie */}
      <button
        aria-pressed={isSelected}
        className="block w-full text-left transition-transform active:scale-[0.99]"
        type="button"
        onClick={onPick}
      >
        <div className="relative h-28 overflow-hidden bg-default-200">
          <img
            alt=""
            className={`h-full w-full object-cover transition-all duration-500 ${
              bg ? "" : "scale-125 blur-xl"
            } ${isSelected ? "saturate-150" : "saturate-[0.85]"}`}
            src={bg || posterUrl(c.posterPath)}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-content1 via-content1/40 to-transparent" />
          <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
            Option {index + 1}
          </span>
          {details?.voteAverage ? (
            <span className="pointer-events-none absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-md">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {details.voteAverage.toFixed(1)}
            </span>
          ) : null}
        </div>

        <div className="relative -mt-14 flex items-end gap-4 px-4">
          <div className="relative flex-shrink-0">
            <img
              alt={c.title}
              className={`w-24 aspect-[2/3] rounded-xl object-cover shadow-xl transition-all duration-300 ${
                isSelected ? "ring-4 ring-primary" : "ring-1 ring-white/10"
              }`}
              src={posterUrl(c.posterPath)}
            />
            <span
              className={`pointer-events-none absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all duration-300 ${
                isSelected ? "scale-100 opacity-100" : "scale-50 opacity-0"
              }`}
            >
              <Check className="h-5 w-5" strokeWidth={3} />
            </span>
          </div>

          <div className="min-w-0 flex-1 pb-1">
            <h2 className="text-lg font-bold leading-tight line-clamp-2">{c.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-default-500">
              {c.releaseYear && <span>{c.releaseYear}</span>}
              {details?.runtime ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRuntime(details.runtime)}
                </span>
              ) : null}
              {!details && detailsLoading && <Skeleton className="h-3 w-12 rounded-md" />}
            </div>
          </div>
        </div>

        <div className="px-4 pt-3">
          {details ? (
            <>
              {details.genres.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {details.genres.slice(0, 3).map((g) => (
                    <Chip key={g} size="sm" variant="flat">
                      {g}
                    </Chip>
                  ))}
                </div>
              )}
              {details.tagline && (
                <p className="mt-2 text-sm italic text-default-500 line-clamp-2">
                  &ldquo;{details.tagline}&rdquo;
                </p>
              )}
            </>
          ) : detailsLoading ? (
            <div className="flex gap-1">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ) : null}
        </div>
      </button>

      <Collapse isOpen={isExpanded}>
        <div className="px-4 pt-4" id={panelId}>
          <MovieDetailsPanel details={details} loading={detailsLoading} variant="extras" />
        </div>
      </Collapse>

      {/* Footer actions — siblings of the main button (buttons can't nest) */}
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <button
          aria-controls={panelId}
          aria-expanded={isExpanded}
          className="-ml-2 flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-default-500 hover:text-foreground"
          type="button"
          onClick={onToggleDetails}
        >
          {isExpanded ? "Less" : "More about this one"}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
        <Button
          className="font-semibold"
          color="primary"
          radius="full"
          size="sm"
          startContent={isSelected ? <CheckCircle2 className="h-4 w-4" /> : undefined}
          variant={isSelected ? "solid" : "flat"}
          onPress={onPick}
        >
          {isSelected ? "Your pick" : "Pick"}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tiny error boundary: if an optional extra (like the sign-up card) ever
// throws, it disappears instead of taking down the whole ballot page.
// ---------------------------------------------------------------------------

class SafeBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Vote page section failed to render:", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Sign-up nudge for voters without accounts
// ---------------------------------------------------------------------------

function JoinCta({ returnPath }: { returnPath: string }) {
  const perks = [
    { icon: <Vote className="h-4 w-4" />, text: "Run votes like this one for your crew" },
    { icon: <UtensilsCrossed className="h-4 w-4" />, text: "Log the dinners & cocktails" },
    { icon: <Trophy className="h-4 w-4" />, text: "Watch your group's stats pile up" },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-content1 to-content1 p-5">
      <Clapperboard className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 rotate-12 text-primary/10" />
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        Like this?
      </p>
      <h3 className="mt-1 text-xl font-bold leading-tight">Start your own Movie Monday</h3>
      <ul className="mt-3 flex flex-col gap-2">
        {perks.map((p) => (
          <li key={p.text} className="flex items-center gap-2 text-sm text-default-600">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              {p.icon}
            </span>
            {p.text}
          </li>
        ))}
      </ul>
      <Button
        fullWidth
        as={NextLink}
        className="mt-4 font-semibold"
        color="primary"
        endContent={<ArrowRight className="h-4 w-4" />}
        href={loginHref(returnPath, { signup: true })}
      >
        Create a free account
      </Button>
      <p className="mt-3 text-center text-sm text-default-500">
        Already have one?{" "}
        <NextLink
          className="font-semibold text-primary hover:underline"
          href={loginHref(returnPath)}
        >
          Sign in
        </NextLink>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function VotePage() {
  const params = useParams();
  const token = String(params?.token || "");
  const { isAuthenticated, token: authToken, user } = useAuth();
  const claimAttempted = useRef(false);

  const [data, setData] = useState<PublicVoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [voterKey, setVoterKey] = useState("");
  const [selection, setSelection] = useState<number[]>([]); // ordered ids
  const [submitted, setSubmitted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [details, setDetails] = useState<Record<number, VoteCandidateDetails>>({});
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [entered, setEntered] = useState(false);

  const { results, setResults } = useVoteStream(token || null);

  // Anonymous voter key + any ballot this browser already cast
  useEffect(() => {
    let key = safeGet(VOTER_KEY_STORAGE);

    if (!key) {
      key = makeVoterKey();
      safeSet(VOTER_KEY_STORAGE, key);
    }
    setVoterKey(key);

    const saved = token ? safeGet(ballotStorageKey(token)) : null;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length) {
          setSelection(parsed);
          setSubmitted(true);
        }
      } catch {
        // ignore
      }
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/votes/s/${token}`);
        const json = await res.json();

        if (!res.ok) throw new Error(json.message || "Couldn't load this vote");
        setData(json);
      } catch (e: any) {
        setLoadError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Movie details for the cards. Loaded separately so the ballot itself
  // shows instantly; if this fails, voting still works.
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/votes/s/${token}/details`);

        if (!res.ok) return;
        const json = await res.json();

        setDetails(json.details || {});
      } catch {
        // ignore — cards just show "couldn't load"
      } finally {
        setDetailsLoading(false);
      }
    })();
  }, [token]);

  // Voted as a guest, then signed in (e.g. via the sign-up card)? Link that
  // ballot to the account so it shows in their vote history. Runs once.
  useEffect(() => {
    if (!isAuthenticated || !authToken || !voterKey || !submitted) return;
    if (claimAttempted.current) return;
    claimAttempted.current = true;
    fetch(`${API_BASE_URL}/api/votes/s/${token}/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ voterKey }),
    }).catch(() => {
      // Not critical — the vote itself already counted
    });
  }, [isAuthenticated, authToken, voterKey, submitted, token]);

  // Staggered entrance once the ballot is on screen
  useEffect(() => {
    if (!data) return;
    const t = window.setTimeout(() => setEntered(true), 30);

    return () => window.clearTimeout(t);
  }, [data]);

  // Ranked ballots always hold every movie in some order. Start from the
  // ballot this browser already cast (if any) and append anything missing.
  useEffect(() => {
    if (!data || data.session.mode !== "ranked") return;
    const ids = data.candidates.map((c) => c.id);

    setSelection((prev) => {
      const kept = prev.filter((id) => ids.indexOf(id) !== -1);

      return kept.concat(ids.filter((id) => kept.indexOf(id) === -1));
    });
  }, [data]);

  // Live status wins over the initial fetch (host may close mid-vote)
  const status: VoteStatus | undefined = results?.status || data?.session.status;
  const mode: VoteMode | undefined = data?.session.mode;
  const isClosed = status === "closed";
  const candidates = data?.candidates || [];

  const showBallot = !isClosed && (!submitted || editing);

  // Single vote: tap a card
  const pickSingle = (id: number) => {
    setSubmitError("");
    if (selection[0] !== id) buzz();
    setSelection([id]);
  };

  const toggleDetails = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const reorder = (order: number[]) => {
    setSubmitError("");
    setSelection(order);
  };

  const submit = async () => {
    if (!selection.length || !voterKey) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/votes/s/${token}/ballot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Signed in? The ballot gets linked to the account for vote history.
          // Results stay anonymous either way.
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ voterKey, rankings: selection }),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.message || "Vote failed — try again");
      safeSet(ballotStorageKey(token), JSON.stringify(selection));
      setSubmitted(true);
      setEditing(false);
      setExpandedId(null);
      if (json.results) setResults(json.results);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTitles = useMemo(
    () =>
      selection
        .map((id) => candidates.find((c) => c.id === id)?.title)
        .filter(Boolean) as string[],
    [selection, candidates],
  );

  // Hero + sticky bar follow the voter's pick (ranked: their current #1)
  const topPick = selection.length
    ? candidates.find((c) => c.id === selection[0])
    : undefined;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="max-w-md mx-auto text-center py-20 flex flex-col items-center gap-3">
        <Clapperboard className="h-10 w-10 text-default-400" />
        <h1 className="text-xl font-semibold">Vote not found</h1>
        <p className="text-default-500">
          {loadError || "This link may be old. Ask the host for a fresh QR code."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-16 flex flex-col gap-5">
      <VoteHero
        candidates={candidates}
        data={data}
        details={details}
        focusId={topPick ? topPick.id : null}
        isClosed={isClosed}
        totalBallots={results ? results.totalBallots : null}
      />

      {showBallot ? (
        <>
          <p className="text-center text-sm text-default-500">
            {mode === "ranked"
              ? "Drag the handles to put your favorite on top. Tap a movie for details."
              : "Pick the one you want to watch tonight."}
          </p>
          {isAuthenticated && (
            <p className="-mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-default-400">
              <History className="h-3.5 w-3.5" />
              Voting as{" "}
              <span className="font-semibold text-default-500">
                {user?.username || "you"}
              </span>
              · saved to your vote history
            </p>
          )}

          {mode === "ranked" ? (
            <RankedBallotList
              candidates={candidates}
              details={details}
              detailsLoading={detailsLoading}
              order={selection}
              onChange={reorder}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {candidates.map((c, i) => {
                const isSelected = selection.indexOf(c.id) !== -1;

                return (
                  // Outer wrapper handles the one-time entrance only, so its
                  // delay never slows down selection transitions on the card
                  <div
                    key={c.id}
                    className={`transition-all duration-500 ease-out ${
                      entered ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                    }`}
                    style={{ transitionDelay: `${i * 110}ms` }}
                  >
                    <BallotCard
                      candidate={c}
                      details={details[c.id]}
                      detailsLoading={detailsLoading}
                      index={i}
                      isDimmed={selection.length > 0 && !isSelected}
                      isExpanded={expandedId === c.id}
                      isSelected={isSelected}
                      onPick={() => pickSingle(c.id)}
                      onToggleDetails={() => toggleDetails(c.id)}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {submitError && <p className="text-sm text-danger text-center">{submitError}</p>}

          {/* Sticky submit bar — shows what you're about to vote for */}
          <div className="sticky bottom-4 z-20">
            <div className="flex items-center gap-3 rounded-2xl border border-default-200 bg-content1/85 p-2 pl-3 shadow-2xl backdrop-blur-xl">
              {topPick ? (
                <img
                  alt=""
                  className="h-12 w-8 flex-shrink-0 rounded-md object-cover"
                  src={posterUrl(topPick.posterPath)}
                />
              ) : (
                <div className="flex h-12 w-8 flex-shrink-0 items-center justify-center rounded-md border border-dashed border-default-300">
                  <Vote className="h-4 w-4 text-default-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wider text-default-400">
                  {mode === "ranked" ? "Your #1" : topPick ? "Your pick" : "No pick yet"}
                </p>
                <p className="truncate text-sm font-semibold">
                  {topPick ? topPick.title : "Tap a movie above"}
                </p>
              </div>
              <Button
                className="flex-shrink-0 font-semibold"
                color="primary"
                isDisabled={!selection.length}
                isLoading={submitting}
                onPress={submit}
              >
                {editing ? "Update" : "Submit vote"}
              </Button>
            </div>
            {editing && (
              <Button
                fullWidth
                className="mt-2"
                size="sm"
                variant="light"
                onPress={() => setEditing(false)}
              >
                Cancel
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          {submitted && !isClosed && (
            <div className="relative overflow-hidden rounded-2xl border border-success/40 bg-gradient-to-br from-success/15 via-content1 to-content1 p-4">
              <div className="flex items-center gap-4">
                {topPick && (
                  <div className="relative flex-shrink-0">
                    <img
                      alt=""
                      className="h-24 w-16 rounded-lg object-cover shadow-lg"
                      src={posterUrl(topPick.posterPath)}
                    />
                    <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-success text-white shadow-md">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold">You&apos;re in! 🍿</p>
                  <p className="text-sm text-default-500">
                    {mode === "ranked"
                      ? selectedTitles.map((t, i) => `${i + 1}. ${t}`).join("  ")
                      : `You voted for ${selectedTitles[0]}`}
                  </p>
                  <div className="mt-2 -ml-1 flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      startContent={<RotateCcw className="h-3.5 w-3.5" />}
                      variant="light"
                      onPress={() => setEditing(true)}
                    >
                      Change my vote
                    </Button>
                    {isAuthenticated && (
                      <Button
                        as={NextLink}
                        href="/my-votes"
                        size="sm"
                        startContent={<History className="h-3.5 w-3.5" />}
                        variant="light"
                      >
                        My votes
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {results ? (
            <div className="rounded-2xl border border-default-200 bg-content1 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <h2 className="font-semibold">
                  {isClosed ? "Final results" : "Live results"}
                </h2>
              </div>
              <VoteResults compact results={results} />
            </div>
          ) : (
            <div className="flex justify-center py-6">
              <Spinner size="sm" />
            </div>
          )}

          {!isAuthenticated && (
            <SafeBoundary>
              <JoinCta returnPath={`/vote/${token}`} />
            </SafeBoundary>
          )}
        </>
      )}
    </div>
  );
}