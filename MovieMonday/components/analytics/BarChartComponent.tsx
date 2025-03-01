import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { EmptyState } from './EmptyState';

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
}

export const BarChartComponent: React.FC<BarChartComponentProps> = ({
  data,
  dataKey = "value",
  barColor = "#8884d8",
  height = 300,
  xAxisLabel,
  yAxisLabel,
  emptyStateMessage,
  customTooltip
}) => {
  if (!data || data.length === 0) {
    return <EmptyState message={emptyStateMessage} />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 30,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
        <XAxis 
          dataKey="name" 
          label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -20 } : undefined}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined} 
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={customTooltip} />
        <Bar dataKey={dataKey} fill={barColor} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};