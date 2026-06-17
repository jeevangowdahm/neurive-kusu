'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Download, CircleAlert as AlertCircle, FileText, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentPreviewPanelProps {
  fileUrl: string;
  fileType: string;
  title: string;
  pageCount: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  downloadPermitted: boolean;
  onDownload: () => void;
}

export function DocumentPreviewPanel({
  fileUrl,
  fileType,
  title,
  pageCount,
  currentPage,
  setCurrentPage,
  downloadPermitted,
  onDownload
}: DocumentPreviewPanelProps) {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIframeLoading(true);
  }, [fileUrl]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.5));
  const handleResetZoom = () => setZoom(1);

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch((err) => {
        console.error('Fullscreen request rejected:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < pageCount) setCurrentPage(currentPage + 1);
  };

  const isPdf = fileType?.toLowerCase() === 'pdf' || fileUrl?.toLowerCase().includes('.pdf');
  const isImage = ['jpg', 'jpeg', 'png', 'tiff', 'tif', 'webp', 'gif'].includes(fileType?.toLowerCase() || '') ||
                  /\.(jpg|jpeg|png|tiff|tif|webp|gif)/i.test(fileUrl || '');

  return (
    <div 
      ref={containerRef}
      className={`relative flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'w-screen h-screen rounded-none z-50 p-4' : 'w-full'
      }`}
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 backdrop-blur-md z-10 select-none">
        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-slate-800/65"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </Button>
          <span className="text-xs font-mono text-slate-300">
            Page {currentPage} of {Math.max(1, pageCount)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage >= pageCount}
            className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-slate-800/65"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-slate-800/65"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span 
            className="text-[10px] font-mono text-slate-400 min-w-[36px] text-center cursor-pointer hover:text-slate-100"
            onClick={handleResetZoom}
            title="Reset Zoom"
          >
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-slate-800/65"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {downloadPermitted && (
            <Button
              variant="outline"
              size="icon"
              onClick={onDownload}
              className="h-8 w-8 border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
              title="Download Document"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={handleToggleFullscreen}
            className="h-8 w-8 border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* File Render Workspace */}
      <div className="flex-1 relative overflow-auto flex items-center justify-center p-4 bg-slate-950/60 shadow-inner">
        {iframeLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-slate-400 font-mono">Loading document canvas...</p>
          </div>
        )}

        <div 
          className="transition-transform duration-200 ease-out origin-center"
          style={{ transform: `scale(${zoom})` }}
        >
          {isPdf ? (
            <iframe
              src={`${fileUrl}#page=${currentPage}`}
              className="w-[85vw] max-w-4xl h-[70vh] border-0 rounded-lg shadow-2xl bg-white"
              title={title}
              onLoad={() => setIframeLoading(false)}
            />
          ) : isImage ? (
            <img
              src={fileUrl}
              alt={title}
              className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain bg-slate-900 border border-slate-800"
              onLoad={() => setIframeLoading(false)}
              onError={() => setIframeLoading(false)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-center gap-4 bg-slate-900/30 rounded-xl border border-dashed border-slate-800 max-w-md">
              <div className="p-3 bg-amber-950/20 text-amber-500 rounded-full">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold text-slate-200">Unsupported File Preview</h4>
                <p className="text-xs text-slate-400">Previews for file type &ldquo;{fileType}&rdquo; are not fully supported inline.</p>
              </div>
              {downloadPermitted ? (
                <Button onClick={onDownload} size="sm" className="gap-2 font-semibold">
                  <Download className="h-3.5 w-3.5" />
                  Download File to View
                </Button>
              ) : (
                <p className="text-[10px] text-slate-500">Preview/Download disabled due to access clearance level.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
