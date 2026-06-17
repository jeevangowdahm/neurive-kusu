-- ============================================================
-- SAFE MIGRATION: EVALUATION TESTING TABLES FOR ADMIN PANEL
-- ============================================================

CREATE TABLE IF NOT EXISTS public.evaluation_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  expected_document_ids text[] DEFAULT '{}'::text[],
  category text,
  district text,
  language text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evaluation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_query_id uuid REFERENCES public.evaluation_queries(id) ON DELETE CASCADE,
  search_method text NOT NULL, -- keyword, semantic, hybrid, hybrid_boost
  precision_at_5 numeric(5,4) NOT NULL,
  recall_at_10 numeric(5,4) NOT NULL,
  mrr numeric(5,4) NOT NULL,
  response_time_ms integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.evaluation_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_results ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Admins have full access
DROP POLICY IF EXISTS "Admins can manage evaluation queries" ON public.evaluation_queries;
CREATE POLICY "Admins can manage evaluation queries" ON public.evaluation_queries
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

DROP POLICY IF EXISTS "Admins can manage evaluation results" ON public.evaluation_results;
CREATE POLICY "Admins can manage evaluation results" ON public.evaluation_results
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_eval_queries_category ON public.evaluation_queries(category);
CREATE INDEX IF NOT EXISTS idx_eval_queries_district ON public.evaluation_queries(district);
CREATE INDEX IF NOT EXISTS idx_eval_results_query_id ON public.evaluation_results(evaluation_query_id);
CREATE INDEX IF NOT EXISTS idx_eval_results_method ON public.evaluation_results(search_method);

-- Seed default baseline evaluation queries
INSERT INTO public.evaluation_queries (query, expected_document_ids, category, district, language)
VALUES 
('Land survey records in Mysuru', ARRAY['demo-doc-land-records-mysuru-1', 'demo-doc-land-records-mysuru-2']::text[], 'land-records', 'Mysuru', 'kannada'),
('Court judgment from Belagavi regarding boundaries', ARRAY['demo-doc-court-records-belagavi-1']::text[], 'court-records', 'Belagavi', 'both'),
('Temple endowment grants and inscriptions in Hampi', ARRAY['demo-doc-temple-records-bellary-1']::text[], 'temple-records', 'Ballari', 'kannada'),
('Gazetteer notifications for Bangalore Urban division', ARRAY['demo-doc-gazette-bangalore-1']::text[], 'gazette-notifications', 'Bengaluru Urban', 'english')
ON CONFLICT DO NOTHING;
