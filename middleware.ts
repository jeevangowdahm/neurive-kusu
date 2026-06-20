import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

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
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const { data: { session } } = await supabase.auth.getSession();
  const path = req.nextUrl.pathname;
  
  // Check if route is admin-only
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
