/*
# Seed Interlinking Data

## Purpose
Populates all the bridge tables and cross-feature data needed for the upgrade:
1. Link archives to districts and categories based on document titles
2. Create document-entity links from archive titles
3. Seed timeline events from existing entities
4. Seed popular queries
5. Compute district and category statistics

## Data Added
- 20 archives get district_id and category_id assignments
- 20+ document-entity links
- 25+ timeline events
- 20+ popular queries
- District and category statistics computed from real data
*/

-- ============================================
-- 1. LINK ARCHIVES TO DISTRICTS AND CATEGORIES
-- ============================================
-- Get district IDs first
WITH district_ids AS (
  SELECT id, name FROM districts
)
UPDATE archives
SET district_id = (
  CASE
    WHEN title ILIKE '%Mysore%' OR title ILIKE '%Mysuru%' THEN (SELECT id FROM districts WHERE name = 'Mysuru')
    WHEN title ILIKE '%Bangalore%' OR title ILIKE '%Bengaluru%' THEN (SELECT id FROM districts WHERE name = 'Bangalore Urban')
    WHEN title ILIKE '%Shimoga%' OR title ILIKE '%Shivamogga%' THEN (SELECT id FROM districts WHERE name = 'Shivamogga')
    WHEN title ILIKE '%Belgaum%' OR title ILIKE '%Belagavi%' THEN (SELECT id FROM districts WHERE name = 'Belagavi')
    WHEN title ILIKE '%Tumkur%' OR title ILIKE '%Tumakuru%' THEN (SELECT id FROM districts WHERE name = 'Tumakuru')
    WHEN title ILIKE '%Coorg%' OR title ILIKE '%Kodagu%' THEN (SELECT id FROM districts WHERE name = 'Kodagu')
    WHEN title ILIKE '%Raichur%' OR title ILIKE '%Raichuru%' THEN (SELECT id FROM districts WHERE name = 'Raichuru')
    WHEN title ILIKE '%Kolar%' OR title ILIKE '%Kolara%' THEN (SELECT id FROM districts WHERE name = 'Kolar')
    WHEN title ILIKE '%Hassan%' THEN (SELECT id FROM districts WHERE name = 'Hassan')
    WHEN title ILIKE '%Vijayanagara%' OR title ILIKE '%Hampi%' OR title ILIKE '%Ballari%' THEN (SELECT id FROM districts WHERE name = 'Ballari')
    WHEN title ILIKE '%Kittur%' OR title ILIKE '%Dharwad%' THEN (SELECT id FROM districts WHERE name = 'Dharwad')
    WHEN title ILIKE '%Chitradurga%' THEN (SELECT id FROM districts WHERE name = 'Chitradurga')
    WHEN title ILIKE '%Mangalore%' OR title ILIKE '%Mangaluru%' THEN (SELECT id FROM districts WHERE name = 'Dakshina Kannada')
    WHEN title ILIKE '%Udupi%' THEN (SELECT id FROM districts WHERE name = 'Udupi')
    WHEN title ILIKE '%Bidar%' THEN (SELECT id FROM districts WHERE name = 'Bidar')
    WHEN title ILIKE '%Gulbarga%' OR title ILIKE '%Kalaburagi%' THEN (SELECT id FROM districts WHERE name = 'Kalaburagi')
    WHEN title ILIKE '%Vijayapura%' OR title ILIKE '%Bijapur%' THEN (SELECT id FROM districts WHERE name = 'Vijayapura')
    WHEN title ILIKE '%Mandya%' THEN (SELECT id FROM districts WHERE name = 'Mandya')
    WHEN title ILIKE '%Madras%' THEN (SELECT id FROM districts WHERE name = 'Bangalore Urban')
    WHEN title ILIKE '%Karnataka%' THEN (SELECT id FROM districts WHERE name = 'Bangalore Urban')
    ELSE (SELECT id FROM districts WHERE name = 'Bangalore Urban')
  END
)
WHERE district_id IS NULL;

-- ============================================
-- 2. ASSIGN CATEGORIES TO ARCHIVES
-- ============================================
UPDATE archives
SET category_id = (
  CASE
    WHEN title ILIKE '%Land%' OR title ILIKE '%Revenue%' OR title ILIKE '%Survey%' OR title ILIKE '%Settlement%'
      THEN (SELECT id FROM categories WHERE name = 'Land Revenue Records')
    WHEN title ILIKE '%Census%' OR title ILIKE '%Gazette%' OR title ILIKE '%Register%'
      THEN (SELECT id FROM categories WHERE name = 'Census Reports')
    WHEN title ILIKE '%Treaty%' OR title ILIKE '%Decree%' OR title ILIKE '%Act%'
      THEN (SELECT id FROM categories WHERE name = 'Royal Decrees')
    WHEN title ILIKE '%Temple%' OR title ILIKE '%Endowment%'
      THEN (SELECT id FROM categories WHERE name = 'Temple Inscriptions')
    WHEN title ILIKE '%Court%' OR title ILIKE '%Judgment%'
      THEN (SELECT id FROM categories WHERE name = 'Court Records')
    WHEN title ILIKE '%Map%' OR title ILIKE '%Copper Plate%'
      THEN (SELECT id FROM categories WHERE name = 'Survey Maps')
    WHEN title ILIKE '%Chronicle%' OR title ILIKE '%Correspondence%'
      THEN (SELECT id FROM categories WHERE name = 'Historical Manuscripts')
    WHEN title ILIKE '%Fort%' OR title ILIKE '%Military%'
      THEN (SELECT id FROM categories WHERE name = 'Military Records')
    ELSE (SELECT id FROM categories WHERE name = 'Historical Manuscripts')
  END
)
WHERE category_id IS NULL;

-- ============================================
-- 3. SEED DOCUMENT-ENTITY LINKS
-- ============================================
INSERT INTO document_entity_links (archive_id, entity_id, mention_count, contexts, confidence_score)
SELECT 
  a.id,
  e.id,
  3,
  jsonb_build_array(
    jsonb_build_object('page', 1, 'text', 'Mentioned in ' || a.title),
    jsonb_build_object('page', 2, 'text', 'Related to ' || e.name)
  ),
  0.85
FROM archives a
JOIN entities e ON (
  (a.title ILIKE '%' || e.name || '%') OR
  (a.title ILIKE '%Mysore%' AND e.name ILIKE '%Mysore%') OR
  (a.title ILIKE '%Bangalore%' AND e.name ILIKE '%Bangalore%') OR
  (a.title ILIKE '%Vijayanagara%' AND e.name ILIKE '%Vijayanagara%') OR
  (a.title ILIKE '%Tipu%' AND e.name ILIKE '%Tipu%') OR
  (a.title ILIKE '%Kolar%' AND e.name ILIKE '%Kolar%') OR
  (a.title ILIKE '%Kempe%' AND e.name ILIKE '%Kempe%') OR
  (a.title ILIKE '%Hoysala%' AND e.name ILIKE '%Hoysala%') OR
  (a.title ILIKE '%Chennakeshava%' AND e.name ILIKE '%Chennakeshava%') OR
  (a.title ILIKE '%Seringapatam%' AND e.name ILIKE '%Srirangapatna%') OR
  (a.title ILIKE '%Belur%' AND e.name ILIKE '%Belur%') OR
  (a.title ILIKE '%Kittur%' AND e.name ILIKE '%Kittur%') OR
  (a.title ILIKE '%Chitradurga%' AND e.name ILIKE '%Chitradurga%') OR
  (a.title ILIKE '%Gol Gumbaz%' AND e.name ILIKE '%Gol Gumbaz%') OR
  (a.title ILIKE '%Hampi%' AND e.name ILIKE '%Hampi%') OR
  (a.title ILIKE '%Krishnadevaraya%' AND e.name ILIKE '%Krishnadevaraya%') OR
  (a.title ILIKE '%Hyder%' AND e.name ILIKE '%Hyder%')
)
ON CONFLICT (archive_id, entity_id) DO NOTHING;

-- ============================================
-- 4. SEED TIMELINE EVENTS
-- ============================================
INSERT INTO timeline_events (entity_id, event_date, event_type, title, description, importance)
SELECT 
  e.id,
  e.birth_date,
  'birth',
  e.name || ' was born',
  e.name || ' was born' || COALESCE(' in the ' || (e.entity_metadata->>'dynasty') || ' dynasty', '') || '.',
  8
FROM entities e
WHERE e.birth_date IS NOT NULL AND e.entity_type = 'person'
ON CONFLICT DO NOTHING;

INSERT INTO timeline_events (entity_id, event_date, event_type, title, description, importance)
SELECT 
  e.id,
  e.death_date,
  'death',
  e.name || ' died',
  e.name || ' passed away' || COALESCE(' at ' || (e.entity_metadata->>'capital'), '') || '.',
  8
FROM entities e
WHERE e.death_date IS NOT NULL AND e.entity_type = 'person'
ON CONFLICT DO NOTHING;

-- Dynasty founding events
INSERT INTO timeline_events (entity_id, event_date, event_type, title, description, importance)
SELECT 
  e.id,
  e.birth_date,
  'other',
  e.name || ' dynasty founded',
  'The ' || e.name || ' was established' || COALESCE(' with capital at ' || (e.entity_metadata->>'capital'), '') || '.',
  9
FROM entities e
WHERE e.birth_date IS NOT NULL AND e.entity_type = 'organization'
ON CONFLICT DO NOTHING;

-- Dynasty end events
INSERT INTO timeline_events (entity_id, event_date, event_type, title, description, importance)
SELECT 
  e.id,
  e.death_date,
  'other',
  e.name || ' dynasty ended',
  'The ' || e.name || ' came to an end.',
  7
FROM entities e
WHERE e.death_date IS NOT NULL AND e.entity_type = 'organization'
ON CONFLICT DO NOTHING;

-- Place construction events
INSERT INTO timeline_events (entity_id, event_date, event_type, title, description, importance)
SELECT 
  e.id,
  TO_DATE((e.entity_metadata->>'built_year') || '-01-01', 'YYYY-MM-DD'),
  'construction',
  e.name || ' constructed',
  e.name || ' was built' || COALESCE(' in ' || (e.entity_metadata->>'district'), '') || '.',
  7
FROM entities e
WHERE e.entity_metadata->>'built_year' IS NOT NULL AND e.entity_type IN ('place', 'artifact')
ON CONFLICT DO NOTHING;

-- Event-specific dates
INSERT INTO timeline_events (entity_id, event_date, event_type, title, description, importance)
VALUES
  ('951ef15d-aef1-489f-af3b-d91e2ed8a2bb', '1799-05-04', 'battle', 'Fourth Anglo-Mysore War ends', 'Tipu Sultan died defending Seringapatam. The British gained control of Mysore.', 10),
  ('0f082820-01f6-4c75-a80f-b94beea5efb7', '1956-11-01', 'other', 'Karnataka State formed', 'The States Reorganization Act created the modern state of Karnataka from Mysore State.', 10)
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. SEED POPULAR QUERIES
-- ============================================
INSERT INTO popular_queries (query, query_normalized, search_count, featured, result_count, avg_relevance_score) VALUES
('Mysore Palace history', 'mysore palace history', 156, true, 12, 0.89),
('Tipu Sultan battles', 'tipu sultan battles', 142, true, 8, 0.92),
('Karnataka land records 1890', 'karnataka land records 1890', 98, true, 15, 0.85),
('Kannada inscriptions', 'kannada inscriptions', 87, true, 20, 0.88),
('Vijayanagara empire temples', 'vijayanagara empire temples', 76, true, 10, 0.91),
('Bangalore cantonment records', 'bangalore cantonment records', 65, true, 6, 0.83),
('Hoysala architecture', 'hoysala architecture', 54, true, 14, 0.90),
('Kempe Gowda Bangalore', 'kempe gowda bangalore', 48, true, 5, 0.87),
('Kolar gold fields', 'kolar gold fields', 43, true, 7, 0.84),
('Chitradurga fort history', 'chitradurga fort history', 41, true, 9, 0.86),
('Krishnadevaraya reign', 'krishnadevaraya reign', 39, true, 11, 0.93),
('Hyder Ali Mysore', 'hyder ali mysore', 37, true, 6, 0.88),
('Kittur Chennamma rebellion', 'kittur chennamma rebellion', 35, true, 4, 0.85),
('Hampi ruins', 'hampi ruins', 33, true, 18, 0.90),
('Chennakeshava temple Belur', 'chennakeshava temple belur', 31, true, 8, 0.92),
('Badami cave temples', 'badami cave temples', 29, true, 12, 0.89),
('Gol Gumbaz Bijapur', 'gol gumbaz bijapur', 27, true, 5, 0.87),
('Rani Abbakka Ullal', 'rani abbakka ullal', 25, true, 3, 0.82),
('Kadamba dynasty Banavasi', 'kadamba dynasty banavasi', 23, true, 7, 0.84),
('Chalukya architecture Pattadakal', 'chalukya architecture pattadakal', 21, true, 10, 0.91)
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. COMPUTE DISTRICT STATISTICS
-- ============================================
INSERT INTO district_statistics (district_id, document_count, category_distribution, year_range, popular_searches, top_entities, view_count)
SELECT 
  d.id,
  COUNT(a.id),
  COALESCE(
    (SELECT jsonb_object_agg(c.name, sub.count)
     FROM (SELECT a2.category_id, COUNT(*) as count FROM archives a2 WHERE a2.district_id = d.id AND a2.category_id IS NOT NULL GROUP BY a2.category_id) sub
     JOIN categories c ON c.id = sub.category_id),
    '{}'::jsonb
  ),
  jsonb_build_object('from', COALESCE(MIN(a.year), 0), 'to', COALESCE(MAX(a.year), 0)),
  jsonb_build_array(
    (SELECT query FROM popular_queries ORDER BY search_count DESC LIMIT 1),
    (SELECT query FROM popular_queries ORDER BY search_count DESC OFFSET 1 LIMIT 1)
  ),
  jsonb_build_array(
    (SELECT e.name FROM entities e WHERE e.entity_metadata->>'district' = d.name LIMIT 1),
    (SELECT e.name FROM entities e WHERE e.entity_metadata->>'district' = d.name OFFSET 1 LIMIT 1)
  ),
  0
FROM districts d
LEFT JOIN archives a ON a.district_id = d.id
GROUP BY d.id
ON CONFLICT (district_id) DO UPDATE SET
  document_count = EXCLUDED.document_count,
  category_distribution = EXCLUDED.category_distribution,
  year_range = EXCLUDED.year_range,
  popular_searches = EXCLUDED.popular_searches,
  top_entities = EXCLUDED.top_entities,
  last_updated = NOW();

-- ============================================
-- 7. COMPUTE CATEGORY STATISTICS
-- ============================================
INSERT INTO category_statistics (category_id, document_count, district_distribution, year_range, popular_searches, top_entities, view_count)
SELECT 
  c.id,
  COUNT(a.id),
  COALESCE(
    (SELECT jsonb_object_agg(d.name, sub.count)
     FROM (SELECT a2.district_id, COUNT(*) as count FROM archives a2 WHERE a2.category_id = c.id AND a2.district_id IS NOT NULL GROUP BY a2.district_id) sub
     JOIN districts d ON d.id = sub.district_id),
    '{}'::jsonb
  ),
  jsonb_build_object('from', COALESCE(MIN(a.year), 0), 'to', COALESCE(MAX(a.year), 0)),
  jsonb_build_array(
    (SELECT query FROM popular_queries ORDER BY search_count DESC LIMIT 1),
    (SELECT query FROM popular_queries ORDER BY search_count DESC OFFSET 1 LIMIT 1)
  ),
  jsonb_build_array(
    (SELECT e.name FROM entities e LIMIT 1),
    (SELECT e.name FROM entities e OFFSET 1 LIMIT 1)
  ),
  0
FROM categories c
LEFT JOIN archives a ON a.category_id = c.id
GROUP BY c.id
ON CONFLICT (category_id) DO UPDATE SET
  document_count = EXCLUDED.document_count,
  district_distribution = EXCLUDED.district_distribution,
  year_range = EXCLUDED.year_range,
  popular_searches = EXCLUDED.popular_searches,
  top_entities = EXCLUDED.top_entities,
  last_updated = NOW();

-- ============================================
-- 8. UPDATE ARCHIVE ENTITY COUNTS
-- ============================================
UPDATE archives
SET entity_count = (
  SELECT COUNT(*) FROM document_entity_links WHERE archive_id = archives.id
),
relevance_score = 0.7 + (0.3 * RANDOM())
WHERE entity_count = 0;
