import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { EmptyState } from './EmptyState';

interface PieChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface PieChartComponentProps {
  data: PieChartData[];
  colors?: string[];
  height?: number;
  emptyStateMessage?: string;
  customTooltip?: React.FC<TooltipProps<any, any>>;
}

export const PieChartComponent: React.FC<PieChartComponentProps> = ({
  data,
  colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#4CAF50'],
  height = 300,
  emptyStateMessage,
  customTooltip
}) => {
  if (!data || data.length === 0) {
    return <EmptyState message={emptyStateMessage} />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={customTooltip} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};