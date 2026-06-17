-- ============================================================
-- FEATURE 4: ADVANCED DOCUMENT VIEWER (BOOKMARKS & NOTES)
-- ============================================================

-- 1. Create bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  archive_id uuid REFERENCES public.archives(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT bookmarks_target_check CHECK (num_nonnulls(document_id, archive_id) = 1)
);

-- 2. Create document_notes table
CREATE TABLE IF NOT EXISTS public.document_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  archive_id uuid REFERENCES public.archives(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT document_notes_target_check CHECK (num_nonnulls(document_id, archive_id) = 1)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_notes ENABLE ROW LEVEL SECURITY;

-- 4. Create bookmarks policies
DROP POLICY IF EXISTS "Users can manage own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all bookmarks" ON public.bookmarks;
CREATE POLICY "Admins can view all bookmarks" ON public.bookmarks
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- 5. Create document_notes policies
DROP POLICY IF EXISTS "Users can manage own notes" ON public.document_notes;
CREATE POLICY "Users can manage own notes" ON public.document_notes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all notes" ON public.document_notes;
CREATE POLICY "Admins can view all notes" ON public.document_notes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- 6. Trigger for updating updated_at on document_notes
DROP TRIGGER IF EXISTS update_document_notes_updated_at ON public.document_notes;
CREATE TRIGGER update_document_notes_updated_at
  BEFORE UPDATE ON public.document_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Partial Unique Indexes for bookmarks
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_user_doc_unique 
  ON public.bookmarks(user_id, document_id) 
  WHERE document_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_user_archive_unique 
  ON public.bookmarks(user_id, archive_id) 
  WHERE archive_id IS NOT NULL;

-- 8. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_document_notes_user_id ON public.document_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_document_notes_document_id ON public.document_notes(document_id);
CREATE INDEX IF NOT EXISTS idx_document_notes_archive_id ON public.document_notes(archive_id);
