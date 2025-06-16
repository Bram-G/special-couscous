import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";

import { EmptyState } from "./EmptyState";

interface BarChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface BarChartComponentProps {
  data: BarChartData[];
  dataKey?: string;
  barColor?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  emptyStateMessage?: string;
  customTooltip?: React.FC<TooltipProps<any, any>>;
  maxBars?: number;
  scrollable?: boolean;
  onBarClick?: (name: string) => void;
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = payload[0].value;
    const displayName = data.name || label;

    return (
      <div className="bg-default-50 p-2 border border-default-200 rounded shadow-sm text-sm">
        <p className="font-medium">{displayName}</p>
        <p className="text-primary">{value}</p>
      </div>
    );
  }

  return null;
};

export const BarChartComponent: React.FC<BarChartComponentProps> = ({
  data,
  dataKey = "value",
  barColor = "#8884d8",
  height = 350, // Increased default height to accommodate axis labels
  xAxisLabel,
  yAxisLabel,
  emptyStateMessage,
  customTooltip = CustomBarTooltip,
  maxBars = 10,
  scrollable = false,
  onBarClick,
}) => {
  if (!data || data.length === 0) {
    return <EmptyState message={emptyStateMessage} />;
  }

  // Process data to limit number of bars if needed
  const chartData =
    maxBars && !scrollable && data.length > maxBars
      ? [...data].sort((a, b) => b.value - a.value).slice(0, maxBars)
      : data;

  // Calculate width for scrollable chart
  const chartWidth =
    scrollable && data.length > maxBars
      ? Math.max(100, data.length * 80) // Back to tighter spacing - 80px per bar
      : "100%";

  // Smart name truncation function
  const truncateName = (name: string) => {
    // Calculate max characters based on available space
    const baseMaxLength = scrollable ? 15 : 12;

    // For very long names, be more aggressive with truncation
    if (name.length > baseMaxLength) {
      // Try to find a good break point (space, dash, etc.)
      const truncated = name.substring(0, baseMaxLength);
      const lastSpace = truncated.lastIndexOf(" ");
      const lastDash = truncated.lastIndexOf("-");

      // If we can break at a natural point within reasonable distance
      if (lastSpace > baseMaxLength - 4) {
        return name.substring(0, lastSpace) + "...";
      } else if (lastDash > baseMaxLength - 4) {
        return name.substring(0, lastDash) + "...";
      } else {
        return truncated + "...";
      }
    }

    return name;
  };

  // Process data with truncated display names
  const processedData = chartData.map((item) => ({
    ...item,
    displayName: truncateName(item.name),
  }));

  // Custom tick formatter for X-axis to handle rotated text
  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          dy={16}
          fill="#666"
          fontSize="11"
          textAnchor="end"
          transform="rotate(-45)"
          x={0}
          y={0}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  // Handle bar click
  const handleClick = (data: any) => {
    if (onBarClick && data.name) {
      onBarClick(data.name);
    }
  };

  return (
    <div className={scrollable ? "overflow-x-auto" : ""}>
      <div style={{ width: scrollable ? chartWidth : "100%", height }}>
        <ResponsiveContainer height="100%" width="100%">
          <BarChart
            data={processedData}
            margin={{
              top: 30, // Increased top margin to balance the chart
              right: 30,
              left: yAxisLabel ? 80 : 60,
              bottom: 90, // Increased bottom margin for rotated labels + space for X-axis title
            }}
            onClick={onBarClick ? handleClick : undefined}
          >
            <CartesianGrid
              opacity={0.3}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="displayName"
              height={70} // Increased height for rotated labels
              interval={0} // Show all labels
              label={
                xAxisLabel
                  ? {
                      value: xAxisLabel,
                      position: "insideBottom",
                      offset: -10, // Moved further down to avoid overlap
                      style: { textAnchor: "middle" },
                    }
                  : undefined
              }
              tick={<CustomXAxisTick />}
            />
            <YAxis
              label={
                yAxisLabel
                  ? {
                      value: yAxisLabel,
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle" },
                    }
                  : undefined
              }
              tick={{ fontSize: 11 }}
              width={yAxisLabel ? 60 : 40} // Increased width when we have a label
            />
            <Tooltip
              content={customTooltip}
              cursor={{ fill: "rgba(180, 180, 180, 0.1)" }}
              wrapperStyle={{ zIndex: 100 }}
            />
            <Bar
              className={onBarClick ? "cursor-pointer" : ""}
              dataKey={dataKey}
              fill={barColor}
              maxBarSize={50}
              radius={[4, 4, 0, 0]}
              onClick={handleClick}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
