import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BOT_REGEX = /(\.php|\.asp|\.aspx|\.jsp|\.cgi|\.env|\.git|\.yml|\.yaml|\.ini|\.conf|wp-admin|wp-content|wp-includes|xmlrpc|phpmyadmin)/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (BOT_REGEX.test(pathname)) {
    return new Response('Not Found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.svg|logo.svg|ads.txt|robots.txt).*)',
  ],
};
