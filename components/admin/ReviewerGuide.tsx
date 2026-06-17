'use client';

import React, { useState } from 'react';
import { 
  BookOpen, X, Sparkles, HelpCircle, Shield, Award, Activity, Database, Cpu, Compass, SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function ReviewerGuide() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-12 rounded-full px-5 bg-gradient-to-r from-purple-600 to-primary hover:from-purple-500 hover:to-primary/90 text-white shadow-2xl z-50 gap-2 border border-purple-500/30 animate-pulse hover:animate-none"
      >
        <BookOpen className="h-4.5 w-4.5" />
        <span className="text-xs font-bold font-mono uppercase tracking-wider">Reviewer Guide</span>
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-2xl w-full border-slate-800 bg-slate-900/90 backdrop-blur-md shadow-2xl max-h-[90vh] overflow-y-auto relative">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500 via-primary to-blue-500" />
        
        <CardHeader className="border-b border-slate-900 pb-3 flex flex-row items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10 p-5">
          <div className="flex items-center gap-2 select-none">
            <Award className="h-5 w-5 text-purple-400" />
            <div>
              <CardTitle className="text-sm font-bold text-slate-100 font-serif">Reviewer Technical Evaluation Dossier</CardTitle>
              <CardDescription className="text-[10px] text-slate-500 font-mono">Neurive Platform Architectures & Algorithms</CardDescription>
            </div>
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-6 text-xs text-slate-300 leading-relaxed select-text font-sans">
          
          {/* Section 1: RAG */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-100 flex items-center gap-1.5 font-serif border-b border-slate-900 pb-1">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
              1. Grounded RAG Chat (RAG)
            </h3>
            <p>
              To prevent AI hallucinations, the Conversational RAG assistant enforces strict grounding checks:
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1 text-slate-400 font-mono text-[10.5px]">
              <li><strong className="text-slate-300">Evidence Thresholding:</strong> Chunks must have a relevance score above <code className="text-amber-400">0.35</code>. If below, the assistant returns a polite refusal rather than guessing.</li>
              <li><strong className="text-slate-300">Context Bounds:</strong> Limits context to document-specific or entity-specific ranges, preventing cross-contamination of unrelated historical events.</li>
              <li><strong className="text-slate-300">Citation Engine:</strong> Formats inline numeric citations mapped to precise document pages.</li>
            </ul>
          </div>

          {/* Section 2: OCR */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-100 flex items-center gap-1.5 font-serif border-b border-slate-900 pb-1">
              <Cpu className="h-4 w-4 text-purple-400 shrink-0" />
              2. Bilingual OCR & Corrections (OCR)
            </h3>
            <p>
              Scanned historical archives run through a multi-stage OCR parser:
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1 text-slate-400 font-mono text-[10.5px]">
              <li><strong className="text-slate-300">Confidence Scoring:</strong> Computes average page confidence. Pages with confidence below <code className="text-purple-400">60%</code> display high-visibility warnings.</li>
              <li><strong className="text-slate-300">Interactive Correction Editor:</strong> Authorized archivists can make inline edits. Edits are saved to <code className="text-purple-400">corrected_text</code> with status indicators (<code className="text-slate-300">raw, reviewed, corrected</code>).</li>
            </ul>
          </div>

          {/* Section 3: Semantic Search */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-100 flex items-center gap-1.5 font-serif border-b border-slate-900 pb-1">
              <Compass className="h-4 w-4 text-blue-400 shrink-0" />
              3. Semantic & Hybrid Search (Semantic Search)
            </h3>
            <p>
              Retrieval integrates dense vector embeddings with sparse text indexes:
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 font-mono text-[10.5px] text-slate-400 space-y-2">
              <div>
                <span className="text-primary font-bold uppercase block text-[9px] mb-0.5">Scoring Formula</span>
                <code>Hybrid Score = 0.40 * Semantic + 0.30 * Keyword + 0.20 * Metadata + 0.10 * Entity</code>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[10px]">
                <li><strong className="text-slate-300">Query Expansion:</strong> Automatically expands regional/historical spelling variations (e.g. Mysore ➔ Mysuru ➔ ಮೈಸೂರು).</li>
                <li><strong className="text-slate-300">Explainability:</strong> Reranking score breakdowns are visualized in the search results card ("Why this result?").</li>
              </ul>
            </div>
          </div>

          {/* Section 4: LangChain Pipeline */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-100 flex items-center gap-1.5 font-serif border-b border-slate-900 pb-1">
              <Activity className="h-4 w-4 text-cyan-400 shrink-0" />
              4. LangChain Modular Architecture (LangChain)
            </h3>
            <p>
              AI logic is decoupled into reusable modular service files inside <code className="text-cyan-400">lib/ai/</code>:
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1 text-slate-400 font-mono text-[10.5px]">
              <li><strong className="text-slate-300">Focused Services:</strong> Separate single-responsibility modules for OCR, chunking, embeddings, retrieval, reranking, entities, graph generation, citations, and RAG orchestration.</li>
              <li><strong className="text-slate-300">Grounded Chains:</strong> Connects retrievers, rerankers, templates, and LLM providers dynamically.</li>
            </ul>
          </div>

          {/* Section 5: Vector DB */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-100 flex items-center gap-1.5 font-serif border-b border-slate-900 pb-1">
              <Database className="h-4 w-4 text-emerald-400 shrink-0" />
              5. Vector Database Integrity (Vector Databases)
            </h3>
            <p>
              Database chunking features strict validation:
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1 text-slate-400 font-mono text-[10.5px]">
              <li><strong className="text-slate-300">Dimension Safety:</strong> Standardizes all vectors to exactly <code className="text-emerald-400">1536 dimensions</code>.</li>
              <li><strong className="text-slate-300">Embedding Metadata:</strong> Tracks `embedding_model`, `embedding_dimension`, `embedding_status`, `embedding_error`, and computes a quality score to prevent index corruption.</li>
            </ul>
          </div>

          {/* Section 6: Knowledge Graph */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-100 flex items-center gap-1.5 font-serif border-b border-slate-900 pb-1">
              <SlidersHorizontal className="h-4 w-4 text-rose-400 shrink-0" />
              6. Dynamic Knowledge Graph (Knowledge Graphs)
            </h3>
            <p>
              Maintains relationships between historical agents and locations:
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1 text-slate-400 font-mono text-[10.5px]">
              <li><strong className="text-slate-300">Strength Metrics:</strong> Proximity proximity rules define edges (Same Page = 0.90, Same Doc = 0.75, Same District = 0.60, Same Category = 0.50, Same period = 0.45).</li>
              <li><strong className="text-slate-300">Preservation of Manual Edits:</strong> Graph regenerations delete only `auto` generated connections while preserving custom admin links.</li>
            </ul>
          </div>

          {/* Section 7: Digital Archive features */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-100 flex items-center gap-1.5 font-serif border-b border-slate-900 pb-1">
              <Shield className="h-4 w-4 text-red-400 shrink-0" />
              7. Digital Archive Preservation & Access (Digital Archives)
            </h3>
            <p>
              Ensures high-fidelity preservation and citation tracking:
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1 text-slate-400 font-mono text-[10.5px]">
              <li><strong className="text-slate-300">Academic Citation:</strong> Instantly generates APA, MLA, IEEE, and Chicago styles for records.</li>
              <li><strong className="text-slate-300">Preservation Status & Reliability:</strong> Captures physical state (Excellent to Critical) and reliability index (0 to 1).</li>
              <li><strong className="text-slate-300">Access Security:</strong> Integrates Supabase Row-Level Security (RLS) and checks user clearance role (public, restricted, private) before exposing private details.</li>
            </ul>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
