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
    } else {
      const mockCookie = cookieStore.get('neurive-mock-session')?.value;
      if (mockCookie) {
        const parsed = JSON.parse(mockCookie);
        token = parsed?.access_token;
      }
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

  const originalAuth = client.auth;
  const customAuth = new Proxy(originalAuth, {
    get(target, prop) {
      if (prop === 'getUser') {
        return async () => {
          try {
            const cookieStore = cookies();
            const mockCookie = cookieStore.get('neurive-mock-session')?.value;
            if (mockCookie) {
              const parsed = JSON.parse(mockCookie);
              return { data: { user: parsed.user }, error: null };
            }
          } catch {}

          try {
            return await target.getUser();
          } catch (err) {
            return { data: { user: null }, error: err };
          }
        };
      }
      const val = Reflect.get(target, prop);
      if (typeof val === 'function') {
        return val.bind(target);
      }
      return val;
    }
  });

  Object.defineProperty(client, 'auth', {
    get() {
      return customAuth;
    }
  });

  return client;
}
