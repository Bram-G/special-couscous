"use client";

import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Card, Spinner } from "@heroui/react";
import {
  CheckCircle2,
  ChevronUp,
  Clapperboard,
  Info,
  Lock,
  RotateCcw,
  Trophy,
} from "lucide-react";

import MovieDetailsPanel, { Collapse } from "@/components/Voting/MovieDetailsPanel";
import RankedBallotList from "@/components/Voting/RankedBallotList";
import VoteResults from "@/components/Voting/VoteResults";
import { useVoteStream } from "@/hooks/useVoteStream";
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

export default function VotePage() {
  const params = useParams();
  const token = String(params?.token || "");

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
  // Last movie opened — keeps drawer content on screen while it animates shut
  const [lastExpandedId, setLastExpandedId] = useState<number | null>(null);
  const drawerRefs = useRef<Record<number, HTMLDivElement | null>>({});

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

  // Movie details for the expandable cards. Loaded separately so the ballot
  // itself shows instantly; if this fails, voting still works.
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

  // Single vote: tap one poster
  const pickSingle = (id: number) => {
    setSubmitError("");
    setSelection([id]);
  };

  // Single vote: open/close the details drawer under a poster's row
  const toggleDetails = (id: number, rowIndex: number) => {
    const opening = expandedId !== id;

    setExpandedId(opening ? id : null);
    if (opening) {
      setLastExpandedId(id);
      // Wait for the drawer to start opening, then make sure it's on screen
      window.setTimeout(() => {
        drawerRefs.current[rowIndex]?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 320);
    }
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterKey, rankings: selection }),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.message || "Vote failed — try again");
      safeSet(ballotStorageKey(token), JSON.stringify(selection));
      setSubmitted(true);
      setEditing(false);
      if (json.results) setResults(json.results);
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
      {/* Header */}
      <div className="text-center pt-2">
        <p className="text-xs uppercase tracking-widest text-default-400">
          {data.movieMonday?.groupName || "Movie Monday"}
        </p>
        <h1 className="text-2xl font-bold mt-1">What are we watching?</h1>
        {data.movieMonday && (
          <p className="text-default-500 text-sm mt-1">
            {formatDate(data.movieMonday.date)}
            {data.movieMonday.pickerName &&
              ` · picked by ${data.movieMonday.pickerName}`}
          </p>
        )}
        {data.movieMonday?.weekTheme && (
          <p className="text-sm mt-1 italic">&ldquo;{data.movieMonday.weekTheme}&rdquo;</p>
        )}
      </div>

      {isClosed && (
        <Card className="p-4 flex flex-row items-center gap-3 border border-default-200">
          <Lock className="h-5 w-5 text-default-500" />
          <p className="text-sm">Voting is closed. Here&apos;s how it turned out.</p>
        </Card>
      )}

      {showBallot ? (
        <>
          <p className="text-center text-sm text-default-500">
            {mode === "ranked"
              ? "Drag the handles to put your favorite on top. Tap a movie for details."
              : "Tap the one movie you want to watch. Tap ⓘ for details."}
          </p>

          {mode === "ranked" ? (
            <RankedBallotList
              candidates={candidates}
              details={details}
              detailsLoading={detailsLoading}
              order={selection}
              onChange={reorder}
            />
          ) : (
            // gap-y lives on each drawer (mb-3) so closed drawers don't
            // double the space between rows
            <div className="grid grid-cols-2 gap-x-3">
              {candidates.map((c, i) => {
                const isSelected = selection.indexOf(c.id) !== -1;
                const isExpanded = expandedId === c.id;
                const rowIndex = Math.floor(i / 2);
                // A drawer follows the last poster in each row of two
                const isRowEnd = i % 2 === 1 || i === candidates.length - 1;
                const rowIds = candidates
                  .slice(rowIndex * 2, rowIndex * 2 + 2)
                  .map((rc) => rc.id);
                const rowOpenId =
                  expandedId !== null && rowIds.indexOf(expandedId) !== -1
                    ? expandedId
                    : null;
                // While closing, keep showing the last movie opened in this row
                const rowShownId =
                  rowOpenId ??
                  (lastExpandedId !== null && rowIds.indexOf(lastExpandedId) !== -1
                    ? lastExpandedId
                    : null);
                const rowOpenMovie = rowShownId
                  ? candidates.find((rc) => rc.id === rowShownId)
                  : undefined;
                const rowOpenSelected =
                  rowShownId !== null && selection.indexOf(rowShownId) !== -1;
                // Notch points at the left or right poster
                const notchLeft =
                  rowShownId !== null && rowIds.indexOf(rowShownId) === 0;

                return (
                  <Fragment key={c.id}>
                    <div className="relative">
                      <button
                        aria-pressed={isSelected}
                        className={`relative w-full block rounded-2xl overflow-hidden text-left transition-all active:scale-[0.97] ${
                          isSelected
                            ? "ring-4 ring-primary shadow-lg shadow-primary/30"
                            : isExpanded
                              ? "ring-2 ring-default-400"
                              : "ring-1 ring-default-200"
                        }`}
                        type="button"
                        onClick={() => pickSingle(c.id)}
                      >
                        <img
                          alt={c.title}
                          className="w-full aspect-[2/3] object-cover"
                          src={posterUrl(c.posterPath)}
                        />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 pt-8">
                          <p className="text-white text-sm font-semibold leading-tight line-clamp-2">
                            {c.title}
                          </p>
                          {c.releaseYear && (
                            <p className="text-white/60 text-xs">{c.releaseYear}</p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="pointer-events-none absolute top-2 right-2 h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                        )}
                      </button>

                      {/* Sibling of the poster button (buttons can't nest) */}
                      <button
                        aria-controls={`vote-drawer-${rowIndex}`}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Hide" : "Show"} details for ${c.title}`}
                        className={`absolute top-2 left-2 h-9 w-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition-colors ${
                          isExpanded
                            ? "bg-white text-black"
                            : "bg-black/55 text-white hover:bg-black/75"
                        }`}
                        type="button"
                        onClick={() => toggleDetails(c.id, rowIndex)}
                      >
                        <Info className="h-5 w-5" />
                      </button>
                    </div>

                    {isRowEnd && (
                      <div
                        ref={(el) => {
                          drawerRefs.current[rowIndex] = el;
                        }}
                        className="col-span-2 mb-3 scroll-mb-28"
                        id={`vote-drawer-${rowIndex}`}
                      >
                        <Collapse isOpen={rowOpenId !== null}>
                          <div className="relative pt-3">
                            {/* Notch pointing up at the tapped poster */}
                            <span
                              className={`absolute top-1 z-10 h-4 w-4 rotate-45 border-l border-t border-default-200 bg-content1 transition-[left] duration-300 ${
                                notchLeft ? "left-[calc(25%-8px)]" : "left-[calc(75%-8px)]"
                              }`}
                            />
                            <div className="rounded-2xl border border-default-200 bg-content1 p-4">
                              {rowOpenMovie && (
                                <>
                                  <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="min-w-0">
                                      <h3 className="font-bold leading-tight">
                                        {rowOpenMovie.title}
                                      </h3>
                                      {rowOpenMovie.releaseYear && (
                                        <p className="text-xs text-default-400">
                                          {rowOpenMovie.releaseYear}
                                        </p>
                                      )}
                                    </div>
                                    <button
                                      aria-label="Hide details"
                                      className="h-8 w-8 flex-shrink-0 rounded-full bg-default-100 flex items-center justify-center text-default-500"
                                      type="button"
                                      onClick={() => setExpandedId(null)}
                                    >
                                      <ChevronUp className="h-4 w-4" />
                                    </button>
                                  </div>

                                  <MovieDetailsPanel
                                    details={details[rowOpenMovie.id]}
                                    loading={detailsLoading}
                                  />

                                  <Button
                                    fullWidth
                                    className="mt-4"
                                    color={rowOpenSelected ? "success" : "primary"}
                                    startContent={
                                      rowOpenSelected ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                      ) : undefined
                                    }
                                    variant={rowOpenSelected ? "flat" : "solid"}
                                    onPress={() => pickSingle(rowOpenMovie.id)}
                                  >
                                    {rowOpenSelected ? "Your pick" : "Pick this one"}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </Collapse>
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          )}

          {submitError && <p className="text-sm text-danger text-center">{submitError}</p>}

          <div className="flex gap-2 sticky bottom-4">
            <Button
              fullWidth
              color="primary"
              isDisabled={!selection.length}
              isLoading={submitting}
              size="lg"
              onPress={submit}
            >
              {editing ? "Update my vote" : "Submit vote"}
            </Button>
          </div>
          {editing && (
            <Button variant="light" onPress={() => setEditing(false)}>
              Cancel
            </Button>
          )}
        </>
      ) : (
        <>
          {submitted && !isClosed && (
            <Card className="p-4 border border-success/40 bg-success/10">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Vote recorded</p>
                  <p className="text-sm text-default-500">
                    {mode === "ranked"
                      ? selectedTitles.map((t, i) => `${i + 1}. ${t}`).join("  ")
                      : selectedTitles[0]}
                  </p>
                </div>
                <Button
                  size="sm"
                  startContent={<RotateCcw className="h-3.5 w-3.5" />}
                  variant="flat"
                  onPress={() => setEditing(true)}
                >
                  Change
                </Button>
              </div>
            </Card>
          )}

          {results ? (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <h2 className="font-semibold">
                  {isClosed ? "Final results" : "Live results"}
                </h2>
              </div>
              <VoteResults compact results={results} />
            </Card>
          ) : (
            <div className="flex justify-center py-6">
              <Spinner size="sm" />
            </div>
          )}
        </>
      )}
    </div>
  );
}