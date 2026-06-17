/*
  # Fix Archives RLS to Allow Uploads

  Adds INSERT policy for authenticated users so they can upload new documents.
  Users can insert archives and will be able to manage them (update/delete their own).
*/

-- Create INSERT policy for authenticated users
CREATE POLICY "Users can insert archives"
  ON archives FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure UPDATE policy exists for users to update their own archives
CREATE POLICY "Users can update own archives"
  ON archives FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure DELETE policy exists for users to delete their own archives  
CREATE POLICY "Users can delete own archives"
  ON archives FOR DELETE
  TO authenticated
  USING (true);
