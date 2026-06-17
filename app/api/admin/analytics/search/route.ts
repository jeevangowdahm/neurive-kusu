import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();

  try {
    // 1. Authenticate user and verify role server-side
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = profile?.role === 'admin' || 
                    ['jeevangowdahm65@gmail.com', 'jeevangowda082007@gmail.com', 'user@neurive.karnataka.gov.in', 'jeevangowdahm6@gmail.com'].includes(user.email || '');

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Access Denied' }, { status: 403 });
    }

    // 2. Query search logs
    let totalSearches = 0;
    let averageResponseTime = 0.0;
    let topQueries: { query: string; count: number }[] = [];
    let topDistrictsSearched: { name: string; count: number }[] = [];
    let topCategoriesSearched: { name: string; count: number }[] = [];
    let zeroResultSearches: { query: string; count: number }[] = [];
    let bestPerformingQueries: { query: string; response_time_ms: number }[] = [];
    let searchModeDistribution: { mode: string; count: number }[] = [];

    let isDbEmpty = false;

    try {
      const { data: logs, error: logsErr } = await supabase
        .from('search_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (logsErr) throw logsErr;

      if (logs && logs.length > 0) {
        totalSearches = logs.length;
        
        const responseTimes = logs.map(l => l.response_time_ms || 0).filter(t => t > 0);
        averageResponseTime = responseTimes.length > 0 
          ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length 
          : 0.0;

        // Group Top Queries
        const qMap: Record<string, number> = {};
        logs.forEach(l => {
          if (!l.query) return;
          const cleaned = l.query.trim().toLowerCase();
          qMap[cleaned] = (qMap[cleaned] || 0) + 1;
        });
        topQueries = Object.entries(qMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([query, count]) => ({ query, count }));

        // Group filters
        const distMap: Record<string, number> = {};
        const catMap: Record<string, number> = {};
        logs.forEach(l => {
          const filters = l.filters || {};
          if (filters.district) distMap[filters.district] = (distMap[filters.district] || 0) + 1;
          if (filters.category) catMap[filters.category] = (catMap[filters.category] || 0) + 1;
        });

        topDistrictsSearched = Object.entries(distMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, count]) => ({ name, count }));

        topCategoriesSearched = Object.entries(catMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, count]) => ({ name, count }));

        // Zero result searches
        const zeroLogs = logs.filter(l => l.result_count === 0 || l.results_count === 0);
        const zeroMap: Record<string, number> = {};
        zeroLogs.forEach(l => {
          if (!l.query) return;
          const q = l.query.trim().toLowerCase();
          zeroMap[q] = (zeroMap[q] || 0) + 1;
        });
        zeroResultSearches = Object.entries(zeroMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([query, count]) => ({ query, count }));

        // Best performing (fastest under average)
        bestPerformingQueries = logs
          .filter(l => l.response_time_ms && l.response_time_ms < averageResponseTime)
          .slice(0, 5)
          .map(l => ({ query: l.query, response_time_ms: l.response_time_ms }));

        // Search mode distribution (emulating based on search parameters)
        // Since pgvector is active when queryEmbedding is generated
        const modes = {
          'Hybrid Search (Vector + FTS)': 0,
          'Keyword Fallback (FTS)': 0,
          'Local Mock Fallback': 0,
          'Vector Semantic Search': 0
        };

        logs.forEach(l => {
          const filters = l.filters || {};
          if (filters.searchMode === 'semantic') modes['Vector Semantic Search']++;
          else if (filters.searchMode === 'fts') modes['Keyword Fallback (FTS)']++;
          else if (l.result_count === 0 || l.results_count === 0) modes['Local Mock Fallback']++;
          else modes['Hybrid Search (Vector + FTS)']++;
        });

        searchModeDistribution = Object.entries(modes)
          .filter(([_, count]) => count > 0)
          .map(([mode, count]) => ({ mode, count }));

        if (searchModeDistribution.length === 0) {
          searchModeDistribution = [
            { mode: 'Hybrid Search (Vector + FTS)', count: Math.floor(totalSearches * 0.7) },
            { mode: 'Keyword Fallback (FTS)', count: Math.floor(totalSearches * 0.2) },
            { mode: 'Local Mock Fallback', count: Math.floor(totalSearches * 0.1) }
          ];
        }
      } else {
        isDbEmpty = true;
      }
    } catch (err) {
      console.warn('Search logs DB queries failed, using mock data:', err);
      isDbEmpty = true;
    }

    if (isDbEmpty || totalSearches === 0) {
      // Mock search logs analytics data
      return NextResponse.json({
        success: true,
        isDemo: true,
        analytics: {
          total_searches: 2840,
          average_response_time: 48.2, // ms
          top_queries: [
            { query: 'land survey mysuru 1901', count: 184 },
            { query: 'court boundaries judgment belgaum', count: 142 },
            { query: 'temple grant inscriptions', count: 95 },
            { query: 'freedom struggle karnataka leaders', count: 76 },
            { query: 'tipu sultan family letters', count: 68 },
            { query: 'census dharwad 1921', count: 48 },
            { query: 'revenue settlement wodeyar', count: 32 }
          ],
          top_districts_searched: [
            { name: 'Mysuru', count: 642 },
            { name: 'Belagavi', count: 485 },
            { name: 'Bengaluru Urban', count: 320 },
            { name: 'Ballari', count: 215 },
            { name: 'Dharwad', count: 189 },
            { name: 'Mandya', count: 98 }
          ],
          top_categories_searched: [
            { name: 'Land Records', count: 954 },
            { name: 'Court Records', count: 620 },
            { name: 'Temple Records', count: 485 },
            { name: 'Revenue Records', count: 310 },
            { name: 'Gazetteers', count: 185 },
            { name: 'Maps & Surveys', count: 124 }
          ],
          zero_result_searches: [
            { query: 'famine reports gulbarga 1500 ce', count: 8 },
            { query: 'modern digital highways map 2026', count: 5 },
            { query: 'nuclear project report kaiga 1910', count: 3 }
          ],
          best_performing_queries: [
            { query: 'land records', response_time_ms: 12 },
            { query: 'mysore palace', response_time_ms: 15 },
            { query: 'court order', response_time_ms: 18 }
          ],
          search_mode_distribution: [
            { mode: 'Hybrid Search (Vector + FTS)', count: 1988 },
            { mode: 'Keyword Fallback (FTS)', count: 568 },
            { mode: 'Vector Semantic Search', count: 212 },
            { mode: 'Local Mock Fallback', count: 72 }
          ]
        }
      });
    }

    return NextResponse.json({
      success: true,
      isDemo: false,
      analytics: {
        total_searches: totalSearches,
        average_response_time: parseFloat(averageResponseTime.toFixed(2)),
        top_queries: topQueries,
        top_districts_searched: topDistrictsSearched,
        top_categories_searched: topCategoriesSearched,
        zero_result_searches: zeroResultSearches,
        best_performing_queries: bestPerformingQueries,
        search_mode_distribution: searchModeDistribution
      }
    });

  } catch (error) {
    console.error('GET Admin Search Analytics Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
