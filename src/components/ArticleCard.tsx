import Link from 'next/link';
import { timeAgo } from '@/lib/utils';

interface ArticleCardProps {
  article: {
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
  };
  featured?: boolean;
}

export default function ArticleCard({ article, featured = false }: ArticleCardProps) {
  return (
    <Link href={`/${article.sport?.slug || 'nba'}/news/${article.slug}`}>
      <article
        className="bg-white rounded-2xl overflow-hidden group cursor-pointer transition-all duration-200 hover:shadow-md"
        style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}
      >
        {/* Image */}
        {article.featuredImage && (
          <div className={`relative overflow-hidden ${featured ? 'h-56' : 'h-44'}`}>
            <img
              src={article.featuredImage}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 left-3">
              <span
                className="text-white text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase"
                style={{ backgroundColor: '#374DF5' }}
              >
                {article.category}
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {/* Sport tag */}
          {article.sport && (
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#374DF5' }}>
              {article.sport.name}
            </span>
          )}

          {/* Title */}
          <h3
            className={`mt-1 group-hover:text-[#374DF5] transition-colors line-clamp-2 ${featured ? 'text-xl' : 'text-base'}`}
            style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}
          >
            {article.title}
          </h3>

          {/* Excerpt */}
          {!featured && (
            <p className="text-sm mt-1.5 line-clamp-2" style={{ color: 'rgba(34,34,38,0.6)' }}>
              {article.excerpt}
            </p>
          )}

          {/* Author + Time */}
          <div className="flex items-center gap-2 mt-3">
            {article.author.avatar && (
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="w-6 h-6 rounded-full"
              />
            )}
            <span className="text-xs font-medium" style={{ color: '#374DF5' }}>{article.author.name}</span>
            <span className="text-xs" style={{ color: 'rgba(34,34,38,0.4)' }}>•</span>
            <span className="text-xs" style={{ color: 'rgba(34,34,38,0.4)' }}>{timeAgo(article.publishedAt)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
