/*
# Neurive v3.0 Comprehensive Upgrade Schema

This migration adds all missing tables for the Neurive v3.0 upgrade including:
- AI Archivist Agent system
- Source records tracking
- Agent tool logs
- Saved searches
- Graph snapshots
- Ingestion batch tracking
- Agent starter scripts
- Chat suggested prompts
- Public web search results
- Source badges and metadata

## 1. New Tables
- ai_archivist_sessions: Agent session tracking
- ai_archivist_messages: Agent chat messages
- ai_archivist_scripts: 200 starter research questions
- agent_tool_logs: Agent telemetry and audit logs
- agent_ingestion_runs: Ingestion batch tracking
- source_records: Real source metadata tracking
- public_search_results: External web search results
- saved_searches: User saved search queries
- graph_snapshots: Knowledge graph export snapshots
- chat_suggested_prompts: RAG chat suggested prompts
- ingestion_batches: Batch seeding progress tracking
- dataset_records: Dataset seed tracking
- archive_collections: Named collections of archives
- agent_commit_queue: Pending ledger commits

## 2. Security
- All tables have RLS enabled
- Admin/Archivist roles for sensitive tables
- Public read for demo/sample tables

## 3. Notes
- Safe additive migration only
- No destructive operations
- All tables use IF NOT EXISTS
*/

-- ============================================================================
-- AI Archivist Agent Sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_archivist_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Session',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  manuscript_type text,
  manuscript_id text,
  total_steps integer DEFAULT 0,
  completed_steps integer DEFAULT 0,
  total_entities_extracted integer DEFAULT 0,
  total_pages_processed integer DEFAULT 0,
  avg_ocr_confidence numeric DEFAULT 0,
  embedding_status text DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'mock', 'embedding-004-padded', 'embedding-004-native', 'failed')),
  embedding_model text,
  original_embedding_dimension integer,
  embedding_dimension integer,
  ledger_commit_status text DEFAULT 'draft' CHECK (ledger_commit_status IN ('draft', 'preview', 'committed', 'failed')),
  source_type text DEFAULT 'agent_session',
  is_sandbox boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- AI Archivist Messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_archivist_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES ai_archivist_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'agent', 'system', 'tool', 'ocr', 'chunk', 'embed', 'entity', 'commit')),
  content text NOT NULL,
  tool_name text,
  tool_params jsonb,
  tool_result jsonb,
  confidence numeric DEFAULT 0,
  page_number integer,
  chunk_id uuid,
  entity_id uuid,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- AI Archivist Starter Scripts (200 Research Questions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_archivist_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  category text NOT NULL,
  sub_category text,
  description text,
  expected_retrieval_hints text[],
  preferred_source_type text,
  related_districts text[],
  related_categories text[],
  related_entities text[],
  expected_citation_style text,
  difficulty_level integer NOT NULL DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  script_type text NOT NULL DEFAULT 'sample_agent_script' CHECK (script_type IN ('sample_agent_script', 'rag_prompt', 'search_query', 'graph_query')),
  is_featured boolean DEFAULT false,
  search_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Agent Tool Logs (Telemetry and Audit)
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_tool_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES ai_archivist_sessions(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  tool_step text NOT NULL,
  status text NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed', 'failed', 'skipped')),
  input_preview text,
  output_preview text,
  error_message text,
  duration_ms integer,
  confidence numeric,
  page_number integer,
  source_type text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Agent Ingestion Runs
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_ingestion_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES ai_archivist_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  run_type text NOT NULL DEFAULT 'full_pipeline' CHECK (run_type IN ('full_pipeline', 'ocr_only', 'chunk_only', 'embed_only', 'entity_only', 'commit_only')),
  source_file_url text,
  source_file_name text,
  source_file_type text,
  total_pages integer DEFAULT 0,
  processed_pages integer DEFAULT 0,
  ocr_confidence numeric,
  total_chunks integer DEFAULT 0,
  total_entities integer DEFAULT 0,
  total_relationships integer DEFAULT 0,
  commit_status text DEFAULT 'pending' CHECK (commit_status IN ('pending', 'preview', 'committed', 'failed')),
  commit_error text,
  archive_id uuid,
  document_id uuid,
  is_sandbox boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Source Records (Real Source Metadata)
-- ============================================================================
CREATE TABLE IF NOT EXISTS source_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_id uuid,
  source_url text NOT NULL,
  source_name text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('uploaded', 'government_pdf', 'internet_archive', 'wikipedia', 'wikisource', 'open_data', 'state_archives', 'sample_archive', 'sample_pdf', 'public_web', 'google_search', 'agent_commit')),
  source_license text,
  source_attribution text,
  retrieval_date timestamptz DEFAULT now(),
  source_reliability_score numeric DEFAULT 0 CHECK (source_reliability_score BETWEEN 0 AND 1),
  source_checksum text,
  source_is_real boolean DEFAULT false,
  is_demo boolean DEFAULT false,
  collection_name text,
  source_metadata jsonb,
  admin_notes text,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Public Web Search Results
-- ============================================================================
CREATE TABLE IF NOT EXISTS public_search_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  title text NOT NULL,
  snippet text,
  url text NOT NULL,
  source_domain text,
  karnataka_relevance_score numeric DEFAULT 0,
  is_ingested boolean DEFAULT false,
  ingested_archive_id uuid,
  ingestion_user_id uuid REFERENCES auth.users(id),
  ingestion_notes text,
  raw_html text,
  search_engine text,
  result_rank integer,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Saved Searches
-- ============================================================================
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query text NOT NULL,
  filters jsonb,
  sort_by text,
  result_count integer,
  name text,
  is_public boolean DEFAULT false,
  search_count integer DEFAULT 1,
  last_run_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Graph Snapshots
-- ============================================================================
CREATE TABLE IF NOT EXISTS graph_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  node_count integer DEFAULT 0,
  edge_count integer DEFAULT 0,
  snapshot_data jsonb,
  filter_config jsonb,
  source_types text[],
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Chat Suggested Prompts
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_suggested_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt text NOT NULL,
  category text NOT NULL,
  description text,
  related_districts text[],
  related_categories text[],
  related_entities text[],
  use_count integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Ingestion Batches (Seed Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ingestion_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name text NOT NULL,
  batch_type text NOT NULL CHECK (batch_type IN ('sample_archive', 'sample_pdf', 'real_source', 'wikipedia', 'upload', 'agent_commit')),
  total_records integer DEFAULT 0,
  processed_records integer DEFAULT 0,
  failed_records integer DEFAULT 0,
  source_type text,
  collection_name text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'paused')),
  error_log text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Dataset Records (Seed Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS dataset_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES ingestion_batches(id) ON DELETE SET NULL,
  archive_id uuid,
  source_type text NOT NULL,
  source_is_real boolean DEFAULT false,
  is_demo boolean DEFAULT false,
  collection_name text,
  seed_index integer,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Archive Collections
-- ============================================================================
CREATE TABLE IF NOT EXISTS archive_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  slug text NOT NULL UNIQUE,
  collection_type text NOT NULL DEFAULT 'curated' CHECK (collection_type IN ('curated', 'system', 'user', 'agent')),
  record_count integer DEFAULT 0,
  source_types text[],
  is_public boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Agent Commit Queue
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_commit_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES ai_archivist_sessions(id) ON DELETE CASCADE,
  run_id uuid REFERENCES agent_ingestion_runs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commit_type text NOT NULL CHECK (commit_type IN ('archive', 'document', 'entity', 'relationship', 'chunk', 'page')),
  target_table text NOT NULL,
  preview_data jsonb NOT NULL,
  rls_impact text,
  source_metadata jsonb,
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'restricted', 'private')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'committed')),
  committed_at timestamptz,
  committed_by uuid REFERENCES auth.users(id),
  rejection_reason text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_archivist_sessions_user ON ai_archivist_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_archivist_sessions_status ON ai_archivist_sessions(status);
CREATE INDEX IF NOT EXISTS idx_archivist_messages_session ON ai_archivist_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_archivist_messages_role ON ai_archivist_messages(role);
CREATE INDEX IF NOT EXISTS idx_archivist_scripts_category ON ai_archivist_scripts(category);
CREATE INDEX IF NOT EXISTS idx_archivist_scripts_featured ON ai_archivist_scripts(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_agent_logs_session ON agent_tool_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_tool ON agent_tool_logs(tool_name);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_session ON agent_ingestion_runs(session_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_status ON agent_ingestion_runs(commit_status);
CREATE INDEX IF NOT EXISTS idx_source_records_archive ON source_records(archive_id);
CREATE INDEX IF NOT EXISTS idx_source_records_type ON source_records(source_type);
CREATE INDEX IF NOT EXISTS idx_source_records_real ON source_records(source_is_real) WHERE source_is_real = true;
CREATE INDEX IF NOT EXISTS idx_public_search_query ON public_search_results(query);
CREATE INDEX IF NOT EXISTS idx_public_search_ingested ON public_search_results(is_ingested) WHERE is_ingested = false;
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_graph_snapshots_user ON graph_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_prompts_category ON chat_suggested_prompts(category);
CREATE INDEX IF NOT EXISTS idx_chat_prompts_featured ON chat_suggested_prompts(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_ingestion_batches_status ON ingestion_batches(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_batches_type ON ingestion_batches(batch_type);
CREATE INDEX IF NOT EXISTS idx_dataset_records_batch ON dataset_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_commit_queue_session ON agent_commit_queue(session_id);
CREATE INDEX IF NOT EXISTS idx_commit_queue_status ON agent_commit_queue(status);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- AI Archivist Sessions
ALTER TABLE ai_archivist_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "archivist_sessions_select" ON ai_archivist_sessions;
CREATE POLICY "archivist_sessions_select" ON ai_archivist_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'archivist')));
DROP POLICY IF EXISTS "archivist_sessions_insert" ON ai_archivist_sessions;
CREATE POLICY "archivist_sessions_insert" ON ai_archivist_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "archivist_sessions_update" ON ai_archivist_sessions;
CREATE POLICY "archivist_sessions_update" ON ai_archivist_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "archivist_sessions_delete" ON ai_archivist_sessions;
CREATE POLICY "archivist_sessions_delete" ON ai_archivist_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- AI Archivist Messages
ALTER TABLE ai_archivist_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "archivist_messages_select" ON ai_archivist_messages;
CREATE POLICY "archivist_messages_select" ON ai_archivist_messages FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM ai_archivist_sessions s WHERE s.id = session_id AND (s.user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'archivist')))));
DROP POLICY IF EXISTS "archivist_messages_insert" ON ai_archivist_messages;
CREATE POLICY "archivist_messages_insert" ON ai_archivist_messages FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM ai_archivist_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));

-- AI Archivist Scripts (public read)
ALTER TABLE ai_archivist_scripts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "archivist_scripts_select" ON ai_archivist_scripts;
CREATE POLICY "archivist_scripts_select" ON ai_archivist_scripts FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "archivist_scripts_admin" ON ai_archivist_scripts;
CREATE POLICY "archivist_scripts_admin" ON ai_archivist_scripts FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'archivist')));

-- Agent Tool Logs
ALTER TABLE agent_tool_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agent_logs_select" ON agent_tool_logs;
CREATE POLICY "agent_logs_select" ON agent_tool_logs FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM ai_archivist_sessions s WHERE s.id = session_id AND (s.user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'archivist')))));

-- Agent Ingestion Runs
ALTER TABLE agent_ingestion_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ingestion_runs_select" ON agent_ingestion_runs;
CREATE POLICY "ingestion_runs_select" ON agent_ingestion_runs FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'archivist')));
DROP POLICY IF EXISTS "ingestion_runs_insert" ON agent_ingestion_runs;
CREATE POLICY "ingestion_runs_insert" ON agent_ingestion_runs FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- Source Records
ALTER TABLE source_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "source_records_select" ON source_records;
CREATE POLICY "source_records_select" ON source_records FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "source_records_admin" ON source_records;
CREATE POLICY "source_records_admin" ON source_records FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'archivist')));

-- Public Search Results
ALTER TABLE public_search_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_search_select" ON public_search_results;
CREATE POLICY "public_search_select" ON public_search_results FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "public_search_admin" ON public_search_results;
CREATE POLICY "public_search_admin" ON public_search_results FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'archivist')));

-- Saved Searches
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saved_searches_own" ON saved_searches;
CREATE POLICY "saved_searches_own" ON saved_searches FOR ALL
  TO authenticated USING (user_id = auth.uid());

-- Graph Snapshots
ALTER TABLE graph_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "graph_snapshots_select" ON graph_snapshots;
CREATE POLICY "graph_snapshots_select" ON graph_snapshots FOR SELECT
  TO authenticated USING (is_public = true OR user_id = auth.uid());
DROP POLICY IF EXISTS "graph_snapshots_insert" ON graph_snapshots;
CREATE POLICY "graph_snapshots_insert" ON graph_snapshots FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- Chat Suggested Prompts
ALTER TABLE chat_suggested_prompts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_prompts_select" ON chat_suggested_prompts;
CREATE POLICY "chat_prompts_select" ON chat_suggested_prompts FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "chat_prompts_admin" ON chat_suggested_prompts;
CREATE POLICY "chat_prompts_admin" ON chat_suggested_prompts FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'archivist')));

-- Ingestion Batches
ALTER TABLE ingestion_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ingestion_batches_select" ON ingestion_batches;
CREATE POLICY "ingestion_batches_select" ON ingestion_batches FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "ingestion_batches_admin" ON ingestion_batches;
CREATE POLICY "ingestion_batches_admin" ON ingestion_batches FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'archivist')));

-- Dataset Records
ALTER TABLE dataset_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dataset_records_select" ON dataset_records;
CREATE POLICY "dataset_records_select" ON dataset_records FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "dataset_records_admin" ON dataset_records;
CREATE POLICY "dataset_records_admin" ON dataset_records FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'archivist')));

-- Archive Collections
ALTER TABLE archive_collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "archive_collections_select" ON archive_collections;
CREATE POLICY "archive_collections_select" ON archive_collections FOR SELECT
  TO anon, authenticated USING (is_public = true);
DROP POLICY IF EXISTS "archive_collections_admin" ON archive_collections;
CREATE POLICY "archive_collections_admin" ON archive_collections FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'archivist')));

-- Agent Commit Queue
ALTER TABLE agent_commit_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "commit_queue_select" ON agent_commit_queue;
CREATE POLICY "commit_queue_select" ON agent_commit_queue FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'archivist')));
DROP POLICY IF EXISTS "commit_queue_insert" ON agent_commit_queue;
CREATE POLICY "commit_queue_insert" ON agent_commit_queue FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
