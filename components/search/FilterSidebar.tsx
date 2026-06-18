'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { KARNATAKA_DISTRICTS, ARCHIVE_CATEGORIES, HISTORICAL_ERAS } from '@/lib/karnataka-data';
import { Filter, SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp, Layers, Calendar, MapPin, FileText, Users, Shield, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

export interface SearchFiltersValues {
  // Core filters
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
  // Extended filters
  sourceType?: string;
  ocrQuality?: string;
  historicalEra?: string;
  minRelevance?: string;
  maxRelevance?: string;
  fileSizeMin?: string;
  fileSizeMax?: string;
  hasImages?: string;
  hasEntities?: string;
  isVerified?: string;
  contributor?: string;
  tags?: string;
  sortBy?: string;
  sortOrder?: string;
  division?: string;
}

interface FilterSidebarProps {
  filters: SearchFiltersValues;
  onFilterChange: (filters: SearchFiltersValues) => void;
  onClearFilters: () => void;
}

export function FilterSidebar({ filters, onFilterChange, onClearFilters }: FilterSidebarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'all' && v !== '').length;

  const handleChange = (key: keyof SearchFiltersValues, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="w-full lg:w-72 shrink-0 p-5 rounded-xl border border-slate-800/50 bg-slate-900/30 backdrop-blur-xl space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/50">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
          <SlidersHorizontal className="h-4 w-4 text-blue-400" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-[10px] bg-blue-500/20 text-blue-400 border-blue-500/30 px-1.5 py-0">
              {activeFiltersCount}
            </Badge>
          )}
        </span>
        <button
          onClick={onClearFilters}
          className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
          title="Reset Filters"
        >
          <RotateCcw className="h-3 w-3" />
          Clear
        </button>
      </div>

      <div className="space-y-4 text-xs max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin pr-1">
        {/* 1. Division Filter */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5 flex items-center gap-1">
            <Layers className="h-3 w-3" /> Administrative Division
          </label>
          <Select
            value={filters.division || 'all'}
            onValueChange={(v) => handleChange('division', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-slate-900/50 border-slate-800 text-xs text-white">
              <SelectValue placeholder="All Divisions" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all" className="text-xs text-white">All Divisions</SelectItem>
              <SelectItem value="Bengaluru" className="text-xs text-white">Bengaluru Division</SelectItem>
              <SelectItem value="Mysuru" className="text-xs text-white">Mysuru Division</SelectItem>
              <SelectItem value="Belagavi" className="text-xs text-white">Belagavi Division</SelectItem>
              <SelectItem value="Kalaburagi" className="text-xs text-white">Kalaburagi Division</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 2. District Filter */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5 flex items-center gap-1">
            <MapPin className="h-3 w-3" /> District Location
          </label>
          <Select
            value={filters.district || 'all'}
            onValueChange={(v) => handleChange('district', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-slate-900/50 border-slate-800 text-xs text-white">
              <SelectValue placeholder="All Districts" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 max-h-48 overflow-y-auto">
              <SelectItem value="all" className="text-xs text-white">All Districts</SelectItem>
              {KARNATAKA_DISTRICTS.map(d => (
                <SelectItem key={d.id} value={d.name} className="text-xs text-white">
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 3. Category Filter */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5 flex items-center gap-1">
            <FileText className="h-3 w-3" /> Archive Category
          </label>
          <Select
            value={filters.category || 'all'}
            onValueChange={(v) => handleChange('category', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-slate-900/50 border-slate-800 text-xs text-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 max-h-48 overflow-y-auto">
              <SelectItem value="all" className="text-xs text-white">All Categories</SelectItem>
              {ARCHIVE_CATEGORIES.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-xs text-white">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 4. Historical Era Filter */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Historical Era
          </label>
          <Select
            value={filters.historicalEra || 'all'}
            onValueChange={(v) => handleChange('historicalEra', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-slate-900/50 border-slate-800 text-xs text-white">
              <SelectValue placeholder="All Eras" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 max-h-48 overflow-y-auto">
              <SelectItem value="all" className="text-xs text-white">All Eras</SelectItem>
              {HISTORICAL_ERAS.map(era => (
                <SelectItem key={era.id} value={era.id} className="text-xs text-white">
                  {era.name} ({era.years})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 5. Source Type Filter */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">Source Type</label>
          <Select
            value={filters.sourceType || 'all'}
            onValueChange={(v) => handleChange('sourceType', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-slate-900/50 border-slate-800 text-xs text-white">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all" className="text-xs text-white">All Sources</SelectItem>
              <SelectItem value="uploaded" className="text-xs text-white">Uploaded Archives</SelectItem>
              <SelectItem value="government_pdf" className="text-xs text-white">Government Orders</SelectItem>
              <SelectItem value="internet_archive" className="text-xs text-white">Internet Archive</SelectItem>
              <SelectItem value="wikipedia" className="text-xs text-white">Wikipedia</SelectItem>
              <SelectItem value="wikisource" className="text-xs text-white">Wikisource</SelectItem>
              <SelectItem value="open_data" className="text-xs text-white">Open Data Portal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 6. Language Filter */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">Language</label>
          <Select
            value={filters.language || 'all'}
            onValueChange={(v) => handleChange('language', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-slate-900/50 border-slate-800 text-xs text-white">
              <SelectValue placeholder="All Languages" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all" className="text-xs text-white">All Languages</SelectItem>
              <SelectItem value="kannada" className="text-xs text-white">Kannada</SelectItem>
              <SelectItem value="english" className="text-xs text-white">English</SelectItem>
              <SelectItem value="both" className="text-xs text-white">Bilingual</SelectItem>
              <SelectItem value="sanskrit" className="text-xs text-white">Sanskrit</SelectItem>
              <SelectItem value="persian" className="text-xs text-white">Persian</SelectItem>
              <SelectItem value="hindi" className="text-xs text-white">Hindi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 7. Year Range Filter */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">Year Range (CE)</label>
          <div className="flex gap-2">
            <Input
              value={filters.yearFrom}
              type="number"
              placeholder="From"
              onChange={(e) => handleChange('yearFrom', e.target.value)}
              className="h-8 bg-slate-900/50 border-slate-800 text-[11px] text-white focus:border-blue-500/50"
            />
            <Input
              value={filters.yearTo}
              type="number"
              placeholder="To"
              onChange={(e) => handleChange('yearTo', e.target.value)}
              className="h-8 bg-slate-900/50 border-slate-800 text-[11px] text-white focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* 8. Document Type Filter */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">Document Type</label>
          <Select
            value={filters.docType || 'all'}
            onValueChange={(v) => handleChange('docType', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-slate-900/50 border-slate-800 text-xs text-white">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all" className="text-xs text-white">All Types</SelectItem>
              <SelectItem value="pdf" className="text-xs text-white">PDF Document</SelectItem>
              <SelectItem value="image" className="text-xs text-white">Image/Map</SelectItem>
              <SelectItem value="audio" className="text-xs text-white">Audio Recording</SelectItem>
              <SelectItem value="video" className="text-xs text-white">Video/Film</SelectItem>
              <SelectItem value="text" className="text-xs text-white">Text Transcription</SelectItem>
              <SelectItem value="manuscript" className="text-xs text-white">Manuscript</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 9. OCR Quality Filter */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">OCR Quality</label>
          <Select
            value={filters.ocrQuality || 'all'}
            onValueChange={(v) => handleChange('ocrQuality', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-slate-900/50 border-slate-800 text-xs text-white">
              <SelectValue placeholder="All Qualities" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all" className="text-xs text-white">All Qualities</SelectItem>
              <SelectItem value="high" className="text-xs text-white">High (&gt;85%)</SelectItem>
              <SelectItem value="medium" className="text-xs text-white">Medium (60-85%)</SelectItem>
              <SelectItem value="low" className="text-xs text-white">Low (&lt;60%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 10. Visibility Filter */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5 flex items-center gap-1">
            <Shield className="h-3 w-3" /> Access Level
          </label>
          <Select
            value={filters.visibility || 'all'}
            onValueChange={(v) => handleChange('visibility', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-slate-900/50 border-slate-800 text-xs text-white">
              <SelectValue placeholder="All Access Levels" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all" className="text-xs text-white">All Access Levels</SelectItem>
              <SelectItem value="public" className="text-xs text-white">Public Records</SelectItem>
              <SelectItem value="restricted" className="text-xs text-white">Restricted Access</SelectItem>
              <SelectItem value="private" className="text-xs text-white">Private Archives</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 11. Entity Type Filter */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5 flex items-center gap-1">
            <Users className="h-3 w-3" /> Entity Type
          </label>
          <Select
            value={filters.entityType || 'all'}
            onValueChange={(v) => handleChange('entityType', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-slate-900/50 border-slate-800 text-xs text-white">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all" className="text-xs text-white">All Entities</SelectItem>
              <SelectItem value="person" className="text-xs text-white">People</SelectItem>
              <SelectItem value="place" className="text-xs text-white">Places</SelectItem>
              <SelectItem value="event" className="text-xs text-white">Events</SelectItem>
              <SelectItem value="organization" className="text-xs text-white">Organizations</SelectItem>
              <SelectItem value="artifact" className="text-xs text-white">Artifacts</SelectItem>
              <SelectItem value="date" className="text-xs text-white">Historical Dates</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 12. Min OCR Confidence */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">Min OCR Confidence</label>
          <Select
            value={filters.ocrConfidence || 'all'}
            onValueChange={(v) => handleChange('ocrConfidence', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 bg-slate-900/50 border-slate-800 text-xs text-white">
              <SelectValue placeholder="No Limit" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all" className="text-xs text-white">No Limit</SelectItem>
              <SelectItem value="0.5" className="text-xs text-white">Fair (0.5+)</SelectItem>
              <SelectItem value="0.7" className="text-xs text-white">Good (0.7+)</SelectItem>
              <SelectItem value="0.8" className="text-xs text-white">Very Good (0.8+)</SelectItem>
              <SelectItem value="0.9" className="text-xs text-white">Excellent (0.9+)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 13. Sort By Filter */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">Sort Results By</label>
          <Select
            value={filters.sortBy || 'relevance'}
            onValueChange={(v) => handleChange('sortBy', v)}
          >
            <SelectTrigger className="h-8 bg-slate-900/50 border-slate-800 text-xs text-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="relevance" className="text-xs text-white">Relevance Score</SelectItem>
              <SelectItem value="date_desc" className="text-xs text-white">Newest First</SelectItem>
              <SelectItem value="date_asc" className="text-xs text-white">Oldest First</SelectItem>
              <SelectItem value="title_asc" className="text-xs text-white">Title A-Z</SelectItem>
              <SelectItem value="ocr_confidence" className="text-xs text-white">OCR Quality</SelectItem>
              <SelectItem value="district" className="text-xs text-white">District Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 14-15. Upload Date Range */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">Upload Date Range</label>
          <div className="space-y-1.5">
            <Input
              value={filters.uploadedAfter}
              type="date"
              placeholder="From"
              onChange={(e) => handleChange('uploadedAfter', e.target.value)}
              className="h-8 bg-slate-900/50 border-slate-800 text-[11px] text-white focus:border-blue-500/50"
            />
            <Input
              value={filters.uploadedBefore}
              type="date"
              placeholder="To"
              onChange={(e) => handleChange('uploadedBefore', e.target.value)}
              className="h-8 bg-slate-900/50 border-slate-800 text-[11px] text-white focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-[10px] font-bold uppercase text-slate-500 hover:text-white transition-colors py-2"
        >
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Advanced Filters
          </span>
          {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {/* Advanced Filters Section */}
        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t border-slate-800/50">
            {/* 16. Has Images */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">Has Images</label>
              <Select
                value={filters.hasImages || 'all'}
                onValueChange={(v) => handleChange('hasImages', v === 'all' ? '' : v)}
              >
                <SelectTrigger className="h-8 bg-slate-900/50 border-slate-800 text-xs text-white">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all" className="text-xs text-white">Any</SelectItem>
                  <SelectItem value="true" className="text-xs text-white">Yes</SelectItem>
                  <SelectItem value="false" className="text-xs text-white">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 17. Has Entities */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">Has Extracted Entities</label>
              <Select
                value={filters.hasEntities || 'all'}
                onValueChange={(v) => handleChange('hasEntities', v === 'all' ? '' : v)}
              >
                <SelectTrigger className="h-8 bg-slate-900/50 border-slate-800 text-xs text-white">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all" className="text-xs text-white">Any</SelectItem>
                  <SelectItem value="true" className="text-xs text-white">Yes</SelectItem>
                  <SelectItem value="false" className="text-xs text-white">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 18. Is Verified */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">Verified Status</label>
              <Select
                value={filters.isVerified || 'all'}
                onValueChange={(v) => handleChange('isVerified', v === 'all' ? '' : v)}
              >
                <SelectTrigger className="h-8 bg-slate-900/50 border-slate-800 text-xs text-white">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all" className="text-xs text-white">Any</SelectItem>
                  <SelectItem value="true" className="text-xs text-white">Verified Only</SelectItem>
                  <SelectItem value="false" className="text-xs text-white">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 19. Min Relevance Score */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">Min Relevance Score</label>
              <Select
                value={filters.minRelevance || 'all'}
                onValueChange={(v) => handleChange('minRelevance', v === 'all' ? '' : v)}
              >
                <SelectTrigger className="h-8 bg-slate-900/50 border-slate-800 text-xs text-white">
                  <SelectValue placeholder="No Limit" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all" className="text-xs text-white">No Limit</SelectItem>
                  <SelectItem value="0.3" className="text-xs text-white">0.3+ Low</SelectItem>
                  <SelectItem value="0.5" className="text-xs text-white">0.5+ Medium</SelectItem>
                  <SelectItem value="0.7" className="text-xs text-white">0.7+ High</SelectItem>
                  <SelectItem value="0.9" className="text-xs text-white">0.9+ Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 20. Contributor */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">Contributor</label>
              <Input
                value={filters.contributor}
                type="text"
                placeholder="Search by contributor..."
                onChange={(e) => handleChange('contributor', e.target.value)}
                className="h-8 bg-slate-900/50 border-slate-800 text-[11px] text-white focus:border-blue-500/50"
              />
            </div>

            {/* 21. Tags */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">Tags (comma-separated)</label>
              <Input
                value={filters.tags}
                type="text"
                placeholder="inscription, temple, grant"
                onChange={(e) => handleChange('tags', e.target.value)}
                className="h-8 bg-slate-900/50 border-slate-800 text-[11px] text-white focus:border-blue-500/50"
              />
            </div>

            {/* 22. File Size Range */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">File Size (MB)</label>
              <div className="flex gap-2">
                <Input
                  value={filters.fileSizeMin}
                  type="number"
                  placeholder="Min"
                  step="0.1"
                  onChange={(e) => handleChange('fileSizeMin', e.target.value)}
                  className="h-8 bg-slate-900/50 border-slate-800 text-[11px] text-white focus:border-blue-500/50"
                />
                <Input
                  value={filters.fileSizeMax}
                  type="number"
                  placeholder="Max"
                  step="0.1"
                  onChange={(e) => handleChange('fileSizeMax', e.target.value)}
                  className="h-8 bg-slate-900/50 border-slate-800 text-[11px] text-white focus:border-blue-500/50"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
