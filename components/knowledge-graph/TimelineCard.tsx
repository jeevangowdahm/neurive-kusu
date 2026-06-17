'use client';

import React from 'react';
import { Calendar, MapPin, Tag, ArrowUpRight, Sparkles, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TimelineEvent {
  id: string;
  year: number;
  title: string;
  type: string;
  district?: string;
  category?: string;
  snippet?: string;
  document_id?: string;
}

interface TimelineCardProps {
  event: TimelineEvent;
}

export function TimelineCard({ event }: TimelineCardProps) {
  const isDocument = event.type === 'Document';

  return (
    <div className="relative pl-8 pb-8 last:pb-2 group">
      {/* Visual chronological spine line */}
      <div className="absolute left-[11px] top-2 bottom-0 w-[2px] bg-slate-800 group-last:hidden" />

      {/* Visual node dot indicator */}
      <div className={`absolute left-[4px] top-1.5 h-4 w-4 rounded-full border-2 border-slate-950 flex items-center justify-center transition-all duration-300 z-10 ${
        isDocument 
          ? 'bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.6)]' 
          : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
      }`} />

      {/* Main card box */}
      <Card className="bg-slate-900/35 border-slate-800 hover:border-slate-700/60 transition-all duration-200">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
          
          <div className="space-y-2.5 flex-1 min-w-0">
            {/* Header info */}
            <div className="flex flex-wrap items-center gap-2 select-none">
              <Badge className="bg-slate-950 border-slate-800 text-primary font-mono text-[10px] h-5 px-2 font-bold">
                <Calendar className="mr-1 h-3 w-3" />
                {event.year} CE
              </Badge>
              <Badge variant="secondary" className="text-[9px] bg-slate-800/80 text-slate-400 border border-slate-850 h-5">
                {event.type}
              </Badge>
            </div>

            {/* Title & snippet */}
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-200 leading-snug">
                {event.title}
              </h4>
              {event.snippet && (
                <p className="text-xs text-slate-400 leading-relaxed font-sans italic">
                  &ldquo;{event.snippet}&rdquo;
                </p>
              )}
            </div>

            {/* Metadata Tags */}
            <div className="flex flex-wrap gap-1.5 select-none pt-1">
              {event.district && (
                <Badge variant="outline" className="text-[9px] bg-slate-950/40 border-slate-850 text-slate-500 flex items-center gap-0.5 font-mono">
                  <MapPin className="h-2.5 w-2.5" />
                  {event.district}
                </Badge>
              )}
              {event.category && (
                <Badge variant="outline" className="text-[9px] bg-slate-950/40 border-slate-850 text-slate-500 flex items-center gap-0.5 font-mono capitalize">
                  <Tag className="h-2.5 w-2.5" />
                  {event.category}
                </Badge>
              )}
            </div>
          </div>

          {/* Action redirects (Safeguard 13) */}
          {event.document_id && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[10.5px] font-semibold border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 gap-1 select-none shrink-0 self-start md:self-center"
              asChild
            >
              <Link href={`/documents/${event.document_id}`}>
                <BookOpen className="h-3.5 w-3.5" />
                Open Document
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
