# Neurive Platform Upgrade Plan
## Data-Rich Features, Interlinking & Real-World Implementation Roadmap

**Version**: 3.0
**Date**: 2026-06-19
**Status**: Planned & Ready for Implementation

---

## Executive Summary

This plan upgrades every feature in the Neurive platform with real data, cross-feature interlinking, and AI-powered intelligence. The goal is to move from a "mock/demo" platform to a production-ready digital archive with 1,000+ real historical records, working AI pipelines, and seamless feature connections.

---

## Phase 1: Core Infrastructure (Database Schema + Data Seeding)

### 1.1 Enhanced Schema Migration

**File**: `supabase/migrations/20260619_upgrade_plan_schema.sql`

New tables and columns to add:

```sql
-- ============================================
-- 1. ENRICHED DOCUMENTS TABLE
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
-- 2. INTERLINKING: DOCUMENT ↔ ENTITY BRIDGE
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
-- 3. INTERLINKING: SEARCH ↔ FEATURE BRIDGE
-- ============================================
CREATE TABLE IF NOT EXISTS search_feature_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_query TEXT NOT NULL,
    archive_id UUID REFERENCES archives(id) ON DELETE SET NULL,
    entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
    feature_used TEXT NOT NULL, -- 'document_viewer', 'chat', 'knowledge_graph', 'timeline', 'bookmarks'
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. INTERLINKING: USER ACTIVITY FEED
-- ============================================
CREATE TABLE IF NOT EXISTS user_activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'search', 'view', 'bookmark', 'chat', 'upload', 'graph_explore'
    target_id UUID,
    target_type TEXT, -- 'archive', 'entity', 'chat_session', 'district'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. FEATURE-SPECIFIC: POPULAR QUERIES
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
-- 6. FEATURE-SPECIFIC: DISTRICT STATISTICS
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
-- 7. FEATURE-SPECIFIC: CATEGORY STATISTICS
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
-- 8. FEATURE-SPECIFIC: KNOWLEDGE GRAPH SNAPSHOTS
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
-- 9. FEATURE-SPECIFIC: CHAT SESSION METADATA
-- ============================================
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS citation_count INTEGER DEFAULT 0;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS cited_archives JSONB DEFAULT '[]';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS cited_entities JSONB DEFAULT '[]';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS session_quality_score DECIMAL(4,3) DEFAULT 0.0;

-- ============================================
-- 10. INDEXES FOR INTERLINKING
-- ============================================
CREATE INDEX IF NOT EXISTS idx_doc_entity_links_archive ON document_entity_links(archive_id);
CREATE INDEX IF NOT EXISTS idx_doc_entity_links_entity ON document_entity_links(entity_id);
CREATE INDEX IF NOT EXISTS idx_search_clicks_query ON search_feature_clicks(search_query);
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_feed(activity_type);
CREATE INDEX IF NOT EXISTS idx_popular_queries_count ON popular_queries(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_archives_relevance ON archives(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_archives_view_count ON archives(view_count DESC);

-- ============================================
-- 11. RLS POLICIES FOR NEW TABLES
-- ============================================
ALTER TABLE document_entity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_feature_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE district_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_explorations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_entity_links_select" ON document_entity_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "search_clicks_insert" ON search_feature_clicks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_activity_own" ON user_activity_feed FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "popular_queries_public" ON popular_queries FOR SELECT TO authenticated USING (true);
CREATE POLICY "district_stats_public" ON district_statistics FOR SELECT TO authenticated USING (true);
CREATE POLICY "category_stats_public" ON category_statistics FOR SELECT TO authenticated USING (true);
CREATE POLICY "graph_explorations_own" ON graph_explorations FOR ALL TO authenticated USING (auth.uid() = user_id);
```

---

## Phase 2: Feature-by-Feature Upgrade Plan

### Feature 1: Homepage & Discovery Layer

#### Current State
- Static stats counter (1M+, 30 districts, 200+ years)
- Generic feature cards with no data
- Static district cards without real data

#### Upgrade Plan

**Data Population**:
```sql
-- Populate real stats from the database
SELECT COUNT(*) as total_records FROM archives;
SELECT COUNT(*) as total_districts FROM districts;
SELECT MIN(year) as earliest_year, MAX(year) as latest_year FROM archives;
SELECT COUNT(*) as total_entities FROM entities;
SELECT COUNT(*) as total_categories FROM categories;
```

**Interlinking**:
- **Hero Stats** → Pulled from real database aggregates every 30 seconds
- **Featured Districts** → Top 6 districts by `document_count` from `district_statistics`
- **Quick Access Categories** → Top 6 categories by `document_count` from `category_statistics`
- **Trending Searches** → Top 5 from `popular_queries` table
- **Featured Document** → Highest `relevance_score` + `view_count` from `archives`

**Implementation**:
- Create `lib/homepage-data.ts` service
- Update `app/page.tsx` to fetch real data on server-side
- Add `revalidate: 60` for ISR cache
- Link each card to its feature page with pre-filtered state

**New Data**:
- 50 popular queries (seeded from search logs)
- 6 featured districts with real document counts
- 6 featured categories with real counts
- 1 "Document of the Week" spotlight

---

### Feature 2: AI Search Engine

#### Current State
- Hybrid search with BM25 + vector similarity
- Filter sidebar with categories and districts
- Search results with pagination

#### Upgrade Plan

**Data Population**:
```sql
-- Seed search query expansions
INSERT INTO popular_queries (query, query_normalized, featured) VALUES
('Mysuru palace history', 'mysuru palace history', true),
('Tipu Sultan battles', 'tipu sultan battles', true),
('Karnataka land records 1890', 'karnataka land records 1890', true),
('Kannada inscriptions', 'kannada inscriptions', true),
('Vijayanagara empire temples', 'vijayanagara empire temples', true),
('Bangalore cantonment records', 'bangalore cantonment records', true);

-- Ensure all archives have embeddings
UPDATE archives SET relevance_score = 0.85 WHERE status = 'active';
```

**Interlinking**:
- **Search Result** → Click document card → `Document Viewer` (with highlight)
- **Search Result** → Click "Ask AI" → `RAG Chat` (pre-loaded with document context)
- **Search Result** → Click entity name → `Knowledge Graph` (centered on entity)
- **Search Result** → Click year → `Timeline` (filtered to that year)
- **Search Result** → Click "Bookmark" → `Bookmarks` (added to user's collection)
- **Search Result** → "Related Districts" → `District Explorer` (filter by district)
- **Search Result** → "Related Categories" → `Category Browser` (filter by category)

**Implementation**:
- Update `app/api/search/route.ts` to:
  - Record search query in `popular_queries` (increment count)
  - Return `related_entities` array from `document_entity_links`
  - Return `related_districts` and `related_categories` aggregation
  - Add `citation_context` for each result (top 3 matching chunks)
- Create `lib/search-interlinking.ts` service
- Update `SearchResultCard` component with action buttons

**New Data**:
- 500+ archive records with real text content
- 2,000+ document chunks with embeddings
- 500+ entity-document links
- 50+ popular query patterns
- Search analytics with click-through tracking

---

### Feature 3: RAG Chat Assistant

#### Current State
- Streaming chat with RAG context
- Document-specific chat mode
- Citation support

#### Upgrade Plan

**Data Population**:
```sql
-- Seed conversation starters based on popular queries
-- Seed citation templates
-- Ensure chat_messages has content + citations

-- Example: Link chat sessions to documents
UPDATE chat_sessions 
SET cited_archives = '["uuid1","uuid2"]'::jsonb,
    cited_entities = '["uuid3"]'::jsonb,
    citation_count = 3
WHERE id = 'existing-session-uuid';
```

**Interlinking**:
- **Chat Response** → Click citation → `Document Viewer` (scroll to exact page)
- **Chat Response** → Click entity mention → `Knowledge Graph` (entity focus)
- **Chat Response** → "Search Related" → `Search` (query = chat question)
- **Chat Response** → "Bookmark" → `Bookmarks` (save conversation + sources)
- **Chat Input** → "Suggested Queries" → Pulled from `popular_queries` table
- **Chat Session** → "View All Sources" → Opens document list in sidebar

**Implementation**:
- Update `app/api/ai/chat/route.ts` to:
  - Record `chat_sessions` with `cited_archives` and `cited_entities`
  - Add `citation_context` to each response (archive_id, page, chunk)
  - Link to `document_entity_links` for entity mentions
- Update `RAGChain` to return structured citations
- Create `lib/chat-interlinking.ts` service
- Add "View in Document" button to each citation
- Add "Explore Entity" button when entities are detected

**New Data**:
- 20+ pre-seeded conversation starters
- Citation templates with page numbers
- Entity detection in chat responses
- Conversation quality scores

---

### Feature 4: Document Viewer (Advanced)

#### Current State
- Multi-tab viewer (Preview, OCR, Chunks, Entities, Notes, Related)
- Document metadata summary
- Citation actions

#### Upgrade Plan

**Data Population**:
```sql
-- Ensure document chunks are linked
-- Ensure entity annotations have bounding boxes
-- Seed document notes with admin annotations

-- Example: Add entity annotations
INSERT INTO document_entity_links (archive_id, entity_id, mention_count, contexts)
SELECT 
    a.id as archive_id,
    e.id as entity_id,
    3 as mention_count,
    '[{"page":1,"text":"Tipu Sultan built this"}]'::jsonb as contexts
FROM archives a, entities e
WHERE a.title ILIKE '%Tipu%' AND e.name = 'Tipu Sultan';
```

**Interlinking**:
- **Document Viewer** → "Ask AI" → `RAG Chat` (pre-loaded with document_id)
- **Document Viewer** → "View Entities" → `Knowledge Graph` (entities in this document)
- **Document Viewer** → "Related Documents" → `Search` (similar documents via entity overlap)
- **Document Viewer** → "Add to Timeline" → `Timeline` (document event added)
- **Document Viewer** → "Bookmark" → `Bookmarks` (saved to user collection)
- **Document Viewer** → "View District" → `District Explorer` (document's district)
- **Document Viewer** → "View Category" → `Category Browser` (document's category)
- **Entity Tab** → Click entity → `Knowledge Graph` (entity detail)
- **Related Tab** → Click related doc → `Document Viewer` (that document)

**Implementation**:
- Update `app/api/documents/[id]/route.ts` to:
  - Return `related_documents` (documents sharing entities via `document_entity_links`)
  - Return `entity_annotations` with bounding boxes
  - Return `citation_context` for each entity
- Create `lib/document-interlinking.ts` service
- Update `DocumentViewer` component with action buttons
- Add `entity_highlight` in preview panel

**New Data**:
- 500+ documents with full text content
- 2,000+ chunks with embeddings
- 500+ entity-document links
- Entity bounding boxes for 100+ documents
- 100+ admin annotations

---

### Feature 5: Knowledge Graph & Timeline

#### Current State
- Force-directed graph visualization
- Entity sidebar with details
- Timeline card for temporal entities
- Relationship evidence panel

#### Upgrade Plan

**Data Population**:
```sql
-- Seed comprehensive Karnataka entities
INSERT INTO entities (name, entity_type, name_kannada, description, birth_date, death_date, entity_metadata) VALUES
('Tipu Sultan', 'person', 'ಟಿಪ್ಪು ಸುಲ್ತಾನ', 'Ruler of Mysore, known as the Tiger of Mysore', '1750-11-20', '1799-05-04', '{"dynasty": "Mysore", "title": "Sultan"}'),
('Krishnadevaraya', 'person', 'ಕೃಷ್ಣದೇವರಾಯ', 'Greatest emperor of Vijayanagara Empire', '1471-01-01', '1529-01-01', '{"dynasty": "Vijayanagara", "title": "Emperor"}'),
('Kempe Gowda', 'person', 'ಕೆಂಪೆ ಗೌಡ', 'Founder of Bangalore', '1510-01-01', '1569-01-01', '{"dynasty": "Yelahanka", "title": "Chieftain"}'),
('Mysore Palace', 'place', 'ಮೈಸೂರು ಅರಮನೆ', 'Historical palace in Mysore', NULL, NULL, '{"district": "Mysuru", "type": "Palace"}'),
('Vijayanagara Empire', 'event', 'ವಿಜಯನಗರ ಸಾಮ್ರಾಜ್ಯ', 'Medieval Indian empire in South India', '1336-01-01', '1646-01-01', '{"capital": "Hampi", "dynasty": "Sangama"}'),
('Hampi', 'place', 'ಹಂಪಿ', 'UNESCO World Heritage site, capital of Vijayanagara', NULL, NULL, '{"district": "Ballari", "type": "Heritage"}'),
('Kadamba Dynasty', 'organization', 'ಕದಂಬ ಸಾಮ್ರಾಜ್ಯ', 'Ancient dynasty of Karnataka', '345-01-01', '540-01-01', '{"capital": "Banavasi", "region": "Uttara Kannada"}'),
('Chalukya Dynasty', 'organization', 'ಚಾಲುಕ್ಯ ಸಾಮ್ರಾಜ್ಯ', 'Medieval dynasty ruling Deccan', '543-01-01', '753-01-01', '{"capital": "Badami", "region": "Bagalkot"}'),
('Hoysala Dynasty', 'organization', 'ಹೊಯ್ಸಳ ಸಾಮ್ರಾಜ್ಯ', 'Kannadiga empire in South India', '1026-01-01', '1343-01-01', '{"capital": "Belur", "region": "Hassan"}'),
('Bangalore', 'place', 'ಬೆಂಗಳೂರು', 'Capital of Karnataka', NULL, NULL, '{"district": "Bangalore Urban", "type": "City"}'),
('Mysuru', 'place', 'ಮೈಸೂರು', 'Cultural capital of Karnataka', NULL, NULL, '{"district": "Mysuru", "type": "City"}'),
('Mysore Wars', 'event', 'ಮೈಸೂರು ಯುದ್ಧಗಳು', 'Series of wars between British and Tipu Sultan', '1767-01-01', '1799-05-04', '{"type": "Military", "participants": ["British East India Company", "Tipu Sultan"]}'),
('Kannada Language', 'artifact', 'ಕನ್ನಡ ಭಾಷೆ', 'Dravidian language spoken in Karnataka', NULL, NULL, '{"script": "Kannada", "region": "Karnataka"}'),
('Kolar Gold Fields', 'place', 'ಕೋಲಾರ ಸ್ವರ್ಣ ಖನಿಜ', 'Gold mining region in Karnataka', NULL, NULL, '{"district": "Kolar", "type": "Industrial"}'),
('Chennakeshava Temple', 'place', 'ಚೆನ್ನಕೇಶವ ದೇವಸ್ಥಾನ', 'Hoysala temple at Belur', NULL, NULL, '{"district": "Hassan", "type": "Temple", "dynasty": "Hoysala"}'),
('Seringapatam', 'place', 'ಶ್ರೀರಂಗಪಟ್ಟಣ', 'Historical capital of Mysore', NULL, NULL, '{"district": "Mandya", "type": "Fort"}'),
('Kittur Chennamma', 'person', 'ಕಿತ್ತೂರು ಚೆನ್ನಮ್ಮ', 'First woman to lead armed rebellion against British', '1778-01-01', '1829-02-21', '{"district": "Belagavi", "title": "Rani"}'),
('Hyder Ali', 'person', 'ಹೈದರ್ ಅಲಿ', 'Father of Tipu Sultan, ruler of Mysore', '1721-01-01', '1782-12-07', '{"dynasty": "Mysore", "title": "Sultan"}'),
('Rani Abbakka', 'person', 'ರಾಣಿ ಅಬ್ಬಕ್ಕ', 'First queen of Ullal who fought Portuguese', '1520-01-01', '1600-01-01', '{"district": "Mangalore", "title": "Rani"}');

-- Seed entity relationships
INSERT INTO entity_relationships (entity_id_from, entity_id_to, relationship_type, relationship_weight, confidence_score, metadata) VALUES
-- Tipu Sultan ruled Mysore
((SELECT id FROM entities WHERE name = 'Tipu Sultan'), (SELECT id FROM entities WHERE name = 'Mysuru'), 'ruled', 0.95, 0.98, '{"period": "1782-1799"}'),
-- Tipu Sultan succeeded Hyder Ali
((SELECT id FROM entities WHERE name = 'Hyder Ali'), (SELECT id FROM entities WHERE name = 'Tipu Sultan'), 'succeeded_by', 0.95, 0.99, '{"year": 1782}'),
-- Tipu Sultan built Mysore Palace
((SELECT id FROM entities WHERE name = 'Tipu Sultan'), (SELECT id FROM entities WHERE name = 'Mysore Palace'), 'built', 0.85, 0.90, '{"note": "Rebuilt palace"}'),
-- Mysore Wars involved Tipu Sultan
((SELECT id FROM entities WHERE name = 'Mysore Wars'), (SELECT id FROM entities WHERE name = 'Tipu Sultan'), 'involved', 0.95, 0.97, '{"role": "primary"}'),
-- Krishnadevaraya ruled Vijayanagara Empire
((SELECT id FROM entities WHERE name = 'Krishnadevaraya'), (SELECT id FROM entities WHERE name = 'Vijayanagara Empire'), 'ruled', 0.95, 0.99, '{"period": "1509-1529"}'),
-- Vijayanagara Empire capital at Hampi
((SELECT id FROM entities WHERE name = 'Vijayanagara Empire'), (SELECT id FROM entities WHERE name = 'Hampi'), 'capital_at', 0.95, 0.98, '{"period": "1336-1565"}'),
-- Kempe Gowda founded Bangalore
((SELECT id FROM entities WHERE name = 'Kempe Gowda'), (SELECT id FROM entities WHERE name = 'Bangalore'), 'founded', 0.95, 0.95, '{"year": 1537}'),
-- Hoysala Dynasty built Chennakeshava Temple
((SELECT id FROM entities WHERE name = 'Hoysala Dynasty'), (SELECT id FROM entities WHERE name = 'Chennakeshava Temple'), 'built', 0.95, 0.98, '{"year": 1117}'),
-- Kadamba Dynasty capital at Banavasi
((SELECT id FROM entities WHERE name = 'Kadamba Dynasty'), (SELECT id FROM entities WHERE name = 'Banavasi'), 'capital_at', 0.90, 0.92, '{"period": "345-540"}'),
-- Chalukya Dynasty succeeded Kadamba Dynasty
((SELECT id FROM entities WHERE name = 'Kadamba Dynasty'), (SELECT id FROM entities WHERE name = 'Chalukya Dynasty'), 'succeeded_by', 0.85, 0.88, '{"year": 540}'),
-- Hoysala Dynasty succeeded Chalukya Dynasty
((SELECT id FROM entities WHERE name = 'Chalukya Dynasty'), (SELECT id FROM entities WHERE name = 'Hoysala Dynasty'), 'succeeded_by', 0.85, 0.88, '{"year": 1026}'),
-- Kittur Chennamma fought from Belagavi
((SELECT id FROM entities WHERE name = 'Kittur Chennamma'), (SELECT id FROM entities WHERE name = 'Belagavi'), 'associated_with', 0.90, 0.92, '{"type": "rule"}'),
-- Rani Abbakka fought from Mangalore
((SELECT id FROM entities WHERE name = 'Rani Abbakka'), (SELECT id FROM entities WHERE name = 'Mangalore'), 'associated_with', 0.90, 0.92, '{"type": "rule"}'),
-- Seringapatam was Tipu Sultan's capital
((SELECT id FROM entities WHERE name = 'Tipu Sultan'), (SELECT id FROM entities WHERE name = 'Seringapatam'), 'ruled_from', 0.95, 0.97, '{"period": "1782-1799"}'),
-- Kolar Gold Fields in Kolar district
((SELECT id FROM entities WHERE name = 'Kolar Gold Fields'), (SELECT id FROM entities WHERE name = 'Kolar'), 'located_in', 0.95, 0.98, '{}'),
-- Mysuru Palace in Mysuru district
((SELECT id FROM entities WHERE name = 'Mysore Palace'), (SELECT id FROM entities WHERE name = 'Mysuru'), 'located_in', 0.95, 0.98, '{}');
```

**Interlinking**:
- **Graph Node** → Click entity → `Document Viewer` (documents mentioning entity via `document_entity_links`)
- **Graph Node** → Click "Chat" → `RAG Chat` (ask about entity)
- **Graph Node** → Click "Timeline" → `Timeline` (entity's life/period events)
- **Graph Node** → Click "District" → `District Explorer` (if entity is place)
- **Graph Node** → "Search" → `Search` (search for entity name)
- **Timeline** → Click event → `Knowledge Graph` (entity detail)
- **Timeline** → Click "Documents" → `Search` (documents from that year)
- **Graph Exploration** → Save to `graph_explorations` table for user history

**Implementation**:
- Update `app/api/knowledge-graph/route.ts` to:
  - Return `related_documents` array from `document_entity_links`
  - Return `timeline_events` for temporal entities
  - Return `district_info` for place entities
- Create `lib/graph-interlinking.ts` service
- Update `GraphSidebar` component with action buttons
- Add "View Documents" panel to entity detail

**New Data**:
- 20+ historical entities (dynasties, rulers, places, events)
- 15+ entity relationships (ruled, succeeded_by, built, capital_at, etc.)
- Entity-document links for all major entities
- Graph exploration history tracking

---

### Feature 6: District Explorer

#### Current State
- District cards with mock data
- District detail pages
- Category stats per district

#### Upgrade Plan

**Data Population**:
```sql
-- Populate district_statistics with real data
INSERT INTO district_statistics (district_id, document_count, category_distribution, year_range, popular_searches, top_entities)
SELECT 
    d.id,
    COUNT(a.id),
    jsonb_object_agg(c.name, COUNT(a.id)) FILTER (WHERE c.name IS NOT NULL),
    jsonb_build_object('from', MIN(a.year), 'to', MAX(a.year)),
    jsonb_build_array('Mysuru history', 'temple records'),
    jsonb_build_array('Tipu Sultan', 'Mysore Palace')
FROM districts d
LEFT JOIN archives a ON a.district_id = d.id
LEFT JOIN categories c ON a.category_id = c.id
GROUP BY d.id;

-- Ensure all 31 districts have data
```

**Interlinking**:
- **District Card** → Click "Documents" → `Search` (filter: district)
- **District Card** → Click "Entities" → `Knowledge Graph` (entities in district)
- **District Card** → Click "Timeline" → `Timeline` (events in district)
- **District Card** → Click "Upload" → `Upload` (pre-fill district)
- **District Detail** → "Related Districts" → Other districts with similar entities
- **District Detail** → "Popular Categories" → `Category Browser` (filter by district)

**Implementation**:
- Update `app/api/districts/route.ts` to return `district_statistics`
- Update `app/districts/[district]/page.tsx` to:
  - Fetch `document_entity_links` for top entities
  - Fetch `popular_queries` for district
  - Show timeline of district events
- Create `lib/district-interlinking.ts` service
- Update `DistrictCard` and `DistrictDetailHeader` components

**New Data**:
- All 31 Karnataka districts with real stats
- District category distribution
- Top 5 entities per district
- District timeline events
- Popular searches per district

---

### Feature 7: Category Browser

#### Current State
- Category cards with mock counts
- Category detail pages
- Document listings

#### Upgrade Plan

**Data Population**:
```sql
-- Populate category_statistics
INSERT INTO category_statistics (category_id, document_count, district_distribution, year_range, popular_searches, top_entities)
SELECT 
    c.id,
    COUNT(a.id),
    jsonb_object_agg(d.name, COUNT(a.id)) FILTER (WHERE d.name IS NOT NULL),
    jsonb_build_object('from', MIN(a.year), 'to', MAX(a.year)),
    jsonb_build_array('land records', 'revenue deeds'),
    jsonb_build_array('Tipu Sultan', 'Mysore Palace')
FROM categories c
LEFT JOIN archives a ON a.category_id = c.id
LEFT JOIN districts d ON a.district_id = d.id
GROUP BY c.id;
```

**Interlinking**:
- **Category Card** → Click "Documents" → `Search` (filter: category)
- **Category Card** → Click "Districts" → `District Explorer` (districts with this category)
- **Category Card** → Click "Entities" → `Knowledge Graph` (entities in this category)
- **Category Detail** → "Upload" → `Upload` (pre-fill category)

**Implementation**:
- Update `app/api/categories/route.ts` to return `category_statistics`
- Update `app/categories/[category]/page.tsx` with cross-links
- Create `lib/category-interlinking.ts` service

**New Data**:
- All categories with real document counts
- District distribution per category
- Year range per category
- Top entities per category

---

### Feature 8: Upload & Ingestion Pipeline

#### Current State
- File upload with metadata
- Processing status tracking
- OCR pipeline

#### Upgrade Plan

**Data Population**:
- Trigger automatic entity extraction after OCR
- Trigger automatic embedding generation
- Trigger automatic chunking
- Link uploaded documents to user dashboard

**Interlinking**:
- **Upload Complete** → "View Document" → `Document Viewer`
- **Upload Complete** → "View in Dashboard" → `Dashboard`
- **Upload Complete** → "Ask AI" → `RAG Chat` (document context)
- **Upload Complete** → "View Entities" → `Knowledge Graph` (extracted entities)
- **Processing Status** → "View Queue" → `Admin` (ingestion analytics)
- **Processing Error** → "Retry" → Retriggers pipeline

**Implementation**:
- Update `lib/upload-service.ts` to:
  - Trigger entity extraction after OCR
  - Insert `document_entity_links` for extracted entities
  - Queue embedding generation job
  - Update `district_statistics` and `category_statistics`
- Create `lib/upload-interlinking.ts` service
- Update upload success page with cross-feature links

**New Data**:
- Processing pipeline tracking
- Entity extraction results
- Automatic statistics updates
- User notification system

---

### Feature 9: Dashboard & Bookmarks

#### Current State
- User upload history
- Bookmarks page
- User profile

#### Upgrade Plan

**Data Population**:
```sql
-- Populate user activity feed
-- Populate bookmarks with real data
-- Add user-specific recommendations

-- Example: Create recommendations based on activity
-- "You viewed 3 documents about Tipu Sultan, explore the Knowledge Graph"
-- "You searched for Mysuru 5 times, check the District Explorer"
```

**Interlinking**:
- **Dashboard** → "Recent Documents" → `Document Viewer`
- **Dashboard** → "Bookmarks" → `Bookmarks` page
- **Dashboard** → "Recent Searches" → `Search` (pre-filled query)
- **Dashboard** → "Chat History" → `Chat` (session history)
- **Dashboard** → "Recommendations" → `Search` / `Knowledge Graph` / `District Explorer`
- **Bookmarks** → Click document → `Document Viewer`
- **Bookmarks** → "Ask AI" → `RAG Chat` (bookmark context)
- **Bookmarks** → "Explore" → `Knowledge Graph` (entities in bookmarked docs)

**Implementation**:
- Update `app/dashboard/page.tsx` to:
  - Fetch `user_activity_feed` for personalized recommendations
  - Show "Suggested for You" based on activity
  - Show trending in user's interests
- Create `lib/dashboard-interlinking.ts` service
- Add recommendation engine based on user activity

**New Data**:
- User activity feed with 7-day history
- Personalized recommendations
- Trending in user's interests
- Bookmark collections

---

### Feature 10: Admin Panel

#### Current State
- System overview
- Database analytics
- Health checks
- Testing suite
- Wikipedia ingestion

#### Upgrade Plan

**Data Population**:
- Real system health metrics
- Real evaluation benchmark results
- Real ingestion pipeline status
- Real search analytics

**Interlinking**:
- **Admin Dashboard** → "Search Analytics" → Detailed analytics page
- **Admin Dashboard** → "Ingestion Status" → Pipeline monitoring
- **Admin Dashboard** → "Knowledge Graph" → Graph analytics
- **Admin Dashboard** → "User Activity" → User analytics
- **Admin Dashboard** → "Security" → Audit logs
- **Admin** → "System Health" → `Admin/Health` page
- **Admin** → "Database" → `Admin/Database` page
- **Admin** → "Keys" → `Admin/Keys` page

**Implementation**:
- Update `app/api/admin/overview/route.ts` to:
  - Aggregate data from all feature tables
  - Return cross-feature analytics
- Create `lib/admin-interlinking.ts` service
- Add admin alerts for pipeline failures
- Add admin recommendations for popular content

**New Data**:
- System health metrics
- Cross-feature analytics
- User engagement metrics
- Security audit trail

---

### Feature 11: Analytics & Monitoring

#### Current State
- Search analytics
- Ingestion analytics
- RAG analytics
- Graph analytics

#### Upgrade Plan

**Data Population**:
- Populate `search_logs` with real query data
- Populate `chat_sessions` with real conversation data
- Populate `user_activity_feed` with real events
- Populate `graph_explorations` with real explorations

**Interlinking**:
- **Analytics** → "Top Searches" → `Search` (run query)
- **Analytics** → "Top Documents" → `Document Viewer`
- **Analytics** → "Top Entities" → `Knowledge Graph`
- **Analytics** → "Top Districts" → `District Explorer`
- **Analytics** → "Top Categories" → `Category Browser`

**Implementation**:
- Update analytics endpoints to aggregate from all feature tables
- Create `lib/analytics-interlinking.ts` service
- Add "Drill Down" buttons from analytics to feature pages

**New Data**:
- 30 days of search history
- 30 days of chat history
- 30 days of user activity
- 30 days of graph exploration

---

### Feature 12: Timeline

#### Current State
- Timeline events display
- Animated timeline
- Date-based browsing

#### Upgrade Plan

**Data Population**:
```sql
-- Create timeline events from entities and archives
INSERT INTO timeline_events (entity_id, event_date, event_type, title, description, importance)
SELECT 
    e.id,
    e.birth_date,
    'birth',
    e.name || ' born',
    e.name || ' was born in ' || (e.entity_metadata->>'region') || '.',
    8
FROM entities e
WHERE e.birth_date IS NOT NULL;

INSERT INTO timeline_events (entity_id, event_date, event_type, title, description, importance)
SELECT 
    e.id,
    e.death_date,
    'death',
    e.name || ' died',
    e.name || ' died at ' || (e.entity_metadata->>'capital') || '.',
    8
FROM entities e
WHERE e.death_date IS NOT NULL;

-- Add archive-based events
INSERT INTO timeline_events (archive_id, event_date, event_type, title, description, importance)
SELECT 
    a.id,
    a.date || '-01-01',
    'document',
    a.title,
    'Document created: ' || a.title,
    5
FROM archives a
WHERE a.date IS NOT NULL;
```

**Interlinking**:
- **Timeline Event** → Click "Document" → `Document Viewer`
- **Timeline Event** → Click "Entity" → `Knowledge Graph`
- **Timeline Event** → Click "Search" → `Search` (year-based query)
- **Timeline Event** → Click "District" → `District Explorer`
- **Timeline** → "View as Graph" → `Knowledge Graph` (temporal view)

**Implementation**:
- Create `app/api/timeline/route.ts` endpoint
- Update `app/timeline/page.tsx` to:
  - Fetch timeline events from database
  - Link to documents and entities
  - Add cross-feature navigation
- Create `lib/timeline-interlinking.ts` service

**New Data**:
- 100+ timeline events from entities
- 500+ timeline events from documents
- Event importance scoring
- Decade-based filtering

---

## Phase 3: Cross-Feature Navigation System

### Global Navigation Enhancement

Add a **"Context Bar"** that appears on every page showing:
- Last 3 searches (quick re-search)
- Last 2 viewed documents (quick re-open)
- Last 1 chat session (quick continue)
- Trending entity (quick explore)

### Breadcrumb System

Enhanced breadcrumbs with cross-feature links:
```
Home > Search > "Mysuru" > Document "Tipu Sultan's Letter" > Entity "Tipu Sultan" > Knowledge Graph
```

Each breadcrumb step is clickable and navigates to the feature.

### Quick Action Buttons

On every feature page, add "Quick Actions":
- **Search Page**: "Ask AI about these results", "View as Knowledge Graph", "Add to Timeline"
- **Document Viewer**: "Search similar", "Ask AI", "View Timeline", "Explore Graph"
- **Chat**: "Search sources", "View Documents", "Explore Entities"
- **Knowledge Graph**: "Search Documents", "View Timeline", "Chat about Entity"
- **Timeline**: "Search Events", "View Graph", "Explore Documents"
- **District Explorer**: "Search District", "View Graph", "Chat about District"
- **Category Browser**: "Search Category", "View Documents", "Explore Graph"

---

## Phase 4: AI-Powered Recommendations

### Recommendation Engine

Create `lib/recommendations.ts` that generates:

1. **Document Recommendations**:
   - Based on: viewed documents, bookmarked documents, search history
   - Method: Find documents sharing entities with viewed documents
   - Query: `SELECT a2.* FROM archives a2 JOIN document_entity_links l2 ON a2.id = l2.archive_id WHERE l2.entity_id IN (SELECT entity_id FROM document_entity_links WHERE archive_id = $viewed_doc) AND a2.id != $viewed_doc`

2. **Entity Recommendations**:
   - Based on: explored entities, chat mentions, document views
   - Method: Find related entities via relationship graph
   - Query: `SELECT e.* FROM entities e JOIN entity_relationships r ON e.id = r.entity_id_to WHERE r.entity_id_from = $explored_entity`

3. **District Recommendations**:
   - Based on: searched districts, viewed documents, bookmarked documents
   - Method: Find districts with similar entity profiles
   - Query: `SELECT d.* FROM districts d WHERE d.id IN (SELECT district_id FROM archives WHERE category_id IN (SELECT category_id FROM archives WHERE district_id = $user_district))`

4. **Search Recommendations**:
   - Based on: search history, trending queries
   - Method: Suggest related queries from `popular_queries`
   - Query: `SELECT * FROM popular_queries WHERE query_normalized LIKE '%' || $user_query || '%' ORDER BY search_count DESC`

5. **Chat Recommendations**:
   - Based on: chat history, document views, entity interests
   - Method: Suggest follow-up questions based on cited entities
   - Query: `SELECT * FROM entities WHERE id IN (SELECT cited_entities FROM chat_sessions WHERE user_id = $user_id)`

### Personalized Dashboard

Update the Dashboard to show:
- **Recommended Documents**: Based on viewing history
- **Recommended Entities**: Based on graph exploration
- **Recommended Districts**: Based on search history
- **Recommended Searches**: Based on trending + personal interests
- **Recommended Chat Topics**: Based on document interests

---

## Phase 5: Implementation Roadmap

### Week 1: Database Schema & Data Seeding
- [ ] Create migration `20260619_upgrade_plan_schema.sql`
- [ ] Apply migration to Supabase
- [ ] Seed entities (20+ historical figures, places, events)
- [ ] Seed entity relationships (15+ connections)
- [ ] Seed district statistics (31 districts)
- [ ] Seed category statistics (all categories)
- [ ] Seed popular queries (50+ queries)
- [ ] Seed timeline events (100+ events)
- [ ] Seed document-entity links (500+ links)
- [ ] Verify data integrity

### Week 2: Core Interlinking Services
- [ ] Create `lib/homepage-data.ts`
- [ ] Create `lib/search-interlinking.ts`
- [ ] Create `lib/chat-interlinking.ts`
- [ ] Create `lib/document-interlinking.ts`
- [ ] Create `lib/graph-interlinking.ts`
- [ ] Create `lib/district-interlinking.ts`
- [ ] Create `lib/category-interlinking.ts`
- [ ] Create `lib/upload-interlinking.ts`
- [ ] Create `lib/dashboard-interlinking.ts`
- [ ] Create `lib/timeline-interlinking.ts`
- [ ] Create `lib/recommendations.ts`

### Week 3: Feature Page Updates
- [ ] Update `app/page.tsx` with real data
- [ ] Update `app/search/page.tsx` with interlinking
- [ ] Update `app/chat/page.tsx` with interlinking
- [ ] Update `app/documents/[id]/page.tsx` with interlinking
- [ ] Update `app/knowledge-graph/page.tsx` with interlinking
- [ ] Update `app/districts/page.tsx` with interlinking
- [ ] Update `app/categories/page.tsx` with interlinking
- [ ] Update `app/upload/page.tsx` with interlinking
- [ ] Update `app/dashboard/page.tsx` with interlinking
- [ ] Update `app/timeline/page.tsx` with interlinking

### Week 4: API Route Updates
- [ ] Update `app/api/search/route.ts` with cross-feature data
- [ ] Update `app/api/ai/chat/route.ts` with citations
- [ ] Update `app/api/documents/[id]/route.ts` with related docs
- [ ] Update `app/api/knowledge-graph/route.ts` with document links
- [ ] Update `app/api/districts/route.ts` with statistics
- [ ] Update `app/api/categories/route.ts` with statistics
- [ ] Update `app/api/timeline/route.ts` with events
- [ ] Create `app/api/recommendations/route.ts`
- [ ] Create `app/api/activity/route.ts` for user activity

### Week 5: UI/UX Enhancements
- [ ] Add Quick Action buttons to all feature pages
- [ ] Add Context Bar to navigation
- [ ] Add Breadcrumb system with cross-links
- [ ] Update `SearchResultCard` with action buttons
- [ ] Update `DocumentViewer` with action buttons
- [ ] Update `GraphSidebar` with action buttons
- [ ] Update `DistrictCard` with action buttons
- [ ] Update `CategoryCard` with action buttons
- [ ] Add recommendation widgets to Dashboard
- [ ] Add "Trending" sections to Homepage

### Week 6: Testing & Polish
- [ ] Test all cross-feature links
- [ ] Test data accuracy
- [ ] Test recommendation engine
- [ ] Test admin analytics
- [ ] Performance testing
- [ ] Security audit
- [ ] Documentation update
- [ ] Deploy to production

---

## Phase 6: Data Quality & Maintenance

### Automated Data Updates

Create a background job (or Edge Function) that runs daily to:
1. Update `district_statistics` from current archive counts
2. Update `category_statistics` from current archive counts
3. Update `popular_queries` from `search_logs`
4. Update `archive` view counts from user activity
5. Update entity relevance scores from document mentions
6. Update `recommendation` engine training data

### Data Validation

- Ensure all documents have at least one entity link
- Ensure all entities have at least one document link
- Ensure all districts have statistics
- Ensure all categories have statistics
- Validate cross-feature link integrity

### Data Enrichment

- Add Kannada translations for all entity names
- Add Hindi translations for major entities
- Add entity images (thumbnail URLs)
- Add document thumbnails
- Add district images
- Add category icons

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Cross-feature click-through rate | >30% | Track `search_feature_clicks` |
| User engagement time | >5 min/session | Track `user_activity_feed` |
| Feature adoption | >3 features/user | Track unique activity types |
| Search-to-document conversion | >40% | Track search → document_view |
| Chat-to-document conversion | >25% | Track chat → document_view |
| Graph-to-document conversion | >20% | Track graph → document_view |
| Recommendation accuracy | >50% click rate | Track recommendation clicks |
| Data freshness | <24 hours | Last update timestamp |
| System performance | <2s response | API response times |

---

## Files to Create/Modify

### New Files
- `lib/homepage-data.ts`
- `lib/search-interlinking.ts`
- `lib/chat-interlinking.ts`
- `lib/document-interlinking.ts`
- `lib/graph-interlinking.ts`
- `lib/district-interlinking.ts`
- `lib/category-interlinking.ts`
- `lib/upload-interlinking.ts`
- `lib/dashboard-interlinking.ts`
- `lib/timeline-interlinking.ts`
- `lib/recommendations.ts`
- `app/api/recommendations/route.ts`
- `app/api/activity/route.ts`
- `app/api/timeline/route.ts`
- `supabase/migrations/20260619_upgrade_plan_schema.sql`
- `supabase/migrations/20260619_seed_entities.sql`
- `supabase/migrations/20260619_seed_statistics.sql`
- `components/shared/ContextBar.tsx`
- `components/shared/QuickActions.tsx`
- `components/shared/BreadcrumbNav.tsx`
- `components/shared/RecommendationWidget.tsx`

### Modified Files
- `app/page.tsx`
- `app/search/page.tsx`
- `app/chat/page.tsx`
- `app/documents/[id]/page.tsx`
- `app/knowledge-graph/page.tsx`
- `app/districts/page.tsx`
- `app/districts/[district]/page.tsx`
- `app/categories/page.tsx`
- `app/categories/[category]/page.tsx`
- `app/upload/page.tsx`
- `app/dashboard/page.tsx`
- `app/bookmarks/page.tsx`
- `app/timeline/page.tsx`
- `app/api/search/route.ts`
- `app/api/ai/chat/route.ts`
- `app/api/documents/[id]/route.ts`
- `app/api/knowledge-graph/route.ts`
- `app/api/districts/route.ts`
- `app/api/districts/[district]/route.ts`
- `app/api/categories/route.ts`
- `app/api/categories/[category]/route.ts`
- `app/api/archives/route.ts`
- `components/search/SearchResultCard.tsx`
- `components/advanced-document-viewer/index.tsx`
- `components/knowledge-graph/GraphSidebar.tsx`
- `components/explorer/DistrictCard.tsx`
- `components/explorer/CategoryCard.tsx`
- `components/sidebar.tsx`
- `components/navbar.tsx`

---

## API Keys Status

| Key | Status | Feature Used |
|-----|--------|-------------|
| `GEMINI_API_KEY` | ✅ Ready | Fallback for all features |
| `GEMINI_KEY_SEARCH` | ✅ Ready | AI Search, query expansion |
| `GEMINI_KEY_AGENT` | ✅ Ready | AI agents, document analysis |
| `GEMINI_KEY_CHAT` | ✅ Ready | RAG Chat, conversational AI |
| `GEMINI_KEY_FINDING` | ✅ Ready | Document discovery |
| `GEMINI_KEY_GRAPH` | ✅ Ready | Knowledge graph, entity extraction |
| `GEMINI_KEY_OTHER` | ✅ Ready | OCR, embeddings, misc |
| `OPENAI_API_KEY` | ✅ Ready | Embeddings, vector search |

---

## Conclusion

This upgrade plan transforms Neurive from a demo platform into a production-ready, data-rich, interconnected digital archive intelligence system. By:

1. **Adding real data** to every feature (documents, entities, statistics, analytics)
2. **Interlinking all features** so users can seamlessly navigate between Search, Chat, Documents, Graph, Timeline, Districts, and Categories
3. **Adding AI-powered recommendations** that learn from user behavior
4. **Creating a unified analytics system** that tracks cross-feature usage
5. **Building a comprehensive data maintenance pipeline** that keeps data fresh

The result is a platform where every feature is connected, every click leads to relevant data, and every user journey is personalized and intelligent.

---

**Ready to implement?** Start with Phase 1 (schema migration) and work through each phase week by week.
