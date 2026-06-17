/*
  # Add missing RLS policies for archives insert and upload_sessions update

  1. New Policies
    - Authenticated users can insert archives (for uploads)
    - Users can update their own upload sessions
*/

-- Archives: authenticated users can insert
CREATE POLICY "Authenticated users can insert archives"
  ON public.archives FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Upload sessions: users can update own
CREATE POLICY "Users can update own upload sessions"
  ON public.upload_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
