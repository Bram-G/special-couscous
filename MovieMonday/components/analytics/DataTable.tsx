"use client";

import React from "react";
import {
  Input,
  Button,
  Select,
  SelectItem,
  Pagination,
  Spinner,
} from "@heroui/react";
import { Search, ArrowUp, ArrowDown, ChevronsUpDown, Download } from "lucide-react";

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  headerClassName?: string;
  cellClassName?: string;
  /** Plain text/number for default rendering and CSV export. */
  value?: (row: any) => string | number | null | undefined;
  /** Rich cell. Falls back to `value` / row[key] when omitted. */
  render?: (row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: DataTableColumn[];
  rows: any[];
  loading: boolean;
  error?: string | null;
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (n: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  toolbarExtra?: React.ReactNode;
  emptyTitle?: string;
  emptyMessage?: string;
  csvFilename?: string;
  rowKey?: (row: any, index: number) => string | number;
}

const PAGE_SIZES = [10, 25, 50, 100];

function csvEscape(input: unknown): string {
  const s = input == null ? "" : String(input);

  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function cellText(col: DataTableColumn, row: any) {
  if (col.value) return col.value(row);

  return row[col.key];
}

export default function DataTable({
  columns,
  rows,
  loading,
  error,
  total,
  totalPages,
  page,
  pageSize,
  sortBy,
  sortDir,
  onSort,
  onPageChange,
  onPageSizeChange,
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  toolbarExtra,
  emptyTitle = "Nothing here yet",
  emptyMessage = "Try adjusting your search or filters.",
  csvFilename = "export.csv",
  rowKey,
}: DataTableProps) {
  const alignClass = (a?: string) =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  const exportCsv = () => {
    const header = columns.map((c) => csvEscape(c.label)).join(",");
    const lines = rows.map((row) =>
      columns.map((c) => csvEscape(cellText(c, row))).join(","),
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = csvFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            isClearable
            className="w-full max-w-xs"
            placeholder={searchPlaceholder}
            size="sm"
            startContent={<Search className="h-4 w-4 text-default-400" />}
            value={search}
            onClear={() => onSearchChange("")}
            onValueChange={onSearchChange}
          />
          {toolbarExtra}
        </div>

        <div className="flex items-center gap-2">
          <Select
            aria-label="Rows per page"
            className="w-32"
            selectedKeys={new Set([String(pageSize)])}
            size="sm"
            onSelectionChange={(keys) => {
              const v = Array.from(keys)[0];

              if (v) onPageSizeChange(Number(v));
            }}
          >
            {PAGE_SIZES.map((n) => (
              <SelectItem key={String(n)}>{`${n} / page`}</SelectItem>
            ))}
          </Select>

          <Button
            isDisabled={rows.length === 0}
            size="sm"
            startContent={<Download className="h-4 w-4" />}
            variant="flat"
            onPress={exportCsv}
          >
            CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto rounded-large border border-default-200">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-default-200 bg-default-50">
              {columns.map((col) => {
                const active = col.sortable && sortBy === col.key;

                return (
                  <th
                    key={col.key}
                    className={`whitespace-nowrap px-3 py-2.5 font-medium text-default-600 ${alignClass(
                      col.align,
                    )} ${col.headerClassName || ""}`}
                  >
                    {col.sortable ? (
                      <button
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        type="button"
                        onClick={() => onSort(col.key)}
                      >
                        <span>{col.label}</span>
                        {active ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 text-default-300" />
                        )}
                      </button>
                    ) : (
                      <span>{col.label}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row, i) : i}
                className="border-b border-default-100 last:border-0 hover:bg-default-50"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2.5 align-middle ${alignClass(
                      col.align,
                    )} ${col.cellClassName || ""}`}
                  >
                    {col.render
                      ? col.render(row)
                      : (cellText(col, row) ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Loading overlay (kept above any existing rows) */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <Spinner size="lg" />
          </div>
        )}

        {/* Empty / error states */}
        {!loading && rows.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-1 px-6 py-16 text-center">
            <p className="font-medium">{error ? "Couldn't load data" : emptyTitle}</p>
            <p className="text-sm text-default-500">
              {error ? error : emptyMessage}
            </p>
          </div>
        )}
      </div>

      {/* Footer: range + pagination */}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-default-500">
          {total === 0
            ? "No results"
            : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
        </p>

        {totalPages > 1 && (
          <Pagination
            showControls
            color="primary"
            page={page}
            size="sm"
            total={totalPages}
            onChange={onPageChange}
          />
        )}
      </div>
    </div>
  );
}