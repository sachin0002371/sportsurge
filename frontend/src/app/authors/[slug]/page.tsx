import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import ArticleCard from '@/components/ArticleCard';
import AuthorBio from '@/components/AuthorBio';
import Link from 'next/link';

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600; // Cache for 1 hour

export async function generateMetadata({ params }: AuthorPageProps) {
  const { slug } = await params;
  const author = await db.author.findUnique({ where: { slug } });
  if (!author) return { title: 'Author Not Found - Sportsurge Official' };

  return {
    title: `${author.name} - ${author.title} - Sportsurge Official`,
    description: author.bio,
    openGraph: {
      title: `${author.name} - ${author.title}`,
      description: author.bio,
      type: 'profile',
      siteName: 'Sportsurge Official',
    },
  };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { slug } = await params;
  const author = await db.author.findUnique({
    where: { slug },
    include: {
      articles: {
        where: { isPublished: true },
        include: { author: true, sport: true },
        orderBy: { publishedAt: 'desc' },
      },
    },
  });

  if (!author) notFound();

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b" style={{ borderColor: 'rgba(229,233,239,0.8)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <nav className="flex items-center gap-2 text-sm mb-3" style={{ color: 'rgba(34,34,38,0.5)' }}>
            <Link href="/" className="hover:text-[#374DF5] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/authors" className="hover:text-[#374DF5] transition-colors">Writers</Link>
            <span>/</span>
            <span style={{ color: '#222226' }}>{author.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        <AuthorBio author={author} />

        <div>
          <h2 className="text-xl mb-4" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>
            Articles by {author.name}
          </h2>
          {author.articles.length === 0 ? (
            <p className="text-center py-8" style={{ color: 'rgba(34,34,38,0.5)' }}>No articles published yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {author.articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
