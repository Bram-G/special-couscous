// types/voting.ts — shapes returned by /api/votes

export type VoteMode = "single" | "ranked";
export type VoteStatus = "open" | "closed";

export interface VoteCandidate {
  id: number; // MovieSelection id
  tmdbMovieId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
}

export interface VoteRound {
  counts: Record<string, number>;
  exhausted: number;
  active: number;
  eliminated: number[];
}

export interface VoteResults {
  sessionId: number;
  mode: VoteMode;
  status: VoteStatus;
  totalBallots: number;
  candidates: VoteCandidate[];
  counts: Record<string, number>; // final-round counts (ranked) or plain counts (single)
  firstChoiceCounts: Record<string, number>;
  rounds: VoteRound[];
  winnerIds: number[];
  isTie: boolean;
  updatedAt: string;
}

export interface VoteSessionInfo {
  id: number;
  token: string;
  mode: VoteMode;
  status: VoteStatus;
  movieMondayId: number;
  createdAt: string;
  closedAt: string | null;
}
export interface VoteCastMember {
  name: string;
  character: string | null;
  profilePath: string | null;
}

/** Expanded info for a ballot card — GET /api/votes/s/:token/details */
export interface VoteCandidateDetails {
  id: number; // MovieSelection id
  overview: string | null;
  tagline: string | null;
  runtime: number | null; // minutes
  voteAverage: number | null; // TMDB 0–10
  backdropPath: string | null;
  genres: string[];
  directors: string[];
  cast: VoteCastMember[];
}
/** One entry in GET /api/votes/me/history — only the user's own ballot */
export interface MyVoteHistoryEntry {
  ballotId: number;
  votedAt: string;
  session: {
    id: number;
    token: string;
    mode: VoteMode;
    status: VoteStatus;
    closedAt: string | null;
  };
  movieMonday: {
    id: number;
    date: string;
    weekTheme: string | null;
    slug: string | null;
    groupId: number;
    groupName: string | null;
  } | null;
  candidates: VoteCandidate[];
  /** This user's ballot, most-preferred first */
  myRankings: number[];
  results: {
    totalBallots: number;
    counts: Record<string, number>;
    firstChoiceCounts: Record<string, number>;
    winnerIds: number[];
    isTie: boolean;
  };
  /** Movie the group actually watched (host-applied), if set */
  watchedId: number | null;
  /** Did this user's #1 win? null while undecided */
  myPickWon: boolean | null;
}

export interface MyVoteSummary {
  totalVotes: number;
  decided: number;
  wins: number;
  winRate: number | null;
  rankedVotes: number;
  groups: number;
}