import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionId = request.cookies.get('mest_session')?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/studio') || pathname.startsWith('/admin')) {
    if (!sessionId) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if (pathname.startsWith('/admin')) {
    const isAdmin = request.cookies.get('mest_admin')?.value === '1';
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/studio', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/studio/:path*', '/admin/:path*'],
};
