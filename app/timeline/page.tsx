'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Loader2, Sparkles, Filter, Search } from 'lucide-react';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { KARNATAKA_DISTRICTS, ARCHIVE_CATEGORIES } from '@/lib/mock-data';
import { toast } from 'sonner';

// Subcomponents
import { TimelineList } from '@/components/knowledge-graph/TimelineList';

export default function TimelinePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [district, setDistrict] = useState('all');
  const [category, setCategory] = useState('all');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');

  const loadTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) queryParams.set('entity', searchQuery.trim());
      if (district !== 'all') queryParams.set('district', district);
      if (category !== 'all') queryParams.set('category', category);
      if (yearFrom) queryParams.set('year_from', yearFrom);
      if (yearTo) queryParams.set('year_to', yearTo);

      const res = await fetch(`/api/knowledge-graph?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to load timeline events');

      const data = await res.json();
      if (data.success) {
        setIsDemo(!!data.isDemo);
        setEvents(data.timeline_events || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to resolve historical timeline');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, district, category, yearFrom, yearTo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTimeline();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadTimeline]);

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-slate-950 text-slate-100 min-h-[calc(100vh-4rem)] p-4 sm:p-6 space-y-6 font-sans">
        
        {/* Header */}
        <div className="flex items-center gap-2 select-none border-b border-slate-900 pb-3">
          <Calendar className="h-5 w-5 text-primary animate-pulse" />
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold text-foreground font-serif">Historical Timeline Engine</h1>
            <p className="text-xs text-slate-400">
              Audit chronological milestones compiled dynamically from registry records, date annotations, and metadata.
            </p>
          </div>
        </div>

        {/* Demo Watermark (Safeguard 9) */}
        {isDemo && (
          <div className="bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[10px] px-3 py-1.5 rounded-md font-mono flex items-center gap-1.5 w-fit select-none">
            <Sparkles className="h-4 w-4 animate-spin text-amber-500" />
            <span>Virtual Timeline Demo: Displaying mocked historical events from Karnataka state.</span>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="bg-slate-900/35 border border-slate-800 rounded-xl p-4 space-y-3 shadow-xl backdrop-blur-md select-none">
          <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-300 font-mono tracking-wider">
            <Filter className="h-4 w-4 text-primary" />
            FILTER CHRONOLOGICAL MILESTONES
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <Input
                placeholder="Search event names, figures, records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8.5 bg-slate-950 border-slate-850 text-slate-200 placeholder:text-slate-655 focus-visible:ring-primary text-xs"
              />
            </div>

            {/* District */}
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="bg-slate-950 border border-slate-850 text-slate-300 text-xs rounded-md px-2 py-1 h-8.5 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Districts</option>
              {KARNATAKA_DISTRICTS.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>

            {/* Category */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-950 border border-slate-850 text-slate-300 text-xs rounded-md px-2 py-1 h-8.5 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              {ARCHIVE_CATEGORIES.map(c => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>

            {/* Years range */}
            <div className="flex items-center gap-1.5">
              <Input
                placeholder="From"
                type="number"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                className="h-8.5 bg-slate-950 border-slate-850 text-slate-200 placeholder:text-slate-655 focus-visible:ring-primary text-xs w-full"
              />
              <span className="text-slate-600 text-xs">-</span>
              <Input
                placeholder="To"
                type="number"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                className="h-8.5 bg-slate-950 border-slate-850 text-slate-200 placeholder:text-slate-655 focus-visible:ring-primary text-xs w-full"
              />
            </div>
          </div>
        </div>

        {/* Timeline List Content */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <span className="text-xs text-slate-500 font-mono">Compiling timelines...</span>
            </div>
          ) : (
            <TimelineList events={events} />
          )}
        </div>

      </div>
    </AppLayout>
  );
}
