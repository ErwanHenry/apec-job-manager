/**
 * Next.js Middleware for Route Protection
 *
 * Protects /prescriber/* and /pharmacist/* routes
 * - Checks for valid session cookie
 * - Verifies user role matches route
 * - Redirects to /login if unauthenticated
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Decode session from cookie
 */
function decodeSession(sessionString: string): { userId: string; role: string; exp: number } | null {
  try {
    const json = Buffer.from(sessionString, 'base64').toString('utf-8');
    const data = JSON.parse(json);

    // Check expiration
    if (data.exp < Date.now()) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Routes that require authentication
  const protectedRoutes = ['/prescriber', '/pharmacist'];
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('session');

  if (!sessionCookie) {
    // No session, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Decode session
  const session = decodeSession(sessionCookie.value);
  if (!session) {
    // Invalid session, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check role matches route
  if (pathname.startsWith('/prescriber') && session.role !== 'prescriber') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/pharmacist') && session.role !== 'pharmacist') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow request to proceed
  return NextResponse.next();
}

/**
 * Configure which routes should be checked by middleware
 */
export const config = {
  matcher: ['/prescriber/:path*', '/pharmacist/:path*'],
};
