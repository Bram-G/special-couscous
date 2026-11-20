"use client";

import React, { useState } from "react";
import { Chip } from "@heroui/react";
import { ChevronDown, Trophy, Users } from "lucide-react";

import { VoteResults as VoteResultsType } from "@/types/voting";

const posterUrl = (path: string | null) =>
  path ? `https://image.tmdb.org/t/p/w342${path}` : "/placeholder-poster.jpg";

interface VoteResultsProps {
  results: VoteResultsType;
  /** Smaller layout for tight spaces */
  compact?: boolean;
}

/**
 * Anonymous results — only counts are ever shown.
 * Single vote: plain tallies. Ranked choice: final instant-runoff round, with
 * an expandable round-by-round breakdown.
 */
export default function VoteResults({ results, compact = false }: VoteResultsProps) {
  const [showRounds, setShowRounds] = useState(false);

  const isRanked = results.mode === "ranked";
  const isClosed = results.status === "closed";
  const titleFor = (id: number) =>
    results.candidates.find((c) => c.id === id)?.title || "Removed movie";

  const finalRound = isRanked && results.rounds.length
    ? results.rounds[results.rounds.length - 1]
    : null;

  // Denominator for bar widths: ballots still counting in the final round
  const denominator = finalRound ? finalRound.active : results.totalBallots;

  // Candidates eliminated in ranked mode get 0 in the final round
  const rows = results.candidates
    .map((c) => ({
      ...c,
      count: results.counts[String(c.id)] ?? 0,
      firstChoice: results.firstChoiceCounts[String(c.id)] ?? 0,
      isWinner: results.winnerIds.indexOf(c.id) !== -1,
    }))
    .sort((a, b) => b.count - a.count || b.firstChoice - a.firstChoice);

  const winnerLabel = results.totalBallots === 0
    ? null
    : results.isTie
      ? isClosed ? "It's a tie!" : "Currently tied"
      : isClosed ? "Winner" : "Leading";

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-default-500 text-sm">
          <Users className="h-4 w-4" />
          <span>
            {results.totalBallots} {results.totalBallots === 1 ? "vote" : "votes"}
          </span>
        </div>
        <div className="flex gap-2">
          <Chip size="sm" variant="flat">
            {isRanked ? "Ranked choice" : "Single vote"}
          </Chip>
          <Chip color={isClosed ? "default" : "success"} size="sm" variant="dot">
            {isClosed ? "Closed" : "Live"}
          </Chip>
        </div>
      </div>

      {results.totalBallots === 0 ? (
        <p className="text-center text-default-400 py-6 text-sm">
          No votes yet — waiting for the first ballot…
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => {
            const pct = denominator > 0 ? Math.round((row.count / denominator) * 100) : 0;
            const eliminated = isRanked && finalRound && finalRound.counts[String(row.id)] === undefined;

            return (
              <div
                key={row.id}
                className={`flex items-center gap-3 rounded-xl p-2 border transition-colors ${
                  row.isWinner
                    ? "border-yellow-400/60 bg-yellow-400/10"
                    : "border-default-200 bg-content1"
                } ${eliminated ? "opacity-50" : ""}`}
              >
                <img
                  alt={row.title}
                  className={`rounded-md object-cover flex-shrink-0 ${
                    compact ? "w-8 h-12" : "w-10 h-[60px]"
                  }`}
                  src={posterUrl(row.posterPath)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm truncate">
                      {row.isWinner && (
                        <Trophy className="inline h-3.5 w-3.5 text-yellow-400 mr-1 -mt-0.5" />
                      )}
                      {row.title}
                    </p>
                    <span className="text-sm font-semibold tabular-nums">
                      {eliminated ? "out" : row.count}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-default-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        row.isWinner ? "bg-yellow-400" : "bg-primary"
                      }`}
                      style={{ width: `${eliminated ? 0 : pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {winnerLabel && results.winnerIds.length > 0 && (
        <p className="text-sm text-center">
          <span className="text-default-500">{winnerLabel}: </span>
          <span className="font-semibold">
            {results.winnerIds.map(titleFor).join(" & ")}
          </span>
        </p>
      )}

      {isRanked && results.rounds.length > 1 && (
        <div className="rounded-xl border border-default-200">
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-default-600"
            type="button"
            onClick={() => setShowRounds((v) => !v)}
          >
            <span>How the runoff played out ({results.rounds.length} rounds)</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showRounds ? "rotate-180" : ""}`}
            />
          </button>
          {showRounds && (
            <ol className="px-3 pb-3 flex flex-col gap-2 text-sm">
              {results.rounds.map((round, i) => (
                <li key={i} className="border-t border-default-100 pt-2">
                  <p className="font-medium mb-1">Round {i + 1}</p>
                  <ul className="text-default-500 flex flex-col gap-0.5">
                    {Object.keys(round.counts)
                      .sort((a, b) => round.counts[b] - round.counts[a])
                      .map((id) => (
                        <li key={id} className="flex justify-between">
                          <span className="truncate pr-2">{titleFor(Number(id))}</span>
                          <span className="tabular-nums">{round.counts[id]}</span>
                        </li>
                      ))}
                  </ul>
                  {round.eliminated.length > 0 && (
                    <p className="text-xs text-danger mt-1">
                      Eliminated: {round.eliminated.map(titleFor).join(", ")} — their
                      votes moved to each voter&apos;s next choice
                    </p>
                  )}
                  {round.exhausted > 0 && (
                    <p className="text-xs text-default-400">
                      {round.exhausted} ballot{round.exhausted === 1 ? "" : "s"} had no
                      remaining choices
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}