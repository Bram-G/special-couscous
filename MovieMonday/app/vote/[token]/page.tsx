// app/vote/[token]/page.tsx — public ballot reached by scanning the host's QR
// code. No login: each browser gets a random anonymous voter key.
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Card, Spinner } from "@heroui/react";
import { CheckCircle2, Clapperboard, Lock, RotateCcw, Trophy } from "lucide-react";

import RankedBallotList from "@/components/Voting/RankedBallotList";
import VoteResults from "@/components/Voting/VoteResults";
import { useVoteStream } from "@/hooks/useVoteStream";
import { VoteCandidate, VoteMode, VoteStatus } from "@/types/voting";

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
              ? "Drag the handles to put your favorite on top. Top spot = 1st choice."
              : "Tap the one movie you want to watch."}
          </p>

          {mode === "ranked" ? (
            <RankedBallotList
              candidates={candidates}
              order={selection}
              onChange={reorder}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {candidates.map((c) => {
                const isSelected = selection.indexOf(c.id) !== -1;

                return (
                  <button
                    key={c.id}
                    aria-pressed={isSelected}
                    className={`relative rounded-2xl overflow-hidden text-left transition-all active:scale-[0.97] ${
                      isSelected
                        ? "ring-4 ring-primary shadow-lg shadow-primary/30"
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