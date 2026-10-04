import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sportSlug = searchParams.get('sport');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '12');
    const page = parseInt(searchParams.get('page') || '1');

    const where: any = { isPublished: true };

    if (sportSlug) {
      const sport = await db.sport.findUnique({ where: { slug: sportSlug } });
      if (sport) where.sportId = sport.id;
    }

    if (category) {
      where.category = category;
    }

    const articles = await db.article.findMany({
      where,
      include: {
        author: true,
        sport: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const total = await db.article.count({ where });

    return NextResponse.json({
      articles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Articles API error:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}
