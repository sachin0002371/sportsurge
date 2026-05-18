'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface GenerateArticleButtonProps {
  sportSlug: string;
  sportName: string;
}

export default function GenerateArticleButton({ sportSlug, sportName }: GenerateArticleButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic for the article');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sportSlug, topic: topic.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Article generated: "${data.article.title}"`);
        setTopic('');
        setIsOpen(false);
        window.location.reload();
      } else {
        toast.error(data.error || 'Failed to generate article');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const quickTopics = [
    `${sportName} playoff race update`,
    `Top performers this week in ${sportName}`,
    `${sportName} trade rumors and predictions`,
  ];

  return (
    <div className="rounded-2xl p-4" style={{ border: '1px dashed rgba(55,77,245,0.4)', backgroundColor: 'rgba(55,77,245,0.04)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: '#374DF5' }} />
          <span className="text-sm font-medium" style={{ color: '#2C3EC4' }}>AI Article Generator</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'rgba(55,77,245,0.15)', color: '#2C3EC4' }}>DEV</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs hover:bg-[rgba(55,77,245,0.08)]"
          style={{ borderColor: 'rgba(55,77,245,0.3)' }}
        >
          {isOpen ? 'Cancel' : 'Generate Article'}
        </Button>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-3 animate-slide-up">
          <div className="flex gap-2">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={`Enter a ${sportName} article topic...`}
              className="text-sm"
              style={{ borderColor: 'rgba(55,77,245,0.3)' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !generating) handleGenerate();
              }}
              disabled={generating}
            />
            <Button
              onClick={handleGenerate}
              disabled={generating || !topic.trim()}
              className="text-white gap-2 shrink-0"
              style={{ backgroundColor: '#374DF5' }}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] uppercase font-semibold self-center" style={{ color: 'rgba(34,34,38,0.5)' }}>Quick:</span>
            {quickTopics.map((qt) => (
              <button
                key={qt}
                onClick={() => setTopic(qt)}
                className="text-xs bg-white rounded-full px-2.5 py-1 transition-colors hover:bg-[rgba(55,77,245,0.08)]"
                style={{ border: '1px solid rgba(55,77,245,0.25)', color: '#2C3EC4' }}
              >
                {qt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
