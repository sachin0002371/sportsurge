'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText, X } from 'lucide-react';

// ============================================================================
// APP MODE CONFIGURATION
// Change to 'live' to hide the floating Dev Buttons (Fetch Data & Generate Article)
// Change to 'test' to show the dev buttons for testing/debugging
// ============================================================================
export const APP_MODE: 'test' | 'live' = 'live';

interface FetchResult {
  success: boolean;
  message?: string;
  results?: Record<string, number>;
  totalMatches?: number;
  error?: string;
}

export default function DevFetchButton() {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);

  // Hide the floating buttons completely when in 'live' mode
  if (APP_MODE === 'live') {
    return null;
  }

  const handleFetch = async () => {
    setLoading(true);
    setStatusMessage({ type: 'info', text: '🔄 Fetching live match data from ESPN...' });

    try {
      const response = await fetch('/api/fetch-data', { method: 'POST' });
      let data: FetchResult;
      try {
        data = await response.json();
      } catch (parseErr) {
        throw new Error('Invalid JSON response from server');
      }

      if (data.success) {
        setStatusMessage({ type: 'success', text: `✅ ESPN Fetch Complete! Pulled ${data.totalMatches || 0} matches.` });
      } else {
        setStatusMessage({ type: 'error', text: `❌ Error: ${data.error || 'Failed to fetch data'}` });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `❌ Network error: ${err.message}` });
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMessage(null), 10000);
    }
  };

  const handleGenerateArticle = async () => {
    setGenerating(true);
    setStatusMessage({ type: 'info', text: '🤖 5-Layer Gemini AI Pipeline generating premium article...' });

    const topics = [
      'Playoff race heats up as teams battle for positioning',
      'Rookie sensation making waves this season',
      'Trade deadline shake-up changes the landscape',
      'Defensive masterclass leads to upset victory',
      'MVP candidates making their case in crunch time',
    ];
    const sportSlugs = ['nba', 'nfl', 'mlb', 'nhl', 'mma'];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const randomSport = sportSlugs[Math.floor(Math.random() * sportSlugs.length)];

    try {
      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sportSlug: randomSport, topic: randomTopic }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        throw new Error('Python backend returned an incomplete or empty response. Please check Python console.');
      }

      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `✅ Article Published: "${data.article?.title || randomTopic}" (By ${data.article?.author || 'AI Studio'})`
        });
      } else {
        setStatusMessage({ type: 'error', text: `❌ Error: ${data.error}` });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `❌ Generation failed: ${err.message}` });
    } finally {
      setGenerating(false);
      setTimeout(() => setStatusMessage(null), 15000);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {/* Status / Message Popup */}
      {statusMessage && (
        <div className={`rounded-2xl p-4 shadow-2xl border w-80 animate-slide-up flex items-start justify-between gap-3 ${statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
          statusMessage.type === 'error' ? 'bg-red-50 border-red-200 text-red-900' :
            'bg-indigo-50 border-indigo-200 text-indigo-900'
          }`}>
          <div className="text-xs font-semibold leading-relaxed flex-1">
            {statusMessage.text}
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Generate Article Button */}
        <Button
          onClick={handleGenerateArticle}
          disabled={generating || loading}
          className="text-white shadow-xl rounded-full h-11 px-5 gap-2 text-sm font-bold transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: '#10B981' }} // Beautiful Emerald Green for Article Gen
        >
          <FileText className={`h-4 w-4 ${generating ? 'animate-pulse' : ''}`} />
          {generating ? 'Generating AI Article...' : 'Generate AI Article'}
        </Button>

        {/* Fetch Data Button */}
        <Button
          onClick={handleFetch}
          disabled={loading || generating}
          className="text-white shadow-xl rounded-full h-11 px-5 gap-2 text-sm font-bold transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: '#374DF5' }} // Vibrant Blue for Fetch Data
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Fetching ESPN...' : 'Fetch Data'}
        </Button>
      </div>
    </div>
  );
}
