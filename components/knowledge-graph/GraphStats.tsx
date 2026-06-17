'use client';

import React from 'react';
import { Network, Database, UserCheck, MapPinCheck, Building2, Flame, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Stats {
  totalEntities: number;
  totalRelationships: number;
  topConnectedPerson: string;
  topConnectedPlace: string;
  topDistrict: string;
  strongestRelationship: string;
  documentsRepresented: number;
}

interface GraphStatsProps {
  stats: Stats;
}

export function GraphStats({ stats }: GraphStatsProps) {
  const cards = [
    { label: 'Total Entities', value: stats.totalEntities, icon: Database, color: 'text-rose-400 bg-rose-500/10' },
    { label: 'Relationships', value: stats.totalRelationships, icon: Network, color: 'text-teal-400 bg-teal-500/10' },
    { label: 'Represented Docs', value: stats.documentsRepresented, icon: Layers, color: 'text-sky-400 bg-sky-500/10' },
    { label: 'Central Person', value: stats.topConnectedPerson || 'None', icon: UserCheck, color: 'text-blue-400 bg-blue-500/10' },
    { label: 'Central Hub', value: stats.topConnectedPlace || 'None', icon: MapPinCheck, color: 'text-emerald-400 bg-emerald-500/10' },
    { label: 'Active Region', value: stats.topDistrict || 'Karnataka', icon: Building2, color: 'text-purple-400 bg-purple-500/10' },
    { label: 'Strongest Association', value: stats.strongestRelationship || 'None', icon: Flame, color: 'text-amber-400 bg-amber-500/10', fullWidth: true }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 select-none font-sans">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isFull = card.fullWidth;
        const valStr = typeof card.value === 'number' ? card.value.toLocaleString() : String(card.value);

        return (
          <Card 
            key={idx} 
            className={`bg-slate-900/35 border-slate-800 backdrop-blur-md hover:border-slate-700/60 transition-all ${
              isFull ? 'col-span-2 md:col-span-3 lg:col-span-6' : ''
            }`}
          >
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{card.label}</p>
                <h4 className="text-xs font-bold text-slate-200 mt-0.5 truncate max-w-full font-mono">
                  {valStr}
                </h4>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
