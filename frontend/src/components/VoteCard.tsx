'use client';

import { useState } from 'react';

interface VoteCardProps {
  matchId: string;
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
    logo: string | null;
    color: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
    logo: string | null;
    color: string | null;
  };
  initialHomeVotes: number;
  initialAwayVotes: number;
  matchStatus: string;
}

export default function VoteCard({
  matchId,
  homeTeam,
  awayTeam,
  initialHomeVotes,
  initialAwayVotes,
  matchStatus,
}: VoteCardProps) {
  const [homeVotes, setHomeVotes] = useState(initialHomeVotes);
  const [awayVotes, setAwayVotes] = useState(initialAwayVotes);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  const total = homeVotes + awayVotes;
  const homePercentage = total > 0 ? Math.round((homeVotes / total) * 100) : 50;
  const awayPercentage = total > 0 ? Math.round((awayVotes / total) * 100) : 50;

  const handleVote = async (teamId: string) => {
    if (voted || matchStatus === 'finished') return;
    setLoading(true);

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, teamId }),
      });

      const data = await response.json();

      if (data.homeVotes !== undefined) {
        setHomeVotes(data.homeVotes);
        setAwayVotes(data.awayVotes);
        setVoted(true);
      }
    } catch (error) {
      console.error('Vote failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}>
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(34,34,38,0.6)' }}>
        Who will win?
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Home team */}
        <button
          onClick={() => handleVote(homeTeam.id)}
          disabled={voted || matchStatus === 'finished' || loading}
          className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
            voted
              ? 'border-transparent cursor-default'
              : 'border-transparent hover:border-[#374DF5] cursor-pointer'
          }`}
          style={voted ? {} : { backgroundColor: 'rgba(229,233,239,0.5)' }}
        >
          {homeTeam.logo ? (
            <img src={homeTeam.logo} alt={homeTeam.name} className="w-16 h-16 rounded object-contain" />
          ) : (
            <div
              className="w-16 h-16 rounded flex items-center justify-center text-white text-lg font-bold"
              style={{ backgroundColor: homeTeam.color || '#666' }}
            >
              {homeTeam.abbreviation.substring(0, 3)}
            </div>
          )}
          <span className="text-sm font-semibold text-center" style={{ color: '#222226' }}>{homeTeam.name}</span>
          {voted && (
            <span className="text-2xl" style={{ fontWeight: 700, color: '#374DF5' }}>{homePercentage}%</span>
          )}
        </button>

        {/* Away team */}
        <button
          onClick={() => handleVote(awayTeam.id)}
          disabled={voted || matchStatus === 'finished' || loading}
          className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
            voted
              ? 'border-transparent cursor-default'
              : 'border-transparent hover:border-[#374DF5] cursor-pointer'
          }`}
          style={voted ? {} : { backgroundColor: 'rgba(229,233,239,0.5)' }}
        >
          {awayTeam.logo ? (
            <img src={awayTeam.logo} alt={awayTeam.name} className="w-16 h-16 rounded object-contain" />
          ) : (
            <div
              className="w-16 h-16 rounded flex items-center justify-center text-white text-lg font-bold"
              style={{ backgroundColor: awayTeam.color || '#666' }}
            >
              {awayTeam.abbreviation.substring(0, 3)}
            </div>
          )}
          <span className="text-sm font-semibold text-center" style={{ color: '#222226' }}>{awayTeam.name}</span>
          {voted && (
            <span className="text-2xl" style={{ fontWeight: 700, color: '#374DF5' }}>{awayPercentage}%</span>
          )}
        </button>
      </div>

      {/* Vote bar */}
      {voted && (
        <div className="mt-4">
          <div className="flex h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E9EF' }}>
            <div
              className="transition-all duration-700 ease-out rounded-l-full"
              style={{ backgroundColor: '#374DF5', width: `${homePercentage}%` }}
            />
            <div
              className="transition-all duration-700 ease-out rounded-r-full"
              style={{ backgroundColor: '#E5E9EF', width: `${awayPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs font-medium" style={{ color: '#374DF5' }}>{homePercentage}% {homeTeam.abbreviation}</span>
            <span className="text-xs font-medium" style={{ color: 'rgba(34,34,38,0.5)' }}>{awayPercentage}% {awayTeam.abbreviation}</span>
          </div>
          <p className="text-xs text-center mt-2" style={{ color: 'rgba(34,34,38,0.4)' }}>
            {total.toLocaleString()} votes cast
          </p>
        </div>
      )}

      {!voted && matchStatus !== 'finished' && (
        <p className="text-xs text-center mt-4" style={{ color: 'rgba(34,34,38,0.4)' }}>
          Click on a team to cast your vote
        </p>
      )}

      {matchStatus === 'finished' && (
        <p className="text-xs text-center mt-4" style={{ color: 'rgba(34,34,38,0.4)' }}>
          Voting has ended for this match
        </p>
      )}
    </div>
  );
}
