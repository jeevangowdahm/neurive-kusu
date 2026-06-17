'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, ArrowRight, Database, Map, FileText, BookOpen, 
  Sparkles, Upload, MessageSquare, Shield, Activity, Network, Landmark, Cpu, ArrowUpRight, Award, BarChart3, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 lg:pb-0">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 border-b border-slate-900">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/20 backdrop-blur px-4 py-1.5 mb-2 select-none">
              <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
              <span className="text-xs font-semibold text-purple-300">AI-Powered Karnataka Digital Archive Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight font-serif max-w-4xl mx-auto leading-tight">
              Deciphering Karnataka's Heritage With Neural Intelligence
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Neurive digitizes, OCRs, and semantic-indexes Karnataka historical archives, scrolls, and land revenue deeds using pgvector and bilingual grounding LLMs.
            </p>

            {/* Quick Action Navigation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto pt-6 select-none">
              <Link href="/demo" className="group">
                <Card className="border border-purple-500/20 bg-purple-950/5 hover:bg-purple-950/15 transition-all p-3 text-center rounded-xl h-full flex flex-col justify-center items-center gap-1.5 shadow-lg">
                  <Award className="h-5 w-5 text-purple-400 group-hover:scale-105 transition-transform" />
                  <strong className="text-xs text-purple-200 block">Guided Demo</strong>
                  <span className="text-[9px] text-slate-500 block">Reviewer Slide Deck</span>
                </Card>
              </Link>

              <Link href="/search" className="group">
                <Card className="border border-slate-800 bg-slate-900/10 hover:bg-slate-900/20 transition-all p-3 text-center rounded-xl h-full flex flex-col justify-center items-center gap-1.5">
                  <Search className="h-5 w-5 text-blue-400 group-hover:scale-105 transition-transform" />
                  <strong className="text-xs text-slate-200 block">Hybrid Search</strong>
                  <span className="text-[9px] text-slate-500 block">Dense & Sparse Query</span>
                </Card>
              </Link>

              <Link href="/upload" className="group">
                <Card className="border border-slate-800 bg-slate-900/10 hover:bg-slate-900/20 transition-all p-3 text-center rounded-xl h-full flex flex-col justify-center items-center gap-1.5">
                  <Upload className="h-5 w-5 text-emerald-400 group-hover:scale-105 transition-transform" />
                  <strong className="text-xs text-slate-200 block">Ingestion Desk</strong>
                  <span className="text-[9px] text-slate-500 block">Upload Scrolls & PDF</span>
                </Card>
              </Link>

              <Link href="/districts" className="group">
                <Card className="border border-slate-800 bg-slate-900/10 hover:bg-slate-900/20 transition-all p-3 text-center rounded-xl h-full flex flex-col justify-center items-center gap-1.5">
                  <Map className="h-5 w-5 text-amber-400 group-hover:scale-105 transition-transform" />
                  <strong className="text-xs text-slate-200 block">Districts Explorer</strong>
                  <span className="text-[9px] text-slate-500 block">Geographical Dossiers</span>
                </Card>
              </Link>

              <Link href="/admin/analytics" className="group">
                <Card className="border border-slate-800 bg-slate-900/10 hover:bg-slate-900/20 transition-all p-3 text-center rounded-xl h-full flex flex-col justify-center items-center gap-1.5">
                  <BarChart3 className="h-5 w-5 text-rose-400 group-hover:scale-105 transition-transform" />
                  <strong className="text-xs text-slate-200 block">Admin Analytics</strong>
                  <span className="text-[9px] text-slate-500 block">Telemetry Benchmarks</span>
                </Card>
              </Link>
            </div>

            <div className="pt-6 flex justify-center gap-3">
              <Button asChild size="lg" className="bg-primary text-white hover:bg-primary/90 rounded-xl px-8 font-bold text-sm">
                <Link href="/demo">
                  Start Academic Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-slate-800 text-slate-300 hover:bg-slate-900 rounded-xl px-8 font-bold text-sm">
                <Link href="/auth/login">
                  Officer Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement & Impact */}
      <section className="py-20 border-b border-slate-900 relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-4">
              <span className="text-[9.5px] font-mono font-bold text-primary uppercase block tracking-wider">The Challenge</span>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-100">
                Rescuing Cursive Scrolls from Dust & Decay
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Karnataka State archives house millions of historical pages (in old Kannada, Persian, and English cursive). Conventional indexing methods fail to handle spelling variations, damage, or handwritten scripts, making manual searches slow and difficult.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Neurive solves this by running bilingual layout segmentation models and mapping transcripts into a vector database for instant access.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="border border-slate-900 bg-slate-900/10 p-5 rounded-xl">
                <strong className="text-3xl font-extrabold text-primary font-serif block">2M+</strong>
                <span className="text-[10px] text-slate-500 uppercase font-mono block mt-1">Expected Scrolls Indexed</span>
              </Card>
              <Card className="border border-slate-900 bg-slate-900/10 p-5 rounded-xl">
                <strong className="text-3xl font-extrabold text-purple-400 font-serif block">&lt; 50ms</strong>
                <span className="text-[10px] text-slate-500 uppercase font-mono block mt-1">Average Query Speed</span>
              </Card>
              <Card className="border border-slate-900 bg-slate-900/10 p-5 rounded-xl">
                <strong className="text-3xl font-extrabold text-emerald-400 font-serif block">93%</strong>
                <span className="text-[10px] text-slate-500 uppercase font-mono block mt-1">OCR Layout Confidence</span>
              </Card>
              <Card className="border border-slate-900 bg-slate-900/10 p-5 rounded-xl">
                <strong className="text-3xl font-extrabold text-amber-400 font-serif block">31</strong>
                <span className="text-[10px] text-slate-500 uppercase font-mono block mt-1">Districts Dossiers Mapped</span>
              </Card>
            </div>

          </div>
        </div>
      </section>

      {/* AI Ingestion Workflow Diagram */}
      <section className="py-20 border-b border-slate-900 bg-slate-950/20 select-none">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-12">
          
          <div className="space-y-2">
            <span className="text-[9.5px] font-mono font-bold text-primary uppercase block tracking-wider font-serif">Workflow Pipeline</span>
            <h2 className="text-2xl font-bold text-slate-100 font-serif">AI-Powered Archiving Architecture</h2>
            <p className="text-xs text-slate-500 max-w-xl mx-auto">
              How Neurive processes raw uploaded scrolls into explainable search results and RAG chatbots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            
            <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl space-y-2">
              <Upload className="h-6 w-6 text-primary mx-auto" />
              <strong className="text-xs text-slate-200 block">1. Upload Scroll</strong>
              <p className="text-[10px] text-slate-500">PDF/TIFF file registered in vault</p>
            </div>

            <ChevronRight className="h-5 w-5 text-slate-800 mx-auto hidden md:block" />

            <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl space-y-2">
              <Cpu className="h-6 w-6 text-purple-400 mx-auto" />
              <strong className="text-xs text-slate-200 block">2. Ingest & OCR</strong>
              <p className="text-[10px] text-slate-500">Bilingual layout text parsing</p>
            </div>

            <ChevronRight className="h-5 w-5 text-slate-800 mx-auto hidden md:block" />

            <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl space-y-2">
              <Database className="h-6 w-6 text-emerald-400 mx-auto" />
              <strong className="text-xs text-slate-200 block">3. Vector Sync</strong>
              <p className="text-[10px] text-slate-500">1536-dim embeddings stored</p>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-20 border-b border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          
          <div className="text-center space-y-2 select-none">
            <span className="text-[9.5px] font-mono font-bold text-primary uppercase block tracking-wider">Features Grid</span>
            <h2 className="text-2xl font-bold text-slate-100 font-serif">Archival Exploration Cockpits</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
            
            <Card className="border border-slate-900 bg-slate-900/10 p-5 rounded-xl hover:border-slate-800 transition-colors">
              <Search className="h-7 w-7 text-blue-400 mb-3" />
              <h3 className="text-sm font-bold text-slate-200 font-serif">Explainable Hybrid Search</h3>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Retrieve matches combining vector closeness with keywords. Breakdowns explain exactly why records were returned.
              </p>
            </Card>

            <Card className="border border-slate-900 bg-slate-900/10 p-5 rounded-xl hover:border-slate-800 transition-colors">
              <MessageSquare className="h-7 w-7 text-purple-400 mb-3" />
              <h3 className="text-sm font-bold text-slate-200 font-serif">Conversational RAG Chat</h3>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Interact with the AI assistant. Ask questions and get replies containing citation tags directly referencing the archive catalog.
              </p>
            </Card>

            <Card className="border border-slate-900 bg-slate-900/10 p-5 rounded-xl hover:border-slate-800 transition-colors">
              <Network className="h-7 w-7 text-pink-400 mb-3" />
              <h3 className="text-sm font-bold text-slate-200 font-serif">Knowledge Graph</h3>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Explore relationships between royal decrees, places, and historical events. Track connections across eras chronologically.
              </p>
            </Card>

          </div>
        </div>
      </section>

      {/* Tech Stack Specs */}
      <section className="py-20 border-b border-slate-900 bg-slate-950/20 select-none">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-8">
          
          <div className="space-y-1">
            <span className="text-[9.5px] font-mono font-bold text-primary uppercase block tracking-wider">Specifications</span>
            <h2 className="text-xl font-bold text-slate-100 font-serif">Platform Technologies</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-2 text-[10.5px] font-mono text-slate-400">
            <span className="bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-lg">Next.js 13.5</span>
            <span className="bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-lg">React</span>
            <span className="bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-lg">Tailwind CSS</span>
            <span className="bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-lg">Supabase DB</span>
            <span className="bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-lg">pgvector Indexing</span>
            <span className="bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-lg">Gemini Pro LLM</span>
            <span className="bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-lg">TypeScript</span>
          </div>

        </div>
      </section>

    </div>
  );
}
