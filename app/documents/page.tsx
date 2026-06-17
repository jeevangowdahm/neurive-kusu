'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { ArchiveCardEnhanced } from '@/components/archive-card-enhanced';
import { DocumentViewer } from '@/components/document-viewer';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader } from 'lucide-react';
import { getMockArchives } from '@/lib/mock-data';

interface DocumentRecord {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: 'pdf' | 'image' | 'audio' | 'video' | 'text';
  thumbnail_url?: string;
  date_recorded?: string;
  language?: string;
  tags?: string[];
  author?: string;
  view_count?: number;
  download_count?: number;
  is_featured?: boolean;
}

type FileType = 'all' | 'pdf' | 'image' | 'audio' | 'video' | 'text';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<DocumentRecord | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [filterType, setFilterType] = useState<FileType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('archives')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedDocs = (data || []).map(doc => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        file_url: doc.file_url,
        file_type: doc.file_type || 'pdf',
        thumbnail_url: doc.thumbnail_url,
        date_recorded: doc.date_recorded,
        language: doc.language,
        tags: doc.tags || [],
        author: doc.author,
        view_count: doc.view_count || 0,
        download_count: doc.download_count || 0,
        is_featured: doc.is_featured || false,
      }));

      if (formattedDocs.length === 0) {
        throw new Error('No documents in Supabase, loading fallback mocks');
      }

      setDocuments(formattedDocs);
    } catch (error) {
      console.warn('Failed to load documents from database. Loading local mock & uploads fallback:', error);
      
      const { archives: mockArchives } = getMockArchives(1, 50);
      let localUploads: any[] = [];
      try {
        localUploads = JSON.parse(localStorage.getItem('neurive_local_uploads') || '[]');
      } catch (e) {
        console.error('Failed to parse local uploads:', e);
      }

      const formattedMocks = mockArchives.map(doc => ({
        id: doc.id,
        title: doc.title,
        description: doc.description || null,
        file_url: doc.file_url || '',
        file_type: (doc.file_type || 'pdf') as any,
        thumbnail_url: doc.thumbnail_url || undefined,
        date_recorded: doc.date_recorded || undefined,
        language: doc.language || undefined,
        tags: doc.tags || [],
        author: doc.author || undefined,
        view_count: doc.view_count || 0,
        download_count: doc.download_count || 0,
        is_featured: doc.is_featured || false,
      }));

      const formattedLocal = localUploads.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        description: doc.description || null,
        file_url: doc.file_url || '',
        file_type: (doc.file_type || 'pdf') as any,
        thumbnail_url: doc.thumbnail_url || undefined,
        date_recorded: doc.date_recorded || undefined,
        language: doc.language || undefined,
        tags: doc.tags || [],
        author: doc.author || undefined,
        view_count: doc.view_count || 0,
        download_count: doc.download_count || 0,
        is_featured: doc.is_featured || false,
      }));

      const merged = [...formattedLocal];
      for (const m of formattedMocks) {
        if (!merged.some(u => u.id === m.id)) {
          merged.push(m);
        }
      }

      setDocuments(merged);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesType = filterType === 'all' || doc.file_type === filterType;
    const matchesSearch = !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesType && matchesSearch;
  });

  const handleOpenViewer = (doc: DocumentRecord | any) => {
    setSelectedDocument({
      id: doc.id,
      title: doc.title,
      description: doc.description || undefined,
      file_url: doc.file_url,
      file_type: doc.file_type,
      thumbnail_url: doc.thumbnail_url,
      date_recorded: doc.date_recorded,
      language: doc.language,
      tags: doc.tags,
      author: doc.author,
      view_count: doc.view_count,
      download_count: doc.download_count,
      is_featured: doc.is_featured,
    });
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedDocument(null);
  };

  const fileTypeFilters: { type: FileType; label: string; count: number }[] = [
    {
      type: 'all',
      label: 'All Documents',
      count: documents.length,
    },
    {
      type: 'pdf',
      label: 'PDFs',
      count: documents.filter(d => d.file_type === 'pdf').length,
    },
    {
      type: 'image',
      label: 'Images',
      count: documents.filter(d => d.file_type === 'image').length,
    },
    {
      type: 'audio',
      label: 'Audio',
      count: documents.filter(d => d.file_type === 'audio').length,
    },
    {
      type: 'video',
      label: 'Videos',
      count: documents.filter(d => d.file_type === 'video').length,
    },
    {
      type: 'text',
      label: 'Texts',
      count: documents.filter(d => d.file_type === 'text').length,
    },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden hero-gradient pt-20 pb-16">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-4 py-1.5 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
              <span className="text-xs font-medium text-white/90">Historical Document Archive</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              Explore Historical Documents
            </h1>

            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
              Browse and view a comprehensive collection of documents spanning multiple media types — from manuscripts and maps to recordings and videos
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <input
                type="text"
                placeholder="Search documents by title, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="border-b bg-muted/30 backdrop-blur-sm sticky top-16 z-40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {fileTypeFilters.map(filter => (
                <Button
                  key={filter.type}
                  variant={filterType === filter.type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType(filter.type)}
                  className="shrink-0"
                >
                  {filter.label}
                  <span className="ml-2 text-xs opacity-75">({filter.count})</span>
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Documents Grid */}
        <section className="py-12 px-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            {loading ? (
              <div className="flex items-center justify-center py-20 gap-2">
                <Loader className="h-5 w-5 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading documents...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No documents found matching your criteria</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments.map(doc => (
                  <ArchiveCardEnhanced
                    key={doc.id}
                    archive={doc}
                    onOpenViewer={handleOpenViewer}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Document Viewer Modal */}
        <DocumentViewer
          document={selectedDocument}
          isOpen={isViewerOpen}
          onClose={handleCloseViewer}
        />
      </div>
    </AppLayout>
  );
}
