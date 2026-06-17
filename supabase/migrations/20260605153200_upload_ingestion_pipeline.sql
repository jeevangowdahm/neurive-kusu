-- ============================================================
-- SAFE MIGRATION: UPLOAD & AI INGESTION PIPELINE SCHEMAS
-- ============================================================

-- 1. Enable pgvector Extension if not already active
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create documents table (Primary Ledger)
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  district text,
  category text,
  language text,
  year integer,
  file_url text,
  file_type text,
  status text DEFAULT 'Uploaded',
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'restricted')),
  summary text,
  keywords text[] DEFAULT '{}',
  ocr_confidence numeric DEFAULT 0.0,
  page_count integer DEFAULT 1,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Create processing_jobs table (Ingestion State Machine)
CREATE TABLE IF NOT EXISTS public.processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  status text NOT NULL,
  progress integer DEFAULT 0,
  current_step text,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 4. Create document_pages table (Page OCR data mapping)
CREATE TABLE IF NOT EXISTS public.document_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  extracted_text text,
  ocr_confidence numeric,
  image_url text
);

-- 5. Safe ALTER TABLE on document_chunks (adding fields without breaking old code)
DO $$
BEGIN
  -- Check and add document_id if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='document_chunks' AND column_name='document_id') THEN
    ALTER TABLE public.document_chunks ADD COLUMN document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE;
  END IF;

  -- Check and add page_number if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='document_chunks' AND column_name='page_number') THEN
    ALTER TABLE public.document_chunks ADD COLUMN page_number integer;
  END IF;

  -- Check and add chunk_text if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='document_chunks' AND column_name='chunk_text') THEN
    ALTER TABLE public.document_chunks ADD COLUMN chunk_text text;
  END IF;

  -- Check and add embedding if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='document_chunks' AND column_name='embedding') THEN
    ALTER TABLE public.document_chunks ADD COLUMN embedding vector(1536);
  END IF;
END $$;

-- 6. Safe ALTER TABLE on entities (adding fields without breaking old code)
DO $$
BEGIN
  -- Check and add document_id if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='entities' AND column_name='document_id') THEN
    ALTER TABLE public.entities ADD COLUMN document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE;
  END IF;

  -- Check and add entity_name if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='entities' AND column_name='entity_name') THEN
    ALTER TABLE public.entities ADD COLUMN entity_name text;
  END IF;

  -- Check and add page_number if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='entities' AND column_name='page_number') THEN
    ALTER TABLE public.entities ADD COLUMN page_number integer;
  END IF;

  -- Check and add confidence_score if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='entities' AND column_name='confidence_score') THEN
    ALTER TABLE public.entities ADD COLUMN confidence_score numeric;
  END IF;
END $$;

-- 7. Updated At Trigger Function for documents table
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Supabase Storage Bucket setup
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('archive-documents', 'archive-documents', true, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/tiff', 'image/tif'])
ON CONFLICT (id) DO NOTHING;

-- 9. Row Level Security Activation
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_pages ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for documents table
-- Admin policy: full access
DROP POLICY IF EXISTS "Admins can manage all documents" ON public.documents;
CREATE POLICY "Admins can manage all documents" ON public.documents
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Archivist policy: upload and manage own records
DROP POLICY IF EXISTS "Archivists can manage own documents" ON public.documents;
CREATE POLICY "Archivists can manage own documents" ON public.documents
FOR ALL TO authenticated
USING (
  uploaded_by = auth.uid() 
  AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'archivist')
)
WITH CHECK (
  uploaded_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'archivist')
);

-- Researcher policy: view completed public records OR any of their own records
DROP POLICY IF EXISTS "Researchers can view public or own documents" ON public.documents;
CREATE POLICY "Researchers can view public or own documents" ON public.documents
FOR SELECT TO authenticated
USING (
  (uploaded_by = auth.uid())
  OR (visibility = 'public' AND (status = 'Completed' OR status = 'active'))
);

-- Guest/Public policy: view completed public records only
DROP POLICY IF EXISTS "Guests can only view public completed records" ON public.documents;
CREATE POLICY "Guests can only view public completed records" ON public.documents
FOR SELECT TO anon, authenticated
USING (visibility = 'public' AND (status = 'Completed' OR status = 'active'));


-- 11. RLS Policies for processing_jobs
ALTER TABLE public.processing_jobs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage processing jobs" ON public.processing_jobs;
CREATE POLICY "Admins can manage processing jobs" ON public.processing_jobs
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

DROP POLICY IF EXISTS "Users can read own processing jobs" ON public.processing_jobs;
CREATE POLICY "Users can read own processing jobs" ON public.processing_jobs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = processing_jobs.document_id
    AND (d.uploaded_by = auth.uid() OR d.visibility = 'public')
  )
);

DROP POLICY IF EXISTS "Archivists can insert own processing jobs" ON public.processing_jobs;
CREATE POLICY "Archivists can insert own processing jobs" ON public.processing_jobs
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = processing_jobs.document_id
    AND d.uploaded_by = auth.uid()
  )
);


-- 12. RLS Policies for document_pages, document_chunks, entities
DROP POLICY IF EXISTS "Users can read document pages" ON public.document_pages;
CREATE POLICY "Users can read document pages" ON public.document_pages
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_pages.document_id
    AND (d.uploaded_by = auth.uid() OR d.visibility = 'public')
  )
);

DROP POLICY IF EXISTS "Admins/Archivists can write document pages" ON public.document_pages;
CREATE POLICY "Admins/Archivists can write document pages" ON public.document_pages
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_pages.document_id
    AND (d.uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'))
  )
);


-- 13. Supabase Storage Policies for archive-documents
DROP POLICY IF EXISTS "Storage read policy" ON storage.objects;
CREATE POLICY "Storage read policy" ON storage.objects
FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'archive-documents'
  AND (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
    OR (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'archivist') AND owner = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.documents d 
      WHERE d.file_url LIKE '%' || name 
      AND (d.status = 'Completed' OR d.status = 'active')
      AND d.visibility = 'public'
    )
  )
);

DROP POLICY IF EXISTS "Storage upload policy" ON storage.objects;
CREATE POLICY "Storage upload policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'archive-documents'
  AND (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
    OR (
      EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'archivist')
      AND (owner = auth.uid() OR auth.uid()::text = split_part(name, '/', 1))
    )
  )
);

DROP POLICY IF EXISTS "Storage update policy" ON storage.objects;
CREATE POLICY "Storage update policy" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'archive-documents'
  AND (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
    OR (
      EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'archivist')
      AND owner = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Storage delete policy" ON storage.objects;
CREATE POLICY "Storage delete policy" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'archive-documents'
  AND (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
    OR (
      EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'archivist')
      AND owner = auth.uid()
    )
  )
);


-- 14. Enable Supabase Realtime for processing_jobs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'processing_jobs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.processing_jobs;
  END IF;
END $$;


-- 15. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_district ON public.documents(district);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_language ON public.documents(language);
CREATE INDEX IF NOT EXISTS idx_documents_year ON public.documents(year);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_document_id ON public.processing_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_entities_document_id ON public.entities(document_id);

-- Check and create vector index if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_document_chunks_embedding' AND n.nspname = 'public') THEN
    CREATE INDEX idx_document_chunks_embedding ON public.document_chunks USING ivfflat (embedding vector_cosine_ops);
  END IF;
END $$;
