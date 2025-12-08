import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Check for Supabase session cookie
  const sessionCookie = req.cookies.get('sb-access-token') || 
                        req.cookies.get('sb-refresh-token') ||
                        req.cookies.get('supabase-auth-token');

  // Protect admin routes - require authentication
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!sessionCookie) {
      // No session - redirect to login
      return NextResponse.redirect(new URL('/login', req.url));
    }
    // Note: Full admin check happens client-side and server-side via RLS
    // This middleware provides an initial layer of protection
  }

  // Protect dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
