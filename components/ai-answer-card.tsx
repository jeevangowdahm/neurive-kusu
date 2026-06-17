'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Brain, Sparkles, BookOpen, ExternalLink, ChevronDown, ChevronUp, Lightbulb, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface AICitation {
  title: string;
  archiveId: string;
  relevance: number;
  snippet?: string;
  sourceType?: string;
  sourceName?: string;
  sourceUrl?: string;
  pageNumber?: number;
}

export interface AIAnswerData {
  answer: string;
  confidence: number;
  citations: AICitation[];
  relatedEntities?: Array<{ name: string; type: string }>;
  queryIntent?: string;
  processingTimeMs?: number;
}

/**
 * AI-Generated Answer Card
 * Displays AI-generated answers with citations, confidence, and related entities
 */
export function AIAnswerCard({ data }: { data: AIAnswerData }) {
  const [expanded, setExpanded] = useState(false);
  const [showCitations, setShowCitations] = useState(false);

  const confidenceColor =
    data.confidence >= 0.8 ? 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-800' :
    data.confidence >= 0.5 ? 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800' :
    'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800';

  const confidenceLabel =
    data.confidence >= 0.8 ? 'High' :
    data.confidence >= 0.5 ? 'Medium' :
    'Low';

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-primary/10 bg-primary/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">AI Answer</span>
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              Neurive AI
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-[10px] border ${confidenceColor}`}>
              {confidenceLabel} Confidence
            </Badge>
            {data.processingTimeMs && (
              <span className="text-[10px] text-muted-foreground">
                {data.processingTimeMs < 1000 ? `${data.processingTimeMs}ms` : `${(data.processingTimeMs / 1000).toFixed(1)}s`}
              </span>
            )}
          </div>
        </div>

        {/* Answer */}
        <div className="px-5 py-4">
          {data.queryIntent && (
            <div className="flex items-center gap-1.5 mb-3">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-muted-foreground">Understanding: {data.queryIntent}</span>
            </div>
          )}

          <div className="relative">
            <Quote className="absolute -left-1 -top-1 h-4 w-4 text-primary/20" />
            <p className={`text-sm text-foreground leading-relaxed pl-4 ${!expanded ? 'line-clamp-4' : ''}`}>
              {data.answer}
            </p>
          </div>

          {data.answer.length > 300 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              {expanded ? (
                <>Show less <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>Read more <ChevronDown className="h-3 w-3" /></>
              )}
            </button>
          )}
        </div>

        {/* Citations */}
        {data.citations.length > 0 && (
          <div className="border-t border-primary/10">
            <button
              onClick={() => setShowCitations(!showCitations)}
              className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">
                  {data.citations.length} Source{data.citations.length !== 1 ? 's' : ''}
                </span>
              </div>
              {showCitations ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>

            {showCitations && (
              <div className="px-5 pb-3 space-y-2">
                {data.citations.map((citation, idx) => {
                  const isWiki = citation.sourceType === 'wikipedia';
                  const citationUrl = isWiki && citation.sourceUrl ? citation.sourceUrl : `/archive/${citation.archiveId}`;
                  const isExternal = isWiki && !!citation.sourceUrl;

                  return (
                    <a
                      key={citation.archiveId}
                      href={citationUrl}
                      target={isExternal ? '_blank' : '_self'}
                      rel={isExternal ? 'noopener noreferrer' : undefined}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors group text-left block w-full border border-white/5"
                    >
                      <span className="text-[10px] font-mono text-muted-foreground mt-0.5 shrink-0">[{idx + 1}]</span>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-foreground truncate max-w-[250px]">{citation.title}</span>
                          
                          {/* Citation Type Badges */}
                          {isWiki ? (
                            <Badge className="text-[9px] font-bold border border-blue-500/20 bg-blue-500/10 text-blue-400">
                              Wikipedia Source
                            </Badge>
                          ) : citation.sourceType === 'government_pdf' ? (
                            <Badge className="text-[9px] font-bold border border-purple-500/20 bg-purple-500/10 text-purple-400">
                              Government PDF
                            </Badge>
                          ) : citation.sourceType === 'internet_archive' ? (
                            <Badge className="text-[9px] font-bold border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                              Internet Archive
                            </Badge>
                          ) : (
                            <Badge className="text-[9px] font-bold border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                              Uploaded Archive
                            </Badge>
                          )}

                          {citation.pageNumber && (
                            <Badge variant="outline" className="text-[9px] text-muted-foreground border-white/5 bg-background/30">
                              Page {citation.pageNumber}
                            </Badge>
                          )}
                          
                          <ExternalLink className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                        
                        {citation.snippet && (
                          <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                            "{citation.snippet}"
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1 text-[9px] text-muted-foreground border-t border-white/5 font-mono">
                          <span>Source: {citation.sourceName || 'Archives'}</span>
                          {citation.sourceUrl && (
                            <span className="truncate max-w-[220px] text-primary group-hover:underline">
                              {citation.sourceUrl}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] shrink-0 border-primary/20 bg-primary/5 text-primary font-bold">
                        {Math.round(citation.relevance * 100)}% Match
                      </Badge>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Related Entities */}
        {data.relatedEntities && data.relatedEntities.length > 0 && (
          <div className="border-t border-primary/10 px-5 py-3">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Related Entities</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.relatedEntities.map((entity) => (
                <Badge
                  key={entity.name}
                  variant="secondary"
                  className="text-[10px] gap-1 cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    entity.type === 'person' ? 'bg-rose-500' :
                    entity.type === 'place' ? 'bg-teal-500' :
                    entity.type === 'event' ? 'bg-blue-500' :
                    entity.type === 'date' ? 'bg-amber-500' :
                    'bg-gray-500'
                  }`} />
                  {entity.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
