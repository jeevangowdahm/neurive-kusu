import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { ARCHIVE_CATEGORIES_ALL, normalizeCategorySlug, normalizeDistrictName } from '@/lib/districts-categories-data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();

  // 1. Safe database seed only if categories table exists
  try {
    const { error: tableCheckError } = await supabase
      .from('categories')
      .select('slug')
      .limit(1);

    if (!tableCheckError) {
      const { data: existingCats } = await supabase
        .from('categories')
        .select('slug');
      
      const existingSlugs = new Set((existingCats || []).map(c => c.slug));
      const missingCats = ARCHIVE_CATEGORIES_ALL.filter(c => !existingSlugs.has(c.slug));

      if (missingCats.length > 0) {
        const seedRows = missingCats.map(cat => ({
          name: cat.name,
          name_kannada: cat.name_kannada,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          color: cat.color
        }));
        await supabase.from('categories').insert(seedRows);
      }
    }
  } catch (seedErr) {
    console.warn('Categories safe seeding skipped or failed:', seedErr);
  }

  try {
    // 2. Authenticate user and fetch role
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
      console.warn('Auth check failed in categories API, treating as guest:', authErr);
    }

    // 3. Fetch all documents matching visibility rules
    let dbDocs: any[] = [];
    let isDbFetchFailed = false;

    try {
      let docQuery = supabase.from('documents').select('id, title, visibility, status, uploaded_by, category, district, language, year, ocr_confidence');
      
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
      console.warn('Supabase documents query failed in categories API, using static counts fallback:', dbErr);
      isDbFetchFailed = true;
    }

    // 4. Assemble stats by category
    const categoriesData = ARCHIVE_CATEGORIES_ALL.map((cat) => {
      if (isDbFetchFailed) {
        // If DB fetch failed completely, return counts as 0
        return {
          ...cat,
          total_documents: 0,
          completed_documents: 0,
          public_documents: 0,
          oldest_year: null,
          newest_year: null,
          average_ocr_confidence: 0.0,
          top_districts: [],
          top_languages: []
        };
      }

      // Aggregate from real allowed records matching this category slug
      const catDocs = dbDocs.filter(d => d.category && normalizeCategorySlug(d.category) === cat.slug);
      const totalDocs = catDocs.length;
      const completedDocs = catDocs.filter(d => d.status === 'Completed').length;
      const publicDocs = catDocs.filter(d => d.visibility === 'public').length;

      const years = catDocs.map(d => d.year).filter(Boolean) as number[];
      const oldest = years.length > 0 ? Math.min(...years) : null;
      const newest = years.length > 0 ? Math.max(...years) : null;

      const confidences = catDocs.map(d => d.ocr_confidence).filter(c => c !== null && c !== undefined) as number[];
      const avgConf = confidences.length > 0 ? confidences.reduce((sum, c) => sum + Number(c), 0) / confidences.length : 0.0;

      // Calculate top districts
      const distMap: Record<string, number> = {};
      catDocs.forEach(d => {
        if (d.district) {
          const distName = normalizeDistrictName(d.district);
          distMap[distName] = (distMap[distName] || 0) + 1;
        }
      });
      const topDists = Object.entries(distMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(e => e[0]);

      // Calculate top languages
      const langMap: Record<string, number> = {};
      catDocs.forEach(d => {
        if (d.language) {
          const lang = d.language.trim().toLowerCase();
          langMap[lang] = (langMap[lang] || 0) + 1;
        }
      });
      const topLangs = Object.entries(langMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(e => e[0]);

      return {
        ...cat,
        total_documents: totalDocs,
        completed_documents: completedDocs,
        public_documents: publicDocs,
        oldest_year: oldest,
        newest_year: newest,
        average_ocr_confidence: parseFloat(avgConf.toFixed(4)),
        top_districts: topDists,
        top_languages: topLangs
      };
    });

    return NextResponse.json({
      success: true,
      isDemo: isDbFetchFailed || dbDocs.length === 0,
      categories: categoriesData
    });

  } catch (error) {
    console.error('GET Categories API Error:', error);
    // Return static categories with counts = 0 on severe errors
    const fallbackCats = ARCHIVE_CATEGORIES_ALL.map(cat => ({
      ...cat,
      total_documents: 0,
      completed_documents: 0,
      public_documents: 0,
      oldest_year: null,
      newest_year: null,
      average_ocr_confidence: 0.0,
      top_districts: [],
      top_languages: []
    }));
    return NextResponse.json({
      success: true,
      isDemo: true,
      categories: fallbackCats
    });
  }
}
