import { NextRequest, NextResponse } from 'next/server';
import { getMockArchives } from '@/lib/mock-data';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const category = searchParams.get('category') || '';
  const district = searchParams.get('district') || '';
  const language = searchParams.get('language') || '';
  const yearFrom = parseInt(searchParams.get('year_from') || '0');
  const yearTo = parseInt(searchParams.get('year_to') || '9999');
  const offset = (Math.max(page, 1) - 1) * limit;

  try {
    const supabase = createServerSupabaseClient();

    let query = supabase
      .from('archives')
      .select(
        `
        *,
        categories (*),
        districts (*),
        departments (*)
      `,
        { count: 'exact' }
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      const { data: categoryRow } = await supabase
        .from('categories')
        .select('id')
        .or(`slug.eq.${category},id.eq.${category}`)
        .maybeSingle();
      if (categoryRow?.id) query = query.eq('category_id', categoryRow.id);
    }

    if (district) {
      const { data: districtRow } = await supabase
        .from('districts')
        .select('id')
        .or(`name.ilike.%${district}%,id.eq.${district}`)
        .maybeSingle();
      if (districtRow?.id) query = query.eq('district_id', districtRow.id);
    }

    if (language) query = query.eq('language', language);
    if (yearFrom > 0) query = query.gte('year', yearFrom);
    if (yearTo < 9999) query = query.lte('year', yearTo);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      meta: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
        source: 'supabase',
      },
    });
  } catch (error) {
    const { archives, total } = getMockArchives(page, limit);

    return NextResponse.json({
      success: true,
      data: archives,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        source: 'mock',
        warning: error instanceof Error ? error.message : 'Supabase query failed',
      },
    });
  }
}
