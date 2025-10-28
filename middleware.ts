import { NextRequest, NextResponse } from 'next/server';
import { assertAgent, resolveUser } from './src/lib/auth';

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith('/agent')) {
    const user = resolveUser(req);
    if (!user.isAgent) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  if (pathname.startsWith('/api/tips') && req.method !== 'GET') {
    try {
      assertAgent(req);
    } catch (error) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/agent/:path*', '/api/tips/:path*']
};
