"use client";

import React, { useEffect, useState } from "react";
import { Card, Spinner } from "@heroui/react";
import { Film } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { BarChartComponent } from "@/components/analytics/BarChartComponent";
import { PieChartComponent } from "@/components/analytics/PieChartComponent";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CHART_HEIGHT = 320;
const TOP_N = 12;

type Overview = {
  totals: {
    movieMondays: number;
    movies: number;
    winners: number;
    uniqueGenres: number;
    uniqueActors: number;
    uniqueDirectors: number;
  };
  genres: { name: string; count: number }[];
  topActors: { name: string; count: number }[];
  rejectedActors: { name: string; losses: number }[];
  topDirectors: { name: string; count: number }[];
  rejectedMovies: { name: string; losses: number }[];
  pickers: { name: string; winningPicks: number }[];
  meals: { name: string; count: number }[];
  cocktails: { name: string; count: number }[];
  desserts: { name: string; count: number }[];
};

const toChart = (
  arr: any[] | undefined,
  valueKey: string,
): { name: string; value: number }[] =>
  (arr || []).slice(0, TOP_N).map((d) => ({ name: d.name, value: d[valueKey] }));

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <Card className="p-5 text-center">
      <h3 className="text-2xl font-bold text-primary">{value}</h3>
      <p className="text-default-600">{label}</p>
    </Card>
  );
}

function ChartOrEmpty({
  title,
  subtitle,
  data,
  children,
}: {
  title: string;
  subtitle: string;
  data: any[];
  children: React.ReactNode;
}) {
  return (
    <AnalyticsCard subtitle={subtitle} title={title}>
      {data.length > 0 ? (
        children
      ) : (
        <div className="flex h-[200px] items-center justify-center text-sm text-default-400">
          Not enough data yet
        </div>
      )}
    </AnalyticsCard>
  );
}

export default function AnalyticsOverview() {
  const { token } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    setLoading(true);
    fetch(`${API_BASE_URL}/api/analytics/overview?limit=${TOP_N}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data || data.totals.movieMondays === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center gap-2 text-center">
          <Film className="h-8 w-8 text-default-300" />
          <p className="font-medium">No insights yet</p>
          <p className="max-w-sm text-sm text-default-500">
            Log a few Movie Monday nights — picks, winners, and what you ate and
            drank — and your charts will appear here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Movie Mondays" value={data.totals.movieMondays} />
        <StatCard label="Movies watched" value={data.totals.movies} />
        <StatCard label="Winners" value={data.totals.winners} />
        <StatCard label="Unique genres" value={data.totals.uniqueGenres} />
      </div>

      {/* Genres + frequent actors */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartOrEmpty
          data={data.genres}
          subtitle="What you watch most"
          title="Genre breakdown"
        >
          <PieChartComponent
            data={toChart(data.genres, "count")}
            height={CHART_HEIGHT}
            maxSlices={8}
          />
        </ChartOrEmpty>

        <ChartOrEmpty
          data={data.topActors}
          subtitle="Faces that show up most often"
          title="Most frequent actors"
        >
          <BarChartComponent
            barColor="#4f46e5"
            data={toChart(data.topActors, "count")}
            height={CHART_HEIGHT}
            maxBars={TOP_N}
          />
        </ChartOrEmpty>
      </div>

      {/* Directors + movies chosen by */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartOrEmpty
          data={data.topDirectors}
          subtitle="Directors you return to"
          title="Most watched directors"
        >
          <BarChartComponent
            barColor="#0ea5e9"
            data={toChart(data.topDirectors, "count")}
            height={CHART_HEIGHT}
            maxBars={TOP_N}
          />
        </ChartOrEmpty>

        <ChartOrEmpty
          data={data.pickers}
          subtitle="Winning nights per picker"
          title="Movies chosen by"
        >
          <BarChartComponent
            barColor="#22c55e"
            data={toChart(data.pickers, "winningPicks")}
            height={CHART_HEIGHT}
            maxBars={TOP_N}
          />
        </ChartOrEmpty>
      </div>

      {/* Rejections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartOrEmpty
          data={data.rejectedMovies}
          subtitle="On the ballot, never the winner"
          title="Most rejected movies"
        >
          <BarChartComponent
            barColor="#f97316"
            data={toChart(data.rejectedMovies, "losses")}
            height={CHART_HEIGHT}
            maxBars={TOP_N}
          />
        </ChartOrEmpty>

        <ChartOrEmpty
          data={data.rejectedActors}
          subtitle="Most appearances in losing picks"
          title="Most rejected actors"
        >
          <BarChartComponent
            barColor="#ef4444"
            data={toChart(data.rejectedActors, "losses")}
            height={CHART_HEIGHT}
            maxBars={TOP_N}
          />
        </ChartOrEmpty>
      </div>

      {/* Food & drink */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartOrEmpty
          data={data.meals}
          subtitle="Kitchen favourites"
          title="Most eaten meals"
        >
          <BarChartComponent
            barColor="#8b5cf6"
            data={toChart(data.meals, "count")}
            height={CHART_HEIGHT}
            maxBars={TOP_N}
          />
        </ChartOrEmpty>

        <ChartOrEmpty
          data={data.cocktails}
          subtitle="House pours"
          title="Most drank cocktails"
        >
          <BarChartComponent
            barColor="#ec4899"
            data={toChart(data.cocktails, "count")}
            height={CHART_HEIGHT}
            maxBars={TOP_N}
          />
        </ChartOrEmpty>

        <ChartOrEmpty
          data={data.desserts}
          subtitle="Sweet endings"
          title="Most eaten desserts"
        >
          <BarChartComponent
            barColor="#f43f5e"
            data={toChart(data.desserts, "count")}
            height={CHART_HEIGHT}
            maxBars={TOP_N}
          />
        </ChartOrEmpty>
      </div>
    </div>
  );
}