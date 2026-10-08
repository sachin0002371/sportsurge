import { db } from '@/lib/db';
import NewsPageClient from '@/components/NewsPageClient';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import AdPlacement from '@/components/AdPlacement';

export const revalidate = 900; // Static Cache for 15 minutes at Edge

export const metadata = {
  title: 'Latest Sports News & Expert Analysis - Sportsurge Official',
  description: 'Stay updated with the latest sports news, match previews, game recaps, and deep-dive analysis across all major sports leagues on Sportsurge Official.',
};

export default async function NewsPage() {
  let articles: any[] = [];
  let categoryCounts: Record<string, number> = { all: 0 };

  try {
    const [fetchedArticles, fetchedCounts] = await Promise.all([
      db.article.findMany({
        where: { isPublished: true },
        include: { author: true, sport: true },
        orderBy: { publishedAt: 'desc' },
        take: 36,
      }),
      db.article.getCategoryCounts(),
    ]);
    articles = fetchedArticles;
    categoryCounts = fetchedCounts;
  } catch (error) {
    console.warn('NewsPage db error during prerender:', error);
  }

  const serializedArticles = articles.map(a => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    featuredImage: a.featuredImage,
    category: a.category,
    publishedAt: a.publishedAt?.toISOString() ?? new Date().toISOString(),
    author: {
      name: a.author?.name || 'Sportsurge Analyst',
      avatar: a.author?.avatar || null,
    },
    sport: a.sport ? {
      slug: a.sport.slug,
      name: a.sport.name,
    } : null,
  }));

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <Newspaper className="h-8 w-8 text-[#374DF5]" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#222226]">Sports News Center</h1>
              <p className="text-sm text-slate-500 mt-1">
                Real-time coverage, expert analysis, and updates across all sports
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-3 space-y-6">
            <NewsPageClient
              articles={serializedArticles}
              categoryCounts={categoryCounts}
            />

            {/* Horizontal Ad */}
            <div className="pt-4">
              <AdPlacement type="horizontal" slotId="news-bottom-leaderboard" />
            </div>
          </div>

          {/* Right Sidebar Column */}
          <div className="lg:col-span-1 space-y-6">
            <AdPlacement type="sidebar" slotId="news-sidebar-ad" />

            <div className="bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] rounded-3xl p-6 text-white shadow-lg border border-indigo-500/30 text-center">
              <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block shadow-sm">
                Active Match Predictor
              </span>
              <h3 className="text-lg font-bold mb-2 text-white">Join Sportsurge Predictor</h3>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                Connect with sports fans and predict matches outcome dynamically. Show your sports oracle power.
              </p>
              <Link
                href="/"
                className="block w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow transition-all duration-200 hover:scale-[1.02]"
              >
                Go to Match Center →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
