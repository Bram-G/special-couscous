"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@heroui/react";
import { QRCodeSVG } from "qrcode.react";
import {
  Check,
  Copy,
  ListOrdered,
  Lock,
  RotateCcw,
  Trophy,
  Unlock,
  Vote,
} from "lucide-react";

import VoteResults from "./VoteResults";

import { useVoteStream } from "@/hooks/useVoteStream";
import {
  VoteMode,
  VoteResults as VoteResultsType,
  VoteSessionInfo,
} from "@/types/voting";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface VoteHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieMondayId: number;
  token: string | null;
  /** Called with the winning MovieSelection id when the host applies it */
  onApplyWinner: (movieSelectionId: number) => Promise<void> | void;
  /** Selection id that's already marked winner, if any */
  currentWinnerId?: number | null;
}

const MODE_OPTIONS: {
  key: VoteMode;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "single",
    title: "Single vote",
    description: "Everyone picks one movie. Most votes wins.",
    icon: <Vote className="h-5 w-5" />,
  },
  {
    key: "ranked",
    title: "Ranked choice",
    description:
      "Everyone ranks their favorites. Last place is eliminated and those votes move to next choices until one movie has a majority.",
    icon: <ListOrdered className="h-5 w-5" />,
  },
];

export default function VoteHostModal({
  isOpen,
  onClose,
  movieMondayId,
  token,
  onApplyWinner,
  currentWinnerId = null,
}: VoteHostModalProps) {
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState<VoteSessionInfo | null>(null);
  const [initialResults, setInitialResults] = useState<VoteResultsType | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [mode, setMode] = useState<VoteMode>("single");
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  const { results, setResults } = useVoteStream(
    isOpen && session ? session.token : null,
    initialResults,
  );

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const voteUrl =
    session && typeof window !== "undefined"
      ? `${window.location.origin}/vote/${session.token}`
      : "";

  // Load the latest vote for this Monday whenever the modal opens
  const loadSession = useCallback(async () => {
    if (!token || !movieMondayId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/votes/monday/${movieMondayId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to load vote");
      setSession(data.session);
      setInitialResults(data.results);
      setResults(data.results);
      setShowSetup(!data.session);
      if (data.session) setMode(data.session.mode);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, movieMondayId, setResults]);

  useEffect(() => {
    if (isOpen) {
      setApplied(false);
      loadSession();
    }
  }, [isOpen, loadSession]);

  const startVote = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/votes/sessions`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ movieMondayId, mode }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to start vote");
      setSession(data.session);
      setInitialResults(data.results);
      setResults(data.results);
      setShowSetup(false);
      setApplied(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const setOpenState = async (action: "close" | "reopen") => {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/votes/sessions/${session.id}/${action}`,
        { method: "POST", headers: authHeaders },
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || `Failed to ${action} vote`);
      setSession(data.session);
      setResults(data.results);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(voteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — the URL is visible to copy manually
    }
  };

  const live = results || initialResults;
  const isClosed = session?.status === "closed";
  const soleWinnerId =
    live && !live.isTie && live.winnerIds.length === 1 ? live.winnerIds[0] : null;
  const soleWinnerTitle =
    soleWinnerId && live
      ? live.candidates.find((c) => c.id === soleWinnerId)?.title
      : null;
  const winnerAlreadySet = soleWinnerId !== null && soleWinnerId === currentWinnerId;

  const applyWinner = async () => {
    if (!soleWinnerId) return;
    setBusy(true);
    try {
      await onApplyWinner(soleWinnerId);
      setApplied(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      placement="center"
      scrollBehavior="inside"
      size="2xl"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Vote className="h-5 w-5" />
          {showSetup ? "Start a vote" : "Live vote"}
        </ModalHeader>

        <ModalBody>
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : showSetup ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-default-500">
                Anyone who scans the QR code can vote — no account needed.
                Results stay anonymous; only totals are shown.
              </p>
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  className={`text-left rounded-2xl border p-4 transition-colors ${
                    mode === opt.key
                      ? "border-primary bg-primary/10"
                      : "border-default-200 bg-content1 hover:border-default-400"
                  }`}
                  type="button"
                  onClick={() => setMode(opt.key)}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {opt.icon}
                    {opt.title}
                    {mode === opt.key && <Check className="h-4 w-4 text-primary ml-auto" />}
                  </div>
                  <p className="text-sm text-default-500 mt-1">{opt.description}</p>
                </button>
              ))}
            </div>
          ) : session && live ? (
            <div className="flex flex-col md:flex-row gap-6">
              {/* QR + link */}
              <div className="flex flex-col items-center gap-3 md:w-[260px] flex-shrink-0">
                <div
                  className={`rounded-2xl bg-white p-4 ${isClosed ? "opacity-30" : ""}`}
                >
                  <QRCodeSVG
                    includeMargin={false}
                    level="M"
                    size={208}
                    value={voteUrl}
                  />
                </div>
                {isClosed ? (
                  <p className="text-sm text-default-500 flex items-center gap-1">
                    <Lock className="h-4 w-4" /> Voting closed
                  </p>
                ) : (
                  <p className="text-sm text-default-500 text-center">
                    Scan to vote
                  </p>
                )}
                <Button
                  fullWidth
                  size="sm"
                  startContent={
                    copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />
                  }
                  variant="flat"
                  onPress={copyLink}
                >
                  {copied ? "Copied!" : "Copy vote link"}
                </Button>
              </div>

              {/* Results */}
              <div className="flex-1 min-w-0">
                <VoteResults results={live} />
              </div>
            </div>
          ) : null}

          {error && <p className="text-sm text-danger">{error}</p>}
        </ModalBody>

        <ModalFooter className="flex flex-wrap gap-2 justify-between">
          {showSetup ? (
            <>
              <Button
                variant="light"
                onPress={session ? () => setShowSetup(false) : onClose}
              >
                {session ? "Back" : "Cancel"}
              </Button>
              <Button color="primary" isLoading={busy} onPress={startVote}>
                Start vote
              </Button>
            </>
          ) : session ? (
            <>
              <Button
                startContent={<RotateCcw className="h-4 w-4" />}
                variant="light"
                onPress={() => setShowSetup(true)}
              >
                New vote
              </Button>
              <div className="flex gap-2">
                {isClosed ? (
                  <>
                    <Button
                      isDisabled={busy}
                      startContent={<Unlock className="h-4 w-4" />}
                      variant="flat"
                      onPress={() => setOpenState("reopen")}
                    >
                      Reopen
                    </Button>
                    {soleWinnerId && (
                      <Button
                        className="bg-yellow-400 text-black"
                        isDisabled={winnerAlreadySet || applied}
                        isLoading={busy}
                        startContent={<Trophy className="h-4 w-4" />}
                        onPress={applyWinner}
                      >
                        {winnerAlreadySet || applied
                          ? "Winner set"
                          : `Set "${soleWinnerTitle}" as winner`}
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    color="danger"
                    isLoading={busy}
                    startContent={<Lock className="h-4 w-4" />}
                    variant="flat"
                    onPress={() => setOpenState("close")}
                  >
                    Close voting
                  </Button>
                )}
              </div>
            </>
          ) : (
            <Button variant="light" onPress={onClose}>
              Close
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}