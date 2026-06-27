"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Tabs, Tab, Select, SelectItem, Chip } from "@heroui/react";
import Link from "next/link";

import { useAuth } from "@/contexts/AuthContext";
import { useAnalyticsTable } from "@/hooks/useAnalyticsTable";
import DataTable, { DataTableColumn } from "@/components/analytics/DataTable";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Local-safe date formatting for "YYYY-MM-DD" (avoids UTC off-by-one).
function formatDate(d?: string | null): string {
  if (!d) return "—";
  const parts = String(d).slice(0, 10).split("-").map(Number);

  if (!parts[0]) return "—";

  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function tmdbThumb(path?: string | null) {
  return path ? `https://image.tmdb.org/t/p/w92${path}` : null;
}

// ---- Per-view column configs ----------------------------------------------

function movieColumns(): DataTableColumn[] {
  return [
    {
      key: "title",
      label: "Movie",
      sortable: true,
      value: (r) => r.title,
      render: (r) => (
        <div className="flex items-center gap-2 min-w-[200px]">
          {tmdbThumb(r.posterPath) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="h-9 w-6 flex-shrink-0 rounded object-cover"
              loading="lazy"
              src={tmdbThumb(r.posterPath) as string}
            />
          ) : (
            <div className="h-9 w-6 flex-shrink-0 rounded bg-default-100" />
          )}
          <Link
            className="font-medium text-foreground hover:text-primary"
            href={`/movie/${r.tmdbMovieId}`}
          >
            {r.title}
          </Link>
        </div>
      ),
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      value: (r) => formatDate(r.date),
    },
    {
      key: "won",
      label: "Result",
      sortable: true,
      value: (r) => (r.isWinner ? "Winner" : "Nominee"),
      render: (r) => (
        <Chip
          color={r.isWinner ? "success" : "default"}
          size="sm"
          variant="flat"
        >
          {r.isWinner ? "Winner" : "Nominee"}
        </Chip>
      ),
    },
    {
      key: "picker",
      label: "Picker",
      value: (r) => r.picker?.username || "",
      render: (r) => r.picker?.username || "—",
    },
    {
      key: "rating",
      label: "TMDB",
      sortable: true,
      align: "right",
      value: (r) => (r.voteAverage != null ? r.voteAverage : ""),
      render: (r) => (r.voteAverage != null ? r.voteAverage.toFixed(1) : "—"),
    },
    {
      key: "groupRating",
      label: "Group",
      align: "right",
      value: (r) => (r.groupRating != null ? r.groupRating : ""),
      render: (r) => (r.groupRating != null ? `★ ${r.groupRating}` : "—"),
    },
    {
      key: "year",
      label: "Year",
      sortable: true,
      align: "right",
      value: (r) => r.releaseYear ?? "",
      render: (r) => r.releaseYear ?? "—",
    },
    {
      key: "genres",
      label: "Genres",
      value: (r) => (r.genres || []).join("; "),
      render: (r) => {
        const g: string[] = r.genres || [];

        if (!g.length) return "—";

        return (
          <div className="flex flex-wrap gap-1 min-w-[140px]">
            {g.slice(0, 2).map((name) => (
              <Chip key={name} size="sm" variant="flat">
                {name}
              </Chip>
            ))}
            {g.length > 2 && (
              <span className="text-xs text-default-400">+{g.length - 2}</span>
            )}
          </div>
        );
      },
    },
    {
      key: "director",
      label: "Director",
      value: (r) => (r.directors || []).map((d: any) => d.name).join("; "),
      render: (r) =>
        r.directors?.length
          ? r.directors.map((d: any) => d.name).join(", ")
          : "—",
    },
    {
      key: "theme",
      label: "Theme",
      value: (r) => r.weekTheme || "",
      render: (r) => r.weekTheme || "—",
    },
    {
      key: "meal",
      label: "Meal",
      value: (r) => (r.meals || []).join("; "),
      render: (r) => (r.meals?.length ? r.meals.join(", ") : "—"),
    },
    {
      key: "cocktail",
      label: "Cocktail",
      value: (r) => (r.cocktails || []).join("; "),
      render: (r) => (r.cocktails?.length ? r.cocktails.join(", ") : "—"),
    },
    {
      key: "dessert",
      label: "Dessert",
      value: (r) => (r.desserts || []).join("; "),
      render: (r) => (r.desserts?.length ? r.desserts.join(", ") : "—"),
    },
  ];
}

function personColumns(label: string): DataTableColumn[] {
  return [
    {
      key: "name",
      label,
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <Link
          className="font-medium text-foreground hover:text-primary"
          href={`/actor/${r.id}`}
        >
          {r.name}
        </Link>
      ),
    },
    {
      key: "appearances",
      label: "Appearances",
      sortable: true,
      align: "right",
      value: (r) => r.appearances,
    },
    {
      key: "wins",
      label: "Wins",
      sortable: true,
      align: "right",
      value: (r) => r.wins,
    },
    {
      key: "losses",
      label: "Losses",
      sortable: true,
      align: "right",
      value: (r) => r.losses,
    },
    {
      key: "winRate",
      label: "Win rate",
      sortable: true,
      align: "right",
      value: (r) => r.winRate,
      render: (r) => `${r.winRate}%`,
    },
  ];
}

function foodColumns(itemLabel: string): DataTableColumn[] {
  return [
    { key: "name", label: itemLabel, sortable: true, value: (r) => r.name },
    {
      key: "count",
      label: "Times served",
      sortable: true,
      align: "right",
      value: (r) => r.count,
    },
    {
      key: "lastServed",
      label: "Last served",
      sortable: true,
      value: (r) => formatDate(r.lastServed),
    },
  ];
}

interface ViewConfig {
  columns: DataTableColumn[];
  defaultSortBy: string;
  searchPlaceholder: string;
  csvName: string;
  emptyTitle: string;
  emptyMessage: string;
  rowKey: (row: any) => string | number;
}

const VIEW_CONFIG: Record<string, ViewConfig> = {
  movies: {
    columns: movieColumns(),
    defaultSortBy: "date",
    searchPlaceholder: "Search movie titles…",
    csvName: "movie-monday-movies.csv",
    emptyTitle: "No movies yet",
    emptyMessage: "Movies appear here once they're added to a Movie Monday.",
    rowKey: (r) => r.id,
  },
  actors: {
    columns: personColumns("Actor"),
    defaultSortBy: "appearances",
    searchPlaceholder: "Search actors…",
    csvName: "movie-monday-actors.csv",
    emptyTitle: "No actors yet",
    emptyMessage: "Actor stats build up as you log more movies.",
    rowKey: (r) => r.id,
  },
  directors: {
    columns: personColumns("Director"),
    defaultSortBy: "appearances",
    searchPlaceholder: "Search directors…",
    csvName: "movie-monday-directors.csv",
    emptyTitle: "No directors yet",
    emptyMessage: "Director stats build up as you log more movies.",
    rowKey: (r) => r.id,
  },
  meals: {
    columns: foodColumns("Meal"),
    defaultSortBy: "count",
    searchPlaceholder: "Search meals…",
    csvName: "movie-monday-meals.csv",
    emptyTitle: "No meals logged",
    emptyMessage: "Add meals to your Movie Monday nights to see them here.",
    rowKey: (r) => r.name,
  },
  cocktails: {
    columns: foodColumns("Drink"),
    defaultSortBy: "count",
    searchPlaceholder: "Search drinks…",
    csvName: "movie-monday-drinks.csv",
    emptyTitle: "No drinks logged",
    emptyMessage: "Add cocktails to your Movie Monday nights to see them here.",
    rowKey: (r) => r.name,
  },
  desserts: {
    columns: foodColumns("Dessert"),
    defaultSortBy: "count",
    searchPlaceholder: "Search desserts…",
    csvName: "movie-monday-desserts.csv",
    emptyTitle: "No desserts logged",
    emptyMessage: "Add desserts to your Movie Monday nights to see them here.",
    rowKey: (r) => r.name,
  },
};

// ---- One table view (owns a useAnalyticsTable instance) --------------------

function AnalyticsTableView({
  type,
  config,
  filters,
  toolbarExtra,
}: {
  type: string;
  config: ViewConfig;
  filters?: Record<string, string | undefined>;
  toolbarExtra?: React.ReactNode;
}) {
  const table = useAnalyticsTable(type, {
    initialSortBy: config.defaultSortBy,
    initialSortDir: "desc",
    initialPageSize: 25,
    filters,
  });

  return (
    <DataTable
      columns={config.columns}
      csvFilename={config.csvName}
      emptyMessage={config.emptyMessage}
      emptyTitle={config.emptyTitle}
      error={table.error}
      loading={table.loading}
      page={table.page}
      pageSize={table.pageSize}
      rowKey={config.rowKey}
      rows={table.rows}
      search={table.search}
      searchPlaceholder={config.searchPlaceholder}
      sortBy={table.sortBy}
      sortDir={table.sortDir}
      toolbarExtra={toolbarExtra}
      total={table.total}
      totalPages={table.totalPages}
      onPageChange={table.onPageChange}
      onPageSizeChange={table.onPageSizeChange}
      onSearchChange={table.onSearchChange}
      onSort={table.onSort}
    />
  );
}

// ---- Filter controls for the Movies view -----------------------------------

function MovieFilters({
  result,
  setResult,
  genre,
  setGenre,
  picker,
  setPicker,
  genreOptions,
  pickerOptions,
}: any) {
  return (
    <>
      <Select
        aria-label="Result"
        className="w-36"
        selectedKeys={new Set([result])}
        size="sm"
        onSelectionChange={(keys) => setResult(String(Array.from(keys)[0]))}
      >
        <SelectItem key="all">All results</SelectItem>
        <SelectItem key="winner">Winners</SelectItem>
        <SelectItem key="nominee">Nominees</SelectItem>
      </Select>

      <Select
        aria-label="Genre"
        className="w-40"
        selectedKeys={new Set([genre])}
        size="sm"
        onSelectionChange={(keys) => setGenre(String(Array.from(keys)[0]))}
      >
        {[
          <SelectItem key="all">All genres</SelectItem>,
          ...genreOptions.map((g: string) => (
            <SelectItem key={g}>{g}</SelectItem>
          )),
        ]}
      </Select>

      <Select
        aria-label="Picker"
        className="w-40"
        selectedKeys={new Set([picker])}
        size="sm"
        onSelectionChange={(keys) => setPicker(String(Array.from(keys)[0]))}
      >
        {[
          <SelectItem key="all">All pickers</SelectItem>,
          ...pickerOptions.map((p: { id: number; name: string }) => (
            <SelectItem key={String(p.id)}>{p.name}</SelectItem>
          )),
        ]}
      </Select>
    </>
  );
}

// ---- Main switcher ---------------------------------------------------------

export default function AnalyticsTables() {
  const { token } = useAuth();
  const [view, setView] = useState("movies");

  // Movie filter state
  const [result, setResult] = useState("all");
  const [genre, setGenre] = useState("all");
  const [picker, setPicker] = useState("all");

  // Filter option lists (pulled from the cached overview endpoint)
  const [genreOptions, setGenreOptions] = useState<string[]>([]);
  const [pickerOptions, setPickerOptions] = useState<
    { id: number; name: string }[]
  >([]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    fetch(`${API_BASE_URL}/api/analytics/overview?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setGenreOptions((data.genres || []).map((g: any) => g.name));
        setPickerOptions(
          (data.pickers || []).map((p: any) => ({ id: p.id, name: p.name })),
        );
      })
      .catch(() => {});

    return () => controller.abort();
  }, [token]);

  const movieFilters = useMemo(
    () => ({
      won: result === "winner" ? "true" : result === "nominee" ? "false" : "",
      genre: genre === "all" ? "" : genre,
      pickerId: picker === "all" ? "" : picker,
    }),
    [result, genre, picker],
  );

  const config = VIEW_CONFIG[view];

  return (
    <div className="space-y-4">
      <Tabs
        aria-label="Table views"
        selectedKey={view}
        variant="underlined"
        onSelectionChange={(k) => setView(String(k))}
      >
        <Tab key="movies" title="Movies" />
        <Tab key="actors" title="Actors" />
        <Tab key="directors" title="Directors" />
        <Tab key="meals" title="Meals" />
        <Tab key="cocktails" title="Drinks" />
        <Tab key="desserts" title="Desserts" />
      </Tabs>

      {/* key={view} forces a fresh table (resets sort/page) on view change */}
      <AnalyticsTableView
        key={view}
        config={config}
        filters={view === "movies" ? movieFilters : undefined}
        toolbarExtra={
          view === "movies" ? (
            <MovieFilters
              genre={genre}
              genreOptions={genreOptions}
              picker={picker}
              pickerOptions={pickerOptions}
              result={result}
              setGenre={setGenre}
              setPicker={setPicker}
              setResult={setResult}
            />
          ) : null
        }
        type={view}
      />
    </div>
  );
}