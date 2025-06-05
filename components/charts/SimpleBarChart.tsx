import React from 'react';

interface BarChartDataItem {
  label: string;
  value: number;
  color?: string; // Optional color for the bar
}

interface SimpleBarChartProps {
  data: BarChartDataItem[];
  title?: string;
  barColor?: string; // Default bar color if not specified in data item
  height?: number; // Height of the chart area
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, title, barColor = '#3b82f6', height = 300 }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500">No data available for the chart.</p>;
  }

  const maxValue = Math.max(...data.map(item => item.value), 0);
  const chartHeight = height;
  const barWidthPercentage = 80 / data.length; // Adjust for spacing

  return (
    <div className="p-4 bg-white rounded-lg shadow" role="figure" aria-labelledby={title ? 'chart-title' : undefined}>
      {title && <h3 id="chart-title" className="text-lg font-semibold text-gray-700 mb-4 text-center">{title}</h3>}
      <div 
        className="flex justify-around items-end" 
        style={{ height: `${chartHeight}px`, borderLeft: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}
        aria-label={`Bar chart: ${title || 'Data chart'}`}
      >
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight * 0.9 : 0; // 0.9 to leave some space at top
          const itemColor = item.color || barColor;
          return (
            <div
              key={index}
              className="flex flex-col items-center justify-end mx-1"
              style={{ width: `${barWidthPercentage}%` }}
              role="graphics-object"
              aria-label={`${item.label}: ${item.value}`}
            >
              <div 
                className="text-xs text-gray-600 mb-1 text-center"
                aria-hidden="true"
              >
                {item.value}
              </div>
              <div
                className="transition-all duration-300 ease-in-out"
                style={{
                  height: `${barHeight}px`,
                  width: '100%',
                  backgroundColor: itemColor,
                  borderTopLeftRadius: '3px',
                  borderTopRightRadius: '3px',
                }}
                title={`${item.label}: ${item.value}`}
              />
              <div 
                className="mt-1 text-xs text-gray-500 text-center break-words"
                style={{maxWidth: '80px'}}
                aria-hidden="true"
              >
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
      {/* Y-axis labels (simplified) */}
      <div className="flex justify-between text-xs text-gray-400 mt-1 px-2">
        <span>{maxValue}</span>
        <span>0</span>
      </div>
    </div>
  );
};

export default SimpleBarChart;
