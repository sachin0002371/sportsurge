import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sportSlug = searchParams.get('sport');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    const where: any = {};

    if (sportSlug) {
      const sport = await db.sport.findUnique({ where: { slug: sportSlug } });
      if (sport) where.sportId = sport.id;
    }

    if (status) {
      where.status = status;
    }

    const matches = await db.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        sport: true,
      },
      orderBy: { matchDate: 'asc' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const total = await db.match.count({ where });

    return NextResponse.json({
      matches,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Matches API error:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
