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
                    ['jeevangowdahm6@gmail.com', 'jeevangowda082007@gmail.com', 'user@neurive.karnataka.gov.in'].includes(user.email || '');

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Access Denied' }, { status: 403 });
    }

    // 2. Query evaluation tables
    let queries: any[] = [];
    let results: any[] = [];
    let isDbEmpty = false;

    try {
      const { data: dbQueries, error: qErr } = await supabase
        .from('evaluation_queries')
        .select('*')
        .order('created_at', { ascending: false });

      if (qErr) throw qErr;
      queries = dbQueries || [];

      const { data: dbResults, error: rErr } = await supabase
        .from('evaluation_results')
        .select(`
          *,
          evaluation_queries(query, category, district)
        `)
        .order('created_at', { ascending: false });

      if (rErr) throw rErr;
      results = dbResults || [];

      if (queries.length === 0) {
        isDbEmpty = true;
      }
    } catch (err) {
      console.warn('Evaluation tables DB query failed or table missing, using mock sets:', err);
      isDbEmpty = true;
    }

    if (isDbEmpty || queries.length === 0) {
      // Mock / fallback baseline evaluation queries & historical results
      const mockQueries = [
        { id: 'eq-1', query: 'Land survey records in Mysuru', expected_document_ids: ['demo-doc-land-records-mysuru-1', 'demo-doc-land-records-mysuru-2'], category: 'land-records', district: 'Mysuru', language: 'kannada' },
        { id: 'eq-2', query: 'Court judgment from Belagavi regarding boundaries', expected_document_ids: ['demo-doc-court-records-belagavi-1'], category: 'court-records', district: 'Belagavi', language: 'both' },
        { id: 'eq-3', query: 'Temple endowment grants and inscriptions in Hampi', expected_document_ids: ['demo-doc-temple-records-bellary-1'], category: 'temple-records', district: 'Ballari', language: 'kannada' },
        { id: 'eq-4', query: 'Gazetteer notifications for Bangalore Urban division', expected_document_ids: ['demo-doc-gazette-bangalore-1'], category: 'gazette-notifications', district: 'Bengaluru Urban', language: 'english' }
      ];

      const mockResults = [
        // Query 1 results
        { id: 'res-1', evaluation_query_id: 'eq-1', search_method: 'Keyword Search', precision_at_5: 0.60, recall_at_10: 0.50, mrr: 0.50, response_time_ms: 12, created_at: new Date(Date.now() - 1000 * 3600).toISOString(), evaluation_queries: { query: 'Land survey records in Mysuru', category: 'land-records', district: 'Mysuru' } },
        { id: 'res-2', evaluation_query_id: 'eq-1', search_method: 'Semantic Search', precision_at_5: 0.72, recall_at_10: 0.70, mrr: 0.75, response_time_ms: 28, created_at: new Date(Date.now() - 1000 * 3600).toISOString(), evaluation_queries: { query: 'Land survey records in Mysuru', category: 'land-records', district: 'Mysuru' } },
        { id: 'res-3', evaluation_query_id: 'eq-1', search_method: 'Hybrid Search', precision_at_5: 0.85, recall_at_10: 0.85, mrr: 0.82, response_time_ms: 38, created_at: new Date(Date.now() - 1000 * 3600).toISOString(), evaluation_queries: { query: 'Land survey records in Mysuru', category: 'land-records', district: 'Mysuru' } },
        { id: 'res-4', evaluation_query_id: 'eq-1', search_method: 'Hybrid + Entity Boost', precision_at_5: 0.92, recall_at_10: 0.95, mrr: 0.88, response_time_ms: 45, created_at: new Date(Date.now() - 1000 * 3600).toISOString(), evaluation_queries: { query: 'Land survey records in Mysuru', category: 'land-records', district: 'Mysuru' } },

        // Query 2 results
        { id: 'res-5', evaluation_query_id: 'eq-2', search_method: 'Keyword Search', precision_at_5: 0.55, recall_at_10: 0.50, mrr: 0.45, response_time_ms: 14, created_at: new Date(Date.now() - 1000 * 3600).toISOString(), evaluation_queries: { query: 'Court judgment from Belagavi regarding boundaries', category: 'court-records', district: 'Belagavi' } },
        { id: 'res-6', evaluation_query_id: 'eq-2', search_method: 'Semantic Search', precision_at_5: 0.75, recall_at_10: 0.75, mrr: 0.68, response_time_ms: 32, created_at: new Date(Date.now() - 1000 * 3600).toISOString(), evaluation_queries: { query: 'Court judgment from Belagavi regarding boundaries', category: 'court-records', district: 'Belagavi' } },
        { id: 'res-7', evaluation_query_id: 'eq-2', search_method: 'Hybrid Search', precision_at_5: 0.82, recall_at_10: 0.88, mrr: 0.78, response_time_ms: 40, created_at: new Date(Date.now() - 1000 * 3600).toISOString(), evaluation_queries: { query: 'Court judgment from Belagavi regarding boundaries', category: 'court-records', district: 'Belagavi' } },
        { id: 'res-8', evaluation_query_id: 'eq-2', search_method: 'Hybrid + Entity Boost', precision_at_5: 0.94, recall_at_10: 0.98, mrr: 0.89, response_time_ms: 48, created_at: new Date(Date.now() - 1000 * 3600).toISOString(), evaluation_queries: { query: 'Court judgment from Belagavi regarding boundaries', category: 'court-records', district: 'Belagavi' } }
      ];

      return NextResponse.json({
        success: true,
        isDemo: true,
        queries: mockQueries,
        results: mockResults
      });
    }

    return NextResponse.json({
      success: true,
      isDemo: false,
      queries,
      results
    });

  } catch (error) {
    console.error('GET Admin Testing Queries Detail Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
