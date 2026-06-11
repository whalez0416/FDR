import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protects the admin panel and admin APIs with a single shared password
 * (env ADMIN_PASSWORD). If the password isn't configured the panel stays open
 * so the operator can never be locked out — protection activates the moment
 * ADMIN_PASSWORD is set in the environment.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Login page + login API must be reachable without a session.
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return NextResponse.next();

  const session = request.cookies.get('admin_session')?.value;
  if (session === adminPassword) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = new URL('/admin/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};
