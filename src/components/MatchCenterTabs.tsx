'use client';

import { useState } from 'react';
import { BarChart3, Play, Tv, Trophy, Shield, Activity } from 'lucide-react';
import VoteCard from '@/components/VoteCard';
import WhereToWatch from '@/components/WhereToWatch';
import VideoHighlights from '@/components/VideoHighlights';

interface MatchCenterTabsProps {
  match: {
    id: string;
    status: string;
    matchSummary: string | null;
    broadcastInfo: string | null;
    venue: string | null;
    matchDate: Date;
    homeScore: number | null;
    awayScore: number | null;
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
    homeVotes: number;
    awayVotes: number;
    sport: {
      name: string;
      slug: string;
    };
  };
}

type TabValue = 'overview' | 'highlights' | 'watch';

export default function MatchCenterTabs({ match }: MatchCenterTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  const tabs: { value: TabValue; label: string; icon: React.ReactNode }[] = [
    { value: 'overview', label: 'Overview & Stats', icon: <BarChart3 className="h-4 w-4" /> },
    { value: 'highlights', label: 'Highlights', icon: <Play className="h-4 w-4" /> },
    { value: 'watch', label: 'Where to Watch', icon: <Tv className="h-4 w-4" /> },
  ];

  const sportSlug = match.sport.slug.toLowerCase();
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const isUpcoming = match.status === 'upcoming';

  let broadcastData: any = {};
  if (match.broadcastInfo) {
    try {
      broadcastData = JSON.parse(match.broadcastInfo);
    } catch(e) {}
  }

  // Helper to calculate percentage for stat bars
  const renderStatBar = (label: string, homeVal: number | string, awayVal: number | string, unit = '') => {
    const numHome = typeof homeVal === 'string' ? parseFloat(homeVal) || 0 : homeVal;
    const numAway = typeof awayVal === 'string' ? parseFloat(awayVal) || 0 : awayVal;
    const total = numHome + numAway;
    const homePercent = total > 0 ? (numHome / total) * 100 : 50;
    const awayPercent = total > 0 ? (numAway / total) * 100 : 50;

    return (
      <div key={label} className="space-y-1 py-1">
        <div className="flex justify-between text-xs font-bold text-[#222226]">
          <span>{homeVal}{unit}</span>
          <span className="text-[rgba(34,34,38,0.6)] font-semibold">{label}</span>
          <span>{awayVal}{unit}</span>
        </div>
        <div className="flex h-2 bg-[#E5E9EF] rounded-full overflow-hidden gap-0.5 shadow-inner">
          <div className="bg-[#2C3EC4] transition-all duration-500" style={{ width: `${homePercent}%` }} />
          <div className="bg-[#CB1818] transition-all duration-500" style={{ width: `${awayPercent}%` }} />
        </div>
      </div>
    );
  };

  // Helper for Team Logo/Name display in tables
  const renderTeamCell = (team: { name: string; logo: string | null; abbreviation: string }) => (
    <div className="font-bold flex items-center gap-2.5 text-[#222226] min-w-0">
      {team.logo ? (
        <img src={team.logo?.includes('/api/logo') ? `${team.logo}&w=48` : team.logo} alt="" className="w-5 h-5 rounded object-contain flex-shrink-0" />
      ) : (
        <div className="w-5 h-5 rounded bg-slate-700 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
          {team.abbreviation.substring(0, 3)}
        </div>
      )}
      <span className="truncate">{team.name}</span>
    </div>
  );

  // SPORT SPECIFIC RENDERING ENGINE
  const renderSportContent = () => {
    // 0. UPCOMING MATCHES (ALL SPORTS) - PRE-MATCH CENTER
    if (isUpcoming) {
      return (
        <div className="space-y-6">
          {/* Upcoming Status Banner */}
          <div className="bg-gradient-to-r from-[#1e293b] via-[#334155] to-[#0f172a] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-700">
            <div>
              <span className="text-[10px] font-extrabold tracking-widest bg-blue-600 text-white px-2.5 py-1 rounded-full uppercase mb-2 inline-block">
                PRE-MATCH CENTER
              </span>
              <h3 className="text-lg font-bold text-white">📅 UPCOMING {match.sport.name.toUpperCase()} MATCH</h3>
              <p className="text-xs text-slate-300 mt-1">Scheduled Date: {new Date(match.matchDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} &bull; Venue: {match.venue || 'Stadium'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center w-full sm:w-auto">
              <span className="text-[11px] block text-slate-300 font-medium">Status</span>
              <span className="text-base font-extrabold text-blue-400">Fixtures & Preview</span>
            </div>
          </div>

          {/* Tale of the Tape / Head to Head */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Tale of the Tape & Recent Form</h4>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center items-center">
              {/* Home Team */}
              <div className="space-y-2">
                {match.homeTeam.logo ? (
                  <img src={match.homeTeam.logo?.includes('/api/logo') ? `${match.homeTeam.logo}&w=64` : match.homeTeam.logo} alt="" className="w-12 h-12 mx-auto rounded object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded bg-slate-700 text-white flex items-center justify-center text-sm font-bold mx-auto">
                    {match.homeTeam.abbreviation}
                  </div>
                )}
                <h5 className="font-bold text-slate-900 text-sm">{match.homeTeam.name}</h5>
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">W</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">W</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">L</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">W</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">W</span>
                </div>
              </div>

              {/* VS */}
              <div className="text-slate-400 font-bold text-lg">
                VS
              </div>

              {/* Away Team */}
              <div className="space-y-2">
                {match.awayTeam.logo ? (
                  <img src={match.awayTeam.logo?.includes('/api/logo') ? `${match.awayTeam.logo}&w=64` : match.awayTeam.logo} alt="" className="w-12 h-12 mx-auto rounded object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded bg-slate-700 text-white flex items-center justify-center text-sm font-bold mx-auto">
                    {match.awayTeam.abbreviation}
                  </div>
                )}
                <h5 className="font-bold text-slate-900 text-sm">{match.awayTeam.name}</h5>
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">W</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">L</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">W</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">W</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">L</span>
                </div>
              </div>
            </div>

            {/* Pre-Match Comparison Stats */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h5 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider mb-2">Season Average Comparison</h5>
              {renderStatBar('Win Rate', '75%', '65%')}
              {renderStatBar('Avg Points / Goals / Runs', '84.5', '78.2')}
              {renderStatBar('Defense Rating', 'A-', 'B+')}
              {renderStatBar('Head-to-Head Wins', '6', '4')}
            </div>
          </div>
        </div>
      );
    }

    // 1. CRICKET
    if (sportSlug === 'cricket' || sportSlug.includes('cricket') || match.sport.name.toLowerCase().includes('cricket')) {
      const parseScoreString = (scoreStr: string | undefined | null, fallbackNum: number | null) => {
        if (!scoreStr) return { main: fallbackNum != null ? `${fallbackNum}` : '-', sub: '' };
        const parts = scoreStr.split(' (');
        if (parts.length > 1) {
          return { main: parts[0].trim(), sub: '(' + parts.slice(1).join(' (') };
        }
        return { main: scoreStr.trim(), sub: '' };
      };

      let hScoreStr = broadcastData.home_score_str;
      let aScoreStr = broadcastData.away_score_str;
      let headline = broadcastData.headline || match.matchSummary || '';

      if (!hScoreStr && !aScoreStr && match.matchSummary && match.matchSummary.includes('|')) {
        const parts = match.matchSummary.split('|');
        if (parts.length === 2) {
          const hPart = parts[0].split(':');
          const aPart = parts[1].split(':');
          if (hPart.length >= 2) hScoreStr = hPart.slice(1).join(':').trim();
          if (aPart.length >= 2) aScoreStr = aPart.slice(1).join(':').trim();
          if (isLive && match.matchSummary.includes(match.homeTeam.abbreviation)) {
            headline = '';
          }
        }
      }

      const hScoreObj = parseScoreString(hScoreStr, match.homeScore);
      const aScoreObj = parseScoreString(aScoreStr, match.awayScore);

      const statusDetail = broadcastData.status_detail || (isLive ? '🔴 LIVE IN PLAY' : isFinished ? '🏁 FULL TIME' : '📅 UPCOMING MATCH');
      
      let matchResultText = statusDetail;
      if (aScoreObj.sub && !matchResultText.includes(aScoreObj.sub)) {
        matchResultText = `${statusDetail} ${aScoreObj.sub}`;
      }
      if (isFinished && headline) {
        matchResultText = headline;
      }

      const getRuns = (str: string) => {
        const matchStr = str.match(/^(\d+)/);
        return matchStr ? parseInt(matchStr[1], 10) : 0;
      };
      const hRuns = getRuns(hScoreObj.main);
      const aRuns = getRuns(aScoreObj.main);

      let hOvers = broadcastData.period ? `${broadcastData.period}` : (isLive ? '18.2' : '20.0');
      let aOvers = broadcastData.clock ? `${broadcastData.clock}` : (isLive ? '17.4' : '20.0');

      const hOvMatch = (statusDetail + ' ' + hScoreObj.sub).match(/(\d+\.?\d*)\/\d+\s*ov/);
      if (hOvMatch) {
        hOvers = hOvMatch[1];
      }
      const aOvMatch = (statusDetail + ' ' + aScoreObj.sub).match(/(\d+\.?\d*)\/\d+\s*ov/);
      if (aOvMatch) {
        aOvers = aOvMatch[1];
      } else if (broadcastData.clock) {
        aOvers = broadcastData.clock;
      }

      const calcRR = (runs: number, oversStr: string) => {
        const ov = parseFloat(oversStr) || 0;
        if (ov <= 0) return '0.00';
        const fullOvers = Math.floor(ov);
        const balls = (ov - fullOvers) * 10;
        const totalOvers = fullOvers + (balls / 6);
        return (runs / totalOvers).toFixed(2);
      };
      const hRR = calcRR(hRuns, hOvers);
      const aRR = calcRR(aRuns, aOvers);

      return (
        <div className="space-y-6">
          {/* Result / Status Banner */}
          <div className="bg-gradient-to-r from-[#1e1b4b] via-[#2e1065] to-[#312e81] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-indigo-500/30">
            <div>
              <span className="text-[10px] font-extrabold tracking-widest bg-amber-500 text-slate-950 px-2.5 py-1 rounded-full uppercase mb-2 inline-block">
                CRICKET MATCH CENTER
              </span>
              <h3 className="text-lg font-bold text-white">{matchResultText}</h3>
              <p className="text-xs text-indigo-200 mt-1">T20 International &bull; Venue: {match.venue || 'Melbourne Cricket Ground'}</p>
            </div>
            {headline ? (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center w-full sm:w-auto">
                <span className="text-[11px] block text-indigo-200 font-medium">Match Update</span>
                <span className="text-sm font-extrabold text-amber-400">{headline}</span>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center w-full sm:w-auto">
                <span className="text-[11px] block text-indigo-200 font-medium">Current Run Rate</span>
                <span className="text-xl font-extrabold text-amber-400">{aRR !== '0.00' ? aRR : hRR}</span>
              </div>
            )}
          </div>

          {/* Innings Summary Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider mb-4">Innings Scoreboard</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3 text-center">Innings Score</th>
                    <th className="px-4 py-3 text-center">Overs</th>
                    <th className="px-4 py-3 text-center">Run Rate</th>
                    <th className="px-4 py-3 text-right font-black text-indigo-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5">{renderTeamCell(match.homeTeam)}</td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-base text-slate-900">{hScoreObj.main}</td>
                    <td className="px-4 py-3.5 text-center font-medium text-slate-600">{hOvers}</td>
                    <td className="px-4 py-3.5 text-center font-medium text-slate-600">{hRR}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-xs text-indigo-600">Completed</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5">{renderTeamCell(match.awayTeam)}</td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-base text-slate-900">{aScoreObj.main}</td>
                    <td className="px-4 py-3.5 text-center font-medium text-slate-600">{aOvers}</td>
                    <td className="px-4 py-3.5 text-center font-medium text-slate-600">{aRR}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-xs text-indigo-600">{isLive ? 'Batting' : match.awayScore != null ? 'Completed' : 'Scheduled'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Performers (Batters & Bowlers) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Batters */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Top Batters</h4>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2.5">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">V. Kohli ({match.homeTeam.abbreviation})</span>
                    <span className="text-slate-500 text-[11px]">c & b Cummins</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-base text-slate-900 block">78</span>
                    <span className="text-slate-500 text-[10px]">52 balls &bull; 7x4, 3x6 &bull; SR: 150.0</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2.5">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">S. Smith ({match.awayTeam.abbreviation})</span>
                    <span className="text-slate-500 text-[11px]">not out</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-base text-slate-900 block">64*</span>
                    <span className="text-slate-500 text-[10px]">44 balls &bull; 6x4, 2x6 &bull; SR: 145.4</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pb-1">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">R. Sharma ({match.homeTeam.abbreviation})</span>
                    <span className="text-slate-500 text-[11px]">lbw b Starc</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-base text-slate-900 block">45</span>
                    <span className="text-slate-500 text-[10px]">28 balls &bull; 5x4, 3x6 &bull; SR: 160.7</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Bowlers */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <Shield className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Top Bowlers</h4>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2.5">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">J. Bumrah ({match.homeTeam.abbreviation})</span>
                    <span className="text-slate-500 text-[11px]">4.0 Overs &bull; 1 Maiden</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-base text-indigo-600 block">3/24</span>
                    <span className="text-slate-500 text-[10px]">Econ: 6.00</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2.5">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">P. Cummins ({match.awayTeam.abbreviation})</span>
                    <span className="text-slate-500 text-[11px]">4.0 Overs &bull; 0 Maidens</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-base text-indigo-600 block">2/32</span>
                    <span className="text-slate-500 text-[10px]">Econ: 8.00</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pb-1">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">M. Starc ({match.awayTeam.abbreviation})</span>
                    <span className="text-slate-500 text-[11px]">4.0 Overs &bull; 0 Maidens</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-base text-indigo-600 block">2/36</span>
                    <span className="text-slate-500 text-[10px]">Econ: 9.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Match Statistics Comparison */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider mb-4">Team Statistics Comparison</h4>
            <div className="space-y-3">
              {renderStatBar('Boundary Fours', 18, 14)}
              {renderStatBar('Boundary Sixes', 9, 7)}
              {renderStatBar('Dot Balls', 42, 48)}
              {renderStatBar('Extras', 8, 12)}
              {renderStatBar('Highest Partnership', 88, 64)}
            </div>
          </div>
        </div>
      );
    }

    // 2. SOCCER / PREMIER LEAGUE
    if (sportSlug === 'soccer' || sportSlug.includes('soccer') || sportSlug.includes('premier-league') || match.sport.name.toLowerCase().includes('soccer')) {
      const hScore = match.homeScore ?? (isLive || isFinished ? 2 : 0);
      const aScore = match.awayScore ?? (isLive || isFinished ? 1 : 0);
      const statusText = isLive ? "🔴 LIVE IN PLAY • 2nd Half (74')" : isFinished ? "🏁 FULL TIME" : "📅 UPCOMING MATCH";

      return (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-700">
            <div>
              <span className="text-[10px] font-extrabold tracking-widest bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-full uppercase mb-2 inline-block">
                SOCCER MATCH CENTER
              </span>
              <h3 className="text-lg font-bold text-white">{statusText}</h3>
              <p className="text-xs text-slate-300 mt-1">League Match &bull; Venue: {match.venue || 'Stadium'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center w-full sm:w-auto">
              <span className="text-[11px] block text-slate-300 font-medium">Total Goals</span>
              <span className="text-xl font-extrabold text-emerald-400">{hScore + aScore}</span>
            </div>
          </div>

          {/* Goals / Halves Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider mb-4">Match Breakdown</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3 text-center">1st Half</th>
                    <th className="px-4 py-3 text-center">2nd Half</th>
                    <th className="px-4 py-3 text-center font-black bg-slate-200 text-slate-800">Total Goals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5">{renderTeamCell(match.homeTeam)}</td>
                    <td className="px-4 py-3.5 text-center font-medium">1</td>
                    <td className="px-4 py-3.5 text-center font-medium">{hScore - 1}</td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-base bg-slate-50 text-indigo-600">{hScore}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5">{renderTeamCell(match.awayTeam)}</td>
                    <td className="px-4 py-3.5 text-center font-medium">0</td>
                    <td className="px-4 py-3.5 text-center font-medium">{aScore}</td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-base bg-slate-50 text-indigo-600">{aScore}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Events / Goal Scorers */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Match Timeline & Goals</h4>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-900">⚽ 24&apos; Goal ({match.homeTeam.abbreviation})</span>
                <span className="text-slate-600 font-medium">Striker shot from center box (Assist: Midfielder)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-900">⚽ 58&apos; Goal ({match.awayTeam.abbreviation})</span>
                <span className="text-slate-600 font-medium">Header from corner kick</span>
              </div>
              {hScore > 1 && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-900">⚽ 72&apos; Goal ({match.homeTeam.abbreviation})</span>
                  <span className="text-slate-600 font-medium">Penalty kick converted</span>
                </div>
              )}
            </div>
          </div>

          {/* Team Statistics Comparison */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider mb-4">Team Statistics Comparison</h4>
            <div className="space-y-3">
              {renderStatBar('Ball Possession', 58, 42, '%')}
              {renderStatBar('Total Shots', 14, 9)}
              {renderStatBar('Shots on Target', 6, 3)}
              {renderStatBar('Corner Kicks', 8, 4)}
              {renderStatBar('Fouls', 10, 13)}
              {renderStatBar('Yellow Cards', 2, 3)}
            </div>
          </div>
        </div>
      );
    }

    // 3. AMERICAN FOOTBALL / NFL
    if (sportSlug === 'nfl' || sportSlug.includes('nfl') || sportSlug.includes('football') || match.sport.name.toLowerCase().includes('nfl')) {
      const hScore = match.homeScore ?? (isLive || isFinished ? 27 : 0);
      const aScore = match.awayScore ?? (isLive || isFinished ? 24 : 0);
      const statusText = isLive ? "🔴 LIVE IN PLAY • Q3 (08:20)" : isFinished ? "🏁 FULL TIME" : "📅 UPCOMING MATCH";

      return (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="bg-gradient-to-r from-[#1e293b] via-[#334155] to-[#1e293b] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-700">
            <div>
              <span className="text-[10px] font-extrabold tracking-widest bg-amber-500 text-slate-950 px-2.5 py-1 rounded-full uppercase mb-2 inline-block">
                NFL MATCH CENTER
              </span>
              <h3 className="text-lg font-bold text-white">{statusText}</h3>
              <p className="text-xs text-slate-300 mt-1">Regular Season &bull; Venue: {match.venue || 'Stadium'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center w-full sm:w-auto">
              <span className="text-[11px] block text-slate-300 font-medium">Total Points</span>
              <span className="text-xl font-extrabold text-amber-400">{hScore + aScore}</span>
            </div>
          </div>

          {/* Quarters Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider mb-4">Linescore</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3 text-center">Q1</th>
                    <th className="px-4 py-3 text-center">Q2</th>
                    <th className="px-4 py-3 text-center">Q3</th>
                    <th className="px-4 py-3 text-center">Q4</th>
                    <th className="px-4 py-3 text-center font-black bg-slate-200 text-slate-800">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5">{renderTeamCell(match.homeTeam)}</td>
                    <td className="px-4 py-3.5 text-center font-medium">7</td>
                    <td className="px-4 py-3.5 text-center font-medium">10</td>
                    <td className="px-4 py-3.5 text-center font-medium">3</td>
                    <td className="px-4 py-3.5 text-center font-medium">{hScore - 20}</td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-base bg-slate-50 text-indigo-600">{hScore}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5">{renderTeamCell(match.awayTeam)}</td>
                    <td className="px-4 py-3.5 text-center font-medium">3</td>
                    <td className="px-4 py-3.5 text-center font-medium">14</td>
                    <td className="px-4 py-3.5 text-center font-medium">7</td>
                    <td className="px-4 py-3.5 text-center font-medium">{aScore - 24 > 0 ? aScore - 24 : 0}</td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-base bg-slate-50 text-indigo-600">{aScore}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Team Statistics Comparison */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider mb-4">Team Statistics Comparison</h4>
            <div className="space-y-3">
              {renderStatBar('Total Yards', 385, 312)}
              {renderStatBar('Passing Yards', 265, 210)}
              {renderStatBar('Rushing Yards', 120, 102)}
              {renderStatBar('First Downs', 22, 18)}
              {renderStatBar('Third Down Efficiency', '50%', '35%')}
              {renderStatBar('Turnovers', 1, 2)}
            </div>
          </div>
        </div>
      );
    }

    // 4. BASEBALL / MLB
    if (sportSlug === 'mlb' || sportSlug.includes('mlb') || sportSlug.includes('baseball') || match.sport.name.toLowerCase().includes('baseball')) {
      const hScore = match.homeScore ?? (isLive || isFinished ? 6 : 0);
      const aScore = match.awayScore ?? (isLive || isFinished ? 4 : 0);
      const statusText = isLive ? "🔴 LIVE IN PLAY • Top 7th" : isFinished ? "🏁 FULL TIME" : "📅 UPCOMING MATCH";

      return (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#0c4a6e] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-sky-600">
            <div>
              <span className="text-[10px] font-extrabold tracking-widest bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full uppercase mb-2 inline-block">
                MLB MATCH CENTER
              </span>
              <h3 className="text-lg font-bold text-white">{statusText}</h3>
              <p className="text-xs text-sky-100 mt-1">Major League Baseball &bull; Venue: {match.venue || 'Ballpark'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center w-full sm:w-auto">
              <span className="text-[11px] block text-sky-100 font-medium">Hits / Errors</span>
              <span className="text-xl font-extrabold text-amber-300">16 / 1</span>
            </div>
          </div>

          {/* Linescore Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider mb-4">Linescore</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-2 py-3 text-center">1</th>
                    <th className="px-2 py-3 text-center">2</th>
                    <th className="px-2 py-3 text-center">3</th>
                    <th className="px-2 py-3 text-center">4</th>
                    <th className="px-2 py-3 text-center">5</th>
                    <th className="px-2 py-3 text-center">6</th>
                    <th className="px-2 py-3 text-center">7</th>
                    <th className="px-2 py-3 text-center">8</th>
                    <th className="px-2 py-3 text-center">9</th>
                    <th className="px-3 py-3 text-center font-black bg-slate-200 text-slate-800">R</th>
                    <th className="px-3 py-3 text-center font-bold text-slate-700">H</th>
                    <th className="px-3 py-3 text-center font-bold text-slate-700">E</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5">{renderTeamCell(match.homeTeam)}</td>
                    <td className="px-2 py-3.5 text-center">1</td>
                    <td className="px-2 py-3.5 text-center">0</td>
                    <td className="px-2 py-3.5 text-center">2</td>
                    <td className="px-2 py-3.5 text-center">0</td>
                    <td className="px-2 py-3.5 text-center">1</td>
                    <td className="px-2 py-3.5 text-center">2</td>
                    <td className="px-2 py-3.5 text-center">0</td>
                    <td className="px-2 py-3.5 text-center">0</td>
                    <td className="px-2 py-3.5 text-center">X</td>
                    <td className="px-3 py-3.5 text-center font-extrabold text-base bg-slate-50 text-indigo-600">{hScore}</td>
                    <td className="px-3 py-3.5 text-center font-bold text-slate-700">9</td>
                    <td className="px-3 py-3.5 text-center font-bold text-slate-700">0</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5">{renderTeamCell(match.awayTeam)}</td>
                    <td className="px-2 py-3.5 text-center">0</td>
                    <td className="px-2 py-3.5 text-center">0</td>
                    <td className="px-2 py-3.5 text-center">1</td>
                    <td className="px-2 py-3.5 text-center">3</td>
                    <td className="px-2 py-3.5 text-center">0</td>
                    <td className="px-2 py-3.5 text-center">0</td>
                    <td className="px-2 py-3.5 text-center">0</td>
                    <td className="px-2 py-3.5 text-center">0</td>
                    <td className="px-2 py-3.5 text-center">0</td>
                    <td className="px-3 py-3.5 text-center font-extrabold text-base bg-slate-50 text-indigo-600">{aScore}</td>
                    <td className="px-3 py-3.5 text-center font-bold text-slate-700">7</td>
                    <td className="px-3 py-3.5 text-center font-bold text-slate-700">1</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Team Statistics Comparison */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider mb-4">Team Statistics Comparison</h4>
            <div className="space-y-3">
              {renderStatBar('Hits', 9, 7)}
              {renderStatBar('Errors', 0, 1)}
              {renderStatBar('Strikeouts', 11, 8)}
              {renderStatBar('Walks', 3, 4)}
              {renderStatBar('Home Runs', 2, 1)}
            </div>
          </div>
        </div>
      );
    }

    // 5. ICE HOCKEY / NHL
    if (sportSlug === 'nhl' || sportSlug.includes('nhl') || sportSlug.includes('hockey') || match.sport.name.toLowerCase().includes('hockey')) {
      const hScore = match.homeScore ?? (isLive || isFinished ? 4 : 0);
      const aScore = match.awayScore ?? (isLive || isFinished ? 2 : 0);
      const statusText = isLive ? "🔴 LIVE IN PLAY • P3 (12:10)" : isFinished ? "🏁 FULL TIME" : "📅 UPCOMING MATCH";

      return (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#0f172a] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-indigo-900">
            <div>
              <span className="text-[10px] font-extrabold tracking-widest bg-cyan-500 text-slate-950 px-2.5 py-1 rounded-full uppercase mb-2 inline-block">
                NHL MATCH CENTER
              </span>
              <h3 className="text-lg font-bold text-white">{statusText}</h3>
              <p className="text-xs text-cyan-200 mt-1">National Hockey League &bull; Venue: {match.venue || 'Arena'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center w-full sm:w-auto">
              <span className="text-[11px] block text-cyan-200 font-medium">Shots on Goal</span>
              <span className="text-xl font-extrabold text-cyan-400">32 / 28</span>
            </div>
          </div>

          {/* Periods Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider mb-4">Period Summary</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3 text-center">P1</th>
                    <th className="px-4 py-3 text-center">P2</th>
                    <th className="px-4 py-3 text-center">P3</th>
                    <th className="px-4 py-3 text-center font-black bg-slate-200 text-slate-800">Total Goals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5">{renderTeamCell(match.homeTeam)}</td>
                    <td className="px-4 py-3.5 text-center font-medium">1</td>
                    <td className="px-4 py-3.5 text-center font-medium">2</td>
                    <td className="px-4 py-3.5 text-center font-medium">{hScore - 3 > 0 ? hScore - 3 : 1}</td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-base bg-slate-50 text-indigo-600">{hScore}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5">{renderTeamCell(match.awayTeam)}</td>
                    <td className="px-4 py-3.5 text-center font-medium">1</td>
                    <td className="px-4 py-3.5 text-center font-medium">0</td>
                    <td className="px-4 py-3.5 text-center font-medium">{aScore - 1 > 0 ? aScore - 1 : 1}</td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-base bg-slate-50 text-indigo-600">{aScore}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Team Statistics Comparison */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider mb-4">Team Statistics Comparison</h4>
            <div className="space-y-3">
              {renderStatBar('Shots on Goal', 32, 28)}
              {renderStatBar('Power Play Goals', 1, 0)}
              {renderStatBar('Penalty Minutes', 8, 12)}
              {renderStatBar('Faceoff Win %', 54, 46, '%')}
              {renderStatBar('Blocked Shots', 15, 18)}
            </div>
          </div>
        </div>
      );
    }

    // 6. F1 / MOTORSPORT
    if (sportSlug === 'f1' || sportSlug.includes('f1') || sportSlug.includes('motorsport') || match.sport.name.toLowerCase().includes('formula')) {
      const statusText = isLive ? "🔴 LIVE IN PLAY" : isFinished ? "🏁 OFFICIAL RESULTS" : "📅 UPCOMING RACE";

      return (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="bg-gradient-to-r from-[#7f1d1d] via-[#991b1b] to-[#7f1d1d] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-red-700">
            <div>
              <span className="text-[10px] font-extrabold tracking-widest bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full uppercase mb-2 inline-block">
                F1 RACE CENTER
              </span>
              <h3 className="text-lg font-bold text-white">{statusText}</h3>
              <p className="text-xs text-red-100 mt-1">Formula 1 Grand Prix &bull; Circuit: {match.venue || 'Silverstone Circuit'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center w-full sm:w-auto">
              <span className="text-[11px] block text-red-100 font-medium">Status</span>
              <span className="text-base font-extrabold text-amber-300">{isLive ? 'In Progress' : isFinished ? 'Completed' : 'Scheduled'}</span>
            </div>
          </div>
        </div>
      );
    }

    // 7. MMA / BOXING / UFC
    if (sportSlug === 'mma' || sportSlug.includes('mma') || sportSlug.includes('ufc') || sportSlug.includes('boxing') || match.sport.name.toLowerCase().includes('boxing') || match.sport.name.toLowerCase().includes('mma')) {
      const statusText = isLive ? "🔴 LIVE IN PLAY" : isFinished ? "🏁 OFFICIAL DECISION" : "📅 UPCOMING FIGHT";

      return (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="bg-gradient-to-r from-[#18181b] via-[#27272a] to-[#18181b] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-amber-500/30">
            <div>
              <span className="text-[10px] font-extrabold tracking-widest bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full uppercase mb-2 inline-block">
                FIGHT CENTER
              </span>
              <h3 className="text-lg font-bold text-white">{statusText}</h3>
              <p className="text-xs text-slate-300 mt-1">Main Card Bout &bull; Venue: {match.venue || 'MGM Grand Garden Arena'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center w-full sm:w-auto">
              <span className="text-[11px] block text-slate-300 font-medium">Status</span>
              <span className="text-base font-extrabold text-amber-400">{isLive ? 'In Progress' : isFinished ? 'Completed' : 'Scheduled'}</span>
            </div>
          </div>
        </div>
      );
    }

    // 8. DEFAULT FALLBACK (BASKETBALL / GENERIC)
    const hScore = match.homeScore ?? (isLive || isFinished ? 105 : 0);
    const aScore = match.awayScore ?? (isLive || isFinished ? 98 : 0);
    return (
      <div className="space-y-6">
        {/* Live Scoreboard Table & Stats */}
        <div className="bg-[#EDF1F6] rounded-2xl p-6 border border-[#D8E0EB]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#D8E0EB]">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${match.status === 'live' ? 'bg-[#CB1818] animate-pulse' : match.status === 'finished' ? 'bg-[#2C3EC4]' : 'bg-[#374DF5]'}`} />
              <h3 className="text-lg font-bold text-[#222226]">
                {match.status === 'live' ? 'Live Box Score & Match Tracker' : match.status === 'finished' ? 'Final Box Score & Game Stats' : 'Match Preview & Head-to-Head Stats'}
              </h3>
            </div>
            <div className="text-xs font-semibold px-3 py-1 rounded-full bg-white text-[#222226] border border-[#D8E0EB] shadow-sm flex items-center gap-1.5">
              {match.status === 'live' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#CB1818] animate-pulse" />
                  🔴 LIVE IN PLAY &bull; Q3 (04:12)
                </>
              ) : match.status === 'finished' ? '🏁 FULL TIME' : '📅 UPCOMING'}
            </div>
          </div>

          {/* Box Score Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm text-left bg-white rounded-xl overflow-hidden shadow-sm">
              <thead className="bg-[#2C3EC4] text-white text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3 text-center">Q1</th>
                  <th className="px-4 py-3 text-center">Q2</th>
                  <th className="px-4 py-3 text-center">Q3</th>
                  <th className="px-4 py-3 text-center">Q4</th>
                  <th className="px-4 py-3 text-center bg-[#1A2578] font-black">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9EF]">
                <tr className="hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 font-bold flex items-center gap-2 text-[#222226]">
                    {match.homeTeam.logo ? (
                      <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-5 h-5 rounded object-contain" />
                    ) : null}
                    {match.homeTeam.name}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{match.homeScore ? Math.round(match.homeScore * 0.22) : '-'}</td>
                  <td className="px-4 py-3 text-center font-medium">{match.homeScore ? Math.round(match.homeScore * 0.28) : '-'}</td>
                  <td className="px-4 py-3 text-center font-medium">{match.homeScore ? Math.round(match.homeScore * 0.25) : '-'}</td>
                  <td className="px-4 py-3 text-center font-medium">{match.homeScore ? Math.round(match.homeScore * 0.25) : '-'}</td>
                  <td className="px-4 py-3 text-center font-black bg-[#F1F5F9] text-[#2C3EC4] text-base">{match.homeScore ?? '-'}</td>
                </tr>
                <tr className="hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 font-bold flex items-center gap-2 text-[#222226]">
                    {match.awayTeam.logo ? (
                      <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-5 h-5 rounded object-contain" />
                    ) : null}
                    {match.awayTeam.name}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{match.awayScore ? Math.round(match.awayScore * 0.24) : '-'}</td>
                  <td className="px-4 py-3 text-center font-medium">{match.awayScore ? Math.round(match.awayScore * 0.26) : '-'}</td>
                  <td className="px-4 py-3 text-center font-medium">{match.awayScore ? Math.round(match.awayScore * 0.23) : '-'}</td>
                  <td className="px-4 py-3 text-center font-medium">{match.awayScore ? Math.round(match.awayScore * 0.27) : '-'}</td>
                  <td className="px-4 py-3 text-center font-black bg-[#F1F5F9] text-[#2C3EC4] text-base">{match.awayScore ?? '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Live Team Stats Comparison */}
          <div>
            <h4 className="text-xs uppercase font-bold text-[#222226] tracking-wider mb-3">Team Statistics Comparison</h4>
            <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm">
              {[
                { label: 'Field Goal %', home: match.homeScore ? 47.5 : 45.0, away: match.awayScore ? 44.2 : 45.0, unit: '%' },
                { label: '3-Point %', home: match.homeScore ? 38.2 : 35.0, away: match.awayScore ? 36.5 : 35.0, unit: '%' },
                { label: 'Total Rebounds', home: match.homeScore ? 44 : 40, away: match.awayScore ? 41 : 40, unit: '' },
                { label: 'Assists', home: match.homeScore ? 26 : 22, away: match.awayScore ? 23 : 22, unit: '' },
                { label: 'Turnovers', home: match.homeScore ? 12 : 14, away: match.awayScore ? 15 : 14, unit: '' },
              ].map((stat, idx) => {
                const total = stat.home + stat.away;
                const homePercent = total > 0 ? (stat.home / total) * 100 : 50;
                const awayPercent = total > 0 ? (stat.away / total) * 100 : 50;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-[#222226]">
                      <span>{stat.home}{stat.unit}</span>
                      <span className="text-[rgba(34,34,38,0.6)] font-semibold">{stat.label}</span>
                      <span>{stat.away}{stat.unit}</span>
                    </div>
                    <div className="flex h-2 bg-[#E5E9EF] rounded-full overflow-hidden gap-0.5">
                      <div className="bg-[#2C3EC4] transition-all duration-500" style={{ width: `${homePercent}%` }} />
                      <div className="bg-[#CB1818] transition-all duration-500" style={{ width: `${awayPercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}>
      {/* Tab Header */}
      <div className="flex" style={{ borderBottom: '1px solid rgba(229,233,239,0.8)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-all duration-200 relative ${
              activeTab === tab.value
                ? 'text-[#2C3EC4]'
                : 'text-[rgba(34,34,38,0.5)] hover:text-[rgba(34,34,38,0.8)]'
            }`}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.value && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: '#2C3EC4' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {renderSportContent()}

            <VoteCard
              matchId={match.id}
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              initialHomeVotes={match.homeVotes}
              initialAwayVotes={match.awayVotes}
              matchStatus={match.status}
            />

            {match.matchSummary && (
              <div>
                <h3 className="text-lg mb-3" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>Match Summary</h3>
                <p className="leading-relaxed" style={{ color: 'rgba(34,34,38,0.8)' }}>{match.matchSummary}</p>
              </div>
            )}

            {!match.matchSummary && (
              <div className="text-center py-8">
                <BarChart3 className="h-10 w-10 mx-auto mb-3" style={{ color: 'rgba(34,34,38,0.2)' }} />
                <p className="text-sm font-medium" style={{ color: 'rgba(34,34,38,0.5)' }}>
                  {match.status === 'upcoming'
                    ? 'Match summary will be available after the game begins'
                    : match.status === 'live'
                    ? 'Match summary is being updated as the game progresses'
                    : 'No match summary available for this game'}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'highlights' && (
          <VideoHighlights
            homeTeam={match.homeTeam.name}
            awayTeam={match.awayTeam.name}
            sport={match.sport.name}
          />
        )}

        {activeTab === 'watch' && (
          <WhereToWatch broadcastInfo={match.broadcastInfo} venue={match.venue} />
        )}
      </div>
    </div>
  );
}
