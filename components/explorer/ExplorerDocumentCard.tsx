'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bookmark, BookmarkCheck, FileText, Sparkles, AlertCircle, ExternalLink, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

interface Document {
  id: string;
  title: string;
  summary?: string;
  description?: string;
  year?: number;
  district?: string;
  category?: string;
  language?: string;
  ocr_confidence?: number;
  visibility?: string;
  status?: string;
  isDemo?: boolean;
}

interface ExplorerDocumentCardProps {
  document: Document;
}

export function ExplorerDocumentCard({ document }: ExplorerDocumentCardProps) {
  const [user, setUser] = useState<any>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isLegacy = document.id.startsWith('arch-') || document.id.startsWith('demo-doc-');

  // Load bookmark status matching NotesBookmarksTab logic
  const loadBookmarkStatus = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      if (!authUser) {
        // Guest mode fallback
        const localFavorites = JSON.parse(localStorage.getItem('neurive_local_favorites') || '[]');
        const isFav = localFavorites.some((f: any) => f.archive_id === document.id);
        setBookmarked(isFav);
        setLoading(false);
        return;
      }

      const query = supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', authUser.id);
      
      if (isLegacy) {
        query.eq('archive_id', document.id);
      } else {
        query.eq('document_id', document.id);
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        setBookmarked(true);
        setBookmarkId(data.id);
      } else {
        setBookmarked(false);
        setBookmarkId(null);
      }
    } catch (err) {
      console.warn('Failed to load bookmark status in explorer card:', err);
    } finally {
      setLoading(false);
    }
  }, [document.id, isLegacy]);

  useEffect(() => {
    loadBookmarkStatus();
  }, [loadBookmarkStatus]);

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      // Guest mode local storage sync
      try {
        const localFavorites = JSON.parse(localStorage.getItem('neurive_local_favorites') || '[]');
        const nextState = !bookmarked;
        setBookmarked(nextState);

        if (nextState) {
          if (!localFavorites.some((f: any) => f.archive_id === document.id)) {
            localFavorites.unshift({
              id: `fav-${document.id}-${Date.now()}`,
              archive_id: document.id,
              created_at: new Date().toISOString(),
              archives: { id: document.id, title: document.title }
            });
            localStorage.setItem('neurive_local_favorites', JSON.stringify(localFavorites));
          }
          toast.success('Bookmark added to local guest shelf!');
        } else {
          const filtered = localFavorites.filter((f: any) => f.archive_id !== document.id);
          localStorage.setItem('neurive_local_favorites', JSON.stringify(filtered));
          toast.success('Bookmark removed!');
        }
      } catch (err) {
        console.error('Local bookmark toggle failed:', err);
      }
      return;
    }

    try {
      if (bookmarked && bookmarkId) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('id', bookmarkId);

        if (!error) {
          setBookmarked(false);
          setBookmarkId(null);
          toast.success('Bookmark removed!');
        }
      } else {
        const insertObj: any = { user_id: user.id };
        if (isLegacy) {
          insertObj.archive_id = document.id;
        } else {
          insertObj.document_id = document.id;
        }

        const { data, error } = await supabase
          .from('bookmarks')
          .insert(insertObj)
          .select('id')
          .single();

        if (!error && data) {
          setBookmarked(true);
          setBookmarkId(data.id);
          toast.success('Saved to your bookshelf bookmarks!');
        } else {
          toast.error('Bookmark toggle failed');
        }
      }
    } catch (err) {
      console.warn('Failed to toggle bookmark:', err);
    }
  };

  const docUrl = isLegacy ? `/archive/${document.id}` : `/documents/${document.id}`;
  const summaryText = document.summary || document.description || 'Archival document record cataloged in Karnataka state intelligence vault.';
  const ocrQuality = document.ocr_confidence ? Math.round(Number(document.ocr_confidence) * 100) : 0;

  return (
    <Card className="border bg-slate-900/30 border-slate-800 hover:border-slate-700 transition-all card-hover overflow-hidden flex flex-col justify-between group">
      <CardContent className="p-4 sm:p-5 flex flex-col h-full justify-between gap-3 select-none">
        
        {/* Header (Access level + OCR badge + Bookmark Button) */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={`text-[8.5px] font-mono tracking-wider scale-95 border-slate-800 ${
              document.visibility === 'public' ? 'text-emerald-400 bg-emerald-500/10' :
              document.visibility === 'restricted' ? 'text-amber-400 bg-amber-500/10' : 'text-rose-400 bg-rose-500/10'
            }`}>
              {document.visibility?.toUpperCase() || 'PUBLIC'}
            </Badge>

            {ocrQuality > 0 && (
              <Badge variant="outline" className={`text-[8.5px] font-mono scale-95 border-slate-800 ${
                ocrQuality >= 80 ? 'text-sky-400 bg-sky-500/10' : 'text-amber-400 bg-amber-500/10'
              }`}>
                OCR {ocrQuality}%
              </Badge>
            )}

            {document.isDemo && (
              <Badge variant="outline" className="text-[8px] font-mono scale-95 text-amber-500 bg-amber-500/5 border-amber-500/20">
                DEMO
              </Badge>
            )}
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={handleToggleBookmark}
            disabled={loading}
            className="h-7 w-7 text-slate-400 hover:text-slate-100 hover:bg-slate-800 shrink-0"
          >
            {bookmarked ? (
              <BookmarkCheck className="h-4.5 w-4.5 text-emerald-400" />
            ) : (
              <Bookmark className="h-4.5 w-4.5" />
            )}
          </Button>
        </div>

        {/* Content body */}
        <div className="space-y-1.5 min-w-0">
          <Link href={docUrl}>
            <h4 className="text-xs font-bold text-slate-100 font-serif leading-snug group-hover:text-primary transition-colors hover:underline cursor-pointer truncate max-w-full">
              {document.title}
            </h4>
          </Link>
          <p className="text-[10.5px] text-slate-400 leading-relaxed line-clamp-2 italic pr-2">
            &ldquo;{summaryText}&rdquo;
          </p>
        </div>

        {/* Metadata tag pills */}
        <div className="flex flex-wrap gap-1.5 pt-2 text-[10px] text-slate-500 font-mono">
          {document.year && (
            <span className="bg-slate-950/45 px-2 py-0.5 rounded border border-slate-850">
              {document.year} CE
            </span>
          )}
          {document.district && (
            <span className="bg-slate-950/45 px-2 py-0.5 rounded border border-slate-850">
              {document.district}
            </span>
          )}
          {document.category && (
            <span className="bg-slate-950/45 px-2 py-0.5 rounded border border-slate-850 capitalize">
              {document.category.replace(/-/g, ' ')}
            </span>
          )}
          {document.language && (
            <span className="bg-slate-950/45 px-2 py-0.5 rounded border border-slate-850 uppercase">
              {document.language}
            </span>
          )}
        </div>

        {/* Foot Actions */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 mt-1 select-none">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-[10.5px] font-semibold border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-850 gap-1"
            asChild
          >
            <Link href={docUrl}>
              <ExternalLink className="h-3.5 w-3.5" />
              Open Document
            </Link>
          </Button>

          <Button
            size="sm"
            className="h-8 text-[10.5px] font-semibold gap-1"
            asChild
          >
            <Link href={`/chat?document_id=${document.id}`}>
              <MessageSquare className="h-3.5 w-3.5" />
              Ask AI about it
            </Link>
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
