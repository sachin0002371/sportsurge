import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import AuthorBio from '@/components/AuthorBio';
import ArticleCard from '@/components/ArticleCard';
import ShareBar from '@/components/ShareBar';
import VideoHighlights from '@/components/VideoHighlights';
import TableOfContents from '@/components/TableOfContents';
import { timeAgo, formatDateTime } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { Clock, BookOpen } from 'lucide-react';
import AdPlacement from '@/components/AdPlacement';

interface ArticlePageProps {
  params: Promise<{ sport: string; slug: string }>;
}

export const revalidate = 3600; // Cache for 1 hour

export async function generateStaticParams() {
  const articles = await db.article.findMany({
    select: { slug: true, sport: { select: { slug: true } } },
  });
  return articles.map((article) => ({
    sport: article.sport?.slug || 'news',
    slug: article.slug,
  }));
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await db.article.findUnique({
    where: { slug },
    include: { author: true, sport: true },
  });

  if (!article) return { title: 'Article Not Found - Sportsurge Official' };

  const metaTitle = article.metaTitle ? `${article.metaTitle} - Sportsurge Official` : `${article.title} - Sportsurge Official`;
  const metaDescription = article.metaDescription || article.excerpt;

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription || '',
      images: article.featuredImage ? [{ url: article.featuredImage, width: 1200, height: 675 }] : [],
      type: 'article',
      publishedTime: article.publishedAt?.toISOString(),
      authors: [article.author.name],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription || '',
      images: article.featuredImage ? [article.featuredImage] : [],
    },
    other: {
      'robots': 'max-image-preview:large',
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { sport: sportSlug, slug } = await params;
  const article = await db.article.findUnique({
    where: { slug },
    include: { author: true, sport: true },
  });

  if (!article) notFound();

  const [relatedArticles, readNextArticles, trendingArticles] = await Promise.all([
    // Same-sport related articles
    db.article.findMany({
      where: {
        sportId: article.sportId,
        isPublished: true,
        id: { not: article.id },
      },
      include: { author: true, sport: true },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    }),
    // Cross-sport read next
    db.article.findMany({
      where: {
        isPublished: true,
        id: { not: article.id },
        sportId: { not: article.sportId ?? undefined },
      },
      include: { author: true, sport: true },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    }),
    // Trending: recent same-sport for sidebar (lightweight select)
    db.article.findMany({
      where: {
        sportId: article.sportId,
        isPublished: true,
        id: { not: article.id },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        publishedAt: true,
        featuredImage: true,
        sport: { select: { slug: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 4,
    }),
  ]);

  const readingTime = calculateReadingTime(article.content);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    image: article.featuredImage ? [article.featuredImage] : [],
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: article.author.name,
      url: `https://sportsurge.com/authors/${article.author.slug}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Sportsurge Official',
      logo: { '@type': 'ImageObject', url: 'https://sportsurge.com/logo.png' },
    },
    description: article.excerpt,
    mainEntityOfPage: `https://sportsurge.com/${sportSlug}/news/${article.slug}`,
    wordCount: article.content.split(/\s+/).length,
    timeRequired: `PT${readingTime}M`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">

          {/* ════════════════════════════════════════════════════
              Two-column layout — starts from the VERY TOP
              Left: article content  |  Right: sidebar
          ════════════════════════════════════════════════════ */}
          <div className="flex gap-8">

            {/* ── LEFT: Main Article Content ───────────────── */}
            <div className="flex-1 min-w-0">

              {/* Breadcrumb */}
              <nav
                className="flex items-center gap-2 text-sm mb-4"
                style={{ color: 'rgba(34,34,38,0.5)' }}
                aria-label="Breadcrumb"
              >
                <Link href="/" className="hover:text-[#374DF5] transition-colors">Home</Link>
                <span>/</span>
                <Link href={`/${article.sport?.slug || sportSlug}`} className="hover:text-[#374DF5] transition-colors">
                  {article.sport?.name || sportSlug}
                </Link>
                <span>/</span>
                <Link href={`/${article.sport?.slug || sportSlug}/news`} className="hover:text-[#374DF5] transition-colors">
                  News
                </Link>
              </nav>

              {/* Category badge + reading time */}
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="inline-block text-white text-xs font-semibold uppercase px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: '#374DF5' }}
                >
                  {article.category}
                </span>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(34,34,38,0.5)' }}>
                  <Clock className="h-3.5 w-3.5" />
                  {readingTime} min read
                </span>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(34,34,38,0.5)' }}>
                  <BookOpen className="h-3.5 w-3.5" />
                  {article.content.split(/\s+/).length.toLocaleString()} words
                </span>
              </div>

              {/* Title */}
              <h1
                className="text-3xl md:text-4xl leading-tight mb-6"
                style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}
              >
                {article.title}
              </h1>

              {/* Featured Image */}
              {article.featuredImage && (
                <div
                  className="w-full relative rounded-2xl overflow-hidden mb-6 shadow-lg"
                  style={{ aspectRatio: '16/9' }}
                >
                  <img
                    src={article.featuredImage}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Author bar */}
              <div
                className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 pb-6"
                style={{ borderBottom: '1px solid rgba(229,233,239,0.8)' }}
              >
                <div className="flex items-center gap-3 flex-1">
                  {article.author.avatar && (
                    <img
                      src={article.author.avatar}
                      alt={article.author.name}
                      className="w-14 h-14 rounded-full"
                      style={{ border: '2px solid rgba(55,77,245,0.2)' }}
                    />
                  )}
                  <div>
                    <Link
                      href={`/authors/${article.author.slug}`}
                      className="text-base transition-colors hover:text-[#374DF5]"
                      style={{ fontWeight: 700, color: '#222226' }}
                    >
                      {article.author.name}
                    </Link>
                    <p className="text-sm font-medium" style={{ color: '#374DF5' }}>{article.author.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(34,34,38,0.5)' }}>
                      {article.publishedAt && formatDateTime(article.publishedAt)} &middot; {timeAgo(article.publishedAt ?? new Date())}
                    </p>
                  </div>
                </div>
                <ShareBar />
              </div>

              {/* Header Ad (full-width inside left column) */}
              <AdPlacement type="horizontal" slotId="1991768591" />

              {/* Article body */}
              <div className="article-content prose prose-lg max-w-none mt-6">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
              </div>

              {/* Bottom share bar */}
              <div
                className="mt-8 pt-6 flex items-center justify-between"
                style={{ borderTop: '1px solid rgba(229,233,239,0.8)' }}
              >
                <p className="text-sm" style={{ color: 'rgba(34,34,38,0.5)' }}>Enjoyed this article? Share it!</p>
                <ShareBar />
              </div>

              {/* Author bio */}
              <div className="mt-8">
                <div
                  className="rounded-2xl p-6"
                  style={{ backgroundColor: 'rgba(55,77,245,0.04)', border: '1px solid rgba(55,77,245,0.15)' }}
                >
                  <h3
                    className="text-sm uppercase tracking-wider mb-4"
                    style={{ fontWeight: 700, color: '#2C3EC4' }}
                  >
                    About the Author
                  </h3>
                  <AuthorBio author={article.author} />
                </div>
              </div>

              {/* Mid bumper ad */}
              <AdPlacement type="horizontal" slotId="4074188210" />

              {/* Related Videos */}
              <div className="mt-8">
                <VideoHighlights
                  homeTeam={article.sport?.name || sportSlug}
                  awayTeam="League Highlights"
                  sport={article.sport?.name || sportSlug}
                />
              </div>

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <div className="mt-10">
                  <h3
                    className="text-xl mb-4"
                    style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}
                  >
                    Related Articles
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {relatedArticles.map((a) => (
                      <ArticleCard key={a.id} article={a} />
                    ))}
                  </div>
                </div>
              )}

              {/* Read Next */}
              {readNextArticles.length > 0 && (
                <div className="mt-10">
                  <h3
                    className="text-xl mb-4 flex items-center gap-2"
                    style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}
                  >
                    Read Next
                    <span className="text-xs font-normal" style={{ color: 'rgba(34,34,38,0.5)' }}>
                      From other sports
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {readNextArticles.map((a) => (
                      <ArticleCard key={a.id} article={a} />
                    ))}
                  </div>
                </div>
              )}

              {/* More About Sport — SEO block */}
              {article.sport && (
                <div className="mt-10">
                  <div
                    className="bg-white rounded-2xl p-6"
                    style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}
                  >
                    <h3
                      className="text-sm uppercase tracking-wider mb-3"
                      style={{ fontWeight: 700, color: 'rgba(34,34,38,0.5)' }}
                    >
                      More About {article.sport.name}
                    </h3>
                    <div className="text-sm leading-relaxed space-y-3" style={{ color: 'rgba(34,34,38,0.6)' }}>
                      <p>
                        {article.sport.name} continues to be one of the most-watched and widely followed sports leagues globally.
                        With a passionate fanbase, elite competition, and a season full of dramatic moments, {article.sport.name} delivers
                        must-see action from opening day through the championship. Stay updated with the latest {article.sport.name} news,
                        scores, and analysis right here on Sportsurge Official.
                      </p>
                      <p>
                        From roster moves and trade deadlines to game-day previews and post-game breakdowns, Sportsurge Official covers
                        every angle of {article.sport.name}. Follow your favorite teams and players throughout the season with our
                        comprehensive coverage, live score tracking, and expert commentary.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>{/* ── end LEFT ── */}

            {/* ── RIGHT: Sidebar Container (stretches to full height of article column) ── */}
            <aside className="hidden lg:block w-72 flex-shrink-0 space-y-5 pb-12">

              {/* 1. Square Ad (small rectangle banner) — scrolls normally with top of page */}
              <AdPlacement type="sidebar" slotId="2280899939" format="rectangle" />

              {/* 2. Trending News with small image — scrolls normally with top of page */}
              {trendingArticles.length > 0 && (
                <div
                  className="bg-white rounded-2xl overflow-hidden"
                  style={{ boxShadow: 'rgba(34,34,38,0.12) 0px 1px 6px' }}
                >
                  {/* Header */}
                  <div
                    className="px-4 pt-4 pb-3 flex items-center gap-2"
                    style={{ borderBottom: '1px solid rgba(229,233,239,0.8)' }}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: '#374DF5' }}
                    />
                    <h4
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: 'rgba(34,34,38,0.6)' }}
                    >
                      Trending Now
                    </h4>
                  </div>

                  {/* Article list */}
                  <ul>
                    {trendingArticles.map((ta, idx) => (
                      <li
                        key={ta.id}
                        style={{ borderBottom: idx < trendingArticles.length - 1 ? '1px solid rgba(229,233,239,0.6)' : 'none' }}
                      >
                        <Link
                          href={`/${ta.sport?.slug || sportSlug}/news/${ta.slug}`}
                          className="flex items-center gap-3 px-4 py-3 group transition-colors hover:bg-[rgba(55,77,245,0.03)]"
                        >
                          {/* Rank bubble */}
                          <span
                            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                              backgroundColor: idx === 0 ? '#374DF5' : 'rgba(229,233,239,0.9)',
                              color: idx === 0 ? '#fff' : 'rgba(34,34,38,0.45)',
                            }}
                          >
                            {idx + 1}
                          </span>
                          {/* Small Image Thumbnail */}
                          {ta.featuredImage && (
                            <div className="w-14 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 shadow-sm">
                              <img
                                src={ta.featuredImage}
                                alt={ta.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          {/* Title */}
                          <span
                            className="text-xs leading-snug line-clamp-2 group-hover:text-[#374DF5] transition-colors flex-1"
                            style={{ fontWeight: 600, color: '#222226' }}
                          >
                            {ta.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {/* Footer link */}
                  <div
                    className="px-4 py-3"
                    style={{ borderTop: '1px solid rgba(229,233,239,0.8)' }}
                  >
                    <Link
                      href={`/${article.sport?.slug || sportSlug}/news`}
                      className="text-xs font-semibold hover:underline transition-colors"
                      style={{ color: '#374DF5' }}
                    >
                      View all {article.sport?.name || sportSlug} news →
                    </Link>
                  </div>
                </div>
              )}

              {/* ── STICKY WRAPPER: becomes sticky when viewport reaches article content ── */}
              <div className="sticky top-24 space-y-5 pt-2 pb-6">
                {/* 3. Table of Contents */}
                <TableOfContents content={article.content} />

                {/* 4. Vertical Ad (original large vertical banner) */}
                <AdPlacement type="sidebar" slotId="2921706886" format="vertical" />
              </div>

            </aside>

          </div>{/* ── end two-column flex ── */}
        </div>
      </article>
    </>
  );
}
