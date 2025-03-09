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
  maxBars?: number; // Maximum number of bars to display
  scrollable?: boolean; // Whether to make the chart horizontally scrollable
  onBarClick?: (name: string) => void; // New callback for bar clicks
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
  height = 300,
  xAxisLabel,
  yAxisLabel,
  emptyStateMessage,
  customTooltip = CustomBarTooltip,
  maxBars = 10, // Default to 10 bars
  scrollable = false, // Default not scrollable
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
      ? Math.max(100, data.length * 100) // 100px per bar for more spacing
      : "100%";

  // Function to truncate long names
  const truncateName = (name: string, maxLength = 10) => {
    // For scrollable charts, we can use longer names
    const actualMaxLength = scrollable ? 20 : maxLength;
    return name.length > actualMaxLength
      ? `${name.substring(0, actualMaxLength)}...`
      : name;
  };

  // Fix data by truncating names for display (keeps original in tooltip)
  const processedData = chartData.map((item) => ({
    ...item,
    displayName: truncateName(item.name),
  }));

  // Handle bar click
  const handleClick = (data, index) => {
    if (onBarClick && data.name) {
      onBarClick(data.name);
    }
  };

  return (
    <div className={scrollable ? "overflow-x-auto" : ""}>
      <div style={{ width: scrollable ? chartWidth : "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedData}
            margin={{
              top: 30,
              right: 30,
              left: 20,
              bottom: 10,
            }}
            onClick={onBarClick ? handleClick : undefined} // Add the click handler if provided
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              opacity={0.3}
            />
            <XAxis
              dataKey="displayName"
              label={
                xAxisLabel
                  ? { value: xAxisLabel, position: "insideBottom", offset: -20 }
                  : undefined
              }
              tick={{ fontSize: 12 }}
              interval={0} // Show all labels
              angle={0} // Keep labels flat
              textAnchor="middle" // Center align text
              height={50} // Add more height for the axis to fit labels
            />
            <YAxis
              label={
                yAxisLabel
                  ? { value: yAxisLabel, angle: -90, position: "insideLeft" }
                  : undefined
              }
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              content={customTooltip}
              cursor={{ fill: "rgba(180, 180, 180, 0.1)" }} // Subtle highlight
              wrapperStyle={{ zIndex: 100 }} // Ensure tooltip is above other elements
              position={{ y: 0 }} // Position tooltip at top of bar
            />
            <Bar
              dataKey={dataKey}
              fill={barColor}
              radius={[4, 4, 0, 0]}
              maxBarSize={50} // Limit maximum bar width
              className={onBarClick ? "cursor-pointer" : ""} // Add cursor pointer if clickable
              onClick={(data) => {
                if (onBarClick && data.name) {
                  onBarClick(data.name);
                }
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};