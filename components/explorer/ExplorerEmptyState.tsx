'use client';

import React from 'react';
import { Database, Upload, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ExplorerEmptyStateProps {
  userRole?: string;
  type?: 'district' | 'category' | 'generic';
}

export function ExplorerEmptyState({ userRole = 'guest', type = 'generic' }: ExplorerEmptyStateProps) {
  const isPrivileged = ['admin', 'archivist'].includes(userRole);
  const typeLabel = type === 'district' ? 'this district region' : type === 'category' ? 'this topical category' : 'the archive platform';

  return (
    <div className="bg-slate-900/10 border border-slate-900 border-dashed rounded-xl p-8 text-center max-w-md mx-auto space-y-4 select-none font-sans">
      <Database className="h-10 w-10 text-slate-700 mx-auto animate-pulse" />
      
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-slate-200">
          No Archival Records Cataloged
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          There are currently no ingested documents matching {typeLabel} inside the database. Once files complete the upload pipeline, statistics and indexes will compile dynamically.
        </p>
      </div>

      {isPrivileged ? (
        <div className="pt-2">
          <Button size="sm" className="gap-1.5 text-xs font-semibold" asChild>
            <Link href="/upload">
              <Upload className="h-3.5 w-3.5" />
              Upload Archival Document
            </Link>
          </Button>
        </div>
      ) : (
        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900 flex items-start gap-2.5 text-left text-[10.5px] text-slate-500 max-w-sm mx-auto">
          <ShieldAlert className="h-4.5 w-4.5 text-amber-500/80 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Guest and general researcher access is read-only. Please contact an administrative archivist to upload or ingest new physical files for this section.
          </p>
        </div>
      )}
    </div>
  );
}
