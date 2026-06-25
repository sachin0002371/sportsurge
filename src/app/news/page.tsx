import { db } from '@/lib/db';
import ArticleCard from '@/components/ArticleCard';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Newspaper } from 'lucide-react';
import AdPlacement from '@/components/AdPlacement';

export const revalidate = 60; // Cache news page for 1 minute

export const metadata = {
  title: 'Latest Sports News & Expert Analysis - Sportsurge Official',
  description: 'Stay updated with the latest sports news, match previews, game recaps, and deep-dive analysis across all major sports leagues on Sportsurge Official.',
};

const ITEMS_PER_PAGE = 12;
const CATEGORIES = ['all', 'news', 'analysis', 'preview', 'recap', 'opinion'];

interface PageProps {
  searchParams: Promise<{ page?: string; category?: string }>;
}

export default async function NewsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const currentPage = Math.max(1, parseInt(resolvedParams.page || '1', 10));
  const selectedCategory = resolvedParams.category && resolvedParams.category !== 'all' 
    ? resolvedParams.category 
    : undefined;

  // Build prisma filter
  const filter: any = {
    isPublished: true,
  };
  if (selectedCategory) {
    filter.category = selectedCategory;
  }

  // Fetch articles, total count, and category counts
  const [articles, totalArticles, allPublishedArticles] = await Promise.all([
    db.article.findMany({
      where: filter,
      include: { author: true, sport: true },
      orderBy: { publishedAt: 'desc' },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    db.article.count({
      where: filter,
    }),
    db.article.findMany({
      where: { isPublished: true },
      select: { category: true },
    }),
  ]);

  // Calculate counts for categories
  const categoryCounts: Record<string, number> = { all: allPublishedArticles.length };
  allPublishedArticles.forEach(art => {
    categoryCounts[art.category] = (categoryCounts[art.category] || 0) + 1;
  });

  const totalPages = Math.ceil(totalArticles / ITEMS_PER_PAGE);

  // Generate pagination page numbers helper
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisiblePages - 1);
      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

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
            
            {/* Category selection filters */}
            <div className="flex flex-wrap items-center gap-2 pb-2">
              {CATEGORIES.map((cat) => {
                const count = cat === 'all' ? categoryCounts.all : (categoryCounts[cat] || 0);
                const isActive = (cat === 'all' && !selectedCategory) || selectedCategory === cat;
                const searchStr = cat === 'all' 
                  ? '/news' 
                  : `/news?category=${cat}`;

                return (
                  <Link
                    key={cat}
                    href={searchStr}
                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                      isActive
                        ? 'text-white shadow-md'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                    style={isActive ? { backgroundColor: '#374DF5' } : undefined}
                  >
                    {cat === 'all' ? 'All Articles' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    <span className={`ml-1.5 text-xs ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                      ({count})
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Articles Grid */}
            {articles.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                <span className="text-5xl block mb-4">📰</span>
                <h3 className="text-xl font-bold text-[#222226]">No Articles Found</h3>
                <p className="text-slate-500 mt-2">
                  No articles were found matching your filter options. Check back later!
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalArticles)} of {totalArticles} articles
                    </span>

                    <nav className="flex items-center gap-1.5">
                      {/* Prev page */}
                      <Link
                        href={currentPage > 1 ? `/news?page=${currentPage - 1}${selectedCategory ? `&category=${selectedCategory}` : ''}` : '#'}
                        className={`p-2 rounded-lg border text-sm font-bold flex items-center justify-center transition-all ${
                          currentPage === 1
                            ? 'text-slate-300 border-slate-100 pointer-events-none'
                            : 'text-slate-700 hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Link>

                      {/* Page numbers */}
                      {getPageNumbers().map((pageNum) => {
                        const isCurrent = pageNum === currentPage;
                        return (
                          <Link
                            key={pageNum}
                            href={`/news?page=${pageNum}${selectedCategory ? `&category=${selectedCategory}` : ''}`}
                            className={`min-w-[36px] h-9 flex items-center justify-center rounded-lg text-sm font-semibold border transition-all ${
                              isCurrent
                                ? 'text-white border-transparent'
                                : 'text-slate-700 hover:bg-slate-50 border-slate-200'
                            }`}
                            style={isCurrent ? { backgroundColor: '#374DF5' } : undefined}
                          >
                            {pageNum}
                          </Link>
                        );
                      })}

                      {/* Next page */}
                      <Link
                        href={currentPage < totalPages ? `/news?page=${currentPage + 1}${selectedCategory ? `&category=${selectedCategory}` : ''}` : '#'}
                        className={`p-2 rounded-lg border text-sm font-bold flex items-center justify-center transition-all ${
                          currentPage === totalPages
                            ? 'text-slate-300 border-slate-100 pointer-events-none'
                            : 'text-slate-700 hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </nav>
                  </div>
                )}
              </>
            )}

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
