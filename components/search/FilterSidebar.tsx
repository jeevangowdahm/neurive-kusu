'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ARCHIVE_CATEGORIES, KARNATAKA_DISTRICTS } from '@/lib/mock-data';
import { Filter, SlidersHorizontal, RotateCcw } from 'lucide-react';

export interface SearchFiltersValues {
  category: string;
  district: string;
  language: string;
  yearFrom: string;
  yearTo: string;
  ocrConfidence: string;
  docType: string;
  visibility: string;
  entityType: string;
  uploadedAfter: string;
  uploadedBefore: string;
  sourceType?: string;
  ocrQuality?: string;
}

interface FilterSidebarProps {
  filters: SearchFiltersValues;
  onFilterChange: (filters: SearchFiltersValues) => void;
  onClearFilters: () => void;
}

export function FilterSidebar({ filters, onFilterChange, onClearFilters }: FilterSidebarProps) {
  
  const handleChange = (key: keyof SearchFiltersValues, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="w-full lg:w-64 shrink-0 p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md space-y-5 select-none animate-slide-up text-foreground">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Advanced Filters
        </span>
        <button 
          onClick={onClearFilters}
          className="text-[10px] text-muted-foreground hover:text-rose-400 flex items-center gap-1 transition-colors"
          title="Reset Filters"
        >
          <RotateCcw className="h-3 w-3" />
          Clear
        </button>
      </div>

      <div className="space-y-4 text-xs">
        {/* Source Type Filter */}
        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1 block">Archive Source Type</label>
          <Select 
            value={filters.sourceType || 'all'} 
            onValueChange={(v) => handleChange('sourceType', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-white/5 border-white/10 text-xs text-foreground">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="all" className="text-xs text-foreground">All Sources</SelectItem>
              <SelectItem value="uploaded" className="text-xs text-foreground">📁 Uploaded Archives</SelectItem>
              <SelectItem value="government_pdf" className="text-xs text-foreground">🏛 Government Orders</SelectItem>
              <SelectItem value="internet_archive" className="text-xs text-foreground">Layers Internet Archive</SelectItem>
              <SelectItem value="wikipedia" className="text-xs text-foreground">🌐 Wikipedia Articles</SelectItem>
              <SelectItem value="wikisource" className="text-xs text-foreground">✍ Wikisource Texts</SelectItem>
              <SelectItem value="open_data" className="text-xs text-foreground">📊 Open Data Portal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* OCR Quality Filter */}
        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1 block">OCR Quality Range</label>
          <Select 
            value={filters.ocrQuality || 'all'} 
            onValueChange={(v) => handleChange('ocrQuality', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-white/5 border-white/10 text-xs text-foreground">
              <SelectValue placeholder="All Qualities" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="all" className="text-xs text-foreground">All Qualities</SelectItem>
              <SelectItem value="high" className="text-xs text-foreground">🟢 High (&gt;85%)</SelectItem>
              <SelectItem value="medium" className="text-xs text-foreground">🟡 Medium (60%-85%)</SelectItem>
              <SelectItem value="low" className="text-xs text-foreground">🔴 Low (&lt;60%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* District */}
        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1 block">District Location</label>
          <Select 
            value={filters.district || 'all'} 
            onValueChange={(v) => handleChange('district', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-white/5 border-white/10 text-xs text-foreground">
              <SelectValue placeholder="All Districts" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 max-h-48 overflow-y-auto">
              <SelectItem value="all" className="text-xs text-foreground">All Districts</SelectItem>
              {KARNATAKA_DISTRICTS.map(d => (
                <SelectItem key={d.id} value={d.name} className="text-xs text-foreground">
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1 block">Archival Category</label>
          <Select 
            value={filters.category || 'all'} 
            onValueChange={(v) => handleChange('category', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-white/5 border-white/10 text-xs text-foreground">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 max-h-48 overflow-y-auto">
              <SelectItem value="all" className="text-xs text-foreground">All Categories</SelectItem>
              {ARCHIVE_CATEGORIES.map(c => (
                <SelectItem key={c.id} value={c.slug} className="text-xs text-foreground">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1 block">Language</label>
          <Select 
            value={filters.language || 'all'} 
            onValueChange={(v) => handleChange('language', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-white/5 border-white/10 text-xs text-foreground">
              <SelectValue placeholder="All Languages" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="all" className="text-xs text-foreground">All Languages</SelectItem>
              <SelectItem value="kannada" className="text-xs text-foreground">Kannada (ಕನ್ನಡ)</SelectItem>
              <SelectItem value="english" className="text-xs text-foreground">English</SelectItem>
              <SelectItem value="both" className="text-xs text-foreground">Bilingual</SelectItem>
              <SelectItem value="other" className="text-xs text-foreground">Other (Sanskrit/Hindi)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Year Range */}
        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1 block">Year Range (CE)</label>
          <div className="flex gap-2">
            <Input 
              value={filters.yearFrom}
              type="number"
              placeholder="From"
              onChange={(e) => handleChange('yearFrom', e.target.value)}
              className="h-8 bg-white/5 border-white/10 text-[11px] text-foreground focus:border-primary/50"
            />
            <Input 
              value={filters.yearTo}
              type="number"
              placeholder="To"
              onChange={(e) => handleChange('yearTo', e.target.value)}
              className="h-8 bg-white/5 border-white/10 text-[11px] text-foreground focus:border-primary/50"
            />
          </div>
        </div>

        {/* Document Type */}
        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1 block">Document Type</label>
          <Select 
            value={filters.docType || 'all'} 
            onValueChange={(v) => handleChange('docType', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-white/5 border-white/10 text-xs text-foreground">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="all" className="text-xs text-foreground">All Types</SelectItem>
              <SelectItem value="document" className="text-xs text-foreground">📄 Document PDF</SelectItem>
              <SelectItem value="image" className="text-xs text-foreground">🗺 Image/Map</SelectItem>
              <SelectItem value="audio" className="text-xs text-foreground">🔊 Oral History Speech</SelectItem>
              <SelectItem value="video" className="text-xs text-foreground">🎥 Film Newsreel</SelectItem>
              <SelectItem value="text" className="text-xs text-foreground">✍ Text Transcription</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Visibility */}
        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1 block">Access Visibility</label>
          <Select 
            value={filters.visibility || 'all'} 
            onValueChange={(v) => handleChange('visibility', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-white/5 border-white/10 text-xs text-foreground">
              <SelectValue placeholder="All Visibilities" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="all" className="text-xs text-foreground">All Visibilities</SelectItem>
              <SelectItem value="public" className="text-xs text-foreground">🌐 Public Records</SelectItem>
              <SelectItem value="restricted" className="text-xs text-foreground">🔒 Restricted Accounts</SelectItem>
              <SelectItem value="private" className="text-xs text-foreground">💼 Private Ledger</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Entity Type Filter */}
        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1 block">Entity Type Matching</label>
          <Select 
            value={filters.entityType || 'all'} 
            onValueChange={(v) => handleChange('entityType', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-white/5 border-white/10 text-xs text-foreground">
              <SelectValue placeholder="All Entity Types" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="all" className="text-xs text-foreground">All Entity Types</SelectItem>
              <SelectItem value="person" className="text-xs text-foreground">👤 People</SelectItem>
              <SelectItem value="place" className="text-xs text-foreground">📍 Locations</SelectItem>
              <SelectItem value="event" className="text-xs text-foreground">⚔ Events</SelectItem>
              <SelectItem value="organization" className="text-xs text-foreground">🏛 Organizations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* OCR Confidence threshold */}
        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1 block">Min OCR Confidence</label>
          <Select 
            value={filters.ocrConfidence || 'all'} 
            onValueChange={(v) => handleChange('ocrConfidence', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-white/5 border-white/10 text-xs text-foreground">
              <SelectValue placeholder="No Limit" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="all" className="text-xs text-foreground">No Limit (0.0+)</SelectItem>
              <SelectItem value="0.5" className="text-xs text-foreground">Fair (0.5+)</SelectItem>
              <SelectItem value="0.8" className="text-xs text-foreground">Good (0.8+)</SelectItem>
              <SelectItem value="0.9" className="text-xs text-foreground">Excellent (0.9+)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Upload Date Range */}
        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1 block">Ingested Date Range</label>
          <div className="space-y-1.5">
            <Input 
              value={filters.uploadedAfter}
              type="date"
              onChange={(e) => handleChange('uploadedAfter', e.target.value)}
              className="h-8 bg-white/5 border-white/10 text-[11px] text-foreground focus:border-primary/50"
            />
            <Input 
              value={filters.uploadedBefore}
              type="date"
              onChange={(e) => handleChange('uploadedBefore', e.target.value)}
              className="h-8 bg-white/5 border-white/10 text-[11px] text-foreground focus:border-primary/50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
