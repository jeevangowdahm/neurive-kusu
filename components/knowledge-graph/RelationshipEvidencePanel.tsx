'use client';

import React from 'react';
import { Sparkles, Network, Percent, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
  strength: number;
  snippet?: string;
  page?: number;
}

interface Node {
  id: string;
  label: string;
  type: string;
}

interface RelationshipEvidencePanelProps {
  edge: Edge | null;
  nodes: Node[];
}

export function RelationshipEvidencePanel({ edge, nodes }: RelationshipEvidencePanelProps) {
  if (!edge) {
    return (
      <Card className="bg-slate-900/10 border-slate-900/60 p-4 border-dashed select-none font-sans text-center">
        <CardContent className="p-4 text-slate-500 text-xs">
          <Network className="h-6 w-6 text-slate-700 mx-auto mb-2 animate-pulse" />
          Click any connection line in the graph to inspect relationship evidence snippets.
        </CardContent>
      </Card>
    );
  }

  const srcNode = nodes.find(n => n.id === edge.source);
  const tgtNode = nodes.find(n => n.id === edge.target);

  const srcName = srcNode?.label || 'Unknown Node';
  const tgtName = tgtNode?.label || 'Unknown Node';

  const typeConfig: Record<string, string> = {
    mentioned_in: 'Co-Mentioned',
    related_to: 'Correlated',
    located_in: 'Geolocated',
    occurred_on: 'Dated',
    part_of: 'Hierarchical',
    same_category: 'Same Category',
    same_district: 'Same District',
    same_period: 'Same Era',
    extracted_from: 'Indexed In',
    co_occurs_with: 'Co-Occurs',
    shared_entity: 'Shared Entity'
  };

  return (
    <Card className="bg-slate-900/35 border-slate-800 backdrop-blur-md shadow-xl select-none font-sans">
      <CardContent className="p-4.5 space-y-3">
        <div className="flex items-center gap-1 text-xs text-primary font-bold font-mono uppercase tracking-wider">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span>RELATIONSHIP EVIDENCE</span>
        </div>

        {/* Association Map */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 flex items-center justify-between gap-4 font-mono text-xs">
          <div className="min-w-0 flex-1 text-slate-300 font-bold truncate text-center bg-slate-900/40 p-2 rounded">
            {srcName}
          </div>
          <div className="text-[10px] text-slate-500 font-bold shrink-0 animate-pulse">
            ➔
          </div>
          <div className="min-w-0 flex-1 text-slate-300 font-bold truncate text-center bg-slate-900/40 p-2 rounded">
            {tgtName}
          </div>
        </div>

        {/* Description Table */}
        <div className="space-y-2 text-xs text-slate-400">
          <div className="flex justify-between items-center border-b border-slate-850 py-1">
            <span>Link Class</span>
            <Badge variant="outline" className="bg-slate-900 border-slate-850 text-slate-300 text-[10px]">
              {typeConfig[edge.type] || edge.type}
            </Badge>
          </div>

          <div className="flex justify-between items-center border-b border-slate-850 py-1">
            <span>Association Strength</span>
            <span className="font-mono text-slate-200 font-bold flex items-center gap-1">
              <Percent className="h-3.5 w-3.5 text-primary" />
              {Math.round(edge.strength * 100)}%
            </span>
          </div>

          {edge.page && (
            <div className="flex justify-between items-center border-b border-slate-850 py-1">
              <span>Page Mention</span>
              <span className="font-mono text-slate-300">Page {edge.page}</span>
            </div>
          )}
        </div>

        {/* Evidence text snippet */}
        {edge.snippet && (
          <div className="space-y-1 bg-slate-950/70 p-3 rounded-lg border border-slate-900 text-xs">
            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Context Snippet</span>
            <p className="text-slate-300 italic leading-relaxed">&ldquo;{edge.snippet}&rdquo;</p>
          </div>
        )}

        <div className="text-[9px] text-slate-600 flex items-center gap-1 font-mono pt-1 select-none">
          <ShieldCheck className="h-3 w-3 text-slate-600" />
          <span>Ingested & Grounded · Neurive Archival Engine</span>
        </div>
      </CardContent>
    </Card>
  );
}
