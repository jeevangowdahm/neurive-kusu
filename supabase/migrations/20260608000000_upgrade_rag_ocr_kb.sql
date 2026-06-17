-- ============================================================
-- SAFE MIGRATION: RAG, OCR, & KNOWLEDGE GRAPH UPGRADES
-- ============================================================

-- 1. Safely add columns to document_pages
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='document_pages' AND column_name='corrected_text') THEN
    ALTER TABLE public.document_pages ADD COLUMN corrected_text text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='document_pages' AND column_name='correction_status') THEN
    ALTER TABLE public.document_pages ADD COLUMN correction_status text DEFAULT 'raw' CHECK (correction_status IN ('raw', 'reviewed', 'corrected'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='document_pages' AND column_name='reviewed_by') THEN
    ALTER TABLE public.document_pages ADD COLUMN reviewed_by uuid;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='document_pages' AND column_name='reviewed_at') THEN
    ALTER TABLE public.document_pages ADD COLUMN reviewed_at timestamptz;
  END IF;
END $$;

-- 2. Safely add columns to document_chunks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='document_chunks' AND column_name='embedding_model') THEN
    ALTER TABLE public.document_chunks ADD COLUMN embedding_model text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='document_chunks' AND column_name='embedding_dimension') THEN
    ALTER TABLE public.document_chunks ADD COLUMN embedding_dimension integer;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='document_chunks' AND column_name='embedding_status') THEN
    ALTER TABLE public.document_chunks ADD COLUMN embedding_status text DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'generated', 'failed'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='document_chunks' AND column_name='embedding_error') THEN
    ALTER TABLE public.document_chunks ADD COLUMN embedding_error text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='document_chunks' AND column_name='token_count') THEN
    ALTER TABLE public.document_chunks ADD COLUMN token_count integer;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='document_chunks' AND column_name='chunk_quality_score') THEN
    ALTER TABLE public.document_chunks ADD COLUMN chunk_quality_score numeric;
  END IF;
END $$;

-- 3. Safely add archival metadata to documents (Primary Ledger)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='archive_source') THEN
    ALTER TABLE public.documents ADD COLUMN archive_source text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='preservation_status') THEN
    ALTER TABLE public.documents ADD COLUMN preservation_status text DEFAULT 'excellent' CHECK (preservation_status IN ('excellent', 'good', 'fair', 'poor', 'critical'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='source_reliability_score') THEN
    ALTER TABLE public.documents ADD COLUMN source_reliability_score numeric DEFAULT 1.0 CHECK (source_reliability_score >= 0.0 AND source_reliability_score <= 1.0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='catalog_reference') THEN
    ALTER TABLE public.documents ADD COLUMN catalog_reference text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='collection_name') THEN
    ALTER TABLE public.documents ADD COLUMN collection_name text;
  END IF;
END $$;

-- 4. Safely add archival metadata to archives (Legacy Sync Table)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='archives' AND column_name='archive_source') THEN
    ALTER TABLE public.archives ADD COLUMN archive_source text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='archives' AND column_name='preservation_status') THEN
    ALTER TABLE public.archives ADD COLUMN preservation_status text DEFAULT 'excellent';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='archives' AND column_name='source_reliability_score') THEN
    ALTER TABLE public.archives ADD COLUMN source_reliability_score numeric DEFAULT 1.0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='archives' AND column_name='catalog_reference') THEN
    ALTER TABLE public.archives ADD COLUMN catalog_reference text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='archives' AND column_name='collection_name') THEN
    ALTER TABLE public.archives ADD COLUMN collection_name text;
  END IF;
END $$;
