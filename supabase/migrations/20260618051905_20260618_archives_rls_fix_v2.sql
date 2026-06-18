-- Fix RLS policies for archives table using correct column names
-- The archives table uses: access_level (not visibility), status, source

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert archives" ON archives;
DROP POLICY IF EXISTS "Users can delete own archives" ON archives;
DROP POLICY IF EXISTS "Users can insert archives" ON archives;
DROP POLICY IF EXISTS "Users can update own archives" ON archives;

-- Create proper INSERT policy - only authenticated users, tied to their upload
CREATE POLICY "archives_insert_authenticated" ON archives
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
  );

-- Create proper UPDATE policy - only source='User Upload' or admin/archivist
CREATE POLICY "archives_update_restricted" ON archives
  FOR UPDATE
  USING (
    source = 'User Upload'
    OR EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid() 
      AND (raw_app_meta_data->>'role' IN ('admin', 'archivist'))
    )
  )
  WITH CHECK (
    source = 'User Upload'
    OR EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid() 
      AND (raw_app_meta_data->>'role' IN ('admin', 'archivist'))
    )
  );

-- Create proper DELETE policy - only admin can delete
CREATE POLICY "archives_delete_admin_only" ON archives
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid() 
      AND (raw_app_meta_data->>'role' = 'admin')
    )
  );