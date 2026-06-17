import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { KARNATAKA_DISTRICTS_ALL, normalizeDistrictName, normalizeCategorySlug, ARCHIVE_CATEGORIES_ALL } from '@/lib/districts-categories-data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { district: string } }) {
  const supabase = createServerSupabaseClient();
  const searchParams = req.nextUrl.searchParams;

  const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
  const limit = Math.max(parseInt(searchParams.get('limit') || '20'), 1);
  const offset = (page - 1) * limit;

  try {
    const rawDistrict = decodeURIComponent(params.district);
    const canonicalName = normalizeDistrictName(rawDistrict);
    const districtInfo = KARNATAKA_DISTRICTS_ALL.find(d => d.name === canonicalName);

    if (!districtInfo) {
      return NextResponse.json({ success: false, error: `District "${rawDistrict}" not found.` }, { status: 404 });
    }

    // 1. Authenticate user and fetch role
    const { data: { user } } = await supabase.auth.getUser();
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
        role = 'user';
      }
    }

    // 2. Fetch all documents matching visibility rules
    let docQuery = supabase.from('documents').select('id, title, visibility, status, uploaded_by, category, district, language, year, ocr_confidence, summary');
    
    if (role === 'admin') {
      // Admin sees all
    } else if (user) {
      if (['researcher', 'archivist'].includes(role)) {
        docQuery = docQuery.or(`visibility.eq.public,visibility.eq.restricted,uploaded_by.eq.${user.id}`);
      } else {
        docQuery = docQuery.or(`visibility.eq.public,uploaded_by.eq.${user.id}`);
      }
    } else {
      docQuery = docQuery.eq('visibility', 'public').eq('status', 'Completed');
    }

    const { data: dbDocs, error } = await docQuery;
    if (error) throw error;

    const allAllowedDocs = dbDocs || [];
    const isDbEmpty = allAllowedDocs.length === 0;

    if (isDbEmpty) {
      // Return high-fidelity demo data dossier (marked isDemo = true)
      return NextResponse.json(generateDemoDistrictDossier(districtInfo, limit, offset));
    }

    // Filter documents for this specific district
    const matchedDocs = allAllowedDocs.filter(d => d.district && normalizeDistrictName(d.district) === canonicalName);
    const matchedDocIds = matchedDocs.map(d => d.id);

    // 3. Compute Aggregations
    const totalRecords = matchedDocs.length;
    const completedRecords = matchedDocs.filter(d => d.status === 'Completed').length;
    const publicRecords = matchedDocs.filter(d => d.visibility === 'public').length;

    const years = matchedDocs.map(d => d.year).filter(Boolean) as number[];
    const oldestRecord = years.length > 0 ? Math.min(...years) : null;
    const newestRecord = years.length > 0 ? Math.max(...years) : null;

    const confidences = matchedDocs.map(d => d.ocr_confidence).filter(c => c !== null && c !== undefined) as number[];
    const averageOcrConfidence = confidences.length > 0 ? confidences.reduce((sum, c) => sum + Number(c), 0) / confidences.length : 0.0;

    // Distributions
    const categoryBreakdown: Record<string, number> = {};
    const languageBreakdown: Record<string, number> = {};
    const yearBreakdown: Record<number, number> = {};

    matchedDocs.forEach(d => {
      // Category
      if (d.category) {
        const catSlug = normalizeCategorySlug(d.category);
        categoryBreakdown[catSlug] = (categoryBreakdown[catSlug] || 0) + 1;
      }
      // Language
      if (d.language) {
        const lang = d.language.trim().toLowerCase();
        languageBreakdown[lang] = (languageBreakdown[lang] || 0) + 1;
      }
      // Year
      if (d.year) {
        yearBreakdown[d.year] = (yearBreakdown[d.year] || 0) + 1;
      }
    });

    const document_count_by_category = Object.entries(categoryBreakdown).map(([slug, count]) => {
      const c = ARCHIVE_CATEGORIES_ALL.find(cat => cat.slug === slug);
      return { name: c?.name || slug, slug, count };
    });

    const document_count_by_language = Object.entries(languageBreakdown).map(([lang, count]) => ({
      name: lang.charAt(0).toUpperCase() + lang.slice(1),
      count
    }));

    const document_count_by_year = Object.entries(yearBreakdown)
      .map(([yr, count]) => ({ year: parseInt(yr), count }))
      .sort((a, b) => a.year - b.year);

    // 4. Related Entities (Safeguard 10 - generated only from allowed documents)
    let relatedPeople: string[] = [];
    let relatedPlaces: string[] = [];
    let relatedEvents: string[] = [];
    let topEntities: { name: string; type: string; count: number }[] = [];

    if (matchedDocIds.length > 0) {
      const { data: dbEntities } = await supabase
        .from('entities')
        .select('entity_name, entity_type')
        .in('document_id', matchedDocIds);

      const entities = dbEntities || [];
      const entityCounts: Record<string, { type: string; count: number }> = {};

      entities.forEach((ent: any) => {
        const name = ent.entity_name || ent.name;
        if (!name) return;
        const type = (ent.entity_type || 'other').toLowerCase();
        const key = `${name}||${type}`;
        if (!entityCounts[key]) {
          entityCounts[key] = { type, count: 0 };
        }
        entityCounts[key].count++;
      });

      const sortedEntities = Object.entries(entityCounts)
        .map(([key, info]) => {
          const [name] = key.split('||');
          return { name, type: info.type, count: info.count };
        })
        .sort((a, b) => b.count - a.count);

      topEntities = sortedEntities.slice(0, 10);
      relatedPeople = sortedEntities.filter(e => e.type === 'person').map(e => e.name).slice(0, 8);
      relatedPlaces = sortedEntities.filter(e => e.type === 'place').map(e => e.name).slice(0, 8);
      relatedEvents = sortedEntities.filter(e => e.type === 'event').map(e => e.name).slice(0, 8);
    }

    // 5. District Timeline
    const timeline_events: any[] = [];
    matchedDocs.forEach(d => {
      if (d.year) {
        timeline_events.push({
          id: `timeline-doc-${d.id}`,
          year: d.year,
          title: d.title,
          type: 'Document',
          snippet: d.summary || 'Official archival ledger record.',
          document_id: d.id
        });
      }
    });
    timeline_events.sort((a, b) => a.year - b.year);

    // 6. Paginated Documents list
    const paginatedDocs = matchedDocs.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      isDemo: false,
      district: districtInfo,
      stats: {
        total_documents: totalRecords,
        completed_documents: completedRecords,
        public_documents: publicRecords,
        oldest_year: oldestRecord,
        newest_year: newestRecord,
        average_ocr_confidence: parseFloat(averageOcrConfidence.toFixed(4)),
        document_count_by_category,
        document_count_by_language,
        document_count_by_year,
        top_entities: topEntities,
        related_people: relatedPeople,
        related_places: relatedPlaces,
        related_events: relatedEvents
      },
      timeline_events: timeline_events.slice(0, 15),
      documents: paginatedDocs,
      total_count: totalRecords
    });

  } catch (error) {
    console.error(`GET District ${params.district} Detail Error:`, error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve district details' }, { status: 500 });
  }
}

// Fallback Rich Mock Dossier
function generateDemoDistrictDossier(dist: any, limit: number, offset: number) {
  let totalBaseCount = 0;
  KARNATAKA_DISTRICTS_ALL.forEach((d) => {
    const h = d.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const base = 45 + (h % 115);
    totalBaseCount += base;
  });
  
  const hash = dist.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const baseCount = 45 + (hash % 115);
  const scaleFactor = 10000000 / totalBaseCount;
  
  let demoCount = Math.round(baseCount * scaleFactor);
  const isLast = KARNATAKA_DISTRICTS_ALL[KARNATAKA_DISTRICTS_ALL.length - 1].id === dist.id;
  if (isLast) {
    let otherSum = 0;
    KARNATAKA_DISTRICTS_ALL.slice(0, -1).forEach((d) => {
      const h = d.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const base = 45 + (h % 115);
      otherSum += Math.round(base * scaleFactor);
    });
    demoCount = 10000000 - otherSum;
  }

  const oldest = 1810 + (hash % 90);
  const newest = 1960 + (hash % 60);
  
  const document_count_by_category = ARCHIVE_CATEGORIES_ALL.slice(0, 5).map((c, i) => ({
    name: c.name,
    slug: c.slug,
    count: Math.floor(demoCount * (0.4 - i * 0.08))
  }));

  const document_count_by_language = [
    { name: 'Kannada', count: Math.floor(demoCount * 0.65) },
    { name: 'English', count: Math.floor(demoCount * 0.25) },
    { name: 'Both', count: Math.floor(demoCount * 0.10) }
  ];

  const document_count_by_year = Array.from({ length: 6 }, (_, i) => ({
    year: oldest + i * 20,
    count: Math.floor(demoCount * 0.1) + (i % 3)
  }));

  const related_people = ['Kempe Gowda II', 'Diwan Purnaiah', 'Rani Chennamma', 'Sir M. Visvesvaraya'].slice(0, 2 + (hash % 3));
  const related_places = [`${dist.name} Palace`, `${dist.name} Fort`, 'Revenue Office'].slice(0, 3);
  const related_events = ['Land Survey 1888', 'Grand Dasara Assembly', 'Famine Relief Commission'].slice(0, 2);

  const topEntities = [
    ...related_people.map(name => ({ name, type: 'person', count: 5 })),
    ...related_places.map(name => ({ name, type: 'place', count: 4 })),
    ...related_events.map(name => ({ name, type: 'event', count: 3 }))
  ];

  const timeline_events = [
    { id: 'dt-1', year: oldest, title: `Compilation of ${dist.name} Gazetteer`, type: 'Document', snippet: 'Official records compiled detailing revenue boundaries.' },
    { id: 'dt-2', year: oldest + 25, title: `Land Revenue Resettlement in Headquarter`, type: 'Historical Event', snippet: 'Major agricultural lands re-surveyed.' }
  ];

  const docSlugs = ['revenue-settlement-ledger', 'temple-grant-charter', 'court-appeal-judgment', 'boundary-demarcation-map'];
  const demoDocs = Array.from({ length: demoCount }, (_, i) => ({
    id: `demo-doc-${dist.name}-${i}`,
    title: `${docSlugs[i % docSlugs.length].replace(/-/g, ' ').toUpperCase()} #${1000 + i} - ${dist.name}`,
    summary: `A virtual historical record cataloged under the district of ${dist.name}. Details regional survey and administrative operations.`,
    year: oldest + (i % 5) * 15,
    district: dist.name,
    category: ARCHIVE_CATEGORIES_ALL[i % ARCHIVE_CATEGORIES_ALL.length].slug,
    language: i % 3 === 0 ? 'kannada' : i % 3 === 1 ? 'english' : 'both',
    ocr_confidence: 0.90 + (i % 10) * 0.01,
    visibility: 'public',
    status: 'Completed',
    isDemo: true
  }));

  return {
    success: true,
    isDemo: true,
    district: dist,
    stats: {
      total_documents: demoCount,
      completed_documents: demoCount,
      public_documents: demoCount,
      oldest_year: oldest,
      newest_year: newest,
      average_ocr_confidence: 0.9345,
      document_count_by_category,
      document_count_by_language,
      document_count_by_year,
      top_entities: topEntities,
      related_people,
      related_places,
      related_events
    },
    timeline_events,
    documents: demoDocs.slice(offset, offset + limit),
    total_count: demoCount
  };
}
