'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Map, Search, MessageSquare, ChevronRight, Landmark } from 'lucide-react';
import Link from 'next/link';

interface DistrictStatsData {
  id: string;
  name: string;
  name_kannada: string;
  division: string;
  headquarter: string;
  taluk_count: number;
  area_sqkm: number;
  population: number;
  description: string;
  total_documents: number;
  completed_documents: number;
  public_documents: number;
  oldest_year?: number | null;
  newest_year?: number | null;
  average_ocr_confidence?: number;
  top_categories: string[];
  top_languages: string[];
}

interface DistrictCardProps {
  district: DistrictStatsData;
}

export function DistrictCard({ district }: DistrictCardProps) {
  const yearsLabel = district.oldest_year && district.newest_year
    ? `${district.oldest_year} - ${district.newest_year} CE`
    : 'No records';

  const divisionColors: Record<string, string> = {
    'Bengaluru': 'border-blue-500/20 hover:border-blue-500/40 shadow-blue-950/10',
    'Mysuru': 'border-emerald-500/20 hover:border-emerald-500/40 shadow-emerald-950/10',
    'Belagavi': 'border-rose-500/20 hover:border-rose-500/40 shadow-rose-950/10',
    'Kalaburagi': 'border-amber-500/20 hover:border-amber-500/40 shadow-amber-950/10',
    'Coastal': 'border-cyan-500/20 hover:border-cyan-500/40 shadow-cyan-950/10'
  };

  const borderClass = divisionColors[district.division] || 'border-slate-800 hover:border-slate-700';

  return (
    <Card className={`bg-slate-900/30 backdrop-blur-sm border shadow-md transition-all hover:shadow-xl ${borderClass} overflow-hidden group`}>
      <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full min-h-[260px] select-none font-sans">
        
        {/* Top Segment: Title and Division */}
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-serif leading-none group-hover:text-primary transition-colors">
                {district.name}
              </h3>
              <p className="text-[10px] text-slate-400 kannada-text mt-1">{district.name_kannada}</p>
            </div>
            <Badge variant="outline" className="text-[8px] font-mono tracking-wider scale-95 border-slate-800 text-slate-400 bg-slate-950/45">
              {district.division.toUpperCase()}
            </Badge>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2 italic pt-1">
            &ldquo;{district.description}&rdquo;
          </p>
        </div>

        {/* Middle Segment: Statistics Grid */}
        <div className="grid grid-cols-2 gap-2.5 py-3 border-t border-b border-slate-800/80 border-dashed my-3 text-[10px] text-slate-500 font-mono">
          <div className="space-y-0.5">
            <span>Archived Files</span>
            <span className="text-slate-200 font-bold block text-xs font-serif">
              {district.total_documents.toLocaleString()} records
            </span>
          </div>
          <div className="space-y-0.5">
            <span>Historical Era</span>
            <span className="text-slate-200 font-bold block text-xs">
              {yearsLabel}
            </span>
          </div>
          <div className="space-y-0.5">
            <span>OCR Confidence</span>
            <span className="text-slate-200 font-bold block text-xs">
              {district.average_ocr_confidence ? `${Math.round(district.average_ocr_confidence * 100)}% Quality` : 'N/A'}
            </span>
          </div>
          <div className="space-y-0.5">
            <span>Headquarters</span>
            <span className="text-slate-200 font-bold block text-xs truncate">
              {district.headquarter}
            </span>
          </div>
        </div>

        {/* Bottom Segment: Top categories & languages */}
        {district.top_categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4 text-[9px] text-slate-500 font-mono">
            {district.top_categories.map((cat, i) => (
              <Badge key={i} variant="secondary" className="bg-slate-950/45 text-slate-400 border-slate-850 py-0 px-1.5 capitalize font-mono text-[8px]">
                {cat.replace(/-/g, ' ')}
              </Badge>
            ))}
          </div>
        )}

        {/* Buttons Action Cockpit */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[10px] font-semibold border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-850 gap-1"
              asChild
            >
              <Link href={`/search?q=*&district=${encodeURIComponent(district.name)}`}>
                <Search className="h-3 w-3" />
                Search
              </Link>
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[10px] font-semibold border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-850 gap-1"
              asChild
            >
              <Link href={`/chat?district=${encodeURIComponent(district.name)}`}>
                <MessageSquare className="h-3 w-3" />
                Ask AI
              </Link>
            </Button>
          </div>

          <Button
            size="sm"
            className="w-full h-8 text-[10px] font-semibold gap-1"
            asChild
          >
            <Link href={`/districts/${encodeURIComponent(district.name)}`}>
              <Landmark className="h-3.5 w-3.5" />
              Open District Dossier
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            </Link>
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
