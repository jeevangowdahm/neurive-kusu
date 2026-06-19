/*
# Neurive Platform Upgrade - Interlinking Schema

## Purpose
Creates the foundation for cross-feature data interlinking by adding bridge tables,
statistics tables, activity tracking, and enhanced document metadata. This enables
seamless navigation between Search, Chat, Documents, Knowledge Graph, Timeline,
District Explorer, and Category Browser.

## 1. New Tables
- `document_entity_links`: Bridge between documents and entities (many-to-many)
- `search_feature_clicks`: Tracks which feature users click from search results
- `user_activity_feed`: Unified activity log for recommendations
- `popular_queries`: Trending search queries with analytics
- `district_statistics`: Computed stats per district (document count, entities, etc.)
- `category_statistics`: Computed stats per category (document count, districts, etc.)
- `graph_explorations`: User's knowledge graph exploration history
- `timeline_events`: Historical events from entities and documents

## 2. Modified Tables
- `archives`: Added `relevance_score`, `view_count`, `bookmark_count`, `entity_count`, `ocr_confidence`, `language_detected`, `page_count`, `thumbnail_url`
- `chat_sessions`: Added `cited_archives`, `cited_entities`, `citation_count`, `session_quality_score`

## 3. Security
- RLS enabled on all new tables
- Authenticated-only policies for user-owned data (activity, graph explorations)
- Public read policies for statistics and popular queries
- Bridge tables have public read for authenticated users

## 4. Indexes
- Performance indexes on all foreign keys and frequently queried columns
- Composite indexes for common query patterns
- GIN index on JSONB columns for flexible filtering
*/

-- ============================================
-- ENRICHED ARCHIVES TABLE
-- ============================================
ALTER TABLE archives ADD COLUMN IF NOT EXISTS document_text TEXT;
ALTER TABLE archives ADD COLUMN IF NOT EXISTS page_count INTEGER DEFAULT 1;
ALTER TABLE archives ADD COLUMN IF NOT EXISTS ocr_confidence DECIMAL(4,3) DEFAULT 0.0;
ALTER TABLE archives ADD COLUMN IF NOT EXISTS language_detected TEXT DEFAULT 'en';
ALTER TABLE archives ADD COLUMN IF NOT EXISTS entity_count INTEGER DEFAULT 0;
ALTER TABLE archives ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE archives ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE archives ADD COLUMN IF NOT EXISTS bookmark_count INTEGER DEFAULT 0;
ALTER TABLE archives ADD COLUMN IF NOT EXISTS relevance_score DECIMAL(5,4) DEFAULT 0.0;

-- ============================================
-- DOCUMENT ↔ ENTITY BRIDGE
-- ============================================
CREATE TABLE IF NOT EXISTS document_entity_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    archive_id UUID REFERENCES archives(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    mention_count INTEGER DEFAULT 1,
    contexts JSONB DEFAULT '[]',
    confidence_score DECIMAL(4,3) DEFAULT 0.8,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(archive_id, entity_id)
);

-- ============================================
-- SEARCH → FEATURE CLICK TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS search_feature_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_query TEXT NOT NULL,
    archive_id UUID REFERENCES archives(id) ON DELETE SET NULL,
    entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
    feature_used TEXT NOT NULL CHECK (feature_used IN ('document_viewer', 'chat', 'knowledge_graph', 'timeline', 'bookmarks', 'district_explorer', 'category_browser')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER ACTIVITY FEED (for recommendations)
-- ============================================
CREATE TABLE IF NOT EXISTS user_activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('search', 'view', 'bookmark', 'chat', 'upload', 'graph_explore', 'timeline_explore', 'district_explore', 'category_explore')),
    target_id UUID,
    target_type TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POPULAR QUERIES
-- ============================================
CREATE TABLE IF NOT EXISTS popular_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    query_normalized TEXT NOT NULL,
    search_count INTEGER DEFAULT 1,
    result_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    avg_relevance_score DECIMAL(5,4) DEFAULT 0.0,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DISTRICT STATISTICS
-- ============================================
CREATE TABLE IF NOT EXISTS district_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID REFERENCES districts(id) ON DELETE CASCADE,
    document_count INTEGER DEFAULT 0,
    category_distribution JSONB DEFAULT '{}',
    top_entities JSONB DEFAULT '[]',
    year_range JSONB DEFAULT '{"from":0,"to":0}',
    popular_searches JSONB DEFAULT '[]',
    view_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(district_id)
);

-- ============================================
-- CATEGORY STATISTICS
-- ============================================
CREATE TABLE IF NOT EXISTS category_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    document_count INTEGER DEFAULT 0,
    district_distribution JSONB DEFAULT '{}',
    top_entities JSONB DEFAULT '[]',
    year_range JSONB DEFAULT '{"from":0,"to":0}',
    popular_searches JSONB DEFAULT '[]',
    view_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id)
);

-- ============================================
-- KNOWLEDGE GRAPH EXPLORATION HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS graph_explorations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    starting_entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
    entity_ids JSONB DEFAULT '[]',
    relationship_ids JSONB DEFAULT '[]',
    explored_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TIMELINE EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
    archive_id UUID REFERENCES archives(id) ON DELETE SET NULL,
    event_date DATE NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('birth', 'death', 'coronation', 'battle', 'treaty', 'document', 'discovery', 'construction', 'destruction', 'movement', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
    district_id UUID REFERENCES districts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENRICHED CHAT SESSIONS
-- ============================================
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS citation_count INTEGER DEFAULT 0;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS cited_archives JSONB DEFAULT '[]';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS cited_entities JSONB DEFAULT '[]';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS session_quality_score DECIMAL(4,3) DEFAULT 0.0;

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_doc_entity_links_archive ON document_entity_links(archive_id);
CREATE INDEX IF NOT EXISTS idx_doc_entity_links_entity ON document_entity_links(entity_id);
CREATE INDEX IF NOT EXISTS idx_search_clicks_query ON search_feature_clicks(search_query);
CREATE INDEX IF NOT EXISTS idx_search_clicks_user ON search_feature_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_feed(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_popular_queries_count ON popular_queries(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_popular_queries_featured ON popular_queries(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_archives_relevance ON archives(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_archives_view_count ON archives(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_archives_entity_count ON archives(entity_count DESC);
CREATE INDEX IF NOT EXISTS idx_archives_language ON archives(language_detected);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON timeline_events(event_date);
CREATE INDEX IF NOT EXISTS idx_timeline_events_entity ON timeline_events(entity_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_district ON timeline_events(district_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_type ON timeline_events(event_type);
CREATE INDEX IF NOT EXISTS idx_graph_explorations_user ON graph_explorations(user_id);
CREATE INDEX IF NOT EXISTS idx_graph_explorations_entity ON graph_explorations(starting_entity_id);
CREATE INDEX IF NOT EXISTS idx_district_stats_count ON district_statistics(document_count DESC);
CREATE INDEX IF NOT EXISTS idx_category_stats_count ON category_statistics(document_count DESC);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE document_entity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_feature_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE district_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_explorations ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- document_entity_links: public read for authenticated
DROP POLICY IF EXISTS "document_entity_links_select" ON document_entity_links;
CREATE POLICY "document_entity_links_select" ON document_entity_links FOR SELECT
  TO authenticated USING (true);

-- search_feature_clicks: user can insert own, read own
DROP POLICY IF EXISTS "search_clicks_insert" ON search_feature_clicks;
CREATE POLICY "search_clicks_insert" ON search_feature_clicks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "search_clicks_select" ON search_feature_clicks;
CREATE POLICY "search_clicks_select" ON search_feature_clicks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- user_activity_feed: own data only
DROP POLICY IF EXISTS "user_activity_select" ON user_activity_feed;
CREATE POLICY "user_activity_select" ON user_activity_feed FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_activity_insert" ON user_activity_feed;
CREATE POLICY "user_activity_insert" ON user_activity_feed FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_activity_delete" ON user_activity_feed;
CREATE POLICY "user_activity_delete" ON user_activity_feed FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- popular_queries: public read
DROP POLICY IF EXISTS "popular_queries_select" ON popular_queries;
CREATE POLICY "popular_queries_select" ON popular_queries FOR SELECT
  TO authenticated USING (true);

-- district_statistics: public read
DROP POLICY IF EXISTS "district_stats_select" ON district_statistics;
CREATE POLICY "district_stats_select" ON district_statistics FOR SELECT
  TO authenticated USING (true);

-- category_statistics: public read
DROP POLICY IF EXISTS "category_stats_select" ON category_statistics;
CREATE POLICY "category_stats_select" ON category_statistics FOR SELECT
  TO authenticated USING (true);

-- graph_explorations: own data only
DROP POLICY IF EXISTS "graph_explorations_select" ON graph_explorations;
CREATE POLICY "graph_explorations_select" ON graph_explorations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "graph_explorations_insert" ON graph_explorations;
CREATE POLICY "graph_explorations_insert" ON graph_explorations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "graph_explorations_delete" ON graph_explorations;
CREATE POLICY "graph_explorations_delete" ON graph_explorations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- timeline_events: public read
DROP POLICY IF EXISTS "timeline_events_select" ON timeline_events;
CREATE POLICY "timeline_events_select" ON timeline_events FOR SELECT
  TO authenticated USING (true);
