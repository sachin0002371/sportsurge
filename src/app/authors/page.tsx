import { db } from '@/lib/db';
import Link from 'next/link';

export const revalidate = 86400; // Cache for 24 hours

export const metadata = {
  title: 'Our Writers - Sportsurge Official',
  description: 'Meet the expert writers and analysts behind Sportsurge Official\'s sports coverage. NBA, NFL, MLB, NHL, F1, MMA, Cricket and more.',
};

export default async function AuthorsPage() {
  const authors = await db.author.findMany({
    include: {
      articles: {
        where: { isPublished: true },
        select: { id: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b" style={{ borderColor: 'rgba(229,233,239,0.8)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <nav className="flex items-center gap-2 text-sm mb-3" style={{ color: 'rgba(34,34,38,0.5)' }}>
            <Link href="/" className="hover:text-[#374DF5] transition-colors">Home</Link>
            <span>/</span>
            <span style={{ color: '#222226' }}>Writers</span>
          </nav>
          <h1 className="text-3xl" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>Our Writers</h1>
          <p style={{ color: 'rgba(34,34,38,0.5)' }} className="mt-2">Expert analysts and journalists covering every sport</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {authors.map((author) => (
            <Link key={author.id} href={`/authors/${author.slug}`}>
              <div className="bg-white rounded-2xl p-6 hover:border-[#374DF5] hover:shadow-md transition-all duration-200 group cursor-pointer" style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}>
                <div className="flex items-start gap-4">
                  {author.avatar && (
                    <img
                      src={author.avatar}
                      alt={author.name}
                      className="w-16 h-16 rounded-full flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <h3 className="group-hover:text-[#374DF5] transition-colors" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>
                      {author.name}
                    </h3>
                    <p className="text-sm font-medium" style={{ color: '#374DF5' }}>{author.title}</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(34,34,38,0.5)' }}>Specialty: {author.specialty}</p>
                  </div>
                </div>
                <p className="text-sm mt-4 line-clamp-3 leading-relaxed" style={{ color: 'rgba(34,34,38,0.6)' }}>
                  {author.bio}
                </p>
                <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: 'rgba(34,34,38,0.5)' }}>
                  <span>📝 {author.articles.length} articles</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
