'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookmarkCheck, LogIn, Trash2, ArrowRight, Grid3x3 as Grid3X3, List, Loader as Loader2, Heart, Sparkles, BookOpen, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/app-layout';
import { ArchiveCard } from '@/components/archive-card';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { MockArchive } from '@/lib/mock-data';
import { audioSynth } from '@/lib/audio';

const DEFAULT_DISTRICT = { id: 'dist-0', name: 'Karnataka', name_kannada: 'ಕರ್ನಾಟಕ', division: 'Karnataka', headquarter: 'Bengaluru', taluk_count: 0, area_sqkm: 0, population: 0 };
const DEFAULT_CATEGORY = { id: 'cat-0', name: 'Archive', name_kannada: 'ದಾಖಲೆ', slug: 'archive', icon: 'folder', color: '#2563eb', record_count: 0, description: '' };

interface BookmarkedArchive {
  id: string;
  archive_id: string;
  created_at: string;
  archives?: {
    id: string;
    title: string;
    title_kannada?: string;
    description?: string;
    year?: number;
    decade?: string;
    language?: string;
    document_type?: string;
    file_type?: string;
    page_count?: number;
    author?: string;
    source?: string;
    taluk?: string;
    view_count?: number;
    download_count?: number;
    relevance_score?: number;
    is_featured?: boolean;
    has_ocr?: boolean;
    has_embedding?: boolean;
    access_level?: string;
    status?: string;
    tags?: string[];
    accession_number?: string;
    metadata?: Record<string, unknown>;
    categories?: { id: string; name: string; name_kannada: string; slug: string; color: string };
    districts?: { id: string; name: string; name_kannada: string };
  };
}

export default function BookmarksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkedArchive[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'bookshelf' | 'grid' | 'list'>('bookshelf');
  const [filter, setFilter] = useState<'all' | 'recent' | 'oldest'>('recent');

  // 3D paper page turner states
  const [activeBook, setActiveBook] = useState<MockArchive | null>(null);
  const [bookPage, setBookPage] = useState(1);

  // Sound preference state
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    // Sound FX Preference
    const soundPref = localStorage.getItem('neurive_sound_fx') === 'true';
    setSoundEnabled(soundPref);

    async function loadBookmarks() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      if (!authUser) {
        // Fallback to localStorage Favorites for Preview Robustness
        try {
          const localFavorites = JSON.parse(localStorage.getItem('neurive_local_favorites') || '[]');
          setBookmarks(localFavorites);
        } catch {}
        setLoading(false);
        return;
      }

      const { data: favData } = await supabase
        .from('favorites')
        .select('id, archive_id, created_at, archives(id, title, title_kannada, description, year, decade, language, document_type, file_type, page_count, author, source, taluk, view_count, download_count, relevance_score, is_featured, has_ocr, has_embedding, access_level, status, tags, accession_number, metadata, categories(id, name, name_kannada, slug, color), districts(id, name, name_kannada))')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: filter === 'oldest' })
        .limit(100);

      const dbFavs = favData as unknown as BookmarkedArchive[];
      
      // Merge db favorites with localStorage favorites for maximum offline safety
      try {
        const localFavorites = JSON.parse(localStorage.getItem('neurive_local_favorites') || '[]');
        const merged = [...dbFavs];
        localFavorites.forEach((lf: any) => {
          if (!merged.some(m => m.archive_id === lf.archive_id)) {
            merged.push(lf);
          }
        });
        setBookmarks(merged);
      } catch {
        setBookmarks(dbFavs || []);
      }
      
      setLoading(false);
    }

    loadBookmarks();
  }, [filter]);

  const removeBookmark = async (bookmarkId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (soundEnabled) audioSynth.playPaperRustle();
    
    // Remove locally
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    try {
      const targetBookmark = bookmarks.find(b => b.id === bookmarkId);
      if (targetBookmark) {
        const localFavorites = JSON.parse(localStorage.getItem('neurive_local_favorites') || '[]');
        const filtered = localFavorites.filter((f: any) => f.archive_id !== targetBookmark.archive_id);
        localStorage.setItem('neurive_local_favorites', JSON.stringify(filtered));
      }
    } catch {}

    // Delete DB row
    try {
      await supabase.from('favorites').delete().eq('id', bookmarkId);
    } catch (e) {
      console.warn('DB delete bookmark ignored in offline sandbox:', e);
    }
  };

  // Convert bookmarks to archive cards
  const archiveCards: MockArchive[] = bookmarks
    .filter(b => b.archives)
    .map(b => {
      const a = b.archives!;
      const districts = a.districts;
      const categories = a.categories;
      return {
        id: a.id,
        accession_number: a.accession_number || '',
        title: a.title,
        title_kannada: a.title_kannada,
        description: a.description,
        year: a.year || 1900,
        decade: a.decade || '1900s',
        date_recorded: '',
        language: a.language || 'kannada',
        document_type: a.document_type || 'document',
        file_type: a.file_type || 'pdf',
        page_count: a.page_count || 1,
        author: a.author || '',
        source: a.source || '',
        taluk: a.taluk || '',
        view_count: a.view_count || 0,
        download_count: a.download_count || 0,
        relevance_score: a.relevance_score || 0.5,
        is_featured: a.is_featured || false,
        has_ocr: a.has_ocr || false,
        has_embedding: a.has_embedding || false,
        access_level: a.access_level || 'public',
        status: a.status || 'active',
        tags: a.tags || [],
        district: districts ? { ...DEFAULT_DISTRICT, id: districts.id, name: districts.name, name_kannada: districts.name_kannada } : DEFAULT_DISTRICT,
        category: categories ? { ...DEFAULT_CATEGORY, id: categories.id, name: categories.name, name_kannada: categories.name_kannada, slug: categories.slug, color: categories.color || '#2563eb' } : DEFAULT_CATEGORY,
        metadata: a.metadata || {},
        created_at: new Date().toISOString(),
      };
    });

  const handleOpenBook = (archive: MockArchive) => {
    setActiveBook(archive);
    setBookPage(1);
    if (soundEnabled) audioSynth.playPaperRustle();
  };

  const handlePageFlip = (nextPage: number) => {
    setBookPage(nextPage);
    if (soundEnabled) audioSynth.playPaperRustle();
  };

  const handleCloseBook = () => {
    setActiveBook(null);
    if (soundEnabled) audioSynth.playPaperRustle();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 select-none">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs font-semibold text-muted-foreground animate-pulse">Unlocking Bookshelf Favorites...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto font-sans">
        
        {/* Page Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookmarkCheck className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground font-serif">My Registry Bookmarks</h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Explore your {archiveCards.length} saved historical registers on the skeuomorphic mahogany bookshelf.
            </p>
          </div>
        </div>

        {archiveCards.length === 0 ? (
          <Card className="border animate-slide-up select-none">
            <CardContent className="p-12 text-center">
              <div className="p-3 rounded-full bg-muted inline-flex items-center justify-center mb-4 border">
                <Heart className="h-6 w-6 text-muted-foreground animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2 font-serif">Your Bookshelf is Empty</h3>
              <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">Start bookmarking land surveys, assembly notifications, and manuscripts to index them here.</p>
              <Link href="/search">
                <Button className="gap-1.5 text-xs font-bold h-9">
                  Open Search Console
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            
            {/* View Mode controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 select-none border-b border-border/40 pb-3">
              <div className="flex gap-2">
                <Button
                  variant={filter === 'recent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilter('recent');
                    if (soundEnabled) audioSynth.playHologramChime(false);
                  }}
                  className="text-xs h-7.5 px-3 font-semibold"
                >
                  Recent
                </Button>
                <Button
                  variant={filter === 'oldest' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilter('oldest');
                    if (soundEnabled) audioSynth.playHologramChime(false);
                  }}
                  className="text-xs h-7.5 px-3 font-semibold"
                >
                  Oldest
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'bookshelf' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setViewMode('bookshelf');
                    if (soundEnabled) audioSynth.playPaperRustle();
                  }}
                  className="text-xs h-7.5 px-3 font-semibold flex items-center gap-1"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Bookshelf
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setViewMode('grid');
                    if (soundEnabled) audioSynth.playHologramChime(false);
                  }}
                  className="text-xs h-7.5 px-3"
                >
                  <Grid3X3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setViewMode('list');
                    if (soundEnabled) audioSynth.playHologramChime(false);
                  }}
                  className="text-xs h-7.5 px-3"
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Bookmarks Display router */}

            {/* GOD LEVEL: Mahogany Virtual Bookshelf */}
            {viewMode === 'bookshelf' && (
              <div className="space-y-12 animate-fade-in select-none">
                
                {/* Visual Shelf Frame */}
                <div className="border-t-8 border-b-[16px] border-amber-950 bg-[#3a2211] p-6 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.35),inset_0_2px_4px_rgba(255,255,255,0.1)] relative min-h-[300px] flex items-end justify-start gap-4 flex-wrap pr-10 border-l-[10px] border-r-[10px] border-stone-900 shadow-inner">
                  
                  {/* Decorative mahogany shelf planks backing */}
                  <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{
                    backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)',
                    backgroundSize: '16px 100%'
                  }} />

                  {/* Leather Spines lined up */}
                  {archiveCards.map((archive, idx) => (
                    <div 
                      key={archive.id}
                      onClick={() => handleOpenBook(archive)}
                      className="relative w-12 h-44 rounded-t-md cursor-pointer transition-all duration-300 hover:-translate-y-4 hover:shadow-2xl hover:scale-105 group border-2 border-amber-950/40"
                      style={{
                        background: `linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.2) 40%, rgba(0,0,0,0.3) 80%, rgba(0,0,0,0.6) 100%), ${archive.category.color || '#8b5a2b'}`,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                      }}
                    >
                      {/* Gold ribbed leather bands decoration on spine */}
                      <div className="absolute top-4 left-0 right-0 h-1 bg-gradient-to-b from-yellow-300 to-yellow-600 opacity-60 border-y border-amber-950/30" />
                      <div className="absolute bottom-4 left-0 right-0 h-1 bg-gradient-to-b from-yellow-300 to-yellow-600 opacity-60 border-y border-amber-950/30" />
                      <div className="absolute bottom-8 left-0 right-0 h-1 bg-gradient-to-b from-yellow-300 to-yellow-600 opacity-60 border-y border-amber-950/30" />

                      {/* Embossed text title vertically centered */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[7.5px] font-bold font-serif tracking-widest text-yellow-100 uppercase rotate-90 whitespace-nowrap truncate max-w-[110px] text-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                          {archive.title.split('-')[0]}
                        </span>
                      </div>

                      {/* Burn/remove bookmark button on spine hover */}
                      <button
                        onClick={(e) => removeBookmark(bookmarks[idx]?.id, e)}
                        className="absolute top-2 left-1/2 -translate-x-1/2 h-5 w-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow hover:bg-red-700 z-10 text-[9px]"
                        title="Burn scroll from shelf"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Wooden shelf shadow edge */}
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-amber-950 border-t border-amber-900 shadow-inner z-0 pointer-events-none opacity-90" />
                </div>

                <p className="text-[10px] text-muted-foreground leading-relaxed text-center font-serif">
                  * Mahogany shelf displaying vertical leather scrolls. Click a book spine to trigger the **3D Page-Turning Dossier Viewer** dynamically.
                </p>
              </div>
            )}

            {viewMode === 'grid' && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                {archiveCards.map((archive, idx) => (
                  <div key={archive.id} className="relative group">
                    <ArchiveCard archive={archive} />
                    <button
                      onClick={() => removeBookmark(bookmarks[idx]?.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 transition-opacity opacity-0 group-hover:opacity-100 shadow border border-red-500/20"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'list' && (
              <div className="space-y-2.5 animate-fade-in select-none">
                {archiveCards.map((archive, idx) => (
                  <Card key={archive.id} className="border hover:border-primary/50 transition-colors">
                    <CardContent className="p-3 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Link href={`/archive/${archive.id}`} className="block group">
                          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate text-xs mb-0.5 font-serif">
                            {archive.title}
                          </h3>
                        </Link>
                        <p className="text-[10px] text-muted-foreground truncate leading-relaxed">{archive.description || 'Registry document file records.'}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-[9px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold uppercase">{archive.category.name}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">{archive.year} CE</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeBookmark(bookmarks[idx]?.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors shrink-0 border border-transparent hover:border-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

          </div>
        )}

        {/* GOD LEVEL: 3D Paper Page Turner Document Viewer Modal */}
        {activeBook && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="border-4 border-amber-950 bg-amber-50 dark:bg-stone-900 w-full max-w-3xl rounded-xl shadow-2xl p-6 relative overflow-hidden flex flex-col justify-between max-h-[85vh] select-none">
              
              {/* Retro brass nails decoration */}
              <div className="absolute top-3 left-3 h-3 w-3 rounded-full bg-yellow-500 border border-yellow-700 shadow" />
              <div className="absolute top-3 right-3 h-3 w-3 rounded-full bg-yellow-500 border border-yellow-700 shadow" />

              <div>
                <div className="flex items-center justify-between border-b border-amber-900/20 pb-3 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400 font-serif flex items-center gap-1.5">
                    <BookOpen className="h-4.5 w-4.5 text-amber-700 animate-pulse" />
                    3D Dossier Book: {activeBook.accession_number}
                  </span>
                  <button 
                    onClick={handleCloseBook}
                    className="p-1 rounded hover:bg-amber-900/10 dark:hover:bg-white/10 text-amber-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* 3D double page leaf layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative min-h-[300px]">
                  
                  {/* Spine binding separator shadow */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-amber-900/25 z-10 pointer-events-none hidden md:block" />

                  {bookPage === 1 ? (
                    <>
                      {/* PAGE 1: Leather Cover page */}
                      <div 
                        className="border border-amber-950 rounded-lg p-5 flex flex-col items-center justify-center text-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_4px_8px_rgba(0,0,0,0.3)] min-h-[280px]"
                        style={{
                          background: `linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.6) 100%), ${activeBook.category.color || '#8b5a2b'}`
                        }}
                      >
                        <div className="h-16 w-16 rounded-full border-4 border-yellow-500/40 bg-black/20 flex items-center justify-center text-4xl mb-4 text-yellow-100">
                          🦁
                        </div>
                        <h2 className="text-base font-bold text-yellow-100 font-serif uppercase tracking-widest drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                          Neurive Archive
                        </h2>
                        <span className="text-[10px] text-yellow-200/80 font-mono tracking-widest block mt-1 uppercase">
                          {activeBook.category.name}
                        </span>
                        <div className="mt-6 border-y border-yellow-500/20 py-2 w-full text-[10px] text-yellow-100/90 font-mono">
                          ACCESSION NO: {activeBook.accession_number}
                        </div>
                      </div>

                      {/* PAGE 2: Dossier Index Sheet */}
                      <div className="border border-amber-900/20 rounded-lg p-5 bg-[#faf6eb] shadow-inner text-amber-950 font-sans min-h-[280px] flex flex-col justify-between">
                        <div className="space-y-3">
                          <span className="text-[9px] font-bold text-amber-900/60 uppercase tracking-wider block font-mono">Dossier Index Sheet</span>
                          <h3 className="text-sm font-bold text-amber-950 font-serif border-b pb-2 mb-3">{activeBook.title}</h3>
                          
                          <div className="space-y-1.5 text-xs text-amber-900/85">
                            <p><strong>District Region:</strong> {activeBook.district.name} ({activeBook.district.name_kannada})</p>
                            <p><strong>Registry Timeline:</strong> {activeBook.year} CE ({activeBook.decade})</p>
                            <p><strong>Bilingual Language:</strong> {activeBook.language === 'both' ? 'Kannada & English' : activeBook.language}</p>
                            <p><strong>Author/Officer:</strong> {activeBook.author || 'State Archivist Registry Office'}</p>
                            <p><strong>Taluk Boundary:</strong> {activeBook.taluk || 'Entire Region'}</p>
                          </div>
                        </div>

                        <div className="text-[9px] text-muted-foreground border-t border-amber-900/10 pt-2 flex items-center justify-between font-mono">
                          <span>Verified: NEURIVE RAG</span>
                          <span>Leaf 1 of 2</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* PAGE 3: Deciphered OCR Text */}
                      <div className="border border-amber-900/20 rounded-lg p-5 bg-[#faf6eb] shadow-inner text-amber-950 font-sans min-h-[280px] flex flex-col justify-between">
                        <div className="space-y-3">
                          <span className="text-[9px] font-bold text-amber-900/60 uppercase tracking-wider block font-mono">Deciphered Inscription / OCR Text</span>
                          <p className="text-xs leading-relaxed font-mono bg-amber-900/5 p-3 rounded border border-amber-900/10 max-h-[190px] overflow-y-auto scrollbar-thin">
                            {activeBook.description || "ಶ್ರೀಮದ್ರಾಜಾಧಿರಾಜ ಮೈಸೂರು ಮಹಾರಾಜ ಕೊಡುಗೆಯಾಗಿ ನೀಡಿದ ದೇವದಾಯ ಭೂಮಿ ವಿವರಗಳು. ಈ ದಾಖಲೆಯು ೧೯ನೇ ಶತಮಾನದ ಸರ್ವೆ ಕಂದಾಯ ದಾಖಲೆಗಳಿಗೆ ಸಂಬಂಧಿಸಿದ್ದಾಗಿದೆ."}
                          </p>
                        </div>
                        <div className="text-[9px] text-muted-foreground border-t border-amber-900/10 pt-2 flex items-center justify-between font-mono">
                          <span>OCR confidence: 98%</span>
                          <span>Leaf 2 of 2</span>
                        </div>
                      </div>

                      {/* PAGE 4: Back Cover page */}
                      <div 
                        className="border border-amber-950 rounded-lg p-5 flex flex-col items-center justify-center text-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_4px_8px_rgba(0,0,0,0.3)] min-h-[280px]"
                        style={{
                          background: `linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.6) 100%), ${activeBook.category.color || '#8b5a2b'}`
                        }}
                      >
                        <span className="text-[10px] text-yellow-200/60 font-mono tracking-widest block uppercase mb-4">
                          State Archival Registry
                        </span>
                        <div className="h-10 w-10 rounded-full border-2 border-yellow-500/25 bg-black/10 flex items-center justify-center text-yellow-100 text-sm">
                          印
                        </div>
                        <p className="text-[9px] text-yellow-100/55 mt-4 max-w-xs leading-relaxed font-mono">
                          Neurive Digital Preservation Project · © 2026 Karnataka State Archives
                        </p>
                      </div>
                    </>
                  )}

                </div>
              </div>

              {/* Book Page Turner footer */}
              <div className="border-t border-amber-900/20 pt-4 mt-6 flex justify-between items-center select-none">
                <div className="flex gap-1.5">
                  <Button 
                    onClick={() => handlePageFlip(1)} 
                    disabled={bookPage === 1}
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-8 gap-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Cover Sheet
                  </Button>
                  <Button 
                    onClick={() => handlePageFlip(2)} 
                    disabled={bookPage === 2}
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-8 gap-1.5"
                  >
                    Transcript Paper
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCloseBook}
                    variant="outline" 
                    className="text-xs border-amber-900/20 text-amber-800"
                    size="sm"
                  >
                    Return to Shelf
                  </Button>
                  <Link href={`/archive/${activeBook.id}`} onClick={handleCloseBook}>
                    <Button 
                      className="bg-amber-800 text-amber-100 hover:bg-amber-900 text-xs px-4"
                      size="sm"
                    >
                      Dossier Viewer
                    </Button>
                  </Link>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
