'use client';

import React from 'react';
import { Search, SlidersHorizontal, RefreshCw, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { KARNATAKA_DISTRICTS, ARCHIVE_CATEGORIES } from '@/lib/mock-data';

interface GraphControlsProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  nodeType: string;
  setNodeType: (type: string) => void;
  minStrength: number;
  setMinStrength: (s: number) => void;
  district: string;
  setDistrict: (d: string) => void;
  category: string;
  setCategory: (c: string) => void;
  yearFrom: string;
  setYearFrom: (y: string) => void;
  yearTo: string;
  setYearTo: (y: string) => void;
  onGenerate: () => void;
  userRole: string;
  isGenerating: boolean;
}

export function GraphControls({
  searchQuery,
  setSearchQuery,
  nodeType,
  setNodeType,
  minStrength,
  setMinStrength,
  district,
  setDistrict,
  category,
  setCategory,
  yearFrom,
  setYearFrom,
  yearTo,
  setYearTo,
  onGenerate,
  userRole,
  isGenerating
}: GraphControlsProps) {
  const nodeTypes = [
    { value: 'all', label: 'All Node Types' },
    { value: 'person', label: 'People' },
    { value: 'place', label: 'Places' },
    { value: 'event', label: 'Events' },
    { value: 'organization', label: 'Organizations' },
    { value: 'date', label: 'Dates' },
    { value: 'artifact', label: 'Artifacts' },
    { value: 'Document', label: 'Registry Documents' }
  ];

  const canGenerate = ['admin', 'archivist'].includes(userRole?.toLowerCase());

  return (
    <div className="bg-slate-900/35 border border-slate-800 rounded-xl p-4 sm:p-5 backdrop-blur-md space-y-4 shadow-xl select-none font-sans">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <h3 className="text-xs font-bold text-slate-200 font-mono tracking-wider flex items-center gap-1.5">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          GRAPH QUERY CONTROLS
        </h3>
        
        {/* restricted generate button (Safeguard 8) */}
        {canGenerate && (
          <Button
            size="sm"
            onClick={onGenerate}
            disabled={isGenerating}
            className="h-8 text-[10px] font-semibold font-mono gap-1.5 px-3 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
          >
            <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'REGENERATE RELATIONSHIPS'}
          </Button>
        )}
      </div>

      {/* Input Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
        <Input
          placeholder="Search node names (e.g. Tipu Sultan, Mysuru)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-8.5 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-primary focus-visible:border-primary text-xs"
        />
      </div>

      {/* Selects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Node Type filter */}
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Node Classification</label>
          <select
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary h-8.5"
          >
            {nodeTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* District selector */}
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Origin District</label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary h-8.5"
          >
            <option value="all">All Districts</option>
            {KARNATAKA_DISTRICTS.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Category selector */}
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Archival Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary h-8.5"
          >
            <option value="all">All Categories</option>
            {ARCHIVE_CATEGORIES.map(c => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Year Range Inputs & Strength Slider */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        {/* Year From */}
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Year From (CE)</label>
          <Input
            type="number"
            placeholder="1399"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
            className="h-8.5 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-655 focus-visible:ring-primary text-xs"
          />
        </div>

        {/* Year To */}
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Year To (CE)</label>
          <Input
            type="number"
            placeholder="2024"
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value)}
            className="h-8.5 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-655 focus-visible:ring-primary text-xs"
          />
        </div>

        {/* Strength Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-[9px] text-slate-500 font-mono uppercase tracking-wider">
            <span>Min Link Strength</span>
            <span className="text-slate-300 font-semibold">{Math.round(minStrength * 100)}%</span>
          </div>
          <div className="pt-2">
            <Slider
              min={0.0}
              max={1.0}
              step={0.05}
              value={[minStrength]}
              onValueChange={(val) => setMinStrength(val[0])}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
