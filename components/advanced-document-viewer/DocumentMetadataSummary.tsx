'use client';

import React from 'react';
import { Calendar, MapPin, FolderOpen, Languages, FileText, Shield, Sparkles, Hash, Clock, Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface DocumentMetadataSummaryProps {
  document: {
    id: string;
    title: string;
    description?: string;
    summary?: string;
    district?: string;
    category?: string;
    language?: string;
    year?: number;
    file_type?: string;
    status?: string;
    visibility?: string;
    ocr_confidence?: number;
    page_count?: number;
    created_at?: string;
    keywords?: string[];
    // new advanced fields
    archive_source?: string;
    preservation_status?: string;
    source_reliability_score?: number;
    catalog_reference?: string;
    collection_name?: string;
  };
}

export function DocumentMetadataSummary({ document: doc }: DocumentMetadataSummaryProps) {
  const metaItems = [
    { icon: Hash, label: 'Accession No.', value: doc.id.substring(0, 8).toUpperCase() },
    { icon: Calendar, label: 'Historical Year', value: doc.year ? `${doc.year} CE` : 'Unknown' },
    { icon: MapPin, label: 'District', value: doc.district || 'Karnataka' },
    { icon: FolderOpen, label: 'Category', value: doc.category || 'Archival Record' },
    { icon: Languages, label: 'Primary Language', value: doc.language || 'English' },
    { icon: FileText, label: 'Format Type', value: doc.file_type?.toUpperCase() || 'PDF' },
    { icon: FileText, label: 'Page Count', value: doc.page_count?.toString() || '1' },
    { icon: Percent, label: 'OCR Confidence', value: doc.ocr_confidence ? `${Math.round(Number(doc.ocr_confidence) * 100)}%` : '0%' },
    { icon: Clock, label: 'Digitization Date', value: doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A' },
  ];

  if (doc.archive_source) {
    metaItems.push({ icon: FileText, label: 'Archive Source', value: doc.archive_source });
  }
  if (doc.preservation_status) {
    metaItems.push({ icon: Shield, label: 'Preservation Status', value: doc.preservation_status.toUpperCase() });
  }
  if (doc.source_reliability_score !== undefined && doc.source_reliability_score !== null) {
    metaItems.push({ icon: Percent, label: 'Reliability Score', value: `${Math.round(Number(doc.source_reliability_score) * 100)}%` });
  }
  if (doc.catalog_reference) {
    metaItems.push({ icon: Hash, label: 'Catalog Ref', value: doc.catalog_reference });
  }
  if (doc.collection_name) {
    metaItems.push({ icon: FolderOpen, label: 'Collection Name', value: doc.collection_name });
  }


  const visibilityStyles: Record<string, string> = {
    public: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    restricted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    private: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const statusStyles: Record<string, string> = {
    Completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    active: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Processing: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const visibilityVal = doc.visibility?.toLowerCase() || 'public';
  const statusVal = doc.status || 'Completed';

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-slate-100 font-serif leading-tight">{doc.title}</h2>
        <div className="flex flex-wrap gap-2 pt-1 select-none">
          <Badge variant="outline" className={visibilityStyles[visibilityVal] || visibilityStyles.public}>
            <Shield className="mr-1 h-3 w-3" />
            {visibilityVal.toUpperCase()}
          </Badge>
          <Badge variant="outline" className={statusStyles[statusVal] || statusStyles.Completed}>
            {statusVal}
          </Badge>
        </div>
      </div>

      <Separator className="bg-slate-800" />

      {/* Description / AI Summary */}
      <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm shadow-inner">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-primary font-semibold font-mono">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span>AI-GENERATED SYNOPSIS</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
            {doc.summary || doc.description || 'No description recorded. Click "Request Ingestion" to generate an automatic summary.'}
          </p>
        </CardContent>
      </Card>

      {/* Grid Metadata */}
      <div className="grid grid-cols-2 gap-4">
        {metaItems.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-2 bg-slate-900/20 p-2.5 rounded-lg border border-slate-900/50">
            <Icon className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">{label}</p>
              <p className="text-xs font-semibold text-slate-300 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Keywords */}
      {doc.keywords && doc.keywords.length > 0 && (
        <div className="space-y-2 select-none">
          <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Keywords & Indexes</p>
          <div className="flex flex-wrap gap-1.5">
            {doc.keywords.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] bg-slate-800/80 text-slate-300 hover:bg-slate-850">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
