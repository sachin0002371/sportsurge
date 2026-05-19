import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import MatchCard from '@/components/MatchCard';
import ArticleCard from '@/components/ArticleCard';
import StandingsTable from '@/components/StandingsTable';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SportIcon from '@/components/SportIcon';
import AdPlacement from '@/components/AdPlacement';

interface SportPageProps {
  params: Promise<{ sport: string }>;
}

export async function generateStaticParams() {
  const sports = await db.sport.findMany({ select: { slug: true } });
  return sports.map((sport) => ({ sport: sport.slug }));
}

export async function generateMetadata({ params }: SportPageProps) {
  const { sport: sportSlug } = await params;
  const sport = await db.sport.findUnique({ where: { slug: sportSlug } });
  if (!sport) return { title: 'Sportsurge Official' };

  const description = `Get the latest ${sport.name} live scores, match schedules, standings, and news. Complete coverage of ${sport.name} on Sportsurge Official.`;

  return {
    title: `Sportsurge Official - ${sport.name} Live Scores, Schedule & News`,
    description: description.substring(0, 160),
    openGraph: {
      title: `Sportsurge Official - ${sport.name} Live Scores & News`,
      description: description.substring(0, 160),
      type: 'website',
      siteName: 'Sportsurge Official',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Sportsurge Official - ${sport.name}`,
      description: description.substring(0, 160),
    },
    other: {
      'robots': 'max-image-preview:large',
    },
  };
}

export default async function SportPage({ params }: SportPageProps) {
  const { sport: sportSlug } = await params;
  const sport = await db.sport.findUnique({
    where: { slug: sportSlug },
    include: { teams: true },
  });

  if (!sport) notFound();

  const [liveMatches, upcomingMatches, finishedMatches, articles, standings] = await Promise.all([
    db.match.findMany({
      where: { sportId: sport.id, status: 'live' },
      include: { homeTeam: true, awayTeam: true, sport: true },
      orderBy: { matchDate: 'desc' },
    }),
    db.match.findMany({
      where: { sportId: sport.id, status: 'upcoming' },
      include: { homeTeam: true, awayTeam: true, sport: true },
      orderBy: { matchDate: 'asc' },
      take: 10,
    }),
    db.match.findMany({
      where: { sportId: sport.id, status: 'finished' },
      include: { homeTeam: true, awayTeam: true, sport: true },
      orderBy: { matchDate: 'desc' },
      take: 10,
    }),
    db.article.findMany({
      where: { sportId: sport.id, isPublished: true },
      include: { author: true, sport: true },
      orderBy: { publishedAt: 'desc' },
      take: 6,
    }),
    db.standing.findMany({
      where: { sportId: sport.id },
      include: { team: true, sport: true },
      orderBy: { position: 'asc' },
    }),
  ]);

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: `${sport.name} Live Scores, Schedule & News`,
          description: `Get the latest ${sport.name} live scores, match schedules, standings, and news on SportSurge.`,
          isPartOf: {
            '@type': 'WebSite',
            name: 'SportSurge',
            url: 'https://sportsurge.com',
          },
          about: {
            '@type': 'SportsOrganization',
            name: sport.name,
            sport: sport.name,
          },
        }) }}
      />

      {/* Sport Header */}
      <div className="bg-white border-b" style={{ borderColor: 'rgba(229,233,239,0.8)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <SportIcon slug={sport.slug} size="lg" />
            <div>
              <h1 className="text-3xl" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>{sport.name}</h1>
              <p style={{ color: 'rgba(34,34,38,0.6)' }} className="mt-1">
                Live scores, schedules, standings, and news
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header Ad */}
        <AdPlacement type="horizontal" slotId="1991768591" />

        <Tabs defaultValue="live" className="space-y-6">
          <TabsList style={{ backgroundColor: 'rgba(229,233,239,0.5)' }}>
            <TabsTrigger value="live" className="data-[state=active]:bg-[#374DF5] data-[state=active]:text-white">
              <span className="flex items-center gap-1.5">
                {liveMatches.length > 0 && <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#CB1818' }} />}
                Live {liveMatches.length > 0 && `(${liveMatches.length})`}
              </span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-[#374DF5] data-[state=active]:text-white">
              Schedule
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-[#374DF5] data-[state=active]:text-white">
              Results
            </TabsTrigger>
            <TabsTrigger value="standings" className="data-[state=active]:bg-[#374DF5] data-[state=active]:text-white">
              Standings
            </TabsTrigger>
            <TabsTrigger value="news" className="data-[state=active]:bg-[#374DF5] data-[state=active]:text-white">
              News
            </TabsTrigger>
          </TabsList>

          {/* Live Tab */}
          <TabsContent value="live">
            {liveMatches.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3">📺</span>
                <h3 className="text-lg font-semibold" style={{ color: '#222226' }}>No Live Matches Right Now</h3>
                <p style={{ color: 'rgba(34,34,38,0.5)' }} className="mt-1">Check back later for live {sport.name} action</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            {upcomingMatches.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3">📅</span>
                <h3 className="text-lg font-semibold" style={{ color: '#222226' }}>No Upcoming Matches</h3>
                <p style={{ color: 'rgba(34,34,38,0.5)' }} className="mt-1">Schedule will be updated soon</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            {finishedMatches.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3">📊</span>
                <h3 className="text-lg font-semibold" style={{ color: '#222226' }}>No Recent Results</h3>
                <p style={{ color: 'rgba(34,34,38,0.5)' }} className="mt-1">Results will appear here after matches conclude</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {finishedMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Standings Tab */}
          <TabsContent value="standings">
            {standings.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3">🏆</span>
                <h3 className="text-lg font-semibold" style={{ color: '#222226' }}>No Standings Available</h3>
                <p style={{ color: 'rgba(34,34,38,0.5)' }} className="mt-1">Standings will be updated during the season</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-4" style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}>
                <StandingsTable standings={standings} sportSlug={sportSlug} limit={undefined} />
              </div>
            )}
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news">
            {articles.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3">📰</span>
                <h3 className="text-lg font-semibold" style={{ color: '#222226' }}>No Articles Yet</h3>
                <p style={{ color: 'rgba(34,34,38,0.5)' }} className="mt-1">Check back soon for {sport.name} coverage</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
                <div className="text-center">
                  <Link
                    href={`/${sportSlug}/news`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors font-medium text-sm"
                    style={{ backgroundColor: '#374DF5' }}
                  >
                    View All {sport.name} News →
                  </Link>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Middle Bumper Ad */}
        <AdPlacement type="horizontal" slotId="4074188210" />

        {/* SEO Content about the sport */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}>
          <h3 className="text-sm uppercase tracking-wider mb-3" style={{ fontWeight: 700, color: 'rgba(34,34,38,0.5)' }}>
            About {sport.name}
          </h3>
          <div className="text-sm leading-relaxed space-y-3" style={{ color: 'rgba(34,34,38,0.6)' }}>
            <p>
              {sport.name} is one of the most popular professional sports leagues in the world, captivating millions of fans with thrilling competition week in and week out. 
              The league features elite-level athletes competing at the highest standard, with each season bringing new storylines, rivalries, and unforgettable moments. 
              From opening day to the championship finals, {sport.name} delivers non-stop excitement and drama that keeps fans on the edge of their seats.
            </p>
            <p>
              With teams spanning major markets across the country, {sport.name} has built a dedicated fanbase that spans generations. 
              The league continues to grow in popularity, drawing record viewership numbers and expanding its global reach. 
              Whether you follow a single team or watch every game, the depth of talent and parity in {sport.name} ensures that no matchup is ever predictable.
            </p>
            <p>
              Sportsurge Official provides comprehensive {sport.name} coverage including live scores, match schedules, up-to-date standings, expert analysis, and legal streaming guides. 
              Stay connected with every game, every result, and every breaking story throughout the {sport.name} season on Sportsurge Official.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
