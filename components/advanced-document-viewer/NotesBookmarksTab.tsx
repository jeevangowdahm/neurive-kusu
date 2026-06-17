'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bookmark, BookmarkCheck, FileText, Trash2, Edit2, Check, X, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface Note {
  id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

interface NotesBookmarksTabProps {
  documentId: string;
  isLegacy: boolean;
}

export function NotesBookmarksTab({ documentId, isLegacy }: NotesBookmarksTabProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      if (!authUser) {
        // Guest mode fallback: check localStorage for bookmarks
        const localFavorites = JSON.parse(localStorage.getItem('neurive_local_favorites') || '[]');
        const isFav = localFavorites.some((f: any) => f.archive_id === documentId);
        setBookmarked(isFav);
        setLoading(false);
        return;
      }

      // 1. Fetch Bookmark status
      const bookmarkQuery = supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', authUser.id);
      
      if (isLegacy) {
        bookmarkQuery.eq('archive_id', documentId);
      } else {
        bookmarkQuery.eq('document_id', documentId);
      }

      const { data: bookmarkData } = await bookmarkQuery.maybeSingle();
      if (bookmarkData) {
        setBookmarked(true);
        setBookmarkId(bookmarkData.id);
      } else {
        setBookmarked(false);
        setBookmarkId(null);
      }

      // 2. Fetch Notes list
      const notesQuery = supabase
        .from('document_notes')
        .select('id, note, created_at, updated_at')
        .eq('user_id', authUser.id);

      if (isLegacy) {
        notesQuery.eq('archive_id', documentId);
      } else {
        notesQuery.eq('document_id', documentId);
      }

      const { data: notesData, error: notesErr } = await notesQuery.order('created_at', { ascending: false });
      if (!notesErr && notesData) {
        setNotes(notesData);
      }
    } catch (err) {
      console.error('Failed to load notes and bookmarks:', err);
    } finally {
      setLoading(false);
    }
  }, [documentId, isLegacy]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleToggleBookmark = async () => {
    if (!user) {
      // Guest mode local toggle
      try {
        const localFavorites = JSON.parse(localStorage.getItem('neurive_local_favorites') || '[]');
        const nextState = !bookmarked;
        setBookmarked(nextState);

        if (nextState) {
          if (!localFavorites.some((f: any) => f.archive_id === documentId)) {
            localFavorites.unshift({
              id: `fav-${documentId}-${Date.now()}`,
              archive_id: documentId,
              created_at: new Date().toISOString(),
              archives: { id: documentId, title: 'Archived Document' }
            });
            localStorage.setItem('neurive_local_favorites', JSON.stringify(localFavorites));
          }
        } else {
          const filtered = localFavorites.filter((f: any) => f.archive_id !== documentId);
          localStorage.setItem('neurive_local_favorites', JSON.stringify(filtered));
        }
      } catch (err) {
        console.error('Local bookmark failed:', err);
      }
      return;
    }

    try {
      if (bookmarked && bookmarkId) {
        // Delete
        const { error: delErr } = await supabase
          .from('bookmarks')
          .delete()
          .eq('id', bookmarkId);
        
        if (!delErr) {
          setBookmarked(false);
          setBookmarkId(null);
        }
      } else {
        // Insert
        const insertObj: any = { user_id: user.id };
        if (isLegacy) {
          insertObj.archive_id = documentId;
        } else {
          insertObj.document_id = documentId;
        }

        const { data: insData, error: insErr } = await supabase
          .from('bookmarks')
          .insert(insertObj)
          .select('id')
          .single();

        if (!insErr && insData) {
          setBookmarked(true);
          setBookmarkId(insData.id);
        }
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !user) return;

    setIsSavingNote(true);
    setError(null);
    try {
      const insertObj: any = {
        user_id: user.id,
        note: newNote.trim()
      };
      if (isLegacy) {
        insertObj.archive_id = documentId;
      } else {
        insertObj.document_id = documentId;
      }

      const { data: newNoteData, error: noteErr } = await supabase
        .from('document_notes')
        .insert(insertObj)
        .select('id, note, created_at, updated_at')
        .single();

      if (noteErr) throw noteErr;

      if (newNoteData) {
        setNotes((prev) => [newNoteData, ...prev]);
        setNewNote('');
      }
    } catch (err) {
      setError('Failed to save your note. Please try again.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingText.trim() || !user) return;

    setIsUpdatingNote(true);
    setError(null);
    try {
      const { error: updErr } = await supabase
        .from('document_notes')
        .update({ note: editingText.trim(), updated_at: new Date().toISOString() })
        .eq('id', noteId);

      if (updErr) throw updErr;

      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? { ...n, note: editingText.trim(), updated_at: new Date().toISOString() }
            : n
        )
      );
      setEditingNoteId(null);
      setEditingText('');
    } catch (err) {
      setError('Failed to update note.');
    } finally {
      setIsUpdatingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    try {
      const { error: delErr } = await supabase
        .from('document_notes')
        .delete()
        .eq('id', noteId);

      if (!delErr) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      }
    } catch (err) {
      console.error('Delete note failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-xs font-mono">Loading user notes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bookmarks Section */}
      <div className="space-y-2 bg-slate-900/20 p-4 rounded-xl border border-slate-900/60">
        <h3 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider select-none">
          Document Bookmark
        </h3>
        <p className="text-[11px] text-slate-400 select-none">
          Save this register to your bookshelf collections dashboard to access it later.
        </p>
        <Button
          onClick={handleToggleBookmark}
          variant={bookmarked ? 'default' : 'outline'}
          className="w-full gap-2 h-9 font-semibold text-xs mt-2"
        >
          {bookmarked ? (
            <>
              <BookmarkCheck className="h-4 w-4 text-emerald-400 animate-pulse" />
              Bookmarked on Bookshelf
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4" />
              Save Bookmark
            </>
          )}
        </Button>
      </div>

      {/* Private Notes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 select-none">
          <h3 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
            Private Research Notes ({notes.length})
          </h3>
          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[9px] font-mono">
            SECURE PRIVATE
          </Badge>
        </div>

        {!user ? (
          <div className="bg-slate-950/40 p-6 rounded-xl border border-dashed border-slate-800 text-center space-y-3 select-none">
            <AlertCircle className="h-6 w-6 text-slate-500 mx-auto" />
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-300 block">Sign In to Save Notes</span>
              <span className="text-[10px] text-slate-500 max-w-xs block mx-auto">
                Private research annotations are restricted to authenticated accounts. Public or guest visitors cannot access notes.
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Note form */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <Textarea
                placeholder="Write transcription translations, cross references, or historical observations..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[90px] text-xs bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-655 focus-visible:ring-primary"
              />
              {error && (
                <div className="text-[10px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </div>
              )}
              <Button
                type="submit"
                disabled={isSavingNote || !newNote.trim()}
                size="sm"
                className="w-full gap-1.5 h-8 text-xs font-semibold"
              >
                {isSavingNote ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving Note...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3" />
                    Save Private Note
                  </>
                )}
              </Button>
            </form>

            {/* Notes List */}
            <div className="space-y-2.5">
              {notes.map((note) => {
                const isEditing = editingNoteId === note.id;

                return (
                  <Card key={note.id} className="bg-slate-950/40 border-slate-850 hover:border-slate-800 transition-colors">
                    <CardContent className="p-3.5 space-y-3">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="min-h-[80px] text-xs bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-primary"
                          />
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-slate-100"
                              onClick={() => {
                                setEditingNoteId(null);
                                setEditingText('');
                              }}
                              disabled={isUpdatingNote}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              className="h-7 w-7 bg-primary text-primary-foreground"
                              onClick={() => handleUpdateNote(note.id)}
                              disabled={isUpdatingNote || !editingText.trim()}
                            >
                              {isUpdatingNote ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                            {note.note}
                          </p>
                          <div className="flex items-center justify-between gap-3 text-[9px] text-slate-500 font-mono pt-1">
                            <span>
                              {new Date(note.created_at).toLocaleDateString()} at{' '}
                              {new Date(note.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              {note.updated_at !== note.created_at && ' (edited)'}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingNoteId(note.id);
                                  setEditingText(note.note);
                                }}
                                className="p-1 rounded hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-colors"
                                title="Edit Note"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="p-1 rounded hover:bg-slate-850 text-slate-400 hover:text-red-400 transition-colors"
                                title="Delete Note"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
