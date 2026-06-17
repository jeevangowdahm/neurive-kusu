'use client';

import React, { useState } from 'react';
import { Copy, Check, FileText, Link as LinkIcon, Share2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CitationService } from '@/lib/ai/citation-service';

interface CitationActionsProps {
  title: string;
  year?: number;
  district?: string;
  accessionNumber: string;
  currentPage?: number;
  catalogReference?: string;
  author?: string;
  publisher?: string;
}

export function CitationActions({
  title,
  year = 2024,
  district = 'Karnataka',
  accessionNumber,
  currentPage,
  catalogReference,
  author,
  publisher
}: CitationActionsProps) {
  const [style, setStyle] = useState<'apa' | 'mla' | 'chicago' | 'ieee'>('apa');
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Use modular CitationService to format
  const getUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return `/archive/${accessionNumber}`;
  };

  const citationText = CitationService.generateCitation({
    title,
    author: author || 'Karnataka State Archives',
    publisher: publisher || 'Government of Karnataka Press',
    year: year,
    district,
    catalogReference: catalogReference || accessionNumber.substring(0, 8).toUpperCase(),
    pageNumber: currentPage,
    url: getUrl()
  }, style);

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(citationText);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(accessionNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleCopyLink = () => {
    const pageUrl = getUrl();
    navigator.clipboard.writeText(pageUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <Card className="bg-slate-900/30 border-slate-800 backdrop-blur-sm select-none">
      <CardContent className="p-4 space-y-4 font-sans">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
            Cite & Reference Record
          </h4>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-mono">STYLE:</span>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary h-6"
            >
              <option value="apa">APA 7</option>
              <option value="mla">MLA 9</option>
              <option value="chicago">Chicago 17</option>
              <option value="ieee">IEEE</option>
            </select>
          </div>
        </div>

        {/* Citation Display */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 text-xs text-slate-400 font-mono leading-relaxed break-all max-h-[80px] overflow-y-auto">
          {citationText}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Copy Citation */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCitation}
            className="h-8.5 text-[10px] font-semibold border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 gap-1.5"
          >
            {copiedCitation ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <FileText className="h-3.5 w-3.5" />}
            Copy Citation
          </Button>

          {/* Copy Reference ID */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyRef}
            className="h-8.5 text-[10px] font-semibold border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 gap-1.5"
          >
            {copiedRef ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
            Copy Ref Code
          </Button>

          {/* Copy Link */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="h-8.5 text-[10px] font-semibold border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 gap-1.5"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <LinkIcon className="h-3.5 w-3.5" />}
            Copy Share Link
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
