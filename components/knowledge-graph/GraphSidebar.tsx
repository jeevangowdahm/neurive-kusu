'use client';

import React from 'react';
import { X, User, MapPin, Calendar, Building2, BookOpen, Search, MessageSquare, ExternalLink, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Node {
  id: string;
  label: string;
  type: string;
  district?: string;
  metadata?: any;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
  strength: number;
  snippet?: string;
}

interface GraphSidebarProps {
  nodeId: string | null;
  nodes: Node[];
  edges: Edge[];
  onClose: () => void;
}

export function GraphSidebar({ nodeId, nodes, edges, onClose }: GraphSidebarProps) {
  if (!nodeId) return null;

  const node = nodes.find(n => n.id === nodeId);
  if (!node) return null;

  // 1. Gather neighbors
  const relatedElements = edges.filter(e => e.source === nodeId || e.target === nodeId);
  
  const relatedDocuments: { id: string; label: string; reason: string; snippet?: string; strength: number }[] = [];
  const relatedEntities: { id: string; label: string; type: string }[] = [];
  const topSnippets: string[] = [];

  relatedElements.forEach(edge => {
    const neighborId = edge.source === nodeId ? edge.target : edge.source;
    const neighbor = nodes.find(n => n.id === neighborId);
    
    if (neighbor) {
      if (neighbor.type === 'Document') {
        relatedDocuments.push({
          id: neighbor.id,
          label: neighbor.label,
          reason: edge.type.replace(/_/g, ' '),
          snippet: edge.snippet,
          strength: edge.strength
        });
      } else {
        relatedEntities.push({
          id: neighbor.id,
          label: neighbor.label,
          type: neighbor.type
        });
      }
    }

    if (edge.snippet) {
      topSnippets.push(edge.snippet);
    }
  });

  const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
    person: { icon: User, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', label: 'Person' },
    place: { icon: MapPin, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20', label: 'Place' },
    event: { icon: Calendar, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Event' },
    organization: { icon: Building2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Organization' },
    date: { icon: Calendar, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Date' },
    artifact: { icon: BookOpen, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', label: 'Artifact' },
    Document: { icon: BookOpen, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', label: 'Document' }
  };

  const config = typeConfig[node.type] || typeConfig.person;
  const Icon = config.icon;

  const description = node.metadata?.description || 'Archival node index.';
  const nameKannada = node.metadata?.nameKannada;
  const nameHindi = node.metadata?.nameHindi;

  return (
    <div className="bg-slate-900/35 border border-slate-800 rounded-xl p-4 sm:p-5 backdrop-blur-md shadow-2xl flex flex-col max-h-full overflow-y-auto select-none font-sans space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800/80 pb-3 gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`p-1 rounded border ${config.color.split(' ')[1]} ${config.color.split(' ')[2]}`}>
              <Icon className={`h-3.5 w-3.5 ${config.color.split(' ')[0]}`} />
            </div>
            <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
              {config.label} NODE
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-100 font-serif leading-snug truncate max-w-[200px]">
            {node.label}
          </h3>
          {nameKannada && (
            <p className="text-xs text-slate-400 kannada-text mt-0.5">{nameKannada}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 text-slate-400 hover:text-slate-100"
        >
          <X className="h-4.5 w-4.5" />
        </Button>
      </div>

      {/* Description */}
      <div className="text-xs text-slate-400 leading-relaxed bg-slate-950/45 p-3 rounded-lg border border-slate-900">
        {description}
      </div>

      {/* Metadata Detail (District/Category if document) */}
      {node.type === 'Document' && (
        <div className="bg-slate-900/20 p-2.5 rounded-lg border border-slate-900 text-[11px] text-slate-500 font-mono space-y-1">
          <div className="flex justify-between">
            <span>Historical Year</span>
            <span className="text-slate-300 font-semibold">{node.metadata?.year || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>District Boundary</span>
            <span className="text-slate-300 font-semibold">{node.district || 'Karnataka'}</span>
          </div>
          <div className="flex justify-between">
            <span>Category Ingestion</span>
            <span className="text-slate-300 font-semibold capitalize">{node.metadata?.category || 'Archive'}</span>
          </div>
        </div>
      )}

      {/* Connected Neighbor Entities */}
      {relatedEntities.length > 0 && (
        <div className="space-y-2">
          <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Connected Entities ({relatedEntities.length})</span>
          <div className="flex flex-wrap gap-1">
            {relatedEntities.slice(0, 8).map(re => (
              <Badge key={re.id} variant="secondary" className="text-[9px] bg-slate-800/60 text-slate-300 border border-slate-850 hover:bg-slate-800">
                {re.label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Connected Neighbor Documents */}
      {relatedDocuments.length > 0 && (
        <div className="space-y-2">
          <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Referenced Documents ({relatedDocuments.length})</span>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {relatedDocuments.slice(0, 5).map(rd => (
              <div key={rd.id} className="p-2.5 bg-slate-950/30 border border-slate-900 rounded-lg flex flex-col space-y-1.5 text-[10px] text-slate-400">
                <div className="flex justify-between items-center gap-2">
                  <span className="truncate font-semibold text-slate-300">{rd.label}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="outline" className="text-[8px] font-mono scale-90 text-slate-500 border-slate-850">
                      {rd.reason}
                    </Badge>
                    {rd.strength > 0 && (
                      <span className="text-[8px] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-1 rounded">
                        {Math.round(rd.strength * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                {rd.snippet && (
                  <p className="text-[9px] italic text-slate-450 bg-slate-950/40 p-1 rounded border border-slate-900/50">
                    &ldquo;{rd.snippet}&rdquo;
                  </p>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-6 text-[9px] font-medium border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850 gap-1 mt-1 justify-center py-0.5"
                  asChild
                >
                  <Link href={`/documents/${rd.id}`}>
                    <ExternalLink className="h-2.5 w-2.5" />
                    Open related document
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Snippets */}
      {topSnippets.length > 0 && (
        <div className="space-y-2">
          <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Grounded Evidence</span>
          <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-lg text-[10.5px] italic text-slate-300 leading-relaxed font-sans max-h-32 overflow-y-auto">
            &ldquo;{topSnippets[0]}&rdquo;
          </div>
        </div>
      )}

      {/* Action Buttons (Safeguard 12 & 13) */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2">
        {/* Ask AI about this node */}
        <Button
          size="sm"
          className="w-full h-8 text-[11px] font-semibold gap-1.5"
          asChild
        >
          <Link href={node.type === 'Document' ? `/chat?document_id=${node.id}` : `/chat?entity=${encodeURIComponent(node.label)}`}>
            <MessageSquare className="h-3.5 w-3.5" />
            Ask AI about this {node.type === 'Document' ? 'document' : 'entity'}
          </Link>
        </Button>

        {/* Search this entity */}
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-[11px] font-semibold border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-850 gap-1.5"
          asChild
        >
          <Link href={`/search?query=${encodeURIComponent(node.label)}`}>
            <Search className="h-3.5 w-3.5" />
            Search registry records
          </Link>
        </Button>

        {/* Open Document (visible only for document type nodes, Safeguard 13) */}
        {node.type === 'Document' && (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-[11px] font-semibold border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-850 gap-1.5"
            asChild
          >
            <Link href={`/documents/${node.id}`}>
              <ExternalLink className="h-3.5 w-3.5" />
              Open In Document Viewer
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
