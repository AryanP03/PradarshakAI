import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // In production (cross-domain), the Next.js server cannot read the HttpOnly 
  // auth_token cookie because it is bound to the backend API domain.
  // We rely on client-side routing in /profile/page.tsx to redirect guests, 
  // which works robustly by calling the backend API.
  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*'],
};
