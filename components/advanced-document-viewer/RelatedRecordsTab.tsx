'use client';

import React from 'react';
import { Sparkles, MapPin, Tag, Calendar, Eye, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface RelatedDoc {
  id: string;
  title: string;
  summary?: string;
  description?: string;
  district?: string;
  category?: string;
  year?: number;
  relevance_reason?: string;
}

interface RelatedRecordsTabProps {
  related: RelatedDoc[];
  onOpenRecord?: (id: string) => void;
}

export function RelatedRecordsTab({ related, onOpenRecord }: RelatedRecordsTabProps) {
  if (related.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 gap-3 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
        <Sparkles className="h-8 w-8 text-slate-600" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-200">No Related Records</p>
          <p className="text-xs text-slate-500 max-w-xs">No matching archives found within the same category, district, or timeframe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {related.map((item) => {
        const title = item.title;
        const summary = item.summary || item.description || 'No summary description available.';
        const reason = item.relevance_reason || 'Matching archival criteria';

        return (
          <Card key={item.id} className="bg-slate-900/30 border-slate-800/80 hover:border-slate-700/60 transition-all duration-200 group">
            <CardContent className="p-4 space-y-3">
              {/* Header Match Reason */}
              <div className="flex items-center gap-1.5 text-[9px] text-primary font-bold font-mono uppercase tracking-wider select-none">
                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                <span>{reason}</span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-primary transition-colors line-clamp-1">
                  {title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {summary}
                </p>
              </div>

              {/* Tags & Action */}
              <div className="flex items-center justify-between gap-3 pt-1 select-none">
                <div className="flex flex-wrap gap-1.5">
                  {item.district && (
                    <Badge variant="outline" className="text-[9px] bg-slate-950 border-slate-850 text-slate-400 flex items-center gap-0.5 font-mono">
                      <MapPin className="h-2.5 w-2.5" />
                      {item.district}
                    </Badge>
                  )}
                  {item.category && (
                    <Badge variant="outline" className="text-[9px] bg-slate-950 border-slate-850 text-slate-400 flex items-center gap-0.5 font-mono">
                      <Tag className="h-2.5 w-2.5" />
                      {item.category}
                    </Badge>
                  )}
                  {item.year && (
                    <Badge variant="outline" className="text-[9px] bg-slate-950 border-slate-850 text-slate-400 flex items-center gap-0.5 font-mono">
                      <Calendar className="h-2.5 w-2.5" />
                      {item.year} CE
                    </Badge>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2.5 text-[10px] gap-1 text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 font-semibold shrink-0"
                  onClick={() => onOpenRecord?.(item.id)}
                  asChild
                >
                  <Link href={`/documents/${item.id}`}>
                    Open
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
