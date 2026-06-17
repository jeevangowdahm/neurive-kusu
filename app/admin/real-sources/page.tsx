'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Shield, ArrowLeft, RefreshCw, FileText, Download, CheckCircle, XCircle, AlertTriangle, Layers, FileDown, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { audioSynth } from '@/lib/audio';

export default function RealSourcesIngestion() {
  const router = useRouter();
  const { theme } = useTheme();
  const isSkeuomorphic = theme === 'skeuomorphic';

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [query, setQuery] = useState('Karnataka Gazette');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [ingestingId, setIngestingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const playSound = (type: 'click' | 'chime' | 'major') => {
    const soundPref = localStorage.getItem('neurive_sound_fx') === 'true';
    if (!soundPref) return;
    if (type === 'click') audioSynth.playTypewriterClick(false);
    else if (type === 'chime') audioSynth.playHologramChime(false);
    else if (type === 'major') audioSynth.playHologramChime(true);
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/admin/real-sources/logs');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch ingestion logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    setSearching(true);
    setFeedback(null);
    playSound('click');

    try {
      const res = await fetch(`/api/admin/real-sources/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.results || []);
        } else {
          setFeedback({ status: 'error', message: data.error || 'Failed to perform search.' });
        }
      } else {
        setFeedback({ status: 'error', message: 'Failed to communicate with search API.' });
      }
    } catch (err) {
      setFeedback({ status: 'error', message: 'Network error during public search.' });
    } finally {
      setSearching(false);
    }
  };

  const handleIngest = async (doc: any) => {
    setIngestingId(doc.source_identifier);
    setFeedback(null);
    playSound('major');

    try {
      const res = await fetch('/api/admin/real-sources/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: doc.title,
          source_type: doc.source_type,
          source_name: doc.source_name,
          source_url: doc.source_url,
          source_license: doc.source_license,
          source_reliability_score: doc.source_reliability_score,
          source_identifier: doc.source_identifier,
          source_attribution: doc.source_attribution,
          file_size_bytes: doc.file_size_bytes,
          description: doc.description,
          average_ocr_confidence: doc.average_ocr_confidence,
          is_demo: false
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          status: 'success',
          message: `Ingestion successful! Ingested as "${doc.title}". Relevance Score: ${data.relevance_score} (${data.relevance_status}).`
        });
        fetchLogs();
      } else {
        setFeedback({
          status: 'error',
          message: data.error || 'Ingestion failed.'
        });
      }
    } catch (err) {
      setFeedback({ status: 'error', message: 'Failed to request ingestion pipeline.' });
    } finally {
      setIngestingId(null);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user;
      if (!user) {
        setAuthorized(false);
        setLoading(false);
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }

      // Check admin
      supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          const role = profile?.role || 'guest';
          const email = user.email || '';
          const isSuperAdmin = ['jeevangowdahm6@gmail.com', 'jeevangowda082007@gmail.com', 'user@neurive.karnataka.gov.in'].includes(email);
          const isAdmin = role === 'admin' || isSuperAdmin;

          if (isAdmin) {
            setAuthorized(true);
            setLoading(false);
            handleSearch();
            fetchLogs();
          } else {
            setAuthorized(false);
            setLoading(false);
            setTimeout(() => router.push('/dashboard'), 2000);
          }
        });
    });
  }, [router]);

  const formatBytes = (bytes: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(1) + ' MB';
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'government_pdf': return <FileText className="h-4 w-4 text-emerald-500" />;
      case 'internet_archive': return <Layers className="h-4 w-4 text-purple-500" />;
      case 'wikisource': return <BookOpen className="h-4 w-4 text-blue-500" />;
      default: return <FileDown className="h-4 w-4 text-slate-500" />;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
          <div className="relative flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Search className="h-6 w-6 text-primary absolute animate-pulse" />
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Initializing Real Sources Gateway...</p>
        </div>
      </AppLayout>
    );
  }

  if (!authorized) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 max-w-md mx-auto min-h-[70vh] flex flex-col justify-center">
          <Card className="border-red-500/20 bg-red-950/5 backdrop-blur-md text-center">
            <CardContent className="p-8">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4 animate-bounce" />
              <h2 className="text-xl font-bold mb-2">Access Denied</h2>
              <p className="text-sm text-muted-foreground">Redirecting...</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-primary/20 hover:bg-primary/10"
              onClick={() => {
                playSound('click');
                router.push('/admin');
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Real Public Document Ingestion
              </h1>
              <p className="text-xs text-muted-foreground">Search and ingest free public documents from archives and portals into Neurive</p>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {feedback && (
          <div className={`p-4 rounded-lg border text-sm flex items-start gap-3 ${
            feedback.status === 'success' 
              ? 'bg-green-950/10 border-green-500/20 text-green-700 dark:text-green-400' 
              : 'bg-red-950/10 border-red-500/20 text-red-700 dark:text-red-400'
          }`}>
            {feedback.status === 'success' ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> : <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
            <div>
              <p className="font-bold">{feedback.status === 'success' ? 'Ingestion Command Registered' : 'Ingestion Command Blocked'}</p>
              <p className="text-xs mt-1 leading-normal">{feedback.message}</p>
            </div>
          </div>
        )}

        {/* Search Console Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Search Card */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Public Repository Search</CardTitle>
                <CardDescription className="text-xs">Query Internet Archive, Wikisource, or official GoK PDF registries</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter keywords e.g. Bangalore Gazetteer, Karnataka Gazette..."
                    className="text-xs h-9 flex-1"
                  />
                  <Button type="submit" size="sm" className="h-9 gap-1.5" disabled={searching}>
                    {searching ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                    Search
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Repository Search Results ({searchResults.length})</h3>
              {searching ? (
                <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-background/50 gap-3">
                  <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-xs text-muted-foreground animate-pulse">Querying public metadata databases...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-background/50">
                  <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium text-muted-foreground">No records matched your search query.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((doc, idx) => {
                    const isRejected = doc.karnataka_scope_status === 'rejected';
                    const isIngested = logs.some(l => l.source_identifier === doc.source_identifier && l.status === 'Completed');

                    return (
                      <Card key={idx} className={`border hover:shadow-md transition-shadow relative overflow-hidden ${
                        isRejected ? 'border-red-950/20 bg-red-950/5' : ''
                      }`}>
                        <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2">
                              <span className="shrink-0">{getSourceIcon(doc.source_type)}</span>
                              <h4 className="text-sm font-bold text-foreground truncate max-w-[450px]" title={doc.title}>{doc.title}</h4>
                              <Badge variant="outline" className="text-[10px] capitalize bg-muted/50">
                                {doc.source_type?.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{doc.description}</p>
                            
                            {/* Metadata links */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground font-mono">
                              <span>License: {doc.source_license}</span>
                              <span>Size: {formatBytes(doc.file_size_bytes)}</span>
                              <span>Source: <a href={doc.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{doc.source_name}</a></span>
                            </div>
                          </div>

                          {/* Relevance and Ingest actions */}
                          <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 gap-3">
                            <div className="text-left md:text-right">
                              <div className="flex items-center gap-1.5 justify-end">
                                <span className="text-[10px] text-muted-foreground">Relevance:</span>
                                <span className="text-xs font-black text-foreground">{Math.round(doc.karnataka_relevance_score * 100)}%</span>
                              </div>
                              <Badge className={`mt-1 text-[9px] uppercase ${
                                doc.karnataka_scope_status === 'verified' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300' 
                                  : doc.karnataka_scope_status === 'needs_review'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300'
                              }`}>
                                {doc.karnataka_scope_status?.replace('_', ' ')}
                              </Badge>
                            </div>

                            {/* Ingestion button */}
                            {isRejected ? (
                              <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold">
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                Ingestion Blocked
                              </div>
                            ) : isIngested ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 gap-1 text-[9px] h-6 py-0">
                                <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" /> Ingested
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                className="h-8 gap-1.5"
                                onClick={() => handleIngest(doc)}
                                disabled={ingestingId === doc.source_identifier}
                              >
                                {ingestingId === doc.source_identifier ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                                Ingest Archive
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Logs / Audit Trail */}
          <div className="space-y-4">
            <Card className="border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Ingestion Audit Trail</CardTitle>
                <CardDescription className="text-xs">Historical validation outcomes of repository syncs</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {logsLoading ? (
                  <div className="flex justify-center py-6">
                    <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                  </div>
                ) : logs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No historical sync logs found.</p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {logs.map((log) => (
                      <div key={log.id} className="p-2.5 rounded border text-[11px] space-y-1.5 bg-background/50">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-foreground truncate max-w-[150px]" title={log.title}>{log.title}</span>
                          <Badge className={`text-[8px] leading-none shrink-0 ${
                            log.status === 'Completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300' 
                              : 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300'
                          }`}>
                            {log.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground leading-normal">{log.reason}</p>
                        <div className="flex justify-between text-[9px] text-muted-foreground border-t pt-1 mt-1 font-mono">
                          <span>Relevance: {Math.round(Number(log.karnataka_relevance_score || 0.9) * 100)}%</span>
                          <span>{new Date(log.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
