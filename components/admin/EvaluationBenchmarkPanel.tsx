'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, Cell
} from 'recharts';
import { Play, Loader2, Clock, AlertTriangle, ShieldAlert, Sparkles, Activity } from 'lucide-react';
import { AdminMetricCard } from './AdminMetricCard';

interface EvaluationBenchmarkPanelProps {
  aggregates: any[];
  runningTest: boolean;
  onRunBenchmark: () => Promise<void>;
  isDemo: boolean;
}

export function EvaluationBenchmarkPanel({
  aggregates,
  runningTest,
  onRunBenchmark,
  isDemo
}: EvaluationBenchmarkPanelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (aggregates.length === 0) {
    return (
      <Card className="border bg-slate-900/20 border-slate-900 p-8 text-center flex flex-col items-center select-none">
        <AlertTriangle className="h-10 w-10 text-amber-500 mb-4 animate-bounce" />
        <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider">No Benchmarks Run</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6 leading-relaxed">
          The algorithmic performance ledger is empty. Click below to execute the evaluation suite across the test queries.
        </p>
        <Button 
          onClick={onRunBenchmark}
          disabled={runningTest}
          className="h-9 text-xs font-bold gap-1.5 bg-purple-600 hover:bg-purple-500 text-white"
        >
          {runningTest ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running Sandbox Suite...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run First Benchmark Comparison
            </>
          )}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Demo Mode Notice */}
      {isDemo && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
          <div className="flex gap-2.5 items-start">
            <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold font-mono uppercase block text-amber-500">Demo Evaluation Mode Active</span>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                Displaying virtual algorithm metrics as no real labelled evaluation dataset has been imported. Benchmarks represent estimated baseline performance capabilities.
              </p>
            </div>
          </div>
          <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/35 hover:bg-amber-500/20 text-[10px] py-1 px-2.5 font-mono uppercase w-fit self-end sm:self-center shrink-0">
            Demo Evaluation Mode
          </Badge>
        </div>
      )}

      {/* Benchmark Summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 select-none">
        {aggregates.map((agg, idx) => (
          <Card key={idx} className="border bg-slate-900/10 border-slate-900 shadow-sm relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
            <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-mono block tracking-wider truncate">
                  {agg.search_method}
                </span>
                <span className="text-xl font-bold text-slate-200 block font-serif mt-1">
                  {agg.quality_score} <span className="text-xs text-slate-500 font-sans">/ 100</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-900 pt-2 font-mono">
                <span>P@5: {Math.round(agg.precision_at_5 * 100)}%</span>
                <span>R@10: {Math.round(agg.recall_at_10 * 100)}%</span>
                <span>{agg.response_time_ms} ms</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Precision & Recall Comparison Chart */}
        <Card className="border bg-slate-900/20 border-slate-900 p-4 lg:col-span-2">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
              Retrieval Accuracy Metrics (Precision@5 vs Recall@10 vs MRR)
            </CardTitle>
            <CardDescription className="text-[10px] text-slate-500 font-mono mt-0.5">
              Comparison across search paradigms. Higher values indicate higher archival match quality.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-[240px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aggregates}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="search_method" stroke="#64748b" style={{ fontSize: 9 }} />
                  <YAxis domain={[0, 1.0]} stroke="#64748b" style={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: 10 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="precision_at_5" name="Precision @ 5" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recall_at_10" name="Recall @ 10" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="mrr" name="MRR" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-950/20">
                <span className="text-[10px] font-mono text-slate-600">Initializing chart mount...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latency benchmark chart */}
        <Card className="border bg-slate-900/20 border-slate-900 p-4">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
              Average Response Latency (ms)
            </CardTitle>
            <CardDescription className="text-[10px] text-slate-500 font-mono mt-0.5">
              Round-trip search retrieval latency
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-[240px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aggregates}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="search_method" stroke="#64748b" style={{ fontSize: 8 }} />
                  <YAxis stroke="#64748b" style={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: 10 }} />
                  <Bar dataKey="response_time_ms" name="Latency (ms)" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-950/20">
                <span className="text-[10px] font-mono text-slate-600">Initializing chart mount...</span>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Algorithm Performance Ledger */}
      <Card className="border bg-slate-900/20 border-slate-900 p-4 select-none">
        <CardHeader className="p-0 pb-3 border-b border-slate-900">
          <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-purple-400 animate-pulse" />
            Algorithmic Performance Evaluation Ledger
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-500 border-b border-slate-900">
                  <th className="py-2 pr-3 font-semibold">Search Paradigm Algorithm</th>
                  <th className="py-2 pr-3 font-semibold">Precision @ 5</th>
                  <th className="py-2 pr-3 font-semibold">Recall @ 10</th>
                  <th className="py-2 pr-3 font-semibold">Mean Reciprocal Rank (MRR)</th>
                  <th className="py-2 pr-3 font-semibold">Avg Latency</th>
                  <th className="py-2 text-right font-semibold">Result Quality Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {aggregates.map((agg, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/10">
                    <td className="py-2.5 pr-3 text-slate-200 font-sans font-bold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse shrink-0" />
                      {agg.search_method}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-300">{(agg.precision_at_5 * 100).toFixed(1)}%</td>
                    <td className="py-2.5 pr-3 text-slate-300">{(agg.recall_at_10 * 100).toFixed(1)}%</td>
                    <td className="py-2.5 pr-3 text-slate-300">{agg.mrr.toFixed(3)}</td>
                    <td className="py-2.5 pr-3 text-rose-400">{agg.response_time_ms} ms</td>
                    <td className="py-2.5 text-right">
                      <Badge 
                        variant="secondary" 
                        className={`text-[10px] font-bold ${
                          agg.quality_score >= 85 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          agg.quality_score >= 70 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {agg.quality_score} / 100
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
