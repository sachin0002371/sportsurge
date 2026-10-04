'use client';

import { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export default function SiteDisclaimer() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-2.5 text-center relative">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs sm:text-sm font-medium">
        <ShieldCheck className="h-4 w-4 flex-shrink-0" />
        <span>
          <strong>Sportsurge Official</strong> is a 100% legal, editorial sports information platform providing live scores, fixtures, and official broadcast guides. 
          We do <strong>NOT</strong> host, stream, or link to any unauthorized or pirated content. All streaming references point to verified, legal services only.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
        aria-label="Dismiss disclaimer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}