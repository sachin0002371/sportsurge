import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import MatchCard from '@/components/MatchCard';
import Link from 'next/link';
import SportIcon from '@/components/SportIcon';
import AdPlacement from '@/components/AdPlacement';

interface SchedulePageProps {
  params: Promise<{ sport: string }>;
}

export const revalidate = 1800; // Cache for 30 minutes

export async function generateStaticParams() {
  try {
    const sports = await db.sport.findMany({ select: { slug: true } });
    return sports.map((sport) => ({ sport: sport.slug }));
  } catch (error) {
    console.warn('generateStaticParams sport schedule error:', error);
    return [];
  }
}

const SPORT_NAMES_MAP: Record<string, string> = {
  nba: 'NBA', nfl: 'NFL', mlb: 'MLB', nhl: 'NHL',
  ncaaf: 'NCAAF', ncaab: 'NCAAB', f1: 'F1', mma: 'MMA',
  boxing: 'Boxing', cricket: 'Cricket',
};

export async function generateMetadata({ params }: SchedulePageProps) {
  const { sport: sportSlug } = await params;
  const name = SPORT_NAMES_MAP[sportSlug.toLowerCase()] || sportSlug.toUpperCase();
  return {
    title: `${name} Schedule - Sportsurge Official`,
    description: `Complete ${name} schedule with upcoming matches, dates, times, and broadcast info. Never miss a game with Sportsurge Official.`,
  };
}

export default async function SchedulePage({ params }: SchedulePageProps) {
  const { sport: sportSlug } = await params;
  let sport: any = null;
  let matches: any[] = [];

  try {
    sport = await db.sport.findUnique({ where: { slug: sportSlug } });
    if (sport) {
      matches = await db.match.findMany({
        where: { sportId: sport.id, status: 'upcoming' },
        include: { homeTeam: true, awayTeam: true, sport: true },
        orderBy: { matchDate: 'asc' },
      });
    }
  } catch (error) {
    console.warn(`[SchedulePage] db error for ${sportSlug}:`, error);
  }

  if (!sport) {
    const knownSports = ['nba', 'nfl', 'mlb', 'nhl', 'ncaaf', 'ncaab', 'f1', 'mma', 'boxing', 'cricket'];
    if (!knownSports.includes(sportSlug.toLowerCase())) {
      notFound();
    }
    const sportNames: Record<string, string> = {
      nba: 'NBA', nfl: 'NFL', mlb: 'MLB', nhl: 'NHL',
      ncaaf: 'NCAAF', ncaab: 'NCAAB', f1: 'F1', mma: 'MMA',
      boxing: 'Boxing', cricket: 'Cricket',
    };
    const name = sportNames[sportSlug] || sportSlug.toUpperCase();
    sport = { id: sportSlug, slug: sportSlug, name };
  }

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b" style={{ borderColor: 'rgba(229,233,239,0.8)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <nav className="flex items-center gap-2 text-sm mb-3" style={{ color: 'rgba(34,34,38,0.5)' }}>
            <Link href="/" className="hover:text-[#374DF5] transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/${sport.slug}`} className="hover:text-[#374DF5] transition-colors">{sport.name}</Link>
            <span>/</span>
            <span style={{ color: '#222226' }}>Schedule</span>
          </nav>
          <h1 className="text-3xl flex items-center gap-3" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>
            <SportIcon slug={sport.slug} size="md" />
            {sport.name} Schedule
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header Ad */}
        <AdPlacement type="horizontal" slotId="1991768591" />

        {matches.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">📅</span>
            <h3 className="text-lg font-semibold" style={{ color: '#222226' }}>No Upcoming Matches</h3>
            <p style={{ color: 'rgba(34,34,38,0.5)' }} className="mt-1">The schedule will be updated soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}

        {/* Bottom Ad */}
        <AdPlacement type="horizontal" slotId="4074188210" />
      </div>
    </div>
  );
}
