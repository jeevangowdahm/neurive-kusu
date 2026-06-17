'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Map, Search, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/app-layout';
import { toast } from 'sonner';

// Reusable components
import { DistrictCard } from '@/components/explorer/DistrictCard';
import { DistrictStats } from '@/components/explorer/DistrictStats';
import { ExplorerEmptyState } from '@/components/explorer/ExplorerEmptyState';

import { ARCHIVE_CATEGORIES_ALL } from '@/lib/districts-categories-data';

function DistrictsExplorerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [districts, setDistricts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [userRole, setUserRole] = useState('guest');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [activeDivision, setActiveDivision] = useState<string | null>(null);

  // sound FX
  const soundEnabled = () => localStorage.getItem('neurive_sound_fx') === 'true';

  // Fetch districts list
  useEffect(() => {
    async function loadDistricts() {
      setLoading(true);
      try {
        const res = await fetch('/api/districts');
        if (!res.ok) throw new Error('Failed to load district data');
        const data = await res.json();
        if (data.success) {
          setDistricts(data.districts || []);
          setIsDemo(!!data.isDemo);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load geographical statistics');
      } finally {
        setLoading(false);
      }
    }
    loadDistricts();
  }, []);

  // Fetch user role
  useEffect(() => {
    async function fetchUserRole() {
      try {
        const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
        if (user) {
          const { data: profile } = await import('@/lib/supabase').then(m => m.supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()
          );
          if (profile) setUserRole(profile.role);
        }
      } catch {}
    }
    fetchUserRole();
  }, []);

  // Filter districts list client-side based on search inputs
  const filteredDistricts = districts.filter((dist) => {
    // Search match
    const matchesSearch = dist.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dist.name_kannada.includes(searchQuery);
    
    // Division filter match
    const matchesDivision = !activeDivision || dist.division === activeDivision;

    // Category filter match
    const matchesCategory = categoryFilter === 'all' || 
                            (dist.top_categories || []).includes(categoryFilter);

    // Language filter match
    const matchesLanguage = languageFilter === 'all' || 
                            (dist.top_languages || []).some((l: string) => l.toLowerCase() === languageFilter.toLowerCase());

    return matchesSearch && matchesDivision && matchesCategory && matchesLanguage;
  });

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-sans bg-slate-950 text-slate-100 min-h-[calc(100vh-4rem)]">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground font-serif">Geographical District Explorer</h1>
              <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary">Map & Grid</Badge>
            </div>
            <p className="text-xs text-slate-400">
              Traverse Karnataka divisions and inspect historical archives regionally.
            </p>
          </div>
        </div>

        {/* Demo Watermark Banner */}
        {isDemo && (
          <div className="bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[10px] px-3 py-1.5 rounded-md font-mono flex items-center gap-1.5 w-fit select-none animate-pulse">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>Virtual Geographic Demo: Displaying simulated archive statistics across all 31 districts.</span>
          </div>
        )}

        {/* Global Statistics Cockpit */}
        {!loading && districts.length > 0 && (
          <DistrictStats districts={districts} isDemo={isDemo} />
        )}

        {/* Filter Toolbar */}
        <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-4 space-y-3 shadow-xl backdrop-blur-md select-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <Input
                placeholder="Search district name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-slate-950 border-slate-850 text-slate-200 placeholder:text-slate-655 focus-visible:ring-primary text-xs"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-850 text-slate-300 text-xs rounded-md px-2 py-1 h-9 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Top Categories</option>
              {ARCHIVE_CATEGORIES_ALL.map(c => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>

            {/* Language Filter */}
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="bg-slate-950 border border-slate-850 text-slate-300 text-xs rounded-md px-2 py-1 h-9 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Languages</option>
              <option value="kannada">Kannada</option>
              <option value="english">English</option>
              <option value="both">Both</option>
            </select>

            {/* Division Filter */}
            <select
              value={activeDivision || 'all'}
              onChange={(e) => setActiveDivision(e.target.value === 'all' ? null : e.target.value)}
              className="bg-slate-950 border border-slate-850 text-slate-300 text-xs rounded-md px-2 py-1 h-9 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Divisions</option>
              <option value="Bengaluru">Bengaluru Division</option>
              <option value="Mysuru">Mysuru Division</option>
              <option value="Belagavi">Belagavi Division</option>
              <option value="Kalaburagi">Kalaburagi Division</option>
              <option value="Coastal">Coastal Division</option>
            </select>
          </div>
        </div>

        {/* Cockpit Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left panel: Outline SVG division map */}
          <div className="lg:col-span-1 border border-slate-900 bg-slate-900/10 rounded-xl p-5 shadow flex flex-col items-center select-none">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 font-mono">Karnataka Interactive Divisions</span>
            
            <div className="relative w-full h-[320px] bg-slate-950/40 border border-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full p-2" viewBox="0 0 200 200">
                
                {/* Division 1: Kittur / Belagavi (North West) */}
                <path 
                  d="M 20,40 L 80,30 L 100,70 L 60,110 L 25,90 Z" 
                  fill={activeDivision === 'Belagavi' ? 'rgba(244,63,94,0.25)' : 'rgba(244,63,94,0.05)'} 
                  stroke="rgba(244,63,94,0.6)" 
                  strokeWidth="1.5"
                  className="cursor-pointer transition-all duration-300 hover:fill-rose-500/20"
                  onClick={() => {
                    setActiveDivision(activeDivision === 'Belagavi' ? null : 'Belagavi');
                  }}
                />

                {/* Division 2: Kalyana / Kalaburagi (North East) */}
                <path 
                  d="M 80,30 L 170,20 L 180,80 L 130,110 L 100,70 Z" 
                  fill={activeDivision === 'Kalaburagi' ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.05)'} 
                  stroke="rgba(245,158,11,0.6)" 
                  strokeWidth="1.5"
                  className="cursor-pointer transition-all duration-300 hover:fill-amber-500/20"
                  onClick={() => {
                    setActiveDivision(activeDivision === 'Kalaburagi' ? null : 'Kalaburagi');
                  }}
                />

                {/* Division 3: Coastal Karnataka */}
                <path 
                  d="M 25,90 L 60,110 L 45,155 L 20,130 Z" 
                  fill={activeDivision === 'Coastal' ? 'rgba(6,182,212,0.25)' : 'rgba(6,182,212,0.05)'} 
                  stroke="rgba(6,182,212,0.6)" 
                  strokeWidth="1.5"
                  className="cursor-pointer transition-all duration-300 hover:fill-cyan-500/20"
                  onClick={() => {
                    setActiveDivision(activeDivision === 'Coastal' ? null : 'Coastal');
                  }}
                />

                {/* Division 4: Mysuru */}
                <path 
                  d="M 60,110 L 110,120 L 100,180 L 45,155 Z" 
                  fill={activeDivision === 'Mysuru' ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.05)'} 
                  stroke="rgba(16,185,129,0.6)" 
                  strokeWidth="1.5"
                  className="cursor-pointer transition-all duration-300 hover:fill-emerald-500/20"
                  onClick={() => {
                    setActiveDivision(activeDivision === 'Mysuru' ? null : 'Mysuru');
                  }}
                />

                {/* Division 5: Bengaluru */}
                <path 
                  d="M 110,120 L 130,110 L 180,140 L 150,185 L 100,180 Z" 
                  fill={activeDivision === 'Bengaluru' ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.05)'} 
                  stroke="rgba(59,130,246,0.6)" 
                  strokeWidth="1.5"
                  className="cursor-pointer transition-all duration-300 hover:fill-blue-500/20"
                  onClick={() => {
                    setActiveDivision(activeDivision === 'Bengaluru' ? null : 'Bengaluru');
                  }}
                />

                {/* Labels */}
                <text x="35" y="65" className="fill-slate-400 font-bold text-[7px] pointer-events-none font-mono">BELAGAVI</text>
                <text x="110" y="55" className="fill-slate-400 font-bold text-[7px] pointer-events-none font-mono">KALABURAGI</text>
                <text x="18" y="112" className="fill-slate-400 font-bold text-[6px] pointer-events-none font-mono rotate-45">COASTAL</text>
                <text x="65" y="145" className="fill-slate-400 font-bold text-[7px] pointer-events-none font-mono">MYSURU</text>
                <text x="125" y="155" className="fill-slate-400 font-bold text-[7px] pointer-events-none font-mono">BENGALURU</text>
              </svg>
            </div>
            <p className="text-[9.5px] text-slate-500 leading-relaxed mt-4 text-center">
              Click division sectors to filter the cards deck. Greyed boundaries map geographic taluk counts.
            </p>
          </div>

          {/* Right panel: Districts list cards */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-16 gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <span className="text-xs text-slate-500 font-mono">Ingesting territories...</span>
              </div>
            ) : filteredDistricts.length === 0 ? (
              <ExplorerEmptyState userRole={userRole} type="district" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
                {filteredDistricts.map((dist) => (
                  <DistrictCard key={dist.id} district={dist} />
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </AppLayout>
  );
}

export default function DistrictsExplorerPage() {
  return (
    <Suspense fallback={<AppLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></AppLayout>}>
      <DistrictsExplorerContent />
    </Suspense>
  );
}
