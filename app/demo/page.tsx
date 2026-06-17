'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ArrowRight, Play, Upload, Search, BarChart3, Database, 
  MessageSquare, Compass, Shield, Award, Sparkles, RefreshCw, Trash2, CheckCircle2, ChevronRight, Activity, BookOpen, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/app-layout';
import { toast } from 'sonner';
import Link from 'next/link';

// Reviewer guide floating button
import { ReviewerGuide } from '@/components/admin/ReviewerGuide';

interface DemoStep {
  title: string;
  explanation: string;
  actionText: string;
  actionHref: string;
  reviewerNote: string;
  previewType: string;
}

export default function GuidedDemoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // Auth check for seed/cleanup cockpit
  useEffect(() => {
    async function checkUserAdmin() {
      try {
        const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
        if (user) {
          const { data: profile } = await import('@/lib/supabase').then(m => m.supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()
          );
          const isSuperAdmin = ['jeevangowdahm6@gmail.com', 'jeevangowda082007@gmail.com', 'user@neurive.karnataka.gov.in'].includes(user.email || '');
          if (profile?.role === 'admin' || isSuperAdmin) {
            setIsAdmin(true);
          }
        }
      } catch {}
    }
    checkUserAdmin();
  }, []);

  const handleSeedData = async () => {
    setLoadingAction(true);
    const toastId = toast.loading('Seeding stable demo Karnataka documents...');
    try {
      const res = await fetch('/api/admin/demo-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Idempotent seed complete. Chunks, pages, and entities generated.', { id: toastId });
      } else {
        toast.error(data.error || 'Failed to seed data', { id: toastId });
      }
    } catch {
      toast.error('Connection timed out.', { id: toastId });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCleanupData = async () => {
    setLoadingAction(true);
    const toastId = toast.loading('Purging demo archives...');
    try {
      const res = await fetch('/api/admin/demo-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup' })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Scrubbed demo rows successfully. Production records untouched.', { id: toastId });
      } else {
        toast.error(data.error || 'Failed to purge data', { id: toastId });
      }
    } catch {
      toast.error('Purge request timed out.', { id: toastId });
    } finally {
      setLoadingAction(false);
    }
  };

  const demoSteps: DemoStep[] = [
    {
      title: 'Step 1: Upload Archival Document',
      explanation: 'Access the ingestion desk where users submit historical files (e.g. land surveys, gazettes, photos) specifying regional district, era year, and permissions visibility.',
      actionText: 'Go to Upload Portal',
      actionHref: '/upload',
      reviewerNote: 'Explain that uploaded files are placed in Supabase storage and a Pending job record is registered to coordinate the OCR and embedding state machines.',
      previewType: 'upload'
    },
    {
      title: 'Step 2: watch Ingestion Pipeline',
      explanation: 'View the live telemetry terminal logs where Neurive executes bilingual OCR scanning, layouts recognition, Named Entity Extraction (NER), and vector embeddings.',
      actionText: 'View Ingestion Terminal',
      actionHref: '/upload',
      reviewerNote: 'Point out that layout recognition extracts both Kannada and English characters, preserving original text while generating summaries in the background.',
      previewType: 'ingestion'
    },
    {
      title: 'Step 3: Search using Hybrid Search',
      explanation: 'Perform semantic search Queries that understand intent (in English and Kannada) combined with GIN-backed inverted keyword matching.',
      actionText: 'Try Hybrid Search',
      actionHref: '/search',
      reviewerNote: 'Highlight that the search algorithm normalizes Kannada spellings and executes an RPC function combining dense vector scores (60%) and sparse BM25 keyword matching (40%).',
      previewType: 'search'
    },
    {
      title: 'Step 4: Open Explainable Result',
      explanation: 'Inspect how the system arrived at a specific search result. Click the metrics indicators to show the exact weighted scoring breakdown.',
      actionText: 'Open Search Console',
      actionHref: '/search',
      reviewerNote: 'Demonstrate explainability charts. Reviewers will appreciate knowing that the final score is mathematically calculated (Semantic similarity + Full Text + Entity presence).',
      previewType: 'explainable'
    },
    {
      title: 'Step 5: Ask RAG Chatbot',
      explanation: 'Engage with the Conversational Chat Assistant. Ask queries about Mysore kings, Hampi, or land laws and get answers bound to document context.',
      actionText: 'Go to Chat Assistant',
      actionHref: '/chat',
      reviewerNote: 'Explain that the chatbot enforces grounding thresholds: if relevance similarity of search context falls below 20%, it refuses to answer to mitigate LLM hallucinations.',
      previewType: 'rag'
    },
    {
      title: 'Step 6: View Citations & Grounding',
      explanation: 'Examine inline citation tags generated beside chat replies, linking text fragments directly back to original archival page numbers.',
      actionText: 'Inspect Chat Citation',
      actionHref: '/chat',
      reviewerNote: 'Citations are not simple string matches. They represent cosine similarity linkages to pgvector document chunks, providing auditable source transparency.',
      previewType: 'citations'
    },
    {
      title: 'Step 7: Open Advanced Document Viewer',
      explanation: 'Double-screen viewer presenting PDF previews, paginated OCR transcripts, highlighted text matching, and private research note managers.',
      actionText: 'Go to Document Vault',
      actionHref: '/documents',
      reviewerNote: 'Show off the dual-screen split interface. Emphasize that PDF downloads are secured behind 1-hour signed URLs generated after checking backend permissions.',
      previewType: 'viewer'
    },
    {
      title: 'Step 8: Explore Knowledge Graph',
      explanation: 'An interactive force-directed relation map charting nodes of royal families, locations, and treaty events linked to evidence snippets.',
      actionText: 'Explore Knowledge Graph',
      actionHref: '/knowledge-graph',
      reviewerNote: 'Point out that the HTML5 Canvas handles up to 500 nodes smoothly. Source-target constraints prevent duplicate edges, and RLS hides restricted edges from guests.',
      previewType: 'graph'
    },
    {
      title: 'Step 9: Browse District & Category Explorer',
      explanation: 'Navigate regional scrolls geographically. Browse the clickable divisions cockpit map and explore categorized dossiers.',
      actionText: 'Browse Districts Map',
      actionHref: '/districts',
      reviewerNote: 'Point out that district statistics are dynamically aggregated from allowed documents. Normalizes historical names (e.g. Mysuru / Mysore) during processing.',
      previewType: 'explorer'
    },
    {
      title: 'Step 10: Show Admin Analytics & Benchmarks',
      explanation: 'Audit global document metrics, failed ingestion queues, search logs telemetry, and run comparative precision benchmarks on search algorithms.',
      actionText: 'Go to Admin Console',
      actionHref: '/admin',
      reviewerNote: 'Show the algorithm performance ledger. Point out the MRR, Precision@5, and Recall@10 comparisons that prove mathematically that Hybrid search beats simple Keyword search.',
      previewType: 'admin'
    }
  ];

  const activeStep = demoSteps[currentStep];

  const handleNext = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 font-sans bg-slate-950 text-slate-100 min-h-[calc(100vh-4rem)] relative pb-20">
        
        {/* Title cockpit banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
          <div className="space-y-1">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mb-1">
              <ArrowLeft className="h-4 w-4" />
              Return to Landing Page
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <h1 className="text-xl font-bold text-foreground font-serif">Guided Reviewer Demonstration Flow</h1>
              <Badge className="text-[9px] bg-purple-500/10 text-purple-400 border-purple-500/20">Step {currentStep + 1} of 10</Badge>
            </div>
            <p className="text-xs text-slate-400">
              A structured presentation guide to walk academic examiners and project reviewers through Neurive's engineering features.
            </p>
          </div>

          {/* Admin seed control */}
          {isAdmin && (
            <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg flex items-center gap-2 shrink-0">
              <span className="text-[9px] font-mono text-slate-500 uppercase block mr-1">Demo Seeder</span>
              <Button 
                onClick={handleSeedData} 
                disabled={loadingAction}
                variant="outline" 
                size="sm" 
                className="h-7 text-[10px] px-2.5 bg-purple-950/20 text-purple-400 hover:bg-purple-950/40 border-purple-900/50 gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${loadingAction ? 'animate-spin' : ''}`} />
                Seed Demo Records
              </Button>
              <Button 
                onClick={handleCleanupData} 
                disabled={loadingAction}
                variant="outline" 
                size="sm" 
                className="h-7 text-[10px] px-2.5 bg-rose-950/20 text-rose-400 hover:bg-rose-950/40 border-rose-900/50 gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Scrub Demo Data
              </Button>
            </div>
          )}
        </div>

        {/* Presentation Split Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Interactive guide console (Col-5) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border bg-slate-900/30 border-slate-900 p-5 relative shadow-xl backdrop-blur-md">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-purple-500" />
              
              <div className="space-y-4 select-none">
                <span className="text-[9.5px] font-mono font-bold text-purple-400 uppercase tracking-widest block">Slide Navigation Deck</span>
                
                <h2 className="text-lg font-bold text-slate-100 font-serif leading-tight">
                  {activeStep.title}
                </h2>
                
                <p className="text-xs text-slate-400 leading-relaxed">
                  {activeStep.explanation}
                </p>

                <div className="pt-2">
                  <Button asChild className="text-xs h-9 bg-purple-600 hover:bg-purple-500 text-white font-bold gap-1.5 w-full shadow-md">
                    <Link href={activeStep.actionHref} target="_blank">
                      <Play className="h-3.5 w-3.5" />
                      {activeStep.actionText}
                      <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>

            {/* What to tell reviewers note card */}
            <Card className="border bg-purple-950/5 border-purple-500/10 p-5 relative shadow-sm">
              <CardHeader className="p-0 pb-2 flex flex-row items-center gap-1.5 select-none">
                <HelpCircle className="h-4 w-4 text-purple-400 shrink-0" />
                <CardTitle className="text-xs font-bold text-purple-300 font-mono uppercase tracking-wider">
                  What to Tell Reviewers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 text-xs text-slate-300 leading-relaxed select-text font-sans">
                {activeStep.reviewerNote}
              </CardContent>
            </Card>

            {/* Stepper progress controls */}
            <div className="flex items-center justify-between select-none">
              <Button 
                onClick={handlePrev} 
                disabled={currentStep === 0}
                variant="outline" 
                size="sm" 
                className="h-9 text-xs border-slate-800 text-slate-400 font-bold gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Previous Step
              </Button>

              <span className="text-[10px] font-mono text-slate-500">
                {currentStep + 1} / 10
              </span>

              <Button 
                onClick={handleNext} 
                disabled={currentStep === demoSteps.length - 1}
                variant="outline" 
                size="sm" 
                className="h-9 text-xs border-slate-800 text-slate-300 font-bold gap-1 hover:bg-slate-900"
              >
                Next Step
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Right: Premium Screenshot-style UI Preview (Col-7) */}
          <div className="lg:col-span-7">
            <Card className="border bg-slate-950 border-slate-900 overflow-hidden shadow-2xl relative">
              <div className="bg-slate-900 px-4 py-2 border-b border-slate-900 flex items-center justify-between select-none shrink-0">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                </div>
                <span className="text-[9px] font-mono text-slate-500">neurive.karnataka.gov.in/portal-preview</span>
              </div>
              <CardContent className="p-0 min-h-[380px] bg-slate-950 flex items-center justify-center relative select-none">
                
                {/* PREVIEW: UPLOAD */}
                {activeStep.previewType === 'upload' && (
                  <div className="p-8 w-full max-w-sm space-y-4">
                    <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center space-y-2 bg-slate-900/10">
                      <Upload className="h-10 w-10 text-primary mx-auto opacity-75" />
                      <p className="text-xs text-slate-300 font-semibold">Drop historical file (.pdf, .tiff)</p>
                      <p className="text-[10px] text-slate-500">Bilingual OCR scanner will trigger automatically</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-slate-900/40 p-2 rounded border border-slate-900 text-slate-400">
                        District: <strong className="text-slate-200 block mt-0.5">Mysuru</strong>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded border border-slate-900 text-slate-400">
                        Visibility: <strong className="text-slate-200 block mt-0.5">Public Access</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* PREVIEW: INGESTION */}
                {activeStep.previewType === 'ingestion' && (
                  <div className="p-6 w-full font-mono text-[10px] space-y-3">
                    <div className="bg-black/80 p-4 rounded-lg border border-slate-900 text-emerald-400 space-y-1 max-h-[220px] overflow-y-auto">
                      <p>[SYSTEM] Initializing OCR text scanning model...</p>
                      <p>[SCAN] Deciphering Kannada script content: ಮೈಸೂರು ಮಹಾರಾಜ ಕೊಡುಗೆ...</p>
                      <p>[SCAN] Layout match confidence: 94.2%</p>
                      <p>[NER] Extracting entities: Mysore (place), Wadiyar (person), 1895 (date)</p>
                      <p>[RAG] Generating 1536-dimensional OpenAI embeddings...</p>
                      <p className="animate-pulse">[SYSTEM] Syncing records to main search ledger...</p>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded border border-slate-900 text-slate-400">
                      <span>Job status: <strong className="text-emerald-400">OCR Processing</strong></span>
                      <span>Progress: <strong className="text-primary">60%</strong></span>
                    </div>
                  </div>
                )}

                {/* PREVIEW: SEARCH */}
                {activeStep.previewType === 'search' && (
                  <div className="p-8 w-full max-w-sm space-y-4">
                    <div className="flex gap-1.5 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                      <input 
                        type="text" 
                        readOnly 
                        value="Mysuru Wodeyar land grants"
                        className="bg-transparent text-xs text-slate-300 outline-none flex-1 px-2.5" 
                      />
                      <Button size="sm" className="h-7 text-[10px] font-bold bg-primary text-white">Search</Button>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-slate-900/30 p-2.5 rounded border border-slate-900">
                        <span className="text-[9px] text-slate-500 font-mono block">LAND RECORDS · MYSURU · 1895</span>
                        <strong className="text-xs text-slate-200 block">Palace Revenue settlement Deeds</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* PREVIEW: EXPLAINABLE */}
                {activeStep.previewType === 'explainable' && (
                  <div className="p-6 w-full max-w-sm space-y-3">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Explainable Score Card</span>
                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900 space-y-2.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Overall Match Score</span>
                        <strong className="text-emerald-400 font-mono">0.8645 / 1.0000</strong>
                      </div>
                      <div className="space-y-1.5 pt-1.5 border-t border-slate-900">
                        <div className="flex justify-between text-[9px] text-slate-500">
                          <span>Semantic similarity (40%)</span>
                          <span>0.92</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-500">
                          <span>Keyword Token Match (30%)</span>
                          <span>0.78</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PREVIEW: RAG */}
                {activeStep.previewType === 'rag' && (
                  <div className="p-6 w-full font-sans text-xs space-y-4 max-w-md">
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 text-slate-300 self-end max-w-[80%] ml-auto text-[11px]">
                      Who was the King of Mysore in 1895?
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-900 text-slate-300 max-w-[85%] space-y-1.5 text-[11px]">
                      <p>
                        Maharaja **Chamarajendra Wadiyar X** ruled the Kingdom of Mysore in 1895. According to Amba Vilas Palace administrative records, his reign supervised extensive land revenue settlement surveys.
                      </p>
                      <span className="text-[9px] font-mono text-purple-400 block">[Source: Palace Order Book 1895, p. 4]</span>
                    </div>
                  </div>
                )}

                {/* PREVIEW: CITATIONS */}
                {activeStep.previewType === 'citations' && (
                  <div className="p-6 w-full max-w-sm space-y-3">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Evidence context Grounding Ledger</span>
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <strong className="text-slate-300 truncate max-w-[200px]">Palace Order Book 1895</strong>
                        <Badge variant="outline" className="text-[9px] border-slate-800 text-slate-500">Page 4</Badge>
                      </div>
                      <p className="text-[10px] text-slate-400 italic font-mono bg-slate-950 p-2 rounded border border-slate-900">
                        "...Wadiyar X, Maharaja of Mysore, issued royal proclamation for land records audit..."
                      </p>
                    </div>
                  </div>
                )}

                {/* PREVIEW: VIEWER */}
                {activeStep.previewType === 'viewer' && (
                  <div className="p-4 w-full grid grid-cols-2 gap-3">
                    <div className="border border-slate-800 bg-slate-900/20 rounded-lg p-6 text-center flex flex-col justify-center items-center gap-2 h-44">
                      <Database className="h-8 w-8 text-primary opacity-60" />
                      <span className="text-[10px] text-slate-400 font-mono">PDF Scroll view</span>
                    </div>
                    <div className="border border-slate-800 bg-slate-900/20 rounded-lg p-4 space-y-2 h-44 overflow-y-auto">
                      <span className="text-[9px] font-bold font-mono text-primary uppercase block">OCR Transcription</span>
                      <p className="text-[10px] text-slate-400 leading-normal font-mono select-text">
                        Mysore Royal Land Revenue Settlement Deed, dated 15th January 1891...
                      </p>
                    </div>
                  </div>
                )}

                {/* PREVIEW: GRAPH */}
                {activeStep.previewType === 'graph' && (
                  <div className="p-6 w-full flex flex-col items-center justify-center gap-4">
                    <div className="h-32 w-32 rounded-full border border-dashed border-pink-500/30 flex items-center justify-center relative animate-spin [animation-duration:15s]">
                      <div className="absolute top-0 h-3 w-3 bg-pink-500 rounded-full" />
                      <div className="absolute bottom-4 left-0 h-3.5 w-3.5 bg-blue-500 rounded-full" />
                      <div className="absolute right-2 top-4 h-3 w-3 bg-emerald-500 rounded-full" />
                    </div>
                    <div className="text-center space-y-1">
                      <span className="text-xs text-slate-300 font-semibold font-serif">Tipu Sultan &harr; Srirangapatna</span>
                      <p className="text-[10px] text-slate-500 font-mono">Semantic link strength: 90% (Mentioned on Page 1)</p>
                    </div>
                  </div>
                )}

                {/* PREVIEW: EXPLORER */}
                {activeStep.previewType === 'explorer' && (
                  <div className="p-6 w-full max-w-sm grid grid-cols-2 gap-3 select-none">
                    <div className="border border-slate-800 bg-slate-900/10 rounded-lg p-3 space-y-2 text-left">
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px]">District</Badge>
                      <strong className="text-xs text-slate-200 block leading-tight">Mysuru</strong>
                      <span className="text-[9px] text-slate-500 font-mono block">62,410 records</span>
                    </div>
                    <div className="border border-slate-800 bg-slate-900/10 rounded-lg p-3 space-y-2 text-left">
                      <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px]">Category</Badge>
                      <strong className="text-xs text-slate-200 block leading-tight">Land Records</strong>
                      <span className="text-[9px] text-slate-500 font-mono block">954 records</span>
                    </div>
                  </div>
                )}

                {/* PREVIEW: ADMIN */}
                {activeStep.previewType === 'admin' && (
                  <div className="p-6 w-full max-w-sm space-y-3 font-mono text-[10px]">
                    <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-900">
                      <span className="text-slate-400">Search Paradigm</span>
                      <span className="text-slate-400">Precision @ 5</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Keyword Search</span>
                      <span>58.0%</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Semantic Search</span>
                      <span>73.0%</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Hybrid Search</span>
                      <span>84.0%</span>
                    </div>
                    <div className="flex justify-between text-primary font-bold">
                      <span>Hybrid + Entity Boost</span>
                      <span>93.0%</span>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          </div>

        </div>

        {/* Floating Guide modal link */}
        <ReviewerGuide />

      </div>
    </AppLayout>
  );
}
