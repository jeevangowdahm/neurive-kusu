'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, Bookmark, ArrowUpRight, MessageSquare, 
  ChevronDown, ChevronUp, MapPin, Folder, Globe, Calendar, Brain
} from 'lucide-react';
import { audioSynth } from '@/lib/audio';

export interface SearchResult {
  document_id: string;
  title: string;
  summary: string;
  matched_snippet: string;
  page_number: number;
  district: string;
  category: string;
  language: string;
  year: number;
  file_type: string;
  ocr_confidence: number;
  semantic_score: number;
  keyword_score: number;
  metadata_score: number;
  entity_score: number;
  final_score: number;
  why_this_result?: string;
  matched_entities?: string[];
  source_type?: string;
  source_is_real?: boolean;
  is_demo?: boolean;
}

interface SearchResultCardProps {
  result: SearchResult;
  onOpenDocument: (documentId: string, fileUrl?: string) => void;
  onAskAI: (result: SearchResult) => void;
  isBookmarked: boolean;
  onToggleBookmark: (documentId: string) => void;
}

export function SearchResultCard({ 
  result, 
  onOpenDocument, 
  onAskAI, 
  isBookmarked, 
  onToggleBookmark 
}: SearchResultCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const relevancePct = Math.round(result.final_score * 100);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioSynth.playPaperRustle();
    onToggleBookmark(result.document_id);
  };

  const handleOpenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioSynth.playHologramChime(false);
    onOpenDocument(result.document_id);
  };

  const handleAskClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioSynth.playTypewriterClick(true);
    onAskAI(result);
  };

  const toggleExplanation = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioSynth.playPaperRustle();
    setShowExplanation(!showExplanation);
  };

  // Generate explainability breakdown message
  const explanationText = `This document matches ${Math.round(result.semantic_score * 100)}% semantically, contains keyword hits (${Math.round(result.keyword_score * 100)}%), fits context for ${result.district} district (${Math.round(result.metadata_score * 100)}%), and aligns with the ${result.category} category.`;

  return (
    <Card className="border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all duration-300 backdrop-blur-sm relative group overflow-hidden animate-slide-up">
      {/* Visual score accent bar */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
        style={{ opacity: result.final_score }}
      />

      <CardContent className="p-5 space-y-4">
        
        {/* Header: Title and Relevance Score */}
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <h3 
              onClick={handleOpenClick}
              className="font-serif font-bold text-sm sm:text-base text-white hover:text-primary cursor-pointer transition-colors leading-snug"
            >
              {result.title}
            </h3>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <Badge variant="outline" className="text-[10px] gap-1 py-0.5 px-2 border-white/5 bg-white/5 text-muted-foreground">
                <MapPin className="h-3 w-3 text-sky-400" />
                {result.district}
              </Badge>
              <Badge variant="outline" className="text-[10px] gap-1 py-0.5 px-2 border-white/5 bg-white/5 text-muted-foreground">
                <Folder className="h-3 w-3 text-amber-400" />
                {result.category}
              </Badge>
              <Badge variant="outline" className="text-[10px] gap-1 py-0.5 px-2 border-white/5 bg-white/5 text-muted-foreground">
                <Globe className="h-3 w-3 text-emerald-400" />
                {result.language}
              </Badge>
              {result.year && (
                <Badge variant="outline" className="text-[10px] gap-1 py-0.5 px-2 border-white/5 bg-white/5 text-muted-foreground">
                  <Calendar className="h-3 w-3 text-rose-400" />
                  {result.year} CE
                </Badge>
              )}

              {/* Source Realness Badges */}
              {result.source_is_real ? (
                <Badge className="text-[10px] font-bold border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
                  Real Source
                </Badge>
              ) : (
                <Badge className="text-[10px] font-bold border border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20">
                  Demo Record
                </Badge>
              )}

              {/* Source Type Badges */}
              {result.source_type === 'wikipedia' && (
                <Badge className="text-[10px] font-bold border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                  Wikipedia
                </Badge>
              )}
              {result.source_type === 'government_pdf' && (
                <Badge className="text-[10px] font-bold border border-purple-500/20 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20">
                  Government PDF
                </Badge>
              )}
              {result.source_type === 'internet_archive' && (
                <Badge className="text-[10px] font-bold border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20">
                  Internet Archive
                </Badge>
              )}
              {result.source_type === 'uploaded' && (
                <Badge className="text-[10px] font-bold border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20">
                  Uploaded Archive
                </Badge>
              )}
              {result.source_type === 'wikisource' && (
                <Badge className="text-[10px] font-bold border border-teal-500/20 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20">
                  Wikisource Texts
                </Badge>
              )}
              {result.source_type === 'open_data' && (
                <Badge className="text-[10px] font-bold border border-orange-500/20 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20">
                  Open Data Portal
                </Badge>
              )}
              {result.source_type === 'state_archives' && (
                <Badge className="text-[10px] font-bold border border-pink-500/20 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20">
                  State Archives
                </Badge>
              )}
            </div>
          </div>

          {/* Score Circle/Meter */}
          <div className="shrink-0 flex flex-col items-center select-none bg-primary/10 border border-primary/20 rounded-lg p-2 min-w-16">
            <span className="text-[9px] font-bold text-primary uppercase tracking-wider">Relevance</span>
            <span className="text-sm font-extrabold font-mono text-white mt-0.5">{relevancePct}%</span>
          </div>
        </div>

        {/* Summary Snippet */}
        <div className="text-xs text-muted-foreground leading-relaxed">
          <p className="line-clamp-2 italic font-serif">
            "{result.summary}"
          </p>
          <div className="mt-2 text-[11px] bg-black/20 p-2.5 rounded border border-white/5 font-mono text-foreground leading-normal whitespace-pre-wrap">
            <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider block mb-1">Deciphered Page {result.page_number} Snippet:</span>
            {result.matched_snippet}
          </div>
        </div>

        {/* Collapsible Explainability Panel */}
        <div className="border-t border-white/5 pt-2">
          <button
            onClick={toggleExplanation}
            className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
          >
            <Brain className="h-3.5 w-3.5" />
            {showExplanation ? 'Hide Explanation' : 'Why this result?'}
            {showExplanation ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showExplanation && (
            <div className="mt-3 bg-black/40 border border-white/10 rounded-lg p-3.5 space-y-3.5 text-xs text-muted-foreground animate-slide-down">
              <p className="leading-relaxed text-[11px]">
                {explanationText}
              </p>
              
              {/* Scoring Weights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono select-none">
                {/* Semantic */}
                <div className="p-2 border border-white/5 bg-white/5 rounded-md flex flex-col justify-between h-12">
                  <span className="text-muted-foreground text-[8px] uppercase font-bold">Vector Similarity (40%)</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-white font-extrabold">{Math.round(result.semantic_score * 100)}%</span>
                    <span className="text-[8px] text-muted-foreground">+{Math.round(result.semantic_score * 40)} pts</span>
                  </div>
                </div>

                {/* Keyword */}
                <div className="p-2 border border-white/5 bg-white/5 rounded-md flex flex-col justify-between h-12">
                  <span className="text-muted-foreground text-[8px] uppercase font-bold">FTS Keywords (30%)</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-white font-extrabold">{Math.round(result.keyword_score * 100)}%</span>
                    <span className="text-[8px] text-muted-foreground">+{Math.round(result.keyword_score * 30)} pts</span>
                  </div>
                </div>

                {/* Metadata */}
                <div className="p-2 border border-white/5 bg-white/5 rounded-md flex flex-col justify-between h-12">
                  <span className="text-muted-foreground text-[8px] uppercase font-bold">Metadata Sync (20%)</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-white font-extrabold">{Math.round(result.metadata_score * 100)}%</span>
                    <span className="text-[8px] text-muted-foreground">+{Math.round(result.metadata_score * 20)} pts</span>
                  </div>
                </div>

                  {/* Entities */}
                  <div className="p-2 border border-white/5 bg-white/5 rounded-md flex flex-col justify-between h-12">
                    <span className="text-muted-foreground text-[8px] uppercase font-bold">Entity Matches (10%)</span>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-white font-extrabold">{Math.round((result.entity_score || 0) * 100)}%</span>
                      <span className="text-[8px] text-muted-foreground">+{Math.round((result.entity_score || 0) * 10)} pts</span>
                    </div>
                  </div>
                </div>

                {/* Citation & Match details */}
                <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-1.5 text-[10px]">
                  <div className="flex flex-wrap gap-2 text-muted-foreground">
                    <span>Page Location: <strong className="text-white">Page {result.page_number}</strong></span>
                    <span>•</span>
                    <span>District/Category Context: <strong className="text-white">{result.district} / {result.category}</strong></span>
                    <span>•</span>
                    <a 
                      href={`/archive/${result.document_id}?page=${result.page_number}`}
                      className="text-primary hover:underline flex items-center gap-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Academic Citation Link <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </div>

                  {result.matched_entities && result.matched_entities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center pt-1">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground mr-1">Matched Entities:</span>
                      {result.matched_entities.map((ent: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-[9px] border-primary/20 bg-primary/10 text-primary py-0 px-1.5">
                          {ent}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex gap-2">
            <Button
              onClick={handleOpenClick}
              size="sm"
              variant="outline"
              className="text-[10px] h-8 border-white/10 hover:bg-white/5 text-foreground gap-1.5"
            >
              Open Document
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button
              onClick={handleAskClick}
              size="sm"
              variant="outline"
              className="text-[10px] h-8 border-white/10 hover:bg-white/5 text-foreground gap-1.5"
            >
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              Ask AI Assistant
            </Button>
          </div>

          <Button
            onClick={handleBookmarkClick}
            size="sm"
            variant="ghost"
            className="text-[10px] h-8 text-muted-foreground hover:text-white"
          >
            <Bookmark className={`h-4 w-4 mr-1 ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
