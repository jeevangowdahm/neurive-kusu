'use client';

import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { TimelineCard } from './TimelineCard';

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

interface TimelineListProps {
  events: TimelineEvent[];
}

export function TimelineList({ events }: TimelineListProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 gap-3 border border-dashed border-slate-800 rounded-xl bg-slate-950/20 max-w-lg mx-auto select-none">
        <AlertCircle className="h-8 w-8 text-slate-655" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-200">No Historical Milestones Available</p>
          <p className="text-xs text-slate-500">There are no dated events or documents indexed matching the active query constraints.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1 max-w-3xl mx-auto">
      {events.map((event) => (
        <TimelineCard key={event.id} event={event} />
      ))}
    </div>
  );
}
