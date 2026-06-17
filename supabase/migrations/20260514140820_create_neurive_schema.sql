
/*
  # Neurive - Karnataka Digital Archive Intelligence Platform
  
  ## Schema Overview
  Creates the complete database schema for the Neurive platform.
  
  ## Tables Created
  1. `districts` - Karnataka districts (30 districts)
  2. `departments` - Government departments
  3. `categories` - Archive categories
  4. `users` - Platform users with roles
  5. `archives` - Core archival records (1M+ records)
  6. `ocr_data` - OCR extracted text from documents
  7. `ai_embeddings` - Vector embeddings for semantic search
  8. `favorites` - User bookmarks/favorites
  9. `collections` - User-created collections
  10. `collection_archives` - Junction table for collections
  11. `search_logs` - Search analytics
  12. `upload_sessions` - Upload tracking
  
  ## Security
  - RLS enabled on all tables
  - Policies for authenticated and public access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- DISTRICTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_kannada text NOT NULL,
  division text NOT NULL,
  headquarter text NOT NULL,
  taluk_count integer DEFAULT 0,
  area_sqkm numeric(10,2),
  population bigint,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Districts are publicly readable"
  ON districts FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================
-- DEPARTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_kannada text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Departments are publicly readable"
  ON departments FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_kannada text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon text DEFAULT 'folder',
  color text DEFAULT '#2563eb',
  parent_id uuid REFERENCES categories(id),
  record_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'archivist', 'researcher', 'user')),
  avatar_url text,
  organization text,
  bio text,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ============================================================
-- ARCHIVES TABLE (Core table - 1M records)
-- ============================================================
CREATE TABLE IF NOT EXISTS archives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_kannada text,
  description text,
  description_kannada text,
  category_id uuid REFERENCES categories(id),
  district_id uuid REFERENCES districts(id),
  department_id uuid REFERENCES departments(id),
  document_type text NOT NULL DEFAULT 'document',
  file_url text,
  thumbnail_url text,
  file_size bigint DEFAULT 0,
  file_type text DEFAULT 'pdf',
  page_count integer DEFAULT 1,
  year integer,
  decade text,
  date_recorded date,
  date_digitized timestamptz DEFAULT now(),
  accession_number text UNIQUE,
  reference_number text,
  language text DEFAULT 'kannada' CHECK (language IN ('kannada', 'english', 'both', 'other')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived', 'restricted')),
  access_level text DEFAULT 'public' CHECK (access_level IN ('public', 'restricted', 'private')),
  tags text[] DEFAULT '{}',
  keywords text[] DEFAULT '{}',
  subjects text[] DEFAULT '{}',
  source text,
  author text,
  publisher text,
  location text,
  taluk text,
  village text,
  survey_number text,
  view_count integer DEFAULT 0,
  download_count integer DEFAULT 0,
  bookmark_count integer DEFAULT 0,
  relevance_score numeric(5,4) DEFAULT 0.5,
  is_featured boolean DEFAULT false,
  has_ocr boolean DEFAULT false,
  has_embedding boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public archives are readable by everyone"
  ON archives FOR SELECT
  TO anon, authenticated
  USING (access_level = 'public' AND status = 'active');

CREATE POLICY "Authenticated users can read restricted archives"
  ON archives FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Admins can manage all archives"
  ON archives FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'archivist')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'archivist')
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_archives_category ON archives(category_id);
CREATE INDEX IF NOT EXISTS idx_archives_district ON archives(district_id);
CREATE INDEX IF NOT EXISTS idx_archives_year ON archives(year);
CREATE INDEX IF NOT EXISTS idx_archives_status ON archives(status);
CREATE INDEX IF NOT EXISTS idx_archives_access ON archives(access_level);
CREATE INDEX IF NOT EXISTS idx_archives_featured ON archives(is_featured);
CREATE INDEX IF NOT EXISTS idx_archives_created ON archives(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_archives_title_trgm ON archives USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_archives_tags ON archives USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_archives_keywords ON archives USING gin(keywords);

-- ============================================================
-- OCR DATA TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ocr_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_id uuid REFERENCES archives(id) ON DELETE CASCADE,
  raw_text text,
  processed_text text,
  language text DEFAULT 'kannada',
  confidence_score numeric(5,4) DEFAULT 0.0,
  page_number integer DEFAULT 1,
  word_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ocr_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "OCR data follows archive access"
  ON ocr_data FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM archives a 
      WHERE a.id = ocr_data.archive_id 
      AND a.access_level = 'public' 
      AND a.status = 'active'
    )
  );

CREATE INDEX IF NOT EXISTS idx_ocr_archive ON ocr_data(archive_id);
CREATE INDEX IF NOT EXISTS idx_ocr_text ON ocr_data USING gin(to_tsvector('english', COALESCE(processed_text, '')));

-- ============================================================
-- FAVORITES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  archive_id uuid REFERENCES archives(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, archive_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- COLLECTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  cover_image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own collections"
  ON collections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Public collections readable by anon"
  ON collections FOR SELECT
  TO anon
  USING (is_public = true);

CREATE POLICY "Users can manage own collections"
  ON collections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- COLLECTION ARCHIVES (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS collection_archives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  archive_id uuid REFERENCES archives(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE(collection_id, archive_id)
);

ALTER TABLE collection_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collection archives follow collection access"
  ON collection_archives FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collections c 
      WHERE c.id = collection_archives.collection_id 
      AND (c.is_public = true OR c.user_id = auth.uid())
    )
  );

CREATE POLICY "Collection owners can manage archives"
  ON collection_archives FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections c 
      WHERE c.id = collection_archives.collection_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Collection owners can remove archives"
  ON collection_archives FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collections c 
      WHERE c.id = collection_archives.collection_id 
      AND c.user_id = auth.uid()
    )
  );

-- ============================================================
-- SEARCH LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  user_id uuid REFERENCES users(id),
  results_count integer DEFAULT 0,
  filters jsonb DEFAULT '{}',
  response_time_ms integer DEFAULT 0,
  clicked_archive_id uuid REFERENCES archives(id),
  session_id text,
  ip_hash text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read search logs"
  ON search_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Anyone can insert search logs"
  ON search_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs USING gin(to_tsvector('english', query));

-- ============================================================
-- UPLOAD SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS upload_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  filename text NOT NULL,
  file_size bigint DEFAULT 0,
  file_type text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress integer DEFAULT 0,
  error_message text,
  result_archive_id uuid REFERENCES archives(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own uploads"
  ON upload_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create uploads"
  ON upload_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SEED: Karnataka Districts
-- ============================================================
INSERT INTO districts (name, name_kannada, division, headquarter, taluk_count, area_sqkm, population) VALUES
('Bagalkot', 'ಬಾಗಲಕೋಟೆ', 'Kalyana Karnataka', 'Bagalkot', 6, 6595.44, 1889752),
('Ballari', 'ಬಳ್ಳಾರಿ', 'Kalyana Karnataka', 'Ballari', 7, 8447.00, 2532383),
('Belagavi', 'ಬೆಳಗಾವಿ', 'Kittur Karnataka', 'Belagavi', 10, 13415.00, 4779661),
('Bengaluru Rural', 'ಬೆಂಗಳೂರು ಗ್ರಾಮಾಂತರ', 'Bengaluru', 'Bengaluru', 4, 2259.00, 990923),
('Bengaluru Urban', 'ಬೆಂಗಳೂರು ನಗರ', 'Bengaluru', 'Bengaluru', 4, 2196.00, 9621551),
('Bidar', 'ಬೀದರ್', 'Kalyana Karnataka', 'Bidar', 5, 5448.00, 1726079),
('Chamarajanagar', 'ಚಾಮರಾಜನಗರ', 'Mysuru', 'Chamarajanagar', 4, 5101.00, 1020791),
('Chikkaballapur', 'ಚಿಕ್ಕಬಳ್ಳಾಪುರ', 'Bengaluru', 'Chikkaballapur', 6, 4219.00, 1254494),
('Chikkamagaluru', 'ಚಿಕ್ಕಮಗಳೂರು', 'Mysuru', 'Chikkamagaluru', 7, 7201.00, 1137574),
('Chitradurga', 'ಚಿತ್ರದುರ್ಗ', 'Kalyana Karnataka', 'Chitradurga', 6, 8440.00, 1659456),
('Dakshina Kannada', 'ದಕ್ಷಿಣ ಕನ್ನಡ', 'Coastal Karnataka', 'Mangaluru', 5, 4843.00, 2089649),
('Davanagere', 'ದಾವಣಗೆರೆ', 'Kalyana Karnataka', 'Davanagere', 6, 5924.00, 1946905),
('Dharwad', 'ಧಾರವಾಡ', 'Kittur Karnataka', 'Dharwad', 5, 4263.00, 1847023),
('Gadag', 'ಗದಗ', 'Kittur Karnataka', 'Gadag', 5, 4656.00, 1065235),
('Hassan', 'ಹಾಸನ', 'Mysuru', 'Hassan', 8, 6814.00, 1776421),
('Haveri', 'ಹಾವೇರಿ', 'Kittur Karnataka', 'Haveri', 7, 4823.00, 1597668),
('Kalaburagi', 'ಕಲಬುರಗಿ', 'Kalyana Karnataka', 'Kalaburagi', 10, 16224.00, 2566326),
('Kodagu', 'ಕೊಡಗು', 'Mysuru', 'Madikeri', 3, 4102.00, 554762),
('Kolar', 'ಕೋಲಾರ', 'Bengaluru', 'Kolar', 5, 3969.00, 1540128),
('Koppal', 'ಕೊಪ್ಪಳ', 'Kalyana Karnataka', 'Koppal', 4, 7189.00, 1391000),
('Mandya', 'ಮಂಡ್ಯ', 'Mysuru', 'Mandya', 7, 4176.00, 1808680),
('Mysuru', 'ಮೈಸೂರು', 'Mysuru', 'Mysuru', 7, 6854.00, 3001127),
('Raichur', 'ರಾಯಚೂರು', 'Kalyana Karnataka', 'Raichur', 5, 6827.00, 1924773),
('Ramanagara', 'ರಾಮನಗರ', 'Bengaluru', 'Ramanagara', 4, 3302.00, 1082636),
('Shivamogga', 'ಶಿವಮೊಗ್ಗ', 'Mysuru', 'Shivamogga', 7, 8477.00, 1755512),
('Tumakuru', 'ತುಮಕೂರು', 'Bengaluru', 'Tumakuru', 10, 10597.00, 2681449),
('Udupi', 'ಉಡುಪಿ', 'Coastal Karnataka', 'Udupi', 3, 3598.00, 1177361),
('Uttara Kannada', 'ಉತ್ತರ ಕನ್ನಡ', 'Kittur Karnataka', 'Karwar', 11, 10291.00, 1437169),
('Vijayapura', 'ವಿಜಯಪುರ', 'Kalyana Karnataka', 'Vijayapura', 5, 10541.00, 2176075),
('Yadgir', 'ಯಾದಗಿರಿ', 'Kalyana Karnataka', 'Yadgir', 3, 5106.00, 1172985)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: Departments
-- ============================================================
INSERT INTO departments (name, name_kannada, code, description) VALUES
('Revenue Department', 'ಕಂದಾಯ ಇಲಾಖೆ', 'REV', 'Land records, survey, and revenue administration'),
('Karnataka State Archives', 'ಕರ್ನಾಟಕ ರಾಜ್ಯ ಅಭಿಲೇಖಾಗಾರ', 'KSA', 'Official state archives and historical records'),
('Department of Archaeology & Museums', 'ಪುರಾತತ್ತ್ವ ಮತ್ತು ಸಂಗ್ರಹಾಲಯಗಳ ಇಲಾಖೆ', 'DAM', 'Archaeological surveys and museum management'),
('Karnataka Gazetteer Department', 'ಕರ್ನಾಟಕ ಗೆಜೆಟಿಯರ್ ಇಲಾಖೆ', 'GAZ', 'District gazetteers and government notifications'),
('Public Library Department', 'ಸಾರ್ವಜನಿಕ ಗ್ರಂಥಾಲಯ ಇಲಾಖೆ', 'PLD', 'Public libraries and literature archives'),
('High Court of Karnataka', 'ಕರ್ನಾಟಕ ಉಚ್ಚ ನ್ಯಾಯಾಲಯ', 'HCK', 'Court records and legal documents'),
('Endowments Department', 'ಮುಜರಾಯಿ ಇಲಾಖೆ', 'END', 'Temple and religious endowment records'),
('Forest Department', 'ಅರಣ್ಯ ಇಲಾಖೆ', 'FOR', 'Forest records and biodiversity archives'),
('Education Department', 'ಶಿಕ್ಷಣ ಇಲಾಖೆ', 'EDU', 'Historical education records and school archives'),
('Urban Development Department', 'ನಗರ ಅಭಿವೃದ್ಧಿ ಇಲಾಖೆ', 'UDD', 'Urban planning and municipal records')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: Categories
-- ============================================================
INSERT INTO categories (name, name_kannada, slug, description, icon, color, record_count) VALUES
('Land Records', 'ಭೂ ದಾಖಲೆಗಳು', 'land-records', 'Survey numbers, property deeds, mutation records', 'map', '#0ea5e9', 250000),
('Court Records', 'ನ್ಯಾಯಾಲಯ ದಾಖಲೆಗಳು', 'court-records', 'Civil and criminal court judgments and orders', 'scale', '#dc2626', 150000),
('Temple Records', 'ದೇವಾಲಯ ದಾಖಲೆಗಳು', 'temple-records', 'Temple histories, endowments, and rituals', 'star', '#d97706', 80000),
('Gazette Notifications', 'ಸರ್ಕಾರಿ ಗೆಜೆಟ್', 'gazette-notifications', 'Government orders, notifications, and gazettes', 'file-text', '#7c3aed', 120000),
('Manuscripts', 'ಹಸ್ತಪ್ರತಿಗಳು', 'manuscripts', 'Ancient Kannada and Sanskrit manuscripts', 'book-open', '#059669', 45000),
('Census Records', 'ಜನಗಣತಿ ದಾಖಲೆಗಳು', 'census-records', 'Population census and demographic data', 'users', '#2563eb', 60000),
('Maps & Surveys', 'ನಕ್ಷೆಗಳು ಮತ್ತು ಸರ್ವೆ', 'maps-surveys', 'Topographic maps and survey reports', 'map-pin', '#db2777', 35000),
('Kannada Literature', 'ಕನ್ನಡ ಸಾಹಿತ್ಯ', 'kannada-literature', 'Classical and modern Kannada literary works', 'book', '#0891b2', 75000),
('Revenue Records', 'ಕಂದಾಯ ದಾಖಲೆಗಳು', 'revenue-records', 'Tax records, revenue registers, and accounts', 'calculator', '#65a30d', 90000),
('Archaeological Records', 'ಪುರಾತತ್ತ್ವ ದಾಖಲೆಗಳು', 'archaeological-records', 'Excavation reports and site surveys', 'compass', '#9333ea', 25000),
('Freedom Movement', 'ಸ್ವಾತಂತ್ರ್ಯ ಚಳವಳಿ', 'freedom-movement', 'Karnataka freedom struggle documents', 'flag', '#ea580c', 30000),
('Administrative Records', 'ಆಡಳಿತ ದಾಖಲೆಗಳು', 'administrative-records', 'Government administration and governance records', 'briefcase', '#64748b', 140000)
ON CONFLICT DO NOTHING;
