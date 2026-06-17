'use client';

import { Calendar, MapPin, FileText, Eye, Download, Bookmark, BookmarkCheck, Tag, Languages, Play, Music, Image as ImageIcon, FileCode } from 'lucide-react';
import NextImage from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ArchiveEnhanced {
  id: string;
  title: string;
  description?: string | null;
  file_type: 'pdf' | 'image' | 'audio' | 'video' | 'text';
  file_url: string;
  thumbnail_url?: string;
  year?: number;
  date_recorded?: string;
  language?: string;
  tags?: string[];
  view_count?: number;
  download_count?: number;
  accession_number?: string;
  is_featured?: boolean;
  author?: string;
  source_type?: string;
  source_name?: string;
  source_license?: string;
  source_attribution?: string;
  retrieval_date?: string;
  source_is_real?: boolean;
  is_demo?: boolean;
}

interface ArchiveCardEnhancedProps {
  archive: ArchiveEnhanced;
  onOpenViewer?: (archive: ArchiveEnhanced) => void;
  compact?: boolean;
}

const fileTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pdf: {
    label: 'PDF',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  },
  image: {
    label: 'Image',
    icon: <ImageIcon className="h-4 w-4" />,
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  audio: {
    label: 'Audio',
    icon: <Music className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  },
  video: {
    label: 'Video',
    icon: <Play className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
  text: {
    label: 'Text',
    icon: <FileCode className="h-4 w-4" />,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
};

export function ArchiveCardEnhanced({
  archive,
  onOpenViewer,
  compact = false,
}: ArchiveCardEnhancedProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const typeConfig = fileTypeConfig[archive.file_type];

  return (
    <Card className={cn('card-hover border bg-card overflow-hidden group cursor-pointer', compact && 'shadow-none')}>
      <CardContent className={cn('p-0', compact ? 'p-3' : '')}>
        {/* Thumbnail Preview */}
        {!compact && archive.thumbnail_url && (
          <div className="relative h-48 w-full overflow-hidden bg-muted flex items-center justify-center">
            <NextImage
              src={archive.thumbnail_url}
              alt={archive.title}
              width={640}
              height={360}
              unoptimized
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-black hover:bg-white"
                onClick={() => onOpenViewer?.(archive)}
              >
                {typeConfig.icon}
                <span className="ml-1">View</span>
              </Button>
            </div>
          </div>
        )}

        <div className={cn('p-4', compact && 'p-0')}>
          {/* Type Badge */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded', typeConfig.color)}>
                {typeConfig.icon}
                {typeConfig.label}
              </Badge>
              {archive.is_featured && (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
                  Featured
                </Badge>
              )}
              {archive.source_is_real === true ? (
                <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-500/25 text-xs">
                  Real Public Source
                </Badge>
              ) : (
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-500/25 text-xs">
                  Synthetic Demo
                </Badge>
              )}
              {archive.source_type === 'upload' && (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-500/25 text-xs">
                  Uploaded Archive
                </Badge>
              )}
              {archive.source_type === 'wikipedia' && (
                <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300 border border-slate-500/25 text-xs">
                  Wikipedia
                </Badge>
              )}
              {archive.source_type === 'internet_archive' && (
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-500/25 text-xs">
                  Internet Archive
                </Badge>
              )}
              {archive.source_type === 'government_pdf' && (
                <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-500/25 text-xs">
                  Government PDF
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 -mt-0.5"
              onClick={() => setBookmarked(!bookmarked)}
            >
              {bookmarked
                ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                : <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
              }
            </Button>
          </div>

          {/* Title */}
          <h3
            className="font-semibold text-foreground text-sm leading-snug hover:text-primary transition-colors line-clamp-2 cursor-pointer mb-2"
            onClick={() => onOpenViewer?.(archive)}
          >
            {archive.title}
          </h3>

          {/* Description */}
          {!compact && archive.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
              {archive.description}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
            {archive.date_recorded && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {archive.date_recorded}
              </span>
            )}
            {archive.year && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {archive.year}
              </span>
            )}
            {archive.language && (
              <span className="flex items-center gap-1">
                <Languages className="h-3 w-3" />
                {archive.language === 'kannada' ? 'ಕನ್ನಡ' : archive.language === 'both' ? 'KN/EN' : 'EN'}
              </span>
            )}
          </div>

          {/* Tags */}
          {archive.tags && archive.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {archive.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {archive.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{archive.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          {!compact && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {archive.view_count !== undefined && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {archive.view_count.toLocaleString()}
                  </span>
                )}
                {archive.download_count !== undefined && (
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {archive.download_count.toLocaleString()}
                  </span>
                )}
              </div>
              <Button
                variant="default"
                size="sm"
                className="h-6 text-xs px-3"
                onClick={() => onOpenViewer?.(archive)}
              >
                {typeConfig.icon}
                <span className="ml-1">Open</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
