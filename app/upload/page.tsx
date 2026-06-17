'use client';

import { useState, useEffect } from 'react';
import { 
  Upload, Activity, Sparkles, ArrowRight, ShieldCheck, 
  HelpCircle, CheckCircle2, AlertCircle, FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/app-layout';
import { supabase } from '@/lib/supabase';
import { audioSynth } from '@/lib/audio';
import { uploadDocumentFile, createDocumentRecord, createProcessingJob } from '@/lib/upload-service';

// Import reusable upload components
import { UploadDropzone } from '@/components/upload/UploadDropzone';
import { MetadataForm, MetadataValues } from '@/components/upload/MetadataForm';
import { ProcessingTimeline } from '@/components/upload/ProcessingTimeline';
import { ProcessingLogs } from '@/components/upload/ProcessingLogs';
import { JobStatusBadge } from '@/components/upload/JobStatusBadge';
import { RetryButton } from '@/components/upload/RetryButton';

type UploadStep = 'upload' | 'metadata' | 'ocr_review' | 'processing' | 'complete';

export default function UploadPage() {
  const [step, setStep] = useState<UploadStep>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Form Metadata state
  const [metadata, setMetadata] = useState<MetadataValues>({
    title: '',
    category: '',
    district: '',
    year: '',
    language: 'kannada',
    visibility: 'public',
    description: '',
    keywords: ''
  });

  // Interactive OCR Bounding Box states
  const [ocrText, setOcrText] = useState('');
  const [detectedLocation, setDetectedLocation] = useState('');
  const [detectedYear, setDetectedYear] = useState('');

  // Processing state
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Pending');
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Retrieve current user and audio settings
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null);
    });

    const soundPref = localStorage.getItem('neurive_sound_fx') === 'true';
    setSoundEnabled(soundPref);
  }, []);

  const handleIngestionComplete = (docId: string) => {
    setStep('complete');
    const soundPref = localStorage.getItem('neurive_sound_fx') === 'true';
    if (soundPref) audioSynth.playHologramChime(true);
    
    // Save to local uploads
    if (typeof window !== 'undefined' && docId) {
      try {
        const stored = localStorage.getItem(`doc-mock-${docId}`);
        if (stored) {
          const doc = JSON.parse(stored);
          const localUploads = JSON.parse(localStorage.getItem('neurive_local_uploads') || '[]');
          if (!localUploads.some((u: any) => u.id === doc.id)) {
            const formatted = {
              id: doc.id,
              title: doc.title,
              description: doc.summary || doc.description || 'Uploaded manuscript scroll.',
              year: doc.year || 1900,
              decade: doc.year ? `${Math.floor(doc.year / 10) * 10}s` : '1900s',
              language: doc.language || 'kannada',
              document_type: doc.file_type || 'document',
              file_type: doc.file_type || 'pdf',
              page_count: doc.page_count || 1,
              source: 'User Upload',
              has_ocr: true,
              has_embedding: true,
              access_level: doc.visibility || 'public',
              status: 'active',
              tags: doc.keywords || [],
              districts: { id: 'dist-custom', name: doc.district || 'Karnataka', name_kannada: doc.district || 'ಕರ್ನಾಟಕ' },
              categories: { id: 'cat-custom', name: doc.category || 'Archive', name_kannada: doc.category || 'ದಾಖಲೆ', slug: doc.category || 'archive', color: '#2563eb' },
              created_at: new Date().toISOString()
            };
            localUploads.unshift(formatted);
            localStorage.setItem('neurive_local_uploads', JSON.stringify(localUploads));
          }
        }
      } catch (e) {
        console.error('Failed to save completed doc to local uploads:', e);
      }
    }
  };

  // Supabase Realtime Subscription for Processing Job
  useEffect(() => {
    if (!documentId) return;

    const channel = supabase
      .channel(`job-updates-${documentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processing_jobs',
          filter: `document_id=eq.${documentId}`
        },
        (payload) => {
          const job = payload.new as any;
          if (job) {
            setStatus(job.status);
            setProgress(job.progress);
            setErrorMessage(job.error_message);

            if (job.status === 'Completed') {
              handleIngestionComplete(documentId);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId, soundEnabled]);

  // Listen for local processing updates in offline fallback mode
  useEffect(() => {
    if (!jobId) return;

    const handleLocalUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.id === jobId) {
        if (detail.status) setStatus(detail.status);
        if (detail.progress !== undefined) setProgress(detail.progress);
        if (detail.error_message !== undefined) setErrorMessage(detail.error_message);

        if (detail.status === 'Completed') {
          handleIngestionComplete(documentId || '');
        }
      }
    };

    window.addEventListener('processing-job-update', handleLocalUpdate);
    return () => {
      window.removeEventListener('processing-job-update', handleLocalUpdate);
    };
  }, [jobId, soundEnabled, documentId]);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleFileRemoved = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMetadataSubmit = (values: MetadataValues) => {
    setMetadata(values);
    if (soundEnabled) audioSynth.playPaperRustle();

    // Populate OCR review boxes from metadata parameters
    setDetectedLocation(`${values.district} Division`);
    setDetectedYear(values.year || '1891');
    setOcrText(`ಡಿಜಿಟಲ್ ಕಂದಾಯ ಪತ್ರ: ${values.title}. ${values.description || 'ಆಡಳಿತಾತ್ಮಕ ದಾಖಲೆ ವರ್ಗಾವಣೆ ಪತ್ರ.'}`);
    
    setStep('ocr_review');
  };

  // Triggers the file upload and runs the serverless ingestion worker API
  const handleActivateIngestion = async () => {
    setStep('processing');
    setStatus('Uploading');
    setProgress(5);
    setErrorMessage(null);
    if (soundEnabled) audioSynth.playTypewriterClick(true);

    try {
      if (files.length === 0) throw new Error('No files selected');

      // 1. Upload files to storage
      const uploadResult = await uploadDocumentFile(files[0], userId || 'anonymous');

      // 2. Insert record into documents table
      const docRecord = await createDocumentRecord({
        title: metadata.title,
        description: ocrText || metadata.description || undefined,
        district: metadata.district,
        category: metadata.category,
        language: metadata.language,
        year: metadata.year ? parseInt(metadata.year) : undefined,
        file_url: uploadResult.publicUrl,
        file_type: files[0].name.endsWith('.pdf') ? 'pdf' : 'image',
        visibility: metadata.visibility,
        keywords: metadata.keywords ? metadata.keywords.split(',').map(k => k.trim()) : [],
        uploaded_by: userId || undefined
      });

      setDocumentId(docRecord.id);

      // 3. Create a processing job record
      const jobRecord = await createProcessingJob(docRecord.id);
      setJobId(jobRecord.id);
      setStatus(jobRecord.status);
      setProgress(jobRecord.progress);

      // 4. Trigger the pipeline via Next.js serverless API route
      let triggeredOnServer = false;
      try {
        const apiRes = await fetch('/api/ai/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: docRecord.id,
            jobId: jobRecord.id
          })
        });

        if (apiRes.ok) {
          triggeredOnServer = true;
        } else {
          console.warn('Server Ingestion trigger returned non-OK status, falling back to client-side pipeline.');
        }
      } catch (err) {
        console.warn('Server Ingestion trigger failed, falling back to client-side pipeline:', err);
      }

      if (!triggeredOnServer) {
        // Trigger ingestion pipeline client-side directly
        const { runIngestionPipeline } = await import('@/lib/upload-service');
        runIngestionPipeline(docRecord.id, jobRecord.id);
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ingestion Press activation failed';
      setErrorMessage(msg);
      setStatus('Failed');
    }
  };


  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto font-sans min-h-screen text-foreground">
        
        {/* Header Section */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Upload className="h-5 w-5 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-serif text-white">
                Royal AI Ingestion Press
              </h1>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Upload manuscripts, survey maps, and copper plates into the archives. Automated OCR layout decrypters, semantic chunk models, and RAG indexers will catalog the scrolls.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto select-none">
            <Badge variant="outline" className="border-white/10 bg-white/5 text-muted-foreground text-[10px] gap-1 px-2.5 py-1">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              Bilingual Index
            </Badge>
          </div>
        </div>

        {/* Ingestion Steps Tracker Nav */}
        <div className="flex items-center gap-2 mb-8 select-none overflow-x-auto pb-2 scrollbar-thin">
          {['Upload Scroll', 'Catalog Metadata', 'OCR Verification', 'Ingestion Press', 'Complete'].map((label, i) => {
            const stepKeys: UploadStep[] = ['upload', 'metadata', 'ocr_review', 'processing', 'complete'];
            const isCurrent = stepKeys[i] === step;
            const isPast = stepKeys.indexOf(step) > i;

            return (
              <div key={label} className="flex items-center gap-2 shrink-0">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors
                  ${isCurrent 
                    ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                    : isPast 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-white/5 text-muted-foreground border-white/5'}`}>
                  {isPast ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <span>{i + 1}</span>}
                  <span>{label}</span>
                </div>
                {i < 4 && <div className={`w-8 h-px ${isPast ? 'bg-emerald-500/30' : 'bg-white/5'}`} />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Upload Dropzone */}
        {step === 'upload' && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-md animate-slide-up">
            <CardHeader className="p-5 pb-3 border-b border-white/10">
              <CardTitle className="text-sm font-bold uppercase tracking-wider font-serif text-white flex items-center gap-1.5">
                Parchment Scroll Ingestion
              </CardTitle>
              <CardDescription className="text-xs">
                Select scans or document packages to process.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <UploadDropzone 
                onFilesSelected={handleFilesSelected} 
                files={files} 
                onFileRemoved={handleFileRemoved} 
              />
              <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
                <Button 
                  onClick={() => {
                    if (soundEnabled) audioSynth.playPaperRustle();
                    setStep('metadata');
                  }} 
                  disabled={files.length === 0} 
                  className="gap-2 font-bold text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/95"
                >
                  Continue to Metadata
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Metadata Form */}
        {step === 'metadata' && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-md animate-slide-up">
            <CardHeader className="p-5 pb-3 border-b border-white/10">
              <CardTitle className="text-sm font-bold uppercase tracking-wider font-serif text-white">
                Archival Cataloging Form
              </CardTitle>
              <CardDescription className="text-xs">
                Register historical properties, regions, and dates.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <MetadataForm 
                initialValues={metadata} 
                onSubmit={handleMetadataSubmit} 
                onBack={() => setStep('upload')} 
              />
            </CardContent>
          </Card>
        )}

        {/* Step 3: Interactive OCR Bounding Box Review */}
        {step === 'ocr_review' && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-md animate-slide-up">
            <CardHeader className="p-5 pb-3 border-b border-white/10 flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider font-serif text-white flex items-center gap-1.5">
                  <Activity className="h-4.5 w-4.5 text-primary animate-pulse" />
                  Bounding Box OCR Verification Board
                </CardTitle>
                <CardDescription className="text-xs">
                  Verify and edit OCR segments before indexing.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/20 text-primary text-[9px] font-bold">
                Pre-Index Audit
              </Badge>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Simulated Bounding Box Graphic */}
                <div className="border border-amber-900/30 rounded-xl p-4 bg-gradient-to-br from-[#faf6eb]/90 via-[#f5ebd3]/95 to-[#ebd8ab]/90 relative min-h-[220px] select-none flex flex-col justify-between">
                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none text-7xl font-bold font-serif text-amber-950 flex items-center justify-center">
                    MANUSCRIPT
                  </div>
                  
                  <div className="space-y-4 relative z-10">
                    {/* Bounding location box */}
                    <div className="border border-dashed border-sky-600 bg-sky-500/10 p-2 rounded-lg relative">
                      <span className="absolute -top-2.5 left-2 bg-sky-600 text-white font-mono text-[7px] px-1 rounded-sm">BOX-1 (LOCATION)</span>
                      <p className="text-[11px] font-bold text-sky-950 font-serif">{detectedLocation}</p>
                    </div>

                    {/* Bounding year box */}
                    <div className="border border-dashed border-emerald-600 bg-emerald-500/10 p-2 rounded-lg relative mt-2">
                      <span className="absolute -top-2.5 left-2 bg-emerald-600 text-white font-mono text-[7px] px-1 rounded-sm">BOX-2 (YEAR)</span>
                      <p className="text-[11px] font-bold text-emerald-950 font-mono">{detectedYear} CE</p>
                    </div>

                    {/* Deciphered transcript box */}
                    <div className="border border-dashed border-amber-600 bg-amber-500/10 p-2 rounded-lg relative mt-2">
                      <span className="absolute -top-2.5 left-2 bg-amber-600 text-white font-mono text-[7px] px-1 rounded-sm">BOX-3 (DECIPHERED OCR)</span>
                      <p className="text-[10px] leading-relaxed text-amber-950 truncate max-w-full font-serif">{ocrText}</p>
                    </div>
                  </div>
                </div>

                {/* Editable bounding box fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Corrected Location (Box-1)</label>
                    <input 
                      type="text"
                      value={detectedLocation} 
                      onChange={(e) => setDetectedLocation(e.target.value)} 
                      className="w-full h-8 px-2 bg-white/5 border border-white/10 rounded-md text-xs text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Corrected Year (Box-2)</label>
                    <input 
                      type="text"
                      value={detectedYear} 
                      onChange={(e) => setDetectedYear(e.target.value)} 
                      className="w-full h-8 px-2 bg-white/5 border border-white/10 rounded-md text-xs text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Deciphered Text Area (Box-3)</label>
                    <textarea 
                      value={ocrText} 
                      onChange={(e) => setOcrText(e.target.value)} 
                      className="w-full h-24 p-2 bg-white/5 border border-white/10 rounded-md text-xs text-foreground focus:outline-none focus:border-primary/50 resize-none font-serif"
                    />
                  </div>
                </div>

              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setStep('metadata')}
                  className="border-white/10 text-muted-foreground hover:bg-white/5"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleActivateIngestion} 
                  className="gap-2 font-bold text-xs h-9 bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/20"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-200 animate-pulse" />
                  Activate Ingestion Press
                </Button>
              </div>

            </CardContent>
          </Card>
        )}

        {/* Step 4: Realtime Ingestion Progress UI */}
        {step === 'processing' && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-md animate-slide-up overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-white/10 flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider font-serif text-white flex items-center gap-1.5">
                  Ingestion Press Rolling
                </CardTitle>
                <CardDescription className="text-xs">
                  Indexing, chunking, and rendering vector schemas.
                </CardDescription>
              </div>
              <JobStatusBadge status={status} />
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              
              {/* Timeline status tracks */}
              <ProcessingTimeline 
                currentStatus={status} 
                progress={progress} 
                errorMessage={errorMessage} 
              />

              {/* Console logging output */}
              <ProcessingLogs 
                currentStatus={status} 
                progress={progress} 
                documentTitle={metadata.title} 
              />

              {/* Failed Retry options */}
              {status === 'Failed' && jobId && documentId && (
                <div className="flex justify-end pt-4 border-t border-white/10">
                  <RetryButton 
                    jobId={jobId} 
                    documentId={documentId} 
                    onRetryStarted={() => {
                      setStatus('Uploaded');
                      setProgress(0);
                      setErrorMessage(null);
                    }} 
                    onRetryFailed={(err) => {
                      setErrorMessage(err);
                      setStatus('Failed');
                    }}
                  />
                </div>
              )}

            </CardContent>
          </Card>
        )}

        {/* Step 5: Ingestion Completed */}
        {step === 'complete' && (
          <Card className="border-emerald-500/20 bg-emerald-950/5 backdrop-blur-md animate-slide-up">
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white font-serif uppercase tracking-wider">
                  Ingestion Complete!
                </h2>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  The manuscript has been stamped, vectorized, and registered inside the royal digital indexes. The search portal is now fully synchronized.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 max-w-xs mx-auto">
                <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[9px] uppercase font-mono">
                  Registry Sync
                </Badge>
                <Badge variant="outline" className="border-sky-500/20 bg-sky-500/5 text-sky-400 text-[9px] uppercase font-mono">
                  pgvector Indexed
                </Badge>
                <Badge variant="outline" className="border-amber-500/20 bg-amber-500/5 text-amber-400 text-[9px] uppercase font-mono">
                  Bilingual Search
                </Badge>
              </div>

              {documentId && (
                <div className="bg-black/20 p-2.5 rounded-lg border border-white/5 max-w-sm mx-auto text-xs flex justify-between items-center font-mono">
                  <span className="text-muted-foreground text-[10px]">DOCUMENT UUID:</span>
                  <span className="text-white font-semibold text-[10px] select-all">{documentId}</span>
                </div>
              )}

              <div className="flex gap-3 justify-center pt-4 border-t border-white/5 max-w-sm mx-auto">
                <Button 
                  onClick={() => {
                    setStep('upload');
                    setFiles([]);
                    setDocumentId(null);
                    setJobId(null);
                    setStatus('Pending');
                    setProgress(0);
                    setErrorMessage(null);
                    setMetadata({
                      title: '',
                      category: '',
                      district: '',
                      year: '',
                      language: 'kannada',
                      visibility: 'public',
                      description: '',
                      keywords: ''
                    });
                  }} 
                  variant="outline" 
                  size="sm" 
                  className="text-xs border-white/10 hover:bg-white/5 text-foreground"
                >
                  Upload Another Scroll
                </Button>
                <Button 
                  onClick={() => window.location.href = '/documents'} 
                  size="sm" 
                  className="text-xs bg-primary text-primary-foreground hover:bg-primary/95"
                >
                  View Archives Drawer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </AppLayout>
  );
}
