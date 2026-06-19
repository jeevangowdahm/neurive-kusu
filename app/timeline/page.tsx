'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, ArrowRight, Network, Search, MapPin, Clock } from 'lucide-react';
import { QuickActions } from '@/components/shared/QuickActions';

interface TimelineEvent {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
  description: string | null;
  importance: number;
  entity_id: string | null;
  archive_id: string | null;
  district_id: string | null;
  entities?: { name: string; entity_type: string } | null;
  archives?: { title: string; year: number } | null;
  districts?: { name: string } | null;
}

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function loadTimeline() {
      try {
        const response = await fetch('/api/timeline');
        const data = await response.json();
        if (data.success) {
          setEvents(data.events || []);
        } else {
          setError(data.error || 'Failed to load timeline');
        }
      } catch (err) {
        setError('Failed to load timeline');
      } finally {
        setLoading(false);
      }
    }
    loadTimeline();
  }, []);

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.event_type === filter);

  const groupedByEra: Record<string, TimelineEvent[]> = {};
  filteredEvents.forEach((event) => {
    const year = new Date(event.event_date).getFullYear();
    const era = year < 1000 ? 'Ancient (Pre-1000)' : 
                year < 1500 ? 'Medieval (1000-1500)' :
                year < 1800 ? 'Early Modern (1500-1800)' :
                year < 1950 ? 'Colonial (1800-1950)' : 'Modern (1950-)';
    if (!groupedByEra[era]) groupedByEra[era] = [];
    groupedByEra[era].push(event);
  });

  const eventTypes = ['all', 'birth', 'death', 'battle', 'construction', 'other'];

  const quickActions = [
    { name: 'search', label: 'Search Events', icon: 'search', href: '/search' },
    { name: 'graph', label: 'Knowledge Graph', icon: 'network', href: '/knowledge-graph' },
    { name: 'districts', label: 'Explore Districts', icon: 'map', href: '/districts' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />

      <div className="pt-24 pb-16 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-6 w-6 text-amber-400" />
            <Badge variant="outline" className="border-amber-500/30 text-amber-400">Timeline</Badge>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Karnataka Historical Timeline</h1>
          <p className="text-slate-400">Explore key events, births, deaths, and milestones from Karnataka's rich history</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <QuickActions actions={quickActions} variant="compact" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {eventTypes.map(type => (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              size="sm"
              className={filter === type ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}
              onClick={() => setFilter(type)}
            >
              {type === 'all' ? 'All Events' : type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-12 w-12 rounded-full bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-slate-800" />
                  <Skeleton className="h-3 w-1/2 bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <Card className="border-red-500/30 bg-red-950/20">
            <CardContent className="p-6 text-center">
              <p className="text-red-400">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 border-red-500/30 text-red-400">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        {!loading && !error && (
          <div className="space-y-12">
            {Object.entries(groupedByEra).map(([era, eraEvents]) => (
              <div key={era}>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-400" />
                  {era}
                </h2>
                <div className="space-y-4">
                  {eraEvents.map((event, i) => (
                    <Card key={i} className="border border-slate-800/50 bg-slate-900/30 hover:bg-slate-900/50 backdrop-blur-xl transition-all duration-300 hover:border-amber-500/30">
                      <CardContent className="p-4 flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/20">
                              {event.event_type}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {new Date(event.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                            {event.importance >= 8 && (
                              <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-400 border-red-500/20">
                                Major Event
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-white mb-1">{event.title}</h3>
                          {event.description && (
                            <p className="text-xs text-slate-400 line-clamp-2">{event.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {event.entities && (
                              <Link href={`/knowledge-graph?entity=${encodeURIComponent(event.entities.name)}`}>
                                <Badge variant="outline" className="text-xs border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors">
                                  <Network className="h-3 w-3 mr-1" />
                                  {event.entities.name}
                                </Badge>
                              </Link>
                            )}
                            {event.archives && (
                              <Link href={`/documents/${event.archive_id}`}>
                                <Badge variant="outline" className="text-xs border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors">
                                  <Search className="h-3 w-3 mr-1" />
                                  {event.archives.title}
                                </Badge>
                              </Link>
                            )}
                            {event.districts && (
                              <Link href={`/districts/${event.district_id}`}>
                                <Badge variant="outline" className="text-xs border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {event.districts.name}
                                </Badge>
                              </Link>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-600 flex-shrink-0" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
