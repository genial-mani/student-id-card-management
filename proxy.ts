import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Allow static files and Next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;

  // Handle /login page auto-redirection for logged-in users
  if (pathname === '/login') {
    if (searchParams.get('loggedOut') === 'true') {
      return NextResponse.next();
    }

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        if (payload.role === 'admin') {
          return NextResponse.redirect(new URL('/', request.url));
        } else if (payload.schoolId) {
          return NextResponse.redirect(new URL(`/school/${payload.schoolId}`, request.url));
        } else {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    }
    return NextResponse.next();
  }

  // Allow public API auth endpoints
  if (pathname.startsWith('/api/auth/login')) {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyToken(token);

  if (!payload) {
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('auth_token');
    return response;
  }

  // For API routes: attach user info via headers so route handlers can read it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-school-id', payload.schoolId || '');

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
