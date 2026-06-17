-- ============================================================
-- SAFE MIGRATION: ADD RETRIEVAL DATE & ENFORCE SEARCH FILTER
-- ============================================================

-- 1. Add retrieval_date to public.documents
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='retrieval_date') THEN
    ALTER TABLE public.documents ADD COLUMN retrieval_date timestamptz DEFAULT now();
  END IF;
END $$;

-- 2. Add retrieval_date to public.archives
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='archives' AND column_name='retrieval_date') THEN
    ALTER TABLE public.archives ADD COLUMN retrieval_date timestamptz DEFAULT now();
  END IF;
END $$;

-- 3. Add retrieval_date to public.real_source_ingestion_logs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='real_source_ingestion_logs' AND column_name='retrieval_date') THEN
    ALTER TABLE public.real_source_ingestion_logs ADD COLUMN retrieval_date timestamptz DEFAULT now();
  END IF;
END $$;

-- 4. Re-define hybrid_search to return retrieval_date, and filter karnataka_scope_status = 'verified'
DROP FUNCTION IF EXISTS public.hybrid_search(text, vector, text, text, text, integer, integer, numeric, text, text, text, timestamptz, timestamptz, text, text, integer);

CREATE OR REPLACE FUNCTION public.hybrid_search(
  search_query text,
  query_embedding vector(1536) DEFAULT NULL,
  district_filter text DEFAULT NULL,
  category_filter text DEFAULT NULL,
  language_filter text DEFAULT NULL,
  year_from integer DEFAULT NULL,
  year_to integer DEFAULT NULL,
  min_ocr_confidence numeric DEFAULT NULL,
  file_type_filter text DEFAULT NULL,
  visibility_filter text DEFAULT NULL,
  entity_type_filter text DEFAULT NULL,
  uploaded_after timestamptz DEFAULT NULL,
  uploaded_before timestamptz DEFAULT NULL,
  source_type_filter text DEFAULT NULL,
  ocr_quality_filter text DEFAULT NULL,
  limit_count integer DEFAULT 20
)
RETURNS TABLE (
  document_id uuid,
  title text,
  summary text,
  matched_snippet text,
  page_number integer,
  district text,
  category text,
  language text,
  year integer,
  file_type text,
  ocr_confidence numeric,
  semantic_score numeric,
  keyword_score numeric,
  metadata_score numeric,
  entity_score numeric,
  final_score numeric,
  why_this_result text,
  source_type text,
  source_name text,
  source_url text,
  source_license text,
  source_attribution text,
  source_is_real boolean,
  retrieval_date timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH chunk_matches AS (
    SELECT 
      c.document_id,
      c.page_number,
      c.chunk_text,
      c.chunk_index,
      CASE 
        WHEN query_embedding IS NOT NULL AND c.embedding IS NOT NULL THEN
          (1.0 - (c.embedding <=> query_embedding))::numeric
        ELSE 
          0.0::numeric
      END as raw_semantic_score
    FROM public.document_chunks c
  ),
  best_chunk_per_doc AS (
    SELECT DISTINCT ON (c_matches.document_id)
      c_matches.document_id,
      c_matches.page_number,
      c_matches.chunk_text,
      c_matches.raw_semantic_score
    FROM chunk_matches c_matches
    ORDER BY c_matches.document_id, c_matches.raw_semantic_score DESC
  ),
  entity_matches AS (
    SELECT 
      e.document_id,
      COUNT(*)::numeric as entity_count
    FROM public.entities e
    WHERE (e.entity_name ILIKE '%' || search_query || '%' OR search_query ILIKE '%' || e.entity_name || '%')
      AND (entity_type_filter IS NULL OR e.entity_type = entity_type_filter)
    GROUP BY e.document_id
  ),
  page_texts AS (
    SELECT 
      dp.document_id,
      string_agg(COALESCE(dp.extracted_text, ''), ' ') as agg_text
    FROM public.document_pages dp
    GROUP BY dp.document_id
  ),
  chunk_texts AS (
    SELECT 
      dc.document_id,
      string_agg(COALESCE(dc.chunk_text, ''), ' ') as agg_text
    FROM public.document_chunks dc
    GROUP BY dc.document_id
  ),
  entity_texts AS (
    SELECT 
      ent.document_id,
      string_agg(COALESCE(ent.entity_name, ''), ' ') as agg_text
    FROM public.entities ent
    GROUP BY ent.document_id
  ),
  ranked_docs AS (
    SELECT 
      d.id as doc_id,
      d.title,
      d.summary as doc_summary,
      d.description as doc_description,
      d.district as doc_district,
      d.category as doc_category,
      d.language as doc_language,
      d.year as doc_year,
      d.file_type as doc_file_type,
      d.ocr_confidence as doc_ocr_confidence,
      d.source_type as doc_source_type,
      d.source_name as doc_source_name,
      d.source_url as doc_source_url,
      d.source_license as doc_source_license,
      d.source_attribution as doc_source_attribution,
      d.source_is_real as doc_source_is_real,
      d.retrieval_date as doc_retrieval_date,
      
      COALESCE(GREATEST(0.0, LEAST(1.0, bc.raw_semantic_score)), 0.0)::numeric as sem_score,
      
      COALESCE(GREATEST(0.0, LEAST(1.0, 
        ts_rank_cd(
          to_tsvector('english', 
            d.title || ' ' || 
            COALESCE(d.description, '') || ' ' || 
            COALESCE(d.summary, '') || ' ' || 
            array_to_string(d.keywords, ' ') || ' ' ||
            COALESCE(pt.agg_text, '') || ' ' ||
            COALESCE(ct.agg_text, '') || ' ' ||
            COALESCE(et.agg_text, '') || ' ' ||
            COALESCE(d.district, '') || ' ' ||
            COALESCE(d.category, '') || ' ' ||
            COALESCE(d.language, '') || ' ' ||
            COALESCE(d.year::text, '')
          ),
          plainto_tsquery('english', search_query)
        )
      )), 0.0)::numeric as key_score,
      
      (CASE 
        WHEN d.district ILIKE '%' || search_query || '%' OR d.category ILIKE '%' || search_query || '%' OR d.language ILIKE '%' || search_query || '%' THEN 1.0
        WHEN search_query ILIKE '%' || d.district || '%' OR search_query ILIKE '%' || d.category || '%' OR search_query ILIKE '%' || d.language || '%' THEN 1.0
        ELSE 0.0
       END)::numeric as meta_score,
       
      COALESCE(GREATEST(0.0, LEAST(1.0, em.entity_count / (em.entity_count + 1.0))), 0.0)::numeric as ent_score,
      
      COALESCE(bc.chunk_text, SUBSTRING(d.description FROM 1 FOR 250)) as match_snippet,
      COALESCE(bc.page_number, 1) as page_num
      
    FROM public.documents d
    LEFT JOIN best_chunk_per_doc bc ON d.id = bc.document_id
    LEFT JOIN entity_matches em ON d.id = em.document_id
    LEFT JOIN page_texts pt ON d.id = pt.document_id
    LEFT JOIN chunk_texts ct ON d.id = ct.document_id
    LEFT JOIN entity_texts et ON d.id = et.document_id
    WHERE 
      -- Enforce Karnataka relevance: Only verified documents are searchable
      (d.karnataka_scope_status = 'verified')
      
      -- Apply filters
      AND (district_filter IS NULL OR district_filter = '' OR d.district = district_filter)
      AND (category_filter IS NULL OR category_filter = '' OR d.category = category_filter)
      AND (language_filter IS NULL OR language_filter = '' OR d.language = language_filter)
      AND (year_from IS NULL OR d.year >= year_from)
      AND (year_to IS NULL OR d.year <= year_to)
      AND (min_ocr_confidence IS NULL OR d.ocr_confidence >= min_ocr_confidence)
      AND (file_type_filter IS NULL OR file_type_filter = '' OR d.file_type = file_type_filter)
      AND (visibility_filter IS NULL OR visibility_filter = '' OR d.visibility = visibility_filter)
      AND (entity_type_filter IS NULL OR entity_type_filter = '' OR EXISTS (
        SELECT 1 FROM public.entities e2 
        WHERE e2.document_id = d.id AND e2.entity_type = entity_type_filter
      ))
      AND (uploaded_after IS NULL OR d.created_at >= uploaded_after)
      AND (uploaded_before IS NULL OR d.created_at <= uploaded_before)
      
      -- Real ingestion filters
      AND (source_type_filter IS NULL OR source_type_filter = '' OR d.source_type = source_type_filter)
      AND (ocr_quality_filter IS NULL OR ocr_quality_filter = '' OR (
        CASE
          WHEN ocr_quality_filter = 'high' THEN (d.ocr_confidence >= 85 OR (d.ocr_confidence >= 0.85 AND d.ocr_confidence <= 1.0))
          WHEN ocr_quality_filter = 'medium' THEN ((d.ocr_confidence >= 60 AND d.ocr_confidence < 85) OR (d.ocr_confidence >= 0.60 AND d.ocr_confidence < 0.85))
          WHEN ocr_quality_filter = 'low' THEN (d.ocr_confidence < 60 OR (d.ocr_confidence >= 0.0 AND d.ocr_confidence < 0.60))
          ELSE TRUE
        END
      ))
      
      -- Status check
      AND (d.status = 'Completed' OR d.status = 'active' OR d.status = 'Uploaded')
  )
  SELECT 
    rd.doc_id as document_id,
    rd.title,
    COALESCE(rd.doc_summary, rd.doc_description) as summary,
    rd.match_snippet as matched_snippet,
    rd.page_num as page_number,
    COALESCE(rd.doc_district, 'Karnataka') as district,
    COALESCE(rd.doc_category, 'Archive') as category,
    COALESCE(rd.doc_language, 'kannada') as language,
    rd.doc_year as year,
    rd.doc_file_type as file_type,
    COALESCE(rd.doc_ocr_confidence, 0.0) as ocr_confidence,
    rd.sem_score as semantic_score,
    rd.key_score as keyword_score,
    rd.meta_score as metadata_score,
    rd.ent_score as entity_score,
    
    (0.40 * rd.sem_score + 0.30 * rd.key_score + 0.20 * rd.meta_score + 0.10 * rd.ent_score)::numeric as final_score,
    
    (
      'This document matches ' || ROUND(rd.sem_score * 100) || '% semantically, has a keyword score of ' || 
      ROUND(rd.key_score * 100) || '%, belongs to ' || COALESCE(rd.doc_district, 'Karnataka') || ' and fits the ' || COALESCE(rd.doc_category, 'Archive') || ' category.'
    ) as why_this_result,
    
    rd.doc_source_type as source_type,
    rd.doc_source_name as source_name,
    rd.doc_source_url as source_url,
    rd.doc_source_license as source_license,
    rd.doc_source_attribution as source_attribution,
    rd.doc_source_is_real as source_is_real,
    rd.doc_retrieval_date as retrieval_date
    
  FROM ranked_docs rd
  ORDER BY final_score DESC
  LIMIT limit_count;
END;
$$;
