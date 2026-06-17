'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Map, Landmark, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface DistrictDetailHeaderProps {
  name: string;
  nameKannada: string;
  division: string;
  headquarters: string;
  taluks: number;
  area: number;
  population: number;
}

export function DistrictDetailHeader({
  name,
  nameKannada,
  division,
  headquarters,
  taluks,
  area,
  population
}: DistrictDetailHeaderProps) {
  const divisionColors: Record<string, string> = {
    'Bengaluru': 'from-blue-900/40 via-blue-950/20 to-slate-950 border-blue-500/25',
    'Mysuru': 'from-emerald-900/40 via-emerald-950/20 to-slate-950 border-emerald-500/25',
    'Kittur Karnataka': 'from-rose-900/40 via-rose-950/20 to-slate-950 border-rose-500/25',
    'Belagavi': 'from-rose-900/40 via-rose-950/20 to-slate-950 border-rose-500/25',
    'Kalyana Karnataka': 'from-amber-900/40 via-amber-950/20 to-slate-950 border-amber-500/25',
    'Kalaburagi': 'from-amber-900/40 via-amber-950/20 to-slate-950 border-amber-500/25',
    'Coastal': 'from-cyan-900/40 via-cyan-950/20 to-slate-950 border-cyan-500/25'
  };

  const divisionCrests: Record<string, string> = {
    'Bengaluru': '🛡️',
    'Mysuru': '🦁',
    'Kittur Karnataka': '🐘',
    'Belagavi': '🐘',
    'Kalyana Karnataka': '⚔️',
    'Kalaburagi': '⚔️',
    'Coastal': '⚓'
  };

  const gradientClass = divisionColors[division] || 'from-slate-900/60 to-slate-950 border-slate-800';
  const crest = divisionCrests[division] || '🛡️';

  return (
    <div className="space-y-4 select-none font-sans">
      {/* Return to Map Link */}
      <Link href="/districts" className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
        <ArrowLeft className="h-4.5 w-4.5" />
        Return to Districts Explorer
      </Link>

      <Card className={`bg-gradient-to-br ${gradientClass} border shadow-xl overflow-hidden relative`}>
        {/* Glowing Division Crest Badge */}
        <div className="absolute top-5 right-6 text-4xl opacity-50 select-none animate-pulse">
          {crest}
        </div>

        <CardContent className="p-5 sm:p-6 text-slate-100 flex flex-col justify-between min-h-[140px] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Map className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                {division} Division Dossier
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif leading-none tracking-tight">
              {name}
            </h2>
            <p className="text-sm kannada-text text-slate-400 mt-1.5">{nameKannada}</p>
          </div>

          <div className="pt-3 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10.5px] text-slate-400 font-mono">
            <div>
              <span>Headquarters</span>
              <span className="text-slate-200 font-bold block mt-0.5">{headquarters}</span>
            </div>
            <div>
              <span>Taluks Count</span>
              <span className="text-slate-200 font-bold block mt-0.5">{taluks} Taluks</span>
            </div>
            <div>
              <span>Area Size</span>
              <span className="text-slate-200 font-bold block mt-0.5">{area.toLocaleString()} sq km</span>
            </div>
            <div>
              <span>Population Index</span>
              <span className="text-slate-200 font-bold block mt-0.5">{(population / 100000).toFixed(1)} Lakhs</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
