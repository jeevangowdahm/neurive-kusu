import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { expandQuery } from '@/lib/query-expansion';
import { generateMockArchive, getMockArchives, TOTAL_RECORDS } from '@/lib/mock-data';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { RetrievalService } from '@/lib/ai/retrieval-service';
import { RerankingService } from '@/lib/ai/reranking-service';
import { EmbeddingService } from '@/lib/ai/embedding-service';
import { getApiKeyForFeature } from '@/lib/ai/keys-config';
import { sanitizeString } from '@/lib/security/validation';

// ── Allowed values for enum-like filters (SQL injection guard) ──────────────
const ALLOWED_LANGUAGES = new Set(['kannada', 'english', 'both', 'sanskrit', 'persian', 'hindi']);
const ALLOWED_VISIBILITIES = new Set(['public', 'restricted', 'private']);
const ALLOWED_SOURCE_TYPES = new Set([
  'uploaded', 'government_pdf', 'internet_archive', 'wikipedia', 'wikisource', 'open_data', 'state_archives',
]);
const ALLOWED_OCR_QUALITIES = new Set(['high', 'medium', 'low']);

function sanitizeFilters(raw: any): SearchFilters {
  const f: SearchFilters = {};
  if (typeof raw.category === 'string')      f.category    = sanitizeString(raw.category).substring(0, 80);
  if (typeof raw.district === 'string')      f.district    = sanitizeString(raw.district).substring(0, 80);
  if (ALLOWED_LANGUAGES.has(raw.language))   f.language    = raw.language;
  if (typeof raw.yearFrom === 'number' && raw.yearFrom >= 0 && raw.yearFrom <= 2100)
    f.yearFrom = Math.floor(raw.yearFrom);
  if (typeof raw.yearTo === 'number' && raw.yearTo >= 0 && raw.yearTo <= 2100)
    f.yearTo = Math.floor(raw.yearTo);
  if (typeof raw.ocrConfidence === 'number') f.ocrConfidence = Math.max(0, Math.min(1, raw.ocrConfidence));
  if (typeof raw.docType === 'string')       f.docType     = sanitizeString(raw.docType).substring(0, 50);
  if (ALLOWED_VISIBILITIES.has(raw.visibility))  f.visibility = raw.visibility;
  if (typeof raw.entityType === 'string')    f.entityType  = sanitizeString(raw.entityType).substring(0, 50);
  if (typeof raw.uploadedAfter === 'string') f.uploadedAfter = raw.uploadedAfter.replace(/[^0-9T:.Z-]/g, '').substring(0, 25);
  if (typeof raw.uploadedBefore === 'string') f.uploadedBefore = raw.uploadedBefore.replace(/[^0-9T:.Z-]/g, '').substring(0, 25);
  if (ALLOWED_SOURCE_TYPES.has(raw.sourceType)) f.sourceType = raw.sourceType;
  if (ALLOWED_OCR_QUALITIES.has(raw.ocrQuality)) f.ocrQuality = raw.ocrQuality;
  return f;
}

interface SearchFilters {
  category?: string;
  district?: string;
  language?: string;
  yearFrom?: number;
  yearTo?: number;
  ocrConfidence?: number;
  docType?: string;
  visibility?: string;
  entityType?: string;
  uploadedAfter?: string;
  uploadedBefore?: string;
  sourceType?: string;
  ocrQuality?: string;
}

/**
 * Generate query vector embedding on the server side
 */
async function generateQueryEmbedding(
  query: string,
  apiKey: string,
  model: string = 'text-embedding-004',
  version: string = 'v1'
): Promise<number[] | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:embedContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${model}`,
        content: {
          parts: [{ text: query }],
        },
      }),
    });

    if (!res.ok) {
      console.warn(`Gemini embeddings API responded with status ${res.status}`);
      return null;
    }

    const json = await res.json();
    let embedding: number[] = json.embedding?.values || [];

    if (embedding.length === 0) return null;

    // If the embedding model does not return 1536 dimensions, keep semantic scoring in mock/fallback mode
    // (return null so query_embedding is null and pgvector won't throw a length mismatch error).
    if (embedding.length !== 1536) {
      console.warn(`Embedding model returned ${embedding.length} dimensions, but database expects 1536. Running semantic scoring in mock/fallback mode.`);
      return null;
    }

    return embedding;
  } catch (err) {
    console.error('Error generating query embedding on server:', err);
    return null;
  }
}

/**
 * Fallback local scoring engine to rank mock/demo records when database is empty or offline
 */
function getScoredMockResults(
  query: string,
  expandedTerms: string[],
  filters: SearchFilters,
  limit: number,
  page: number,
  userRole: 'admin' | 'archivist' | 'researcher' | 'user' | 'guest' = 'guest'
) {
  const offset = (Math.max(page, 1) - 1) * limit;
  
  let allowedVisibility = ['public'];
  if (userRole === 'researcher') {
    allowedVisibility = ['public', 'restricted'];
  } else if (userRole === 'admin' || userRole === 'archivist') {
    allowedVisibility = ['public', 'restricted', 'private'];
  }

  const pool = Array.from({ length: 100 }, (_, index) => generateMockArchive(index))
    .filter(archive => allowedVisibility.includes(archive.access_level || 'public'));

  const scored = pool
    .map((archive) => {
      // 1. Keyword score: matching words ratio in title & description
      const titleMatches = expandedTerms.filter(t => archive.title.toLowerCase().includes(t.toLowerCase())).length;
      const descMatches = expandedTerms.filter(t => (archive.description || '').toLowerCase().includes(t.toLowerCase())).length;
      const keyScore = Math.min(1.0, (titleMatches * 0.3 + descMatches * 0.1));

      // 2. Metadata score
      let metaScore = 0.0;
      if (
        filters.district && archive.district.name.toLowerCase().includes(filters.district.toLowerCase()) ||
        filters.category && archive.category.slug.toLowerCase().includes(filters.category.toLowerCase())
      ) {
        metaScore = 1.0;
      } else if (
        expandedTerms.some(t => archive.district.name.toLowerCase().includes(t.toLowerCase())) ||
        expandedTerms.some(t => archive.category.name.toLowerCase().includes(t.toLowerCase()))
      ) {
        metaScore = 0.8;
      }

      // 3. Entity score (mock entity mappings)
      const entScore = expandedTerms.some(t => 
        archive.title.toLowerCase().includes(t.toLowerCase()) || 
        (archive.description || '').toLowerCase().includes(t.toLowerCase())
      ) ? 0.6 : 0.0;

      // 4. Semantic score (mock semantic value)
      const semScore = keyScore > 0 ? parseFloat((0.4 + keyScore * 0.5).toFixed(2)) : 0.0;

      // 5. Final weighted score
      const finalScore = parseFloat(
        (0.40 * semScore + 0.30 * keyScore + 0.20 * metaScore + 0.10 * entScore).toFixed(4)
      );

      // Build matched text highlight snippet
      const matchedSnippet = archive.description || 'Archival land registry record cataloged in district vault.';

      return {
        document_id: archive.id,
        title: archive.title,
        summary: archive.description || 'Karnataka Archival Inscription',
        matched_snippet: matchedSnippet,
        page_number: 1,
        district: archive.district.name,
        category: archive.category.name,
        language: archive.language,
        year: archive.year,
        file_type: archive.file_type,
        ocr_confidence: archive.has_ocr ? 0.92 : 0.0,
        semantic_score: semScore,
        keyword_score: keyScore,
        metadata_score: metaScore,
        entity_score: entScore,
        final_score: finalScore,
        why_this_result: `This mock document matches ${Math.round(semScore * 100)}% semantically, contains keywords, and fits ${archive.district.name} district metadata.`
      };
    })
    .filter(r => r.final_score > 0)
    .sort((a, b) => b.final_score - a.final_score);

  // Apply filters to mock results
  let filtered = [...scored];
  if (filters.district) {
    filtered = filtered.filter(r => r.district.toLowerCase() === filters.district!.toLowerCase());
  }
  if (filters.category) {
    filtered = filtered.filter(r => r.category.toLowerCase().includes(filters.category!.toLowerCase()));
  }
  if (filters.language) {
    filtered = filtered.filter(r => r.language.toLowerCase() === filters.language!.toLowerCase());
  }
  if (filters.yearFrom) {
    filtered = filtered.filter(r => r.year >= filters.yearFrom!);
  }
  if (filters.yearTo) {
    filtered = filtered.filter(r => r.year <= filters.yearTo!);
  }

  return {
    results: filtered.slice(offset, offset + limit),
    total: filtered.length
  };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const supabase = createServerSupabaseClient();

  try {
    // Rate limit check
    const rateCheck = await checkRateLimit(req, { limit: 15, refillRate: 0.2 });
    if (!rateCheck.success) {
      return NextResponse.json({ success: false, error: 'Too many requests. Search API rate limit exceeded.' }, { status: 429 });
    }

    const body = await req.json();
    const { 
      query, 
      limit: rawLimit = 20, 
      page: rawPage = 1, 
      filters: rawFilters = {},
      model: rawModel = 'text-embedding-004',
      version: rawVersion = 'v1'
    } = body as {
      query: string;
      limit?: number;
      page?: number;
      filters?: Record<string, unknown>;
      model?: string;
      version?: string;
    };

    // ── Input sanitization (SQL/NoSQL injection & SSTI guard) ────────────────
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ success: false, error: 'Query parameter is required' }, { status: 400 });
    }
    if (query.length > 500) {
      return NextResponse.json({ success: false, error: 'Query too long (max 500 chars)' }, { status: 400 });
    }
    const safeQuery = sanitizeString(query.trim());
    const limit = Math.min(Math.max(1, Math.floor(Number(rawLimit) || 20)), 100);
    const page  = Math.max(1, Math.floor(Number(rawPage) || 1));
    const filters = sanitizeFilters(rawFilters);

    // Whitelist model & version (prevents injection via these params)
    const ALLOWED_MODELS_EMBED = new Set(['text-embedding-004', 'text-embedding-003']);
    const ALLOWED_VERSIONS_EMBED = new Set(['v1', 'v1beta']);
    const model = ALLOWED_MODELS_EMBED.has(rawModel) ? rawModel : 'text-embedding-004';
    const version = ALLOWED_VERSIONS_EMBED.has(rawVersion) ? rawVersion : 'v1';

    // 1. Query Expansion (Multilingual spellings & synonyms)
    const { expandedQuery, terms } = RetrievalService.expandQuery(safeQuery);

    // 2. Server-side Embedding Generation — key from server env only
    let queryEmbedding: number[] | null = null;
    const activeKey = getApiKeyForFeature('search');
    if (activeKey) {
      const embRes = await EmbeddingService.generateEmbedding(query, activeKey, model);
      if (embRes.status === 'generated') {
        queryEmbedding = embRes.embedding;
      }
    }

    // Get current user details and role
    const { data: { user } } = await supabase.auth.getUser();
    let userRole: 'admin' | 'archivist' | 'researcher' | 'user' | 'guest' = 'guest';
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.role) {
        userRole = profile.role as any;
      }
    }

    // 3. Query database using RetrievalService & RerankingService
    let searchResults: any[] = [];
    let totalResults = 0;
    let modeUsed = queryEmbedding ? 'Hybrid Search' : 'Keyword + Meta Fallback';
    let isMockMode = false;

    try {
      const retrieved = await RetrievalService.retrieveRelevantChunks(
        query,
        queryEmbedding,
        {
          district: filters.district,
          category: filters.category,
          language: filters.language,
          yearFrom: filters.yearFrom ? parseInt(filters.yearFrom.toString()) : undefined,
          yearTo: filters.yearTo ? parseInt(filters.yearTo.toString()) : undefined,
          ocrConfidence: filters.ocrConfidence ? parseFloat(filters.ocrConfidence.toString()) : undefined,
          docType: filters.docType,
          visibility: filters.visibility as any,
          entityType: filters.entityType,
          sourceType: filters.sourceType,
          ocrQuality: filters.ocrQuality
        },
        userRole,
        user?.id,
        limit
      );

      const reranked = RerankingService.rerank(
        retrieved,
        query,
        filters.district,
        filters.category
      );

      searchResults = reranked.map(item => ({
        document_id: item.documentId,
        title: item.title,
        summary: item.summary,
        matched_snippet: item.matchedSnippet,
        page_number: item.pageNumber,
        district: item.district,
        category: item.category,
        language: item.language,
        year: item.year,
        file_type: item.fileType,
        ocr_confidence: item.ocrConfidence,
        semantic_score: item.semanticScore,
        keyword_score: item.keywordScore,
        metadata_score: item.metadataScore,
        entity_score: item.entityScore,
        final_score: item.finalScore,
        why_this_result: item.whyThisResult,
        matched_entities: item.matchedEntities,
        source_type: item.sourceType || 'uploaded',
        source_name: item.sourceName || null,
        source_url: item.sourceUrl || null,
        source_license: item.sourceLicense || null,
        source_attribution: item.sourceAttribution || null,
        source_is_real: item.sourceIsReal || false,
        retrieval_date: item.retrievalDate || null
      }));
      totalResults = searchResults.length;

      // If no database hits, trigger local mock engine so demo doesn't show blank
      if (searchResults.length === 0) {
        const fallback = getScoredMockResults(safeQuery, terms, filters, limit, page, userRole);
        searchResults = fallback.results;
        totalResults = fallback.total;
        modeUsed = 'Local Mock Fallback';
        isMockMode = true;
      }
    } catch (dbErr) {
      console.warn('Database hybrid search RPC failed, falling back to mock engine:', dbErr);
      const fallback = getScoredMockResults(safeQuery, terms, filters, limit, page, userRole);
      searchResults = fallback.results;
      totalResults = fallback.total;
      modeUsed = 'Local Mock Fallback';
      isMockMode = true;
    }

    // 4. Save Search Logs (RLS compliant)
    const responseTime = Date.now() - startTime;
    const topScore = searchResults[0]?.final_score || 0.0;
    
    const { error: logError } = await supabase
      .from('search_logs')
      .insert([
        {
          user_id: user?.id || null,
          query: safeQuery,
          expanded_query: expandedQuery,
          filters: filters,
          result_count: totalResults,
          response_time_ms: responseTime,
          top_score: topScore
        }
      ]);

    if (logError) {
      console.warn('Failed to insert search log:', logError.message);
    }

    // 5. Aggregate Analytics details for dashboard
    const uniqueDistricts = Array.from(new Set(searchResults.map(r => r.district))).filter(Boolean);
    const matchedEntitiesCount = searchResults.filter(r => r.entity_score > 0).length;

    // 6. Interlinking: Fetch related entities for top results
    const topDocumentIds = searchResults.slice(0, 5).map(r => r.document_id).filter(Boolean);
    let relatedEntities: any[] = [];
    let relatedDistricts: any[] = [];
    let relatedCategories: any[] = [];
    
    if (topDocumentIds.length > 0) {
      try {
        // Fetch entities linked to top documents
        const { data: entityLinks } = await supabase
          .from('document_entity_links')
          .select('entity_id, mention_count, entities (id, name, entity_type, name_kannada)')
          .in('archive_id', topDocumentIds)
          .limit(10);
        
        relatedEntities = (entityLinks || []).map((link: any) => ({
          id: link.entities?.id,
          name: link.entities?.name,
          name_kannada: link.entities?.name_kannada,
          entity_type: link.entities?.entity_type,
          mention_count: link.mention_count
        })).filter((e: any) => e.id && e.name);

        // Fetch related districts from results
        const { data: districtData } = await supabase
          .from('districts')
          .select('id, name, name_kannada, division')
          .in('name', uniqueDistricts.slice(0, 5));
        relatedDistricts = districtData || [];

        // Fetch related categories from results
        const uniqueCategories = Array.from(new Set(searchResults.map(r => r.category))).filter(Boolean);
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id, name, name_kannada, slug, description')
          .in('name', uniqueCategories.slice(0, 5));
        relatedCategories = categoryData || [];
      } catch (interlinkErr) {
        console.warn('Failed to fetch interlinking data:', interlinkErr);
      }
    }

    // 7. Interlinking: Update popular queries
    try {
      await supabase
        .from('popular_queries')
        .upsert({
          query: safeQuery,
          query_normalized: safeQuery.toLowerCase().replace(/[^a-z0-9\s]/g, ''),
          search_count: 1,
          result_count: totalResults,
          avg_relevance_score: topScore
        }, {
          onConflict: 'query_normalized',
          ignoreDuplicates: false
        });
    } catch (popErr) {
      console.warn('Failed to update popular queries:', popErr);
    }

    return NextResponse.json({
      success: true,
      data: searchResults,
      meta: {
        total: totalResults,
        page,
        limit,
        response_time_ms: responseTime,
        search_mode: modeUsed,
        expanded_query: expandedQuery,
        top_score: topScore,
        districts_count: uniqueDistricts.length,
        entities_count: matchedEntitiesCount,
        is_mock: isMockMode
      },
      interlinking: {
        related_entities: relatedEntities,
        related_districts: relatedDistricts,
        related_categories: relatedCategories,
        suggested_features: [
          { name: 'knowledge_graph', label: 'Explore Knowledge Graph', icon: 'network' },
          { name: 'chat', label: 'Ask AI about results', icon: 'message' },
          { name: 'timeline', label: 'View Timeline', icon: 'calendar' }
        ]
      }
    });

  } catch (error) {
    console.error('Search API failure:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal Search Server Error' 
    }, { status: 500 });
  }
}
