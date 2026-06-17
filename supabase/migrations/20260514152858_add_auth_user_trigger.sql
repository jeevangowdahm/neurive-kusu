/*
  # Add auth trigger for auto-creating user profile

  1. Changes
    - Add trigger function `handle_new_user()` that auto-creates a public.users row
      when a new user signs up via Supabase Auth
    - Add trigger `on_auth_user_created` on `auth.users` table
  2. Security
    - The trigger runs as SECURITY DEFINER (postgres) so it can insert into public.users
    - Existing RLS policies on public.users remain unchanged
*/

-- Function to auto-create public.users row on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, organization)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'organization', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
