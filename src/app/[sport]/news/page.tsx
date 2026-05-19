import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import NewsPageClient from '@/components/NewsPageClient';
import Link from 'next/link';
import SportIcon from '@/components/SportIcon';

interface NewsPageProps {
  params: Promise<{ sport: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  const sports = await db.sport.findMany({ select: { slug: true } });
  return sports.map((sport) => ({ sport: sport.slug }));
}

export async function generateMetadata({ params }: NewsPageProps) {
  const { sport: sportSlug } = await params;
  const sport = await db.sport.findUnique({ where: { slug: sportSlug } });
  if (!sport) return { title: 'News - Sportsurge Official' };

  return {
    title: `${sport.name} News & Articles - Sportsurge Official`,
    description: `Latest ${sport.name} news, analysis, previews, recaps, and expert opinion. Stay updated with Sportsurge Official's ${sport.name} coverage.`,
    openGraph: {
      title: `${sport.name} News - Sportsurge Official`,
      description: `Latest ${sport.name} news, analysis, and expert opinion`,
      type: 'website',
      siteName: 'Sportsurge Official',
    },
  };
}

const categories = ['news', 'analysis', 'preview', 'recap', 'opinion'];

export default async function NewsPage({ params }: NewsPageProps) {
  const { sport: sportSlug } = await params;
  const sport = await db.sport.findUnique({ where: { slug: sportSlug } });
  if (!sport) notFound();

  const articles = await db.article.findMany({
    where: { sportId: sport.id, isPublished: true },
    include: { author: true, sport: true },
    orderBy: { publishedAt: 'desc' },
  });

  const categoryCounts: Record<string, number> = {};
  categories.forEach(cat => {
    categoryCounts[cat] = articles.filter(a => a.category === cat).length;
  });

  const serializedArticles = articles.map(a => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    featuredImage: a.featuredImage,
    category: a.category,
    publishedAt: a.publishedAt?.toISOString() ?? new Date().toISOString(),
    author: {
      name: a.author.name,
      avatar: a.author.avatar,
    },
    sport: a.sport ? {
      slug: a.sport.slug,
      name: a.sport.name,
    } : null,
  }));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b" style={{ borderColor: 'rgba(229,233,239,0.8)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <nav className="flex items-center gap-2 text-sm mb-3" style={{ color: 'rgba(34,34,38,0.5)' }} aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#374DF5] transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/${sport.slug}`} className="hover:text-[#374DF5] transition-colors">{sport.name}</Link>
            <span>/</span>
            <span style={{ color: '#222226' }}>News</span>
          </nav>
          <h1 className="text-3xl flex items-center gap-3" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>
            <SportIcon slug={sport.slug} size="md" />
            {sport.name} News
          </h1>
          <p style={{ color: 'rgba(34,34,38,0.5)' }} className="mt-1">{articles.length} articles and counting</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <NewsPageClient articles={serializedArticles} categoryCounts={categoryCounts} />
      </div>
    </div>
  );
}
