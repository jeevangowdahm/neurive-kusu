'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Network, Sparkles, Loader2, Info } from 'lucide-react';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// Subcomponents
import { ForceGraph } from '@/components/knowledge-graph/ForceGraph';
import { GraphControls } from '@/components/knowledge-graph/GraphControls';
import { GraphSidebar } from '@/components/knowledge-graph/GraphSidebar';
import { GraphStats } from '@/components/knowledge-graph/GraphStats';
import { RelationshipEvidencePanel } from '@/components/knowledge-graph/RelationshipEvidencePanel';

export default function KnowledgeGraphPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalEntities: 0,
    totalRelationships: 0,
    topConnectedPerson: 'None',
    topConnectedPlace: 'None',
    topDistrict: 'Karnataka',
    strongestRelationship: 'None',
    documentsRepresented: 0
  });

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userRole, setUserRole] = useState('guest');
  const [isDemoData, setIsDemoData] = useState(false);

  // Selection states
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<any | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [nodeType, setNodeType] = useState('all');
  const [minStrength, setMinStrength] = useState(0.0);
  const [district, setDistrict] = useState('all');
  const [category, setCategory] = useState('all');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');

  // Fetch user role on initialize
  useEffect(() => {
    async function fetchRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (profile) setUserRole(profile.role);
      }
    }
    fetchRole();
  }, []);

  // Fetch Graph Data
  const loadGraph = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) queryParams.set('entity', searchQuery.trim());
      if (nodeType !== 'all') queryParams.set('entity_type', nodeType);
      if (district !== 'all') queryParams.set('district', district);
      if (category !== 'all') queryParams.set('category', category);
      if (yearFrom) queryParams.set('year_from', yearFrom);
      if (yearTo) queryParams.set('year_to', yearTo);
      if (minStrength > 0) queryParams.set('min_strength', minStrength.toString());

      const res = await fetch(`/api/knowledge-graph?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to load knowledge graph');
      
      const data = await res.json();
      if (data.success) {
        setIsDemoData(!!data.isDemo);
        
        // Filter edges based on strength threshold client-side
        const thresholdEdges = (data.edges || []).filter((e: any) => e.strength >= minStrength);
        
        // Build list of valid node IDs from edges and nodes
        const activeNodeIds = new Set<string>();
        thresholdEdges.forEach((e: any) => {
          activeNodeIds.add(e.source);
          activeNodeIds.add(e.target);
        });

        // Retain nodes if they are in nodes query or connected
        const filteredNodes = (data.nodes || []).filter((n: any) => {
          // If filtering type, strictly honor it
          if (nodeType !== 'all' && n.type !== nodeType) return false;
          return true;
        });

        setNodes(filteredNodes);
        setEdges(thresholdEdges);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection failure loading graph');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, nodeType, minStrength, district, category, yearFrom, yearTo]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadGraph();
    }, 300); // 300ms debounce
    return () => clearTimeout(debounceTimer);
  }, [loadGraph]);

  // Handler to trigger POST regeneration (Safeguard 8)
  const handleRegenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/knowledge-graph', { method: 'POST' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to regenerate relationships');
      }
      const data = await res.json();
      if (data.success) {
        toast.success(`Ingested relationships successfully! Created ${data.count} associations.`);
        loadGraph();
      }
    } catch (err: any) {
      toast.error(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-slate-950 text-slate-100 min-h-[calc(100vh-4rem)] p-4 sm:p-6 space-y-6 font-sans">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground font-serif">Knowledge Graph Explorer</h1>
            </div>
            <p className="text-xs text-slate-400">
              Visually audit connections between people, places, events, and document records in Karnataka registry files.
            </p>
          </div>
        </div>

        {/* Graph Statistics widgets */}
        <GraphStats stats={stats} />

        {/* Filter Toolbar controls */}
        <GraphControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          nodeType={nodeType}
          setNodeType={setNodeType}
          minStrength={minStrength}
          setMinStrength={setMinStrength}
          district={district}
          setDistrict={setDistrict}
          category={category}
          setCategory={setCategory}
          yearFrom={yearFrom}
          setYearFrom={setYearFrom}
          yearTo={yearTo}
          setYearTo={setYearTo}
          onGenerate={handleRegenerate}
          userRole={userRole}
          isGenerating={generating}
        />

        {/* Cockpit: Force Graph & Sidebars */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch min-h-[500px]">
          
          {/* Left panel: Interactive Force-directed simulation canvas */}
          <div className="flex-1 relative min-h-[400px]">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 rounded-xl border border-slate-900 z-10 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs text-slate-400 font-mono">Simulating force fields...</p>
              </div>
            ) : nodes.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 rounded-xl border border-slate-900 z-10 p-6 text-center gap-3">
                <Info className="h-8 w-8 text-slate-655" />
                <p className="text-sm font-semibold text-slate-200">No Graph Data Matches</p>
                <p className="text-xs text-slate-500 max-w-sm">No connected entities match your active filters. Try resetting district or year criteria.</p>
              </div>
            ) : null}

            <ForceGraph
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onSelectEdge={setSelectedEdge}
            />
          </div>

          {/* Right panel: Node sidebar detail and Edge evidence panel */}
          <div className="w-full lg:w-[320px] flex flex-col gap-4 justify-start shrink-0">
            {selectedNodeId ? (
              <GraphSidebar
                nodeId={selectedNodeId}
                nodes={nodes}
                edges={edges}
                onClose={() => setSelectedNodeId(null)}
              />
            ) : (
              <RelationshipEvidencePanel
                edge={selectedEdge}
                nodes={nodes}
              />
            )}
          </div>

        </div>

      </div>
    </AppLayout>
  );
}
