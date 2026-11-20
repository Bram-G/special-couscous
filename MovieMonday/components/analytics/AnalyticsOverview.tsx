"use client";

import React from "react";
import { Card, Spinner } from "@heroui/react";
import { Film, MousePointerClick } from "lucide-react";

import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { BarChartComponent } from "@/components/analytics/BarChartComponent";
import { PieChartComponent } from "@/components/analytics/PieChartComponent";
import MovieDetailsModal from "@/components/analytics/MovieDetailsModal";
import {
  toChart,
  useAnalyticsOverview,
} from "@/hooks/useAnalyticsOverview";
import { useAnalyticsDrilldown } from "@/hooks/useAnalyticsDrilldown";

const CHART_HEIGHT = 320;
const TOP_N = 12;

// One palette for the whole page: amber = wins, orange/red = rejections,
// cool tones = neutral, purple/pink = food & drink.
const COLORS = {
  win: "#f5a524",
  winAlt: "#0ea5e9",
  loss: "#f97316",
  lossAlt: "#ef4444",
  picker: "#22c55e",
  meal: "#8b5cf6",
  cocktail: "#ec4899",
  dessert: "#f43f5e",
};

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <Card className="p-5 text-center">
      <h3 className="text-2xl font-bold text-primary">{value}</h3>
      <p className="text-default-600">{label}</p>
    </Card>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-default-500">{subtitle}</p>
      </div>
      {children}
    </section>
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
  const { data, loading } = useAnalyticsOverview(TOP_N);
  const drilldown = useAnalyticsDrilldown();

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
    <div className="space-y-10">
      {/* Headline stats */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Movie Mondays" value={data.totals.movieMondays} />
          <StatCard label="Movies watched" value={data.totals.moviesWatched} />
          <StatCard label="Rejected picks" value={data.totals.rejectedPicks} />
          <StatCard label="Genres watched" value={data.totals.uniqueGenres} />
        </div>
        <p className="flex items-center gap-1.5 text-xs text-default-400">
          <MousePointerClick className="h-3.5 w-3.5" />
          Click any bar or slice to see the movies behind it
        </p>
      </div>

      <Section
        subtitle="Only the movies that won the vote"
        title="What you watched"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartOrEmpty
            data={data.genres}
            subtitle="Genres of winning movies"
            title="Genre breakdown"
          >
            <PieChartComponent
              data={toChart(data.genres, "count")}
              height={CHART_HEIGHT}
              maxSlices={8}
              onSliceClick={(name) =>
                drilldown.open({ type: "genre", key: name, label: name })
              }
            />
          </ChartOrEmpty>

          <ChartOrEmpty
            data={data.pickers}
            subtitle="Decided nights hosted per picker"
            title="Movies chosen by"
          >
            <BarChartComponent
              barColor={COLORS.picker}
              data={toChart(data.pickers, "winningPicks")}
              height={CHART_HEIGHT}
              maxBars={TOP_N}
              onBarClick={(name) =>
                drilldown.open({ type: "picker", key: name, label: name })
              }
            />
          </ChartOrEmpty>
        </div>
      </Section>

      <Section
        subtitle="People behind the movies that won"
        title="Winners"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartOrEmpty
            data={data.winningActors}
            subtitle="Appearances in winning movies"
            title="Most winning actors"
          >
            <BarChartComponent
              barColor={COLORS.win}
              data={toChart(data.winningActors, "wins")}
              height={CHART_HEIGHT}
              maxBars={TOP_N}
              onBarClick={(name, item) =>
                drilldown.open({
                  type: "actor",
                  key: item.id,
                  label: name,
                  outcome: "won",
                })
              }
            />
          </ChartOrEmpty>

          <ChartOrEmpty
            data={data.winningDirectors}
            subtitle="Directors of winning movies"
            title="Most winning directors"
          >
            <BarChartComponent
              barColor={COLORS.winAlt}
              data={toChart(data.winningDirectors, "wins")}
              height={CHART_HEIGHT}
              maxBars={TOP_N}
              onBarClick={(name, item) =>
                drilldown.open({
                  type: "director",
                  key: item.id,
                  label: name,
                  outcome: "won",
                })
              }
            />
          </ChartOrEmpty>
        </div>
      </Section>

      <Section
        subtitle="On the ballot, outvoted on decided nights"
        title="Rejected"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartOrEmpty
            data={data.rejectedActors}
            subtitle="Appearances in losing picks"
            title="Most rejected actors"
          >
            <BarChartComponent
              barColor={COLORS.lossAlt}
              data={toChart(data.rejectedActors, "losses")}
              height={CHART_HEIGHT}
              maxBars={TOP_N}
              onBarClick={(name, item) =>
                drilldown.open({
                  type: "actor",
                  key: item.id,
                  label: name,
                  outcome: "lost",
                })
              }
            />
          </ChartOrEmpty>

          <ChartOrEmpty
            data={data.rejectedMovies}
            subtitle="Times each movie lost the vote"
            title="Most rejected movies"
          >
            <BarChartComponent
              barColor={COLORS.loss}
              data={toChart(data.rejectedMovies, "losses")}
              height={CHART_HEIGHT}
              maxBars={TOP_N}
              onBarClick={(name, item) =>
                drilldown.open({
                  type: "movie",
                  key: item.id,
                  label: name,
                  outcome: "lost",
                })
              }
            />
          </ChartOrEmpty>
        </div>
      </Section>

      <Section
        subtitle="Click to see what won on those nights"
        title="Food & drink"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ChartOrEmpty
            data={data.meals}
            subtitle="Kitchen favourites"
            title="Most eaten meals"
          >
            <BarChartComponent
              barColor={COLORS.meal}
              data={toChart(data.meals, "count")}
              height={CHART_HEIGHT}
              maxBars={TOP_N}
              onBarClick={(name) =>
                drilldown.open({ type: "meal", key: name, label: name })
              }
            />
          </ChartOrEmpty>

          <ChartOrEmpty
            data={data.cocktails}
            subtitle="House pours"
            title="Most drank cocktails"
          >
            <BarChartComponent
              barColor={COLORS.cocktail}
              data={toChart(data.cocktails, "count")}
              height={CHART_HEIGHT}
              maxBars={TOP_N}
              onBarClick={(name) =>
                drilldown.open({ type: "cocktail", key: name, label: name })
              }
            />
          </ChartOrEmpty>

          <ChartOrEmpty
            data={data.desserts}
            subtitle="Sweet endings"
            title="Most eaten desserts"
          >
            <BarChartComponent
              barColor={COLORS.dessert}
              data={toChart(data.desserts, "count")}
              height={CHART_HEIGHT}
              maxBars={TOP_N}
              onBarClick={(name) =>
                drilldown.open({ type: "dessert", key: name, label: name })
              }
            />
          </ChartOrEmpty>
        </div>
      </Section>

      <MovieDetailsModal {...drilldown.modalProps} />
    </div>
  );
}