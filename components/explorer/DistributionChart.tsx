'use client';

import React from 'react';

interface ChartDataItem {
  name: string;
  count: number;
  slug?: string;
  year?: number;
}

interface DistributionChartProps {
  data: ChartDataItem[];
  type?: 'bar' | 'area';
  color?: string;
  height?: number;
}

export function DistributionChart({
  data,
  type = 'bar',
  color = '#0ea5e9',
  height = 160
}: DistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-slate-950/20 border border-slate-900 rounded-lg p-6 select-none h-40">
        <span className="text-xs text-slate-500 font-mono">No distribution metrics available.</span>
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.count), 1);

  if (type === 'bar') {
    return (
      <div className="space-y-2 select-none font-sans">
        {data.slice(0, 6).map((item, index) => {
          const percentage = Math.round((item.count / maxVal) * 100);
          const nameLabel = item.year ? `${item.year} CE` : item.name;

          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center text-[10.5px]">
                <span className="text-slate-300 font-medium truncate max-w-[70%]">
                  {nameLabel}
                </span>
                <span className="text-slate-500 font-mono font-semibold">
                  {item.count.toLocaleString()} files
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950/80 rounded-full overflow-hidden border border-slate-900">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}80`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Area chart (used for years progression timeline)
  const chartHeight = height;
  const padding = 20;
  const graphHeight = chartHeight - padding * 2;
  
  // Sort chronologically if it contains year keys
  const sortedData = [...data].sort((a, b) => {
    if (a.year && b.year) return a.year - b.year;
    return a.name.localeCompare(b.name);
  });

  const pointsCount = sortedData.length;
  const widthStep = pointsCount > 1 ? 100 / (pointsCount - 1) : 100;

  // Generate SVG path points
  const points = sortedData.map((d, i) => {
    const x = i * widthStep;
    const y = padding + graphHeight - (d.count / maxVal) * graphHeight;
    return `${x}%,${y}`;
  });

  const pointsString = points.join(' ');
  const areaPath = pointsCount > 1
    ? `M 0%,${chartHeight - padding} L ${pointsString} L 100%,${chartHeight - padding} Z`
    : '';
  const linePath = pointsCount > 1
    ? `M ${pointsString}`
    : '';

  return (
    <div className="relative select-none font-sans" style={{ height: `${chartHeight}px` }}>
      {/* SVG Canvas Area */}
      <svg className="w-full h-full overflow-visible">
        {/* Gradients */}
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        <line x1="0" y1={padding} x2="100%" y2={padding} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="0" y1={padding + graphHeight / 2} x2="100%" y2={padding + graphHeight / 2} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="0" y1={chartHeight - padding} x2="100%" y2={chartHeight - padding} stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />

        {/* Shaded Area */}
        {pointsCount > 1 && (
          <path
            d={areaPath}
            fill={`url(#gradient-${color.replace('#', '')})`}
            className="transition-all duration-500"
          />
        )}

        {/* Floating Line */}
        {pointsCount > 1 ? (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500"
            style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
          />
        ) : (
          /* Single point fallback */
          <circle
            cx="50%"
            cy={padding + graphHeight / 2}
            r="6"
            fill={color}
            style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
          />
        )}

        {/* Data points markers */}
        {sortedData.map((d, i) => {
          const x = `${i * widthStep}%`;
          const y = padding + graphHeight - (d.count / maxVal) * graphHeight;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3.5"
              fill="#0f172a"
              stroke={color}
              strokeWidth="2.5"
              className="hover:scale-125 cursor-pointer transition-transform"
            />
          );
        })}
      </svg>

      {/* Axis Labels */}
      <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono mt-1 px-1">
        <span>{sortedData[0]?.year || sortedData[0]?.name}</span>
        <span>{sortedData[Math.floor(pointsCount / 2)]?.year || sortedData[Math.floor(pointsCount / 2)]?.name}</span>
        <span>{sortedData[pointsCount - 1]?.year || sortedData[pointsCount - 1]?.name}</span>
      </div>
    </div>
  );
}
