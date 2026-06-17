'use client';

import NextImage from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { X, Download, ExternalLink, Loader, CircleAlert as AlertCircle, Type, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';

interface Document {
  id: string;
  title: string;
  description?: string | null;
  file_url: string;
  file_type: 'pdf' | 'image' | 'audio' | 'video' | 'text';
  thumbnail_url?: string;
  date_recorded?: string;
  language?: string;
  tags?: string[];
  author?: string;
}

interface DocumentViewerProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewer({ document, isOpen, onClose }: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [annotation, setAnnotation] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [existingAnnotations, setExistingAnnotations] = useState<any[]>([]);
  const [contentLoaded, setContentLoaded] = useState(false);

  const loadAnnotations = useCallback(async () => {
    if (!document) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: err } = await supabase
        .from('document_annotations')
        .select('*')
        .eq('archive_id', document.id)
        .eq('user_id', user.id);

      if (!err && data) {
        setExistingAnnotations(data);
        if (data.length > 0) {
          setAnnotation(data[0].content);
        }
      }
    } catch (err) {
      console.error('Failed to load annotations:', err);
    }
  }, [document]);

  useEffect(() => {
    if (document && isOpen) {
      setError(null);
      setContentLoaded(false);
      loadAnnotations();
    }
  }, [document, isOpen, loadAnnotations]);

  const saveAnnotation = async () => {
    if (!document || !annotation.trim()) return;

    setIsSavingNote(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to save annotations');
        return;
      }

      if (existingAnnotations.length > 0) {
        await supabase
          .from('document_annotations')
          .update({ content: annotation, updated_at: new Date().toISOString() })
          .eq('id', existingAnnotations[0].id);
      } else {
        await supabase
          .from('document_annotations')
          .insert({
            archive_id: document.id,
            user_id: user.id,
            content: annotation,
          });
      }
    } catch (err) {
      setError('Failed to save annotation');
    } finally {
      setIsSavingNote(false);
    }
  };

  const renderViewer = () => {
    if (!document) return null;

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading document...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 gap-4 p-6">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground text-center max-w-md">{error}</p>
          <Button variant="outline" size="sm" asChild>
            <a href={document.file_url} target="_blank" rel="noopener noreferrer">
              Open in New Tab <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      );
    }

    const commonProps = {
      onLoad: () => setContentLoaded(true),
      onError: () => setError(`Failed to load ${document.file_type} file`),
    };

    switch (document.file_type) {
      case 'pdf':
        return (
          <iframe
            src={document.file_url}
            className="w-full h-96 border-0 rounded-lg"
            title={document.title}
            {...commonProps}
          />
        );

      case 'image':
        return (
          <div className="w-full flex items-center justify-center bg-muted rounded-lg p-4 max-h-96">
            <NextImage
              src={document.file_url}
              alt={document.title}
              width={960}
              height={640}
              unoptimized
              className="max-w-full max-h-96 rounded-lg"
              {...commonProps}
            />
          </div>
        );

      case 'audio':
        return (
          <div className="w-full space-y-4">
            <div className="bg-muted p-8 rounded-lg flex items-center justify-center">
              <audio
                controls
                src={document.file_url}
                className="w-full"
                {...commonProps}
              />
            </div>
            <div className="text-sm text-muted-foreground italic">
              Audio duration may vary. Use the player controls to navigate.
            </div>
          </div>
        );

      case 'video':
        if (document.file_url.includes('youtube.com') || document.file_url.includes('youtu.be')) {
          const embedUrl = document.file_url.replace('watch?v=', 'embed/').split('&')[0];
          return (
            <iframe
              src={embedUrl}
              className="w-full h-96 border-0 rounded-lg"
              allowFullScreen
              title={document.title}
              {...commonProps}
            />
          );
        } else {
          return (
            <video
              controls
              src={document.file_url}
              className="w-full h-96 rounded-lg bg-black"
              {...commonProps}
            />
          );
        }

      case 'text':
        return (
          <ScrollArea className="w-full h-96 bg-muted p-6 rounded-lg border">
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap break-words text-sm leading-relaxed font-mono">
              {document.file_url.startsWith('http') ? (
                <div className="flex items-center gap-2 justify-center h-full">
                  <AlertCircle className="h-4 w-4" />
                  <span>Click button below to view full text content</span>
                </div>
              ) : (
                document.file_url
              )}
            </div>
          </ScrollArea>
        );

      default:
        return (
          <div className="flex items-center justify-center h-96 gap-3 text-muted-foreground">
            <FileText className="h-6 w-6" />
            Unsupported file type
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="flex-1 space-y-2">
              <DialogTitle className="text-2xl">{document?.title}</DialogTitle>
              <div className="flex flex-wrap gap-2">
                {document?.tags?.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {document && (
          <div className="space-y-6 mt-6">
            {/* Document Metadata */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
              {document.description && (
                <p className="text-foreground">{document.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-muted-foreground text-xs pt-2 border-t">
                {document.date_recorded && (
                  <div>
                    <span className="font-semibold">Date:</span> {document.date_recorded}
                  </div>
                )}
                {document.language && (
                  <div>
                    <span className="font-semibold">Language:</span> {document.language}
                  </div>
                )}
                {document.author && (
                  <div>
                    <span className="font-semibold">Author:</span> {document.author}
                  </div>
                )}
                <div>
                  <span className="font-semibold">Type:</span>{' '}
                  <Badge variant="outline" className="text-xs capitalize ml-1">
                    {document.file_type}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Document Content Area */}
            <div className="border rounded-lg p-6 bg-card">
              {renderViewer()}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={document.file_url} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download / Open
                </a>
              </Button>
            </div>

            {/* Annotations/Notes Section */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">My Notes</h3>
              </div>
              <Textarea
                placeholder="Add your research notes, observations, or translations here..."
                value={annotation}
                onChange={(e) => setAnnotation(e.target.value)}
                className="min-h-[120px]"
              />
              <Button
                size="sm"
                onClick={saveAnnotation}
                disabled={isSavingNote || !annotation.trim()}
                className="self-start"
              >
                {isSavingNote ? (
                  <>
                    <Loader className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Notes'
                )}
              </Button>
              {existingAnnotations.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(existingAnnotations[0].updated_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
