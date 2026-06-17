'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { audioSynth } from '@/lib/audio';
import { supabase } from '@/lib/supabase';
import { Settings, Database, Users, FileText, Upload, ChartBar as BarChart3, Shield, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, Clock, Trash2, CreditCard as Edit, RefreshCw, Download, Plus, Search, Filter, Eye, ChevronRight, CheckCircle, XCircle, Compass, Globe, Layers, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/app-layout';
import { StatCard } from '@/components/stat-card';
import { getMockArchives, ARCHIVE_CATEGORIES, KARNATAKA_DISTRICTS } from '@/lib/mock-data';
import Link from 'next/link';
import { ReviewerGuide } from '@/components/admin/ReviewerGuide';

const MOCK_USERS = [
  { id: '1', name: 'Dr. Ramesh Kumar', email: 'r.kumar@ksarchives.gov.in', role: 'archivist', status: 'active', joined: '2024-01-15', uploads: 342 },
  { id: '2', name: 'Prof. Priya Nagaraj', email: 'p.nagaraj@univ.ac.in', role: 'researcher', status: 'active', joined: '2024-02-20', uploads: 89 },
  { id: '3', name: 'Suresh Gowda', email: 's.gowda@revdept.kar.gov.in', role: 'user', status: 'active', joined: '2024-03-10', uploads: 23 },
  { id: '4', name: 'Anitha Rao', email: 'a.rao@heritage.kar.gov.in', role: 'archivist', status: 'inactive', joined: '2023-11-05', uploads: 567 },
  { id: '5', name: 'Manjunath B.', email: 'm.b@judiciary.kar.gov.in', role: 'researcher', status: 'active', joined: '2024-04-01', uploads: 12 },
];

const SYSTEM_HEALTH = [
  { name: 'Database', status: 'healthy', latency: '12ms' },
  { name: 'Search Index', status: 'healthy', latency: '45ms' },
  { name: 'OCR Service', status: 'healthy', latency: '234ms' },
  { name: 'AI Embeddings', status: 'degraded', latency: '890ms' },
  { name: 'File Storage', status: 'healthy', latency: '56ms' },
  { name: 'CDN', status: 'healthy', latency: '23ms' },
];

const RECENT_UPLOADS = [
  { title: 'Survey Settlement Mysuru 1901', category: 'Land Records', status: 'processed', user: 'Dr. Ramesh Kumar', time: '10 min ago' },
  { title: 'High Court Order Bengaluru 1967', category: 'Court Records', status: 'processing', user: 'Prof. Priya Nagaraj', time: '25 min ago' },
  { title: 'Temple Endowment Hampi 1875', category: 'Temple Records', status: 'processed', user: 'Suresh Gowda', time: '1 hour ago' },
  { title: 'Gazette Notification Karnataka 1956', category: 'Gazette', status: 'failed', user: 'Anitha Rao', time: '2 hours ago' },
  { title: 'Census Record Dharwad 1921', category: 'Census Records', status: 'processed', user: 'Manjunath B.', time: '3 hours ago' },
];

export default function AdminPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isSkeuomorphic = theme === 'skeuomorphic';
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [adminRole, setAdminRole] = useState<'Super Admin' | 'System Admin' | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [impersonateRole, setImpersonateRole] = useState<'guest' | 'researcher' | 'admin'>('admin');

  const playSound = (type: 'click' | 'chime' | 'major' | 'rustle') => {
    const soundPref = localStorage.getItem('neurive_sound_fx') === 'true';
    if (!soundPref) return;
    if (type === 'click') audioSynth.playTypewriterClick(false);
    else if (type === 'chime') audioSynth.playHologramChime(false);
    else if (type === 'major') audioSynth.playHologramChime(true);
    else if (type === 'rustle') audioSynth.playPaperRustle();
  };

  const [searchUser, setSearchUser] = useState('');
  const { archives } = getMockArchives(1, 10);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user;
      if (!user) {
        setAuthorized(false);
        setLoading(false);
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
        return;
      }
      
      const email = user.email;
      setUserEmail(email || null);
      if (email === 'jeevangowdahm6@gmail.com') {
        setAuthorized(true);
        setAdminRole('Super Admin');
      } else if (email === 'jeevangowda082007@gmail.com') {
        setAuthorized(true);
        setAdminRole('System Admin');
      } else if (email === 'user@neurive.karnataka.gov.in') {
        setAuthorized(true);
        setAdminRole('System Admin');
      } else {
        setAuthorized(false);
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
      setLoading(false);
    });
  }, [router]);

  const filteredUsers = MOCK_USERS.filter(u =>
    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const statusColor = (status: string) => ({
    healthy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    degraded: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    down: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  })[status] || '';

  const uploadStatusColor = (s: string) => ({
    processed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  })[s] || '';

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
          <div className="relative flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Shield className="h-6 w-6 text-primary absolute animate-pulse" />
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Authenticating Administrative Credentials...</p>
        </div>
      </AppLayout>
    );
  }

  if (!authorized) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 max-w-md mx-auto min-h-[70vh] flex flex-col justify-center">
          <Card className="border-red-500/20 bg-red-950/5 backdrop-blur-md overflow-hidden relative shadow-[0_0_50px_rgba(239,68,68,0.1)]">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse" />
            <CardContent className="p-8 text-center flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 animate-bounce">
                <Shield className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Access Denied</h2>
              <Badge variant="outline" className="border-red-500/30 text-red-500 bg-red-500/5 mb-4">Strict Restricted Access</Badge>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Your account ({userEmail || 'Guest'}) does not have the necessary permissions to access the Administration Panel. This event has been logged for security audit.
              </p>
              <div className="w-full bg-muted/50 rounded-lg p-3 flex items-center gap-3 border text-left mb-6">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <div className="flex-1">
                  <p className="text-[11px] text-muted-foreground uppercase font-semibold">Redirecting Security Tunnel</p>
                  <p className="text-xs text-foreground font-medium">Returning to Dashboard in 3 seconds...</p>
                </div>
              </div>
              <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full gap-2">
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Settings className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
              <Badge variant="secondary" className={adminRole === 'Super Admin' ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-[10px]" : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-[10px]"}>
                {adminRole}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Platform management and oversight</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/analytics">
              <Button variant="outline" size="sm" className="gap-1.5 border-primary/20 text-primary hover:bg-primary/10">
                <BarChart3 className="h-3.5 w-3.5" />
                Analytics Dashboard
              </Button>
            </Link>
            <Link href="/admin/testing">
              <Button variant="outline" size="sm" className="gap-1.5 border-purple-500/20 text-purple-400 hover:bg-purple-500/10">
                <Shield className="h-3.5 w-3.5" />
                Testing Suite
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.location.reload()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Records" value="1,000,000+" icon={Database} color="text-blue-600" />
          <StatCard title="Total Users" value="8,432" icon={Users} color="text-emerald-600" trend={{ value: 23, label: 'this month' }} />
          <StatCard title="Pending OCR" value="265,479" icon={FileText} color="text-amber-600" />
          <StatCard title="System Alerts" value="1" icon={AlertCircle} color="text-red-600" />
        </div>


        {/* Quick Link Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Database Explorer Quick Link */}
          <Link href="/admin/database" className="block group h-full">
            <div className="border border-amber-900/10 bg-amber-50 dark:bg-amber-950/10 p-5 rounded-lg shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.1)] hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_8px_16px_rgba(139,90,43,0.15)] transition-all duration-300 relative overflow-hidden border-l-4 border-l-amber-600 h-full flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <Database className="h-40 w-40 text-amber-900" />
              </div>
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-sm font-bold text-amber-900 dark:text-amber-400 group-hover:text-amber-700 transition-colors flex items-center gap-2">
                    <Database className="h-4.5 w-4.5 text-amber-600 animate-pulse" />
                    Interactive Database Registry Ledger & SQL Explorer
                  </h3>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-1 max-w-2xl leading-relaxed">
                    Access the heavy walnut archiving cabinet containing live records from the Supabase databases. Run custom SQL queries via the Scribe's Typewriter, audit RLS rules, and inspect the entity relationship schemas.
                  </p>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" className="border-amber-600/30 text-amber-800 dark:text-amber-400 hover:bg-amber-600/10 text-xs h-8 gap-2 group-hover:translate-x-1 transition-transform">
                    Open Cabinet Registry
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </Link>

          {/* AI Archivist Ingestion Agent Quick Link */}
          <Link href="/admin/agent" className="block group h-full">
            <div className="border border-emerald-900/10 bg-emerald-50 dark:bg-emerald-950/10 p-5 rounded-lg shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.1)] hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_8px_16px_rgba(57,255,20,0.15)] transition-all duration-300 relative overflow-hidden border-l-4 border-l-emerald-600 h-full flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <Compass className="h-40 w-40 text-emerald-900" />
              </div>
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-400 group-hover:text-emerald-700 transition-colors flex items-center gap-2">
                    <Compass className="h-4.5 w-4.5 text-emerald-600 animate-pulse" />
                    Autonomous Scribal AI Ingestion & Copilot Desk
                  </h3>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-1 max-w-2xl leading-relaxed">
                    Boot the multimodal scanning agent to digitize, chunk, embed, and index historical records. Chat with the Archivist Copilot to translate Kannada decrees, run OCR, and audit secure ledger insertions.
                  </p>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" className="border-emerald-600/30 text-[#0f5132] dark:text-emerald-400 hover:bg-emerald-600/10 text-xs h-8 gap-2 group-hover:translate-x-1 transition-transform">
                    Launch Ingestion Agent
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Archival Ingestion & Dataset Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Real Sources Ingestion Console */}
          <Link href="/admin/real-sources" className="block group h-full">
            <Card className="border hover:border-primary/50 hover:shadow-md transition-all h-full flex flex-col justify-between">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">Real Public Sources Sync</CardTitle>
                    <CardDescription className="text-[10px]">Ingest free Gazettes & Government PDFs</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-4 text-xs text-muted-foreground leading-relaxed flex-col justify-between h-full flex">
                <p>Query official repositories like the Internet Archive and Karnataka Gazette portal to sync real document chunks.</p>
                <div className="mt-4 flex justify-end text-[10px] text-primary font-bold items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Open Sync Console <ChevronRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Wikipedia Ingestion Bridge */}
          <Link href="/admin/wikipedia-ingest" className="block group h-full">
            <Card className="border hover:border-primary/50 hover:shadow-md transition-all h-full flex flex-col justify-between">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">Wikipedia Ingest Bridge</CardTitle>
                    <CardDescription className="text-[10px]">Convert public Wiki sections to pages</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-4 text-xs text-muted-foreground leading-relaxed flex-col justify-between h-full flex">
                <p>Search Wikipedia, run Karnataka relevance validations, and automatically parse articles into pages and KG nodes.</p>
                <div className="mt-4 flex justify-end text-[10px] text-primary font-bold items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Open Wiki Bridge <ChevronRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Dataset Planner & target capacity */}
          <Link href="/admin/dataset" className="block group h-full">
            <Card className="border hover:border-primary/50 hover:shadow-md transition-all h-full flex flex-col justify-between">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Database className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">100M Dataset Planner</CardTitle>
                    <CardDescription className="text-[10px]">Archival storage aggregates and logs</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-4 text-xs text-muted-foreground leading-relaxed flex-col justify-between h-full flex">
                <p>Verify document formats, OCR quality confidence counts, batch lists, and target capacity plans for 100M records.</p>
                <div className="mt-4 flex justify-end text-[10px] text-primary font-bold items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Open Dataset Dashboard <ChevronRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* API Keys & Integrations Card */}
          <Link href="/admin/keys" className="block group h-full">
            <Card className="border hover:border-primary/50 hover:shadow-md transition-all h-full flex flex-col justify-between">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Key className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">API Keys & Integrations</CardTitle>
                    <CardDescription className="text-[10px]">Configure and test Gemini API Keys</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-4 text-xs text-muted-foreground leading-relaxed flex-col justify-between h-full flex">
                <p>Manage connection overrides for search, OCR agent ingestion, chat bot, online PDF finder, and knowledge graph.</p>
                <div className="mt-4 flex justify-end text-[10px] text-primary font-bold items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Configure Keys <ChevronRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Dynamic RLS Security Impersonation & Audit Console */}
        <div className="mb-6">
          <div className={`p-5 rounded-xl border shadow-sm relative overflow-hidden transition-all duration-300 ${
            isSkeuomorphic 
              ? 'bg-[#fcfaf2] border-amber-900/20 text-[#4a3b32] shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),0_4px_8px_rgba(0,0,0,0.05)] border-l-4 border-l-[#a855f7]'
              : 'bg-slate-950/45 backdrop-blur-md border-border/80 border-l-4 border-l-purple-500'
          }`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-dashed border-muted-foreground/20">
              <div>
                <h3 className={`text-base font-black tracking-tight flex items-center gap-2 ${
                  isSkeuomorphic ? 'font-serif text-[#3e2716]' : 'text-foreground'
                }`}>
                  <Shield className="h-4.5 w-4.5 text-purple-500 animate-pulse" />
                  Row-Level Security (RLS) Impersonator Desk
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Audit Postgres security policies dynamically. Impersonating different participant roles filters search results and tables in real-time.
                </p>
              </div>
              <Badge variant="outline" className="border-purple-500/30 text-purple-500 bg-purple-500/5 w-fit h-6 self-start sm:self-center font-mono text-[10px]">
                RLS Simulator Active
              </Badge>
            </div>

            {/* Impersonator Layout Grid */}
            <div className="grid lg:grid-cols-3 gap-6 items-start">
              
              {/* Role Select Buttons */}
              <div className="space-y-2.5">
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Impersonation Role</span>
                
                {/* Role 1: Guest */}
                <button
                  onClick={() => {
                    playSound('click');
                    setImpersonateRole('guest');
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                    impersonateRole === 'guest'
                      ? (isSkeuomorphic ? 'bg-amber-900/10 border-amber-900/40 font-semibold' : 'bg-purple-500/10 border-purple-500 text-purple-400 font-semibold')
                      : 'hover:bg-muted/30 border-border/60 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    <div>
                      <p className="text-xs font-bold leading-none">Public Anon Guest</p>
                      <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">Role: `anon` (unauthenticated)</p>
                    </div>
                  </div>
                  {impersonateRole === 'guest' && <div className="h-2 w-2 rounded-full bg-purple-500 animate-ping" />}
                </button>

                {/* Role 2: Researcher */}
                <button
                  onClick={() => {
                    playSound('click');
                    setImpersonateRole('researcher');
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                    impersonateRole === 'researcher'
                      ? (isSkeuomorphic ? 'bg-amber-900/10 border-amber-900/40 font-semibold' : 'bg-purple-500/10 border-purple-500 text-purple-400 font-semibold')
                      : 'hover:bg-muted/30 border-border/60 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔬</span>
                    <div>
                      <p className="text-xs font-bold leading-none">Registered Researcher</p>
                      <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">Role: `authenticated` (restricted)</p>
                    </div>
                  </div>
                  {impersonateRole === 'researcher' && <div className="h-2 w-2 rounded-full bg-purple-500 animate-ping" />}
                </button>

                {/* Role 3: Super Admin */}
                <button
                  onClick={() => {
                    playSound('major');
                    setImpersonateRole('admin');
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                    impersonateRole === 'admin'
                      ? (isSkeuomorphic ? 'bg-amber-900/10 border-amber-900/40 font-semibold' : 'bg-purple-500/10 border-purple-500 text-purple-400 font-semibold')
                      : 'hover:bg-muted/30 border-border/60 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👑</span>
                    <div>
                      <p className="text-xs font-bold leading-none">Super Admin / Registrar</p>
                      <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">Role: `service_role` (bypass RLS)</p>
                    </div>
                  </div>
                  {impersonateRole === 'admin' && <div className="h-2 w-2 rounded-full bg-purple-500 animate-ping" />}
                </button>
              </div>

              {/* RLS Policy Checklists */}
              <div className="space-y-2.5">
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Policy Audit Checklist</span>
                <div className={`p-3 rounded-lg border text-xs divide-y divide-border/30 space-y-1.5 ${
                  isSkeuomorphic ? 'bg-amber-900/5 border-amber-900/10 text-amber-950/80' : 'bg-background/40'
                }`}>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] font-mono leading-none">1. Select Public Archives</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 gap-1 text-[9px] h-5 py-0">
                      <CheckCircle className="h-2.5 w-2.5 text-green-600 dark:text-green-400" /> PERMITTED
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] font-mono leading-none">2. Select Restricted Archives</span>
                    {impersonateRole === 'guest' ? (
                      <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 gap-1 text-[9px] h-5 py-0">
                        <XCircle className="h-2.5 w-2.5 text-red-600 dark:text-red-400" /> BLOCKED
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 gap-1 text-[9px] h-5 py-0">
                        <CheckCircle className="h-2.5 w-2.5 text-green-600 dark:text-green-400" /> PERMITTED
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] font-mono leading-none">3. Select Confidential Archives</span>
                    {impersonateRole === 'admin' ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 gap-1 text-[9px] h-5 py-0">
                        <CheckCircle className="h-2.5 w-2.5 text-green-600 dark:text-green-400" /> PERMITTED
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 gap-1 text-[9px] h-5 py-0">
                        <XCircle className="h-2.5 w-2.5 text-red-600 dark:text-red-400" /> BLOCKED
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] font-mono leading-none">4. Insert / Write Archives Table</span>
                    {impersonateRole === 'admin' ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 gap-1 text-[9px] h-5 py-0">
                        <CheckCircle className="h-2.5 w-2.5 text-green-600 dark:text-green-400" /> PERMITTED
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 gap-1 text-[9px] h-5 py-0">
                        <XCircle className="h-2.5 w-2.5 text-red-600 dark:text-red-400" /> BLOCKED
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* simulated SQL Query Box */}
              <div className="space-y-2.5">
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Simulated Postgres SQL Execution</span>
                <div className={`p-3 rounded-lg text-[10px] leading-relaxed font-mono h-[108px] overflow-hidden ${
                  isSkeuomorphic 
                    ? 'bg-[#faf6eb] border border-amber-900/10 text-amber-950/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]' 
                    : 'bg-black/80 border border-purple-500/20 text-purple-400/80 shadow-inner'
                }`}>
                  {impersonateRole === 'guest' && (
                    <>
                      <span className="text-yellow-600 font-semibold">SET ROLE</span> anon;<br />
                      <span className="text-blue-500 font-semibold">SELECT</span> * <span className="text-blue-500 font-semibold">FROM</span> archives<br />
                      <span className="text-blue-500 font-semibold">WHERE</span> access_level = <span className="text-emerald-600">'public'</span>;<br />
                      <span className="text-muted-foreground mt-1.5 block">-- [AUDIT] policy 'select_public_archives' applied. Anon public role filters 73% of rows.</span>
                    </>
                  )}
                  {impersonateRole === 'researcher' && (
                    <>
                      <span className="text-yellow-600 font-semibold">SET ROLE</span> authenticated;<br />
                      <span className="text-blue-500 font-semibold">SELECT</span> * <span className="text-blue-500 font-semibold">FROM</span> archives<br />
                      <span className="text-blue-500 font-semibold">WHERE</span> access_level <span className="text-blue-500 font-semibold">IN</span> (<span className="text-emerald-600">'public'</span>, <span className="text-emerald-600">'restricted'</span>);<br />
                      <span className="text-muted-foreground mt-1.5 block">-- [AUDIT] policy 'select_researcher_archives' applied. Confidential columns locked.</span>
                    </>
                  )}
                  {impersonateRole === 'admin' && (
                    <>
                      <span className="text-yellow-600 font-semibold">SET ROLE</span> service_role;<br />
                      <span className="text-blue-500 font-semibold">SELECT</span> * <span className="text-blue-500 font-semibold">FROM</span> archives;<br />
                      <span className="text-muted-foreground mt-3.5 block">-- [AUDIT] RLS Bypass flag detected. Full database indexing visibility unlocked.</span>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        <Tabs defaultValue="archives">
          <TabsList className="mb-4">
            <TabsTrigger value="archives" className="text-xs">Archives</TabsTrigger>
            <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
            <TabsTrigger value="uploads" className="text-xs">Upload Queue</TabsTrigger>
            <TabsTrigger value="system" className="text-xs">System Health</TabsTrigger>
          </TabsList>

          <TabsContent value="archives">
            <Card className="border">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Archive Records Management</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Download className="h-3 w-3" />Export</Button>
                    <Link href="/upload"><Button size="sm" className="h-7 text-xs gap-1"><Plus className="h-3 w-3" />Add Record</Button></Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 pr-3 font-medium">Title</th>
                        <th className="text-left py-2 pr-3 font-medium hidden md:table-cell">Category</th>
                        <th className="text-left py-2 pr-3 font-medium hidden lg:table-cell">District</th>
                        <th className="text-left py-2 pr-3 font-medium">Year</th>
                        <th className="text-left py-2 pr-3 font-medium">Status</th>
                        <th className="text-left py-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {archives.map((archive) => (
                        <tr key={archive.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 pr-3">
                            <p className="font-medium text-foreground truncate max-w-[180px]">{archive.title}</p>
                            <p className="text-muted-foreground">{archive.accession_number}</p>
                          </td>
                          <td className="py-2.5 pr-3 hidden md:table-cell text-muted-foreground">{archive.category.name}</td>
                          <td className="py-2.5 pr-3 hidden lg:table-cell text-muted-foreground">{archive.district.name}</td>
                          <td className="py-2.5 pr-3 text-muted-foreground">{archive.year}</td>
                          <td className="py-2.5 pr-3">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-[10px]">Active</Badge>
                          </td>
                          <td className="py-2.5">
                            <div className="flex gap-1">
                              <Link href={`/archive/${archive.id}`}>
                                <button className="p-1 text-muted-foreground hover:text-primary transition-colors"><Eye className="h-3.5 w-3.5" /></button>
                              </Link>
                              <button className="p-1 text-muted-foreground hover:text-primary transition-colors"><Edit className="h-3.5 w-3.5" /></button>
                              <button className="p-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-sm">User Management</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input value={searchUser} onChange={(e) => setSearchUser(e.target.value)} placeholder="Search users..." className="h-7 pl-8 text-xs w-48" />
                    </div>
                    <Button size="sm" className="h-7 text-xs gap-1"><Plus className="h-3 w-3" />Invite</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 pr-3 font-medium">User</th>
                        <th className="text-left py-2 pr-3 font-medium hidden sm:table-cell">Role</th>
                        <th className="text-left py-2 pr-3 font-medium hidden md:table-cell">Uploads</th>
                        <th className="text-left py-2 pr-3 font-medium">Status</th>
                        <th className="text-left py-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 pr-3">
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-muted-foreground">{user.email}</p>
                          </td>
                          <td className="py-2.5 pr-3 hidden sm:table-cell">
                            <Badge variant="secondary" className="capitalize text-[10px]">{user.role}</Badge>
                          </td>
                          <td className="py-2.5 pr-3 hidden md:table-cell text-muted-foreground">{user.uploads}</td>
                          <td className="py-2.5 pr-3">
                            <Badge className={user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-[10px]' : 'bg-gray-100 text-gray-800 text-[10px]'}>
                              {user.status}
                            </Badge>
                          </td>
                          <td className="py-2.5">
                            <div className="flex gap-1">
                              <button className="p-1 text-muted-foreground hover:text-primary transition-colors"><Edit className="h-3.5 w-3.5" /></button>
                              <button className="p-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="uploads">
            <Card className="border">
              <CardContent className="p-0">
                <div className="divide-y">
                  {RECENT_UPLOADS.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                      {item.status === 'processed' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : item.status === 'processing' ? (
                        <Clock className="h-4 w-4 text-blue-500 shrink-0 animate-spin" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.category} · {item.user} · {item.time}</p>
                      </div>
                      <Badge className={`${uploadStatusColor(item.status)} text-[10px]`}>{item.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SYSTEM_HEALTH.map((service) => (
                <Card key={service.name} className="border">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${service.status === 'healthy' ? 'bg-green-500' : service.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{service.name}</p>
                      <p className="text-xs text-muted-foreground">Latency: {service.latency}</p>
                    </div>
                    <Badge className={statusColor(service.status) + ' text-[10px]'}>{service.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="border mt-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">AI Embeddings Service Degraded</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">Response time elevated. Investigating. Semantic search may be slower than usual.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <ReviewerGuide />
    </AppLayout>
  );
}
