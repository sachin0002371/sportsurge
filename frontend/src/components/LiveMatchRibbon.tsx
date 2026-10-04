'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatTime, formatDate, SPORT_ICONS, getVotePercentages } from '@/lib/utils';
import SportIcon from '@/components/SportIcon';

interface MatchItem {
  id: string;
  slug: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  matchDate: string | Date;
  homeVotes: number;
  awayVotes: number;
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
    slug: string;
    logo: string | null;
    color: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
    slug: string;
    logo: string | null;
    color: string | null;
  };
  sport: {
    slug: string;
    name: string;
    icon: string;
  };
}

interface LiveMatchRibbonProps {
  matches: MatchItem[];
}

type FilterType = 'all' | 'live' | 'upcoming';

export default function LiveMatchRibbon({ matches }: LiveMatchRibbonProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredMatches = matches.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'live') return m.status === 'live';
    if (filter === 'upcoming') return m.status === 'upcoming';
    return true;
  });

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const liveCount = matches.filter(m => m.status === 'live').length;
  const upcomingCount = matches.filter(m => m.status === 'upcoming').length;

  return (
    <section>
      <div className="max-w-7xl mx-auto px-4 py-5">
        {/* Header with filter tabs */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold" style={{ color: '#222226', letterSpacing: '-0.02em' }}>Live & Upcoming</h2>
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: '#CB1818', backgroundColor: 'rgba(203,24,24,0.1)' }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#CB1818' }} />
                {liveCount} Live
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-[rgba(229,233,239,0.5)]"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-4 w-4" style={{ color: '#222226' }} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-[rgba(229,233,239,0.5)]"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-4 w-4" style={{ color: '#222226' }} />
            </Button>
          </div>
        </div>

        {/* Filter pills - SofaScore style */}
        <div className="flex items-center gap-2 mb-3">
          {[
            { key: 'all' as FilterType, label: 'All' },
            { key: 'live' as FilterType, label: 'Live' },
            { key: 'upcoming' as FilterType, label: 'Upcoming' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                filter === tab.key
                  ? tab.key === 'live'
                    ? 'text-[#CB1818] bg-[rgba(203,24,24,0.1)] font-bold'
                    : 'text-amber-400 bg-indigo-950 border border-amber-500/30 font-bold shadow-sm'
                  : 'text-[rgba(34,34,38,0.6)] bg-[rgba(229,233,239,0.5)] hover:bg-[rgba(229,233,239,0.8)]'
              }`}
            >
              {tab.label}
              {tab.key === 'live' && liveCount > 0 && (
                <span className="ml-1">({liveCount})</span>
              )}
              {tab.key === 'upcoming' && upcomingCount > 0 && (
                <span className="ml-1">({upcomingCount})</span>
              )}
            </button>
          ))}
        </div>

        {/* Horizontal scrollable match cards */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredMatches.length === 0 ? (
            <div className="text-sm py-4 px-4" style={{ color: 'rgba(34,34,38,0.6)' }}>No matches found</div>
          ) : (
            filteredMatches.map((match) => {
              const votePercentages = getVotePercentages(match.homeVotes, match.awayVotes);

              return (
                <Link
                  key={match.id}
                  href={`/${match.sport.slug}/match/${match.slug}`}
                  className="flex-shrink-0 w-72"
                >
                  <div className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-600 transition-all duration-200 p-3 group cursor-pointer border border-transparent" style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}>
                    {/* Sport + Status */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'rgba(34,34,38,0.6)' }}>
                        <SportIcon slug={match.sport.slug} size="sm" />
                        {match.sport.name}
                      </span>
                      {match.status === 'live' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: '#CB1818', backgroundColor: 'rgba(203,24,24,0.1)' }}>
                          <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#CB1818' }} />
                          LIVE
                        </span>
                      ) : match.status === 'upcoming' ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-indigo-700 bg-indigo-50 border border-indigo-100">
                          {formatTime(match.matchDate)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: 'rgba(34,34,38,0.5)', backgroundColor: 'rgba(229,233,239,0.5)' }}>
                          FT
                        </span>
                      )}
                    </div>

                    {/* Matchup - inner row */}
                    <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(229,233,239,0.5)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            {match.homeTeam.logo ? (
                              <img src={match.homeTeam.logo?.includes('/api/logo') ? `${match.homeTeam.logo}&w=48` : match.homeTeam.logo} alt="" className="w-6 h-6 rounded object-contain" />
                            ) : (
                              <div
                                className="w-6 h-6 rounded flex items-center justify-center text-white text-[8px] font-bold"
                                style={{ backgroundColor: match.homeTeam.color || '#666' }}
                              >
                                {match.homeTeam.abbreviation.substring(0, 2)}
                              </div>
                            )}
                            <span className="text-sm truncate transition-colors group-hover:text-indigo-600 font-medium" style={{ color: '#222226' }}>
                              {match.homeTeam.abbreviation}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {match.awayTeam.logo ? (
                              <img src={match.awayTeam.logo?.includes('/api/logo') ? `${match.awayTeam.logo}&w=48` : match.awayTeam.logo} alt="" className="w-6 h-6 rounded object-contain" />
                            ) : (
                              <div
                                className="w-6 h-6 rounded flex items-center justify-center text-white text-[8px] font-bold"
                                style={{ backgroundColor: match.awayTeam.color || '#666' }}
                              >
                                {match.awayTeam.abbreviation.substring(0, 2)}
                              </div>
                            )}
                            <span className="text-sm truncate transition-colors group-hover:text-indigo-600 font-medium" style={{ color: '#222226' }}>
                              {match.awayTeam.abbreviation}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-lg" style={{ fontWeight: 700, color: match.status === 'live' ? '#CB1818' : '#222226' }}>
                              {match.homeScore ?? '-'}
                            </div>
                            <div className="text-lg" style={{ fontWeight: 700, color: match.status === 'live' ? '#CB1818' : '#222226' }}>
                              {match.awayScore ?? '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vote bar mini */}
                    {(match.homeVotes + match.awayVotes) > 0 && (
                      <div className="mt-2">
                        <div className="flex h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E9EF' }}>
                          <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 transition-all duration-500" style={{ width: `${votePercentages.home}%` }} />
                          <div style={{ backgroundColor: '#E5E9EF', width: `${votePercentages.away}%` }} className="transition-all duration-500" />
                        </div>
                      </div>
                    )}

                    {/* Bottom Status / Date Bar (Maintains equal card height) */}
                    <div className="mt-2 text-[10px] text-center font-medium truncate" style={{ color: match.status === 'live' ? '#CB1818' : 'rgba(34,34,38,0.5)' }}>
                      {match.status === 'live' ? '🔴 Match in Progress' : formatDate(match.matchDate)}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
