'use client';

import { Activity, Clock, Zap, Target, MapPin, Brain } from 'lucide-react';

interface SearchAnalyticsProps {
  totalResults: number;
  responseTimeMs: number;
  bestScore: number;
  searchMode: string;
  districtsCount: number;
  entitiesCount: number;
}

export function SearchAnalytics({
  totalResults,
  responseTimeMs,
  bestScore,
  searchMode,
  districtsCount,
  entitiesCount
}: SearchAnalyticsProps) {
  
  const scorePct = Math.round(bestScore * 100);

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-xs text-muted-foreground select-none animate-slide-up">
      
      {/* 1. Ingestion Search Mode */}
      <div className="space-y-1">
        <span className="flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider text-muted-foreground">
          <Activity className="h-3.5 w-3.5 text-primary" />
          Engine Mode
        </span>
        <p className="font-bold text-white tracking-wide truncate">{searchMode}</p>
      </div>

      {/* 2. Total Results */}
      <div className="space-y-1">
        <span className="flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider text-muted-foreground">
          <Target className="h-3.5 w-3.5 text-primary" />
          Matches Found
        </span>
        <p className="font-bold text-white font-mono">{totalResults} Documents</p>
      </div>

      {/* 3. Search Time */}
      <div className="space-y-1">
        <span className="flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-primary" />
          Execution Time
        </span>
        <p className="font-bold text-white font-mono">{responseTimeMs} ms</p>
      </div>

      {/* 4. Best Score */}
      <div className="space-y-1">
        <span className="flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-primary" />
          Best Relevance
        </span>
        <p className="font-bold text-white font-mono">{scorePct}%</p>
      </div>

      {/* 5. Matching Districts */}
      <div className="space-y-1">
        <span className="flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Mapped Regions
        </span>
        <p className="font-bold text-white font-mono">{districtsCount} Districts</p>
      </div>

      {/* 6. Matching Entities */}
      <div className="space-y-1">
        <span className="flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider text-muted-foreground">
          <Brain className="h-3.5 w-3.5 text-primary" />
          NER Matches
        </span>
        <p className="font-bold text-white font-mono">{entitiesCount} Entities</p>
      </div>

    </div>
  );
}
