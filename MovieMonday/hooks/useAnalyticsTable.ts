import { useState, useEffect, useRef, useCallback } from "react";

import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type SortDir = "asc" | "desc";

export interface UseAnalyticsTableOptions {
  initialSortBy: string;
  initialSortDir?: SortDir;
  initialPageSize?: number;
  filters?: Record<string, string | undefined>;
}

export function useAnalyticsTable(
  type: string,
  options: UseAnalyticsTableOptions,
) {
  const { token } = useAuth();

  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(options.initialPageSize ?? 25);
  const [sortBy, setSortBy] = useState(options.initialSortBy);
  const [sortDir, setSortDir] = useState<SortDir>(
    options.initialSortDir ?? "desc",
  );
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const filterSig = JSON.stringify(options.filters || {});

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);

    return () => clearTimeout(t);
  }, [search]);

  // Filters changing should send us back to page 1 (no-op on first mount).
  useEffect(() => {
    setPage(1);
  }, [filterSig]);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    abortRef.current?.abort();
    abortRef.current = controller;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          sortBy,
          sortDir,
        });

        if (debouncedSearch) params.set("search", debouncedSearch);
        Object.entries(options.filters || {}).forEach(([k, v]) => {
          if (v != null && v !== "") params.set(k, String(v));
        });

        const res = await fetch(
          `${API_BASE_URL}/api/analytics/table/${type}?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          },
        );

        if (!res.ok) throw new Error(`Request failed (${res.status})`);

        const data = await res.json();

        setRows(data.rows || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 0);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setError(e.message || "Failed to load data");
          setRows([]);
          setTotal(0);
          setTotalPages(0);
        }
      } finally {
        if (abortRef.current === controller) setLoading(false);
      }
    };

    run();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, type, page, pageSize, sortBy, sortDir, debouncedSearch, filterSig]);

  const onSort = useCallback(
    (key: string) => {
      if (sortBy === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(key);
        setSortDir("desc");
      }
      setPage(1);
    },
    [sortBy],
  );

  const onSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const onPageSizeChange = useCallback((n: number) => {
    setPageSize(n);
    setPage(1);
  }, []);

  return {
    rows,
    total,
    totalPages,
    loading,
    error,
    page,
    pageSize,
    sortBy,
    sortDir,
    search,
    onSort,
    onPageChange: setPage,
    onPageSizeChange,
    onSearchChange,
  };
}