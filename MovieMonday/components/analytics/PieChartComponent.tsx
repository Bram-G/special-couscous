import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Sector,
} from "recharts";

import { EmptyState } from "./EmptyState";

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
  customTooltip?: React.FC<any>;
  maxSlices?: number;
  hideLegend?: boolean;
  showPercent?: boolean;
  onSliceClick?: (name: string) => void;
}

const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    percent,
    name,
    value,
  } = props;
  const sin = Math.sin((-midAngle * Math.PI) / 180);
  const cos = Math.cos((-midAngle * Math.PI) / 180);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        endAngle={endAngle}
        fill={fill}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        fill="none"
        stroke={fill}
      />
      <circle cx={ex} cy={ey} fill={fill} r={2} stroke="none" />
      <text
        fill="#333"
        textAnchor={textAnchor}
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
      >{`${name}`}</text>
      <text
        dy={18}
        fill="#999"
        textAnchor={textAnchor}
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
      >
        {`${value} (${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  );
};

export const PieChartComponent: React.FC<PieChartComponentProps> = ({
  data,
  colors = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#4CAF50",
    "#f44336",
    "#9C27B0",
  ],
  height = 300,
  emptyStateMessage,
  customTooltip,
  maxSlices = 5, // Default to showing 5 slices before grouping into "Other"
  hideLegend = false,
  showPercent = false,
  onSliceClick,
}) => {
  const [activeIndex, setActiveIndex] = React.useState(-1);

  if (!data || data.length === 0) {
    return <EmptyState message={emptyStateMessage} />;
  }

  // Process data to limit number of slices
  let processedData = [...data].sort((a, b) => b.value - a.value);

  if (processedData.length > maxSlices) {
    const topSlices = processedData.slice(0, maxSlices);

    // Calculate total for "Other" category
    const otherValue = processedData
      .slice(maxSlices)
      .reduce((sum, item) => sum + item.value, 0);

    // Add "Other" category if there's any value
    if (otherValue > 0) {
      topSlices.push({
        name: "Other",
        value: otherValue,
      });
    }

    processedData = topSlices;
  }

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(-1);
  };

  // Function to handle click on pie slice
  const handleClick = (data, index) => {
    if (onSliceClick && data.name) {
      onSliceClick(data.name);
    }
  };

  // Custom renderLabel function to show percentages
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }) => {
    if (!showPercent) return null;

    // Only show labels for slices that are big enough
    if (percent < 0.08) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        dominantBaseline="central"
        fill="white"
        style={{
          fontWeight: "bold",
          fontSize: "12px",
          textShadow: "0px 0px 3px rgba(0,0,0,0.5)",
        }}
        textAnchor="middle"
        x={x}
        y={y}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="relative" style={{ zIndex: 10 }}>
      <ResponsiveContainer height={height} width="100%">
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            className={onSliceClick ? "cursor-pointer" : ""} // Add cursor pointer if clickable
            cx="50%"
            cy="50%"
            data={processedData}
            dataKey="value"
            fill="#8884d8"
            label={showPercent ? renderCustomizedLabel : false}
            labelLine={false}
            outerRadius={80}
            onClick={handleClick} // Add click handler
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
          >
            {processedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip content={customTooltip} wrapperStyle={{ zIndex: 100 }} />
          {!hideLegend && (
            <Legend
              align="center"
              className={onSliceClick ? "cursor-pointer" : ""}
              layout="horizontal"
              payload={processedData.map((item, index) => ({
                id: item.name,
                type: "square",
                value: `${item.name} (${item.value})`,
                color: colors[index % colors.length],
              }))}
              verticalAlign="bottom"
              onClick={(entry) => {
                // Handle legend click if callback is provided
                if (onSliceClick && entry.value) {
                  const itemName = entry.value.split(" (")[0]; // Extract name from "Name (10)" format

                  onSliceClick(itemName);
                }
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
