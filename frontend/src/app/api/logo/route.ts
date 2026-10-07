import { NextRequest, NextResponse } from 'next/server';

function getFallbackSvg(slug: string | null) {
  const name = slug ? slug.split('-').map(p => p[0]?.toUpperCase()).join('').substring(0, 3) : 'TM';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect width="80" height="80" fill="#2C3EC4"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#FFFFFF" dominant-baseline="central" text-anchor="middle">${name}</text>
  </svg>`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  let targetUrl = searchParams.get('url');
  const slug = searchParams.get('slug');

  if (!targetUrl) {
    return new NextResponse(getFallbackSvg(slug), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400, immutable' },
    });
  }

  try {
    const parsedUrl = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch (e) {
    return new NextResponse(getFallbackSvg(slug), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400, immutable' },
    });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      return new NextResponse(getFallbackSvg(slug), {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400, immutable' },
      });
    }

    const contentType = res.headers.get('content-type') || 'image/png';
    const imageBuffer = await res.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    return new NextResponse(getFallbackSvg(slug), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400, immutable' },
    });
  }
}
