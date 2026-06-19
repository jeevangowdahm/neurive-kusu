import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { sanitizeString } from '@/lib/security/validation';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const searchParams = req.nextUrl.searchParams;

  const entityId = searchParams.get('entity');
  const districtId = searchParams.get('district');
  const categoryId = searchParams.get('category');
  const yearFrom = searchParams.get('year_from') ? parseInt(searchParams.get('year_from')!) : null;
  const yearTo = searchParams.get('year_to') ? parseInt(searchParams.get('year_to')!) : null;
  const eventType = sanitizeString(searchParams.get('event_type') || '');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  try {
    let query = supabase
      .from('timeline_events')
      .select(`
        *,
        entities (id, name, entity_type, name_kannada, description),
        archives (id, title, year, district),
        districts (id, name, name_kannada)
      `)
      .order('event_date', { ascending: true })
      .limit(limit);

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }
    if (districtId) {
      query = query.eq('district_id', districtId);
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (eventType) {
      query = query.eq('event_type', eventType);
    }
    if (yearFrom) {
      query = query.gte('event_date', `${yearFrom}-01-01`);
    }
    if (yearTo) {
      query = query.lte('event_date', `${yearTo}-12-31`);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Timeline fetch error:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch timeline events' }, { status: 500 });
    }

    // Group events by decade for timeline visualization
    const eventsByDecade: Record<string, any[]> = {};
    (events || []).forEach((event: any) => {
      const year = new Date(event.event_date).getFullYear();
      const decade = Math.floor(year / 10) * 10;
      const key = `${decade}s`;
      if (!eventsByDecade[key]) eventsByDecade[key] = [];
      eventsByDecade[key].push(event);
    });

    // Fetch interlinking data
    const eventIds = (events || []).map((e: any) => e.id);
    let interlinking: any = { related_documents: {}, related_entities: {} };

    if (eventIds.length > 0) {
      // Get entity IDs from events
      const entityIds = [...new Set((events || []).map((e: any) => e.entity_id).filter(Boolean))];
      if (entityIds.length > 0) {
        const { data: docLinks } = await supabase
          .from('document_entity_links')
          .select('entity_id, archive_id, mention_count, archives (id, title, year)')
          .in('entity_id', entityIds)
          .limit(20);

        if (docLinks) {
          docLinks.forEach((link: any) => {
            const eid = link.entity_id;
            if (!interlinking.related_documents[eid]) {
              interlinking.related_documents[eid] = [];
            }
            if (link.archives) {
              interlinking.related_documents[eid].push({
                id: link.archives.id,
                title: link.archives.title,
                year: link.archives.year,
                mention_count: link.mention_count
              });
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      events: events || [],
      events_by_decade: eventsByDecade,
      meta: {
        total: (events || []).length,
        filters: { entityId, districtId, categoryId, yearFrom, yearTo, eventType }
      },
      interlinking: {
        ...interlinking,
        suggested_features: [
          { name: 'search', label: 'Search Events', icon: 'search', href: '/search' },
          { name: 'graph', label: 'View Knowledge Graph', icon: 'network', href: '/knowledge-graph' },
          { name: 'districts', label: 'Explore Districts', icon: 'map', href: '/districts' }
        ]
      }
    });

  } catch (error) {
    console.error('Timeline API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
