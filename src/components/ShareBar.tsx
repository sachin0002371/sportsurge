'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link2, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareBar() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        });
      } else {
        handleCopyLink();
      }
    } catch {
      // User cancelled or error
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="gap-2 text-xs"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" style={{ color: '#374DF5' }} />
            Copied!
          </>
        ) : (
          <>
            <Link2 className="h-3.5 w-3.5" />
            Copy Link
          </>
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleNativeShare}
        className="gap-2 text-xs"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </Button>
    </div>
  );
}
