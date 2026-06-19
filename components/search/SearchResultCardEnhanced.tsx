"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, MessageSquare, Network, Calendar, ArrowRight } from "lucide-react";

interface SearchResult {
  document_id: string;
  title: string;
  year: number;
  district: string;
  category: string;
  description: string;
  relevance_score: number;
  match_type: string;
  score?: number;
  entity_score?: number;
  bm25_score?: number;
  similarity?: number;
  hybrid_score?: number;
  page?: string;
  full_text?: string;
  excerpt: string;
  ocr_confidence?: string;
  created_at?: string;
  updated_at?: string;
  file_url?: string;
  file_type?: string;
  language?: string;
  status?: string;
  tags?: string[];
}

interface SearchResultCardEnhancedProps {
  result: SearchResult;
  onOpenDocument: (id: string) => void;
  onAskAI: (result: SearchResult) => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  relatedEntities?: any[];
}

export function SearchResultCardEnhanced({
  result,
  onOpenDocument,
  onAskAI,
  isBookmarked,
  onToggleBookmark,
  relatedEntities = []
}: SearchResultCardEnhancedProps) {
  const score = result.relevance_score || result.score || result.hybrid_score || 0;
  const scorePercentage = Math.round(score * 100);

  return (
    <Card className="border border-slate-800/50 bg-slate-900/30 hover:bg-slate-900/50 backdrop-blur-xl transition-all duration-300 hover:border-slate-600/50">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
                {result.category || 'Unknown'}
              </Badge>
              <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                {result.district || 'Unknown'}
              </Badge>
              <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/20">
                {result.year || 'N/A'}
              </Badge>
            </div>
            <h3
              className="text-base font-semibold text-white hover:text-blue-400 cursor-pointer transition-colors line-clamp-2"
              onClick={() => onOpenDocument(result.document_id)}
            >
              {result.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="text-xs border-slate-700 text-slate-500">
              {scorePercentage}% match
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-500 hover:text-white"
              onClick={() => onToggleBookmark(result.document_id)}
            >
              {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-emerald-400" /> : <Bookmark className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Excerpt */}
        <p className="text-sm text-slate-400 line-clamp-3 mb-3">
          {result.excerpt || result.description || result.full_text || 'No description available'}
        </p>

        {/* Related Entities */}
        {relatedEntities.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-xs text-slate-500">Entities:</span>
            {relatedEntities.slice(0, 3).map((entity, i) => (
              <Link key={i} href={`/knowledge-graph?entity=${encodeURIComponent(entity.name)}`}>
                <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors">
                  {entity.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-800/50">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => onOpenDocument(result.document_id)}
          >
            <ArrowRight className="h-3 w-3 mr-1" />
            View Document
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
            onClick={() => onAskAI(result)}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Ask AI
          </Button>
          <Link href={`/knowledge-graph?entity=${encodeURIComponent(result.title.split(' ')[0])}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-400 hover:text-blue-400 hover:bg-slate-800"
            >
              <Network className="h-3 w-3 mr-1" />
              Graph
            </Button>
          </Link>
          <Link href={`/timeline?year=${result.year}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-400 hover:text-amber-400 hover:bg-slate-800"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Timeline
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
