'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface AdminMetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
}

export function AdminMetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = 'text-primary',
  trend
}: AdminMetricCardProps) {
  return (
    <Card className="border bg-slate-900/10 border-slate-900 shadow-sm backdrop-blur-sm relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
      <CardContent className="p-4 flex items-center justify-between gap-3 select-none">
        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-mono block tracking-wider">
            {title}
          </span>
          <span className="text-xl font-bold text-slate-200 font-serif block leading-none">
            {value}
          </span>
          
          {trend ? (
            <span className={`text-[9px] block ${trend.isPositive !== false ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.isPositive !== false ? '▲' : '▼'} {trend.value}% {trend.label}
            </span>
          ) : subtext ? (
            <span className="text-[9px] text-slate-500 block">
              {subtext}
            </span>
          ) : null}
        </div>

        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border border-slate-800 bg-slate-950/45 group-hover:scale-105 transition-transform duration-300`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}
