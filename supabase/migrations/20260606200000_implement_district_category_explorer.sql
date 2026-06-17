-- ============================================================
-- FEATURE 6: DISTRICT & CATEGORY EXPLORER SEED DATA
-- ============================================================

-- 1. Ensure districts table exists (safe schema)
CREATE TABLE IF NOT EXISTS public.districts (
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

-- 2. Ensure categories table exists (safe schema)
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_kannada text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon text DEFAULT 'folder',
  color text DEFAULT '#2563eb',
  parent_id uuid REFERENCES public.categories(id),
  record_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. Seed Vijayanagara district safely
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.districts WHERE name = 'Vijayanagara') THEN
    INSERT INTO public.districts (name, name_kannada, division, headquarter, taluk_count, area_sqkm, population, description)
    VALUES ('Vijayanagara', 'ವಿಜಯನಗರ', 'Kalyana Karnataka', 'Hosapete', 6, 5644.00, 1341000, 'Historical capital region of the Vijayanagara Empire, carved out of Ballari in 2021.');
  END IF;
END $$;

-- 4. Seed missing categories safely using the UNIQUE slug constraint
INSERT INTO public.categories (name, name_kannada, slug, description, icon, color) VALUES
('Historical Letters', 'ಐತಿಹಾಸಿಕ ಪತ್ರಗಳು', 'historical-letters', 'Correspondence of historical figures, royal letters, and diplomatic notes.', 'mail', '#e11d48'),
('Photographs', 'ಛಾಯಾಚಿತ್ರಗಳು', 'photographs', 'Archival photographs, historical prints, and visual media.', 'camera', '#0891b2'),
('Inscriptions', 'ಶಾಸನಗಳು', 'inscriptions', 'Epigraphical records, hero stones, stone tablets, and copper plate inscriptions.', 'scroll', '#ea580c'),
('Government Orders', 'ಸರ್ಕಾರಿ ಆದೇಶಗಳು', 'government-orders', 'Official state circulars, administrative mandates, and gazette notifications.', 'file-check', '#16a34a'),
('Cultural Records', 'ಸಾಂಸ್ಕೃತಿಕ ದಾಖಲೆಗಳು', 'cultural-records', 'Documentation of local art, folklore, theatrical plays, music, and regional festivals.', 'music', '#db2777'),
('Education Records', 'ಶಿಕ್ಷಣ ದಾಖಲೆಗಳು', 'education-records', 'Historical registries from colonial and post-independence schools and colleges.', 'graduation-cap', '#4f46e5'),
('Palace Records', 'ಅರಮನೆ ದಾಖಲೆಗಳು', 'palace-records', 'Royal administration records, courtly diaries, and inventory registers from Mysore Palace.', 'castle', '#ca8a04'),
('Military Records', 'ಸೇನಾ ದಾಖಲೆಗಳು', 'military-records', 'Defense logs, battle maps, weapons treaties, and military personnel rolls.', 'shield', '#b91c1c'),
('Gazetteers', 'ಗೆಜೆಟಿಯರ್‌ಗಳು', 'gazetteers', 'Official publications detailing the geographical, historical, and demographic profile of Karnataka districts.', 'book', '#7c3aed')
ON CONFLICT (slug) DO NOTHING;
