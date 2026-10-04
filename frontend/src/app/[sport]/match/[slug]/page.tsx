import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import VoteCard from '@/components/VoteCard';
import WhereToWatch from '@/components/WhereToWatch';
import CountdownTimer from '@/components/CountdownTimer';
import ArticleCard from '@/components/ArticleCard';
import MatchCard from '@/components/MatchCard';
import VideoHighlights from '@/components/VideoHighlights';
import MatchCenterTabs from '@/components/MatchCenterTabs';
import { formatDateTime, getStatusBadgeColor, getStatusLabel } from '@/lib/utils';
import Link from 'next/link';
import SportIcon from '@/components/SportIcon';
import AdPlacement from '@/components/AdPlacement';

interface MatchPageProps {
  params: Promise<{ sport: string; slug: string }>;
}

export const revalidate = 600; // Cache for 10 minutes

export async function generateStaticParams() {
  const matches = await db.match.findMany({
    select: { slug: true, sport: { select: { slug: true } } },
  });
  return matches.map((match) => ({
    sport: match.sport.slug,
    slug: match.slug,
  }));
}

export async function generateMetadata({ params }: MatchPageProps) {
  const { sport: sportSlug, slug } = await params;
  const match = await db.match.findFirst({
    where: { slug },
    include: { homeTeam: true, awayTeam: true, sport: true },
  });

  if (!match) return { title: 'Match Not Found - Sportsurge Official' };

  const statusText = match.status === 'live' ? 'Live score updates' : match.status === 'upcoming' ? `Starts ${formatDateTime(match.matchDate)}` : 'Match results and recap';
  const description = `${match.homeTeam.name} vs ${match.awayTeam.name} - ${match.sport.name}. ${statusText}. Watch highlights, vote on the outcome, and find where to watch legally.`;

  return {
    title: `${match.homeTeam.name} vs ${match.awayTeam.name} - Sportsurge Official`,
    description: description.substring(0, 160),
    openGraph: {
      title: `${match.homeTeam.name} vs ${match.awayTeam.name} - ${match.sport.name}`,
      description: description.substring(0, 160),
      type: 'article',
      images: match.homeTeam.logo ? [match.homeTeam.logo] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${match.homeTeam.name} vs ${match.awayTeam.name} - ${match.sport.name}`,
      description: description.substring(0, 160),
    },
    other: {
      'robots': 'max-image-preview:large',
    },
  };
}

function generateMatchSEO(
  homeTeam: { name: string; city?: string | null },
  awayTeam: { name: string; city?: string | null },
  sport: { name: string },
  venue: string | null,
  matchDate: Date,
  status: string,
  homeScore: number | null,
  awayScore: number | null
): string {
  const dateStr = matchDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const homeCity = homeTeam.city || homeTeam.name.split(' ')[0];
  const awayCity = awayTeam.city || awayTeam.name.split(' ')[0];

  let seo = `The ${sport.name} matchup between the ${homeTeam.name} and the ${awayTeam.name} is one that fans circle on their calendars every season. `;
  seo += `This game, played${venue ? ` at ${venue}` : ` in ${homeCity}`} on ${dateStr}, brings together two franchises with rich histories and passionate fanbases. `;
  seo += `The rivalry between these ${homeCity} and ${awayCity} teams has produced some of the most memorable moments in ${sport.name} history, with each encounter adding a new chapter to an already storied competition.\n\n`;

  if (status === 'finished' && homeScore !== null && awayScore !== null) {
    const winner = homeScore > awayScore ? homeTeam.name : awayTeam.name;
    const loser = homeScore > awayScore ? awayTeam.name : homeTeam.name;
    seo += `In this particular contest, the ${winner} emerged victorious with a final score of ${Math.max(homeScore, awayScore)}-${Math.min(homeScore, awayScore)} over the ${loser}. `;
    seo += `The result has significant implications for the standings and playoff positioning, as every game counts in the race for postseason berth. `;
    seo += `Both teams showed the kind of intensity and determination that defines this rivalry, making it a must-watch for any ${sport.name} enthusiast.\n\n`;
  } else if (status === 'live') {
    seo += `This game is currently in progress and the action has been nothing short of thrilling. Both teams are leaving everything on the field in a contest that could go either way. `;
    seo += `Follow along for live score updates and key moments as they happen.\n\n`;
  } else {
    seo += `As these two teams prepare to face off, anticipation is building among fans and analysts alike. `;
    seo += `Both squads have been performing well this season, and this matchup could have major implications for the playoff picture. `;
    seo += `Be sure to tune in and catch all the action as it unfolds.\n\n`;
  }

  seo += `SportSurge provides comprehensive coverage of every ${sport.name} game, including live scores, post-game analysis, highlight reels, and legal streaming options. `;
  seo += `Whether you are looking for in-depth statistics, expert commentary, or just want to stay updated on the latest scores, SportSurge has you covered for all ${sport.name} action throughout the season.`;

  return seo;
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { sport: sportSlug, slug } = await params;
  const match = await db.match.findFirst({
    where: { slug },
    include: { homeTeam: true, awayTeam: true, sport: true },
  });

  if (!match) notFound();

  const [relatedArticles, relatedMatches] = await Promise.all([
    db.article.findMany({
      where: {
        sportId: match.sportId,
        isPublished: true,
        id: { not: match.id },
      },
      include: { author: true, sport: true },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    }),
    db.match.findMany({
      where: {
        sportId: match.sportId,
        status: { in: ['live', 'upcoming'] },
        id: { not: match.id },
      },
      include: { homeTeam: true, awayTeam: true, sport: true },
      orderBy: { matchDate: 'asc' },
      take: 4,
    }),
  ]);

  const seoContent = generateMatchSEO(
    match.homeTeam,
    match.awayTeam,
    match.sport,
    match.venue,
    match.matchDate,
    match.status,
    match.homeScore,
    match.awayScore
  );

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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
    startDate: new Date(match.matchDate).toISOString(),
    location: match.venue ? {
      '@type': 'Place',
      name: match.venue,
    } : undefined,
    competitor: [
      {
        '@type': 'SportsTeam',
        name: match.homeTeam.name,
        logo: match.homeTeam.logo,
      },
      {
        '@type': 'SportsTeam',
        name: match.awayTeam.name,
        logo: match.awayTeam.logo,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen">
        {/* Match Header */}
        <div className="bg-white border-b" style={{ borderColor: 'rgba(229,233,239,0.8)' }}>
          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm mb-4" style={{ color: 'rgba(34,34,38,0.5)' }}>
              <Link href="/" className="hover:text-[#374DF5] transition-colors">Home</Link>
              <span>/</span>
              <Link href={`/${match.sport.slug}`} className="hover:text-[#374DF5] transition-colors">{match.sport.name}</Link>
              <span>/</span>
              <span style={{ color: '#222226' }}>Match</span>
            </nav>

            {/* Sport + Status */}
            <div className="flex items-center gap-3 mb-6">
              <SportIcon slug={match.sport.slug} size="md" />
              <span className="font-medium" style={{ color: 'rgba(34,34,38,0.6)' }}>{match.sport.name}</span>
              {match.status === 'live' ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full" style={{ color: '#CB1818', backgroundColor: 'rgba(203,24,24,0.1)' }}>
                  <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#CB1818' }} />
                  LIVE
                </span>
              ) : match.status === 'upcoming' ? (
                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ color: '#374DF5', backgroundColor: 'rgba(55,77,245,0.1)' }}>
                  UPCOMING
                </span>
              ) : (
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadgeColor(match.status)}`}>
                  {getStatusLabel(match.status)}
                </span>
              )}
            </div>

            {/* Match Scoreboard */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 py-4">
              {/* Home Team */}
              <div className="flex flex-col items-center gap-2">
                {match.homeTeam.logo ? (
                  <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-20 h-20 rounded object-contain" />
                ) : (
                  <div
                    className="w-20 h-20 rounded flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: match.homeTeam.color || '#666' }}
                  >
                    {match.homeTeam.abbreviation}
                  </div>
                )}
                <h2 className="text-lg text-center" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>{match.homeTeam.name}</h2>
              </div>

              {/* Score */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-4">
                  <span className="text-4xl md:text-5xl" style={{ fontWeight: 700, color: match.status === 'live' ? '#CB1818' : '#222226' }}>
                    {hScoreObj.main}
                  </span>
                  <span className="text-2xl font-light" style={{ color: 'rgba(34,34,38,0.3)' }}>vs</span>
                  <span className="text-4xl md:text-5xl" style={{ fontWeight: 700, color: match.status === 'live' ? '#CB1818' : '#222226' }}>
                    {aScoreObj.main}
                  </span>
                </div>
                {(hScoreObj.sub || aScoreObj.sub) && (
                  <div className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 mt-1 border border-slate-200 shadow-sm text-center">
                    {hScoreObj.sub} {aScoreObj.sub}
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center gap-2">
                {match.awayTeam.logo ? (
                  <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-20 h-20 rounded object-contain" />
                ) : (
                  <div
                    className="w-20 h-20 rounded flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: match.awayTeam.color || '#666' }}
                  >
                    {match.awayTeam.abbreviation}
                  </div>
                )}
                <h2 className="text-lg text-center" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>{match.awayTeam.name}</h2>
              </div>
            </div>

            {/* Match Info */}
            <div className="text-center text-sm mt-2" style={{ color: 'rgba(34,34,38,0.5)' }}>
              {match.venue && <span>{match.venue} &bull; </span>}
              {formatDateTime(match.matchDate)}
            </div>

            {broadcastData.headline && (
              <div className="text-center text-sm font-bold mt-2" style={{ color: '#CB1818' }}>
                {broadcastData.headline}
              </div>
            )}

            {/* Countdown for upcoming */}
            {match.status === 'upcoming' && (
              <div className="flex justify-center mt-4">
                <CountdownTimer targetDate={match.matchDate} />
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Header Ad */}
          <AdPlacement type="horizontal" slotId="1991768591" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Match Center Tabs */}
              <MatchCenterTabs match={match} />

              {relatedArticles.length > 0 && (
                <div>
                  <h3 className="text-lg mb-3" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>Related Coverage</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {relatedArticles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </div>
              )}

              {/* Middle Bumper Ad */}
              <AdPlacement type="horizontal" slotId="4074188210" />

              {/* SEO Content - About This Match */}
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}>
                <h3 className="text-sm uppercase tracking-wider mb-3" style={{ fontWeight: 700, color: 'rgba(34,34,38,0.5)' }}>
                  About This Match
                </h3>
                <div className="text-sm leading-relaxed space-y-3" style={{ color: 'rgba(34,34,38,0.6)' }}>
                  {seoContent.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Sidebar Ad */}
              <AdPlacement type="sidebar" slotId="2280899939" />

              {relatedMatches.length > 0 && (
                <div className="bg-white rounded-2xl p-4" style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}>
                  <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(34,34,38,0.5)' }}>
                    More {match.sport.name} Matches
                  </h3>
                  <div className="space-y-3">
                    {relatedMatches.map((m) => (
                      <MatchCard key={m.id} match={m} compact />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
