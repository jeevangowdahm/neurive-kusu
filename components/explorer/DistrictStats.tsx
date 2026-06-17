'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Landmark, FileText, Sparkles, Calendar } from 'lucide-react';

interface DistrictStatsData {
  total_documents: number;
  oldest_year?: number | null;
  average_ocr_confidence?: number;
}

interface DistrictStatsProps {
  districts: DistrictStatsData[];
  isDemo?: boolean;
}

export function DistrictStats({ districts, isDemo = false }: DistrictStatsProps) {
  const totalFiles = districts.reduce((sum, d) => sum + d.total_documents, 0);
  
  const years = districts.map(d => d.oldest_year).filter(Boolean) as number[];
  const oldestYear = years.length > 0 ? Math.min(...years) : 1800;

  const confidences = districts.map(d => d.average_ocr_confidence).filter(Boolean) as number[];
  const avgOcr = confidences.length > 0 ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length : 0.9254;

  const statsItems = [
    { icon: Landmark, label: 'Territories Mapped', value: '31 Districts', detail: 'All divisions cataloged' },
    { icon: FileText, label: 'Historical Records', value: `${totalFiles.toLocaleString()} files`, detail: isDemo ? 'Demo simulation count' : 'Scoped query results' },
    { icon: Calendar, label: 'Earliest Era Epoch', value: `${oldestYear} CE`, detail: 'Colonial & royal records' },
    { icon: Sparkles, label: 'OCR Transcription', value: `${Math.round(avgOcr * 100)}% Quality`, detail: 'Average digitized confidence' }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 select-none font-sans">
      {statsItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Card key={idx} className="border bg-slate-900/10 border-slate-900/60 shadow-sm">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg shrink-0">
                <Icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono truncate">{item.label}</p>
                <h4 className="text-sm sm:text-base font-bold text-slate-200 font-serif leading-tight truncate mt-0.5">{item.value}</h4>
                <p className="text-[9px] text-slate-500 truncate mt-0.5">{item.detail}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
