import { createServerSupabaseClient } from './supabase-server';

export interface Recommendation {
  type: 'document' | 'entity' | 'district' | 'search' | 'chat';
  id: string;
  title: string;
  subtitle?: string;
  reason: string;
  score: number;
  href: string;
  image?: string;
  metadata?: Record<string, any>;
}

export async function getRecommendations(userId?: string, limit: number = 10): Promise<Recommendation[]> {
  const supabase = createServerSupabaseClient();
  const recommendations: Recommendation[] = [];

  try {
    // 1. Trending documents (always shown)
    const { data: trendingDocs } = await supabase
      .from('archives')
      .select('id, title, year, relevance_score, view_count, entity_count, districts (name), categories (name)')
      .eq('status', 'active')
      .order('relevance_score', { ascending: false })
      .limit(5);

    (trendingDocs || []).forEach((doc: any) => {
      recommendations.push({
        type: 'document',
        id: doc.id,
        title: doc.title,
        subtitle: `${doc.year || 'N/A'} · ${doc.districts?.name || 'Unknown district'}`,
        reason: 'Trending document',
        score: doc.relevance_score || 0,
        href: `/documents/${doc.id}`,
        metadata: { year: doc.year, district: doc.districts?.name, category: doc.categories?.name }
      });
    });

    // 2. Popular entities
    const { data: popularEntities } = await supabase
      .from('entities')
      .select('id, name, entity_type, name_kannada, description, entity_metadata')
      .order('created_at', { ascending: false })
      .limit(5);

    (popularEntities || []).forEach((entity: any) => {
      recommendations.push({
        type: 'entity',
        id: entity.id,
        title: entity.name,
        subtitle: entity.name_kannada || entity.entity_type,
        reason: 'Popular entity',
        score: 0.8,
        href: `/knowledge-graph?entity=${encodeURIComponent(entity.name)}`,
        metadata: { entity_type: entity.entity_type, ...entity.entity_metadata }
      });
    });

    // 3. Trending searches
    const { data: trendingSearches } = await supabase
      .from('popular_queries')
      .select('query, search_count, avg_relevance_score')
      .eq('featured', true)
      .order('search_count', { ascending: false })
      .limit(5);

    (trendingSearches || []).forEach((search: any) => {
      recommendations.push({
        type: 'search',
        id: search.query,
        title: search.query,
        subtitle: `${search.search_count} searches`,
        reason: 'Trending search',
        score: search.avg_relevance_score || 0,
        href: `/search?q=${encodeURIComponent(search.query)}`,
        metadata: { search_count: search.search_count }
      });
    });

    // 4. If user is logged in, add personalized recommendations
    if (userId) {
      // Get user's recent activity
      const { data: userActivity } = await supabase
        .from('user_activity_feed')
        .select('target_id, target_type, activity_type, metadata')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Find documents with similar entities to recently viewed
      const viewedDocIds = (userActivity || [])
        .filter((a: any) => a.activity_type === 'view' && a.target_type === 'archive')
        .map((a: any) => a.target_id);

      if (viewedDocIds.length > 0) {
        const { data: relatedLinks } = await supabase
          .from('document_entity_links')
          .select('entity_id, archive_id')
          .in('archive_id', viewedDocIds)
          .limit(20);

        const entityIds = [...new Set((relatedLinks || []).map((l: any) => l.entity_id))];

        if (entityIds.length > 0) {
          const { data: relatedDocs } = await supabase
            .from('document_entity_links')
            .select('archive_id, mention_count, entities (id, name)')
            .in('entity_id', entityIds)
            .not('archive_id', 'in', `(${viewedDocIds.join(',')})`)
            .limit(5);

          (relatedDocs || []).forEach((link: any) => {
            recommendations.push({
              type: 'document',
              id: link.archive_id,
              title: `Related to ${link.entities?.name || 'your interests'}`,
              reason: 'Based on your viewing history',
              score: 0.9,
              href: `/documents/${link.archive_id}`,
              metadata: { entity: link.entities?.name, mention_count: link.mention_count }
            });
          });
        }
      }
    }

    // Sort by score and deduplicate by ID
    const seen = new Set<string>();
    const unique = recommendations
      .sort((a, b) => b.score - a.score)
      .filter((rec) => {
        if (seen.has(rec.id)) return false;
        seen.add(rec.id);
        return true;
      });

    return unique.slice(0, limit);

  } catch (error) {
    console.error('Recommendations error:', error);
    return [];
  }
}
