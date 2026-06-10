import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import StandingsTable from '@/components/StandingsTable';
import Link from 'next/link';
import SportIcon from '@/components/SportIcon';
import AdPlacement from '@/components/AdPlacement';

interface StandingsPageProps {
  params: Promise<{ sport: string }>;
}

export const revalidate = 1800; // Cache for 30 minutes

export async function generateStaticParams() {
  const sports = await db.sport.findMany({ select: { slug: true } });
  return sports.map((sport) => ({ sport: sport.slug }));
}

export async function generateMetadata({ params }: StandingsPageProps) {
  const { sport: sportSlug } = await params;
  const sport = await db.sport.findUnique({ where: { slug: sportSlug } });
  if (!sport) return { title: 'Standings - Sportsurge Official' };

  return {
    title: `${sport.name} Standings - Sportsurge Official`,
    description: `Official ${sport.name} standings, team records, win-loss percentages, and streaks. Updated live on Sportsurge Official.`,
  };
}

export default async function StandingsPage({ params }: StandingsPageProps) {
  const { sport: sportSlug } = await params;
  const sport = await db.sport.findUnique({ where: { slug: sportSlug } });
  if (!sport) notFound();

  const standings = await db.standing.findMany({
    where: { sportId: sport.id },
    include: { team: true, sport: true },
    orderBy: { position: 'asc' },
  });

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b" style={{ borderColor: 'rgba(229,233,239,0.8)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <nav className="flex items-center gap-2 text-sm mb-3" style={{ color: 'rgba(34,34,38,0.5)' }}>
            <Link href="/" className="hover:text-[#374DF5] transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/${sport.slug}`} className="hover:text-[#374DF5] transition-colors">{sport.name}</Link>
            <span>/</span>
            <span style={{ color: '#222226' }}>Standings</span>
          </nav>
          <h1 className="text-3xl flex items-center gap-3" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>
            <SportIcon slug={sport.slug} size="md" />
            {sport.name} Standings
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header Ad */}
        <AdPlacement type="horizontal" slotId="1991768591" />

        {standings.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">🏆</span>
            <h3 className="text-lg font-semibold" style={{ color: '#222226' }}>No Standings Available</h3>
            <p style={{ color: 'rgba(34,34,38,0.5)' }} className="mt-1">Standings will be updated during the season</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}>
            <StandingsTable standings={standings} sportSlug={sportSlug} limit={undefined} />
          </div>
        )}

        {/* Bottom Ad */}
        <AdPlacement type="horizontal" slotId="4074188210" />
      </div>
    </div>
  );
}
