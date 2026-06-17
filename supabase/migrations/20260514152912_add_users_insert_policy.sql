/*
  # Add insert policy for users table

  The handle_new_user trigger runs as SECURITY DEFINER but still needs
  an RLS policy to allow inserts when called from the auth context.
*/

CREATE POLICY "Service role can insert users"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
