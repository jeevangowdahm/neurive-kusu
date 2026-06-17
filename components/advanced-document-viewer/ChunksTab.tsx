'use client';

import React from 'react';
import { Database, AlertTriangle, FileSpreadsheet, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Chunk {
  id: string;
  chunk_index: number;
  page_number?: number;
  content?: string;
  chunk_text?: string;
  metadata?: any;
  embedding?: any;
}

interface ChunksTabProps {
  chunks: Chunk[];
}

export function ChunksTab({ chunks }: ChunksTabProps) {
  if (chunks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 gap-3 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
        <AlertTriangle className="h-8 w-8 text-amber-500 animate-bounce" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-200">Incomplete RAG Indexing</p>
          <p className="text-xs text-slate-500 max-w-xs">No vector index segments were found for this document. Conversational QA retrieval is disabled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Index Stats Banner */}
      <div className="flex items-center justify-between bg-slate-900/40 px-3 py-2 rounded-lg border border-slate-800/80 select-none">
        <span className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-1.5">
          <Database className="h-4 w-4 text-primary" />
          RAG INDEX SEGMENTS ({chunks.length})
        </span>
        <Badge className="bg-primary/20 text-primary border-primary/20 text-[10px]">
          Vector DB Sync: ACTIVE
        </Badge>
      </div>

      {/* Chunks List */}
      <div className="space-y-3">
        {chunks.map((chunk, idx) => {
          const index = chunk.chunk_index !== undefined ? chunk.chunk_index : idx;
          const text = chunk.chunk_text || chunk.content || '';
          const page = chunk.page_number || 1;
          const length = text.length;
          
          // Check if embedding exists (it might be a string, array, or object in Postgres pgvector)
          const isEmbedded = chunk.embedding !== null && chunk.embedding !== undefined;
          
          // Parse metadata if available
          let metaStr = '';
          if (chunk.metadata) {
            try {
              metaStr = typeof chunk.metadata === 'string' 
                ? chunk.metadata 
                : JSON.stringify(chunk.metadata, null, 1);
            } catch {
              metaStr = '';
            }
          }

          return (
            <Card key={chunk.id || idx} className="bg-slate-950/40 border-slate-850 hover:border-slate-800 transition-colors">
              <CardContent className="p-3.5 space-y-3 font-sans">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 select-none">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-slate-900 border-slate-800 text-slate-400 font-mono text-[9px] px-2 py-0.5">
                      Index #{index}
                    </Badge>
                    <Badge variant="outline" className="bg-slate-900 border-slate-800 text-slate-400 font-mono text-[9px] px-2 py-0.5">
                      Page {page}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <Badge 
                      variant="outline" 
                      className={`text-[9px] font-mono font-semibold px-2 py-0.5 ${
                        isEmbedded 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {isEmbedded ? 'Embedded [1536d]' : 'Pending Vector'}
                    </Badge>
                  </div>
                </div>

                {/* Chunk Text */}
                <div className="p-3 bg-slate-950 rounded border border-slate-900 text-[11px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap break-words max-h-40 overflow-y-auto scrollbar-thin">
                  {text}
                </div>

                {/* Metadata Summary */}
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>Size: {length} chars</span>
                  {metaStr && metaStr !== '{}' && (
                    <div className="flex items-center gap-1 group relative cursor-help">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-slate-600 hover:text-slate-400" />
                      <span className="text-[9px] uppercase tracking-wider text-slate-600 hover:text-slate-400">Meta</span>
                      <pre className="absolute bottom-5 right-0 hidden group-hover:block bg-slate-900 border border-slate-800 text-[9px] text-slate-300 p-2 rounded shadow-xl max-w-xs whitespace-pre z-20">
                        {metaStr}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
