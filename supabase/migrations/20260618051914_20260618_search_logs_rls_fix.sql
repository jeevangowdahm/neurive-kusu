-- Fix search_logs overly permissive INSERT policy

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can insert search logs" ON search_logs;

-- Create proper policy: Only authenticated users can insert logs
-- anon users should not be able to insert into search_logs
CREATE POLICY "search_logs_insert_authenticated" ON search_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');