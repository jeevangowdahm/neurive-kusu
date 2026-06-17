'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderOpen, Search, MessageSquare, ChevronRight, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface CategoryStatsData {
  id: string;
  name: string;
  name_kannada: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  total_documents: number;
  completed_documents: number;
  public_documents: number;
  oldest_year?: number | null;
  newest_year?: number | null;
  average_ocr_confidence?: number;
  top_districts: string[];
  top_languages: string[];
}

interface CategoryCardProps {
  category: CategoryStatsData;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const yearsLabel = category.oldest_year && category.newest_year
    ? `${category.oldest_year} - ${category.newest_year} CE`
    : 'No records';

  return (
    <Card className="bg-slate-900/30 backdrop-blur-sm border border-slate-900 hover:border-slate-800 transition-all hover:shadow-xl overflow-hidden group relative">
      {/* Category Color Accent Top-Trim bar */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: category.color }} />

      <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full min-h-[260px] select-none font-sans pt-6">
        
        {/* Top Segment: Icon, Title & record count badge */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div 
                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border"
                style={{ 
                  backgroundColor: category.color + '15', 
                  borderColor: category.color + '30',
                  boxShadow: `0 0 10px ${category.color}10` 
                }}
              >
                <FolderOpen className="h-5 w-5" style={{ color: category.color }} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-serif leading-none group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-[10px] text-slate-400 kannada-text mt-1">{category.name_kannada}</p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2 italic pt-1">
            &ldquo;{category.description}&rdquo;
          </p>
        </div>

        {/* Middle Segment: Statistics Grid */}
        <div className="grid grid-cols-2 gap-2.5 py-3 border-t border-b border-slate-800/80 border-dashed my-3 text-[10px] text-slate-500 font-mono">
          <div className="space-y-0.5">
            <span>Archived Ledgers</span>
            <span className="font-bold block text-xs font-serif" style={{ color: category.color }}>
              {category.total_documents.toLocaleString()} records
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
              {category.average_ocr_confidence ? `${Math.round(category.average_ocr_confidence * 100)}% Quality` : 'N/A'}
            </span>
          </div>
          <div className="space-y-0.5">
            <span>Top District</span>
            <span className="text-slate-200 font-bold block text-xs truncate">
              {category.top_districts[0] || 'Karnataka'}
            </span>
          </div>
        </div>

        {/* Bottom Segment: Top districts */}
        {category.top_districts.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4 text-[8.5px] text-slate-500 font-mono">
            {category.top_districts.map((dist, i) => (
              <Badge key={i} variant="secondary" className="bg-slate-950/45 text-slate-400 border-slate-850 py-0 px-1.5 font-mono text-[8px]">
                {dist}
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
              className="h-8 text-[10px] font-semibold border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-855 gap-1"
              asChild
            >
              <Link href={`/search?q=*&category=${encodeURIComponent(category.slug)}`}>
                <Search className="h-3 w-3" />
                Search
              </Link>
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[10px] font-semibold border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-855 gap-1"
              asChild
            >
              <Link href={`/chat?category=${encodeURIComponent(category.slug)}`}>
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
            <Link href={`/categories/${encodeURIComponent(category.slug)}`}>
              <BookOpen className="h-3.5 w-3.5" />
              Open Category Catalog
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            </Link>
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
