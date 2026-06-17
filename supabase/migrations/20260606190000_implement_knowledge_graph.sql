-- ============================================================
-- FEATURE 5: KNOWLEDGE GRAPH & TIMELINE SCHEMA
-- ============================================================

-- 1. Create table if missing (prevents crash, keeps old data)
CREATE TABLE IF NOT EXISTS public.entity_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

-- 2. Add columns if they do not exist
ALTER TABLE public.entity_relationships ADD COLUMN IF NOT EXISTS source_entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE;
ALTER TABLE public.entity_relationships ADD COLUMN IF NOT EXISTS target_entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE;
ALTER TABLE public.entity_relationships ADD COLUMN IF NOT EXISTS source_document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE;
ALTER TABLE public.entity_relationships ADD COLUMN IF NOT EXISTS target_document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE;
ALTER TABLE public.entity_relationships ADD COLUMN IF NOT EXISTS relationship_type text;
ALTER TABLE public.entity_relationships ADD COLUMN IF NOT EXISTS relationship_strength numeric DEFAULT 1.0;
ALTER TABLE public.entity_relationships ADD COLUMN IF NOT EXISTS evidence_snippet text;
ALTER TABLE public.entity_relationships ADD COLUMN IF NOT EXISTS page_number integer;
ALTER TABLE public.entity_relationships ADD COLUMN IF NOT EXISTS generation_source text DEFAULT 'auto';

-- 3. Setup check constraints
ALTER TABLE public.entity_relationships DROP CONSTRAINT IF EXISTS entity_relationships_source_check;
ALTER TABLE public.entity_relationships ADD CONSTRAINT entity_relationships_source_check 
  CHECK (num_nonnulls(source_entity_id, source_document_id) = 1);

ALTER TABLE public.entity_relationships DROP CONSTRAINT IF EXISTS entity_relationships_target_check;
ALTER TABLE public.entity_relationships ADD CONSTRAINT entity_relationships_target_check 
  CHECK (num_nonnulls(target_entity_id, target_document_id) = 1);

ALTER TABLE public.entity_relationships DROP CONSTRAINT IF EXISTS entity_relationships_type_check;
ALTER TABLE public.entity_relationships ADD CONSTRAINT entity_relationships_type_check 
  CHECK (relationship_type IN (
    'mentioned_in', 'related_to', 'located_in', 'occurred_on', 'part_of', 
    'same_category', 'same_district', 'same_period', 'extracted_from', 
    'co_occurs_with', 'shared_entity'
  ));

ALTER TABLE public.entity_relationships DROP CONSTRAINT IF EXISTS entity_relationships_strength_check;
ALTER TABLE public.entity_relationships ADD CONSTRAINT entity_relationships_strength_check 
  CHECK (relationship_strength >= 0.0 AND relationship_strength <= 1.0);

ALTER TABLE public.entity_relationships DROP CONSTRAINT IF EXISTS entity_relationships_source_type_check;
ALTER TABLE public.entity_relationships ADD CONSTRAINT entity_relationships_source_type_check 
  CHECK (generation_source IN ('auto', 'manual'));

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.entity_relationships ENABLE ROW LEVEL SECURITY;

-- 5. Create basic policies (secure query scoping is handled in API route)
DROP POLICY IF EXISTS "Anyone can select entity relationships" ON public.entity_relationships;
CREATE POLICY "Anyone can select entity relationships" ON public.entity_relationships
  FOR SELECT TO authenticated, anonymous
  USING (true);

DROP POLICY IF EXISTS "Admins/Archivists can write entity relationships" ON public.entity_relationships;
CREATE POLICY "Admins/Archivists can write entity relationships" ON public.entity_relationships
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'archivist')
    )
  );

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_entity_rels_source_entity ON public.entity_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_rels_target_entity ON public.entity_relationships(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_rels_source_doc ON public.entity_relationships(source_document_id);
CREATE INDEX IF NOT EXISTS idx_entity_rels_target_doc ON public.entity_relationships(target_document_id);
CREATE INDEX IF NOT EXISTS idx_entity_rels_type ON public.entity_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_entity_rels_strength ON public.entity_relationships(relationship_strength);
