'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types
export interface GraphNode {
  id: string;
  label: string;
  type: string;
  district?: string;
  metadata?: Record<string, any>;
  isDemo?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  strength: number;
  snippet?: string;
  page?: number;
  isDemo?: boolean;
}

export interface GraphStats {
  totalEntities: number;
  totalRelationships: number;
  topConnectedPerson: string;
  topConnectedPlace: string;
  topDistrict: string;
  strongestRelationship: string;
  documentsRepresented: number;
}

export interface GraphFilters {
  search?: string;
  nodeType?: string;
  minStrength?: number;
  district?: string;
  category?: string;
  yearFrom?: number;
  yearTo?: number;
}

export function useKnowledgeGraph(filters: GraphFilters = {}) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [stats, setStats] = useState<GraphStats>({
    totalEntities: 0,
    totalRelationships: 0,
    topConnectedPerson: 'None',
    topConnectedPlace: 'None',
    topDistrict: 'Karnataka',
    strongestRelationship: 'None',
    documentsRepresented: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtime, setIsRealtime] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('entity', filters.search);
      if (filters.nodeType && filters.nodeType !== 'all') params.set('entity_type', filters.nodeType);
      if (filters.district && filters.district !== 'all') params.set('district', filters.district);
      if (filters.category && filters.category !== 'all') params.set('category', filters.category);
      if (filters.yearFrom) params.set('year_from', String(filters.yearFrom));
      if (filters.yearTo) params.set('year_to', String(filters.yearTo));
      if (filters.minStrength) params.set('min_strength', String(filters.minStrength));

      const res = await fetch(`/api/knowledge-graph?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        if (data.stats) setStats(data.stats);
      } else {
        throw new Error(data.error || 'Failed to load graph');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.nodeType, filters.minStrength, filters.district, filters.category, filters.yearFrom, filters.yearTo]);

  const subscribeToRealtime = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    const channel = supabase
      .channel('knowledge-graph-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entities' },
        () => {
          fetchGraph();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entity_relationships' },
        () => {
          fetchGraph();
        }
      )
      .subscribe((status) => {
        setIsRealtime(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;
  }, [fetchGraph]);

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
      setIsRealtime(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(fetchGraph, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchGraph]);

  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    nodes,
    edges,
    stats,
    loading,
    error,
    isRealtime,
    refetch: fetchGraph,
    subscribe: subscribeToRealtime,
    unsubscribe
  };
}

// Hook for fetching entities with pagination
export function useEntities(options: {
  documentId?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  const [entities, setEntities] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntities = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('entities')
        .select('*', { count: 'exact' });

      if (options.documentId) {
        query = query.eq('document_id', options.documentId);
      }
      if (options.type && options.type !== 'all') {
        query = query.eq('entity_type', options.type);
      }
      if (options.search) {
        query = query.ilike('name', `%${options.search}%`);
      }

      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;

      query = query.range(offset, offset + limit - 1).order('confidence_score', { ascending: false });

      const { data, error: err, count } = await query;

      if (err) throw err;
      setEntities(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [options.documentId, options.type, options.search, options.page, options.limit]);

  useEffect(() => {
    const debounceTimer = setTimeout(fetchEntities, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchEntities]);

  return { entities, totalCount, loading, error, refetch: fetchEntities };
}

// Hook for fetching documents with pagination
export function useDocuments(options: {
  district?: string;
  category?: string;
  search?: string;
  yearFrom?: number;
  yearTo?: number;
  page?: number;
  limit?: number;
} = {}) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('documents')
        .select('*', { count: 'exact' });

      if (options.district && options.district !== 'all') {
        query = query.eq('district', options.district);
      }
      if (options.category && options.category !== 'all') {
        query = query.eq('category', options.category);
      }
      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }
      if (options.yearFrom) {
        query = query.gte('year', options.yearFrom);
      }
      if (options.yearTo) {
        query = query.lte('year', options.yearTo);
      }

      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;

      query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

      const { data, error: err, count } = await query;

      if (err) throw err;
      setDocuments(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [options.district, options.category, options.search, options.yearFrom, options.yearTo, options.page, options.limit]);

  useEffect(() => {
    const debounceTimer = setTimeout(fetchDocuments, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchDocuments]);

  return { documents, totalCount, loading, error, refetch: fetchDocuments };
}

// Hook for fetching archives with pagination
export function useArchives(options: {
  districtId?: string;
  categoryId?: string;
  search?: string;
  year?: number;
  featured?: boolean;
  page?: number;
  limit?: number;
} = {}) {
  const [archives, setArchives] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArchives = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('archives')
        .select('*, categories(name, slug), districts(name)', { count: 'exact' });

      if (options.districtId) {
        query = query.eq('district_id', options.districtId);
      }
      if (options.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }
      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }
      if (options.year) {
        query = query.eq('year', options.year);
      }
      if (options.featured) {
        query = query.eq('is_featured', true);
      }

      query = query.eq('status', 'active').eq('access_level', 'public');

      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;

      query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

      const { data, error: err, count } = await query;

      if (err) throw err;
      setArchives(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [options.districtId, options.categoryId, options.search, options.year, options.featured, options.page, options.limit]);

  useEffect(() => {
    const debounceTimer = setTimeout(fetchArchives, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchArchives]);

  return { archives, totalCount, loading, error, refetch: fetchArchives };
}

// Hook for CRUD operations on entities
export function useEntityMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEntity = useCallback(async (entity: {
    name: string;
    entity_type: string;
    description?: string;
    document_id?: string;
    page_number?: number;
    confidence_score?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('entities')
        .insert(entity)
        .select()
        .single();

      if (err) throw err;
      return { success: true, data };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEntity = useCallback(async (id: string, updates: Partial<{
    name: string;
    entity_type: string;
    description: string;
    confidence_score: number;
  }>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('entities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;
      return { success: true, data };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEntity = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('entities')
        .delete()
        .eq('id', id);

      if (err) throw err;
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createRelationship = useCallback(async (relationship: {
    entity_id_from: string;
    entity_id_to: string;
    relationship_type: string;
    relationship_weight?: number;
    confidence_score?: number;
    metadata?: Record<string, any>;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('entity_relationships')
        .insert(relationship)
        .select()
        .single();

      if (err) throw err;
      return { success: true, data };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRelationship = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('entity_relationships')
        .delete()
        .eq('id', id);

      if (err) throw err;
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createEntity,
    updateEntity,
    deleteEntity,
    createRelationship,
    deleteRelationship
  };
}
