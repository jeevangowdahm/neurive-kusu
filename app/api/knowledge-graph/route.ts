import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { KnowledgeGraphService } from '@/lib/ai/knowledge-graph-service';

// 1. GET - Fetches secure knowledge graph data (nodes, edges, timeline, stats)
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const searchParams = req.nextUrl.searchParams;

  // Filters
  const entity = searchParams.get('entity') || undefined;
  const document_id = searchParams.get('document_id') || undefined;
  const district = searchParams.get('district') || undefined;
  const category = searchParams.get('category') || undefined;
  const entityType = searchParams.get('entity_type') || undefined;
  const yearFrom = searchParams.get('year_from') ? parseInt(searchParams.get('year_from')!) : null;
  const yearTo = searchParams.get('year_to') ? parseInt(searchParams.get('year_to')!) : null;
  const minStrength = searchParams.get('min_strength') ? parseFloat(searchParams.get('min_strength')!) : undefined;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

  try {
    // A. Authenticate User & Fetch Role
    const { data: { user } } = await supabase.auth.getUser();
    let role = 'guest';
    let userId = undefined;
    if (user) {
      userId = user.id;
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (profile) role = profile.role;
    }

    // Call KnowledgeGraphService
    const result = await KnowledgeGraphService.getGraphData(
      supabase,
      role as any,
      userId,
      {
        entity,
        document_id,
        district,
        category,
        entityType,
        yearFrom,
        yearTo,
        minStrength,
        limit
      }
    );

    return NextResponse.json(result);

  } catch (error) {
    console.error('GET Knowledge Graph API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve graph details' }, { status: 500 });
  }
}

// 2. POST - Restricted relation generation trigger (Safeguard 8)
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();

  try {
    // Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Fetch user profile role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || 'guest';

    // Role block restriction
    if (!['admin', 'archivist'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Generation is restricted to admins and archivists.' }, { status: 403 });
    }

    // Trigger Generation Service
    const result = await KnowledgeGraphService.regenerateAutoRelationships(supabase);

    if (!result.success) {
      throw new Error('Regeneration failed in KnowledgeGraphService');
    }

    return NextResponse.json({
      success: true,
      message: 'Knowledge Graph relationships regenerated successfully.',
      count: result.count
    });

  } catch (error) {
    console.error('POST Knowledge Graph Generation Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Regeneration failed' }, { status: 500 });
  }
}
