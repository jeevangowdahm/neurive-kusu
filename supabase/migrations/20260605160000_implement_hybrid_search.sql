-- ============================================================
-- FEATURE 2: HYBRID SEARCH WITH EXPLAINABLE RESULTS SCHEMA
-- ============================================================

-- 1. Modify search_logs table for query expansion and analytics tracking
DO $$
BEGIN
  -- Add expanded_query if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='search_logs' AND column_name='expanded_query') THEN
    ALTER TABLE public.search_logs ADD COLUMN expanded_query text;
  END IF;

  -- Add top_score if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='search_logs' AND column_name='top_score') THEN
    ALTER TABLE public.search_logs ADD COLUMN top_score numeric;
  END IF;

  -- Add result_count if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='search_logs' AND column_name='result_count') THEN
    ALTER TABLE public.search_logs ADD COLUMN result_count integer;
  END IF;
END $$;

-- 2. Enable Row Level Security on search_logs
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for search_logs
DROP POLICY IF EXISTS "Users can read own search logs" ON public.search_logs;
CREATE POLICY "Users can read own search logs" ON public.search_logs
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all search logs" ON public.search_logs;
CREATE POLICY "Admins can read all search logs" ON public.search_logs
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

DROP POLICY IF EXISTS "Anyone can insert search logs" ON public.search_logs;
CREATE POLICY "Anyone can insert search logs" ON public.search_logs
FOR INSERT TO anon, authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);


-- 4. Create proper Full-Text Search and Performance Indexes
-- FTS Index for documents title, description, summary, keywords
CREATE INDEX IF NOT EXISTS idx_documents_fts ON public.documents USING gin(
  to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(summary, '') || ' ' || array_to_string(keywords, ' '))
);

-- FTS Index for document_pages.extracted_text
CREATE INDEX IF NOT EXISTS idx_document_pages_fts ON public.document_pages USING gin(
  to_tsvector('english', COALESCE(extracted_text, ''))
);

-- FTS Index for document_chunks.chunk_text
CREATE INDEX IF NOT EXISTS idx_document_chunks_fts ON public.document_chunks USING gin(
  to_tsvector('english', COALESCE(chunk_text, ''))
);

-- Index on entities.entity_name & type
CREATE INDEX IF NOT EXISTS idx_entities_name ON public.entities(entity_name);
CREATE INDEX IF NOT EXISTS idx_entities_type ON public.entities(entity_type);

-- Index on documents.visibility & created_at
CREATE INDEX IF NOT EXISTS idx_documents_visibility ON public.documents(visibility);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);


-- 5. Create hybrid_search RPC Function
-- Calculates hybrid scoring: 40% semantic, 30% keyword, 20% metadata, 10% entities
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
  why_this_result text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH chunk_matches AS (
    -- Get semantic scores per chunk
    SELECT 
      c.document_id,
      c.page_number,
      c.chunk_text,
      c.chunk_index,
      CASE 
        WHEN query_embedding IS NOT NULL AND c.embedding IS NOT NULL THEN
          -- pgvector cosine similarity calculation
          (1.0 - (c.embedding <=> query_embedding))::numeric
        ELSE 
          0.0::numeric
      END as raw_semantic_score
    FROM public.document_chunks c
  ),
  best_chunk_per_doc AS (
    -- deduplicate: pick the best matching chunk per document
    SELECT DISTINCT ON (c_matches.document_id)
      c_matches.document_id,
      c_matches.page_number,
      c_matches.chunk_text,
      c_matches.raw_semantic_score
    FROM chunk_matches c_matches
    ORDER BY c_matches.document_id, c_matches.raw_semantic_score DESC
  ),
  entity_matches AS (
    -- Count matching entities for each document
    SELECT 
      e.document_id,
      COUNT(*)::numeric as entity_count
    FROM public.entities e
    WHERE (e.entity_name ILIKE '%' || search_query || '%' OR search_query ILIKE '%' || e.entity_name || '%')
      AND (entity_type_filter IS NULL OR e.entity_type = entity_type_filter)
    GROUP BY e.document_id
  ),
  page_texts AS (
    -- Aggregate page texts to cover in FTS keyword matching
    SELECT 
      dp.document_id,
      string_agg(COALESCE(dp.extracted_text, ''), ' ') as agg_text
    FROM public.document_pages dp
    GROUP BY dp.document_id
  ),
  chunk_texts AS (
    -- Aggregate chunk texts to cover in FTS keyword matching
    SELECT 
      dc.document_id,
      string_agg(COALESCE(dc.chunk_text, ''), ' ') as agg_text
    FROM public.document_chunks dc
    GROUP BY dc.document_id
  ),
  entity_texts AS (
    -- Aggregate entity names to cover in FTS keyword matching
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
      
      -- 1. Semantic score (clamped)
      COALESCE(GREATEST(0.0, LEAST(1.0, bc.raw_semantic_score)), 0.0)::numeric as sem_score,
      
      -- 2. Keyword score (FTS ranking) covering all requested fields
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
      
      -- 3. Metadata score (relevance of metadata elements matching query terms)
      (CASE 
        WHEN d.district ILIKE '%' || search_query || '%' OR d.category ILIKE '%' || search_query || '%' OR d.language ILIKE '%' || search_query || '%' THEN 1.0
        WHEN search_query ILIKE '%' || d.district || '%' OR search_query ILIKE '%' || d.category || '%' OR search_query ILIKE '%' || d.language || '%' THEN 1.0
        ELSE 0.0
       END)::numeric as meta_score,
       
      -- 4. Entity score (normalized entity counts)
      COALESCE(GREATEST(0.0, LEAST(1.0, em.entity_count / (em.entity_count + 1.0))), 0.0)::numeric as ent_score,
      
      -- Combined matched snippet
      COALESCE(bc.chunk_text, SUBSTRING(d.description FROM 1 FOR 250)) as match_snippet,
      COALESCE(bc.page_number, 1) as page_num
      
    FROM public.documents d
    LEFT JOIN best_chunk_per_doc bc ON d.id = bc.document_id
    LEFT JOIN entity_matches em ON d.id = em.document_id
    LEFT JOIN page_texts pt ON d.id = pt.document_id
    LEFT JOIN chunk_texts ct ON d.id = ct.document_id
    LEFT JOIN entity_texts et ON d.id = et.document_id
    WHERE 
      -- Apply requested filters
      (district_filter IS NULL OR district_filter = '' OR d.district = district_filter)
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
      -- Status completed or active
      AND (d.status = 'Completed' OR d.status = 'active')
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
    
    -- final weighted score
    (0.40 * rd.sem_score + 0.30 * rd.key_score + 0.20 * rd.meta_score + 0.10 * rd.ent_score)::numeric as final_score,
    
    -- explanation placeholder (dynamic explanation can also be generated on the client side)
    (
      'This document matches ' || ROUND(rd.sem_score * 100) || '% semantically, has a keyword score of ' || 
      ROUND(rd.key_score * 100) || '%, belongs to ' || rd.doc_district || ' and fits the ' || rd.doc_category || ' category.'
    ) as why_this_result
    
  FROM ranked_docs rd
  ORDER BY final_score DESC
  LIMIT limit_count;
END;
$$;
