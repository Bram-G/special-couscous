"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface MondayStatus {
  exists: boolean; // a Movie Monday record exists for this date
  completed: boolean; // status === "completed"
  count: number; // number of movie selections (nominees), used for the dots
}

interface MonthlyMondaySelectorProps {
  /** Currently selected date (owned by the parent so the detail panel stays in sync) */
  selectedDate: Date | null;
  /** Called when a Monday card is tapped. Wire this to the parent's existing handleDateClick. */
  onSelectDate: (date: Date) => void;
  /** Auth token used to fetch per-Monday status. */
  token: string | null;
  /** Optional: opens the parent's existing "Jump to Date" modal. Button is hidden if omitted. */
  onJumpToDate?: () => void;
}

// Local YYYY-MM-DD (matches the backend date matching used elsewhere; avoids
// the timezone off-by-one you get from toISOString()).
const dateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
};

// Every Monday whose date falls inside the given month.
const getMondaysInMonth = (monthDate: Date): Date[] => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  // 1 = Monday. Offset from the 1st of the month to the first Monday.
  const offset = (8 - first.getDay()) % 7;
  const mondays: Date[] = [];
  const cursor = new Date(year, month, 1 + offset, 12, 0, 0, 0);

  while (cursor.getMonth() === month) {
    mondays.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }

  return mondays;
};

const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);

const MonthlyMondaySelector: React.FC<MonthlyMondaySelectorProps> = ({
  selectedDate,
  onSelectDate,
  token,
  onJumpToDate,
}) => {
  const [displayMonth, setDisplayMonth] = useState<Date>(() =>
    startOfMonth(selectedDate ?? new Date()),
  );
  const [statusMap, setStatusMap] = useState<Record<string, MondayStatus>>({});
  const [loading, setLoading] = useState(false);

  const mondays = useMemo(
    () => getMondaysInMonth(displayMonth),
    [displayMonth],
  );

  // Follow the selection into its month (e.g. when the parent jumps to a date
  // in a different month via the "Jump to Date" modal).
  useEffect(() => {
    if (!selectedDate) return;

    if (
      selectedDate.getMonth() !== displayMonth.getMonth() ||
      selectedDate.getFullYear() !== displayMonth.getFullYear()
    ) {
      setDisplayMonth(startOfMonth(selectedDate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Fetch status for every Monday in the displayed month.
  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        const entries = await Promise.all(
          mondays.map(async (date): Promise<[string, MondayStatus]> => {
            const key = dateKey(date);

            try {
              const res = await fetch(
                `${API_BASE_URL}/api/movie-monday/${key}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                  signal: controller.signal,
                },
              );

              if (!res.ok) {
                return [key, { exists: false, completed: false, count: 0 }];
              }

              const data = await res.json();
              const exists = !!data?.status && data.status !== "not_created";

              return [
                key,
                {
                  exists,
                  completed: data?.status === "completed",
                  count: Array.isArray(data?.movieSelections)
                    ? data.movieSelections.length
                    : 0,
                },
              ];
            } catch {
              return [key, { exists: false, completed: false, count: 0 }];
            }
          }),
        );

        if (!controller.signal.aborted) {
          setStatusMap(Object.fromEntries(entries));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMonth, token]);

  const goPrevMonth = () => {
    const prev = new Date(displayMonth);

    prev.setMonth(prev.getMonth() - 1);
    setDisplayMonth(startOfMonth(prev));
  };

  const goNextMonth = () => {
    const next = new Date(displayMonth);

    next.setMonth(next.getMonth() + 1);
    setDisplayMonth(startOfMonth(next));
  };

  const monthLabel = displayMonth.toLocaleDateString("default", {
    month: "long",
    year: "numeric",
  });

  // Card + dot classes for a Monday's state. Theme-aware via HeroUI semantic tokens.
  const cardClasses = (state: MondayStatus, isSelected: boolean): string => {
    if (isSelected) {
      return state.exists
        ? "bg-success-400 text-black ring-2 ring-success-300 shadow-lg shadow-success-500/20 dark:bg-success-500 dark:ring-success-400"
        : "bg-default-200 text-foreground ring-2 ring-default-400 shadow-md dark:bg-default-100";
    }
    if (state.exists) {
      return "bg-success-100 text-success-700 hover:bg-success-200 dark:bg-success-900/40 dark:text-success-200 dark:hover:bg-success-900/60";
    }

    return "bg-default-100 text-default-500 hover:bg-default-200 dark:hover:bg-default-200/70";
  };

  const dotClass = (state: MondayStatus, isSelected: boolean): string => {
    if (isSelected) return "bg-black/40 dark:bg-black/50";

    return "bg-success-500 dark:bg-success-400";
  };

  return (
    <div className="w-full p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-default-500" />
          <h3 className="text-lg font-semibold">Movie Monday Calendar</h3>
        </div>

        {onJumpToDate && (
          <Button size="sm" variant="flat" onPress={onJumpToDate}>
            Jump to Date
          </Button>
        )}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <Button
          isIconOnly
          aria-label="Previous month"
          size="sm"
          variant="light"
          onPress={goPrevMonth}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-base font-semibold min-w-[10rem] text-center">
          {monthLabel}
        </span>
        <Button
          isIconOnly
          aria-label="Next month"
          size="sm"
          variant="light"
          onPress={goNextMonth}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Monday cards — one column per Monday in the month (4 or 5) */}
      <div
        className={`grid gap-2 sm:gap-3 transition-opacity ${
          loading ? "opacity-70" : "opacity-100"
        }`}
        style={{
          gridTemplateColumns: `repeat(${mondays.length}, minmax(0, 1fr))`,
        }}
      >
        {mondays.map((date) => {
          const key = dateKey(date);
          const state =
            statusMap[key] ?? { exists: false, completed: false, count: 0 };
          const isSelected =
            !!selectedDate &&
            selectedDate.toDateString() === date.toDateString();
          const dots = Math.min(state.count, 3);

          return (
            <button
              key={key}
              aria-label={`${
                isSelected ? "Selected " : ""
              }Monday ${date.getDate()}${
                state.exists
                  ? state.completed
                    ? ", completed"
                    : ", in progress"
                  : ", no Movie Monday"
              }`}
              aria-pressed={isSelected}
              className={`relative rounded-2xl px-2 py-5 sm:py-6 flex flex-col items-center justify-center gap-2 transition-all duration-150 ${cardClasses(
                state,
                isSelected,
              )}`}
              type="button"
              onClick={() => onSelectDate(date)}
            >
              {state.completed && (
                <CheckCircle2
                  className={`absolute top-2 right-2 h-4 w-4 ${
                    isSelected ? "text-black/70" : "text-success-500"
                  }`}
                />
              )}

              <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                Mon
              </span>
              <span className="text-2xl font-bold leading-none">
                {date.getDate()}
              </span>

              {/* Nominee dots */}
              <div className="flex items-center gap-1 h-2">
                {state.exists &&
                  Array.from({ length: dots }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${dotClass(
                        state,
                        isSelected,
                      )}`}
                    />
                  ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MonthlyMondaySelector;
