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