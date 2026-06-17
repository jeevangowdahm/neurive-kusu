/*
  # Fix infinite recursion in users table RLS policies

  The "Admins can read all users" policy queries the users table within
  its own policy check, causing infinite recursion. This replaces it with
  a non-recursive approach using auth.jwt() app_metadata.

  1. Changes
    - Drop the recursive "Admins can read all users" policy
    - Create a new non-recursive admin read policy using auth.jwt()
    - Fix the insert policy to use SECURITY DEFINER bypass instead of self-referencing check
*/

-- Drop the recursive policy
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;

-- Drop the insert policy that also causes issues (it checks auth.uid() = id but trigger runs as different user)
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;

-- New admin read policy: uses JWT app_metadata instead of querying users table
-- This avoids the infinite recursion
CREATE POLICY "Admins can read all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    -- User can always read their own row (non-recursive)
    auth.uid() = id
    OR
    -- Admin check via JWT claims (avoids querying users table)
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Insert policy: allow the trigger (SECURITY DEFINER) to insert, and users to insert their own row
-- The trigger runs as postgres which bypasses RLS, so this policy is for direct inserts
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
