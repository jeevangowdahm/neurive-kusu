import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { KARNATAKA_DISTRICTS_ALL, normalizeDistrictName, normalizeCategorySlug } from '@/lib/districts-categories-data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();

  try {
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

    // 2. Fetch all documents to aggregate safely (respecting visibility rules)
    let docQuery = supabase.from('documents').select('id, title, visibility, status, uploaded_by, category, district, language, year, ocr_confidence');
    
    if (role === 'admin') {
      // Admins see all
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

    const documents = dbDocs || [];
    const isDbEmpty = documents.length === 0;

    // 3. Assemble stats by district
    let totalBaseCount = 0;
    const baseCounts = KARNATAKA_DISTRICTS_ALL.map((dist) => {
      const hash = dist.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const baseCount = 45 + (hash % 115);
      totalBaseCount += baseCount;
      return { id: dist.id, baseCount };
    });

    let runningSum = 0;
    const districtsData = KARNATAKA_DISTRICTS_ALL.map((dist, idx) => {
      if (isDbEmpty) {
        // Generate high-fidelity demo data (marked as isDemo = true at parent level)
        // Pseudo-random counts based on district name hash for stability
        const hash = dist.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const distBase = baseCounts.find(b => b.id === dist.id);
        const baseCount = distBase ? distBase.baseCount : 100;
        const scaleFactor = 10000000 / totalBaseCount;
        
        let demoCount = Math.round(baseCount * scaleFactor);
        if (idx === KARNATAKA_DISTRICTS_ALL.length - 1) {
          demoCount = 10000000 - runningSum;
        } else {
          runningSum += demoCount;
        }

        const demoOldest = 1810 + (hash % 90);
        const demoNewest = 1960 + (hash % 60);
        const demoConf = 0.88 + ((hash % 10) * 0.01);
        
        // Pseudo-random top categories
        const catSlugs = ['land-records', 'revenue-records', 'court-records', 'temple-records', 'maps-surveys'];
        const topCats = [catSlugs[hash % catSlugs.length], catSlugs[(hash + 1) % catSlugs.length]];

        return {
          ...dist,
          total_documents: demoCount,
          completed_documents: demoCount,
          public_documents: demoCount,
          oldest_year: demoOldest,
          newest_year: demoNewest,
          average_ocr_confidence: parseFloat(demoConf.toFixed(4)),
          top_categories: topCats,
          top_languages: ['kannada', 'english']
        };
      } else {
        // Aggregate from real allowed records matching this district
        const distDocs = documents.filter(d => d.district && normalizeDistrictName(d.district) === dist.name);
        const totalDocs = distDocs.length;
        const completedDocs = distDocs.filter(d => d.status === 'Completed').length;
        const publicDocs = distDocs.filter(d => d.visibility === 'public').length;
        
        const years = distDocs.map(d => d.year).filter(Boolean) as number[];
        const oldest = years.length > 0 ? Math.min(...years) : null;
        const newest = years.length > 0 ? Math.max(...years) : null;

        const confidences = distDocs.map(d => d.ocr_confidence).filter(c => c !== null && c !== undefined) as number[];
        const avgConf = confidences.length > 0 ? confidences.reduce((sum, c) => sum + Number(c), 0) / confidences.length : 0.0;

        // Calculate top categories
        const catMap: Record<string, number> = {};
        distDocs.forEach(d => {
          if (d.category) {
            const catSlug = normalizeCategorySlug(d.category);
            catMap[catSlug] = (catMap[catSlug] || 0) + 1;
          }
        });
        const topCats = Object.entries(catMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(e => e[0]);

        // Calculate top languages
        const langMap: Record<string, number> = {};
        distDocs.forEach(d => {
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
          ...dist,
          total_documents: totalDocs,
          completed_documents: completedDocs,
          public_documents: publicDocs,
          oldest_year: oldest,
          newest_year: newest,
          average_ocr_confidence: parseFloat(avgConf.toFixed(4)),
          top_categories: topCats,
          top_languages: topLangs
        };
      }
    });

    return NextResponse.json({
      success: true,
      isDemo: isDbEmpty,
      districts: districtsData
    });

  } catch (error) {
    console.error('GET Districts API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to aggregate district statistics' }, { status: 500 });
  }
}
