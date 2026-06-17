'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Shield, ArrowLeft, RefreshCw, CheckCircle, XCircle, Globe, BookOpen, AlertTriangle, ArrowRight, Layers } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { audioSynth } from '@/lib/audio';

const WIKI_PRESETS = [
  { title: 'Hampi', desc: 'Capital ruins of the Vijayanagara Empire in central Karnataka.' },
  { title: 'Mysore Palace', desc: 'Indo-Saracenic royal palace of the Wadiyars in Mysuru.' },
  { title: 'Vijayanagara Empire', desc: 'South Indian empire centered in Vijayanagara (Hampi).' },
  { title: 'Karnataka', desc: 'Comprehensive state history, geography, and Ekikarana movement.' },
  { title: 'Kannada literature', desc: 'Chronology of classical works like Kavirajamarga.' },
  { title: 'Quantum Physics', desc: 'Fundamental subatomic physics article (Should fail relevance validation).' }
];

export default function WikipediaIngest() {
  const router = useRouter();
  const { theme } = useTheme();
  const isSkeuomorphic = theme === 'skeuomorphic';

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [query, setQuery] = useState('Mysuru Palace');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [ingestingTitle, setIngestingTitle] = useState<string | null>(null);
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
      const { data, error } = await supabase
        .from('wikipedia_ingestion_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error && data) setLogs(data);
    } catch (err) {
      console.error('Failed to fetch wiki ingestion logs:', err);
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
      const res = await fetch(`/api/admin/wikipedia-ingest?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.results || []);
        } else {
          setFeedback({ status: 'error', message: data.error || 'Failed to search Wikipedia.' });
        }
      } else {
        setFeedback({ status: 'error', message: 'Failed to communicate with Wikipedia API.' });
      }
    } catch (err) {
      setFeedback({ status: 'error', message: 'Network error searching Wikipedia.' });
    } finally {
      setSearching(false);
    }
  };

  const handleIngest = async (title: string, pageid?: string) => {
    setIngestingTitle(title);
    setFeedback(null);
    playSound('major');

    try {
      const res = await fetch('/api/admin/wikipedia-ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          wikipedia_page_id: pageid || title.toLowerCase().replace(/ /g, '_')
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          status: 'success',
          message: `Ingestion successful! Ingested Wikipedia article "${title}" containing ${data.sections_count} sections. Relevance score: ${data.relevance_score} (${data.relevance_status}).`
        });
        fetchLogs();
      } else {
        setFeedback({
          status: 'error',
          message: data.error || 'Failed to ingest Wikipedia article.'
        });
      }
    } catch (err) {
      setFeedback({ status: 'error', message: 'Network error during ingestion request.' });
    } finally {
      setIngestingTitle(null);
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

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
          <div className="relative flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Globe className="h-6 w-6 text-primary absolute animate-pulse" />
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Initializing Wikipedia Ingestion Bridge...</p>
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
                <Globe className="h-5 w-5 text-primary" />
                Wikipedia Public Ingestion
              </h1>
              <p className="text-xs text-muted-foreground">Search and ingest public Wikipedia articles into document chapters and vector indexes</p>
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
              <p className="font-bold">{feedback.status === 'success' ? 'Ingestion Complete' : 'Ingestion Refused'}</p>
              <p className="text-xs mt-1 leading-normal">{feedback.message}</p>
            </div>
          </div>
        )}

        {/* Wikipedia Preset Triggers */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 mb-3">Quick Presets</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {WIKI_PRESETS.map((preset) => (
              <Card key={preset.title} className="hover:border-primary/50 transition-colors cursor-pointer group flex flex-col justify-between" onClick={() => {
                if (ingestingTitle !== preset.title) {
                  setQuery(preset.title);
                  handleIngest(preset.title);
                }
              }}>
                <CardContent className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold group-hover:text-primary transition-colors truncate">{preset.title}</h4>
                    <p className="text-[10px] text-muted-foreground line-clamp-3 leading-normal mt-1">{preset.desc}</p>
                  </div>
                  <div className="flex justify-end pt-2 text-[10px] text-primary font-bold gap-1 items-center">
                    Ingest
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Search & Ingestion Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Search Panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Search Wikipedia</CardTitle>
                <CardDescription className="text-xs">Query English Wikipedia API and preview Karnataka relevance scoring</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter Wikipedia page name..."
                    className="text-xs h-9 flex-1"
                  />
                  <Button type="submit" size="sm" className="h-9 gap-1.5" disabled={searching}>
                    {searching ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                    Search
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Results list */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Wikipedia Search Results ({searchResults.length})</h3>
              {searching ? (
                <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-background/50 gap-3">
                  <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-xs text-muted-foreground animate-pulse">Connecting to Wikipedia servers...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-background/50">
                  <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium text-muted-foreground">No Wikipedia articles found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((doc, idx) => {
                    const isRejected = doc.karnataka_scope_status === 'rejected';
                    const isIngested = logs.some(l => l.title === doc.title && l.status === 'Completed');

                    return (
                      <Card key={idx} className={`border hover:shadow-md transition-shadow relative overflow-hidden ${
                        isRejected ? 'border-red-950/20 bg-red-950/5' : ''
                      }`}>
                        <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2">
                              <Globe className="h-4 w-4 text-blue-400" />
                              <h4 className="text-sm font-bold text-foreground truncate max-w-[450px]">{doc.title}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{doc.snippet}</p>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline font-mono">
                              {doc.url}
                            </a>
                          </div>

                          {/* Actions */}
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
                                Rejected (Non-Karnataka)
                              </div>
                            ) : isIngested ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 gap-1 text-[9px] h-6 py-0">
                                <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" /> Ingested
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                className="h-8 gap-1.5"
                                onClick={() => handleIngest(doc.title, doc.pageid)}
                                disabled={ingestingTitle === doc.title}
                              >
                                {ingestingTitle === doc.title ? <RefreshCw className="h-3 w-3 animate-spin" /> : <BookOpen className="h-3 w-3" />}
                                Ingest Pages
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

          {/* Logs */}
          <div className="space-y-4">
            <Card className="border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Wikipedia Sync Log</CardTitle>
                <CardDescription className="text-xs">Audit details of recent Wikipedia parsing</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {logsLoading ? (
                  <div className="flex justify-center py-6">
                    <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                  </div>
                ) : logs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No Wikipedia ingestion logged.</p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {logs.map((log) => (
                      <div key={log.id} className="p-2.5 rounded border text-[11px] space-y-1.5 bg-background/50">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-foreground truncate max-w-[150px]">{log.title}</span>
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
                          <span>Score: {Math.round(Number(log.karnataka_relevance_score || 0.9) * 100)}%</span>
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
