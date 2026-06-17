'use client';

import { supabase } from '@/lib/supabase';

/**
 * Knowledge Graph Engine
 * Builds and manages entity relationships from historical archives
 */

export interface Entity {
  id: string;
  name: string;
  nameKannada?: string;
  nameHindi?: string;
  type: 'person' | 'place' | 'event' | 'organization' | 'date' | 'artifact';
  description: string;
  birthDate?: string;
  deathDate?: string;
  mentions: number;
  embedding?: number[];
  metadata: Record<string, any>;
}

export interface Relationship {
  id: string;
  fromEntity: Entity;
  toEntity: Entity;
  type: string;
  weight: number;
  confidence: number;
  metadata: Record<string, any>;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  size: number;
  color: string;
  metadata: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  weight: number;
  confidence: number;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    entityCount: number;
    relationshipCount: number;
    generatedAt: number;
    timeRange: { start: string; end: string } | null;
  };
}

/**
 * Extract named entities from text (mock implementation)
 */
export function extractEntities(text: string): Partial<Entity>[] {
  const entities: Partial<Entity>[] = [];

  // Simple pattern matching (in production, use NLP library)
  const patterns = {
    person: /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g,
    place: /\b(Karnataka|Mysuru|Bengaluru|Delhi|India|[A-Z][a-z]+\s+District)\b/g,
    event: /\b(Revolution|Independence|Movement|War|Conference|Act)\b/g,
    date: /\b(1[789]\d{2}|20\d{2})\b/g,
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      entities.push({
        name: match[0],
        type: type as any,
        description: `Found in archived document`,
        metadata: {
          context: text.substring(Math.max(0, match.index! - 50), match.index! + match[0].length + 50),
        },
      });
    }
  }

  return entities;
}

/**
 * Extract relationships from text
 */
export function extractRelationships(text: string, entities: Entity[]): Partial<Relationship>[] {
  const relationships: Partial<Relationship>[] = [];

  // Simple co-occurrence patterns
  const relationshipPatterns = [
    { pattern: /(\w+)\s+(?:was|is)\s+(?:the|a)\s+(\w+)\s+of\s+(\w+)/, type: 'hasRole' },
    { pattern: /(\w+)\s+(?:met|married|worked with)\s+(\w+)/, type: 'interactedWith' },
    { pattern: /(\w+)\s+(?:wrote|authored)\s+(.+)/, type: 'created' },
    { pattern: /(\w+)\s+(?:ruled|governed)\s+(\w+)/, type: 'ruledOver' },
  ];

  for (const { pattern, type } of relationshipPatterns) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      if (entities.length >= 2) {
        relationships.push({
          fromEntity: entities[0],
          toEntity: entities[1],
          type,
          weight: 1,
          confidence: 0.7,
          metadata: {
            extractedFrom: match[0],
          },
        });
      }
    }
  }

  return relationships;
}

/**
 * Build knowledge graph from archive data
 */
export async function buildKnowledgeGraph(
  filters?: {
    district?: string;
    year?: number;
    category?: string;
  }
): Promise<KnowledgeGraphData> {
  try {
    // Fetch entities
    const { data: entities, error: entitiesError } = await supabase
      .from('entities')
      .select('*')
      .limit(100);

    if (entitiesError) throw entitiesError;

    // Fetch relationships
    const { data: relationships, error: relError } = await supabase
      .from('entity_relationships')
      .select(
        `
        id,
        relationship_type,
        relationship_weight,
        confidence_score,
        entity_id_from,
        entity_id_to,
        entities!entity_id_from (id, name, entity_type, description),
        entities!entity_id_to (id, name, entity_type, description)
      `
      )
      .limit(500);

    if (relError) throw relError;

    // Transform to graph format
    const nodes: GraphNode[] = (entities || []).map((entity: any) => ({
      id: entity.id,
      label: entity.name,
      type: entity.entity_type,
      size: Math.log(entity.created_at ? 1 : 1) * 10 + 15,
      color: getEntityTypeColor(entity.entity_type),
      metadata: {
        description: entity.description,
        nameKannada: entity.name_kannada,
        nameHindi: entity.name_hindi,
      },
    }));

    const edges: GraphEdge[] = (relationships || []).map((rel: any) => ({
      source: rel.entity_id_from,
      target: rel.entity_id_to,
      label: rel.relationship_type,
      weight: rel.relationship_weight || 1,
      confidence: rel.confidence_score || 0.8,
    }));

    return {
      nodes,
      edges,
      metadata: {
        entityCount: nodes.length,
        relationshipCount: edges.length,
        generatedAt: Date.now(),
        timeRange: null,
      },
    };
  } catch (error) {
    console.error('Knowledge graph build error:', error);
    return {
      nodes: [],
      edges: [],
      metadata: {
        entityCount: 0,
        relationshipCount: 0,
        generatedAt: Date.now(),
        timeRange: null,
      },
    };
  }
}

/**
 * Find related entities using graph traversal
 */
export async function findRelatedEntities(
  entityId: string,
  depth: number = 2
): Promise<Entity[]> {
  try {
    const visited = new Set<string>();
    const related: Entity[] = [];

    const traverse = async (id: string, currentDepth: number): Promise<void> => {
      if (currentDepth === 0 || visited.has(id)) return;
      visited.add(id);

      // Get direct relationships
      const { data, error } = await supabase
        .from('entity_relationships')
        .select('entity_id_to, entities!entity_id_to (*)')
        .eq('entity_id_from', id);

      if (error) throw error;

      for (const rel of data || []) {
        if (!visited.has(rel.entity_id_to)) {
          related.push(rel.entities as unknown as Entity);
          if (currentDepth > 1) {
            await traverse(rel.entity_id_to, currentDepth - 1);
          }
        }
      }
    };

    await traverse(entityId, depth);
    return related;
  } catch (error) {
    console.error('Related entities error:', error);
    return [];
  }
}

/**
 * Search for entities by name and type
 */
export async function searchEntities(
  query: string,
  type?: string
): Promise<Entity[]> {
  try {
    let q = supabase.from('entities').select('*');

    if (type) {
      q = q.eq('entity_type', type);
    }

    const { data, error } = await q
      .ilike('name', `%${query}%`)
      .limit(20);

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      nameKannada: row.name_kannada,
      nameHindi: row.name_hindi,
      type: row.entity_type,
      description: row.description,
      birthDate: row.birth_date,
      deathDate: row.death_date,
      mentions: 0, // TODO: count mentions
      metadata: row.entity_metadata || {},
    }));
  } catch (error) {
    console.error('Entity search error:', error);
    return [];
  }
}

/**
 * Add new entity to graph
 */
export async function addEntity(entity: Omit<Entity, 'id'>): Promise<Entity | null> {
  try {
    const { data, error } = await supabase
      .from('entities')
      .insert([
        {
          name: entity.name,
          entity_type: entity.type,
          description: entity.description,
          name_kannada: entity.nameKannada,
          name_hindi: entity.nameHindi,
          birth_date: entity.birthDate,
          death_date: entity.deathDate,
          entity_metadata: entity.metadata,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return data ? transformEntity(data) : null;
  } catch (error) {
    console.error('Add entity error:', error);
    return null;
  }
}

/**
 * Add relationship between entities
 */
export async function addRelationship(
  fromEntityId: string,
  toEntityId: string,
  relationType: string,
  confidence: number = 0.8
): Promise<Relationship | null> {
  try {
    const { data, error } = await supabase
      .from('entity_relationships')
      .insert([
        {
          entity_id_from: fromEntityId,
          entity_id_to: toEntityId,
          relationship_type: relationType,
          confidence_score: confidence,
          relationship_weight: 1,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Fetch full relationship details
    if (data) {
      const { data: fullRel } = await supabase
        .from('entity_relationships')
        .select(
          `
          *,
          entities!entity_id_from (*),
          entities!entity_id_to (*)
        `
        )
        .eq('id', data.id)
        .single();

      if (fullRel) {
        return {
          id: fullRel.id,
          fromEntity: transformEntity(fullRel.entities),
          toEntity: transformEntity(fullRel.entities),
          type: fullRel.relationship_type,
          weight: fullRel.relationship_weight,
          confidence: fullRel.confidence_score,
          metadata: fullRel.metadata || {},
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Add relationship error:', error);
    return null;
  }
}

/**
 * Get color for entity type visualization
 */
function getEntityTypeColor(type: string): string {
  const colors: Record<string, string> = {
    person: '#FF6B6B',
    place: '#4ECDC4',
    event: '#45B7D1',
    organization: '#FFA07A',
    date: '#98D8C8',
    artifact: '#F7DC6F',
  };
  return colors[type] || '#95A5A6';
}

/**
 * Transform database entity to API entity
 */
function transformEntity(data: any): Entity {
  return {
    id: data.id,
    name: data.name,
    nameKannada: data.name_kannada,
    nameHindi: data.name_hindi,
    type: data.entity_type,
    description: data.description,
    birthDate: data.birth_date,
    deathDate: data.death_date,
    mentions: 0,
    embedding: data.embedding,
    metadata: data.entity_metadata || {},
  };
}

/**
 * Generate timeline from entities
 */
export function generateTimeline(entities: Entity[]): Array<{ date: string; events: Entity[] }> {
  const timeline = new Map<string, Entity[]>();

  entities.forEach((entity) => {
    if (entity.birthDate) {
      const year = entity.birthDate.split('-')[0];
      if (!timeline.has(year)) {
        timeline.set(year, []);
      }
      timeline.get(year)!.push(entity);
    }
  });

  const timelineArr: Array<[string, any[]]> = [];
  timeline.forEach((events, date) => timelineArr.push([date, events]));
  return timelineArr
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map((pair) => ({ date: pair[0], events: pair[1] }));
}
