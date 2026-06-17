'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, MessageSquare, BookOpen, FileText, User, Database, Link as LinkIcon, Heart, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/app-layout';
import { supabase } from '@/lib/supabase';
import { generateMockArchive } from '@/lib/mock-data';


// Sub components
import { DocumentAccessGuard } from './DocumentAccessGuard';
import { DocumentPreviewPanel } from './DocumentPreviewPanel';
import { DocumentMetadataSummary } from './DocumentMetadataSummary';
import { OCRTextTab } from './OCRTextTab';
import { EntitiesTab } from './EntitiesTab';
import { ChunksTab } from './ChunksTab';
import { RelatedRecordsTab } from './RelatedRecordsTab';
import { NotesBookmarksTab } from './NotesBookmarksTab';
import { CitationActions } from './CitationActions';

interface AdvancedDocumentViewerProps {
  id: string;
}

export function AdvancedDocumentViewer({ id }: AdvancedDocumentViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Search parameters integration (Requirement 11)
  const initialQuery = searchParams.get('query') || searchParams.get('q') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const matchedSnippet = searchParams.get('snippet') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [doc, setDoc] = useState<any>(null);
  const [isLegacy, setIsLegacy] = useState(false);
  const [pages, setPages] = useState<any[]>([]);
  const [chunks, setChunks] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [related, setRelated] = useState<any[]>([]);
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [activeTab, setActiveTab] = useState('summary');
  const [userRole, setUserRole] = useState<string>('guest');

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          if (profile?.role) {
            setUserRole(profile.role);
          }
        }
      } catch (err) {
        console.warn('Failed to query user role in viewer:', err);
      }
    };
    fetchUserRole();
  }, []);


  // Load document details safely from server route
  const loadDocument = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${id}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setDoc(data.document);
        setIsLegacy(data.isLegacy);
        setPages(data.pages || []);
        setChunks(data.chunks || []);
        setEntities(data.entities || []);
        setRelated(data.related || []);
        
        // Auto navigate if page count supports
        if (initialPage > 0 && data.document.page_count >= initialPage) {
          setCurrentPage(initialPage);
        }
      } else {
        throw new Error(data.error || 'Failed to resolve document details');
      }
    } catch (err: any) {
      console.warn('AdvancedDocumentViewer API fetch failed, trying local fallback:', err.message);
      
      try {
        // 1. Check doc-mock-[id]
        let localDoc = null;
        const storedMock = localStorage.getItem(`doc-mock-${id}`);
        if (storedMock) {
          localDoc = JSON.parse(storedMock);
        }

        // 2. Check local uploads list
        if (!localDoc) {
          try {
            const localUploads = JSON.parse(localStorage.getItem('neurive_local_uploads') || '[]');
            const match = localUploads.find((u: any) => u.id === id);
            if (match) localDoc = match;
          } catch {}
        }

        // 3. Check standard mock archives by ID (e.g. arch-12)
        if (!localDoc && id.startsWith('arch-')) {
          try {
            const idx = parseInt(id.replace('arch-', ''), 10) - 1;
            if (!isNaN(idx) && idx >= 0) {
              localDoc = generateMockArchive(idx);
            }
          } catch {}
        }

        if (!localDoc) {
          throw new Error('Document not found in database or local sandbox fallback.');
        }

        // Populate pages, chunks, entities based on the document properties
        const titleLower = (localDoc.title || '').toLowerCase();
        let contextText = localDoc.description || 'Karnataka Archival Inscription scroll registered in the district office.';
        let summaryText = localDoc.description || 'Karnataka historical record detailing local administrations.';
        let keywordsArr = localDoc.tags || ['karnataka', 'archives'];
        let entityList = [
          { entity_name: localDoc.district?.name || localDoc.district || 'Karnataka', entity_type: 'place', confidence_score: 0.95 },
          { entity_name: localDoc.year?.toString() || '1901', entity_type: 'date', confidence_score: 0.99 }
        ];

        if (titleLower.includes('mysore') || titleLower.includes('mysuru') || titleLower.includes('revenue') || titleLower.includes('land')) {
          contextText = "Mysore Royal Land Revenue Settlement Deed, dated 15th January 1891. Issued under the authority of His Highness Chamarajendra Wadiyar X. This document details the administrative divisions, survey numbers, and tax assessments for the agricultural lands in the Srirangapatna taluk.\n\nಮೈಸೂರು ಮಹಾರಾಜ ಕೊಡುಗೆ ಭೂ ಕಂದಾಯ ಪತ್ರ ೧೮೯೧. ಕೃಷ್ಣರಾಜ ಒಡೆಯರ್ ಕಾಲದಲ್ಲಿ ನೋಂದಾಯಿಸಲಾಗಿದೆ. ಈ ದಾಖಲೆಯು ಭೂ ಹಿಡುವಳಿ ಮತ್ತು ತೆರಿಗೆ ಪದ್ಧತಿಯನ್ನು ವಿವರಿಸುತ್ತದೆ.";
          summaryText = "A Royal Land Revenue Settlement Deed of 1891 detailing agricultural land ownership, boundaries, and taxation records under the Chamarajendra Wadiyar X administration in Srirangapatna, Mysuru.";
          keywordsArr = ["Mysuru", "Wadiyar", "Land Record", "Revenue Settlement", "Srirangapatna", "1891"];
          entityList = [
            { entity_name: "Chamarajendra Wadiyar X", entity_type: "person", confidence_score: 0.98 },
            { entity_name: "Srirangapatna", entity_type: "place", confidence_score: 0.95 },
            { entity_name: "Mysuru Division", entity_type: "place", confidence_score: 0.96 },
            { entity_name: "1891", entity_type: "date", confidence_score: 0.99 },
            { entity_name: "Revenue Department", entity_type: "organization", confidence_score: 0.92 }
          ];
        } else if (titleLower.includes('hampi') || titleLower.includes('vijayanagara') || titleLower.includes('temple') || titleLower.includes('inscription')) {
          contextText = "Vijayanagara Empire stone inscription from the Krishna Temple complex in Hampi. Commemorates a royal endowment of lands and orchards granted by Emperor Krishnadevaraya in 1513 CE to the temple priests and local community.\n\nವಿಜಯನಗರ ಸಾಮ್ರಾಜ್ಯದ ಹಂಪಿ ಶ್ರೀ ಕೃಷ್ಣ ದೇವಸ್ಥಾನದ ಶಿಲಾಶಾಸನ ಹಾಗೂ ದಾನ ದತ್ತಿ ವಿವರಣೆ.";
          summaryText = "A historical stone tablet transcription from Hampi (1513 CE) documenting land grants and royal endowments gifted by Emperor Krishnadevaraya of the Vijayanagara Empire.";
          keywordsArr = ["Hampi", "Krishnadevaraya", "Vijayanagara", "Temple Inscription", "Endowment", "1513"];
          entityList = [
            { entity_name: "Krishnadevaraya", entity_type: "person", confidence_score: 0.99 },
            { entity_name: "Hampi", entity_type: "place", confidence_score: 0.97 },
            { entity_name: "Krishna Temple", entity_type: "place", confidence_score: 0.94 },
            { entity_name: "1513 CE", entity_type: "date", confidence_score: 0.99 },
            { entity_name: "Vijayanagara Empire", entity_type: "organization", confidence_score: 0.98 }
          ];
        }

        // Format document fields
        const normalizedDoc = {
          id: localDoc.id,
          title: localDoc.title,
          description: localDoc.description,
          summary: summaryText,
          district: localDoc.district?.name || localDoc.district || 'Karnataka',
          category: localDoc.category?.name || localDoc.category || 'Archive',
          language: localDoc.language || 'kannada',
          year: localDoc.year || 1900,
          file_url: localDoc.file_url || '',
          file_type: localDoc.file_type || 'pdf',
          status: 'Completed',
          visibility: localDoc.visibility || localDoc.access_level || 'public',
          ocr_confidence: localDoc.ocr_confidence || 0.92,
          page_count: localDoc.page_count || 1,
          created_at: localDoc.created_at || new Date().toISOString()
        };

        const fallbackPages = [{
          id: `p-1-${id}`,
          document_id: id,
          page_number: 1,
          extracted_text: contextText,
          corrected_text: contextText,
          correction_status: 'raw',
          ocr_confidence: 0.92
        }];

        const fallbackChunks = [{
          id: `c-1-${id}`,
          document_id: id,
          page_number: 1,
          chunk_text: contextText.substring(0, 200),
          chunk_index: 0
        }];

        const fallbackEntities = entityList.map((ent, idx) => ({
          id: `e-${idx}-${id}`,
          document_id: id,
          entity_name: ent.entity_name,
          entity_type: ent.entity_type,
          page_number: 1,
          confidence_score: ent.confidence_score,
          description: 'Auto-extracted fallback entity'
        }));

        setDoc(normalizedDoc);
        setIsLegacy(id.startsWith('arch-'));
        setPages(fallbackPages);
        setChunks(fallbackChunks);
        setEntities(fallbackEntities);
        setRelated([]);

        if (initialPage > 0 && normalizedDoc.page_count >= initialPage) {
          setCurrentPage(initialPage);
        }
      } catch (fallbackErr: any) {
        setError(fallbackErr.message || err.message || 'Internal connection failure');
      }
    } finally {
      setLoading(false);
    }
  }, [id, initialPage]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const handleDownload = () => {
    if (!doc) return;
    
    // Generate readable archive citation manuscript text
    const textManuscript = `========================================================================
NEURIVE - KARNATAKA ARCHIVE PLATFORM MANUSCRIPT TRANSCRIPT
========================================================================
Accession Code   : ${doc.id.substring(0, 8).toUpperCase()}
Record Title     : ${doc.title}
Historical Year  : ${doc.year || 'N/A'}
District Origin  : ${doc.district || 'Karnataka'}
Category Folders : ${doc.category || 'Archival Records'}
Registry Language: ${doc.language || 'English'}
Document Format  : ${doc.file_type?.toUpperCase() || 'PDF'}
Pages Digitized  : ${doc.page_count || 1}
Access Clearance : ${doc.visibility?.toUpperCase() || 'PUBLIC'}
Sync Status      : ${doc.status || 'Completed'}

------------------------------------------------------------------------
SYNOPSIS SUMMARY:
------------------------------------------------------------------------
${doc.summary || doc.description || 'No description recorded.'}

------------------------------------------------------------------------
CITED OFFICIAL REFERENCE:
------------------------------------------------------------------------
${doc.title}, ${doc.year || 'N/A'}, ${doc.district || 'Karnataka'}, Neurive Karnataka Digital Archive.
========================================================================`;

    const blob = new Blob([textManuscript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.replace(/\s+/g, '_')}_citation_copy.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentOcrPageText = pages.find(p => p.page_number === currentPage)?.extracted_text;

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-slate-950 text-slate-100 min-h-[calc(100vh-4rem)] p-4 sm:p-6 select-none font-sans">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 select-none">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <Link href="/" className="hover:text-slate-300 transition-colors">HOME</Link>
            <span>/</span>
            <Link href="/search" className="hover:text-slate-300 transition-colors">SEARCH</Link>
            <span>/</span>
            <span className="text-slate-300 font-semibold truncate max-w-[150px] sm:max-w-xs">
              {doc?.title || id.substring(0, 8).toUpperCase()}
            </span>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()} 
            className="h-8 text-xs font-semibold border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Registry
          </Button>
        </div>

        <DocumentAccessGuard loading={loading} error={error} status={doc?.status}>
          {doc && (
            <div className="flex flex-col lg:flex-row gap-6 h-full lg:h-[calc(100vh-8.5rem)] overflow-hidden">
              
              {/* Left Panel: Preview Workspace */}
              <div className="w-full lg:w-1/2 flex flex-col h-[50vh] lg:h-full min-h-[300px]">
                <DocumentPreviewPanel
                  fileUrl={doc.file_preview_url || doc.file_url}
                  fileType={doc.file_type || 'pdf'}
                  title={doc.title}
                  pageCount={doc.page_count || 1}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  downloadPermitted={doc.visibility !== 'private'}
                  onDownload={handleDownload}
                />
              </div>

              {/* Right Panel: Advanced Tabs Dashboard */}
              <div className="w-full lg:w-1/2 flex flex-col h-full overflow-hidden bg-slate-900/25 border border-slate-800/80 rounded-xl shadow-2xl p-4 sm:p-5 backdrop-blur-md">
                
                {/* Search snippet notification */}
                {initialQuery && matchedSnippet && (
                  <Card className="bg-primary/5 border-primary/20 mb-4 select-none">
                    <CardContent className="p-3 flex items-start gap-2 text-xs font-sans text-slate-300 leading-relaxed">
                      <Sparkles className="h-4 w-4 shrink-0 text-primary animate-pulse mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-semibold block text-primary font-mono text-[10px]">MATCHED RESEARCH SNIPPET (Page {initialPage})</span>
                        <p className="italic text-slate-400 text-[11px]">&ldquo;{matchedSnippet}&rdquo;</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Tabs 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                  className="flex-1 flex flex-col h-full overflow-hidden"
                >
                  {/* Tabs headers */}
                  <TabsList className="bg-slate-950/80 border border-slate-850 p-1 flex justify-start h-10 w-full overflow-x-auto gap-1 select-none scrollbar-none">
                    <TabsTrigger value="summary" className="text-[10px] font-semibold tracking-wider font-mono gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      SUMMARY
                    </TabsTrigger>
                    <TabsTrigger value="ocr" className="text-[10px] font-semibold tracking-wider font-mono gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      OCR TEXT
                    </TabsTrigger>
                    <TabsTrigger value="entities" className="text-[10px] font-semibold tracking-wider font-mono gap-1">
                      <User className="h-3.5 w-3.5" />
                      ENTITIES
                    </TabsTrigger>
                    <TabsTrigger value="chunks" className="text-[10px] font-semibold tracking-wider font-mono gap-1">
                      <Database className="h-3.5 w-3.5" />
                      CHUNKS
                    </TabsTrigger>
                    <TabsTrigger value="related" className="text-[10px] font-semibold tracking-wider font-mono gap-1">
                      <LinkIcon className="h-3.5 w-3.5" />
                      RELATED
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="text-[10px] font-semibold tracking-wider font-mono gap-1">
                      <Heart className="h-3.5 w-3.5" />
                      NOTES
                    </TabsTrigger>
                  </TabsList>

                  {/* Tabs views content, wrapping in scroll view */}
                  <div className="flex-1 overflow-y-auto mt-4 pr-1 scrollbar-thin">
                    <TabsContent value="summary" className="m-0 focus-visible:ring-0">
                      <DocumentMetadataSummary document={doc} />
                    </TabsContent>

                    <TabsContent value="ocr" className="m-0 focus-visible:ring-0 h-full flex flex-col">
                      <OCRTextTab 
                        pages={pages} 
                        initialPage={currentPage} 
                        onPageChange={setCurrentPage}
                        initialQuery={initialQuery}
                        userRole={userRole}
                        documentId={doc.id}
                      />
                    </TabsContent>


                    <TabsContent value="entities" className="m-0 focus-visible:ring-0">
                      <EntitiesTab entities={entities} />
                    </TabsContent>

                    <TabsContent value="chunks" className="m-0 focus-visible:ring-0">
                      <ChunksTab chunks={chunks} />
                    </TabsContent>

                    <TabsContent value="related" className="m-0 focus-visible:ring-0">
                      <RelatedRecordsTab related={related} />
                    </TabsContent>

                    <TabsContent value="notes" className="m-0 focus-visible:ring-0">
                      <NotesBookmarksTab documentId={doc.id} isLegacy={isLegacy} />
                    </TabsContent>
                  </div>
                </Tabs>

                {/* Footer widgets: Citations & Ask AI actions */}
                <div className="border-t border-slate-800/85 pt-4 mt-4 space-y-3 shrink-0">
                  {/* Citations Copy widgets */}
                  <CitationActions
                    title={doc.title}
                    year={doc.year}
                    district={doc.district}
                    accessionNumber={doc.id.substring(0, 8).toUpperCase()}
                    currentPage={currentPage}
                  />

                  {/* RAG Ask AI Button (Requirement 10 / Safeguard 10) */}
                  <Button
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold text-xs gap-2 shadow-lg h-9.5"
                    asChild
                  >
                    <Link href={`/chat?document_id=${doc.id}`}>
                      <MessageSquare className="h-4.5 w-4.5 animate-pulse" />
                      Ask AI about this document
                    </Link>
                  </Button>
                </div>

              </div>

            </div>
          )}
        </DocumentAccessGuard>
      </div>
    </AppLayout>
  );
}
export default AdvancedDocumentViewer;
