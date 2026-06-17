'use client';

import React from 'react';
import { ShieldAlert, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface DocumentAccessGuardProps {
  loading: boolean;
  error: string | null;
  status?: string;
  children: React.ReactNode;
}

export function DocumentAccessGuard({ loading, error, status, children }: DocumentAccessGuardProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 select-none">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse font-mono">Verifying credentials & retrieving archival registry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-md w-full p-8 border border-destructive/20 rounded-xl bg-destructive/5 text-center space-y-4 backdrop-blur-md shadow-lg">
          <div className="p-3 bg-destructive/10 text-destructive rounded-full inline-block">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-foreground font-serif">Access Denied</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>
          <div className="pt-2 flex justify-center gap-3">
            <Button variant="outline" asChild size="sm" className="h-9">
              <Link href="/search">
                <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                Return to Search
              </Link>
            </Button>
            <Button size="sm" asChild className="h-9 font-semibold">
              <Link href="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {status && !['Completed', 'active'].includes(status) && (
        <div className="bg-amber-950/20 border-b border-amber-900/30 px-6 py-2 flex items-center gap-2 text-xs text-amber-500 font-mono">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
          <span>
            {status === 'Failed' 
              ? 'Warning: Ingestion failed for this document. Text extracting failed.' 
              : `Indexing in progress (status: ${status}). Conversational RAG and AI search may be unavailable.`
            }
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
