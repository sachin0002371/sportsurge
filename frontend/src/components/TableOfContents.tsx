'use client';

import { useEffect, useMemo, useState } from 'react';
import { List } from 'lucide-react';

interface TableOfContentsProps {
  content: string;
}

interface Heading {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  const headings = useMemo<Heading[]>(() => {
    const lines = content.split('\n');
    const extracted: Heading[] = [];
    for (const line of lines) {
      const match = line.match(/^(#{2,4})\s+(.+)/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[*_`]/g, '').trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        extracted.push({ id, text, level });
      }
    }
    return extracted;
  }, [content]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    // Observe all heading elements in the article content
    const articleEl = document.querySelector('.article-content');
    if (articleEl) {
      const h2s = articleEl.querySelectorAll('h2, h3, h4');
      h2s.forEach((h) => {
        const id = h.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '';
        h.id = id;
        observer.observe(h);
      });
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <div>
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}>
        <h4 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'rgba(34,34,38,0.5)' }}>
          <List className="h-4 w-4" />
          Table of Contents
        </h4>
        <nav className="space-y-1 max-h-80 overflow-y-auto">
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(heading.id);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`block text-sm transition-colors duration-150 rounded-md px-2 py-1 ${
                heading.level === 3 ? 'pl-5' : heading.level === 4 ? 'pl-8' : ''
              } ${
                activeId === heading.id
                  ? 'font-semibold text-[#2C3EC4] bg-[rgba(44,62,196,0.06)]'
                  : 'hover:text-[#374DF5] text-[rgba(34,34,38,0.6)]'
              }`}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
