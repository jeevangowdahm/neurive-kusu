'use client';

import React from 'react';
import { User, MapPin, Calendar, Building2, BookOpen, Search, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Entity {
  id: string;
  entity_name?: string;
  name?: string;
  entity_type: 'person' | 'place' | 'event' | 'organization' | 'date' | 'artifact';
  page_number?: number;
  confidence_score?: number;
}

interface EntitiesTabProps {
  entities: Entity[];
}

export function EntitiesTab({ entities }: EntitiesTabProps) {
  const typeConfigs = {
    person: { icon: User, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', label: 'People' },
    place: { icon: MapPin, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20', label: 'Places' },
    event: { icon: Calendar, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Events' },
    organization: { icon: Building2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Organizations' },
    date: { icon: Calendar, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Dates' },
    artifact: { icon: BookOpen, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', label: 'Artifacts' }
  };

  // Group entities by type
  const grouped = entities.reduce((acc: Record<string, Entity[]>, ent) => {
    const type = (ent.entity_type || 'person').toLowerCase();
    if (acc[type]) {
      acc[type].push(ent);
    } else {
      acc['person'].push(ent); // fallback
    }
    return acc;
  }, {
    person: [] as Entity[],
    place: [] as Entity[],
    event: [] as Entity[],
    organization: [] as Entity[],
    date: [] as Entity[],
    artifact: [] as Entity[]
  });

  const activeTypes = Object.entries(grouped).filter(([_, items]) => items.length > 0);

  if (entities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 gap-3 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
        <Sparkles className="h-8 w-8 text-slate-600 animate-pulse" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-200">No Entities Extracted</p>
          <p className="text-xs text-slate-500 max-w-xs">No historical entities (people, places, dates) have been index-extracted from this record.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {activeTypes.map(([type, items]) => {
        const config = typeConfigs[type as keyof typeof typeConfigs] || typeConfigs.person;
        const Icon = config.icon;

        return (
          <div key={type} className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <div className={`p-1 rounded border ${config.color.split(' ')[1]} ${config.color.split(' ')[2]}`}>
                <Icon className={`h-3.5 w-3.5 ${config.color.split(' ')[0]}`} />
              </div>
              <h3 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
                {config.label} ({items.length})
              </h3>
            </div>

            <div className="grid gap-2">
              {items.map((ent, idx) => {
                const name = ent.entity_name || ent.name || 'Unnamed Entity';
                const confidence = ent.confidence_score ? Math.round(Number(ent.confidence_score) * 100) : 80;
                const pageNum = ent.page_number || 1;

                return (
                  <Card key={`${name}-${idx}`} className="bg-slate-900/30 border-slate-800 hover:border-slate-700/60 transition-colors">
                    <CardContent className="p-3 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-slate-200">{name}</div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <span>Page {pageNum}</span>
                          <span>•</span>
                          <span>Score: {confidence}%</span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-slate-850"
                        asChild
                      >
                        <Link href={`/search?query=${encodeURIComponent(name)}`} title={`Search registry for "${name}"`}>
                          <Search className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
