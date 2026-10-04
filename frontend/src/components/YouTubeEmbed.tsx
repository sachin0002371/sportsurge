'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
}

export default function YouTubeEmbed({ videoId, title = 'YouTube video player' }: YouTubeEmbedProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setIsOpen(false)}>
      <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setIsOpen(false)}
          className="absolute -top-10 right-0 text-white hover:text-white/80 transition-colors"
          aria-label="Close video"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 w-full h-full rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}

export function YouTubeEmbedTrigger({ videoId, title }: YouTubeEmbedProps) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      Open on YouTube
    </a>
  );
}
