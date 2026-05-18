import Link from 'next/link';
import { timeAgo } from '@/lib/utils';

interface ArticleHeroProps {
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
      title: string;
    };
    sport: {
      slug: string;
      name: string;
    } | null;
  };
}

export default function ArticleHero({ article }: ArticleHeroProps) {
  return (
    <Link href={`/${article.sport?.slug || 'nba'}/news/${article.slug}`}>
      <article className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group cursor-pointer">
        {/* Background image */}
        {article.featuredImage && (
          <img
            src={article.featuredImage}
            alt={article.title}
            className="w-full h-72 md:h-96 object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}

        {/* Overlay - Blue gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C3EC4]/90 via-[#2C3EC4]/40 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full" style={{ backgroundColor: '#374DF5' }}>
              {article.category}
            </span>
            {article.sport && (
              <span className="text-white/80 text-xs font-medium">
                {article.sport.name}
              </span>
            )}
          </div>

          <h2 className="text-2xl md:text-3xl text-white mb-2 group-hover:text-blue-200 transition-colors" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            {article.title}
          </h2>

          <p className="text-white/70 text-sm line-clamp-2 mb-3">
            {article.excerpt}
          </p>

          <div className="flex items-center gap-2">
            {article.author.avatar && (
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="w-8 h-8 rounded-full border-2 border-white/30"
              />
            )}
            <div>
              <p className="text-white text-sm font-medium">{article.author.name}</p>
              <p className="text-white/50 text-xs">{timeAgo(article.publishedAt)}</p>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
