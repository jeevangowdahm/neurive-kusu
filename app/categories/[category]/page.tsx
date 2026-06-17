'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FolderOpen, Loader2, Sparkles, AlertTriangle, 
  Search, MessageSquare, BookOpen, Clock, Users, ArrowLeft 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/app-layout';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';

// Reusable components
import { ExplorerDocumentCard } from '@/components/explorer/ExplorerDocumentCard';
import { DistributionChart } from '@/components/explorer/DistributionChart';
import { CompactTimeline } from '@/components/explorer/CompactTimeline';
import { EntityCloud } from '@/components/explorer/EntityCloud';
import { ExplorerEmptyState } from '@/components/explorer/ExplorerEmptyState';

interface CategoryDetailPageProps {
  params: {
    category: string;
  };
}

export default function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const router = useRouter();
  const categorySlug = params.category;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [userRole, setUserRole] = useState('guest');
  const [docs, setDocs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [sortBy, setSortBy] = useState('year-desc');

  // Load category dossier details
  const loadDossier = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(categorySlug)}?page=${pageNum}&limit=10`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error(`Category ${categorySlug} is not cataloged.`);
          router.push('/categories');
          return;
        }
        throw new Error('Failed to load category dossier');
      }

      const resJson = await res.json();
      if (resJson.success) {
        setData(resJson);
        setTotalCount(resJson.total_count || 0);
        if (append) {
          setDocs(prev => [...prev, ...(resJson.documents || [])]);
        } else {
          setDocs(resJson.documents || []);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load category dossier');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [categorySlug, router]);

  useEffect(() => {
    loadDossier(1, false);
  }, [loadDossier]);

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

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadDossier(nextPage, true);
  };

  if (loading || !data) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-slate-950 text-slate-400 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs font-mono">Opening subject catalogs...</span>
        </div>
      </AppLayout>
    );
  }

  const { category, stats, timeline_events, isDemo, ai_summary } = data;

  const filteredAndSortedDocs = docs
    .filter(d => {
      if (!localSearch) return true;
      const search = localSearch.toLowerCase();
      return (d.title || '').toLowerCase().includes(search) || 
             (d.summary || '').toLowerCase().includes(search);
    })
    .sort((a, b) => {
      if (sortBy === 'year-desc') return (b.year || 0) - (a.year || 0);
      if (sortBy === 'year-asc') return (a.year || 0) - (b.year || 0);
      if (sortBy === 'title-asc') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'ocr-desc') return (b.ocr_confidence || 0) - (a.ocr_confidence || 0);
      return 0;
    });

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-sans bg-slate-950 text-slate-100 min-h-[calc(100vh-4rem)]">
        
        {/* Navigation link */}
        <div className="space-y-4 select-none">
          <Link href="/categories" className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="h-4.5 w-4.5" />
            Return to Categories Explorer
          </Link>

          {/* Folder Header */}
          <div className="flex flex-col sm:flex-row items-start gap-4 p-5 rounded-xl border border-slate-900 bg-slate-900/10 backdrop-blur-sm relative">
            <div 
              className="absolute top-5 right-5 text-3xl opacity-40 select-none hidden sm:block"
              style={{ color: category.color }}
            >
              📂
            </div>
            
            <div 
              className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border"
              style={{ 
                backgroundColor: category.color + '15', 
                borderColor: category.color + '30' 
              }}
            >
              <FolderOpen className="h-6 w-6" style={{ color: category.color }} />
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Subject Classification Dossier
                </span>
                <h2 className="text-xl font-bold text-slate-100 font-serif leading-none">
                  {category.name}
                </h2>
                <p className="text-xs kannada-text text-slate-400 mt-1">{category.name_kannada}</p>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                {category.description}
              </p>

              {/* Related Districts */}
              {stats.district_distribution && stats.district_distribution.length > 0 && (
                <div className="text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-400">Related Districts:</span>{' '}
                  {stats.district_distribution.map((d: any) => d.name).join(', ')}
                </div>
              )}

              {/* Keywords */}
              {category.keywords && category.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5 select-none">
                  {category.keywords.map((kw: string) => (
                    <Badge key={kw} variant="outline" className="border-slate-800 text-slate-400 text-[9px] py-0.5 px-2">
                      #{kw}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Demo Watermark Banner */}
        {isDemo && (
          <div className="bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[10px] px-3 py-1.5 rounded-md font-mono flex items-center gap-1.5 w-fit select-none animate-pulse">
            <AlertTriangle className="h-4 w-4" />
            <span>Virtual Subject Dossier: Displaying simulated statistics as database holds 0 matching records.</span>
          </div>
        )}

        {/* AI summary synopsis description */}
        {ai_summary && (
          <Card className="border bg-slate-900/15 border-slate-900 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-primary to-emerald-500" />
            <CardContent className="p-4 sm:p-5 flex items-start gap-3 select-none">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">AI Collection Synthesis Overview</span>
                <p className="text-xs text-slate-300 leading-relaxed font-serif max-w-3xl italic">
                  &ldquo;{ai_summary}&rdquo;
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dynamic Statistics summary grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border bg-slate-900/10 border-slate-900 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Allowed Record Files</span>
                <span className="text-base font-bold text-slate-200 font-serif block mt-0.5">
                  {stats.total_documents.toLocaleString()} records
                </span>
                <span className="text-[9px] text-slate-500 block">
                  {stats.completed_documents} completed · {stats.public_documents} public
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border bg-slate-900/10 border-slate-900 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-6 w-6 text-primary shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Oldest / Latest Era</span>
                <span className="text-base font-bold text-slate-200 font-serif block mt-0.5">
                  {stats.oldest_year && stats.newest_year ? `${stats.oldest_year} - ${stats.newest_year} CE` : 'No dates'}
                </span>
                <span className="text-[9px] text-slate-500 block">
                  Dynamically resolved index
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border bg-slate-900/10 border-slate-900 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Average OCR Accuracy</span>
                <span className="text-base font-bold text-slate-200 font-serif block mt-0.5">
                  {stats.average_ocr_confidence ? `${Math.round(stats.average_ocr_confidence * 100)}% Confidence` : 'N/A'}
                </span>
                <span className="text-[9px] text-slate-500 block">
                  Digitization reading quality
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cockpit Buttons */}
        <div className="flex flex-wrap gap-3 select-none">
          <Button
            size="sm"
            variant="outline"
            className="h-9 text-xs font-semibold border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-850 gap-1.5"
            asChild
          >
            <Link href={`/search?q=*&category=${encodeURIComponent(category.slug)}`}>
              <Search className="h-4 w-4" />
              Search within category
            </Link>
          </Button>

          <Button
            size="sm"
            className="h-9 text-xs font-semibold gap-1.5"
            asChild
          >
            <Link href={`/chat?category=${encodeURIComponent(category.slug)}`}>
              <MessageSquare className="h-4 w-4" />
              Ask AI about this category
            </Link>
          </Button>
        </div>

        {/* Mid-level Cockpit: Distribution Charts & Related Entities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Charts Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* District distribution */}
            {stats.district_distribution && stats.district_distribution.length > 0 && (
              <Card className="border bg-slate-900/20 border-slate-900/60 p-4">
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                    Geographic Region Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <DistributionChart data={stats.district_distribution} type="bar" color="#2563eb" />
                </CardContent>
              </Card>
            )}

            {/* Timeline progression chart */}
            {stats.year_distribution && stats.year_distribution.length > 0 && (
              <Card className="border bg-slate-900/20 border-slate-900/60 p-4">
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                    Historical Record Timeline Volume
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <DistributionChart data={stats.year_distribution} type="area" color="#7c3aed" />
                </CardContent>
              </Card>
            )}

          </div>

          {/* Related Entities & Compact Timeline Column */}
          <div className="space-y-6">
            
            {/* Related Entities */}
            {stats.top_entities && stats.top_entities.length > 0 && (
              <Card className="border bg-slate-900/20 border-slate-900/60 p-4">
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                    Top Figures & Entities
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1.5">Related People</span>
                    <EntityCloud entities={stats.related_people} type="person" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1.5">Related Places</span>
                    <EntityCloud entities={stats.related_places} type="place" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1.5">Related Events</span>
                    <EntityCloud entities={stats.related_events} type="event" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Compact timeline */}
            {timeline_events && timeline_events.length > 0 && (
              <Card className="border bg-slate-900/20 border-slate-900/60 p-4">
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                    Category Timeline Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-2">
                  <CompactTimeline events={timeline_events} />
                </CardContent>
              </Card>
            )}

          </div>

        </div>

        {/* Index Records catalog display */}
        <div className="space-y-4 pt-4">
          <div className="border-b border-slate-900 pb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 font-serif uppercase tracking-wider flex items-center gap-1.5 select-none">
              <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
              Subject Catalog Records ({totalCount})
            </h3>
          </div>

          {docs.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/20 border border-slate-900 p-3 rounded-lg select-none">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <Input
                  placeholder="Filter local records in this folder..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-8 h-8 text-[11px] bg-slate-950 border-slate-850"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-950 border border-slate-850 text-slate-300 text-[11px] rounded px-2.5 py-1 h-8 focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-40"
              >
                <option value="year-desc">Year: Newest First</option>
                <option value="year-asc">Year: Oldest First</option>
                <option value="title-asc">Title: A to Z</option>
                <option value="ocr-desc">OCR: Highest Quality</option>
              </select>
            </div>
          )}

          {docs.length === 0 ? (
            <ExplorerEmptyState userRole={userRole} type="category" />
          ) : filteredAndSortedDocs.length === 0 ? (
            <div className="text-center p-8 bg-slate-900/10 border border-slate-900 rounded-xl select-none">
              <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No catalog records match your query filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedDocs.map((doc) => (
                  <ExplorerDocumentCard key={doc.id} document={doc} />
                ))}
              </div>

              {docs.length < totalCount && (
                <div className="pt-2 text-center select-none">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    variant="outline"
                    className="text-xs border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-855 h-9 px-6 font-semibold"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                        Loading dossiers...
                      </>
                    ) : (
                      'Load More Records'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
