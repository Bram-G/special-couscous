import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
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
  customTooltip?: React.FC<any>;
  maxSlices?: number; // Control how many slices to show before grouping into "Other"
  hideLegend?: boolean; // Option to hide the legend
  showPercent?: boolean; // Option to show percentages on the chart
}

const renderActiveShape = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, percent, name, value } = props;
  const sin = Math.sin(-midAngle * Math.PI / 180);
  const cos = Math.cos(-midAngle * Math.PI / 180);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${name}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`${value} (${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  );
};

export const PieChartComponent: React.FC<PieChartComponentProps> = ({
  data,
  colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#4CAF50', '#f44336', '#9C27B0'],
  height = 300,
  emptyStateMessage,
  customTooltip,
  maxSlices = 5, // Default to showing 5 slices before grouping into "Other"
  hideLegend = false,
  showPercent = false
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
        name: 'Other',
        value: otherValue
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

  // Custom renderLabel function to show percentages
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    if (!showPercent) return null;
    
    // Only show labels for slices that are big enough
    if (percent < 0.08) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        style={{
          fontWeight: 'bold',
          fontSize: '12px',
          textShadow: '0px 0px 3px rgba(0,0,0,0.5)'
        }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="relative" style={{ zIndex: 10 }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            label={showPercent ? renderCustomizedLabel : false} // Show percentages if enabled
          >
            {processedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            content={customTooltip} 
            wrapperStyle={{ zIndex: 100 }} // Ensure tooltip is above other elements
          />
          {!hideLegend && (
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              payload={
                processedData.map(
                  (item, index) => ({
                    id: item.name,
                    type: 'square',
                    value: `${item.name} (${item.value})`,
                    color: colors[index % colors.length]
                  })
                )
              }
            />
          )}
                </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

        