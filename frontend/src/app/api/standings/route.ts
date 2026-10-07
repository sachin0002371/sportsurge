import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sportSlug = searchParams.get('sport');

    const where: any = {};

    if (sportSlug) {
      const sport = await db.sport.findUnique({ where: { slug: sportSlug } });
      if (sport) where.sportId = sport.id;
    }

    const standings = await db.standing.findMany({
      where,
      include: {
        team: true,
        sport: true,
      },
      orderBy: [{ sportId: 'asc' }, { position: 'asc' }],
    });

    return NextResponse.json(
      { standings },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Standings API error:', error);
    return NextResponse.json({ error: 'Failed to fetch standings' }, { status: 500 });
  }
}
