'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Database, Flame, Share2, Network, Link2 } from 'lucide-react';
import { AdminMetricCard } from './AdminMetricCard';
import { AnalyticsChart } from './AnalyticsChart';

interface GraphAnalyticsPanelProps {
  data: any;
}

export function GraphAnalyticsPanel({ data }: GraphAnalyticsPanelProps) {
  if (!data) return null;

  const {
    total_entities = 0,
    total_relationships = 0,
    graph_density_indicator = 0.0,
    documents_represented = 0,
    relationship_type_distribution = [],
    strongest_relationships = [],
    top_connected_entities = []
  } = data;

  const averageDegree = total_entities > 0
    ? (total_relationships / total_entities).toFixed(2)
    : '0.00';

  const chartColors = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      
      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 select-none">
        <AdminMetricCard 
          title="Total Graph Entities" 
          value={total_entities.toLocaleString()}
          subtext="Extracted noun phrases & locations"
          icon={Network}
          iconColor="text-pink-500"
        />
        <AdminMetricCard 
          title="Total Relationships" 
          value={total_relationships.toLocaleString()}
          subtext="Semantic subject-verb-object links"
          icon={Link2}
          iconColor="text-blue-500"
        />
        <AdminMetricCard 
          title="Knowledge Graph Density" 
          value={`${(graph_density_indicator * 100).toFixed(4)}%`}
          subtext="Sparse relational network"
          icon={Share2}
          iconColor="text-emerald-500"
        />
        <AdminMetricCard 
          title="Represented Documents" 
          value={`${documents_represented} docs`}
          subtext="Connected in the graph index"
          icon={Database}
          iconColor="text-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Relationship types distribution */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border bg-slate-900/20 border-slate-900 p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                Edge Relationship Types Distribution
              </CardTitle>
              <CardDescription className="text-[10px] text-slate-500 font-mono">
                Classification of extracted semantic links
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <AnalyticsChart 
                type="bar" 
                data={relationship_type_distribution} 
                xKey="type" 
                yKey="count" 
                colors={chartColors}
                height={220}
              />
            </CardContent>
          </Card>

          {/* Strongest relationships list */}
          <Card className="border bg-slate-900/20 border-slate-900 p-4">
            <CardHeader className="p-0 pb-3 border-b border-slate-900">
              <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                Strongest Semantic Relationships In the Platform
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-3 space-y-2 select-none">
              {strongest_relationships && strongest_relationships.length > 0 ? (
                strongest_relationships.slice(0, 5).map((rel: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-slate-900/50 last:border-0">
                    <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                      <strong className="text-slate-200 truncate">{rel.source}</strong>
                      <span className="text-slate-500 font-mono text-[9px] shrink-0">({rel.type})</span>
                      <ChevronRight className="h-3 w-3 text-slate-500 shrink-0" />
                      <strong className="text-slate-200 truncate">{rel.target}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-slate-950 rounded border border-slate-900 overflow-hidden shrink-0">
                        <div className="h-full bg-pink-500 rounded" style={{ width: `${rel.strength * 100}%` }} />
                      </div>
                      <span className="font-mono text-pink-400 text-[10px] font-bold shrink-0">{Math.round(rel.strength * 100)}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-600 text-xs font-mono">
                  No relationships recorded
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right side panels */}
        <div className="space-y-6">
          
          {/* Degree statistics */}
          <Card className="border bg-slate-900/20 border-slate-900 p-4">
            <CardHeader className="p-0 pb-2">
              <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                Node Connection metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3 pt-2 select-none">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Average Connections Per Node</span>
                <span className="text-xl font-bold text-slate-200 block mt-1">{averageDegree} edges</span>
                <span className="text-[9px] text-slate-500">Degree of connection per active entity</span>
              </div>
            </CardContent>
          </Card>

          {/* Top connected entities */}
          <Card className="border bg-slate-900/20 border-slate-900 p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                Top Connected Entities (Hubs)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-2 pt-2 select-none">
              {top_connected_entities && top_connected_entities.length > 0 ? (
                top_connected_entities.slice(0, 7).map((ent: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-slate-900 last:border-0">
                    <span className="text-slate-300 flex items-center gap-1.5 truncate pr-2">
                      <Flame className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                      <span className="truncate">{ent.name}</span>
                    </span>
                    <Badge variant="outline" className="border-slate-800 text-slate-400 font-mono text-[10px] shrink-0">
                      {ent.count} edges
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-600 text-xs font-mono">
                  No entities indexed
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
