import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

function getFallbackSvg(slug: string | null) {
  const name = slug ? slug.split('-').map(p => p[0]?.toUpperCase()).join('').substring(0, 3) : 'TM';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect width="80" height="80" fill="#2C3EC4"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#FFFFFF" dominant-baseline="central" text-anchor="middle">${name}</text>
  </svg>`;
  return svg;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  const slug = searchParams.get('slug');
  const wParam = searchParams.get('w');
  const width = wParam ? parseInt(wParam) : null;

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  const logosDir = path.join(process.cwd(), 'public', 'logos');
  const tinyDir = path.join(logosDir, 'tiny');
  const extensions = ['png', 'jpg', 'jpeg', 'svg', 'webp'];

  // 1. If slug & width are provided, check tiny pre-resized cache first
  if (slug && width) {
    const tinyFilename = `${slug}_${width}.webp`;
    const tinyPath = path.join(tinyDir, tinyFilename);
    try {
      const tinyBuffer = await fs.readFile(tinyPath);
      return new NextResponse(new Uint8Array(tinyBuffer), {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (e) {
      // Tiny version doesn't exist yet, proceed to check original and resize
    }
  }

  // 2. Check original local filesystem cache
  if (slug) {
    for (const ext of extensions) {
      const filename = `${slug}.${ext}`;
      const filePath = path.join(logosDir, filename);
      try {
        const fileBuffer = await fs.readFile(filePath);
        const bufferView = new Uint8Array(fileBuffer);
        const isHtml = bufferView.length > 5 && bufferView[0] === 60 && bufferView[1] === 33 && bufferView[2] === 68; // <!D
        
        if (!isHtml) {
          // If width requested and it's not SVG, resize on-the-fly and save to tiny cache
          if (width && ext !== 'svg') {
            try {
              const resizedBuffer = await sharp(fileBuffer)
                .resize(width, width, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .webp({ quality: 85 })
                .toBuffer();

              await fs.mkdir(tinyDir, { recursive: true });
              await fs.writeFile(path.join(tinyDir, `${slug}_${width}.webp`), resizedBuffer);

              return new NextResponse(new Uint8Array(resizedBuffer), {
                headers: {
                  'Content-Type': 'image/webp',
                  'Cache-Control': 'public, max-age=31536000, immutable',
                },
              });
            } catch (resizeErr) {
              // Fallback to serving original buffer if sharp fails
            }
          }

          const contentType = ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
          return new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
        }
      } catch (e) {
        // File with this extension doesn't exist, try next extension
      }
    }
  }

  // 3. Fetch from external API/CDN if not cached locally at all
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return new NextResponse(getFallbackSvg(slug), {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400, immutable' },
      });
    }

    const contentType = response.headers.get('content-type') || '';
    const buffer = await response.arrayBuffer();
    const bufferView = new Uint8Array(buffer);

    const isHtml = contentType.includes('text/html') || 
      (bufferView.length > 5 && bufferView[0] === 60 && bufferView[1] === 33 && bufferView[2] === 68);

    if (isHtml) {
      return new NextResponse(getFallbackSvg(slug), {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400, immutable' },
      });
    }

    const nodeBuffer = Buffer.from(buffer);

    // Save valid original image to local filesystem
    if (slug) {
      try {
        const ext = contentType.includes('svg') ? 'svg' : contentType.includes('jpeg') ? 'jpg' : 'png';
        await fs.mkdir(logosDir, { recursive: true });
        await fs.writeFile(path.join(logosDir, `${slug}.${ext}`), nodeBuffer);

        // If width requested and not SVG, resize and save to tiny cache
        if (width && ext !== 'svg') {
          const resizedBuffer = await sharp(nodeBuffer)
            .resize(width, width, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality: 85 })
            .toBuffer();

          await fs.mkdir(tinyDir, { recursive: true });
          await fs.writeFile(path.join(tinyDir, `${slug}_${width}.webp`), resizedBuffer);

          return new NextResponse(new Uint8Array(resizedBuffer), {
            headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable' },
          });
        }
      } catch (saveError) {
        // Silently ignore save errors
      }
    }

    return new NextResponse(new Uint8Array(nodeBuffer), {
      headers: {
        'Content-Type': contentType || 'image/png',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (error) {
    return new NextResponse(getFallbackSvg(slug), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400, immutable' },
    });
  }
}
