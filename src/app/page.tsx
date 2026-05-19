import { db } from '@/lib/db';
import LiveMatchRibbon from '@/components/LiveMatchRibbon';
import ArticleHero from '@/components/ArticleHero';
import ArticleCard from '@/components/ArticleCard';
import MatchCard from '@/components/MatchCard';
import StandingsTable from '@/components/StandingsTable';
import DevFetchButton from '@/components/DevFetchButton';
import LiveRefreshIndicator from '@/components/LiveRefreshIndicator';
import { FeaturedHighlights } from '@/components/VideoHighlights';
import Link from 'next/link';
import { formatDate, formatTime } from '@/lib/utils';
import SportIcon from '@/components/SportIcon';
import AdPlacement from '@/components/AdPlacement';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sportsurge Official – Fast Live Scores, Fixtures & Sports Coverage',
  description: 'Get real-time live sports scores, official fixtures, instant match trackers, expert analysis, and legal broadcast guides. Comprehensive coverage of NBA, NFL, MLB, NHL, F1, MMA, Cricket, Boxing, and College Sports.',
  keywords: ['Sportsurge', 'Sportsurge Official', 'live scores', 'sports fixtures', 'sports coverage', 'match tracker', 'NBA', 'NFL', 'MLB', 'NHL', 'F1', 'MMA', 'Cricket', 'Boxing', 'NCAAF', 'NCAAB'],
  openGraph: {
    title: 'Sportsurge Official – Fast Live Scores, Fixtures & Sports Coverage',
    description: 'Get real-time live sports scores, official fixtures, instant match trackers, expert analysis, and legal broadcast guides.',
    type: 'website',
    siteName: 'Sportsurge Official',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sportsurge Official – Fast Live Scores, Fixtures & Sports Coverage',
    description: 'Get real-time live sports scores, official fixtures, instant match trackers, expert analysis, and legal broadcast guides.',
  },
  other: {
    'robots': 'max-image-preview:large',
  },
};

const SPORT_DESCRIPTIONS: Record<string, string> = {
  nba: 'Basketball highlights, scores & standings',
  nfl: 'Football game coverage & analysis',
  mlb: 'Baseball scores, stats & recaps',
  nhl: 'Hockey live scores & highlights',
  ncaaf: 'College football scores & rankings',
  ncaab: 'College basketball tournament coverage',
  f1: 'Formula 1 races, qualifying & results',
  mma: 'UFC & MMA fight coverage',
  boxing: 'Boxing matches & fighter profiles',
  cricket: 'International cricket scores & news',
};

const TOP_PREDICTORS = [
  { rank: 1, name: 'SportsOracle', accuracy: 87, predictions: 142 },
  { rank: 2, name: 'GridIronGuru', accuracy: 84, predictions: 198 },
  { rank: 3, name: 'HoopsMaster', accuracy: 81, predictions: 156 },
  { rank: 4, name: 'PuckPredictor', accuracy: 79, predictions: 123 },
  { rank: 5, name: 'TouchdownTom', accuracy: 76, predictions: 167 },
];

export default async function HomePage() {
  const [matches, articles, standings, sports, finishedMatches] = await Promise.all([
    db.match.findMany({
      where: { status: { in: ['live', 'upcoming'] } },
      include: { homeTeam: true, awayTeam: true, sport: true },
      orderBy: { matchDate: 'asc' },
      take: 20,
    }),
    db.article.findMany({
      where: { isPublished: true },
      include: { author: true, sport: true },
      orderBy: { publishedAt: 'desc' },
      take: 12,
    }),
    db.standing.findMany({
      include: { team: true, sport: true },
      orderBy: [{ position: 'asc' }],
      take: 30,
    }),
    db.sport.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
    db.match.findMany({
      where: { status: 'finished' },
      include: { homeTeam: true, awayTeam: true, sport: true },
      orderBy: { matchDate: 'desc' },
      take: 8,
    }),
  ]);

  const liveMatches = matches.filter(m => m.status === 'live');
  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const featuredArticle = articles[0];
  const trendingArticles = articles.slice(1, 7);

  const allMatchesWithVotes = [...liveMatches, ...upcomingMatches, ...finishedMatches];
  const mostDiscussed = allMatchesWithVotes.reduce(
    (max, m) => (m.homeVotes + m.awayVotes > (max?.homeVotes ?? 0) + (max?.awayVotes ?? 0) ? m : max),
    allMatchesWithVotes[0]
  );

  const standingsBySport: Record<string, typeof standings> = {};
  standings.forEach(s => {
    const sportSlug = s.sport.slug;
    if (!standingsBySport[sportSlug]) standingsBySport[sportSlug] = [];
    standingsBySport[sportSlug].push(s);
  });

  const upcomingBySport: Record<string, typeof upcomingMatches> = {};
  upcomingMatches.forEach(m => {
    const sportSlug = m.sport.slug;
    if (!upcomingBySport[sportSlug]) upcomingBySport[sportSlug] = [];
    upcomingBySport[sportSlug].push(m);
  });

  const finishedBySport: Record<string, typeof finishedMatches> = {};
  finishedMatches.forEach(m => {
    const sportSlug = m.sport.slug;
    if (!finishedBySport[sportSlug]) finishedBySport[sportSlug] = [];
    finishedBySport[sportSlug].push(m);
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Sportsurge Official',
    url: 'https://sportsurge.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://sportsurge.com/logo.png',
    },
    sameAs: [],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Live & Upcoming Matches Ribbon */}
      <LiveMatchRibbon matches={matches} />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
        {/* Top Leaderboard Ad */}
        <section>
          <AdPlacement type="horizontal" slotId="top-leaderboard-ad" />
        </section>

        {/* Featured Article */}
        {featuredArticle && (
          <section>
            <ArticleHero article={featuredArticle} />
          </section>
        )}

        {/* Main Content + Right Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Main Content Column */}
          <div className="lg:col-span-3 space-y-10">


            {/* Upcoming Matches Table */}
            {upcomingMatches.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold" style={{ color: '#222226', letterSpacing: '-0.02em' }}>Upcoming Matches</h2>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                    {upcomingMatches.length} Games Scheduled
                  </span>
                </div>

                <div className="bg-white rounded-3xl overflow-hidden border border-[rgba(229,233,239,0.8)] shadow-sm" style={{ boxShadow: 'rgba(34,34,38,0.08) 0px 2px 8px' }}>
                  {/* Mobile View: Stacked Cards (Hidden on Desktop) */}
                  <div className="block md:hidden divide-y divide-[rgba(229,233,239,0.5)]">
                    {upcomingMatches.slice(0, 10).map((match) => (
                      <div key={match.id} className="p-4.5 space-y-3.5 hover:bg-[rgba(229,233,239,0.3)] transition-colors">
                        {/* Top row: Category & Time */}
                        <div className="flex items-center justify-between text-xs">
                          <Link href={`/${match.sport.slug}`} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs">
                            <SportIcon slug={match.sport.slug} size="sm" />
                            {match.sport.name}
                          </Link>
                          <div className="text-right">
                            <span className="font-bold text-sm block" style={{ color: '#222226' }}>{formatTime(match.matchDate)}</span>
                            <span className="text-[11px] font-medium" style={{ color: 'rgba(34,34,38,0.6)' }}>{formatDate(match.matchDate)}</span>
                          </div>
                        </div>

                        {/* Middle row: Teams */}
                        <Link href={`/${match.sport.slug}/match/${match.slug}`} className="block space-y-2.5 py-1 group">
                          {/* Home Team */}
                          <div className="flex items-center justify-between gap-3 bg-[rgba(229,233,239,0.2)] p-2.5 rounded-xl border border-[rgba(229,233,239,0.5)] group-hover:border-indigo-200 transition-colors">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {match.homeTeam.logo ? (
                                <img src={match.homeTeam.logo?.includes('/api/logo') ? `${match.homeTeam.logo}&w=48` : match.homeTeam.logo} alt="" className="w-7 h-7 rounded object-contain flex-shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: match.homeTeam.color || '#666' }}>
                                  {match.homeTeam.abbreviation.substring(0, 3)}
                                </div>
                              )}
                              <span className="font-bold text-sm truncate group-hover:text-indigo-600 transition-colors" style={{ color: '#222226' }}>
                                {match.homeTeam.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-200/70 text-slate-600 tracking-wider flex-shrink-0">Home</span>
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center justify-between gap-3 bg-[rgba(229,233,239,0.2)] p-2.5 rounded-xl border border-[rgba(229,233,239,0.5)] group-hover:border-indigo-200 transition-colors">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {match.awayTeam.logo ? (
                                <img src={match.awayTeam.logo?.includes('/api/logo') ? `${match.awayTeam.logo}&w=48` : match.awayTeam.logo} alt="" className="w-7 h-7 rounded object-contain flex-shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: match.awayTeam.color || '#666' }}>
                                  {match.awayTeam.abbreviation.substring(0, 3)}
                                </div>
                              )}
                              <span className="font-bold text-sm truncate group-hover:text-indigo-600 transition-colors" style={{ color: '#222226' }}>
                                {match.awayTeam.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-200/70 text-slate-600 tracking-wider flex-shrink-0">Away</span>
                          </div>
                        </Link>

                        {/* Bottom row: Watch Button */}
                        <div className="pt-1">
                          <Link
                            href={`/${match.sport.slug}/match/${match.slug}`}
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-50 hover:to-indigo-600 shadow-sm transition-all"
                          >
                            Watch Match Preview →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View: Table (Hidden on Mobile) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#EDF1F6] border-b border-[rgba(229,233,239,0.8)]">
                          <th className="text-left py-3.5 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(34,34,38,0.6)' }}>TEAMS</th>
                          <th className="text-center py-3.5 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(34,34,38,0.6)' }}>CATEGORY</th>
                          <th className="text-center py-3.5 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(34,34,38,0.6)' }}>TIME</th>
                          <th className="text-right py-3.5 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(34,34,38,0.6)' }}>WATCH</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(229,233,239,0.5)]">
                        {upcomingMatches.slice(0, 10).map((match) => (
                          <tr key={match.id} className="hover:bg-[rgba(229,233,239,0.3)] transition-colors group">
                            {/* TEAMS (Left-Aligned Inline: Logo -> Name -> vs -> Logo -> Name) */}
                            <td className="py-3.5 px-4 text-left">
                              <Link href={`/${match.sport.slug}/match/${match.slug}`} className="flex items-center gap-3 group min-w-0">
                                {/* Team A (Home) */}
                                <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                                  {match.homeTeam.logo ? (
                                    <img src={match.homeTeam.logo?.includes('/api/logo') ? `${match.homeTeam.logo}&w=48` : match.homeTeam.logo} alt="" className="w-7 h-7 rounded object-contain flex-shrink-0" />
                                  ) : (
                                    <div className="w-7 h-7 rounded flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ backgroundColor: match.homeTeam.color || '#666' }}>
                                      {match.homeTeam.abbreviation.substring(0, 3)}
                                    </div>
                                  )}
                                  <span className="font-semibold text-sm truncate group-hover:text-indigo-600 transition-colors" style={{ color: '#222226' }}>
                                    {match.homeTeam.name}
                                  </span>
                                </div>

                                {/* VS Badge */}
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#EDF1F6] text-[rgba(34,34,38,0.4)] flex-shrink-0">
                                  vs
                                </span>

                                {/* Team B (Away) */}
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {match.awayTeam.logo ? (
                                    <img src={match.awayTeam.logo?.includes('/api/logo') ? `${match.awayTeam.logo}&w=48` : match.awayTeam.logo} alt="" className="w-7 h-7 rounded object-contain flex-shrink-0" />
                                  ) : (
                                    <div className="w-7 h-7 rounded flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ backgroundColor: match.awayTeam.color || '#666' }}>
                                      {match.awayTeam.abbreviation.substring(0, 3)}
                                    </div>
                                  )}
                                  <span className="font-semibold text-sm truncate group-hover:text-indigo-600 transition-colors" style={{ color: '#222226' }}>
                                    {match.awayTeam.name}
                                  </span>
                                </div>
                              </Link>
                            </td>

                            {/* CATEGORY */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <Link href={`/${match.sport.slug}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-100">
                                <SportIcon slug={match.sport.slug} size="sm" />
                                {match.sport.name}
                              </Link>
                            </td>

                            {/* TIME */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <div className="text-xs font-semibold" style={{ color: '#222226' }}>
                                {formatTime(match.matchDate)}
                              </div>
                              <div className="text-[10px]" style={{ color: 'rgba(34,34,38,0.5)' }}>
                                {formatDate(match.matchDate)}
                              </div>
                            </td>

                            {/* WATCH */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <Link
                                href={`/${match.sport.slug}/match/${match.slug}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-50 hover:to-indigo-600 shadow-sm hover:shadow transition-all hover:scale-105"
                              >
                                Watch →
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* Latest Results Section (Premium Results Grid) */}
            {finishedMatches.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold" style={{ color: '#222226', letterSpacing: '-0.02em' }}>Latest Results</h2>
                  <Link href="/nba/schedule" className="text-sm font-semibold hover:underline" style={{ color: '#374DF5' }}>
                    All Results →
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {finishedMatches.slice(0, 6).map((match) => {
                    const homeWon = (match.homeScore ?? 0) > (match.awayScore ?? 0);
                    const awayWon = (match.awayScore ?? 0) > (match.homeScore ?? 0);

                    return (
                      <Link 
                        key={match.id} 
                        href={`/${match.sport.slug}/match/${match.slug}`}
                        className="bg-white rounded-2xl p-4.5 border border-[rgba(229,233,239,0.8)] hover:border-indigo-400 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                      >
                        {/* Card Top: Sport Pill & FT Badge */}
                        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <SportIcon slug={match.sport.slug} size="sm" />
                            <span>{match.sport.name}</span>
                          </div>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-600 tracking-wider uppercase">
                            FINISHED
                          </span>
                        </div>

                        {/* Card Middle: Teams & Scores */}
                        <div className="space-y-3 my-1">
                          {/* Home Team Row */}
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {match.homeTeam.logo ? (
                                <img src={match.homeTeam.logo?.includes('/api/logo') ? `${match.homeTeam.logo}&w=48` : match.homeTeam.logo} alt="" className="w-7 h-7 rounded object-contain flex-shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ backgroundColor: match.homeTeam.color || '#666' }}>
                                  {match.homeTeam.abbreviation.substring(0, 3)}
                                </div>
                              )}
                              <span className={`text-sm truncate transition-colors ${homeWon ? 'font-bold text-slate-900 group-hover:text-indigo-600' : 'font-medium text-slate-600'}`}>
                                {match.homeTeam.name}
                              </span>
                            </div>
                            <span className={`text-base font-extrabold flex-shrink-0 ${homeWon ? 'text-indigo-600' : 'text-slate-400 font-semibold'}`}>
                              {match.homeScore ?? '-'}
                            </span>
                          </div>

                          {/* Away Team Row */}
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {match.awayTeam.logo ? (
                                <img src={match.awayTeam.logo?.includes('/api/logo') ? `${match.awayTeam.logo}&w=48` : match.awayTeam.logo} alt="" className="w-7 h-7 rounded object-contain flex-shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ backgroundColor: match.awayTeam.color || '#666' }}>
                                  {match.awayTeam.abbreviation.substring(0, 3)}
                                </div>
                              )}
                              <span className={`text-sm truncate transition-colors ${awayWon ? 'font-bold text-slate-900 group-hover:text-indigo-600' : 'font-medium text-slate-600'}`}>
                                {match.awayTeam.name}
                              </span>
                            </div>
                            <span className={`text-base font-extrabold flex-shrink-0 ${awayWon ? 'text-indigo-600' : 'text-slate-400 font-semibold'}`}>
                              {match.awayScore ?? '-'}
                            </span>
                          </div>
                        </div>

                        {/* Card Bottom: Date & Link */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[11px]">
                          <span className="text-slate-400 font-medium">
                            {formatDate(match.matchDate)}
                          </span>
                          <span className="font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform inline-block">
                            Recap →
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Middle Bumper Ad */}
            <section>
              <AdPlacement type="horizontal" slotId="middle-bumper-ad" />
            </section>

            {/* Most Discussed Match + Top Predictors Row */}
            <section>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Most Discussed Match */}
                {mostDiscussed && (mostDiscussed.homeVotes + mostDiscussed.awayVotes) > 0 && (
                  <div className="lg:col-span-2">
                    <h2 className="text-xl mb-4 flex items-center gap-2" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>
                      Most Discussed
                      <LiveRefreshIndicator />
                    </h2>
                    <Link href={`/${mostDiscussed.sport.slug}/match/${mostDiscussed.slug}`}>
                      <div className="bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow group cursor-pointer" style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}>
                        <div className="flex items-center gap-2 mb-4">
                          <SportIcon slug={mostDiscussed.sport.slug} size="sm" />
                          <span className="text-sm font-semibold" style={{ color: '#2C3EC4' }}>{mostDiscussed.sport.name}</span>
                          <span className="text-white text-[10px] px-2 py-0.5 rounded-full font-semibold ml-2" style={{ backgroundColor: '#374DF5' }}>
                            {mostDiscussed.homeVotes + mostDiscussed.awayVotes} votes
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                          <div className="flex-1 text-center">
                            <div className="flex items-center justify-center gap-3 mb-2">
                              {mostDiscussed.homeTeam.logo ? (
                                <img src={mostDiscussed.homeTeam.logo} alt={mostDiscussed.homeTeam.name} className="w-12 h-12 rounded-full" />
                              ) : (
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: mostDiscussed.homeTeam.color || '#666' }}>
                                  {mostDiscussed.homeTeam.abbreviation.substring(0, 3)}
                                </div>
                              )}
                              <span className="text-3xl" style={{ fontWeight: 700, color: '#222226' }}>{mostDiscussed.homeScore ?? '-'}</span>
                            </div>
                            <p className="text-sm font-semibold group-hover:text-[#374DF5] transition-colors" style={{ color: '#222226' }}>{mostDiscussed.homeTeam.name}</p>
                          </div>
                          <div className="font-bold text-lg" style={{ color: 'rgba(34,34,38,0.2)' }}>VS</div>
                          <div className="flex-1 text-center">
                            <div className="flex items-center justify-center gap-3 mb-2">
                              <span className="text-3xl" style={{ fontWeight: 700, color: '#222226' }}>{mostDiscussed.awayScore ?? '-'}</span>
                              {mostDiscussed.awayTeam.logo ? (
                                <img src={mostDiscussed.awayTeam.logo} alt={mostDiscussed.awayTeam.name} className="w-12 h-12 rounded-full" />
                              ) : (
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: mostDiscussed.awayTeam.color || '#666' }}>
                                  {mostDiscussed.awayTeam.abbreviation.substring(0, 3)}
                                </div>
                              )}
                            </div>
                            <p className="text-sm font-semibold group-hover:text-[#374DF5] transition-colors" style={{ color: '#222226' }}>{mostDiscussed.awayTeam.name}</p>
                          </div>
                        </div>
                        <p className="text-xs mt-3 text-center" style={{ color: 'rgba(34,34,38,0.5)' }}>{formatDate(mostDiscussed.matchDate)}</p>
                      </div>
                    </Link>
                  </div>
                )}

                {/* Top Predictors */}
                <div>
                  <h2 className="text-xl mb-4" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>Top Predictors</h2>
                  <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}>
                    {TOP_PREDICTORS.map((predictor, idx) => (
                      <div key={predictor.rank} className="flex items-center gap-3 px-4 py-3" style={idx < TOP_PREDICTORS.length - 1 ? { borderBottom: '1px solid rgba(229,233,239,0.5)' } : {}}>
                        <span className="text-lg w-7 text-center font-bold" style={{ color: idx < 3 ? '#374DF5' : 'rgba(34,34,38,0.4)' }}>
                          {predictor.rank}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#222226' }}>{predictor.name}</p>
                          <p className="text-xs" style={{ color: 'rgba(34,34,38,0.5)' }}>{predictor.predictions} predictions</p>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#374DF5' }}>{predictor.accuracy}%</span>
                      </div>
                    ))}
                    <div className="px-4 py-2 text-center" style={{ backgroundColor: 'rgba(229,233,239,0.3)' }}>
                      <span className="text-xs" style={{ color: 'rgba(34,34,38,0.5)' }}>Full leaderboard coming soon</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Featured Highlights */}
            <section>
              <FeaturedHighlights />
            </section>

            {/* Trending Articles */}
            {trendingArticles.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>Trending Articles</h2>
                  <Link href="/nba/news" className="text-sm font-medium hover:underline" style={{ color: '#374DF5' }}>
                    More News →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trendingArticles.slice(0, 6).map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}

            {/* Lower Banner Ad */}
            <section>
              <AdPlacement type="horizontal" slotId="lower-banner-ad" />
            </section>

            {/* Standings Quick View */}
            {Object.keys(standingsBySport).length > 0 && (
              <section>
                <h2 className="text-xl mb-4" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>Standings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(standingsBySport).map(([sportSlug, sportStandings]) => {
                    const sport = sportStandings[0]?.sport;
                    if (!sport) return null;
                    return (
                      <div key={sportSlug} className="bg-white rounded-2xl p-4" style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <SportIcon slug={sportSlug} size="sm" />
                            <h3 className="font-semibold" style={{ color: '#222226' }}>{sport.name}</h3>
                          </div>
                          <Link href={`/${sportSlug}/standings`} className="text-xs font-medium hover:underline" style={{ color: '#374DF5' }}>
                            Full Standings →
                          </Link>
                        </div>
                        <StandingsTable standings={sportStandings} sportSlug={sportSlug} limit={5} />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Explore Sports */}
            <section>
              <h2 className="text-xl mb-4" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>Explore Sports</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {sports.map((sport) => (
                  <Link
                    key={sport.slug}
                    href={`/${sport.slug}`}
                    className="bg-white rounded-2xl p-6 text-center hover:border-[#374DF5] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                    style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}
                  >
                    <span className="flex justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                      <SportIcon slug={sport.slug} size="lg" />
                    </span>
                    <span className="text-base font-bold group-hover:text-[#374DF5] transition-colors block mb-1" style={{ color: '#222226', letterSpacing: '-0.02em' }}>
                      {sport.name}
                    </span>
                    <span className="text-xs leading-snug block group-hover:text-[#374DF5] transition-colors" style={{ color: 'rgba(34,34,38,0.5)' }}>
                      {SPORT_DESCRIPTIONS[sport.slug] || 'Scores, schedules & news'}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {/* SEO Content */}
            <section>
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}>
                <h3 className="text-sm uppercase tracking-wider mb-3" style={{ fontWeight: 700, color: 'rgba(34,34,38,0.5)' }}>
                  About Sportsurge Official
                </h3>
                <div className="text-sm leading-relaxed space-y-3" style={{ color: 'rgba(34,34,38,0.6)' }}>
                  <p>
                    Sportsurge Official is the ultimate destination for sports fans seeking comprehensive coverage of their favorite leagues and teams.
                    From the hardcourt of the NBA to the gridiron of the NFL, from the diamond of MLB to the ice of the NHL,
                    Sportsurge Official delivers live scores, real-time updates, and in-depth analysis for every major sport.
                    Our platform covers basketball, football, baseball, hockey, college sports, Formula 1, MMA, boxing, and cricket,
                    ensuring that no matter what sport you follow, you will find the coverage you need.
                  </p>
                  <p>
                    Stay ahead of the game with Sportsurge Official&apos;s live score tracking, detailed match schedules, interactive voting polls, and expert commentary.
                    Our team of dedicated analysts provides breaking news, statistical breakdowns, and post-game recaps that go beyond the box score.
                    Whether you are tracking your fantasy roster, looking for legal streaming options, or simply want to stay updated on the latest results,
                    Sportsurge Official has everything a sports fan needs in one convenient platform.
                  </p>
                  <p>
                    With features like live match ribbons, real-time standings, video highlights, and community voting,
                    Sportsurge Official brings fans closer to the action than ever before. Join millions of sports enthusiasts who trust Sportsurge Official
                    for accurate scores, comprehensive schedules, and reliable streaming guides throughout every season.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Sidebar Column */}
          <div className="lg:col-span-1 space-y-8 sticky top-6">
            {/* Sidebar Ad 1 */}
            <AdPlacement type="sidebar" slotId="sidebar-top-ad" />

            {/* HoopGrids Challenge Widget */}
            <div className="bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] rounded-3xl p-6 text-white shadow-lg border border-indigo-500/30 text-center relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
              <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block shadow-sm">
                Free Access
              </span>
              <h3 className="text-lg font-bold mb-2 text-white" style={{ color: '#ffffff' }}>HoopGrids Challenge</h3>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                Connect players, teams, and stats in the most addictive basketball puzzle experience online.
              </p>
              <a
                href="https://hoopgrids.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow transition-all duration-200 hover:scale-[1.02]"
              >
                Try Now →
              </a>
            </div>

            {/* Sidebar Ad 2 */}
            <AdPlacement type="sidebar" slotId="sidebar-bottom-ad" />
          </div>
        </div>
      </div>

      {/* Dev Fetch Button */}
      <DevFetchButton />
    </>
  );
}
