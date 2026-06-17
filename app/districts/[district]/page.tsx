'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Landmark, Loader2, Sparkles, AlertTriangle, 
  Search, MessageSquare, BookOpen, Clock, Users, MapPin, Calendar 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/app-layout';
import { toast } from 'sonner';
import Link from 'next/link';

// Reusable components
import { DistrictDetailHeader } from '@/components/explorer/DistrictDetailHeader';
import { ExplorerDocumentCard } from '@/components/explorer/ExplorerDocumentCard';
import { DistributionChart } from '@/components/explorer/DistributionChart';
import { CompactTimeline } from '@/components/explorer/CompactTimeline';
import { EntityCloud } from '@/components/explorer/EntityCloud';
import { ExplorerEmptyState } from '@/components/explorer/ExplorerEmptyState';

interface DistrictDetailPageProps {
  params: {
    district: string;
  };
}

export default function DistrictDetailPage({ params }: DistrictDetailPageProps) {
  const router = useRouter();
  const districtName = decodeURIComponent(params.district);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [userRole, setUserRole] = useState('guest');
  const [docs, setDocs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [sortBy, setSortBy] = useState('year-desc');

  // Load district dossier details
  const loadDossier = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`/api/districts/${encodeURIComponent(districtName)}?page=${pageNum}&limit=10`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error(`District ${districtName} is not cataloged.`);
          router.push('/districts');
          return;
        }
        throw new Error('Failed to load district dossier');
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
      toast.error('Failed to load regional dossier');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [districtName, router]);

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
          <span className="text-xs font-mono">Unfolding regional archives...</span>
        </div>
      </AppLayout>
    );
  }

  const { district, stats, timeline_events, isDemo } = data;

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
        
        {/* Wood-trimmed Header Banner */}
        <DistrictDetailHeader
          name={district.name}
          nameKannada={district.name_kannada}
          division={district.division}
          headquarters={district.headquarter}
          taluks={district.taluk_count}
          area={district.area_sqkm}
          population={district.population}
        />

        {/* Demo Watermark Banner */}
        {isDemo && (
          <div className="bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[10px] px-3 py-1.5 rounded-md font-mono flex items-center gap-1.5 w-fit select-none animate-pulse">
            <AlertTriangle className="h-4 w-4" />
            <span>Virtual District Dossier: Displaying simulated statistics as database holds 0 matching records.</span>
          </div>
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
            <Link href={`/search?q=*&district=${encodeURIComponent(district.name)}`}>
              <Search className="h-4 w-4" />
              Search within {district.name}
            </Link>
          </Button>

          <Button
            size="sm"
            className="h-9 text-xs font-semibold gap-1.5"
            asChild
          >
            <Link href={`/chat?district=${encodeURIComponent(district.name)}`}>
              <MessageSquare className="h-4 w-4" />
              Ask AI about {district.name}
            </Link>
          </Button>
        </div>

        {/* Mid-level Cockpit: Distribution Charts & Related Entities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Charts Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Category distribution */}
            {stats.document_count_by_category && stats.document_count_by_category.length > 0 && (
              <Card className="border bg-slate-900/20 border-slate-900/60 p-4">
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                    Topological Record Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <DistributionChart data={stats.document_count_by_category} type="bar" color="#3b82f6" />
                </CardContent>
              </Card>
            )}

            {/* Timeline progression chart */}
            {stats.document_count_by_year && stats.document_count_by_year.length > 0 && (
              <Card className="border bg-slate-900/20 border-slate-900/60 p-4">
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                    Historical Record Timeline Volume
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <DistributionChart data={stats.document_count_by_year} type="area" color="#10b981" />
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
                    Regional Timeline Milestones
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
              Regional Catalog Records ({totalCount})
            </h3>
          </div>

          {docs.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/20 border border-slate-900 p-3 rounded-lg select-none">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <Input
                  placeholder="Filter local records in this district..."
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
            <ExplorerEmptyState userRole={userRole} type="district" />
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
