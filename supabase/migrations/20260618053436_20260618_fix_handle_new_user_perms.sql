-- Grant execute permission on handle_new_user to supabase_auth_admin
-- This allows the auth trigger on auth.users to call this function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;