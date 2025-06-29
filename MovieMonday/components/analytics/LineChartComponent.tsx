import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";

import { EmptyState } from "./EmptyState";

interface LineChartComponentProps {
  data: any[];
  lines: Array<{
    dataKey: string;
    color: string;
    name?: string;
  }>;
  xAxisDataKey?: string;
  height?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
  emptyStateMessage?: string;
  customTooltip?: React.FC<TooltipProps<any, any>>;
}

export const LineChartComponent: React.FC<LineChartComponentProps> = ({
  data,
  lines,
  xAxisDataKey = "name",
  height = 300,
  xAxisLabel,
  yAxisLabel,
  emptyStateMessage,
  customTooltip,
}) => {
  if (!data || data.length === 0) {
    return <EmptyState message={emptyStateMessage} />;
  }

  return (
    <ResponsiveContainer height={height} width="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 30,
        }}
      >
        <CartesianGrid opacity={0.3} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey={xAxisDataKey}
          label={
            xAxisLabel
              ? { value: xAxisLabel, position: "insideBottom", offset: -20 }
              : undefined
          }
          tick={{ fontSize: 12 }}
        />
        <YAxis
          label={
            yAxisLabel
              ? { value: yAxisLabel, angle: -90, position: "insideLeft" }
              : undefined
          }
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={customTooltip} />
        {lines.map((line, index) => (
          <Line
            key={index}
            activeDot={{ r: 8 }}
            dataKey={line.dataKey}
            name={line.name || line.dataKey}
            stroke={line.color}
            type="monotone"
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};
