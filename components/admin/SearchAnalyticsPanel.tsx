'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Clock, AlertCircle, Database, HelpCircle } from 'lucide-react';
import { AdminMetricCard } from './AdminMetricCard';
import { AnalyticsChart } from './AnalyticsChart';

interface SearchAnalyticsPanelProps {
  data: any;
}

export function SearchAnalyticsPanel({ data }: SearchAnalyticsPanelProps) {
  if (!data) return null;

  const {
    total_searches = 0,
    average_response_time = 0.0,
    top_queries = [],
    top_districts_searched = [],
    top_categories_searched = [],
    zero_result_searches = [],
    best_performing_queries = [],
    search_mode_distribution = []
  } = data;

  const chartColors = ['#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b'];

  return (
    <div className="space-y-6">
      
      {/* Search statistics metrics summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
        <AdminMetricCard 
          title="Total Searches Executed" 
          value={total_searches.toLocaleString()}
          subtext="Total database queries parsed"
          icon={Search}
          iconColor="text-blue-500"
        />
        <AdminMetricCard 
          title="Average Response Speed" 
          value={`${average_response_time} ms`}
          subtext="Server-side log response time"
          icon={Clock}
          iconColor="text-emerald-500"
        />
        <AdminMetricCard 
          title="Zero-Result Searches" 
          value={zero_result_searches.reduce((sum: number, q: any) => sum + q.count, 0)}
          subtext="Queries yielding 0 hits"
          icon={AlertCircle}
          iconColor="text-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Search Mode distributions and popular search queries */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border bg-slate-900/20 border-slate-900 p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                Search Mode Distributions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[200px] flex items-center justify-between gap-4">
              <div className="w-1/2 h-full">
                <AnalyticsChart 
                  type="pie" 
                  data={search_mode_distribution} 
                  xKey="mode" 
                  yKey="count" 
                  colors={chartColors}
                  height={150}
                />
              </div>
              <div className="w-1/2 flex flex-col gap-1.5 text-[10px] text-slate-400 select-none">
                {search_mode_distribution.map((item: any, idx: number) => (
                  <span key={idx} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded" style={{ backgroundColor: chartColors[idx % chartColors.length] }} />
                    <span className="truncate max-w-[200px]">{item.mode}: {item.count}</span>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Popular search queries */}
          <Card className="border bg-slate-900/20 border-slate-900 p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider font-serif">
                Top Active Search Queries
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <AnalyticsChart 
                type="bar" 
                data={top_queries} 
                xKey="query" 
                yKey="count" 
                colors={['#10b981']}
                height={200}
                layout="vertical"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right side panels */}
        <div className="space-y-6">
          
          {/* Top filter mappings */}
          <Card className="border bg-slate-900/20 border-slate-900 p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                Most Active Search Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4 pt-2 select-none">
              <div>
                <span className="text-[9.5px] text-slate-500 font-mono uppercase block mb-1">Top Districts</span>
                <div className="flex flex-wrap gap-1">
                  {top_districts_searched.map((d: any, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-[9px] bg-slate-950 border border-slate-900 text-slate-300">
                      {d.name} ({d.count})
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[9.5px] text-slate-500 font-mono uppercase block mb-1">Top Categories</span>
                <div className="flex flex-wrap gap-1">
                  {top_categories_searched.map((c: any, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-[9px] bg-slate-950 border border-slate-900 text-slate-300">
                      {c.name} ({c.count})
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zero result query list */}
          {zero_result_searches && zero_result_searches.length > 0 && (
            <Card className="border bg-slate-900/20 border-slate-900 p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle className="h-4 w-4 text-amber-500" />
                  Zero-Result Search Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-2 pt-2 select-none">
                {zero_result_searches.slice(0, 5).map((q: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-slate-900 last:border-0">
                    <span className="text-slate-300 truncate max-w-[170px] italic font-mono">&ldquo;{q.query}&rdquo;</span>
                    <Badge variant="outline" className="text-[9px] border-slate-800 text-slate-500 font-mono">
                      {q.count} times
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        </div>

      </div>

    </div>
  );
}
