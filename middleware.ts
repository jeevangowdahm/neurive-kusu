import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const ADMIN_EMAILS = [
  'jeevangowdahm6@gmail.com',
  'jeevangowda082007@gmail.com',
  'user@neurive.karnataka.gov.in',
  'admin@neurive.karnataka.gov.in'
];

const ADMIN_ROUTES = [
  '/admin',
  '/admin/agent',
  '/admin/analytics',
  '/admin/database',
  '/admin/dataset',
  '/admin/health',
  '/admin/keys',
  '/admin/real-sources',
  '/admin/testing',
  '/admin/wikipedia-ingest'
];

const PROTECTED_ROUTES = [
  '/dashboard',
  '/bookmarks',
  '/upload'
];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return req.cookies.get(name)?.value; },
        set(name, value, options) { res.cookies.set({ name, value, ...options }); },
        remove(name, options) { res.cookies.set({ name, value: '', ...options }); }
      }
    }
  );
  
  const { data: { session } } = await supabase.auth.getSession();
  const path = req.nextUrl.pathname;
  
  const isAdminRoute = ADMIN_ROUTES.some(route => path === route || path.startsWith(`${route}/`));
  const isProtectedRoute = PROTECTED_ROUTES.some(route => path === route || path.startsWith(`${route}/`));
  
  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
    
    const email = session.user?.email?.toLowerCase() || '';
    if (!ADMIN_EMAILS.includes(email)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }
  
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }
  
  return res;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/bookmarks/:path*',
    '/upload/:path*'
  ]
};
