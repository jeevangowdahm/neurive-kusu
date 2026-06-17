-- ============================================================
-- SAFE MIGRATION: DEMO MODE FLAGS AND INDEXES
-- ============================================================

DO $$
BEGIN
  -- 1. Add is_demo column to public.documents table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'is_demo') THEN
      ALTER TABLE public.documents ADD COLUMN is_demo boolean DEFAULT false;
    END IF;
  END IF;

  -- 2. Add is_demo column to public.archives table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'archives') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'archives' AND column_name = 'is_demo') THEN
      ALTER TABLE public.archives ADD COLUMN is_demo boolean DEFAULT false;
    END IF;
  END IF;
END $$;

-- 3. Create indexes for demo filtering performance
CREATE INDEX IF NOT EXISTS idx_documents_is_demo ON public.documents(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_archives_is_demo ON public.archives(is_demo) WHERE is_demo = true;
