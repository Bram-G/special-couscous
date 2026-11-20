
import { useEffect, useRef, useState } from "react";

import { VoteResults } from "@/types/voting";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const POLL_MS = 5000;

export function useVoteStream(
  token: string | null | undefined,
  initial: VoteResults | null = null,
) {
  const [results, setResults] = useState<VoteResults | null>(initial);
  const [connected, setConnected] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const fetchOnce = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/votes/s/${token}/results`);

        if (res.ok && !cancelled) setResults(await res.json());
      } catch {
        // ignore — next tick will retry
      }
    };

    const startPolling = () => {
      if (pollRef.current) return;
      pollRef.current = setInterval(fetchOnce, POLL_MS);
    };
    const stopPolling = () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };

    if (typeof window === "undefined" || !("EventSource" in window)) {
      fetchOnce();
      startPolling();

      return () => {
        cancelled = true;
        stopPolling();
      };
    }

    const source = new EventSource(`${API_BASE_URL}/api/votes/s/${token}/stream`);

    source.onopen = () => {
      setConnected(true);
      stopPolling();
    };
    source.onmessage = (event) => {
      try {
        setResults(JSON.parse(event.data));
      } catch {
        // malformed frame — ignore
      }
    };
    source.onerror = () => {
      setConnected(false);
      startPolling();
    };

    return () => {
      cancelled = true;
      source.close();
      stopPolling();
    };
  }, [token]);

  return { results, setResults, connected };
}