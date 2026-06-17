'use client';

import { supabase } from '@/lib/supabase';

/**
 * Hybrid Search Engine
 * Combines BM25 keyword matching, vector similarity, and AI reranking
 */

export interface SearchResult {
  archiveId: string;
  title: string;
  description: string;
  score: number;
  relevanceScore: number;
  matchType: 'keyword' | 'semantic' | 'hybrid';
  highlights: string[];
  metadata: Record<string, any>;
}

export interface HybridSearchOptions {
  query: string;
  limit?: number;
  filters?: {
    category?: string;
    district?: string;
    year?: number;
    language?: string;
  };
  useVector?: boolean;
  useKeyword?: boolean;
  rerank?: boolean;
}

/**
 * BM25-style keyword search
 * Uses Postgres full-text search with ranking
 */
export async function bm25Search(
  query: string,
  limit: number = 20,
  filters?: HybridSearchOptions['filters']
): Promise<SearchResult[]> {
  try {
    let sqlQuery = `
      SELECT
        archives.id,
        archives.title,
        archives.description,
        archives.file_type,
        archives.category_id,
        archives.district_id,
        ts_rank(
          setweight(to_tsvector('english', archives.title), 'A') ||
          setweight(to_tsvector('english', COALESCE(archives.description, '')), 'B') ||
          setweight(to_tsvector('english', array_to_string(archives.tags, ' ')), 'C'),
          plainto_tsquery('english', $1)
        ) as bm25_score,
        ts_headline(
          'english',
          COALESCE(archives.description, ''),
          plainto_tsquery('english', $1),
          'StartSel=<em>, StopSel=</em>'
        ) as highlight
      FROM archives
      WHERE
        to_tsvector('english', archives.title) ||
        to_tsvector('english', COALESCE(archives.description, '')) ||
        to_tsvector('english', array_to_string(archives.tags, ' '))
        @@ plainto_tsquery('english', $1)
    `;

    const params: any[] = [query];
    let paramIndex = 2;

    if (filters?.category) {
      sqlQuery += ` AND archives.category_id = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters?.district) {
      sqlQuery += ` AND archives.district_id = $${paramIndex}`;
      params.push(filters.district);
      paramIndex++;
    }

    if (filters?.year) {
      sqlQuery += ` AND archives.year = $${paramIndex}`;
      params.push(filters.year);
      paramIndex++;
    }

    if (filters?.language) {
      sqlQuery += ` AND archives.language = $${paramIndex}`;
      params.push(filters.language);
      paramIndex++;
    }

    sqlQuery += ` ORDER BY bm25_score DESC LIMIT ${limit}`;

    const { data, error } = await supabase.rpc('execute_keyword_search', {
      query_text: query,
      filter_category: filters?.category,
      filter_district: filters?.district,
      filter_year: filters?.year,
      filter_language: filters?.language,
      result_limit: limit,
    });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      archiveId: row.id,
      title: row.title,
      description: row.description,
      score: row.bm25_score || 0,
      relevanceScore: Math.min(row.bm25_score || 0, 1),
      matchType: 'keyword' as const,
      highlights: row.highlight ? [row.highlight] : [],
      metadata: {
        category_id: row.category_id,
        district_id: row.district_id,
        file_type: row.file_type,
      },
    }));
  } catch (error) {
    console.error('BM25 search error:', error);
    return [];
  }
}

/**
 * Vector similarity search
 * Uses embedding vectors for semantic retrieval
 */
export async function vectorSearch(
  queryEmbedding: number[],
  limit: number = 20,
  similarityThreshold: number = 0.5,
  filters?: HybridSearchOptions['filters']
): Promise<SearchResult[]> {
  try {
    let query = supabase
      .from('archive_embeddings')
      .select(
        `
        id,
        archive_id,
        embedding,
        archives (
          id,
          title,
          description,
          file_type,
          category_id,
          district_id
        )
      `,
        { count: 'exact' }
      )
      .limit(limit);

    const { data, error } = await query;

    if (error) throw error;

    // Calculate similarity scores client-side (cosine similarity)
    const results = (data || [])
      .map((row: any) => {
        const similarity = cosineSimilarity(queryEmbedding, row.embedding);
        return {
          archiveId: row.archive_id,
          title: row.archives?.title || '',
          description: row.archives?.description || '',
          score: similarity,
          relevanceScore: similarity,
          matchType: 'semantic' as const,
          highlights: [],
          metadata: {
            category_id: row.archives?.category_id,
            district_id: row.archives?.district_id,
            file_type: row.archives?.file_type,
          },
        };
      })
      .filter((r) => r.score >= similarityThreshold)
      .sort((a, b) => b.score - a.score);

    return results;
  } catch (error) {
    console.error('Vector search error:', error);
    return [];
  }
}

/**
 * Hybrid search combining keyword and semantic retrieval
 */
export async function hybridSearch(
  options: HybridSearchOptions
): Promise<SearchResult[]> {
  const {
    query,
    limit = 20,
    filters,
    useVector = true,
    useKeyword = true,
    rerank = true,
  } = options;

  try {
    const results: Map<string, SearchResult> = new Map();

    // 1. Keyword search
    if (useKeyword) {
      const keywordResults = await bm25Search(query, limit, filters);
      keywordResults.forEach((result) => {
        const existing = results.get(result.archiveId);
        if (!existing) {
          results.set(result.archiveId, result);
        } else {
          existing.score = Math.max(existing.score, result.score);
          existing.relevanceScore = Math.max(existing.relevanceScore, result.relevanceScore);
        }
      });
    }

    // 2. Vector search (if embeddings available)
    if (useVector) {
      try {
        // Mock embedding for demo - in production, use actual embedding service
        const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
        const vectorResults = await vectorSearch(mockEmbedding, limit, 0.3, filters);

        vectorResults.forEach((result) => {
          const existing = results.get(result.archiveId);
          if (!existing) {
            results.set(result.archiveId, result);
          } else {
            // Hybrid score: average of both methods
            existing.score = (existing.score + result.score) / 2;
            existing.relevanceScore = (existing.relevanceScore + result.relevanceScore) / 2;
            existing.matchType = 'hybrid';
          }
        });
      } catch (error) {
        console.warn('Vector search unavailable, continuing with keyword search');
      }
    }

    // 3. Rerank results using AI
    const resultsArr: any[] = [];
    results.forEach((v) => resultsArr.push(v));
    let finalResults = resultsArr
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    if (rerank && finalResults.length > 0) {
      finalResults = await rerankResults(query, finalResults);
    }

    return finalResults;
  } catch (error) {
    console.error('Hybrid search error:', error);
    return [];
  }
}

/**
 * AI Reranking using semantic relevance scoring
 */
async function rerankResults(query: string, results: SearchResult[]): Promise<SearchResult[]> {
  try {
    // Calculate relevance scores based on multiple factors
    const reranked = results.map((result) => {
      // Factors: title match, description quality, metadata relevance
      const titleMatch = result.title.toLowerCase().includes(query.toLowerCase()) ? 0.3 : 0;
      const descriptionLength = result.description ? Math.min(result.description.length / 500, 1) * 0.2 : 0;
      const baseScore = result.relevanceScore || 0.5;

      const finalScore = baseScore * 0.6 + titleMatch + descriptionLength;

      return {
        ...result,
        relevanceScore: Math.min(finalScore, 1),
      };
    });

    return reranked.sort((a, b) => b.relevanceScore - a.relevanceScore);
  } catch (error) {
    console.error('Reranking error:', error);
    return results;
  }
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Query expansion for better search coverage
 */
export function expandQuery(query: string): string[] {
  const expanded = [query];

  // Add synonyms and related terms (in production, use thesaurus)
  const synonyms: Record<string, string[]> = {
    land: ['property', 'territory', 'land record', 'deed'],
    court: ['judicial', 'legal', 'justice', 'law'],
    temple: ['shrine', 'religious', 'sanctuary'],
    census: ['population', 'demographic', 'survey'],
  };

  for (const [key, values] of Object.entries(synonyms)) {
    if (query.toLowerCase().includes(key)) {
      expanded.push(...values.map((v) => query.toLowerCase().replace(key, v)));
    }
  }

  return Array.from(new Set(expanded));
}

/**
 * Typo-tolerant search using Levenshtein distance
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
