import { supabase } from '@/lib/supabase';

export interface RetrievalFilters {
  category?: string;
  district?: string;
  language?: string;
  yearFrom?: number;
  yearTo?: number;
  ocrConfidence?: number;
  docType?: string;
  visibility?: 'public' | 'private' | 'restricted';
  entityType?: string;
  sourceType?: string;
  ocrQuality?: string;
}

export interface RetrievalResult {
  documentId: string;
  title: string;
  summary: string;
  matchedSnippet: string;
  pageNumber: number;
  district: string;
  category: string;
  language: string;
  year: number;
  fileType: string;
  ocrConfidence: number;
  semanticScore: number;
  keywordScore: number;
  metadataScore: number;
  entityScore: number;
  finalScore: number;
  whyThisResult: string;
  sourceType?: string;
  sourceName?: string;
  sourceUrl?: string;
  sourceLicense?: string;
  sourceAttribution?: string;
  sourceIsReal?: boolean;
  retrievalDate?: string;
}

export class RetrievalService {
  /**
   * Regional spelling expansion map for Karnataka historical names
   */
  private static EXPANSION_MAP: Record<string, string[]> = {
    mysore: ['mysuru', 'ಮೈಸೂರು'],
    mysuru: ['mysore', 'ಮೈಸೂರು'],
    bangalore: ['bengaluru', 'ಬೆಂಗಳೂರು'],
    bengaluru: ['bangalore', 'ಬೆಂಗಳೂರು'],
    tumkur: ['tumakuru', 'ತುಮಕೂರು'],
    tumakuru: ['tumkur', 'ತುಮಕೂರು'],
    bijapur: ['vijayapura', 'ವಿಜಯಪುರ'],
    vijayapura: ['bijapur', 'ವಿಜಯಪುರ'],
    gulbarga: ['kalaburagi', 'ಕಲಬುರಗಿ'],
    kalaburagi: ['gulbarga', 'ಕಲಬುರಗಿ'],
    bellary: ['ballari', 'ಬಳ್ಳಾರಿ'],
    ballari: ['bellary', 'ಬಳ್ಳಾರಿ'],
    shimoga: ['shivamogga', 'ಶಿವಮೊಗ್ಗ'],
    shivamogga: ['shimoga', 'ಶಿವಮೊಗ್ಗ'],
  };

  /**
   * Expand user query to include regional and historical synonyms
   */
  static expandQuery(query: string): { expandedQuery: string; terms: string[] } {
    const terms = query.toLowerCase().split(/\s+/).map(t => t.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')).filter(Boolean);
    const expandedTerms = new Set<string>(terms);

    terms.forEach(term => {
      if (this.EXPANSION_MAP[term]) {
        this.EXPANSION_MAP[term].forEach(syn => expandedTerms.add(syn));
      }
    });

    const termArr = Array.from(expandedTerms);
    return {
      expandedQuery: termArr.join(' '),
      terms: termArr,
    };
  }

  /**
   * Performs hybrid database retrieval with access controls
   */
  static async retrieveRelevantChunks(
    query: string,
    queryEmbedding: number[] | null,
    filters: RetrievalFilters,
    userRole: 'admin' | 'archivist' | 'researcher' | 'user' | 'guest' = 'guest',
    userId?: string,
    limit: number = 8
  ): Promise<RetrievalResult[]> {
    const { expandedQuery } = this.expandQuery(query);

    // Enforce role-based access rules:
    // - Guest/User: can see public completed records only
    // - Researcher: can see public and restricted completed records
    // - Archivist/Admin: can see everything (public, restricted, private)
    let allowedVisibility: string[] = ['public'];
    if (userRole === 'researcher') {
      allowedVisibility = ['public', 'restricted'];
    } else if (userRole === 'admin' || userRole === 'archivist') {
      allowedVisibility = ['public', 'restricted', 'private'];
    }

    try {
      // Execute database-level hybrid_search RPC
      const { data, error } = await supabase.rpc('hybrid_search', {
        search_query: expandedQuery,
        query_embedding: queryEmbedding,
        district_filter: filters.district || null,
        category_filter: filters.category || null,
        language_filter: filters.language || null,
        year_from: filters.yearFrom ? parseInt(filters.yearFrom.toString()) : null,
        year_to: filters.yearTo ? parseInt(filters.yearTo.toString()) : null,
        min_ocr_confidence: filters.ocrConfidence ? parseFloat(filters.ocrConfidence.toString()) : null,
        file_type_filter: filters.docType || null,
        visibility_filter: null, // we filter this after retrieval or let RPC do it
        entity_type_filter: filters.entityType || null,
        source_type_filter: filters.sourceType || null,
        ocr_quality_filter: filters.ocrQuality || null,
        limit_count: limit * 2, // retrieve extra for access control filtering
      });

      if (error) throw error;

      // Filter based on allowed visibility
      const rawResults = data || [];
      const filteredResults = rawResults.filter((row: any) => {
        return allowedVisibility.includes(row.visibility || 'public');
      });

      return filteredResults.slice(0, limit).map((row: any) => ({
        documentId: row.document_id,
        title: row.title,
        summary: row.summary,
        matchedSnippet: row.matched_snippet,
        pageNumber: row.page_number || 1,
        district: row.district,
        category: row.category,
        language: row.language,
        year: row.year,
        fileType: row.file_type,
        ocrConfidence: parseFloat(row.ocr_confidence || 0.0),
        semanticScore: parseFloat(row.semantic_score || 0.0),
        keywordScore: parseFloat(row.keyword_score || 0.0),
        metadataScore: parseFloat(row.metadata_score || 0.0),
        entityScore: parseFloat(row.entity_score || 0.0),
        finalScore: parseFloat(row.final_score || 0.0),
        whyThisResult: row.why_this_result,
        sourceType: row.source_type || 'uploaded',
        sourceName: row.source_name || null,
        sourceUrl: row.source_url || null,
        sourceLicense: row.source_license || null,
        sourceAttribution: row.source_attribution || null,
        sourceIsReal: row.source_is_real || false,
        retrievalDate: row.retrieval_date || null
      }));

    } catch (rpcErr) {
      console.warn('Database hybrid_search RPC failed, falling back to local keyword + metadata search:', rpcErr);
      return this.fallbackKeywordRetrieval(expandedQuery, filters, allowedVisibility, limit);
    }
  }

  /**
   * Fallback retrieval logic when the vector search / pgvector throws errors
   */
  private static async fallbackKeywordRetrieval(
    expandedQuery: string,
    filters: RetrievalFilters,
    allowedVisibility: string[],
    limit: number
  ): Promise<RetrievalResult[]> {
    try {
      // Direct supabase SELECT query with keyword filtering
      let dbQuery = supabase
        .from('documents')
        .select('id, title, description, summary, district, category, language, year, file_type, ocr_confidence, visibility, source_type, source_name, source_url, source_license, source_attribution, source_is_real, retrieval_date')
        .in('visibility', allowedVisibility)
        .in('status', ['Completed', 'active']);

      if (filters.district) dbQuery = dbQuery.eq('district', filters.district);
      if (filters.category) dbQuery = dbQuery.eq('category', filters.category);
      if (filters.language) dbQuery = dbQuery.eq('language', filters.language);
      if (filters.yearFrom) dbQuery = dbQuery.gte('year', filters.yearFrom);
      if (filters.yearTo) dbQuery = dbQuery.lte('year', filters.yearTo);

      const { data, error } = await dbQuery.limit(limit * 2);
      if (error) throw error;

      const results = (data || []).map((doc: any) => {
        // Calculate a simple keyword score based on matches
        const terms = expandedQuery.toLowerCase().split(/\s+/);
        const titleMatches = terms.filter(t => doc.title.toLowerCase().includes(t)).length;
        const descMatches = terms.filter(t => (doc.summary || doc.description || '').toLowerCase().includes(t)).length;
        
        const keywordScore = Math.min(1.0, (titleMatches * 0.4 + descMatches * 0.2));
        const metadataScore = filters.district || filters.category ? 1.0 : 0.2;
        const finalScore = parseFloat((0.6 * keywordScore + 0.4 * metadataScore).toFixed(4));

        return {
          documentId: doc.id,
          title: doc.title,
          summary: doc.summary || doc.description || '',
          matchedSnippet: doc.summary || doc.description || 'Archive entry.',
          pageNumber: 1,
          district: doc.district || 'Karnataka',
          category: doc.category || 'Archive',
          language: doc.language || 'english',
          year: doc.year || 2024,
          fileType: doc.file_type || 'pdf',
          ocrConfidence: parseFloat(doc.ocr_confidence || 0.0),
          semanticScore: 0.0, 
          keywordScore,
          metadataScore,
          entityScore: 0.0,
          finalScore,
          whyThisResult: `Fallback keyword match with ${Math.round(keywordScore * 100)}% query alignment.`,
          sourceType: doc.source_type || 'uploaded',
          sourceName: doc.source_name || null,
          sourceUrl: doc.source_url || null,
          sourceLicense: doc.source_license || null,
          sourceAttribution: doc.source_attribution || null,
          sourceIsReal: doc.source_is_real || false,
          retrievalDate: doc.retrieval_date || null
        };
      });

      return results
        .filter(r => r.finalScore > 0)
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, limit);

    } catch (err) {
      console.error('All retrieval fallbacks failed:', err);
      return [];
    }
  }
}
