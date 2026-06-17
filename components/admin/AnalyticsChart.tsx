'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface AnalyticsChartProps {
  type: 'bar' | 'area' | 'pie';
  data: any[];
  xKey?: string;
  yKey: string;
  nameKey?: string;
  colors?: string[];
  height?: number;
  layout?: 'horizontal' | 'vertical';
  showLegend?: boolean;
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export function AnalyticsChart({
  type,
  data,
  xKey,
  yKey,
  nameKey,
  colors = DEFAULT_COLORS,
  height = 200,
  layout = 'horizontal',
  showLegend = false
}: AnalyticsChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-slate-950/20 border border-slate-900/60 rounded-lg select-none"
        style={{ height }}
      >
        <span className="text-[10px] font-mono text-slate-600">No telemetry data recorded</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={data} layout={layout}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis 
              type={layout === 'vertical' ? 'number' : 'category'} 
              dataKey={layout === 'vertical' ? undefined : xKey} 
              stroke="#64748b" 
              style={{ fontSize: 9 }} 
            />
            <YAxis 
              type={layout === 'vertical' ? 'category' : 'number'} 
              dataKey={layout === 'vertical' ? xKey : undefined} 
              stroke="#64748b" 
              style={{ fontSize: 9 }} 
              width={layout === 'vertical' ? 100 : 35}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: 10 }} 
              labelStyle={{ color: '#fff' }} 
            />
            {showLegend && <Legend wrapperStyle={{ fontSize: 9 }} />}
            <Bar dataKey={yKey} fill={colors[0]} radius={layout === 'vertical' ? [0, 4, 4, 0] : [4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        ) : type === 'area' ? (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={xKey} stroke="#64748b" style={{ fontSize: 9 }} />
            <YAxis stroke="#64748b" style={{ fontSize: 9 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: 10 }} 
              labelStyle={{ color: '#fff' }} 
            />
            <Area type="monotone" dataKey={yKey} stroke={colors[0]} fillOpacity={1} fill="url(#colorArea)" />
          </AreaChart>
        ) : (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={60}
              paddingAngle={4}
              dataKey={yKey}
              nameKey={nameKey || xKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: 10 }} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
