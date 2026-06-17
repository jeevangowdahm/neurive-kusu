'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, RefreshCw, Activity, CheckCircle, Database } from 'lucide-react';
import { AdminMetricCard } from './AdminMetricCard';
import { AnalyticsChart } from './AnalyticsChart';

interface IngestionAnalyticsPanelProps {
  data: any;
  onRetryJob: (documentId: string, jobId: string) => Promise<void>;
}

export function IngestionAnalyticsPanel({ data, onRetryJob }: IngestionAnalyticsPanelProps) {
  if (!data) return null;

  const {
    processing_success_rate = 0.0,
    failed_jobs_count = 0,
    average_processing_time_sec = 0,
    documents_by_status = [],
    ocr_confidence_distribution = [],
    pipeline_step_performance = [],
    recent_uploads = [],
    failed_jobs = [],
    average_ocr_confidence = 0.0,
    low_confidence_warnings = 0,
    total_chunks = 0,
    failed_embeddings = 0
  } = data;

  const chartColors = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      
      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
        <AdminMetricCard 
          title="Processing Success Rate" 
          value={`${Math.round(processing_success_rate * 100)}%`}
          subtext="Total completed vs failed jobs"
          icon={CheckCircle}
          iconColor="text-emerald-500"
        />
        <AdminMetricCard 
          title="Average Ingestion Speed" 
          value={`${average_processing_time_sec} sec`}
          subtext="Full pipeline OCR to embedding"
          icon={Clock}
          iconColor="text-blue-500"
        />
        <AdminMetricCard 
          title="Failed Processing Jobs" 
          value={failed_jobs_count}
          subtext="Awaiting manual/admin retries"
          icon={AlertTriangle}
          iconColor="text-rose-500"
        />
      </div>

      {/* OCR & Embedding Detail stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
        <AdminMetricCard 
          title="Avg OCR Confidence" 
          value={`${Math.round(average_ocr_confidence * 100)}%`}
          subtext="Average accuracy score"
          icon={CheckCircle}
          iconColor="text-cyan-500"
        />
        <AdminMetricCard 
          title="Low OCR Warnings" 
          value={low_confidence_warnings}
          subtext="Pages with confidence < 60%"
          icon={AlertTriangle}
          iconColor="text-amber-500"
        />
        <AdminMetricCard 
          title="Total Document Chunks" 
          value={total_chunks.toLocaleString()}
          subtext="Text passages indexed"
          icon={Database}
          iconColor="text-indigo-500"
        />
        <AdminMetricCard 
          title="Failed Embeddings" 
          value={failed_embeddings}
          subtext="Chunks missing vectors"
          icon={AlertTriangle}
          iconColor="text-rose-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* OCR Confidence distributions and pipeline steps performance */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border bg-slate-900/20 border-slate-900 p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                OCR Confidence Distributions
              </CardTitle>
              <CardDescription className="text-[10px] text-slate-500 font-mono">
                Bilingual optical reading confidence rating bands
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <AnalyticsChart 
                type="bar" 
                data={ocr_confidence_distribution} 
                xKey="range" 
                yKey="count" 
                colors={chartColors}
                height={200}
              />
            </CardContent>
          </Card>

          {/* Steps durations */}
          <Card className="border bg-slate-900/20 border-slate-900 p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-primary" />
                Pipeline Step Latency Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4 pt-2 select-none">
              {pipeline_step_performance.map((step: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">{step.step}</span>
                    <span className="text-primary font-mono">{(step.avg_duration_ms / 1000).toFixed(1)}s</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded border border-slate-900 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-blue-500 rounded" 
                      style={{ width: `${Math.min(100, (step.avg_duration_ms / 15000) * 100)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Status pie chart and recent uploads summary */}
        <div className="space-y-6">
          <Card className="border bg-slate-900/20 border-slate-900 p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                Document status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col items-center justify-center">
              <AnalyticsChart 
                type="pie" 
                data={documents_by_status} 
                xKey="status" 
                yKey="count" 
                colors={chartColors}
                height={150}
              />
              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-3 text-[10px] text-slate-400 select-none">
                {documents_by_status.map((item: any, idx: number) => (
                  <span key={idx} className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: chartColors[idx % chartColors.length] }} />
                    {item.status}: {item.count}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent uploads */}
          <Card className="border bg-slate-900/20 border-slate-900 p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                Recent Pipeline Submissions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3 pt-2 max-h-[190px] overflow-y-auto pr-1 select-none">
              {recent_uploads.slice(0, 5).map((doc: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-slate-900/50 last:border-0">
                  <div className="truncate max-w-[170px]">
                    <span className="text-slate-200 block truncate">{doc.title}</span>
                    <span className="text-[9px] text-slate-500">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  </div>
                  <Badge className={`text-[9px] ${
                    doc.status === 'Completed' || doc.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    doc.status === 'Processing' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Failed Jobs retry console */}
      {failed_jobs && failed_jobs.length > 0 && (
        <Card className="border bg-slate-900/20 border-slate-900 p-4">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between border-b border-slate-900">
            <div>
              <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                Failed Ingestion Queue & Recovery Center ({failed_jobs.length})
              </CardTitle>
              <CardDescription className="text-[10px] text-slate-500 font-mono mt-0.5">
                Cleanly re-enlist failed jobs without duplicating chunks or page texts.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-mono select-none">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-900">
                    <th className="py-2 pr-3 font-semibold">Document Title</th>
                    <th className="py-2 pr-3 font-semibold">Failed Step</th>
                    <th className="py-2 pr-3 font-semibold">Error Message</th>
                    <th className="py-2 pr-3 font-semibold">Failure Date</th>
                    <th className="py-2 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {failed_jobs.map((job: any) => (
                    <tr key={job.job_id} className="hover:bg-slate-900/10">
                      <td className="py-2.5 pr-3 text-slate-200 truncate max-w-[200px]">{job.title}</td>
                      <td className="py-2.5 pr-3 text-slate-400">{job.step}</td>
                      <td className="py-2.5 pr-3 text-rose-400 font-sans max-w-[220px] truncate" title={job.error}>
                        {job.error}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-500">{new Date(job.failed_at).toLocaleDateString()}</td>
                      <td className="py-2.5 text-right">
                        <Button
                          size="sm"
                          onClick={() => onRetryJob(job.document_id, job.job_id)}
                          className="h-7 text-[10px] px-3 font-semibold gap-1 bg-amber-600 hover:bg-amber-500 text-white"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Retry Job
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
