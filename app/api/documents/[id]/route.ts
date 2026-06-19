import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { id } = params;

  try {
    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Fetch user profile role
    let role = 'guest';
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (profile) {
        role = profile.role;
      } else {
        role = 'user'; // default role for authenticated users
      }
    }

    // 3. Query documents or fetch Wikipedia dynamically
    let doc: any = null;
    let isLegacy = false;

    if (id.startsWith('wiki-')) {
      const pageid = id.replace('wiki-', '');
      try {
        const wpRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts|info&inprop=url&exintro=1&explaintext=1&pageids=${pageid}&format=json&origin=*`);
        if (wpRes.ok) {
          const wpData = await wpRes.json();
          const page = wpData.query?.pages?.[pageid];
          if (page && page.missing === undefined) {
            doc = {
              id: id,
              title: page.title,
              description: page.extract || 'No description available.',
              summary: page.extract,
              district: 'External Web',
              category: 'Wikipedia Archive',
              language: 'english',
              year: 2024,
              file_url: page.fullurl || `https://en.wikipedia.org/?curid=${pageid}`,
              file_type: 'html',
              status: 'Completed',
              visibility: 'public',
              ocr_confidence: 0.99,
              page_count: 1,
              created_at: new Date().toISOString()
            };
          }
        }
      } catch (err) {
        console.warn('Failed to fetch Wikipedia page details server-side:', err);
      }
    } else {
      const { data: dbDoc } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (dbDoc) {
        doc = dbDoc;
      } else {
        // 4. Try legacy archives table
        const { data: dbArch } = await supabase
          .from('archives')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (dbArch) {
          doc = dbArch;
          isLegacy = true;
        }
      }
    }

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // 5. Server-side Permission Check (Safeguard 2)
    const visibility = doc.visibility || doc.access_level || 'public';
    const status = doc.status || 'Completed';
    const uploaded_by = doc.uploaded_by || null;

    let allowed = false;

    if (role === 'admin') {
      allowed = true;
    } else if (visibility === 'public') {
      // Public records visible to everyone, but if not completed/active, only to owner
      if (status === 'Completed' || status === 'active') {
        allowed = true;
      } else if (user && user.id === uploaded_by) {
        allowed = true;
      }
    } else if (visibility === 'restricted') {
      // Restricted: visible to authenticated users with role: researcher, archivist, admin
      if (user && ['researcher', 'archivist', 'admin'].includes(role)) {
        allowed = true;
      }
    } else if (visibility === 'private') {
      // Private: visible only to owner/uploaded_by or admin
      if (user && (user.id === uploaded_by || role === 'admin')) {
        allowed = true;
      }
    }

    if (!allowed) {
      return NextResponse.json({ error: 'Access denied. You do not have permissions to view this record.' }, { status: 403 });
    }

    // 6. Generate Secure signed URL if bucket file (Safeguard 1)
    let filePreviewUrl = doc.file_url || '';
    if (filePreviewUrl && (filePreviewUrl.includes('/storage/v1/object/public/archive-documents/') || filePreviewUrl.includes('/archive-documents/'))) {
      try {
        const parts = filePreviewUrl.split('/archive-documents/');
        if (parts.length > 1) {
          const filePath = decodeURIComponent(parts[1].split('?')[0]);
          const { data: signedData } = await supabase.storage
            .from('archive-documents')
            .createSignedUrl(filePath, 3600); // Valid for 1 hour
          if (signedData?.signedUrl) {
            filePreviewUrl = signedData.signedUrl;
          }
        }
      } catch (storageErr) {
        console.warn('Error generating signed URL:', storageErr);
      }
    }

    // 7. Load page-wise OCR text
    const { data: pages } = await supabase
      .from('document_pages')
      .select('*')
      .eq('document_id', id)
      .order('page_number', { ascending: true });

    // 8. Load chunks
    const { data: chunks } = await supabase
      .from('document_chunks')
      .select('*')
      .eq(isLegacy ? 'archive_id' : 'document_id', id)
      .order('chunk_index', { ascending: true });

    // 9. Load entities
    let entities = [];
    if (!isLegacy) {
      const { data: ent } = await supabase
        .from('entities')
        .select('*')
        .eq('document_id', id);
      entities = ent || [];
    } else {
      const { data: links } = await supabase
        .from('entity_archive_links')
        .select('*, entities(*)')
        .eq('archive_id', id);
      entities = links?.map(l => ({
        id: l.entities?.id,
        entity_name: l.entities?.name || l.entities?.entity_name,
        entity_type: l.entities?.entity_type,
        page_number: 1,
        confidence_score: l.confidence_score || 0.8
      })).filter(e => e.entity_name) || [];
    }

    // 10. Load related records via entity links (Interlinking)
    let relatedDocs: any[] = [];
    let relatedEntities: any[] = [];
    try {
      // 10a. Get entity IDs from document_entity_links
      const { data: entityLinks } = await supabase
        .from('document_entity_links')
        .select('entity_id')
        .eq('archive_id', id);
      
      const entityIds = entityLinks?.map(l => l.entity_id) || [];
      
      // 10b. Fetch related documents via shared entities
      if (entityIds.length > 0) {
        const { data: relatedLinks } = await supabase
          .from('document_entity_links')
          .select('archive_id, entities (id, name, entity_type)')
          .in('entity_id', entityIds)
          .neq('archive_id', id)
          .limit(10);
        
        const relatedArchiveIds = [...new Set((relatedLinks || []).map((l: any) => l.archive_id))];
        
        if (relatedArchiveIds.length > 0) {
          let relatedQuery = supabase.from('archives').select('*').in('id', relatedArchiveIds);
          
          if (role !== 'admin') {
            relatedQuery = relatedQuery.eq('status', 'active');
          }
          
          const { data: related } = await relatedQuery.limit(6);
          
          relatedDocs = (related || []).map((item: any) => {
            const sharedEntity = (relatedLinks || []).find((l: any) => l.archive_id === item.id);
            const entityObj = sharedEntity?.entities as { name?: string } | undefined;
            const entityName = entityObj?.name || 'Related';
            return {
              ...item,
              relevance_reason: sharedEntity
                ? `Shares entity: ${entityName}`
                : 'Related document'
            };
          });
        }
        
        // 10c. Fetch full entity details for the sidebar
        const { data: fullEntities } = await supabase
          .from('entities')
          .select('id, name, entity_type, name_kannada, description, birth_date, death_date, entity_metadata')
          .in('id', entityIds);
        relatedEntities = fullEntities || [];
      }
    } catch (err) {
      console.warn('Failed to load related documents via entities:', err);
    }
    
    // Fallback: If no entity-based related docs, try category/district fallback
    if (relatedDocs.length === 0) {
      try {
        let fallbackQuery = supabase.from('archives').select('*').neq('id', id);
        if (role !== 'admin') {
          fallbackQuery = fallbackQuery.eq('status', 'active');
        }
        const filters: string[] = [];
        if (doc.district) filters.push(`district.eq.${doc.district}`);
        if (doc.category) filters.push(`category.eq.${doc.category}`);
        if (filters.length > 0) {
          fallbackQuery = fallbackQuery.or(filters.join(','));
        }
        const { data: fallback } = await fallbackQuery.limit(6);
        relatedDocs = (fallback || []).map((item: any) => {
          const reasons = [];
          if (item.district === doc.district) reasons.push('same district');
          if (item.category === doc.category) reasons.push('same category');
          return { ...item, relevance_reason: `Matches ${reasons.join(', ')}` };
        });
      } catch (err) {
        console.warn('Fallback related docs failed:', err);
      }
    }

    return NextResponse.json({
      success: true,
      document: {
        ...doc,
        file_preview_url: filePreviewUrl // secure preview url
      },
      isLegacy,
      pages: pages || [],
      chunks: chunks || [],
      entities: entities || [],
      related: relatedDocs,
      related_entities: relatedEntities,
      userRole: role,
      interlinking: {
        knowledge_graph: { entities: relatedEntities.slice(0, 5) },
        chat: { document_id: id, context: doc.title },
        timeline: { year: doc.year, entity_names: relatedEntities.map(e => e.name).slice(0, 3) },
        search: { district: doc.district, category: doc.category }
      }
    });

  } catch (error) {
    console.error('Document detail API route error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal Server Error'
    }, { status: 500 });
  }
}
