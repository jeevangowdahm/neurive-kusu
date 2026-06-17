'use client';

import React from 'react';
import { Calendar, ChevronRight, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TimelineEvent {
  id: string;
  year: number;
  title: string;
  type: string;
  snippet: string;
  document_id?: string;
}

interface CompactTimelineProps {
  events: TimelineEvent[];
}

export function CompactTimeline({ events }: CompactTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-950/20 border border-slate-900 rounded-xl select-none text-center gap-2">
        <Calendar className="h-6 w-6 text-slate-700" />
        <span className="text-xs text-slate-500 font-mono">No historical timeline milestones cataloged.</span>
      </div>
    );
  }

  // Slice top 8 events for layout cleanliness
  const visibleEvents = events.slice(0, 8);

  return (
    <div className="relative border-l border-slate-800 ml-3.5 pl-6 space-y-5 select-none font-sans">
      {visibleEvents.map((evt, idx) => {
        const isDoc = evt.type === 'Document';
        const docLink = evt.document_id
          ? evt.document_id.startsWith('arch-') || evt.document_id.startsWith('demo-')
            ? `/archive/${evt.document_id}`
            : `/documents/${evt.document_id}`
          : null;

        return (
          <div key={evt.id || idx} className="relative group">
            {/* Year Node Badge Indicator */}
            <div className="absolute -left-10 top-0.5 h-6.5 w-6.5 rounded-full bg-slate-950 border border-slate-800 group-hover:border-primary flex items-center justify-center transition-colors z-10">
              <Calendar className="h-3 w-3 text-primary" />
            </div>

            {/* Event Block */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xs font-bold text-primary font-mono">
                  {evt.year} CE
                </span>
                <span className="text-slate-200 text-xs font-bold font-serif leading-snug">
                  {evt.title}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-relaxed max-w-xl italic">
                &ldquo;{evt.snippet}&rdquo;
              </p>
              
              {docLink && (
                <Link href={docLink}>
                  <span className="text-[9.5px] text-slate-500 hover:text-primary transition-colors cursor-pointer flex items-center gap-0.5 pt-1 font-mono">
                    <FileText className="h-3 w-3" />
                    Inspect primary ledger source record
                    <ChevronRight className="h-2.5 w-2.5" />
                  </span>
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
