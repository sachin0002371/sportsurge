import Link from 'next/link';
import { getStatusBadgeColor, getStatusLabel, formatTime, formatDate, getVotePercentages } from '@/lib/utils';
import SportIcon from '@/components/SportIcon';

interface MatchCardProps {
  match: {
    id: string;
    slug: string;
    homeScore: number | null;
    awayScore: number | null;
    status: string;
    matchDate: string | Date;
    broadcastInfo?: string | null;
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
  };
  compact?: boolean;
}

export default function MatchCard({ match, compact = false }: MatchCardProps) {
  const votePercentages = getVotePercentages(match.homeVotes, match.awayVotes);

  let broadcastData: any = {};
  if (match.broadcastInfo) {
    try {
      broadcastData = JSON.parse(match.broadcastInfo);
    } catch(e) {}
  }

  const parseScoreString = (scoreStr: string | undefined | null, fallbackNum: number | null) => {
    if (!scoreStr) return { main: fallbackNum != null ? `${fallbackNum}` : '-', sub: '' };
    const parts = scoreStr.split(' (');
    if (parts.length > 1) {
      return { main: parts[0].trim(), sub: '(' + parts.slice(1).join(' (') };
    }
    return { main: scoreStr.trim(), sub: '' };
  };

  const hScoreObj = parseScoreString(broadcastData.home_score_str, match.homeScore);
  const aScoreObj = parseScoreString(broadcastData.away_score_str, match.awayScore);

  return (
    <Link href={`/${match.sport.slug}/match/${match.slug}`}>
      <div
        className="bg-white rounded-2xl transition-all duration-200 p-4 group cursor-pointer hover:shadow-md"
        style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}
      >
        {/* Sport badge + Status */}
        <div className="flex items-center justify-between mb-3">
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
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: '#374DF5', backgroundColor: 'rgba(55,77,245,0.1)' }}>
              UPCOMING
            </span>
          ) : (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusBadgeColor(match.status)}`}>
              {getStatusLabel(match.status)}
            </span>
          )}
        </div>

        {/* Teams - inner row */}
        <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(229,233,239,0.5)' }}>
          <div className="space-y-2">
            {/* Home team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {match.homeTeam.logo ? (
                  <img
                    src={match.homeTeam.logo?.includes('/api/logo') ? `${match.homeTeam.logo}&w=64` : match.homeTeam.logo}
                    alt={match.homeTeam.name}
                    className="w-7 h-7 rounded object-contain flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                    style={{ backgroundColor: match.homeTeam.color || '#666' }}
                  >
                    {match.homeTeam.abbreviation.substring(0, 3)}
                  </div>
                )}
                <span className="text-sm truncate transition-colors" style={{ color: '#374DF5', fontWeight: 400 }}>
                  {compact ? match.homeTeam.abbreviation : match.homeTeam.name}
                </span>
              </div>
              <span className="text-lg" style={{ fontWeight: 700, color: match.status === 'live' ? '#CB1818' : match.status === 'finished' ? '#222226' : 'rgba(34,34,38,0.4)' }}>
                {hScoreObj.main}
              </span>
            </div>

            {/* Away team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {match.awayTeam.logo ? (
                  <img
                    src={match.awayTeam.logo?.includes('/api/logo') ? `${match.awayTeam.logo}&w=64` : match.awayTeam.logo}
                    alt={match.awayTeam.name}
                    className="w-7 h-7 rounded object-contain flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                    style={{ backgroundColor: match.awayTeam.color || '#666' }}
                  >
                    {match.awayTeam.abbreviation.substring(0, 3)}
                  </div>
                )}
                <span className="text-sm truncate transition-colors" style={{ color: '#374DF5', fontWeight: 400 }}>
                  {compact ? match.awayTeam.abbreviation : match.awayTeam.name}
                </span>
              </div>
              <span className="text-lg" style={{ fontWeight: 700, color: match.status === 'live' ? '#CB1818' : match.status === 'finished' ? '#222226' : 'rgba(34,34,38,0.4)' }}>
                {aScoreObj.main}
              </span>
            </div>

            {(hScoreObj.sub || aScoreObj.sub) && (
              <div className="pt-1.5 border-t border-slate-200/60 text-[11px] font-medium text-center text-slate-600 bg-slate-200/40 rounded py-0.5 px-2 truncate">
                {hScoreObj.sub} {aScoreObj.sub}
              </div>
            )}
          </div>
        </div>

        {/* Vote bar */}
        {(match.homeVotes + match.awayVotes) > 0 && (
          <div className="mt-3">
            <div className="flex h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E9EF' }}>
              <div
                style={{ backgroundColor: '#374DF5', width: `${votePercentages.home}%` }}
                className="transition-all duration-500"
              />
              <div
                style={{ backgroundColor: '#E5E9EF', width: `${votePercentages.away}%` }}
                className="transition-all duration-500"
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] font-medium" style={{ color: '#374DF5' }}>{votePercentages.home}%</span>
              <span className="text-[10px]" style={{ color: 'rgba(34,34,38,0.5)' }}>{votePercentages.away}%</span>
            </div>
          </div>
        )}

        {/* Time for upcoming */}
        {match.status === 'upcoming' && (
          <div className="mt-2 text-xs text-center" style={{ color: 'rgba(34,34,38,0.5)' }}>
            {formatDate(match.matchDate)} • {formatTime(match.matchDate)}
          </div>
        )}
      </div>
    </Link>
  );
}
