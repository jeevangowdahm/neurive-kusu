'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { FolderOpen, Search, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/app-layout';
import { toast } from 'sonner';
import { ARCHIVE_CATEGORIES_ALL, normalizeCategorySlug, normalizeDistrictName } from '@/lib/districts-categories-data';

// Reusable components
import { CategoryCard } from '@/components/explorer/CategoryCard';
import { CategoryStats } from '@/components/explorer/CategoryStats';
import { ExplorerEmptyState } from '@/components/explorer/ExplorerEmptyState';

function CategoriesExplorerContent() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [userRole, setUserRole] = useState('guest');
  const [hoveredCategory, setHoveredCategory] = useState<any>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [apiFailed, setApiFailed] = useState(false);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch categories stats
  async function loadCategories() {
    setLoading(true);
    setApiFailed(false);
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to load category data');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
        setIsDemo(!!data.isDemo);
      } else {
        throw new Error(data.error || 'Failed response');
      }
    } catch (err) {
      console.error(err);
      setApiFailed(true);
      toast.error('Failed to load category statistics');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
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

  // Seed demo data handler
  const handleSeedDemoData = async () => {
    const toastId = toast.loading('Seeding stable demo Karnataka documents...');
    try {
      const res = await fetch('/api/admin/demo-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Idempotent seed complete. Mapped pages and entities.', { id: toastId });
        await loadCategories();
      } else {
        toast.error(data.error || 'Failed to seed data', { id: toastId });
      }
    } catch (err) {
      toast.error('Network error during seeding', { id: toastId });
    }
  };

  // Filter categories client-side
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cat.name_kannada.includes(searchQuery);
    const matchesSelectedSegment = !selectedCategorySlug || cat.slug === selectedCategorySlug;
    return matchesSearch && matchesSelectedSegment;
  });

  const totalDocs = categories.reduce((sum, c) => sum + (c.total_documents || 0), 0);
  const totalDocsForDonut = totalDocs || 1; // Fallback to avoid divide-by-zero
  let accumulatedPercent = 0;
  
  const segments = categories.map((cat) => {
    const count = cat.total_documents || 0;
    const percent = count / totalDocsForDonut;
    const dashArray = `${percent * 188.5} 188.5`;
    const dashOffset = -accumulatedPercent * 188.5;
    accumulatedPercent += percent;
    return {
      ...cat,
      percent,
      dashArray,
      dashOffset
    };
  });

  const isArchiveEmpty = !loading && !apiFailed && categories.length > 0 && totalDocs === 0;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-sans bg-slate-950 text-slate-100 min-h-[calc(100vh-4rem)]">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground font-serif">Topical Category Explorer</h1>
              <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary">Catalog Subjects</Badge>
            </div>
            <p className="text-xs text-slate-400">
              Browse archive category folders covering Karnataka's complete historical records.
            </p>
          </div>
        </div>

        {/* Demo Watermark Banner */}
        {isDemo && !isArchiveEmpty && (
          <div className="bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[10px] px-3 py-1.5 rounded-md font-mono flex items-center gap-1.5 w-fit select-none animate-pulse">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>Virtual Category Demo: Displaying simulated archive statistics across all 16 catalog subjects.</span>
          </div>
        )}

        {/* Empty State Banner */}
        {isArchiveEmpty && (
          <div className="border border-slate-900 bg-slate-900/20 rounded-xl p-6 text-center max-w-2xl mx-auto space-y-4 shadow-lg animate-slide-up">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-serif">No Documents Mapped Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                No documents indexed yet for this category. Upload or seed demo data to begin.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button onClick={() => window.location.href = '/search'} size="sm" className="h-8 text-[11px] bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200">
                Search Archives
              </Button>
              <Button onClick={() => window.location.href = '/upload'} size="sm" className="h-8 text-[11px] bg-primary text-primary-foreground hover:bg-primary/90">
                Upload Document
              </Button>
              {userRole === 'admin' && (
                <Button onClick={handleSeedDemoData} size="sm" className="h-8 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white">
                  Seed Demo Data
                </Button>
              )}
            </div>
          </div>
        )}

        {/* API Failure Fallback Box */}
        {apiFailed && (
          <div className="border border-rose-500/20 bg-rose-500/5 rounded-xl p-6 text-center max-w-md mx-auto space-y-4 shadow-xl">
            <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-rose-300">API Connection Inoperable</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We are unable to reach the category indexing server. You can browse using local static fallback configurations.
              </p>
            </div>
            <Button 
              onClick={() => {
                const fallbackData = ARCHIVE_CATEGORIES_ALL.map(cat => ({
                  ...cat,
                  total_documents: 0,
                  completed_documents: 0,
                  public_documents: 0,
                  oldest_year: null,
                  newest_year: null,
                  average_ocr_confidence: 0.0,
                  top_districts: [],
                  top_languages: []
                }));
                setCategories(fallbackData);
                setApiFailed(false);
              }} 
              size="sm" 
              className="h-8 text-[11px] bg-rose-950/40 border border-rose-500/30 text-rose-200 hover:bg-rose-950/60"
            >
              Use Local Fallback Data
            </Button>
          </div>
        )}

        {/* Global Statistics Cockpit */}
        {!loading && !apiFailed && categories.length > 0 && (
          <CategoryStats categories={categories} isDemo={isDemo} />
        )}

        {/* Cockpit Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left panel: Interactive Donut Chart */}
          <div className="lg:col-span-1 border border-slate-900 bg-slate-900/10 rounded-xl p-5 shadow flex flex-col items-center select-none">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 font-mono">Topical Volume Distribution</span>
            
            {loading ? (
              <div className="h-[320px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              </div>
            ) : apiFailed ? (
              <div className="h-[320px] flex flex-col items-center justify-center text-slate-500 gap-2 text-xs">
                <AlertTriangle className="h-6 w-6 text-slate-655" />
                <span>Chart unavailable</span>
              </div>
            ) : (
              <div className="relative w-full h-[320px] bg-slate-950/40 border border-slate-900 rounded-lg flex flex-col items-center justify-center p-4">
                <svg viewBox="0 0 100 100" className="w-48 h-48 overflow-visible">
                  {segments.map((seg) => {
                    const isSelected = selectedCategorySlug === seg.slug;
                    const isHovered = hoveredCategory?.slug === seg.slug;
                    return (
                      <circle
                        key={seg.id}
                        cx="50"
                        cy="50"
                        r="30"
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={isHovered || isSelected ? "8.5" : "6"}
                        strokeDasharray={seg.dashArray}
                        strokeDashoffset={seg.dashOffset}
                        className="transition-all duration-300 cursor-pointer origin-center hover:scale-[1.03]"
                        style={{ transformBox: 'fill-box' }}
                        onMouseEnter={() => setHoveredCategory(seg)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        onClick={() => {
                          setSelectedCategorySlug(selectedCategorySlug === seg.slug ? null : seg.slug);
                        }}
                      />
                    );
                  })}
                  
                  {/* Center display text */}
                  <circle cx="50" cy="50" r="23" className="fill-slate-950/90" />
                  <foreignObject x="30" y="30" width="40" height="40">
                    <div className="w-full h-full flex flex-col justify-center items-center text-center font-sans select-none p-1">
                      {hoveredCategory || selectedCategorySlug ? (
                        (() => {
                          const active = hoveredCategory || categories.find(c => c.slug === selectedCategorySlug);
                          if (!active) return null;
                          return (
                            <>
                              <span className="text-[6px] font-bold uppercase tracking-wider text-slate-500 font-mono truncate max-w-[38px] block">
                                {active.name}
                              </span>
                              <span className="text-[9px] font-bold text-slate-100 font-serif leading-none truncate max-w-[38px] mt-1 block">
                                {(active.total_documents || 0).toLocaleString()}
                              </span>
                              <span className="text-[5px] text-slate-400 mt-0.5 font-mono block">records</span>
                            </>
                          );
                        })()
                      ) : (
                        <>
                          <span className="text-[5.5px] font-bold uppercase tracking-wider text-slate-500 font-mono block">Total Files</span>
                          <span className="text-[9px] font-bold text-primary font-serif leading-tight mt-0.5 block">
                            {totalDocs.toLocaleString()}
                          </span>
                          <span className="text-[5px] text-slate-500 mt-0.5 font-mono block">{categories.length} Categories</span>
                        </>
                      )}
                    </div>
                  </foreignObject>
                </svg>

                {selectedCategorySlug && (
                  <Button 
                    onClick={() => setSelectedCategorySlug(null)}
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[9px] font-mono text-slate-500 hover:text-slate-300 mt-4 px-2"
                  >
                    Reset segment filter &times;
                  </Button>
                )}
              </div>
            )}
            <p className="text-[9.5px] text-slate-500 leading-relaxed mt-4 text-center">
              Hover segments to analyze sizes. Click a category sector to filter the folders grid below.
            </p>
          </div>

          {/* Right panel: Search and Cards grid */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Filter Toolbar */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-4 shadow-xl backdrop-blur-md select-none">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <Input
                  placeholder="Search category name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-slate-950 border-slate-850 text-slate-200 placeholder:text-slate-655 focus-visible:ring-primary text-xs"
                />
              </div>
            </div>

            {/* Folder grid listing */}
            <div>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="border border-slate-900/50 bg-slate-900/20 rounded-xl p-4 h-28 animate-pulse space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-900/80" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3 bg-slate-900 rounded w-2/3" />
                          <div className="h-2.5 bg-slate-900 rounded w-1/3" />
                        </div>
                      </div>
                      <div className="h-2.5 bg-slate-900 rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : filteredCategories.length === 0 ? (
                <ExplorerEmptyState userRole={userRole} type="category" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
                  {filteredCategories.map((cat) => (
                    <CategoryCard key={cat.id} category={cat} />
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </AppLayout>
  );
}

export default function CategoriesExplorerPage() {
  return (
    <Suspense fallback={<AppLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></AppLayout>}>
      <CategoriesExplorerContent />
    </Suspense>
  );
}
