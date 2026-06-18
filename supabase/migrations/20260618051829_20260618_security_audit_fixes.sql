-- Security Audit Fixes Migration
-- Fixes: Function search paths, RLS policies, SECURITY DEFINER permissions

-- =============================================================================
-- 1. FIX FUNCTION SEARCH PATH MUTABILITY
-- =============================================================================

-- Fix handle_new_user function with secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'user',
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Fix update_updated_at_column function with secure search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- 2. REVOKE EXECUTE PERMISSIONS ON SECURITY DEFINER FUNCTIONS
-- =============================================================================

-- Revoke execute permissions from anon and authenticated roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;

-- Only allow the function to be called by trigger (supabase functions)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;