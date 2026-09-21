import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected user routes requiring authenticated session
  if (pathname.startsWith('/profile')) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth';
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*'],
};
