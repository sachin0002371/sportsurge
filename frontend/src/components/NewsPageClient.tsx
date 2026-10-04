'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ArticleCard from '@/components/ArticleCard';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  category: string;
  publishedAt: Date | string | null;
  author: {
    name: string;
    avatar: string | null;
  };
  sport: {
    slug: string;
    name: string;
  } | null;
}

const CATEGORIES = ['all', 'news', 'analysis', 'preview', 'recap', 'opinion'] as const;
type Category = typeof CATEGORIES[number];

interface NewsPageClientProps {
  articles: Article[];
  categoryCounts: Record<string, number>;
}

export default function NewsPageClient({ articles, categoryCounts }: NewsPageClientProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [displayCount, setDisplayCount] = useState(9);

  const filteredArticles = activeCategory === 'all'
    ? articles
    : articles.filter(a => a.category === activeCategory);

  const displayedArticles = filteredArticles.slice(0, displayCount);
  const hasMore = displayCount < filteredArticles.length;
  const featured = displayedArticles[0];
  const rest = displayedArticles.slice(1);

  return (
    <div>
      {/* Category filter buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {CATEGORIES.map(cat => {
          const count = cat === 'all' ? articles.length : (categoryCounts[cat] || 0);
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setDisplayCount(9); }}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                isActive
                  ? 'text-white shadow-md'
                  : 'hover:bg-[rgba(55,77,245,0.08)] hover:text-[#374DF5]'
              }`}
              style={isActive ? { backgroundColor: '#374DF5' } : { backgroundColor: 'rgba(229,233,239,0.5)', color: 'rgba(34,34,38,0.6)' }}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              <span className={`ml-1.5 text-xs ${isActive ? 'text-white/70' : ''}`} style={!isActive ? { color: 'rgba(34,34,38,0.4)' } : undefined}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Articles grid with featured layout */}
      {filteredArticles.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl block mb-3">📰</span>
          <h3 className="text-lg font-semibold" style={{ color: '#222226' }}>No Articles Found</h3>
          <p style={{ color: 'rgba(34,34,38,0.5)' }} className="mt-1">
            {activeCategory === 'all'
              ? 'Check back soon for coverage'
              : `No ${activeCategory} articles yet. Try a different category.`}
          </p>
        </div>
      ) : (
        <>
          {/* Featured first article */}
          {featured && (
            <div className="mb-6">
              <ArticleCard article={featured} featured />
            </div>
          )}

          {/* Rest of articles in grid */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rest.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setDisplayCount(prev => prev + 6)}
                className="px-8"
                style={{ borderColor: 'rgba(55,77,245,0.3)', color: '#374DF5' }}
              >
                Load More Articles
              </Button>
              <p className="text-xs mt-2" style={{ color: 'rgba(34,34,38,0.4)' }}>
                Showing {displayedArticles.length} of {filteredArticles.length} articles
              </p>
            </div>
          )}

          {!hasMore && filteredArticles.length > 6 && (
            <div className="text-center mt-8">
              <p className="text-xs" style={{ color: 'rgba(34,34,38,0.4)' }}>
                Showing all {filteredArticles.length} articles
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
