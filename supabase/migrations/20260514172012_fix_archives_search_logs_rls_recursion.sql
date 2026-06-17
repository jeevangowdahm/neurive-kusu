/*
  # Fix infinite recursion in archives and search_logs RLS policies

  These policies query the users table to check admin role, which causes
  infinite recursion when the users table policies also reference users.

  Replace with non-recursive JWT-based checks.

  1. Changes
    - Fix "Admins can manage all archives" on archives table
    - Fix "Admins can read search logs" on search_logs table
    - Both now use auth.users raw_app_meta_data instead of public.users
*/

-- Fix archives admin policy
DROP POLICY IF EXISTS "Admins can manage all archives" ON public.archives;

CREATE POLICY "Admins can manage all archives"
  ON public.archives FOR ALL
  TO authenticated
  USING (
    -- Public active archives are readable
    (status = 'active' AND access_level = 'public')
    OR
    -- User can always access their own uploads
    (source = 'User Upload')
    OR
    -- Admin/archivist check via JWT (non-recursive)
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' IN ('admin', 'archivist')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' IN ('admin', 'archivist')
    )
    OR source = 'User Upload'
  );

-- Fix search_logs admin policy
DROP POLICY IF EXISTS "Admins can read search logs" ON public.search_logs;

CREATE POLICY "Admins can read search logs"
  ON public.search_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );
