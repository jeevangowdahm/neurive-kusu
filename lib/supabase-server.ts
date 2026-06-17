import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createServerSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured');
  }

  let token: string | undefined;
  try {
    const cookieStore = cookies();
    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
    const cookieKey = `sb-${projectRef}-auth-token`;
    const sbCookie = cookieStore.get(cookieKey)?.value;
    if (sbCookie) {
      const parsed = JSON.parse(sbCookie);
      token = parsed?.access_token;
    }
  } catch (err) {
    // cookies() can throw if called outside request context e.g. at build time
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  if (token) {
    client.auth.setSession({
      access_token: token,
      refresh_token: '',
    });
  }

  return client;
}
