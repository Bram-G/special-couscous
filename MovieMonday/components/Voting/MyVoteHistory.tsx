"use client";

// A signed-in user's own voting record. Only their ballot is ever shown —
// everyone else is just anonymous counts, same as the live results.

import React, { useEffect, useState } from "react";
import NextLink from "next/link";
import { Button, Chip, Skeleton } from "@heroui/react";
import CountUp from "react-countup";
import {
  ArrowRight,
  CalendarDays,
  History,
  ListOrdered,
  Sparkles,
  Trophy,
  Users,
  Vote,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { MyVoteHistoryEntry, MyVoteSummary } from "@/types/voting";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const posterUrl = (path: string | null) =>
  path ? `https://image.tmdb.org/t/p/w342${path}` : "/placeholder-poster.jpg";

// Parse YYYY-MM-DD as a local date (avoids the UTC day-shift bug)
const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);

  return new Date(y, m - 1, d).toLocaleDateString("default", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const RANK_BADGE = ["bg-yellow-400 text-black", "bg-default-300 text-black", "bg-amber-700 text-white"];

// ---------------------------------------------------------------------------

function StatTile({
  icon,
  label,
  value,
  suffix = "",
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-default-200 bg-content1 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-default-400">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-3xl font-extrabold tabular-nums">
        {value === null ? "—" : <CountUp duration={1.2} end={value} suffix={suffix} />}
      </p>
      {hint && <p className="mt-1 text-xs text-default-400">{hint}</p>}
    </div>
  );
}

function OutcomeChip({ entry }: { entry: MyVoteHistoryEntry }) {
  if (entry.session.status === "open" && entry.myPickWon === null) {
    return (
      <Chip color="success" size="sm" variant="dot">
        Voting open
      </Chip>
    );
  }
  if (entry.myPickWon === true) {
    return (
      <Chip
        color="warning"
        size="sm"
        startContent={<Sparkles className="h-3.5 w-3.5" />}
        variant="flat"
      >
        Your pick won
      </Chip>
    );
  }
  if (entry.myPickWon === false) {
    return (
      <Chip size="sm" variant="flat">
        Outvoted
      </Chip>
    );
  }

  return (
    <Chip size="sm" variant="flat">
      {entry.results.isTie ? "Tied" : "No result"}
    </Chip>
  );
}

function VoteHistoryCard({ entry }: { entry: MyVoteHistoryEntry }) {
  const mm = entry.movieMonday;
  const isRanked = entry.session.mode === "ranked";
  const isOpen = entry.session.status === "open";
  // What "won" means here: the movie actually watched, else the tally winner
  const winnerId =
    entry.watchedId ??
    (entry.results.winnerIds.length === 1 ? entry.results.winnerIds[0] : null);
  const total = entry.results.totalBallots;

  return (
    <div className="rounded-2xl border border-default-200 bg-content1 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-semibold">
            <CalendarDays className="h-4 w-4 text-default-400" />
            {mm ? formatDate(mm.date) : "Movie Monday"}
          </p>
          <p className="mt-0.5 truncate text-xs text-default-400">
            {mm?.groupName || "Unknown group"}
            {mm?.weekTheme ? ` · "${mm.weekTheme}"` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {isRanked && (
            <Chip size="sm" startContent={<ListOrdered className="h-3 w-3" />} variant="flat">
              Ranked
            </Chip>
          )}
          <OutcomeChip entry={entry} />
        </div>
      </div>

      {/* The movies on the ballot */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {entry.candidates.map((c) => {
          const myRank = entry.myRankings.indexOf(c.id);
          const isMine = myRank === 0;
          const isWinner = winnerId === c.id;
          const count = entry.results.firstChoiceCounts[String(c.id)] ?? 0;
          const pct = total ? Math.round((count / total) * 100) : 0;

          return (
            <div key={c.id} className="flex flex-col">
              <div
                className={`relative overflow-hidden rounded-xl ${
                  isMine
                    ? "ring-2 ring-primary"
                    : isWinner
                      ? "ring-2 ring-yellow-400/70"
                      : "ring-1 ring-default-200"
                } ${!isMine && !isWinner && !isOpen ? "opacity-60" : ""}`}
              >
                <img
                  alt={c.title}
                  className="aspect-[2/3] w-full object-cover"
                  loading="lazy"
                  src={posterUrl(c.posterPath)}
                />
                {/* My ranking badge (ranked) or "my pick" badge (single) */}
                {myRank !== -1 && (isRanked || isMine) && (
                  <span
                    className={`pointer-events-none absolute top-1.5 left-1.5 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-bold shadow ${
                      isRanked
                        ? RANK_BADGE[myRank] || "bg-default-100 text-default-600"
                        : "bg-primary text-white"
                    }`}
                  >
                    {isRanked ? `#${myRank + 1}` : "You"}
                  </span>
                )}
                {isWinner && (
                  <span className="pointer-events-none absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-black shadow">
                    <Trophy className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-xs font-medium leading-tight line-clamp-2">
                {c.title}
              </p>
              {/* Anonymous first-choice share */}
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-default-100">
                <div
                  className={`h-full rounded-full ${isWinner ? "bg-yellow-400" : "bg-primary/70"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-0.5 text-[11px] text-default-400 tabular-nums">
                {count} {isRanked ? "1st" : count === 1 ? "vote" : "votes"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-default-400">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {total} {total === 1 ? "voter" : "voters"}
        </span>
        {isOpen && (
          <Button
            as={NextLink}
            color="primary"
            endContent={<ArrowRight className="h-3.5 w-3.5" />}
            href={`/vote/${entry.session.token}`}
            size="sm"
            variant="flat"
          >
            Change vote
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export default function MyVoteHistory() {
  const { token } = useAuth();
  const [votes, setVotes] = useState<MyVoteHistoryEntry[]>([]);
  const [summary, setSummary] = useState<MyVoteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/votes/me/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();

        if (!res.ok) throw new Error(json.message || "Couldn't load your votes");
        setVotes(json.votes || []);
        setSummary(json.summary || null);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight">
          <History className="h-7 w-7 text-primary" />
          My votes
        </h1>
        <p className="mt-1 text-default-500">
          Every Movie Monday vote you&apos;ve cast while signed in. Other voters stay
          anonymous. You only ever see your own ballot.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <p className="py-10 text-center text-danger">{error}</p>
      ) : votes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-default-300 py-14 text-center">
          <Vote className="h-10 w-10 text-default-300" />
          <p className="font-semibold">No votes yet</p>
          <p className="max-w-sm text-sm text-default-500">
            Next time your host shares a voting QR code, vote while you&apos;re signed in
            and it&apos;ll show up here.
          </p>
        </div>
      ) : (
        <>
          {summary && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatTile
                icon={<Vote className="h-3.5 w-3.5" />}
                label="Votes cast"
                value={summary.totalVotes}
              />
              <StatTile
                hint={
                  summary.decided
                    ? `${summary.wins} of ${summary.decided} decided votes`
                    : "Shows up once a vote closes"
                }
                icon={<Trophy className="h-3.5 w-3.5" />}
                label="Room agreed"
                suffix="%"
                value={summary.winRate}
              />
              <StatTile
                icon={<Users className="h-3.5 w-3.5" />}
                label={summary.groups === 1 ? "Group" : "Groups"}
                value={summary.groups}
              />
            </div>
          )}

          <div className="flex flex-col gap-4">
            {votes.map((v) => (
              <VoteHistoryCard key={v.ballotId} entry={v} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}