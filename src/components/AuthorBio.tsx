import Link from 'next/link';
import { Twitter, Linkedin } from 'lucide-react';

interface AuthorBioProps {
  author: {
    id: string;
    name: string;
    slug: string;
    avatar: string | null;
    title: string;
    bio: string;
    specialty: string;
    socialTwitter: string | null;
    socialLinkedIn: string | null;
  };
  compact?: boolean;
}

export default function AuthorBio({ author, compact = false }: AuthorBioProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {author.avatar && (
          <img src={author.avatar} alt={author.name} className="w-10 h-10 rounded-full" />
        )}
        <div>
          <Link href={`/authors/${author.slug}`} className="text-sm font-semibold transition-colors hover:text-[#374DF5]" style={{ color: '#222226' }}>
            {author.name}
          </Link>
          <p className="text-xs" style={{ color: 'rgba(34,34,38,0.5)' }}>{author.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(229,233,239,0.5)' }}>
      <div className="flex items-start gap-4">
        {author.avatar && (
          <img src={author.avatar} alt={author.name} className="w-16 h-16 rounded-full" />
        )}
        <div className="flex-1">
          <Link href={`/authors/${author.slug}`} className="text-lg transition-colors hover:text-[#374DF5]" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>
            {author.name}
          </Link>
          <p className="text-sm font-medium" style={{ color: '#374DF5' }}>{author.title}</p>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: 'rgba(34,34,38,0.6)' }}>{author.bio}</p>
          <div className="flex items-center gap-3 mt-3">
            {author.socialTwitter && (
              <a
                href={`https://twitter.com/${author.socialTwitter.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[rgba(55,77,245,0.1)]"
                style={{ color: '#374DF5', border: '1px solid rgba(55,77,245,0.2)' }}
              >
                <Twitter className="h-3.5 w-3.5" />
                {author.socialTwitter}
              </a>
            )}
            {author.socialLinkedIn && (
              <a
                href={`https://${author.socialLinkedIn}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[rgba(55,77,245,0.1)]"
                style={{ color: '#374DF5', border: '1px solid rgba(55,77,245,0.2)' }}
              >
                <Linkedin className="h-3.5 w-3.5" />
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
