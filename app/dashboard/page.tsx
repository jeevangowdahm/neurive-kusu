'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { audioSynth } from '@/lib/audio';
import {
  LayoutDashboard, BookmarkCheck, FolderOpen, Upload, Search,
  Clock, Eye, Download, Plus, ArrowRight, FileText, Trash2, LogIn,
  Award, Shield, Trophy, Sparkles, CheckCircle, Printer, X, Star, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/app-layout';
import { ArchiveCard } from '@/components/archive-card';
import { getMockArchives, type MockArchive } from '@/lib/mock-data';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const DEFAULT_DISTRICT = { id: 'dist-0', name: 'Karnataka', name_kannada: 'ಕರ್ನಾಟಕ', division: 'Karnataka', headquarter: 'Bengaluru', taluk_count: 0, area_sqkm: 0, population: 0 };
const DEFAULT_CATEGORY = { id: 'cat-0', name: 'Archive', name_kannada: 'ದಾಖಲೆ', slug: 'archive', icon: 'folder', color: '#2563eb', record_count: 0, description: '' };

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization?: string;
  created_at: string;
}

interface UserArchive {
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
  created_at?: string;
  metadata?: Record<string, unknown>;
  categories?: { id: string; name: string; name_kannada: string; slug: string; color: string };
  districts?: { id: string; name: string; name_kannada: string };
}

interface UserFavorite {
  id: string;
  archive_id: string;
  archives?: UserArchive;
  created_at: string;
}

interface UserUploadSession {
  id: string;
  filename: string;
  file_size: number;
  file_type: string;
  status: string;
  progress: number;
  result_archive_id?: string;
  created_at: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [uploads, setUploads] = useState<UserUploadSession[]>([]);
  const [userArchives, setUserArchives] = useState<UserArchive[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCert, setShowCert] = useState(false);
  const { theme } = useTheme();

  const { archives: mockArchives } = getMockArchives(1, 6);

  const loadUserArchives = async (authUser: User) => {
    try {
      // Load user's uploaded archives
      const { data: archiveData } = await supabase
        .from('archives')
        .select('id, title, title_kannada, description, year, decade, language, document_type, file_type, page_count, author, source, taluk, view_count, download_count, relevance_score, is_featured, has_ocr, has_embedding, access_level, status, tags, accession_number, created_at, metadata, categories(id, name, name_kannada, slug, color), districts(id, name, name_kannada)')
        .or('source.eq.User Upload,source.eq.AI Ingestion Pipeline')
        .order('created_at', { ascending: false })
        .limit(20);
      
      const dbArchives = (archiveData as unknown as UserArchive[]) || [];
      
      // Load from localStorage as fallback/offline
      let localArchives: UserArchive[] = [];
      try {
        localArchives = JSON.parse(localStorage.getItem('neurive_local_uploads') || '[]');
      } catch (e) {
        console.error('Failed to load local archives:', e);
      }

      // Merge: avoid duplicates by ID
      const merged = [...dbArchives];
      for (const local of localArchives) {
        if (!merged.some(m => m.id === local.id)) {
          merged.push(local);
        }
      }
      setUserArchives(merged);
    } catch (e) {
      console.warn('Failed to load user archives from DB, using localStorage:', e);
      try {
        const localArchives = JSON.parse(localStorage.getItem('neurive_local_uploads') || '[]');
        setUserArchives(localArchives);
      } catch (err) {
        setUserArchives([]);
      }
    }
  };

  useEffect(() => {
    async function loadUserData() {
      let authUser: User | null = null;
      try {
        const { data } = await supabase.auth.getUser();
        authUser = data?.user ?? null;
      } catch (e) {
        console.warn('Supabase auth check failed:', e);
      }

      // If offline/demo mode and no authUser found, provide a mock user to avoid locking out the user
      if (!authUser) {
        authUser = {
          id: 'offline-demo-user',
          email: 'user@neurive.karnataka.gov.in',
          user_metadata: { full_name: 'Jana-Adhikari' },
          created_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated',
        } as unknown as User;
      }
      setUser(authUser);

      // Load profile
      let profileData = null;
      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();
        profileData = data;
      } catch (e) {
        console.warn('Failed to load DB profile:', e);
      }

      if (!profileData) {
        profileData = {
          id: authUser.id,
          email: authUser.email || 'user@neurive.karnataka.gov.in',
          full_name: 'Jana-Adhikari User',
          role: 'archivist',
          organization: 'Karnataka Digital Archives',
          created_at: new Date().toISOString(),
        };
      }
      setProfile(profileData as UserProfile);

      // Load favorites with archive data
      let dbFavorites: any[] = [];
      try {
        const { data } = await supabase
          .from('favorites')
          .select('id, archive_id, created_at, archives(id, title, title_kannada, description, year, decade, language, document_type, file_type, page_count, author, source, taluk, view_count, download_count, relevance_score, is_featured, has_ocr, has_embedding, access_level, status, tags, accession_number, created_at, metadata, categories(id, name, name_kannada, slug, color), districts(id, name, name_kannada))')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(20);
        dbFavorites = data || [];
      } catch (e) {
        console.warn('Failed to load favorites from DB:', e);
      }

      // Merge local favorites
      let localFavorites: any[] = [];
      try {
        localFavorites = JSON.parse(localStorage.getItem('neurive_local_favorites') || '[]');
      } catch (e) {
        console.error('Failed to load local favorites:', e);
      }

      const mergedFavorites = [...dbFavorites];
      for (const local of localFavorites) {
        if (!mergedFavorites.some(f => f.archive_id === local.archive_id)) {
          mergedFavorites.push(local);
        }
      }
      setFavorites(mergedFavorites);

      // Load upload sessions
      let dbUploads: any[] = [];
      try {
        const { data } = await supabase
          .from('upload_sessions')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(20);
        dbUploads = data || [];
      } catch (e) {
        console.warn('Failed to load upload sessions from DB:', e);
      }

      // Merge local upload sessions
      let localSessions: any[] = [];
      try {
        localSessions = JSON.parse(localStorage.getItem('neurive_local_sessions') || '[]');
      } catch (e) {
        console.error('Failed to load local sessions:', e);
      }

      const mergedSessions = [...dbUploads];
      for (const local of localSessions) {
        if (!mergedSessions.some(s => s.id === local.id)) {
          mergedSessions.push(local);
        }
      }
      setUploads(mergedSessions);

      // Load user archives
      await loadUserArchives(authUser);

      setLoading(false);

      // Subscribe to archive changes for real-time updates
      let subscription: any = null;
      try {
        subscription = supabase
          .channel('archive-changes')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'archives', filter: `source=eq.User Upload` }, () => {
            if (authUser) loadUserArchives(authUser);
          })
          .subscribe();
      } catch (e) {
        console.warn('Supabase real-time channel subscription failed:', e);
      }

      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }

    loadUserData();
  }, []);

  // Not logged in state
  if (!loading && !user) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-4 rounded-full bg-muted mb-4">
              <LogIn className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Sign in to view your dashboard</h2>
            <p className="text-sm text-muted-foreground mb-4">Access your bookmarks, uploads, and search history</p>
            <Link href="/auth/login">
              <Button className="gap-2"><LogIn className="h-4 w-4" />Sign In</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  const bookmarkCount = favorites.length;
  const uploadCount = uploads.length;

  // Convert user archives to format expected by ArchiveCard
  const userArchiveCards: MockArchive[] = userArchives.map(a => ({
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
    district: a.districts ? { ...DEFAULT_DISTRICT, id: a.districts.id, name: a.districts.name, name_kannada: a.districts.name_kannada } : DEFAULT_DISTRICT,
    category: a.categories ? { ...DEFAULT_CATEGORY, id: a.categories.id, name: a.categories.name, name_kannada: a.categories.name_kannada, slug: a.categories.slug, color: a.categories.color || '#2563eb' } : DEFAULT_CATEGORY,
    metadata: a.metadata || {},
    created_at: a.created_at || new Date().toISOString(),
  }));

  // Convert favorites to archive card format
  const favoriteArchiveCards: MockArchive[] = favorites
    .filter(f => f.archives)
    .map(f => {
      const a = f.archives!;
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
        district: a.districts ? { ...DEFAULT_DISTRICT, id: a.districts.id, name: a.districts.name, name_kannada: a.districts.name_kannada } : DEFAULT_DISTRICT,
        category: a.categories ? { ...DEFAULT_CATEGORY, id: a.categories.id, name: a.categories.name, name_kannada: a.categories.name_kannada, slug: a.categories.slug, color: a.categories.color || '#2563eb' } : DEFAULT_CATEGORY,
        metadata: a.metadata || {},
        created_at: a.created_at || new Date().toISOString(),
      };
    });



  // --- XP Rank Logic ---
  const xp = (uploadCount * 25) + (bookmarkCount * 10);
  
  let rankTitle = 'Novice Archivist Clerk';
  let rankTitleKannada = 'ನವಶಿಷ್ಯ ಕ್ಲರ್ಕ್';
  let nextRankTitle = 'Scriptorium Scribe';
  let xpMin = 0;
  let xpMax = 50;
  let sealColor = 'bg-amber-600/80 border-amber-500';
  let certificateSeal = '📜';

  if (xp >= 150) {
    rankTitle = 'Chief Royal Archivist';
    rankTitleKannada = 'ಮುಖ್ಯ ರಾಜಕೀಯ ದಾಖಲೆಗಾರ';
    nextRankTitle = 'Archival Grandmaster';
    xpMin = 150;
    xpMax = 500;
    sealColor = 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)] border-yellow-400';
    certificateSeal = '👑';
  } else if (xp >= 80) {
    rankTitle = 'District Registrar';
    rankTitleKannada = 'ಜಿಲ್ಲಾ ದಾಖಲಾಧಿಕಾರಿ';
    nextRankTitle = 'Chief Royal Archivist';
    xpMin = 80;
    xpMax = 150;
    sealColor = 'bg-indigo-600 border-indigo-400';
    certificateSeal = '🏛️';
  } else if (xp >= 30) {
    rankTitle = 'Scriptorium Scribe';
    rankTitleKannada = 'ಲಿಪಿಕಾರ';
    nextRankTitle = 'District Registrar';
    xpMin = 30;
    xpMax = 80;
    sealColor = 'bg-emerald-600 border-emerald-400';
    certificateSeal = '✒️';
  }

  const rankProgress = Math.min(100, Math.max(0, ((xp - xpMin) / (xpMax - xpMin)) * 100));
  const xpNeeded = xpMax - xp;

  const playSound = (type: 'click' | 'chime' | 'major' | 'rustle') => {
    const soundPref = localStorage.getItem('neurive_sound_fx') === 'true';
    if (!soundPref) return;
    if (type === 'click') audioSynth.playTypewriterClick(false);
    else if (type === 'chime') audioSynth.playHologramChime(false);
    else if (type === 'major') audioSynth.playHologramChime(true);
    else if (type === 'rustle') audioSynth.playPaperRustle();
  };

  const handleSignOut = async () => {
    playSound('click');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const isSkeuomorphic = theme === 'skeuomorphic';

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-primary/20 shadow-sm">
              <AvatarFallback className="bg-primary/15 text-primary font-bold text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-black text-foreground tracking-tight flex items-center gap-1.5">
                My Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">
                {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'User'}
                {profile?.organization ? ` · ${profile.organization}` : ''}
                {profile?.created_at ? ` · Joined ${new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}` : ''}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link href="/upload" onClick={() => playSound('click')}>
              <Button size="sm" variant="outline" className="gap-1.5"><Upload className="h-3.5 w-3.5" />Upload</Button>
            </Link>
            <Link href="/search" onClick={() => playSound('click')}>
              <Button size="sm" className="gap-1.5"><Search className="h-3.5 w-3.5" />Search</Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>

        {/* Archivist Guild Rank & Achievements */}
        <div className="mb-6">
          <div className={`p-5 rounded-xl border shadow-sm relative overflow-hidden transition-all duration-300 ${
            isSkeuomorphic 
              ? 'bg-[#fcfaf2] border-amber-900/20 text-[#4a3b32] shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),0_4px_8px_rgba(0,0,0,0.05)] border-l-4 border-l-amber-700'
              : 'bg-card/40 backdrop-blur-md border-border/80 relative before:absolute before:inset-0 before:bg-[linear-gradient(to_right,hsl(var(--primary)/0.05)_1px,transparent_1px)] before:bg-[size:20px_100%] border-l-4 border-l-primary'
          }`}>
            {/* Background elements */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none transform translate-x-4 -translate-y-4 scale-150">
              <Award className="h-40 w-40 text-foreground" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              {/* Guild Badge and Titles */}
              <div className="flex items-center gap-4">
                <div 
                  onMouseEnter={() => playSound('chime')}
                  onClick={() => playSound('major')}
                  className={`w-14 h-14 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer hover:rotate-12 transition-transform duration-300 ${sealColor}`}
                >
                  <span className="text-2xl">{certificateSeal}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${
                      isSkeuomorphic 
                        ? 'bg-amber-900/10 text-amber-900' 
                        : 'bg-primary/10 text-primary border border-primary/20'
                    }`}>
                      Archivist Guild
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">Rank Tier</span>
                  </div>
                  <h3 className={`text-lg font-black tracking-tight mt-0.5 ${
                    isSkeuomorphic ? 'font-serif text-[#3e2716]' : 'text-foreground'
                  }`}>
                    {rankTitle} <span className="text-muted-foreground font-normal text-sm font-sans">({rankTitleKannada})</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Earned by securing historical catalog entries, review operations, and search ledger verification scans.
                  </p>
                </div>
              </div>

              {/* Progress & Certificate Trigger */}
              <div className="flex-1 max-w-sm w-full">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-muted-foreground font-mono">{xp} XP Total</span>
                  <span className="text-muted-foreground font-mono">{xpNeeded > 0 ? `${xpNeeded} XP to ${nextRankTitle}` : 'Max Rank Achieved'}</span>
                </div>
                <div className={`h-2.5 rounded-full overflow-hidden w-full border ${
                  isSkeuomorphic ? 'bg-amber-900/10 border-amber-900/20' : 'bg-muted border-border'
                }`}>
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      isSkeuomorphic 
                        ? 'bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-800' 
                        : 'bg-gradient-to-r from-primary via-violet-500 to-indigo-600 animate-pulse'
                    }`}
                    style={{ width: `${rankProgress}%` }}
                  />
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground">Verification Ledger Status: <span className="text-emerald-500 font-semibold font-mono">ONLINE</span></span>
                  <Button 
                    onClick={() => {
                      playSound('rustle');
                      setShowCert(true);
                    }} 
                    size="sm" 
                    variant="outline" 
                    className={`h-7 px-2.5 text-[11px] font-semibold gap-1.5 ${
                      isSkeuomorphic 
                        ? 'border-amber-700/30 text-amber-900 hover:bg-amber-900/5 font-serif' 
                        : 'border-primary/20 text-primary hover:bg-primary/5'
                    }`}
                  >
                    <Award className="h-3 w-3" />
                    Official Certificate
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Bookmarks', value: bookmarkCount.toString(), icon: BookmarkCheck, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
            { label: 'Ingested Scrolls', value: uploadCount.toString(), icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
            { label: 'Guild Achievements', value: (xp >= 150 ? '3' : xp >= 80 ? '2' : xp >= 30 ? '1' : '0'), icon: Award, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
            { label: 'Total Searches', value: '12', icon: Search, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border shadow-sm bg-card/40 backdrop-blur-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`${bg} ${color} p-2 rounded-lg`}><Icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-2xl font-black text-foreground tracking-tight">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="uploads" className="w-full">
          <TabsList className="mb-4 bg-muted/50 border shadow-inner">
            <TabsTrigger value="uploads" className="text-xs font-semibold" onClick={() => playSound('click')}>My Ingested Documents</TabsTrigger>
            <TabsTrigger value="bookmarks" className="text-xs font-semibold" onClick={() => playSound('click')}>Saved Bookmarks</TabsTrigger>
            <TabsTrigger value="history" className="text-xs font-semibold" onClick={() => playSound('click')}>Search History Ledger</TabsTrigger>
          </TabsList>

          <TabsContent value="uploads" className="space-y-4">
            {userArchiveCards.length > 0 ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {userArchiveCards.map((archive) => (
                  <ArchiveCard key={archive.id} archive={archive} />
                ))}
              </div>
            ) : uploads.length > 0 ? (
              <Card className="border shadow-sm">
                <CardContent className="p-0">
                  <div className="divide-y">
                    {uploads.map((u) => (
                      <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{u.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {(u.file_size / 1024 / 1024).toFixed(2)} MB · {u.file_type.toUpperCase()}
                          </p>
                        </div>
                        <Badge variant="secondary" className={
                          u.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          u.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          u.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-muted text-muted-foreground'
                        }>
                          {u.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {new Date(u.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12 border border-dashed rounded-xl">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3 font-semibold">No ingested documents recorded yet</p>
                <Link href="/upload" onClick={() => playSound('click')}>
                  <Button className="gap-2"><Upload className="h-4 w-4" />Ingest New Document</Button>
                </Link>
              </div>
            )}
            {userArchiveCards.length > 0 && (
              <div className="mt-4 text-center">
                <Link href="/upload" onClick={() => playSound('click')}>
                  <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" />Ingest Another Document</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookmarks">
            {favoriteArchiveCards.length > 0 ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {favoriteArchiveCards.map((archive) => (
                  <ArchiveCard key={archive.id} archive={archive} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed rounded-xl">
                <BookmarkCheck className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3 font-semibold">No saved bookmarked documents yet</p>
                <Link href="/search" onClick={() => playSound('click')}>
                  <Button variant="outline" className="gap-2"><Search className="h-4 w-4" />Browse Digital Archives</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card className="border shadow-sm">
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-semibold">Search ledger records will populate as you perform vector queries</p>
                <Link href="/search" onClick={() => playSound('click')}>
                  <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                    <Search className="h-3.5 w-3.5" />Open Search Terminal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Certificate Modal */}
        {showCert && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="relative max-w-2xl w-full">
              {/* Theme-Specific Certificate Panel */}
              <div className={`p-6 sm:p-10 border-double shadow-2xl relative select-none max-h-[90vh] overflow-y-auto ${
                isSkeuomorphic 
                  ? 'bg-[#FAF6EB] border-[10px] border-[#3D2314] rounded-md text-[#3E2716] font-serif shadow-[0_15px_50px_rgba(0,0,0,0.5)]'
                  : 'bg-slate-950/95 border border-cyan-500/50 rounded-2xl text-slate-100 font-mono shadow-[0_0_80px_rgba(6,182,212,0.25)] before:absolute before:inset-0 before:bg-[linear-gradient(to_right,rgba(6,182,212,0.03)_1px,transparent_1px)] before:bg-[size:30px_100%] before:pointer-events-none'
              }`}>
                {/* Gold/Electric corner ornaments */}
                <div className={`absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 ${isSkeuomorphic ? 'border-[#3D2314]/30' : 'border-cyan-500/30'}`} />
                <div className={`absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 ${isSkeuomorphic ? 'border-[#3D2314]/30' : 'border-cyan-500/30'}`} />
                <div className={`absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 ${isSkeuomorphic ? 'border-[#3D2314]/30' : 'border-cyan-500/30'}`} />
                <div className={`absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 ${isSkeuomorphic ? 'border-[#3D2314]/30' : 'border-cyan-500/30'}`} />

                {/* Close Button */}
                <button 
                  onClick={() => {
                    playSound('click');
                    setShowCert(false);
                  }}
                  className={`absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/10 transition-colors ${
                    isSkeuomorphic ? 'text-amber-950/70 hover:bg-[#3D2314]/5' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Content */}
                <div className="text-center">
                  
                  {/* Decorative Badge */}
                  <div className="flex justify-center mb-4">
                    <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-md ${
                      isSkeuomorphic 
                        ? 'bg-amber-100 border-[#3D2314] text-[#3D2314]' 
                        : 'bg-cyan-950/50 border-cyan-500 text-cyan-400 animate-pulse'
                    }`}>
                      <Award className="h-8 w-8" />
                    </div>
                  </div>

                  <p className={`text-[10px] uppercase font-bold tracking-widest ${
                    isSkeuomorphic ? 'text-amber-900/80 font-serif' : 'text-cyan-400 font-mono'
                  }`}>
                    {isSkeuomorphic ? 'Karnātaka Śāsana Digital Archives' : 'Neurive Digital Archival Registry'}
                  </p>
                  
                  <h2 className={`text-2xl font-black mt-2 tracking-tight ${
                    isSkeuomorphic ? 'font-serif text-[#3E2716] border-b border-amber-900/10 pb-2 max-w-md mx-auto' : 'text-white'
                  }`}>
                    {isSkeuomorphic ? 'Scribal Guild Credentials' : 'DECENTRALIZED OFFICE SEAL'}
                  </h2>

                  {!isSkeuomorphic && (
                    <div className="text-[9px] text-cyan-500/50 font-mono mt-1">
                      BLOCK-HASH: SHA-256/240-B9F2E7D1-0A83-492B
                    </div>
                  )}

                  <p className={`text-sm italic leading-relaxed max-w-md mx-auto mt-6 ${
                    isSkeuomorphic ? 'text-[#5d4637] font-serif' : 'text-slate-300 font-sans'
                  }`}>
                    "Be it known across the scribal scriptoriums of Kittur, Kalyana, Old Mysore, and the shores of Dakshina Kannada, that the diligent registrar designated as:"
                  </p>

                  <div className={`my-4 p-3 rounded-lg border text-center ${
                    isSkeuomorphic 
                      ? 'bg-amber-900/5 border-amber-900/10 text-amber-950 font-serif text-base font-bold' 
                      : 'bg-slate-900/60 border-cyan-500/20 text-cyan-400 font-mono text-sm'
                  }`}>
                    {profile?.email || user?.email}
                  </div>

                  <p className={`text-sm leading-relaxed max-w-sm mx-auto ${
                    isSkeuomorphic ? 'text-[#5d4637]' : 'text-slate-300 font-sans'
                  }`}>
                    having contributed <span className="font-bold font-mono">{uploadCount}</span> historical documents and verified <span className="font-bold font-mono">{bookmarkCount}</span> ledger registry citations, is officially admitted to the office of:
                  </p>

                  {/* Large Title */}
                  <h3 className={`text-3xl font-extrabold my-6 tracking-tight ${
                    isSkeuomorphic 
                      ? 'font-serif italic text-amber-900 underline decoration-double decoration-amber-950/20' 
                      : 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-indigo-400 animate-pulse'
                  }`}>
                    {rankTitle}
                  </h3>

                  <div className={`text-xs max-w-md mx-auto grid grid-cols-2 gap-4 border-t pt-4 text-left ${
                    isSkeuomorphic ? 'border-amber-900/10 text-amber-900/80 font-serif' : 'border-slate-800 text-slate-400 font-mono'
                  }`}>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-muted-foreground">Registry Date</span>
                      <span className="font-semibold text-foreground">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[9px] uppercase font-bold text-muted-foreground">Archival XP Score</span>
                      <span className="font-semibold text-foreground">{xp} Points</span>
                    </div>
                  </div>

                  {/* Signatures & Seal */}
                  <div className="flex items-center justify-between mt-8 border-t border-dashed pt-6 max-w-md mx-auto">
                    <div className="text-left">
                      <p className={`text-xs font-semibold ${isSkeuomorphic ? 'font-serif text-[#3E2716]' : 'text-white'}`}>
                        {isSkeuomorphic ? 'J. G. Gowda' : 'VERIFIED ENGINE'}
                      </p>
                      <p className="text-[9px] text-muted-foreground">Chief Royal Registrar</p>
                    </div>
                    
                    {/* Seal Stamp */}
                    <div 
                      onClick={() => playSound('major')}
                      className={`w-14 h-14 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer shadow-md select-none transform hover:scale-105 active:scale-95 transition-all ${
                        isSkeuomorphic
                          ? 'bg-red-700 border-yellow-500 text-yellow-400 font-bold rotate-12'
                          : 'bg-cyan-500/10 border-cyan-500 text-cyan-400 animate-pulse font-mono text-[9px]'
                      }`}
                    >
                      {isSkeuomorphic ? <span className="text-xl">👑</span> : <span className="text-center font-bold tracking-tight">VERIFIED</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-8 flex gap-3 justify-center">
                    <Button 
                      onClick={() => {
                        playSound('click');
                        window.print();
                      }}
                      className="gap-2 text-xs"
                      size="sm"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print Certificate
                    </Button>
                    <Button 
                      onClick={() => {
                        playSound('chime');
                        setShowCert(false);
                      }}
                      variant="outline"
                      className="text-xs"
                      size="sm"
                    >
                      Return to Desk
                    </Button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}

