import { createServerSupabaseClient } from '@/lib/supabase-server';

interface DatabaseEntity {
  id: string;
  name: string;
  entity_type: string;
  document_id: string;
  page_number?: number;
  confidence_score?: number;
}

interface DatabaseDocument {
  id: string;
  title: string;
  district?: string;
  category?: string;
  year?: number;
}

/**
 * Knowledge Graph Generation Engine (Server-Side)
 */
export async function generateKnowledgeGraphRelationships() {
  const supabase = createServerSupabaseClient();

  // 1. Fetch all documents & entities
  const { data: docsData, error: docsErr } = await supabase
    .from('documents')
    .select('id, title, district, category, year');
  
  if (docsErr) throw docsErr;

  const { data: entitiesData, error: entErr } = await supabase
    .from('entities')
    .select('id, name, entity_type, document_id, page_number, confidence_score');

  if (entErr) throw entErr;

  const docs = (docsData || []) as DatabaseDocument[];
  const entities = (entitiesData || []) as DatabaseEntity[];

  // 2. Clear only AUTO-generated relationships (Safeguard 3)
  const { error: deleteErr } = await supabase
    .from('entity_relationships')
    .delete()
    .eq('generation_source', 'auto');

  if (deleteErr) throw deleteErr;

  const relationshipsToInsert: any[] = [];

  // Helper to push relationships safely ensuring distinct source and target check
  const pushRelationship = (rel: any) => {
    // Exact structural check
    if (rel.source_entity_id && rel.source_document_id) return;
    if (rel.target_entity_id && rel.target_document_id) return;
    if (!rel.source_entity_id && !rel.source_document_id) return;
    if (!rel.target_entity_id && !rel.target_document_id) return;
    
    // Prevent self-loop
    if (rel.source_entity_id && rel.source_entity_id === rel.target_entity_id) return;
    if (rel.source_document_id && rel.source_document_id === rel.target_document_id) return;

    relationshipsToInsert.push(rel);
  };

  // 3. Connect Entities mentioned in the same document/pages
  // Group entities by document
  const entitiesByDoc = entities.reduce((acc, ent) => {
    if (!ent.document_id) return acc;
    if (!acc[ent.document_id]) acc[ent.document_id] = [];
    acc[ent.document_id].push(ent);
    return acc;
  }, {} as Record<string, DatabaseEntity[]>);

  for (const [docId, docEntities] of Object.entries(entitiesByDoc)) {
    const docObj = docs.find(d => d.id === docId);
    const docTitle = docObj?.title || 'Archive Record';

    // A. Connect entities to their source document (extracted_from)
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

    // B. Connect co-occurring entities
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

  // 4. Connect Documents by overlap metrics (district, category, era, shared entities)
  // Find shared entities across documents
  const docsByEntityName = entities.reduce((acc, ent) => {
    if (!ent.document_id) return acc;
    const name = ent.name.toLowerCase().trim();
    if (!acc[name]) acc[name] = [];
    if (!acc[name].includes(ent.document_id)) {
      acc[name].push(ent.document_id);
    }
    return acc;
  }, {} as Record<string, string[]>);

  // Keep track of document-to-document edges to prevent duplicates and cluttering
  const docEdges = new Set<string>();

  for (let i = 0; i < docs.length; i++) {
    const docA = docs[i];
    
    // limit document connections per document to prevent massive graph bloating
    let docConnectionsCount = 0;

    for (let j = i + 1; j < docs.length; j++) {
      if (docConnectionsCount >= 5) break;

      const docB = docs[j];
      const edgeKey = [docA.id, docB.id].sort().join('-');

      if (docEdges.has(edgeKey)) continue;

      let sharedEntityName = '';
      for (const [name, docIds] of Object.entries(docsByEntityName)) {
        if (docIds.includes(docA.id) && docIds.includes(docB.id)) {
          sharedEntityName = name;
          break;
        }
      }

      // Check relationship criteria
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

  // 5. Batch insert relationships to avoid database timeouts
  const batchSize = 100;
  for (let i = 0; i < relationshipsToInsert.length; i += batchSize) {
    const batch = relationshipsToInsert.slice(i, i + batchSize);
    const { error: insertErr } = await supabase
      .from('entity_relationships')
      .insert(batch);
    
    if (insertErr) {
      console.error('Batch insert relationship error:', insertErr);
      throw insertErr;
    }
  }

  return {
    success: true,
    relationshipsCount: relationshipsToInsert.length
  };
}
