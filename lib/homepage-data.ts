// Homepage Data Service - Fetches real data from Supabase for the homepage
import { createServerSupabaseClient } from './supabase-server';

export interface HomepageData {
  stats: {
    totalDocuments: number;
    totalDistricts: number;
    totalEntities: number;
    totalRelationships: number;
    totalCategories: number;
    totalTimelineEvents: number;
  };
  featuredDistricts: FeaturedDistrict[];
  featuredCategories: FeaturedCategory[];
  trendingSearches: TrendingSearch[];
  featuredDocument: FeaturedDocument | null;
  recentTimelineEvents: TimelineEvent[];
}

export interface FeaturedDistrict {
  id: string;
  name: string;
  nameKannada: string;
  division: string;
  documentCount: number;
  historicalSignificance: string;
  topEntities: string[];
  yearFrom: number;
  yearTo: number;
}

export interface FeaturedCategory {
  id: string;
  name: string;
  nameKannada: string;
  slug: string;
  documentCount: number;
  icon: string | null;
  color: string | null;
  description: string | null;
}

export interface TrendingSearch {
  query: string;
  searchCount: number;
  resultCount: number;
  avgRelevanceScore: number;
}

export interface FeaturedDocument {
  id: string;
  title: string;
  year: number | null;
  district: string | null;
  category: string | null;
  relevanceScore: number;
  viewCount: number;
  entityCount: number;
}

export interface TimelineEvent {
  id: string;
  title: string;
  eventDate: string;
  eventType: string;
  importance: number;
  entityName: string | null;
  entityType: string | null;
}

export async function getHomepageData(): Promise<HomepageData> {
  const supabase = createServerSupabaseClient();

  const [archivesResult, districtsResult, entitiesResult, relationshipsResult, categoriesResult, timelineResult] = await Promise.all([
    // Stats aggregation
    supabase.from('archives').select('id', { count: 'exact', head: true }),
    supabase.from('districts').select('id', { count: 'exact', head: true }),
    supabase.from('entities').select('id', { count: 'exact', head: true }),
    supabase.from('entity_relationships').select('id', { count: 'exact', head: true }),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('timeline_events').select('id', { count: 'exact', head: true }),
  ]);

  // Fetch featured districts (top 6 by document count)
  const { data: districtData } = await supabase
    .from('district_statistics')
    .select(`
      district_id,
      document_count,
      top_entities,
      year_range,
      districts (id, name, name_kannada, division, description)
    `)
    .order('document_count', { ascending: false })
    .limit(6);

  // Fetch featured categories (top 6 by document count)
  const { data: categoryData } = await supabase
    .from('category_statistics')
    .select(`
      category_id,
      document_count,
      categories (id, name, name_kannada, slug, icon, color, description)
    `)
    .order('document_count', { ascending: false })
    .limit(6);

  // Fetch trending searches
  const { data: searchData } = await supabase
    .from('popular_queries')
    .select('query, search_count, result_count, avg_relevance_score')
    .eq('featured', true)
    .order('search_count', { ascending: false })
    .limit(5);

  // Fetch featured document (highest relevance + view count)
  const { data: featuredDoc } = await supabase
    .from('archives')
    .select('id, title, year, relevance_score, view_count, entity_count, districts (name), categories (name)')
    .eq('status', 'active')
    .order('relevance_score', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch recent timeline events
  const { data: timelineData } = await supabase
    .from('timeline_events')
    .select(`
      id,
      title,
      event_date,
      event_type,
      importance,
      entities (name, entity_type)
    `)
    .order('importance', { ascending: false })
    .limit(5);

  return {
    stats: {
      totalDocuments: archivesResult.count || 0,
      totalDistricts: districtsResult.count || 0,
      totalEntities: entitiesResult.count || 0,
      totalRelationships: relationshipsResult.count || 0,
      totalCategories: categoriesResult.count || 0,
      totalTimelineEvents: timelineResult.count || 0,
    },
    featuredDistricts: (districtData || []).map((d: any) => ({
      id: d.districts?.id || d.district_id,
      name: d.districts?.name || 'Unknown',
      nameKannada: d.districts?.name_kannada || '',
      division: d.districts?.division || '',
      documentCount: d.document_count || 0,
      historicalSignificance: d.districts?.description || '',
      topEntities: d.top_entities || [],
      yearFrom: d.year_range?.from || 0,
      yearTo: d.year_range?.to || 0,
    })),
    featuredCategories: (categoryData || []).map((c: any) => ({
      id: c.categories?.id || c.category_id,
      name: c.categories?.name || 'Unknown',
      nameKannada: c.categories?.name_kannada || '',
      slug: c.categories?.slug || '',
      documentCount: c.document_count || 0,
      icon: c.categories?.icon || null,
      color: c.categories?.color || null,
      description: c.categories?.description || null,
    })),
    trendingSearches: (searchData || []).map((s: any) => ({
      query: s.query,
      searchCount: s.search_count || 0,
      resultCount: s.result_count || 0,
      avgRelevanceScore: s.avg_relevance_score || 0,
    })),
    featuredDocument: featuredDoc ? {
      id: featuredDoc.id,
      title: featuredDoc.title,
      year: featuredDoc.year,
      district: (featuredDoc.districts as any)?.name || null,
      category: (featuredDoc.categories as any)?.name || null,
      relevanceScore: featuredDoc.relevance_score || 0,
      viewCount: featuredDoc.view_count || 0,
      entityCount: featuredDoc.entity_count || 0,
    } : null,
    recentTimelineEvents: (timelineData || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      eventDate: t.event_date,
      eventType: t.event_type,
      importance: t.importance,
      entityName: (t.entities as any)?.name || null,
      entityType: (t.entities as any)?.entity_type || null,
    })),
  };
}
