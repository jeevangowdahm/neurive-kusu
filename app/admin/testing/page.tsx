'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Shield, Play, Loader2, AlertTriangle, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/app-layout';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Reusable components
import { AdminAccessGuard } from '@/components/admin/AdminAccessGuard';
import { EvaluationBenchmarkPanel } from '@/components/admin/EvaluationBenchmarkPanel';
import { EvaluationQueryEditor } from '@/components/admin/EvaluationQueryEditor';
import { ReviewerGuide } from '@/components/admin/ReviewerGuide';

export default function AdminTestingPage() {
  const [loading, setLoading] = useState(true);
  const [runningTest, setRunningTest] = useState(false);

  // Benchmarking states
  const [queries, setQueries] = useState<any[]>([]);
  const [benchmarkResults, setBenchmarkResults] = useState<any[]>([]);
  const [aggregates, setAggregates] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Load testing dossier data
  const loadTestingData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/testing');
      const data = await res.json();
      if (data.success) {
        setQueries(data.queries || []);
        
        // If results exist in the database, calculate aggregates client-side
        if (data.results && data.results.length > 0) {
          setBenchmarkResults(data.results);
          computeAggregates(data.results);
        } else {
          // Trigger a silent mock execution to pre-populate charts if empty
          await runDefaultComparison(false);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load algorithm testing dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestingData();
  }, []);

  // Compute paradigm averages
  const computeAggregates = (detailedResults: any[]) => {
    const paradigms = ['Keyword Search', 'Semantic Search', 'Hybrid Search', 'Hybrid + Entity Boost'];
    const aggs = paradigms.map(pName => {
      const pMetrics = detailedResults.filter(r => r.search_method === pName);
      if (pMetrics.length === 0) return null;
      const avgP5 = pMetrics.reduce((sum, m) => sum + Number(m.precision_at_5), 0) / pMetrics.length;
      const avgR10 = pMetrics.reduce((sum, m) => sum + Number(m.recall_at_10), 0) / pMetrics.length;
      const avgMRR = pMetrics.reduce((sum, m) => sum + Number(m.mrr), 0) / pMetrics.length;
      const avgTime = pMetrics.reduce((sum, m) => sum + Number(m.response_time_ms), 0) / pMetrics.length;
      
      return {
        search_method: pName,
        precision_at_5: parseFloat(avgP5.toFixed(4)),
        recall_at_10: parseFloat(avgR10.toFixed(4)),
        mrr: parseFloat(avgMRR.toFixed(4)),
        response_time_ms: Math.round(avgTime),
        quality_score: Math.round((avgP5 * 0.4 + avgR10 * 0.3 + avgMRR * 0.3) * 100)
      };
    }).filter(Boolean);

    setAggregates(aggs as any[]);
  };

  // Run benchmark comparison POST trigger
  const handleRunBenchmark = async () => {
    setRunningTest(true);
    const toastId = toast.loading('Running algorithm comparison testing...');
    try {
      const res = await fetch('/api/admin/testing/run', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAggregates(data.aggregates || []);
        setBenchmarkResults(data.detailed || []);
        toast.success(`Benchmark complete! Executed comparison across ${queries.length} queries.`, { id: toastId });
        
        // Reload history
        const testRes = await fetch('/api/admin/testing');
        const testData = await testRes.json();
        if (testData.success && testData.results) {
          setBenchmarkResults(testData.results);
        }
      } else {
        throw new Error(data.error || 'Execution failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Testing pipeline execution timed out.', { id: toastId });
    } finally {
      setRunningTest(false);
    }
  };

  const runDefaultComparison = async (showToast = false) => {
    setRunningTest(true);
    let toastId;
    if (showToast) toastId = toast.loading('Invoking evaluation sandbox comparison...');
    try {
      const res = await fetch('/api/admin/testing/run', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAggregates(data.aggregates || []);
        setBenchmarkResults(data.detailed || []);
        if (showToast && toastId) {
          toast.success('Sandbox benchmark completed successfully!', { id: toastId });
        }
      }
    } catch (err) {
      if (showToast) toast.error('Failed to run mock test benchmark.');
    } finally {
      setRunningTest(false);
    }
  };

  // Register a new query
  const handleAddQuery = async (queryData: {
    query: string;
    expectedIds: string;
    category?: string;
    district?: string;
    language?: string;
  }) => {
    const toastId = toast.loading('Adding evaluation query to registry...');
    try {
      const expectedIds = queryData.expectedIds
        .split(',')
        .map(id => id.trim())
        .filter(Boolean);

      const { data, error } = await supabase
        .from('evaluation_queries')
        .insert([
          {
            query: queryData.query.trim(),
            expected_document_ids: expectedIds,
            category: queryData.category?.trim() || null,
            district: queryData.district?.trim() || null,
            language: queryData.language?.trim() || null
          }
        ])
        .select('*');

      if (error) throw error;

      toast.success('Evaluation query registered successfully!', { id: toastId });
      setQueries(prev => [data[0], ...prev]);
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to insert evaluation query.', { id: toastId });
    }
  };

  // Delete evaluation query
  const handleDeleteQuery = async (id: string) => {
    const toastId = toast.loading('Deleting query from dossier...');
    try {
      const { error } = await supabase
        .from('evaluation_queries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Query deleted successfully!', { id: toastId });
      setQueries(prev => prev.filter(q => q.id !== id));
      
      // Reset benchmark results for this query
      const remainingResults = benchmarkResults.filter(r => r.evaluation_query_id !== id);
      setBenchmarkResults(remainingResults);
      computeAggregates(remainingResults);
    } catch (err) {
      toast.error('Delete operation rejected by database RLS.', { id: toastId });
    }
  };

  if (loading && queries.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-slate-950 text-slate-400 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs font-mono">Loading evaluation sandbox workspace...</span>
        </div>
      </AppLayout>
    );
  }

  const isDemo = queries.some(q => String(q.id).startsWith('eq-')) || aggregates.length === 0;

  return (
    <AppLayout>
      <AdminAccessGuard>
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-sans bg-slate-950 text-slate-100 min-h-[calc(100vh-4rem)]">
          
          {/* Navigation Breadcrumbs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
            <div className="space-y-1">
              <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mb-1">
                <ArrowLeft className="h-4 w-4" />
                Return to Admin Console
              </Link>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-400 animate-pulse" />
                <h1 className="text-xl font-bold text-foreground font-serif">Algorithm Comparison & Evaluation Suite</h1>
                <Badge variant="secondary" className="text-[9px] bg-purple-500/10 text-purple-400">Testing Console</Badge>
              </div>
              <p className="text-xs text-slate-400">
                Compare Keyword, Semantic, Hybrid, and Entity-Boosted search paradigms on Precision@5, Recall@10, and Mean Reciprocal Rank (MRR) metrics.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 self-end sm:self-center">
              <Button 
                onClick={handleRunBenchmark} 
                disabled={runningTest}
                className="h-9 text-xs font-bold gap-1.5 bg-purple-600 hover:bg-purple-500 text-white shadow-md"
              >
                {runningTest ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running Benchmarks...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Comparison Benchmark
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Benchmarks Visualizations */}
          <EvaluationBenchmarkPanel 
            aggregates={aggregates} 
            runningTest={runningTest} 
            onRunBenchmark={handleRunBenchmark} 
            isDemo={isDemo} 
          />

          {/* Queries list editor & Explainer guide */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <EvaluationQueryEditor 
                queries={queries}
                onAddQuery={handleAddQuery}
                onDeleteQuery={handleDeleteQuery}
                showAddForm={showAddForm}
                onToggleAddForm={() => setShowAddForm(!showAddForm)}
              />
            </div>

            {/* Quick info explanation */}
            <div className="space-y-6">
              <Card className="border bg-slate-900/20 border-slate-900 p-4 select-none">
                <CardHeader className="p-0 pb-2">
                  <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1">
                    <Activity className="h-4 w-4 text-purple-400" />
                    Reviewer Quick Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 text-xs text-slate-400 space-y-3 leading-relaxed">
                  <p>
                    Neurive uses **hybrid query expansion** + **pgvector vector matching** to index Karnataka digitized scrolls.
                  </p>
                  <div>
                    <h4 className="font-bold text-slate-300 mb-0.5">Algorithms Compared:</h4>
                    <ul className="list-disc list-inside space-y-1 text-[11px]">
                      <li><strong className="text-slate-200">Keyword Search:</strong> GIN inverted index full-text search matching tokens.</li>
                      <li><strong className="text-slate-200">Semantic Search:</strong> 1536-dim vector cosine similarity.</li>
                      <li><strong className="text-slate-200">Hybrid Search:</strong> 60% semantic + 40% keyword scoring.</li>
                      <li><strong className="text-slate-200">Hybrid + Entity Boost:</strong> Weighted hybrid with additional confidence weights for matched NER entities.</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-300 mb-0.5">Key Evaluated Metrics:</h4>
                    <ul className="list-disc list-inside space-y-1 text-[11px]">
                      <li><strong className="text-slate-200">Precision@5:</strong> Proportion of top 5 results that are relevant (Explicitly: relevant retrieved in top 5 / 5).</li>
                      <li><strong className="text-slate-200">Recall@10:</strong> Proportion of all expected relevant results retrieved in top 10 (Explicitly: relevant retrieved in top 10 / total expected relevant documents).</li>
                      <li><strong className="text-slate-200">MRR (Mean Reciprocal Rank):</strong> Explicitly: 1 / rank of first relevant result, or 0 if none found.</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <ReviewerGuide />
        </div>
      </AdminAccessGuard>
    </AppLayout>
  );
}
