import React, { useState } from "react";
import { Card, CardBody, CardHeader, Button, Spinner } from "@heroui/react";
import {
  BarChart2,
  ExternalLink,
  Film,
  ThumbsDown,
  Trophy,
  Wine,
  Drama,
  Utensils,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { PieChartComponent } from "../analytics/PieChartComponent";
import { BarChartComponent } from "../analytics/BarChartComponent";
import MovieDetailsModal from "../analytics/MovieDetailsModal";

import { toChart, useAnalyticsOverview } from "@/hooks/useAnalyticsOverview";
import { useAnalyticsDrilldown } from "@/hooks/useAnalyticsDrilldown";

type ChartKey =
  | "genres"
  | "winners"
  | "rejected"
  | "directors"
  | "cocktails"
  | "meals";

const TABS: { key: ChartKey; label: string; icon: React.ElementType }[] = [
  { key: "genres", label: "Genres", icon: Drama },
  { key: "winners", label: "Winners", icon: Trophy },
  { key: "rejected", label: "Rejected", icon: ThumbsDown },
  { key: "directors", label: "Directors", icon: Film },
  { key: "cocktails", label: "Cocktails", icon: Wine },
  { key: "meals", label: "Meals", icon: Utensils },
];

const HEIGHT = 250;
const BARS = 6;

const DashboardAnalyticsWidget = () => {
  const router = useRouter();
  const { data, loading } = useAnalyticsOverview(10);
  const drilldown = useAnalyticsDrilldown();
  const [currentChart, setCurrentChart] = useState<ChartKey>("genres");

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      );
    }

    switch (currentChart) {
      case "genres":
        return (
          <PieChartComponent
            hideLegend
            showPercent
            data={toChart(data?.genres, "count")}
            emptyStateMessage="Pick some winners to see your genre breakdown"
            height={HEIGHT}
            maxSlices={10}
            onSliceClick={(name) =>
              drilldown.open({ type: "genre", key: name, label: name })
            }
          />
        );

      case "winners":
        return (
          <BarChartComponent
            barColor="#f5a524"
            data={toChart(data?.winningActors, "wins", BARS)}
            emptyStateMessage="More data needed to show winning actors"
            height={HEIGHT}
            maxBars={BARS}
            yAxisLabel="Wins"
            onBarClick={(name, item) =>
              drilldown.open({
                type: "actor",
                key: item.id,
                label: name,
                outcome: "won",
              })
            }
          />
        );

      case "rejected":
        return (
          <BarChartComponent
            barColor="#ef4444"
            data={toChart(data?.rejectedActors, "losses", BARS)}
            emptyStateMessage="More data needed to show rejected actors"
            height={HEIGHT}
            maxBars={BARS}
            yAxisLabel="Rejections"
            onBarClick={(name, item) =>
              drilldown.open({
                type: "actor",
                key: item.id,
                label: name,
                outcome: "lost",
              })
            }
          />
        );

      case "directors":
        return (
          <BarChartComponent
            barColor="#0ea5e9"
            data={toChart(data?.winningDirectors, "wins", BARS)}
            emptyStateMessage="More data needed to show director stats"
            height={HEIGHT}
            maxBars={BARS}
            yAxisLabel="Wins"
            onBarClick={(name, item) =>
              drilldown.open({
                type: "director",
                key: item.id,
                label: name,
                outcome: "won",
              })
            }
          />
        );

      case "cocktails":
        return (
          <PieChartComponent
            hideLegend
            showPercent
            colors={["#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE"]}
            data={toChart(data?.cocktails, "count")}
            emptyStateMessage="No cocktail data available yet"
            height={HEIGHT}
            maxSlices={10}
            onSliceClick={(name) =>
              drilldown.open({ type: "cocktail", key: name, label: name })
            }
          />
        );

      case "meals":
        return (
          <PieChartComponent
            hideLegend
            showPercent
            colors={["#0EA5E9", "#38BDF8", "#7DD3FC", "#BAE6FD", "#E0F2FE"]}
            data={toChart(data?.meals, "count")}
            emptyStateMessage="No meal data available yet"
            height={HEIGHT}
            maxSlices={10}
            onSliceClick={(name) =>
              drilldown.open({ type: "meal", key: name, label: name })
            }
          />
        );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-primary" />
          <div>
            <p className="text-start text-lg font-semibold">
              Your Movie Analytics
            </p>
            <p className="text-sm text-default-500">
              Insights from your Movie Monday sessions
            </p>
          </div>
        </div>
        <Button
          color="primary"
          endContent={<ExternalLink className="h-4 w-4" />}
          variant="light"
          onPress={() => router.push("/analytics")}
        >
          Full Analytics
        </Button>
      </CardHeader>

      <CardBody>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {TABS.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              className="shrink-0"
              color={currentChart === key ? "primary" : "default"}
              startContent={<Icon className="h-4 w-4" />}
              variant={currentChart === key ? "solid" : "light"}
              onPress={() => setCurrentChart(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="w-full">{renderChart()}</div>
      </CardBody>

      <MovieDetailsModal {...drilldown.modalProps} />
    </Card>
  );
};

export default DashboardAnalyticsWidget;