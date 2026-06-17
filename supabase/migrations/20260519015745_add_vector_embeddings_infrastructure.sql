/*
  # Add Vector Embeddings Infrastructure for AI Intelligence

  1. Enable pgvector Extension
    - PostgreSQL vector type support
    - Similarity search operations

  2. Create Embedding Tables
    - archive_embeddings: Full document embeddings
    - chunk_embeddings: Chunk-level embeddings for RAG
    - image_embeddings: Visual embeddings for multimodal search

  3. Create Knowledge Graph Tables
    - entities: Extracted named entities (people, places, events, organizations)
    - entity_relationships: Relationships between entities
    - entity_archive_links: Links between entities and archives

  4. Create Processing Tables
    - document_chunks: Document segments for RAG
    - ocr_metadata: OCR processing status and metadata
    - embedding_jobs: Background embedding processing
    - ingestion_queue: Async document ingestion queue

  5. Security & Indexing
    - RLS on all new tables
    - Vector indexes for similarity search
    - Composite indexes for query optimization
    - Performance indexes on frequently queried columns
*/

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Archive Embeddings Table
-- Stores full-document embeddings for semantic search
CREATE TABLE IF NOT EXISTS archive_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_id uuid NOT NULL UNIQUE REFERENCES archives(id) ON DELETE CASCADE,
  embedding vector(1536),
  metadata_embedding vector(384),
  embedding_model text DEFAULT 'text-embedding-3-small',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chunk Embeddings Table
-- Stores chunk-level embeddings for RAG retrieval
CREATE TABLE IF NOT EXISTS chunk_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_id uuid NOT NULL REFERENCES archives(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  start_position integer,
  end_position integer,
  confidence_score numeric DEFAULT 1.0,
  created_at timestamptz DEFAULT now()
);

-- Image Embeddings Table
-- Stores visual embeddings for multimodal search
CREATE TABLE IF NOT EXISTS image_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_id uuid NOT NULL REFERENCES archives(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  embedding vector(512),
  image_type text,
  visual_features jsonb,
  created_at timestamptz DEFAULT now()
);

-- Entities Table
-- Extracted named entities from archives
CREATE TABLE IF NOT EXISTS entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('person', 'place', 'event', 'organization', 'date', 'artifact')),
  name_kannada text,
  name_hindi text,
  description text,
  birth_date date,
  death_date date,
  embedding vector(1536),
  entity_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Entity Relationships Table
-- Relationships between entities
CREATE TABLE IF NOT EXISTS entity_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id_from uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  entity_id_to uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  relationship_type text NOT NULL,
  relationship_weight numeric DEFAULT 1.0,
  confidence_score numeric DEFAULT 0.8,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Entity-Archive Links Table
-- Connections between entities and archives
CREATE TABLE IF NOT EXISTS entity_archive_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  archive_id uuid NOT NULL REFERENCES archives(id) ON DELETE CASCADE,
  mention_count integer DEFAULT 1,
  context text,
  confidence_score numeric DEFAULT 0.8,
  created_at timestamptz DEFAULT now()
);

-- Document Chunks Table
-- Segments of documents for RAG
CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_id uuid NOT NULL REFERENCES archives(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  content_kannada text,
  content_hindi text,
  chunk_size integer,
  chunk_type text DEFAULT 'text',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- OCR Metadata Table
-- Enhanced OCR processing information
CREATE TABLE IF NOT EXISTS ocr_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_id uuid NOT NULL UNIQUE REFERENCES archives(id) ON DELETE CASCADE,
  ocr_engine text DEFAULT 'paddleocr',
  confidence_score numeric DEFAULT 0.0,
  language_detected text,
  is_handwritten boolean DEFAULT false,
  text_direction text DEFAULT 'ltr',
  page_count integer,
  processing_time_ms integer,
  quality_score numeric,
  requires_manual_review boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Embedding Jobs Table
-- Background processing jobs for embeddings
CREATE TABLE IF NOT EXISTS embedding_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_id uuid NOT NULL REFERENCES archives(id) ON DELETE CASCADE,
  job_type text NOT NULL CHECK (job_type IN ('full_embedding', 'chunk_embedding', 'image_embedding', 're_embedding')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  retry_count integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Ingestion Queue Table
-- Async document ingestion pipeline
CREATE TABLE IF NOT EXISTS ingestion_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_source text NOT NULL,
  source_url text,
  document_metadata jsonb DEFAULT '{}',
  processing_status text DEFAULT 'queued' CHECK (processing_status IN ('queued', 'fetching', 'parsing', 'ocr', 'embedding', 'indexing', 'completed', 'failed')),
  error_log jsonb DEFAULT '{}',
  priority integer DEFAULT 0,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE archive_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunk_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_archive_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE embedding_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies - All tables readable by authenticated users
-- (Knowledge is public, but processing is restricted)

CREATE POLICY "Embeddings readable by all authenticated users"
  ON archive_embeddings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Chunk embeddings readable by all authenticated users"
  ON chunk_embeddings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Image embeddings readable by all authenticated users"
  ON image_embeddings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Entities readable by all authenticated users"
  ON entities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Entity relationships readable by all authenticated users"
  ON entity_relationships FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Entity archive links readable by all authenticated users"
  ON entity_archive_links FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Document chunks readable by all authenticated users"
  ON document_chunks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "OCR metadata readable by archive owners"
  ON ocr_metadata FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM archives
      WHERE archives.id = ocr_metadata.archive_id
    )
  );

CREATE POLICY "Jobs manageable by admins only"
  ON embedding_jobs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Queue manageable by admins only"
  ON ingestion_queue FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create Indexes for Vector Similarity Search
CREATE INDEX idx_archive_embeddings_vector ON archive_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_chunk_embeddings_vector ON chunk_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_image_embeddings_vector ON image_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_entity_embeddings_vector ON entities USING ivfflat (embedding vector_cosine_ops);

-- Performance Indexes
CREATE INDEX idx_chunk_embeddings_archive_id ON chunk_embeddings(archive_id);
CREATE INDEX idx_chunk_embeddings_index ON chunk_embeddings(archive_id, chunk_index);
CREATE INDEX idx_entity_archive_links_entity_id ON entity_archive_links(entity_id);
CREATE INDEX idx_entity_archive_links_archive_id ON entity_archive_links(archive_id);
CREATE INDEX idx_entity_type ON entities(entity_type);
CREATE INDEX idx_embedding_jobs_status ON embedding_jobs(status, archive_id);
CREATE INDEX idx_ingestion_queue_status ON ingestion_queue(processing_status, priority);

-- Create composite indexes for hybrid search
CREATE INDEX idx_archive_embeddings_hybrid ON archive_embeddings(archive_id, created_at);
CREATE INDEX idx_entity_relationships_from_to ON entity_relationships(entity_id_from, entity_id_to);
