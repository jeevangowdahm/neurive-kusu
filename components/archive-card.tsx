'use client';

import Link from 'next/link';
import { Calendar, MapPin, FileText, Eye, Download, Bookmark, BookmarkCheck, Tag, Languages, Sparkles, X, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MockArchive } from '@/lib/mock-data';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { audioSynth } from '@/lib/audio';

interface ArchiveCardProps {
  archive: MockArchive;
  compact?: boolean;
}

const docTypeLabels: Record<string, { label: string; color: string }> = {
  land_deed: { label: 'Land Deed', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300' },
  court_order: { label: 'Court Order', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  manuscript: { label: 'Manuscript', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  gazette: { label: 'Gazette', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300' },
  survey_map: { label: 'Survey Map', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300' },
  census_form: { label: 'Census', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  revenue_register: { label: 'Revenue', color: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300' },
  temple_record: { label: 'Temple', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  letter: { label: 'Letter', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  report: { label: 'Report', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300' },
};

export function ArchiveCard({ archive, compact = false }: ArchiveCardProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);

  useEffect(() => {
    try {
      const localFavorites = JSON.parse(localStorage.getItem('neurive_local_favorites') || '[]');
      const isFav = localFavorites.some((f: any) => f.archive_id === archive.id);
      setBookmarked(isFav);
    } catch (e) {
      console.error('Failed to load bookmark state:', e);
    }
  }, [archive.id]);

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !bookmarked;
    setBookmarked(nextState);

    // Play chimes
    const soundPref = localStorage.getItem('neurive_sound_fx') === 'true';
    if (soundPref) {
      audioSynth.playHologramChime(false);
    }

    try {
      const localFavorites = JSON.parse(localStorage.getItem('neurive_local_favorites') || '[]');
      if (nextState) {
        if (!localFavorites.some((f: any) => f.archive_id === archive.id)) {
          const newFav = {
            id: `fav-${archive.id}-${Date.now()}`,
            archive_id: archive.id,
            created_at: new Date().toISOString(),
            archives: {
              id: archive.id,
              accession_number: archive.accession_number,
              title: archive.title,
              title_kannada: archive.title_kannada,
              description: archive.description,
              year: archive.year,
              decade: archive.decade,
              language: archive.language,
              document_type: archive.document_type,
              file_type: archive.file_type,
              page_count: archive.page_count,
              author: archive.author,
              source: archive.source,
              taluk: archive.taluk,
              view_count: archive.view_count,
              download_count: archive.download_count,
              relevance_score: archive.relevance_score,
              is_featured: archive.is_featured,
              has_ocr: archive.has_ocr,
              has_embedding: archive.has_embedding,
              access_level: archive.access_level,
              status: archive.status,
              tags: archive.tags,
              categories: {
                id: archive.category.id,
                name: archive.category.name,
                name_kannada: archive.category.name_kannada,
                slug: archive.category.slug,
                color: archive.category.color
              },
              districts: {
                id: archive.district.id,
                name: archive.district.name,
                name_kannada: archive.district.name_kannada
              }
            }
          };
          localFavorites.unshift(newFav);
          localStorage.setItem('neurive_local_favorites', JSON.stringify(localFavorites));
        }
      } else {
        const filtered = localFavorites.filter((f: any) => f.archive_id !== archive.id);
        localStorage.setItem('neurive_local_favorites', JSON.stringify(filtered));
      }
    } catch (e) {
      console.error('Failed to save bookmark in localStorage:', e);
    }

    try {
      supabase.auth.getUser().then(({ data }) => {
        const userId = data?.user?.id;
        if (userId) {
          if (nextState) {
            supabase.from('favorites').insert({ user_id: userId, archive_id: archive.id }).then(() => {});
          } else {
            supabase.from('favorites').delete().eq('user_id', userId).eq('archive_id', archive.id).then(() => {});
          }
        }
      });
    } catch (e) {
      // ignore offline exceptions
    }
  };

  const handleOpenInspector = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowInspector(true);
    const soundPref = localStorage.getItem('neurive_sound_fx') === 'true';
    if (soundPref) audioSynth.playPaperRustle();
  };

  const handleCloseInspector = () => {
    setShowInspector(false);
    const soundPref = localStorage.getItem('neurive_sound_fx') === 'true';
    if (soundPref) audioSynth.playPaperRustle();
  };

  const docType = docTypeLabels[archive.document_type] || { label: archive.document_type, color: 'bg-gray-100 text-gray-800' };

  return (
    <>
      <Card className={cn('card-hover border bg-card overflow-hidden select-none', compact && 'shadow-none')}>
        <CardContent className={cn('p-0', compact ? 'p-3' : '')}>
          {!compact && (
            <div className="h-1.5 w-full" style={{ backgroundColor: archive.category.color }} />
          )}

          <div className={cn('p-4', compact && 'p-0')}>
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold', docType.color)}>
                    {docType.label}
                  </span>
                  {archive.is_featured && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-500/25">
                      Featured
                    </span>
                  )}
                  {archive.has_ocr && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-500/25">
                      OCR
                    </span>
                  )}
                  {archive.source_is_real === true ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-500/25">
                      Real Public Source
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-500/25">
                      Synthetic Demo
                    </span>
                  )}
                  {archive.source_type === 'upload' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-500/25">
                      Uploaded Archive
                    </span>
                  )}
                  {archive.source_type === 'wikipedia' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300 border border-slate-500/25">
                      Wikipedia
                    </span>
                  )}
                  {archive.source_type === 'internet_archive' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-500/25">
                      Internet Archive
                    </span>
                  )}
                  {archive.source_type === 'government_pdf' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-500/25">
                      Government PDF
                    </span>
                  )}
                </div>

                <Link href={`/archive/${archive.id}`}>
                  <h3 className="font-bold text-foreground text-sm leading-snug hover:text-primary transition-colors line-clamp-2 font-serif">
                    {archive.title}
                  </h3>
                </Link>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 -mt-0.5 hover:bg-muted"
                onClick={handleToggleBookmark}
              >
                {bookmarked
                  ? <BookmarkCheck className="h-4 w-4 text-primary" />
                  : <Bookmark className="h-4 w-4 text-muted-foreground" />
                }
              </Button>
            </div>

            {!compact && archive.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                {archive.description}
              </p>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
              {archive.year && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {archive.year}
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {archive.district.name}
              </span>
              {archive.taluk && (
                <span className="flex items-center gap-1 hidden sm:flex">
                  <Tag className="h-3.5 w-3.5" />
                  {archive.taluk}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Languages className="h-3.5 w-3.5" />
                {archive.language === 'kannada' ? 'ಕನ್ನಡ' : archive.language === 'both' ? 'KN/EN' : 'EN'}
              </span>
            </div>

            {!compact && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {archive.view_count.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" />
                    {archive.download_count.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">
                    {archive.accession_number}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleOpenInspector}
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[10px] px-2.5 border-primary/20 text-primary hover:bg-primary/5 font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                    Inspect Scans
                  </Button>

                  <Link href={`/archive/${archive.id}`}>
                    <Button size="sm" className="h-7 text-[10px] px-3 font-semibold">
                      Open Document
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* GOD LEVEL: Dossier Scans Magnifying Hover Popover Modal */}
      {showInspector && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="border-4 border-amber-950 bg-amber-50 dark:bg-stone-900 w-full max-w-2xl rounded-xl shadow-2xl p-6 relative overflow-hidden flex flex-col justify-between max-h-[85vh] select-none">
            
            {/* Skeuomorphic clips */}
            <div className="absolute top-3 left-3 h-3 w-3 rounded-full bg-yellow-500 border border-yellow-700 shadow" />
            <div className="absolute top-3 right-3 h-3 w-3 rounded-full bg-yellow-500 border border-yellow-700 shadow" />

            <div>
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-3 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400 font-serif flex items-center gap-1.5">
                  <Activity className="h-4.5 w-4.5 text-amber-700 animate-pulse" />
                  Visual Dossier Scan & Entity Reviewer
                </span>
                <button 
                  onClick={handleCloseInspector}
                  className="p-1 rounded hover:bg-amber-900/10 dark:hover:bg-white/10 text-amber-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* dossier visual scans content */}
              <div className="space-y-4">
                
                {/* Simulated weathered leather-grained document scan panel */}
                <div className="relative border border-amber-900/30 rounded-lg p-5 min-h-[190px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] overflow-hidden bg-gradient-to-br from-[#faf6eb] via-[#f5ebd3] to-[#ebd8ab]">
                  
                  {/* Faded background watermarks */}
                  <div className="absolute inset-0 opacity-[0.03] select-none pointer-events-none text-[80px] font-bold font-serif text-amber-950 flex items-center justify-center">
                    KSA
                  </div>

                  {/* Micro-lined paper stripes */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px)',
                    backgroundSize: '100% 24px'
                  }} />

                  {/* Weathered text with highlights */}
                  <div className="relative z-10 font-serif text-sm leading-relaxed text-amber-950 select-text">
                    <p className="mb-2 italic text-[11px] text-amber-900/60 font-mono">
                      ACCESSION NUMBER: {archive.accession_number} · DIVISION: {archive.district.division}
                    </p>
                    <p className="font-bold text-center text-amber-900 border-b border-amber-900/10 pb-2 mb-4 uppercase tracking-wide">
                      {archive.title}
                    </p>
                    
                    <p className="indent-8 leading-relaxed font-sans text-xs">
                      Official revenue surveys conducted across the taluks of <span 
                        onMouseEnter={() => setHoveredEntity('loc-1')} 
                        onMouseLeave={() => setHoveredEntity(null)}
                        className={cn("px-1 py-0.5 rounded cursor-help font-bold border transition-colors", 
                          hoveredEntity === 'loc-1' ? "bg-amber-400/30 border-amber-600 text-amber-950 shadow-sm" : "bg-amber-400/15 border-amber-500/25"
                        )}
                      >
                        {archive.district.name} ({archive.district.name_kannada})
                      </span>, during the historical census year bracket of <span 
                        onMouseEnter={() => setHoveredEntity('date-1')} 
                        onMouseLeave={() => setHoveredEntity(null)}
                        className={cn("px-1 py-0.5 rounded cursor-help font-bold border transition-colors", 
                          hoveredEntity === 'date-1' ? "bg-emerald-400/30 border-emerald-600 text-emerald-950 shadow-sm" : "bg-emerald-400/15 border-emerald-500/25"
                        )}
                      >
                        {archive.year} CE
                      </span>, reveals significant mutation files registered under local registrar authorities.
                    </p>
                    
                    <p className="mt-3 leading-relaxed font-sans text-xs">
                      The document transcription verified by Neurive RAG indexing details: <strong className="text-amber-900">{archive.description || 'Administrative land records detailing mutations and property transfers.'}</strong>
                    </p>
                  </div>
                </div>

                {/* Legend review widgets */}
                <div className="bg-amber-900/5 dark:bg-stone-950/40 p-3 rounded-lg border border-amber-900/10 text-xs">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2 font-mono">Deciphered Entities:</span>
                  <div className="flex flex-wrap gap-2.5">
                    <Badge variant="secondary" className="bg-amber-400/15 border border-amber-500/20 text-amber-900 gap-1.5 font-sans py-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      Location: {archive.district.name}
                    </Badge>
                    <Badge variant="secondary" className="bg-emerald-400/15 border border-emerald-500/20 text-emerald-900 gap-1.5 font-sans py-0.5">
                      <Calendar className="h-3 w-3 shrink-0" />
                      Timeline: {archive.year} CE
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-400/15 border border-blue-500/20 text-blue-900 gap-1.5 font-sans py-0.5">
                      <FileText className="h-3 w-3 shrink-0" />
                      Doc Type: {docType.label}
                    </Badge>
                  </div>
                </div>

              </div>
            </div>

            <div className="border-t border-amber-900/20 pt-4 mt-6 flex justify-end gap-2">
              <Button 
                onClick={handleCloseInspector}
                variant="outline" 
                className="text-xs border-amber-900/25 text-amber-800"
              >
                Close Inspector
              </Button>
              <Link href={`/archive/${archive.id}`} onClick={handleCloseInspector}>
                <Button className="bg-amber-800 text-amber-100 hover:bg-amber-900 text-xs px-4">
                  Full Document Viewer
                </Button>
              </Link>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
