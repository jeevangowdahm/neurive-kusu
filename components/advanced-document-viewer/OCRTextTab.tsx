'use client';
import { safeWriteToClipboard } from '@/lib/security/clipboard';

import React, { useState, useEffect } from 'react';
import { Search, Copy, Check, ShieldAlert, FileText, ChevronLeft, ChevronRight, Edit2, Save, X, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface OCRPage {
  page_number: number;
  extracted_text: string;
  corrected_text?: string;
  correction_status?: string;
  ocr_confidence?: number;
}

interface OCRTextTabProps {
  pages: OCRPage[];
  initialPage?: number;
  onPageChange?: (page: number) => void;
  initialQuery?: string;
  userRole?: string;
  documentId?: string;
}

export function OCRTextTab({ 
  pages: initialPages, 
  initialPage = 1, 
  onPageChange, 
  initialQuery = '',
  userRole = 'guest',
  documentId
}: OCRTextTabProps) {
  const [pages, setPages] = useState<OCRPage[]>(initialPages);
  const [currentPageNum, setCurrentPageNum] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [copied, setCopied] = useState(false);

  // Correction & Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [correctionStatus, setCorrectionStatus] = useState<'raw' | 'reviewed' | 'corrected'>('raw');
  const [isSaving, setIsSaving] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    setPages(initialPages);
  }, [initialPages]);

  useEffect(() => {
    setCurrentPageNum(initialPage);
  }, [initialPage]);

  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  const totalPages = pages.length;
  
  // Find currently selected page
  const currentPageData = pages.find((p) => p.page_number === currentPageNum) || pages[0];

  // Initialize edit text box
  useEffect(() => {
    if (currentPageData) {
      setEditedText(currentPageData.corrected_text || currentPageData.extracted_text || '');
      setCorrectionStatus((currentPageData.correction_status as any) || 'raw');
    }
  }, [currentPageData, currentPageNum]);

  const handlePageSelect = (page: number) => {
    if (isEditing) {
      if (!confirm('You have unsaved changes. Discard corrections and navigate?')) return;
      setIsEditing(false);
    }
    setCurrentPageNum(page);
    if (onPageChange) onPageChange(page);
  };

  const activeText = showOriginal 
    ? (currentPageData?.extracted_text || '') 
    : (currentPageData?.corrected_text || currentPageData?.extracted_text || '');

  const handleCopy = async () => {
    if (!activeText) return;
    safeWriteToClipboard(activeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCorrection = async () => {
    if (!documentId) {
      toast.error('Document registry link missing. Cannot save changes.');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const newStatus = correctionStatus === 'raw' ? 'corrected' : correctionStatus;

      const { error } = await supabase
        .from('document_pages')
        .update({
          corrected_text: editedText,
          correction_status: newStatus,
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString()
        })
        .eq('document_id', documentId)
        .eq('page_number', currentPageNum);

      if (error) throw error;

      // Update local state statefully
      setPages(prev => prev.map(p => {
        if (p.page_number === currentPageNum) {
          return {
            ...p,
            corrected_text: editedText,
            correction_status: newStatus
          };
        }
        return p;
      }));

      setIsEditing(false);
      toast.success(`Page ${currentPageNum} transcript corrections saved successfully!`);
    } catch (err: any) {
      console.error('Failed to save correction:', err);
      toast.error(err.message || 'Error occurred saving review to database.');
    } finally {
      setIsSaving(false);
    }
  };

  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;
    try {
      const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(${escapedSearch})`, 'gi');
      const parts = text.split(regex);
      return (
        <>
          {parts.map((part, i) => 
            regex.test(part) ? (
              <mark key={i} className="bg-yellow-500/40 text-slate-100 px-0.5 rounded border border-yellow-500/20 shadow-sm">
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </>
      );
    } catch {
      return text;
    }
  };

  if (totalPages === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 gap-3 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
        <FileText className="h-8 w-8 text-slate-600" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-200">No OCR Manuscript Available</p>
          <p className="text-xs text-slate-500 max-w-xs">This record has not been run through the OCR text extraction engine yet.</p>
        </div>
      </div>
    );
  }

  const confidence = currentPageData?.ocr_confidence ? Number(currentPageData.ocr_confidence) : 0.9;
  const displayConfidence = Math.round(confidence * 100);
  const isLowConfidence = displayConfidence < 60;
  const isAuthorized = userRole === 'admin' || userRole === 'archivist';

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* OCR Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
        {/* Page selector */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePageSelect(currentPageNum - 1)}
            disabled={currentPageNum <= 1 || isSaving}
            className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </Button>
          <select
            value={currentPageNum}
            onChange={(e) => handlePageSelect(Number(e.target.value))}
            disabled={isSaving}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary h-8 select-none"
          >
            {pages.map((p) => (
              <option key={p.page_number} value={p.page_number}>
                Page {p.page_number}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePageSelect(currentPageNum + 1)}
            disabled={currentPageNum >= totalPages || isSaving}
            className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </Button>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 select-none">
          {currentPageData?.corrected_text && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOriginal(!showOriginal)}
              className="text-[10px] h-8 border-slate-800 hover:bg-slate-800 text-slate-300 gap-1.5"
            >
              <History className="h-3.5 w-3.5" />
              {showOriginal ? 'Show Corrected' : 'Show Original'}
            </Button>
          )}

          {isAuthorized && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-[10px] h-8 border-slate-800 hover:bg-slate-800 text-slate-300 gap-1.5"
            >
              <Edit2 className="h-3.5 w-3.5 text-primary" />
              Correct OCR
            </Button>
          )}

          <Badge 
            variant="secondary" 
            className={`text-[10px] font-mono font-semibold ${
              isLowConfidence 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            Confidence: {displayConfidence}%
          </Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            disabled={isEditing}
            className="h-8 w-8 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
            title="Copy Page Text"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Low Confidence Warning */}
      {isLowConfidence && !currentPageData?.corrected_text && (
        <Card className="bg-rose-500/5 border-rose-500/15">
          <CardContent className="p-3 flex items-start gap-2 text-rose-400 text-xs font-sans">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-500 animate-pulse" />
            <div className="space-y-0.5">
              <span className="font-semibold block">Low OCR Confidence Warning (&lt; 60%)</span>
              <span className="text-slate-400 text-[11px] leading-relaxed">
                Page text accuracy is flagged. Please review anomalies or request manual correction from an archivist.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Correction status banner */}
      {currentPageData?.correction_status && currentPageData.correction_status !== 'raw' && !isEditing && (
        <Card className="bg-emerald-500/5 border-emerald-500/15">
          <CardContent className="p-2.5 flex items-center justify-between text-emerald-400 text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>MANUALLY REVIEWED & CORRECTED ({currentPageData.correction_status.toUpperCase()})</span>
            </div>
            {showOriginal && <span className="text-[10px] text-amber-500 italic font-sans">Showing original raw OCR text</span>}
          </CardContent>
        </Card>
      )}

      {/* Inline edit panel toolbar */}
      {isEditing && (
        <div className="bg-slate-900/60 p-3 rounded-lg border border-primary/20 flex flex-wrap items-center justify-between gap-3 animate-slide-down">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Correction Status:</span>
            <select
              value={correctionStatus}
              onChange={(e) => setCorrectionStatus(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary h-8"
            >
              <option value="raw">Raw</option>
              <option value="corrected">Corrected</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isSaving}
              onClick={() => setIsEditing(false)}
              className="text-[10px] h-8 border-slate-800 text-slate-400 hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSaving}
              onClick={handleSaveCorrection}
              className="text-[10px] h-8 bg-primary text-primary-foreground hover:bg-primary/95"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {isSaving ? 'Saving...' : 'Save Correction'}
            </Button>
          </div>
        </div>
      )}

      {/* Inside OCR Search bar */}
      {!isEditing && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <Input
            placeholder="Search inside OCR transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-primary focus-visible:border-primary text-xs"
          />
        </div>
      )}

      {/* Manuscript Content area */}
      <Card className="flex-1 bg-slate-950/80 border-slate-800/80 overflow-hidden flex flex-col min-h-[300px]">
        <CardContent className="p-4 overflow-y-auto max-h-[50vh] flex-1 flex flex-col">
          {isEditing ? (
            <textarea
              className="w-full flex-1 min-h-[250px] bg-slate-900 text-slate-200 border border-slate-800 rounded-lg p-3 text-xs focus:ring-1 focus:ring-primary focus:outline-none font-sans leading-relaxed"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              placeholder="Correct the OCR transcript text here..."
            />
          ) : (
            <pre className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap break-words">
              {activeText ? (
                highlightText(activeText, searchQuery)
              ) : (
                <span className="text-slate-600 italic">No text extracted on this page.</span>
              )}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
