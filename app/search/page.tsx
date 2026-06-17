'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, SlidersHorizontal, Sparkles, Mic, ChevronLeft, 
  ChevronRight, Brain, Lightbulb, Clock, Info, HelpCircle, X, Loader as Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/app-layout';
import { supabase } from '@/lib/supabase';
import { audioSynth } from '@/lib/audio';

// Import Feature 2 modular search components
import { FilterSidebar, SearchFiltersValues } from '@/components/search/FilterSidebar';
import { SearchResultCard, SearchResult } from '@/components/search/SearchResultCard';
import { SearchAnalytics } from '@/components/search/SearchAnalytics';

const SUGGESTED_QUERIES = [
  'Mysuru land records 1891',
  'Vijayanagara inscriptions Hampi',
  'Bengaluru representative assembly 1947',
  'Temple endowment records',
  'Kittur freedom struggle Belagavi'
];

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search input query states
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [inputQuery, setInputQuery] = useState(searchParams.get('q') || '');
  const [hasSearched, setHasSearched] = useState(!!searchParams.get('q'));
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Gemini Live configuration states
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [geminiKeyInput, setGeminiKeyInput] = useState<string>('');
  const [geminiModel, setGeminiModel] = useState<string>('gemini-1.5-flash');
  const [geminiVersion, setGeminiVersion] = useState<string>('v1');
  const [isCustomModel, setIsCustomModel] = useState<boolean>(false);
  const [customModelInput, setCustomModelInput] = useState<string>('');

  // Search results & analytics metadata
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');

  const [analytics, setAnalytics] = useState({
    totalResults: 0,
    responseTimeMs: 0,
    bestScore: 0.0,
    searchMode: 'Keyword Fallback',
    expandedQuery: '',
    districtsCount: 0,
    entitiesCount: 0,
    isMock: false
  });

  // Filter sidebar states
  const [filters, setFilters] = useState<SearchFiltersValues>({
    category: searchParams.get('category') || '',
    district: searchParams.get('district') || '',
    language: '',
    yearFrom: '',
    yearTo: '',
    ocrConfidence: '',
    docType: '',
    visibility: '',
    entityType: '',
    uploadedAfter: '',
    uploadedBefore: ''
  });

  // Load user settings, bookmarks, and user-specific logs on initialize
  useEffect(() => {
    const savedKey = localStorage.getItem('neurive_gemini_key') || '';
    if (savedKey) {
      setGeminiKey(savedKey);
      setGeminiKeyInput('••••••••••••••••••••');
    }

    const savedModel = localStorage.getItem('neurive_gemini_model') || 'gemini-1.5-flash';
    const savedVersion = localStorage.getItem('neurive_gemini_version') || 'v1';
    
    if (['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-8b'].includes(savedModel)) {
      setGeminiModel(savedModel);
      setIsCustomModel(false);
    } else {
      setGeminiModel('custom');
      setIsCustomModel(true);
      setCustomModelInput(savedModel);
    }
    setGeminiVersion(savedVersion);

    loadUserBookmarks();
    loadRecentSearches();
  }, []);

  const loadUserBookmarks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('favorites')
        .select('archive_id')
        .eq('user_id', user.id);

      if (data) {
        setBookmarks(data.map(f => f.archive_id));
      }
    } catch (err) {
      console.warn('Failed to load bookmarks:', err);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRecentSearches([]);
        return;
      }
      
      const { data } = await supabase
        .from('search_logs')
        .select('query')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        const unique = Array.from(new Set(data.map((l: any) => l.query))).slice(0, 5);
        setRecentSearches(unique);
      }
    } catch (err) {
      console.warn('Failed to load recent searches:', err);
    }
  };

  // Perform hybrid search call
  const performSearch = async (searchQuery: string, searchPage: number = 1) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    if (soundEnabled()) audioSynth.playTypewriterClick(true);

    try {
      const activeKey = localStorage.getItem('neurive_gemini_key') || '';
      const selectedModel = isCustomModel ? customModelInput : geminiModel;

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          limit: 20,
          page: searchPage,
          filters,
          apiKey: activeKey || undefined,
          model: selectedModel,
          version: geminiVersion
        })
      });

      if (!response.ok) {
        throw new Error('Search endpoint responded with error status');
      }

      const resJson = await response.json();
      if (resJson.success) {
        setSearchResults(resJson.data || []);
        
        // Populate analytics dashboard
        setAnalytics({
          totalResults: resJson.meta?.total || 0,
          responseTimeMs: resJson.meta?.response_time_ms || 0,
          bestScore: resJson.meta?.top_score || 0.0,
          searchMode: resJson.meta?.search_mode || 'Keyword Fallback',
          expandedQuery: resJson.meta?.expanded_query || searchQuery,
          districtsCount: resJson.meta?.districts_count || 0,
          entitiesCount: resJson.meta?.entities_count || 0,
          isMock: !!resJson.meta?.is_mock
        });
      }
    } catch (err) {
      console.error('Hybrid Search error:', err);
    } finally {
      setLoading(false);
      loadRecentSearches(); // reload logs to display latest searches
    }
  };

  // Run search on params or filters updates
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const categoryParam = searchParams.get('category') || '';
    const districtParam = searchParams.get('district') || '';
    
    // Set query state, hiding '*' placeholder if present from search input display
    const displayQuery = q === '*' ? '' : q;
    setQuery(displayQuery);
    setInputQuery(displayQuery);

    // Sync state filters with URL parameters to prevent state/URL mismatch
    const currentCategory = categoryParam || '';
    const currentDistrict = districtParam || '';
    if (filters.category !== currentCategory || filters.district !== currentDistrict) {
      setFilters(prev => ({
        ...prev,
        category: currentCategory,
        district: currentDistrict
      }));
    }

    if (q.trim() || categoryParam.trim() || districtParam.trim()) {
      performSearch(q || '*', page);
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [searchParams, page, filters]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    if (inputQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(inputQuery.trim())}`);
    }
  };

  const handleSaveSettings = () => {
    if (!geminiKeyInput.trim()) return;
    
    if (geminiKeyInput.trim() !== '••••••••••••••••••••') {
      localStorage.setItem('neurive_gemini_key', geminiKeyInput.trim());
      setGeminiKey(geminiKeyInput.trim());
      setGeminiKeyInput('••••••••••••••••••••');
    }

    const modelToSave = isCustomModel ? customModelInput.trim() : geminiModel;
    localStorage.setItem('neurive_gemini_model', modelToSave);
    localStorage.setItem('neurive_gemini_version', geminiVersion);

    alert('Gemini credentials saved for this session. Hybrid Search pgvector AI active.');
  };

  const handleClearSettings = () => {
    localStorage.removeItem('neurive_gemini_key');
    localStorage.removeItem('neurive_gemini_model');
    localStorage.removeItem('neurive_gemini_version');
    setGeminiKey('');
    setGeminiKeyInput('');
    setGeminiModel('gemini-1.5-flash');
    setGeminiVersion('v1');
    setIsCustomModel(false);
    setCustomModelInput('');
    alert('Gemini settings cleared. Search reverted to Keyword + metadata fallback.');
  };

  const toggleBookmark = async (docId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please login to bookmark historical documents');
        return;
      }

      if (bookmarks.includes(docId)) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('archive_id', docId);
        
        if (!error) {
          setBookmarks(prev => prev.filter(id => id !== docId));
        }
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([{ user_id: user.id, archive_id: docId }]);
        
        if (!error) {
          setBookmarks(prev => [...prev, docId]);
        }
      }
    } catch (err) {
      console.error('Bookmark toggle error:', err);
    }
  };

  const startVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechClass) {
      alert('Bilingual speech input is not supported in this browser. Try Google Chrome or Microsoft Edge.');
      return;
    }

    try {
      const rec = new SpeechClass();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'kn-IN'; // defaults to Kannada Voice commands

      rec.onstart = () => {
        setIsListening(true);
        if (soundEnabled()) audioSynth.playHologramChime(false);
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setInputQuery(text);
        router.push(`/search?q=${encodeURIComponent(text)}`);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const soundEnabled = () => {
    return localStorage.getItem('neurive_sound_fx') === 'true';
  };

  // Sort displayed archives
  const sortedSearchResults = useMemo(() => {
    const items = [...searchResults];
    if (sortBy === 'date_desc') {
      return items.sort((a, b) => b.year - a.year);
    } else if (sortBy === 'date_asc') {
      return items.sort((a, b) => a.year - b.year);
    } else {
      return items.sort((a, b) => b.final_score - a.final_score);
    }
  }, [searchResults, sortBy]);

  const totalPages = Math.ceil(analytics.totalResults / 20) || 1;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto text-foreground font-sans min-h-screen">
        
        {/* Search header details */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-serif text-white">
                AI Hybrid Search Portal
              </h1>
            </div>
            <p className="text-xs text-muted-foreground leading-normal">
              Execute advanced vector similarity search and keyword matching. Expand spelling synonyms and Kannada letters dynamically.
            </p>
          </div>
        </div>

        {/* Gemini configuration banner */}
        <Card className="mb-5 border-white/10 bg-white/5 backdrop-blur-sm shadow-md">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className={`h-4.5 w-4.5 ${geminiKey ? 'text-emerald-400 animate-pulse' : 'text-amber-500'}`} />
                <div>
                  <span className="text-xs font-semibold text-white">Server-side Embedding Configuration</span>
                  <p className="text-[10px] text-muted-foreground">
                    {geminiKey ? 'Gemini AI API connection active. Vector matches enabled.' : 'Offline Fallback mode. Add API key to query high-dimensional RAG embeddings.'}
                  </p>
                </div>
              </div>
              {geminiKey && (
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                  Embeddings Active
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">API Key</label>
                <Input
                  type="password"
                  placeholder="Gemini Studio API Key..."
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  className="h-8 text-[11px] bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Model Selection</label>
                <Select
                  value={geminiModel}
                  onValueChange={(v) => {
                    setGeminiModel(v);
                    setIsCustomModel(v === 'custom');
                  }}
                >
                  <SelectTrigger className="h-8 text-[11px] bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    <SelectItem value="gemini-1.5-flash" className="text-xs text-foreground">Gemini 1.5 Flash (Fast)</SelectItem>
                    <SelectItem value="gemini-2.0-flash" className="text-xs text-foreground">Gemini 2.0 Flash (Recommended)</SelectItem>
                    <SelectItem value="gemini-1.5-pro" className="text-xs text-foreground">Gemini 1.5 Pro (Deep)</SelectItem>
                    <SelectItem value="gemini-1.5-flash-8b" className="text-xs text-foreground">Gemini 1.5 Flash 8B</SelectItem>
                    <SelectItem value="custom" className="text-xs text-foreground">Custom Model Name...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">API Version</label>
                <Select value={geminiVersion} onValueChange={setGeminiVersion}>
                  <SelectTrigger className="h-8 text-[11px] bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select Version" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    <SelectItem value="v1" className="text-xs text-foreground">v1 (Recommended)</SelectItem>
                    <SelectItem value="v1beta" className="text-xs text-foreground">v1beta (Experimental)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isCustomModel && (
              <div className="space-y-1 pt-1 animate-slide-down">
                <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Custom Model Identifier</label>
                <Input
                  type="text"
                  placeholder="e.g. gemini-2.5-flash, gemini-2.0-pro-exp..."
                  value={customModelInput}
                  onChange={(e) => setCustomModelInput(e.target.value)}
                  className="h-8 text-[11px] bg-white/5 border-white/10 text-white w-full"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              {geminiKey && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-[10px] px-3 border-rose-500/20 hover:bg-rose-500/10 text-rose-400" 
                  onClick={handleClearSettings}
                >
                  Clear Key
                </Button>
              )}
              <Button 
                size="sm" 
                className="h-7 text-[10px] px-4 font-semibold bg-primary text-primary-foreground" 
                onClick={handleSaveSettings}
              >
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Large AI Search Input bar */}
        <form onSubmit={handleSearchSubmit} className="mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Search historical records (eg: Mysore land record, ವಿಜಯನಗರ ಶಿಲಾಶಾಸನ)..."
                className="pl-9 pr-10 h-11 bg-white/5 border-white/10 text-sm focus:border-primary/50 text-white"
              />
              {inputQuery && (
                <button 
                  type="button" 
                  onClick={() => setInputQuery('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Speech voice button */}
            <Button
              type="button"
              variant={isListening ? 'default' : 'outline'}
              size="icon"
              onClick={startVoiceInput}
              className={`h-11 w-11 shrink-0 border-white/10 ${isListening ? 'bg-rose-600 animate-pulse text-white hover:bg-rose-700' : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white'}`}
            >
              <Mic className="h-4.5 w-4.5" />
            </Button>

            <Button type="submit" className="h-11 px-6 bg-primary text-primary-foreground font-bold">
              Search
            </Button>

            <Button
              type="button"
              variant={showFilters ? 'secondary' : 'outline'}
              className="h-11 gap-2 border-white/10 bg-white/5 text-foreground hover:bg-white/10"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>
        </form>

        {/* Voice mic listening feedback wave */}
        {isListening && (
          <div className="mb-5 p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 flex items-center justify-between animate-fade-in text-xs">
            <span className="flex items-center gap-1.5 text-rose-400 font-bold">
              <Mic className="h-4 w-4 animate-bounce" />
              Listening... Speak now in Kannada or English
            </span>
          </div>
        )}

        {/* Query expansion details */}
        {analytics.expandedQuery && query && (
          <div className="mb-5 p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs text-muted-foreground animate-slide-up flex gap-2 items-center leading-relaxed">
            <Lightbulb className="h-4.5 w-4.5 text-amber-400 shrink-0" />
            <p>
              Multilingual query expansion applied: <strong className="text-white">&quot;{analytics.expandedQuery}&quot;</strong>
            </p>
          </div>
        )}

        {/* Recent Searches (Current user only) */}
        {recentSearches.length > 0 && !hasSearched && (
          <div className="mb-8 space-y-2.5 animate-slide-up select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Your Recent Searches
            </span>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setInputQuery(term);
                    router.push(`/search?q=${encodeURIComponent(term)}`);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Queries */}
        {!hasSearched && (
          <div className="space-y-3.5 animate-slide-up select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5 text-primary" />
              Suggested Archival Queries
            </span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setInputQuery(term);
                    router.push(`/search?q=${encodeURIComponent(term)}`);
                  }}
                  className="text-xs px-3.5 py-2 rounded-xl border border-primary/10 bg-primary/5 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all font-serif italic"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2-Column Search Dashboard layout */}
        {hasSearched && (
          <div className="flex flex-col lg:flex-row gap-6 mt-6">
            
            {/* Left Column: Filter Sidebar */}
            {showFilters && (
              <FilterSidebar
                filters={filters}
                onFilterChange={setFilters}
                onClearFilters={() => setFilters({
                  category: '',
                  district: '',
                  language: '',
                  yearFrom: '',
                  yearTo: '',
                  ocrConfidence: '',
                  docType: '',
                  visibility: '',
                  entityType: '',
                  uploadedAfter: '',
                  uploadedBefore: '',
                  sourceType: '',
                  ocrQuality: ''
                })}
              />
            )}

            {/* Right Column: Analytics, Logs, Cards */}
            <div className="flex-1 space-y-4">
              
              {/* Performance & NER Analytics Panel */}
              <SearchAnalytics
                totalResults={analytics.totalResults}
                responseTimeMs={analytics.responseTimeMs}
                bestScore={analytics.bestScore}
                searchMode={analytics.searchMode}
                districtsCount={analytics.districtsCount}
                entitiesCount={analytics.entitiesCount}
              />

              {/* Sort selector bar */}
              <div className="flex items-center justify-between pb-2 border-b border-white/5 select-none">
                <span className="text-xs text-muted-foreground">
                  Showing <span className="font-semibold text-white">{sortedSearchResults.length}</span> ranked records
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Sort By</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-7 text-xs w-[120px] bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10">
                      <SelectItem value="relevance" className="text-xs text-foreground">Relevance</SelectItem>
                      <SelectItem value="date_desc" className="text-xs text-foreground">Year (Newest)</SelectItem>
                      <SelectItem value="date_asc" className="text-xs text-foreground">Year (Oldest)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Skeleton loading placeholders */}
              {loading && (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="border-white/5 bg-white/5 animate-pulse h-36">
                      <CardContent className="p-5 flex flex-col justify-between h-full">
                        <div className="space-y-2">
                          <div className="h-4 bg-white/10 rounded w-2/3" />
                          <div className="h-3 bg-white/10 rounded w-1/3" />
                        </div>
                        <div className="h-8 bg-white/10 rounded w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Ingestion results listing */}
              {!loading && sortedSearchResults.length > 0 && (
                <div className="space-y-4">
                  {sortedSearchResults.map((result) => (
                    <SearchResultCard
                      key={result.document_id}
                      result={result}
                      onOpenDocument={(id) => router.push(`/archive/${id}`)}
                      onAskAI={(res) => router.push(`/chat?q=Explain historical context for: ${res.title}`)}
                      isBookmarked={bookmarks.includes(result.document_id)}
                      onToggleBookmark={toggleBookmark}
                    />
                  ))}
                </div>
              )}

              {/* Custom Empty state suggestion fallback */}
              {!loading && sortedSearchResults.length === 0 && (
                <Card className="border-white/10 bg-white/5 backdrop-blur-md animate-slide-up">
                  <CardContent className="p-8 text-center space-y-4 max-w-md mx-auto">
                    <Info className="h-10 w-10 text-muted-foreground mx-auto" />
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white font-serif uppercase tracking-wider">No catalog records found</h3>
                      <p className="text-xs text-muted-foreground">
                        No matches were located for &quot;{query}&quot; inside the vector registries.
                      </p>
                    </div>

                    <div className="p-3 border border-white/5 bg-black/20 rounded-lg text-left text-xs space-y-2">
                      <span className="font-bold text-white tracking-wide block">Search Tips:</span>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground leading-relaxed">
                        <li>Ensure proper spelling of historical figures (e.g., Tipu Sultan).</li>
                        <li>Relax year and location bounds in the sidebar filters.</li>
                        <li>Try alternate cities like Bangalore instead of Bengaluru.</li>
                      </ul>
                    </div>

                    <div className="flex gap-3 justify-center pt-2">
                      <Button 
                        onClick={() => {
                          setFilters({
                            category: '',
                            district: '',
                            language: '',
                            yearFrom: '',
                            yearTo: '',
                            ocrConfidence: '',
                            docType: '',
                            visibility: '',
                            entityType: '',
                            uploadedAfter: '',
                            uploadedBefore: '',
                            sourceType: '',
                            ocrQuality: ''
                          });
                        }} 
                        variant="outline" 
                        size="sm" 
                        className="text-xs border-white/10 hover:bg-white/5 text-foreground"
                      >
                        Reset All Filters
                      </Button>
                      <Button 
                        onClick={() => router.push('/chat')} 
                        size="sm" 
                        className="text-xs bg-primary text-primary-foreground hover:bg-primary/95"
                      >
                        Ask Archive Assistant
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pagination control */}
              {!loading && sortedSearchResults.length > 0 && (
                <div className="flex items-center justify-between pt-6 border-t border-white/5 select-none">
                  <p className="text-xs text-muted-foreground font-mono">
                    Page {page} of {totalPages} ({analytics.totalResults} total)
                  </p>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="h-8 w-8 p-0 border-white/10 bg-white/5 text-foreground"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="h-8 w-8 p-0 border-white/10 bg-white/5 text-foreground"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </AppLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
