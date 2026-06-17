'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, RefreshCw, BarChart3, Clock, Database, MessageSquare, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/app-layout';
import { toast } from 'sonner';
import Link from 'next/link';

// Reusable components
import { AdminAccessGuard } from '@/components/admin/AdminAccessGuard';
import { IngestionAnalyticsPanel } from '@/components/admin/IngestionAnalyticsPanel';
import { SearchAnalyticsPanel } from '@/components/admin/SearchAnalyticsPanel';
import { RagAnalyticsPanel } from '@/components/admin/RagAnalyticsPanel';
import { GraphAnalyticsPanel } from '@/components/admin/GraphAnalyticsPanel';
import { ReviewerGuide } from '@/components/admin/ReviewerGuide';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ingestion');
  const [overviewData, setOverviewData] = useState<any>(null);
  const [ingestionData, setIngestionData] = useState<any>(null);
  const [searchData, setSearchData] = useState<any>(null);
  const [ragData, setRagData] = useState<any>(null);
  const [graphData, setGraphData] = useState<any>(null);

  // Load stats from routes
  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [overRes, ingRes, searchRes, ragRes, graphRes] = await Promise.all([
        fetch('/api/admin/overview'),
        fetch('/api/admin/analytics/ingestion'),
        fetch('/api/admin/analytics/search'),
        fetch('/api/admin/analytics/rag'),
        fetch('/api/admin/analytics/graph')
      ]);

      const [over, ing, search, rag, graph] = await Promise.all([
        overRes.json(),
        ingRes.json(),
        searchRes.json(),
        ragRes.json(),
        graphRes.json()
      ]);

      if (over.success) setOverviewData(over.summary);
      if (ing.success) setIngestionData(ing.analytics);
      if (search.success) setSearchData(search.analytics);
      if (rag.success) setRagData(rag.analytics);
      if (graph.success) setGraphData(graph.analytics);

    } catch (err) {
      console.error(err);
      toast.error('Failed to load analytics dossier');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const handleRetryJob = async (documentId: string, jobId: string) => {
    const toastId = toast.loading('Re-enlisting ingestion pipeline dispatch...');
    try {
      const res = await fetch('/api/ai/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, jobId, isRetry: true })
      });
      if (res.ok) {
        toast.success('Ingestion pipeline successfully re-triggered!', { id: toastId });
        loadAnalyticsData();
      } else {
        throw new Error('Failed triggering retry');
      }
    } catch (err) {
      toast.error('Failed to dispatch retry agent.', { id: toastId });
    }
  };

  const isDemo = overviewData?.isDemo || false;

  return (
    <AppLayout>
      <AdminAccessGuard>
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-sans bg-slate-950 text-slate-100 min-h-[calc(100vh-4rem)]">
          
          {/* Navigation Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
            <div className="space-y-1">
              <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mb-1">
                <ArrowLeft className="h-4 w-4" />
                Return to Admin Console
              </Link>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-bold text-foreground font-serif">System Performance & Analytics</h1>
                <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary">Overview Telemetry</Badge>
              </div>
              <p className="text-xs text-slate-400">
                Audit processing latency, keyword popularity, RAG assistant citation mappings, and knowledge graph edges.
              </p>
            </div>
            
            <Button 
              onClick={loadAnalyticsData} 
              variant="outline" 
              size="sm" 
              className="h-9 text-xs font-semibold border-slate-800 text-slate-300 gap-1.5 self-end sm:self-center"
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Telemetry
            </Button>
          </div>

          {/* Demo Watermark Banner */}
          {isDemo && (
            <div className="bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[10px] px-3 py-1.5 rounded-md font-mono flex items-center gap-1.5 w-fit select-none animate-pulse">
              <AlertTriangle className="h-4 w-4" />
              <span>Virtual Admin Dossier: Displaying simulated telemetry as database holds 0 matching records.</span>
            </div>
          )}

          {/* Global Summary Cockpit Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
            
            <Card className="border bg-slate-900/10 border-slate-900 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <Database className="h-6 w-6 text-blue-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Documents & Pages</span>
                  <span className="text-base font-bold text-slate-200 font-serif block mt-0.5">
                    {overviewData?.total_documents ? overviewData.total_documents.toLocaleString() : 0} docs
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    {overviewData?.total_pages_processed ? overviewData.total_pages_processed.toLocaleString() : 0} pages processed
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border bg-slate-900/10 border-slate-900 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-6 w-6 text-emerald-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Search Speed</span>
                  <span className="text-base font-bold text-slate-200 font-serif block mt-0.5">
                    {overviewData?.average_search_response_time || 0} ms avg
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    Across {overviewData?.total_searches ? overviewData.total_searches.toLocaleString() : 0} log entries
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border bg-slate-900/10 border-slate-900 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-purple-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">RAG Accuracy</span>
                  <span className="text-base font-bold text-slate-200 font-serif block mt-0.5">
                    {Math.round((overviewData?.average_rag_confidence || 0) * 100)}% Conf
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    {overviewData?.helpful_feedback_count || 0} helpful · {overviewData?.not_helpful_feedback_count || 0} flag
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border bg-slate-900/10 border-slate-900 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Ingest Status</span>
                  <span className="text-base font-bold text-slate-200 font-serif block mt-0.5">
                    {overviewData?.failed_processing_jobs || 0} Failed
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    {overviewData?.completed_documents || 0} jobs completed
                  </span>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Central Scriptorium Tabs Console */}
          <Tabs defaultValue="ingestion" onValueChange={setActiveTab}>
            <TabsList className="bg-slate-900 border border-slate-850 p-1 rounded-lg select-none">
              <TabsTrigger value="ingestion" className="text-xs font-semibold px-4 py-2 rounded-md transition-all">
                Ingestion Analytics
              </TabsTrigger>
              <TabsTrigger value="search" className="text-xs font-semibold px-4 py-2 rounded-md transition-all">
                Search Engine
              </TabsTrigger>
              <TabsTrigger value="rag" className="text-xs font-semibold px-4 py-2 rounded-md transition-all">
                RAG Assistant
              </TabsTrigger>
              <TabsTrigger value="graph" className="text-xs font-semibold px-4 py-2 rounded-md transition-all">
                Knowledge Graph
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Ingestion Analytics */}
            <TabsContent value="ingestion" className="space-y-6 mt-4">
              <IngestionAnalyticsPanel data={ingestionData} onRetryJob={handleRetryJob} />
            </TabsContent>

            {/* TAB 2: Search Engine */}
            <TabsContent value="search" className="space-y-6 mt-4">
              <SearchAnalyticsPanel data={searchData} />
            </TabsContent>

            {/* TAB 3: RAG Assistant */}
            <TabsContent value="rag" className="space-y-6 mt-4">
              <RagAnalyticsPanel data={ragData} />
            </TabsContent>

            {/* TAB 4: Knowledge Graph */}
            <TabsContent value="graph" className="space-y-6 mt-4">
              <GraphAnalyticsPanel data={graphData} />
            </TabsContent>
          </Tabs>

          <ReviewerGuide />
        </div>
      </AdminAccessGuard>
    </AppLayout>
  );
}
