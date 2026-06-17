import { supabase as defaultSupabase } from '@/lib/supabase';
import { getApiKeyForFeature } from '@/lib/ai/keys-config';

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  district: string;
  metadata: Record<string, any>;
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
  source_entity?: string;
  target_entity?: string;
  source_doc?: string;
  target_doc?: string;
  isDemo?: boolean;
}

export interface GraphFilters {
  entity?: string;
  document_id?: string;
  district?: string;
  category?: string;
  entityType?: string;
  yearFrom?: number | null;
  yearTo?: number | null;
  minStrength?: number;
  limit?: number;
}

export class KnowledgeGraphService {
  /**
   * Retrieves and formats nodes, edges, timeline events, and analytics stats for the Knowledge Graph.
   * Restricts nodes/edges representing private or restricted documents if unauthorized.
   */
  static async getGraphData(
    supabaseClient: any = defaultSupabase,
    userRole: 'admin' | 'archivist' | 'researcher' | 'user' | 'guest' = 'guest',
    userId?: string,
    filters?: GraphFilters
  ): Promise<{
    success: boolean;
    isDemo: boolean;
    nodes: GraphNode[];
    edges: GraphEdge[];
    timeline_events: any[];
    stats: any;
  }> {
    try {
      const entityParam = filters?.entity || '';
      const docIdParam = filters?.document_id || '';
      const districtParam = filters?.district || '';
      const categoryParam = filters?.category || '';
      const entityTypeParam = filters?.entityType || '';
      const yearFromParam = filters?.yearFrom ?? null;
      const yearToParam = filters?.yearTo ?? null;
      const minStrengthParam = filters?.minStrength ?? 0.0;
      
      const nodeLimit = Math.min(filters?.limit || 150, 500);
      const edgeLimit = 800;

      // 1. Build Allowed Documents List based on Role/User
      let docQuery = supabaseClient
        .from('documents')
        .select('id, title, visibility, status, uploaded_by, category, district, year, summary, description, created_at');
      
      if (userRole === 'admin') {
        // Admins see all
      } else if (userId) {
        if (['researcher', 'archivist'].includes(userRole)) {
          docQuery = docQuery.or(`visibility.eq.public,visibility.eq.restricted,uploaded_by.eq.${userId}`);
        } else {
          docQuery = docQuery.or(`visibility.eq.public,uploaded_by.eq.${userId}`);
        }
      } else {
        docQuery = docQuery.eq('visibility', 'public').eq('status', 'Completed');
      }

      const { data: allowedDocs, error: allowedDocsErr } = await docQuery;
      if (allowedDocsErr) throw allowedDocsErr;

      const allowedDocIds = (allowedDocs || []).map((d: any) => d.id);

      // If no allowed documents exist, return clean demodata
      if (allowedDocIds.length === 0) {
        return this.generateDemoGraphData(true);
      }

      // 2. Query Allowed Entities
      let entityQuery = supabaseClient.from('entities').select('*').in('document_id', allowedDocIds);

      if (entityParam) {
        entityQuery = entityQuery.ilike('name', `%${entityParam}%`);
      }
      if (entityTypeParam) {
        entityQuery = entityQuery.eq('entity_type', entityTypeParam);
      }
      if (docIdParam) {
        entityQuery = entityQuery.eq('document_id', docIdParam);
      }

      const { data: dbEntities, error: entErr } = await entityQuery;
      if (entErr) throw entErr;

      // Filter entities based on document filters (district, category, year)
      let filteredEntities = dbEntities || [];
      let filteredDocs = allowedDocs || [];

      if (districtParam || categoryParam || yearFromParam !== null || yearToParam !== null) {
        filteredDocs = (allowedDocs || []).filter((d: any) => {
          if (districtParam && d.district !== districtParam) return false;
          if (categoryParam && d.category !== categoryParam) return false;
          if (yearFromParam !== null && d.year && d.year < yearFromParam) return false;
          if (yearToParam !== null && d.year && d.year > yearToParam) return false;
          return true;
        });

        const filteredDocIds = filteredDocs.map((d: any) => d.id);
        filteredEntities = filteredEntities.filter((e: any) => filteredDocIds.includes(e.document_id));
      }

      // Limit entities count
      const slicedEntities = filteredEntities.slice(0, nodeLimit);
      const slicedEntitiesIds = slicedEntities.map((e: any) => e.id);

      // 3. Fetch and Filter Edges
      let relQuery = supabaseClient
        .from('entity_relationships')
        .select('*')
        .limit(edgeLimit);

      if (minStrengthParam > 0) {
        relQuery = relQuery.gte('relationship_strength', minStrengthParam);
      }

      const { data: dbRels, error: relsErr } = await relQuery;
      if (relsErr) throw relsErr;

      const filteredEdges: GraphEdge[] = [];
      const connectedNodeIds = new Set<string>();

      (dbRels || []).forEach((rel: any) => {
        let isAllowed = false;

        // Case 1: Entity-to-Entity relation
        if (rel.source_entity_id && rel.target_entity_id) {
          if (slicedEntitiesIds.includes(rel.source_entity_id) && slicedEntitiesIds.includes(rel.target_entity_id)) {
            isAllowed = true;
          }
        }
        // Case 2: Document-to-Document relation
        else if (rel.source_document_id && rel.target_document_id) {
          if (allowedDocIds.includes(rel.source_document_id) && allowedDocIds.includes(rel.target_document_id)) {
            isAllowed = true;
          }
        }
        // Case 3: Entity-to-Document relation
        else if (rel.source_entity_id && rel.target_document_id) {
          if (slicedEntitiesIds.includes(rel.source_entity_id) && allowedDocIds.includes(rel.target_document_id)) {
            isAllowed = true;
          }
        }

        if (isAllowed) {
          filteredEdges.push({
            id: rel.id,
            source: rel.source_entity_id || rel.source_document_id,
            target: rel.target_entity_id || rel.target_document_id,
            type: rel.relationship_type,
            strength: Number(rel.relationship_strength),
            snippet: rel.evidence_snippet,
            page: rel.page_number,
            source_entity: rel.source_entity_id,
            target_entity: rel.target_entity_id,
            source_doc: rel.source_document_id,
            target_doc: rel.target_document_id
          });
          
          connectedNodeIds.add(rel.source_entity_id || rel.source_document_id);
          connectedNodeIds.add(rel.target_entity_id || rel.target_document_id);
        }
      });

      // 4. Assemble Graph Nodes
      const nodes: GraphNode[] = [];

      // Add Entity Nodes
      slicedEntities.forEach((ent: any) => {
        nodes.push({
          id: ent.id,
          label: ent.name,
          type: ent.entity_type,
          district: ent.entity_metadata?.district || 'Karnataka',
          metadata: {
            description: ent.description || 'Archival Entity',
            nameKannada: ent.name_kannada,
            nameHindi: ent.name_hindi,
            confidence: ent.confidence_score,
            page: ent.page_number,
            document_id: ent.document_id
          }
        });
      });

      // Add Document Nodes (if connected or specifically requested)
      filteredDocs.forEach((d: any) => {
        if (connectedNodeIds.has(d.id) || docIdParam === d.id || filteredDocs.length < 25) {
          nodes.push({
            id: d.id,
            label: d.title,
            type: 'Document',
            district: d.district || 'Karnataka',
            metadata: {
              description: d.summary || d.description || 'Historical Record',
              year: d.year,
              category: d.category,
              visibility: d.visibility,
              status: d.status
            }
          });
        }
      });

      // If no nodes, return demo data
      if (nodes.length === 0) {
        return this.generateDemoGraphData(true);
      }

      // 5. Construct Secure Timeline Events
      const timeline_events: any[] = [];
      
      filteredDocs.forEach((d: any) => {
        if (d.year) {
          timeline_events.push({
            id: `timeline-doc-${d.id}`,
            year: d.year,
            title: d.title,
            type: 'Document',
            district: d.district || 'Karnataka',
            category: d.category || 'Archive',
            snippet: d.summary || d.description || 'Record of governance.',
            document_id: d.id
          });
        }
      });

      filteredEntities.forEach((e: any) => {
        if (e.entity_type === 'date') {
          const yearMatch = e.name.match(/\b(1[56789]\d{2})\b/);
          const eventYear = yearMatch ? parseInt(yearMatch[1]) : null;
          if (eventYear) {
            const matchedDoc = allowedDocs.find((d: any) => d.id === e.document_id);
            timeline_events.push({
              id: `timeline-ent-${e.id}`,
              year: eventYear,
              title: e.name,
              type: 'Historical Event',
              district: matchedDoc?.district || 'Karnataka',
              category: matchedDoc?.category || 'Archive',
              snippet: e.description || `Event index matched in "${matchedDoc?.title}".`,
              document_id: e.document_id
            });
          }
        }
      });

      timeline_events.sort((a, b) => a.year - b.year);

      // 6. Calculate Analytics Stats
      const totalEntities = filteredEntities.length;
      const totalRelationships = filteredEdges.length;
      
      const degreeMap: Record<string, number> = {};
      filteredEdges.forEach((e: any) => {
        degreeMap[e.source] = (degreeMap[e.source] || 0) + 1;
        degreeMap[e.target] = (degreeMap[e.target] || 0) + 1;
      });

      const sortedDegrees = Object.entries(degreeMap).sort((a, b) => b[1] - a[1]);
      
      let topConnectedPerson = 'None';
      let topConnectedPlace = 'None';
      
      for (const [id, count] of sortedDegrees) {
        const node = nodes.find(n => n.id === id);
        if (node) {
          if (node.type === 'person' && topConnectedPerson === 'None') {
            topConnectedPerson = `${node.label} (${count} links)`;
          }
          if (node.type === 'place' && topConnectedPlace === 'None') {
            topConnectedPlace = `${node.label} (${count} links)`;
          }
        }
        if (topConnectedPerson !== 'None' && topConnectedPlace !== 'None') break;
      }

      const districtCounts: Record<string, number> = {};
      nodes.forEach((n: any) => {
        if (n.district) {
          districtCounts[n.district] = (districtCounts[n.district] || 0) + 1;
        }
      });
      const topDistrict = Object.entries(districtCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Karnataka';

      const sortedEdges = [...filteredEdges].sort((a, b) => b.strength - a.strength);
      const strongestEdgeObj = sortedEdges[0];
      let strongestRelLabel = 'None';
      if (strongestEdgeObj) {
        const srcNode = nodes.find(n => n.id === strongestEdgeObj.source);
        const tgtNode = nodes.find(n => n.id === strongestEdgeObj.target);
        if (srcNode && tgtNode) {
          strongestRelLabel = `"${srcNode.label}" ➔ "${tgtNode.label}" (${Math.round(strongestEdgeObj.strength * 100)}%)`;
        }
      }

      const representedDocCount = new Set(nodes.filter(n => n.type === 'Document').map(n => n.id)).size;

      const stats = {
        totalEntities,
        totalRelationships,
        topConnectedPerson,
        topConnectedPlace,
        topDistrict,
        strongestRelationship: strongestRelLabel,
        documentsRepresented: representedDocCount
      };

      return {
        success: true,
        isDemo: false,
        nodes,
        edges: filteredEdges,
        timeline_events,
        stats
      };
    } catch (err) {
      console.error('Failed to get graph data:', err);
      return {
        ...this.generateDemoGraphData(true),
        success: false,
        isDemo: true
      };
    }
  }

  /**
   * Use Gemini to discover semantic relationships between a list of entities and historical context
   */
  static async extractSemanticRelationships(
    entities: any[],
    docTitle: string,
    docSummary: string,
    apiKey: string
  ): Promise<any[]> {
    if (!apiKey) return [];
    try {
      const entityListStr = entities.map(e => `${e.name} (${e.entity_type})`).join(', ');
      const prompt = `You are a historical archivist specializing in Karnataka history. 
Given the document titled "${docTitle}" with summary "${docSummary}", and the following extracted entities:
${entityListStr}

Please identify any direct historical or administrative relationships between these entities.
Return a JSON array of objects with the following format:
[
  {
    "source_entity_name": "Entity Name A",
    "target_entity_name": "Entity Name B",
    "relationship_type": "type (e.g. ruled_over, collaborated_with, located_in, occurred_at)",
    "relationship_strength": 0.85,
    "evidence_snippet": "1-2 sentence evidence explaining the relationship based on history and the document."
  }
]
Only include strong, verifiable relationships. Return empty array [] if none exist.`;

      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        return JSON.parse(responseText.trim());
      }
    } catch (err) {
      console.warn('Gemini relationship extraction failed:', err);
    }
    return [];
  }

  /**
   * Regenerates auto relationships. Deletes auto-generated edges while keeping manually added ones.
   */
  static async regenerateAutoRelationships(supabaseClient: any = defaultSupabase): Promise<{ success: boolean; count: number }> {
    try {
      const apiKey = getApiKeyForFeature('graph');

      // 1. Fetch all documents & entities
      const { data: docsData, error: docsErr } = await supabaseClient
        .from('documents')
        .select('id, title, district, category, year, description, summary');
      
      if (docsErr) throw docsErr;

      const { data: entitiesData, error: entErr } = await supabaseClient
        .from('entities')
        .select('id, name, entity_type, document_id, page_number, confidence_score');

      if (entErr) throw entErr;

      const docs = docsData || [];
      const entities = entitiesData || [];

      // 2. Clear only AUTO-generated relationships
      const { error: deleteErr } = await supabaseClient
        .from('entity_relationships')
        .delete()
        .eq('generation_source', 'auto');

      if (deleteErr) throw deleteErr;

      const relationshipsToInsert: any[] = [];

      // Helper to push relationships safely
      const pushRelationship = (rel: any) => {
        if (rel.source_entity_id && rel.source_document_id) return;
        if (rel.target_entity_id && rel.target_document_id) return;
        if (!rel.source_entity_id && !rel.source_document_id) return;
        if (!rel.target_entity_id && !rel.target_document_id) return;
        
        if (rel.source_entity_id && rel.source_entity_id === rel.target_entity_id) return;
        if (rel.source_document_id && rel.source_document_id === rel.target_document_id) return;

        relationshipsToInsert.push(rel);
      };

      // 3. Connect Entities to source document and co-occurring entities
      const entitiesByDoc = entities.reduce((acc: Record<string, any[]>, ent: any) => {
        if (!ent.document_id) return acc;
        if (!acc[ent.document_id]) acc[ent.document_id] = [];
        acc[ent.document_id].push(ent);
        return acc;
      }, {});

      for (const [docId, docEntitiesVal] of Object.entries(entitiesByDoc)) {
        const docEntities = docEntitiesVal as any[];
        const docObj = docs.find((d: any) => d.id === docId);
        const docTitle = docObj?.title || 'Archive Record';

        for (const ent of docEntities) {
          pushRelationship({
            source_entity_id: ent.id,
            target_document_id: docId,
            relationship_type: 'extracted_from',
            relationship_strength: 0.85,
            evidence_snippet: `Entity "${ent.name}" extracted from "${docTitle}".`,
            page_number: ent.page_number || 1,
            generation_source: 'auto'
          });
        }

        // AI Relationship Extraction enrichment using Key 5 (graph)
        if (apiKey && docEntities.length > 1 && relationshipsToInsert.length < 500) {
          try {
            const aiRels = await this.extractSemanticRelationships(
              docEntities,
              docTitle,
              docObj?.summary || docObj?.description || '',
              apiKey
            );
            for (const aiRel of aiRels) {
              const srcEnt = docEntities.find(e => e.name.toLowerCase() === aiRel.source_entity_name.toLowerCase());
              const tgtEnt = docEntities.find(e => e.name.toLowerCase() === aiRel.target_entity_name.toLowerCase());
              if (srcEnt && tgtEnt) {
                pushRelationship({
                  source_entity_id: srcEnt.id,
                  target_entity_id: tgtEnt.id,
                  relationship_type: aiRel.relationship_type,
                  relationship_strength: aiRel.relationship_strength || 0.8,
                  evidence_snippet: aiRel.evidence_snippet,
                  page_number: srcEnt.page_number || 1,
                  generation_source: 'auto'
                });
              }
            }
          } catch (e) {
            console.warn('AI relationship extraction failed for document:', docId, e);
          }
        }

        for (let i = 0; i < docEntities.length; i++) {
          for (let j = i + 1; j < docEntities.length; j++) {
            const entA = docEntities[i];
            const entB = docEntities[j];

            const samePage = entA.page_number && entB.page_number && entA.page_number === entB.page_number;
            const strength = samePage ? 0.90 : 0.75;
            const type = samePage ? 'mentioned_in' : 'related_to';
            const pageLabel = samePage ? `page ${entA.page_number}` : 'same document';

            pushRelationship({
              source_entity_id: entA.id,
              target_entity_id: entB.id,
              relationship_type: type,
              relationship_strength: strength,
              evidence_snippet: `Entities "${entA.name}" and "${entB.name}" co-occur in "${docTitle}" (${pageLabel}).`,
              page_number: entA.page_number || 1,
              generation_source: 'auto'
            });
          }
        }
      }

      // 4. Connect Documents by overlap metrics
      const docsByEntityName = entities.reduce((acc: Record<string, string[]>, ent: any) => {
        if (!ent.document_id) return acc;
        const name = ent.name.toLowerCase().trim();
        if (!acc[name]) acc[name] = [];
        if (!acc[name].includes(ent.document_id)) {
          acc[name].push(ent.document_id);
        }
        return acc;
      }, {});

      const docEdges = new Set<string>();

      for (let i = 0; i < docs.length; i++) {
        const docA = docs[i];
        let docConnectionsCount = 0;

        for (let j = i + 1; j < docs.length; j++) {
          if (docConnectionsCount >= 5) break;

          const docB = docs[j];
          const edgeKey = [docA.id, docB.id].sort().join('-');

          if (docEdges.has(edgeKey)) continue;

          let sharedEntityName = '';
          for (const [name, docIdsVal] of Object.entries(docsByEntityName)) {
            const docIds = docIdsVal as string[];
            if (docIds.includes(docA.id) && docIds.includes(docB.id)) {
              sharedEntityName = name;
              break;
            }
          }

          if (sharedEntityName) {
            pushRelationship({
              source_document_id: docA.id,
              target_document_id: docB.id,
              relationship_type: 'shared_entity',
              relationship_strength: 0.70,
              evidence_snippet: `Documents "${docA.title}" and "${docB.title}" both reference entity "${sharedEntityName}".`,
              generation_source: 'auto'
            });
            docEdges.add(edgeKey);
            docConnectionsCount++;
          } else if (docA.district && docA.district === docB.district) {
            pushRelationship({
              source_document_id: docA.id,
              target_document_id: docB.id,
              relationship_type: 'same_district',
              relationship_strength: 0.60,
              evidence_snippet: `Both records originate from the same district: ${docA.district}.`,
              generation_source: 'auto'
            });
            docEdges.add(edgeKey);
            docConnectionsCount++;
          } else if (docA.category && docA.category === docB.category) {
            pushRelationship({
              source_document_id: docA.id,
              target_document_id: docB.id,
              relationship_type: 'same_category',
              relationship_strength: 0.50,
              evidence_snippet: `Both records catalogued under category: ${docA.category}.`,
              generation_source: 'auto'
            });
            docEdges.add(edgeKey);
            docConnectionsCount++;
          } else if (docA.year && docB.year && Math.abs(docA.year - docB.year) <= 10) {
            pushRelationship({
              source_document_id: docA.id,
              target_document_id: docB.id,
              relationship_type: 'same_period',
              relationship_strength: 0.45,
              evidence_snippet: `Both records created in the same historical period (${docA.year} CE & ${docB.year} CE).`,
              generation_source: 'auto'
            });
            docEdges.add(edgeKey);
            docConnectionsCount++;
          }
        }
      }

      // Batch inserts
      const batchSize = 100;
      for (let i = 0; i < relationshipsToInsert.length; i += batchSize) {
        const batch = relationshipsToInsert.slice(i, i + batchSize);
        const { error: insertErr } = await supabaseClient
          .from('entity_relationships')
          .insert(batch);
        
        if (insertErr) {
          console.error('Batch insert relationship error:', insertErr);
          throw insertErr;
        }
      }

      return {
        success: true,
        count: relationshipsToInsert.length
      };
    } catch (err) {
      console.error('Failed to regenerate auto relationships:', err);
      return { success: false, count: 0 };
    }
  }

  /**
   * Fallback Rich Demo Data generator
   */
  private static generateDemoGraphData(isDemoMarked = true) {
    const nodes: GraphNode[] = [
      { id: 'demo-1', label: 'Tipu Sultan', type: 'person', district: 'Mysuru', metadata: { description: 'Ruler of the Kingdom of Mysore, pioneer of rocket artillery.', confidence: 0.99 } },
      { id: 'demo-2', label: 'Mysuru', type: 'place', district: 'Mysuru', metadata: { description: 'Historical capital of Mysore Kingdom, cultural center.', confidence: 0.95 } },
      { id: 'demo-3', label: 'Mysore Palace', type: 'artifact', district: 'Mysuru', metadata: { description: 'Historical palace residence of the Wodeyars.', confidence: 0.98 } },
      { id: 'demo-4', label: 'Anglo-Mysore War', type: 'event', district: 'Mysuru', metadata: { description: 'Series of conflicts between Mysore and East India Company.', confidence: 0.92 } },
      { id: 'demo-5', label: 'Wodeyar Dynasty', type: 'organization', district: 'Mysuru', metadata: { description: 'Hindu dynasty that ruled Mysore from 1399.', confidence: 0.94 } },
      { id: 'demo-6', label: '1799 CE', type: 'date', district: 'Mysuru', metadata: { description: 'Fall of Seringapatam, end of Anglo-Mysore wars.', confidence: 0.99 } },
      { id: 'demo-7', label: 'Mysore Revenue Registry', type: 'Document', district: 'Mysuru', metadata: { description: 'Official survey records catalogued during colonial administration.', category: 'land-records', year: 1799 } }
    ].map(n => ({ ...n, isDemo: isDemoMarked }));

    const edges: GraphEdge[] = [
      { id: 'de-1', source: 'demo-1', target: 'demo-2', type: 'located_in', strength: 0.90, snippet: 'Tipu Sultan ruled the kingdom centered in Mysuru.', isDemo: isDemoMarked },
      { id: 'de-2', source: 'demo-1', target: 'demo-4', type: 'mentioned_in', strength: 0.85, snippet: 'Tipu Sultan led campaigns during the Anglo-Mysore wars.', isDemo: isDemoMarked },
      { id: 'de-3', source: 'demo-3', target: 'demo-2', type: 'located_in', strength: 0.95, snippet: 'Mysore Palace constructed in center Mysuru.', isDemo: isDemoMarked },
      { id: 'de-4', source: 'demo-7', target: 'demo-1', type: 'mentioned_in', strength: 0.75, snippet: 'Official registry document records revenue details of Tipu Sultan.', isDemo: isDemoMarked },
      { id: 'de-5', source: 'demo-7', target: 'demo-3', type: 'mentioned_in', strength: 0.70, snippet: 'Survey record detail boundary lines surrounding the Palace grounds.', isDemo: isDemoMarked },
      { id: 'de-6', source: 'demo-5', target: 'demo-2', type: 'located_in', strength: 0.85, snippet: 'Wodeyars established royalty capital within Mysuru district.', isDemo: isDemoMarked },
      { id: 'de-7', source: 'demo-4', target: 'demo-6', type: 'occurred_on', strength: 0.95, snippet: 'Final Anglo-Mysore war concluded in 1799.', isDemo: isDemoMarked }
    ];

    const timeline_events = [
      { id: 'dt-1', year: 1399, title: 'Establishment of Wodeyar Dynasty', type: 'Historical Event', district: 'Mysuru', category: 'royal-decrees', snippet: 'Wodeyars establish rule over Mysore region.' },
      { id: 'dt-2', year: 1750, title: 'Birth of Tipu Sultan', type: 'Historical Event', district: 'Mysuru', category: 'biography', snippet: 'Tipu Sultan born at Devanahalli.' },
      { id: 'dt-3', year: 1799, title: 'Mysore Revenue Registry Compilation', type: 'Document', district: 'Mysuru', category: 'land-records', snippet: 'Official records compiled detailing revenue boundaries.', document_id: 'demo-7' }
    ].map(t => ({ ...t, isDemo: isDemoMarked }));

    const stats = {
      totalEntities: 6,
      totalRelationships: 7,
      topConnectedPerson: 'Tipu Sultan (2 links)',
      topConnectedPlace: 'Mysuru (3 links)',
      topDistrict: 'Mysuru',
      strongestRelationship: '"Mysore Palace" ➔ "Mysuru" (95%)',
      documentsRepresented: 1
    };

    return {
      success: true,
      isDemo: isDemoMarked,
      nodes,
      edges,
      timeline_events,
      stats
    };
  }
}
