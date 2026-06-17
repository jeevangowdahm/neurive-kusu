import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { ARCHIVE_CATEGORIES_ALL, normalizeCategorySlug, normalizeDistrictName, KARNATAKA_DISTRICTS_ALL } from '@/lib/districts-categories-data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { category: string } }) {
  const supabase = createServerSupabaseClient();
  const searchParams = req.nextUrl.searchParams;

  const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
  const limit = Math.max(parseInt(searchParams.get('limit') || '20'), 1);
  const offset = (page - 1) * limit;

  const rawCategory = params.category;
  const canonicalSlug = normalizeCategorySlug(rawCategory);
  const categoryInfo = ARCHIVE_CATEGORIES_ALL.find(c => c.slug === canonicalSlug);

  if (!categoryInfo) {
    return NextResponse.json({ success: false, error: `Category "${rawCategory}" not found.` }, { status: 404 });
  }

  try {
    // 1. Authenticate user and fetch role
    let role = 'guest';
    let user: any = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data?.user;
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
    } catch (authErr) {
      console.warn('Auth check failed in single category API, treating as guest:', authErr);
    }

    // 2. Fetch all documents matching visibility rules
    let dbDocs: any[] = [];
    let isDbFetchFailed = false;

    try {
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

      const { data, error } = await docQuery;
      if (error) throw error;
      dbDocs = data || [];
    } catch (dbErr) {
      console.warn(`Supabase documents query failed in single category API [${canonicalSlug}], using mock dossier fallback:`, dbErr);
      isDbFetchFailed = true;
    }

    if (isDbFetchFailed || dbDocs.length === 0) {
      // Return high-fidelity demo category details (marked isDemo = true)
      return NextResponse.json(generateDemoCategoryDossier(categoryInfo, limit, offset));
    }

    // Filter documents for this specific category
    const matchedDocs = dbDocs.filter(d => d.category && normalizeCategorySlug(d.category) === canonicalSlug);
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
    const districtBreakdown: Record<string, number> = {};
    const languageBreakdown: Record<string, number> = {};
    const yearBreakdown: Record<number, number> = {};

    matchedDocs.forEach(d => {
      // District
      if (d.district) {
        const distName = normalizeDistrictName(d.district);
        districtBreakdown[distName] = (districtBreakdown[distName] || 0) + 1;
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

    const district_distribution = Object.entries(districtBreakdown).map(([name, count]) => ({
      name,
      count
    }));

    const language_distribution = Object.entries(languageBreakdown).map(([lang, count]) => ({
      name: lang.charAt(0).toUpperCase() + lang.slice(1),
      count
    }));

    const year_distribution = Object.entries(yearBreakdown)
      .map(([yr, count]) => ({ year: parseInt(yr), count }))
      .sort((a, b) => a.year - b.year);

    // 4. Related Entities
    let relatedPeople: string[] = [];
    let relatedPlaces: string[] = [];
    let relatedEvents: string[] = [];
    let topEntities: { name: string; type: string; count: number }[] = [];

    if (matchedDocIds.length > 0) {
      let dbEntities: any[] = [];
      try {
        const { data, error } = await supabase
          .from('entities')
          .select('entity_name, entity_type')
          .in('document_id', matchedDocIds);
        if (error) throw error;
        dbEntities = data || [];
      } catch (entityErr) {
        console.warn('GET Category Entities DB Query failed, ignoring:', entityErr);
      }

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

    // 5. Category Timeline
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

    // AI summary generation placeholder
    const aiSummary = `The "${categoryInfo.name}" collection contains ${totalRecords} historical ledger files. Spanning years ${oldestRecord || 'N/A'} to ${newestRecord || 'N/A'} CE, it predominantly contains records compiled in ${district_distribution.slice(0, 2).map(d => d.name).join(', ') || 'Karnataka'} regions, primarily recorded in ${language_distribution.map(l => l.name).join(', ') || 'Kannada'} language. Significant references focus on figures like ${relatedPeople.slice(0, 2).join(', ') || 'historical administrators'} and places like ${relatedPlaces.slice(0, 2).join(', ') || 'provincial offices'}.`;

    return NextResponse.json({
      success: true,
      isDemo: false,
      category: categoryInfo,
      stats: {
        total_documents: totalRecords,
        completed_documents: completedRecords,
        public_documents: publicRecords,
        oldest_year: oldestRecord,
        newest_year: newestRecord,
        average_ocr_confidence: parseFloat(averageOcrConfidence.toFixed(4)),
        district_distribution,
        language_distribution,
        year_distribution,
        top_entities: topEntities,
        related_people: relatedPeople,
        related_places: relatedPlaces,
        related_events: relatedEvents
      },
      timeline_events: timeline_events.slice(0, 15),
      documents: paginatedDocs,
      total_count: totalRecords,
      ai_summary: aiSummary
    });

  } catch (error) {
    console.error(`GET Category ${params.category} Detail Error:`, error);
    // Return mock dossier instead of throwing 500
    return NextResponse.json(generateDemoCategoryDossier(categoryInfo, limit, offset));
  }
}

// Fallback Rich Mock Category Dossier
function generateDemoCategoryDossier(cat: any, limit: number, offset: number) {
  const MOCK_CATEGORY_COUNTS: Record<string, number> = {
    'land-records': 2500000,
    'administrative-records': 1200000,
    'historical-letters': 650000,
    'temple-records': 800000,
    'maps': 450000,
    'photographs': 350000,
    'inscriptions': 550000,
    'government-orders': 950000,
    'cultural-records': 500000,
    'education-records': 300000,
    'revenue-records': 750000,
    'court-records': 600000,
    'palace-records': 250000,
    'military-records': 100000,
    'gazetteers': 50000,
    'kannada-literature': 120000
  };
  const demoCount = MOCK_CATEGORY_COUNTS[cat.slug] || 10000;
  const hash = cat.slug.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const oldest = 1800 + (hash % 110);
  const newest = 1970 + (hash % 50);

  const district_distribution = KARNATAKA_DISTRICTS_ALL.slice(0, 5).map((d, i) => ({
    name: d.name,
    count: Math.floor(demoCount * (0.35 - i * 0.07))
  }));

  const language_distribution = [
    { name: 'Kannada', count: Math.floor(demoCount * 0.60) },
    { name: 'English', count: Math.floor(demoCount * 0.30) },
    { name: 'Both', count: Math.floor(demoCount * 0.10) }
  ];

  const year_distribution = Array.from({ length: 6 }, (_, i) => ({
    year: oldest + i * 25,
    count: Math.floor(demoCount * 0.08) + (i % 4)
  }));

  const related_people = ['Sir Mark Cubbon', 'L. B. Bowring', 'Diwan Rangacharlu', 'Wodeyar VIII'].slice(0, 2 + (hash % 2));
  const related_places = ['Bengaluru Secretariat', 'Mysore Palace Archives', 'District Treasury Office'].slice(0, 3);
  const related_events = ['Archival cataloging 1891', 'Colonial survey assessment', 'Royal decree cataloging'].slice(0, 2);

  const topEntities = [
    ...related_people.map(name => ({ name, type: 'person', count: 6 })),
    ...related_places.map(name => ({ name, type: 'place', count: 4 })),
    ...related_events.map(name => ({ name, type: 'event', count: 2 }))
  ];

  const timeline_events = [
    { id: 'ct-1', year: oldest, title: `Compilation of ${cat.name} Collection`, type: 'Document', snippet: `Earliest known ledger compiling structural ${cat.name.toLowerCase()} files.` },
    { id: 'ct-2', year: oldest + 40, title: `State Archives indexing of ${cat.name}`, type: 'Historical Event', snippet: `Archival registers mapped during colonial administration.` }
  ];

  const docPrefixes = ['Ledger Report', 'Archival Register', 'Government Gazette', 'Royal Decree File'];
  const demoDocs = Array.from({ length: demoCount }, (_, i) => {
    const distName = KARNATAKA_DISTRICTS_ALL[i % KARNATAKA_DISTRICTS_ALL.length].name;
    return {
      id: `demo-doc-${cat.slug}-${i}`,
      title: `${docPrefixes[i % docPrefixes.length].toUpperCase()} #${2000 + i} - ${distName} [${cat.name}]`,
      summary: `A virtual historical record cataloged under the category of ${cat.name}. Details regional survey and administrative operations in ${distName}.`,
      year: oldest + (i % 6) * 15,
      district: distName,
      category: cat.slug,
      language: i % 3 === 0 ? 'kannada' : i % 3 === 1 ? 'english' : 'both',
      ocr_confidence: 0.91 + (i % 9) * 0.01,
      visibility: 'public',
      status: 'Completed',
      isDemo: true
    };
  });

  const aiSummary = `The "${cat.name}" archive collection contains ${demoCount} historical ledger files. Spanning years ${oldest} to ${newest} CE, it predominantly contains records compiled in ${district_distribution.slice(0, 2).map(d => d.name).join(', ')} regions, primarily recorded in Kannada language. Significant references focus on figures like ${related_people.slice(0, 2).join(', ')} and places like ${related_places.slice(0, 2).join(', ')}.`;

  return {
    success: true,
    isDemo: true,
    category: cat,
    stats: {
      total_documents: demoCount,
      completed_documents: demoCount,
      public_documents: demoCount,
      oldest_year: oldest,
      newest_year: newest,
      average_ocr_confidence: 0.9421,
      district_distribution,
      language_distribution,
      year_distribution,
      top_entities: topEntities,
      related_people,
      related_places,
      related_events
    },
    timeline_events,
    documents: demoDocs.slice(offset, offset + limit),
    total_count: demoCount,
    ai_summary: aiSummary
  };
}
